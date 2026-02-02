/**
 * Live Crypto Payout System - Production Ready
 * Handles automatic 90% payouts to seller crypto wallets via Cryptomus
 */

import { supabase } from '@/integrations/supabase/clients';

// Cryptomus Payout API Configuration - PRODUCTION READY
const CRYPTOMUS_PAYOUT_API_URL = 'https://api.cryptomus.com/v1/payout';
const CRYPTOMUS_PAYOUT_API_KEY = 'DSk5vMk3RIBhiQ3qGUw1pH1iYJI1hSSN8iTYmHpm3WpyTj9bsTtIlhadpiFKlK5aVUmpjHH8YoLV9dQsxLAPzpQOdiffl2hzJo0378ExFJB3HMSx49LjTfvnm9qHztoP';
const CRYPTOMUS_MERCHANT_UUID = '6e6c1018-48f4-49fd-a10d-36d6cd70eefe';

// Platform Configuration
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee
const SELLER_EARNINGS_PERCENTAGE = 0.90; // 90% to seller
const MINIMUM_PAYOUT_USD = 10; // Minimum $10 for automatic payout

export interface CryptoWallet {
  id: string;
  sellerId: string;
  currency: string;
  network: string;
  address: string;
  isDefault: boolean;
  isVerified: boolean;
  label: string;
}

export interface PayoutRequest {
  sellerId: string;
  orderId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  network: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  transactionHash?: string;
  estimatedArrival?: string;
  error?: string;
}

export class LiveCryptoPayout {
  /**
   * Process automatic payout when order is paid
   */
  static async processAutomaticPayout(orderId: string): Promise<PayoutResult> {
    try {
      console.log(`🚀 Processing automatic crypto payout for order: ${orderId}`);

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!seller_id(*)
        `)
        .eq('id', orderId)
        .eq('status', 'paid')
        .single();

      if (orderError || !order) {
        throw new Error('Order not found or not paid');
      }

      // Get seller's crypto wallet
      const wallet = await this.getSellerDefaultWallet(order.seller_id);
      
      if (!wallet) {
        console.warn(`⚠️ No crypto wallet configured for seller: ${order.seller_id}`);
        await this.addToPendingBalance(order.seller_id, order.seller_earnings, orderId);
        await this.notifySellerToSetupWallet(order.seller_id);
        return { success: false, error: 'No crypto wallet configured' };
      }

      // Check minimum payout amount ($10)
      if (order.seller_earnings < 10) {
        console.log(`💰 Amount ${order.seller_earnings} below minimum $10, adding to pending balance`);
        await this.addToPendingBalance(order.seller_id, order.seller_earnings, orderId);
        return { success: true, payoutId: 'pending' };
      }

      // Execute crypto payout via Cryptomus
      const result = await this.executeCryptoPayout({
        sellerId: order.seller_id,
        orderId: order.id,
        amount: order.seller_earnings,
        currency: wallet.currency,
        walletAddress: wallet.address,
        network: wallet.network
      });

      if (result.success) {
        // Update seller stats
        await this.updateSellerStats(order.seller_id, order.seller_earnings);
        
        // Send success notification
        await this.notifyPayoutSuccess(order.seller_id, result, order.seller_earnings);
        
        console.log(`✅ Crypto payout successful: ${result.payoutId}`);
      } else {
        console.error(`❌ Crypto payout failed: ${result.error}`);
        await this.notifyPayoutFailure(order.seller_id, result.error || 'Unknown error');
      }

      return result;

    } catch (error) {
      console.error('Automatic crypto payout error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Execute crypto payout via Cryptomus API
   */
  static async executeCryptoPayout(request: PayoutRequest): Promise<PayoutResult> {
    try {
      // Create payout record in database
      const { data: payout, error: payoutError } = await supabase
        .from('crypto_payouts')
        .insert({
          seller_id: request.sellerId,
          order_id: request.orderId,
          amount: request.amount,
          currency: request.currency,
          network: request.network,
          wallet_address: request.walletAddress,
          status: 'processing'
        })
        .select()
        .single();

      if (payoutError || !payout) {
        throw new Error('Failed to create payout record');
      }

      // Prepare Cryptomus payout request
      const payoutData = {
        amount: request.amount.toString(),
        currency: request.currency,
        network: request.network,
        address: request.walletAddress,
        order_id: payout.id,
        url_callback: `https://seltech.online/api/webhooks/cryptomus-payout`
      };

      // Generate signature for Cryptomus API
      const signature = await this.generateCryptomusSignature(payoutData);

      // Call Cryptomus Payout API
      const response = await fetch(CRYPTOMUS_PAYOUT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'merchant': CRYPTOMUS_MERCHANT_UUID,
          'sign': signature
        },
        body: JSON.stringify(payoutData)
      });

      const result = await response.json();

      if (result.state === 0 && result.result) {
        // Update payout record with success
        await supabase
          .from('crypto_payouts')
          .update({
            status: 'completed',
            transaction_hash: result.result.txid,
            cryptomus_payout_id: result.result.uuid,
            processed_at: new Date().toISOString()
          })
          .eq('id', payout.id);

        return {
          success: true,
          payoutId: payout.id,
          transactionHash: result.result.txid,
          estimatedArrival: '10-30 minutes'
        };
      } else {
        // Update payout record with failure
        await supabase
          .from('crypto_payouts')
          .update({
            status: 'failed',
            error_message: result.message || 'Cryptomus payout failed'
          })
          .eq('id', payout.id);

        return {
          success: false,
          error: result.message || 'Cryptomus payout failed'
        };
      }

    } catch (error) {
      console.error('Crypto payout execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Crypto payout failed'
      };
    }
  }

  /**
   * Get seller's default crypto wallet
   */
  static async getSellerDefaultWallet(sellerId: string): Promise<CryptoWallet | null> {
    try {
      const { data: wallet, error } = await supabase
        .from('seller_crypto_wallets')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_default', true)
        .eq('is_verified', true)
        .single();

      if (error || !wallet) {
        return null;
      }

      return {
        id: wallet.id,
        sellerId: wallet.seller_id,
        currency: wallet.currency,
        network: wallet.network,
        address: wallet.address,
        isDefault: wallet.is_default,
        isVerified: wallet.is_verified,
        label: wallet.label
      };
    } catch (error) {
      console.error('Error getting seller wallet:', error);
      return null;
    }
  }

  /**
   * Add earnings to pending balance
   */
  static async addToPendingBalance(sellerId: string, amount: number, orderId: string): Promise<void> {
    try {
      // Get current pending balance
      const { data: balance } = await supabase
        .from('seller_pending_balances')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (balance) {
        // Update existing balance
        await supabase
          .from('seller_pending_balances')
          .update({
            amount: balance.amount + amount,
            updated_at: new Date().toISOString()
          })
          .eq('seller_id', sellerId);
      } else {
        // Create new balance record
        await supabase
          .from('seller_pending_balances')
          .insert({
            seller_id: sellerId,
            amount: amount
          });
      }

      // Record the pending transaction
      await supabase
        .from('pending_payout_transactions')
        .insert({
          seller_id: sellerId,
          order_id: orderId,
          amount: amount,
          status: 'pending'
        });

      console.log(`💰 Added ${amount} to pending balance for seller: ${sellerId}`);
    } catch (error) {
      console.error('Error adding to pending balance:', error);
    }
  }

  /**
   * Update seller statistics
   */
  static async updateSellerStats(sellerId: string, amount: number): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_earnings, total_sales')
        .eq('user_id', sellerId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_earnings: (profile.total_earnings || 0) + amount,
            total_sales: (profile.total_sales || 0) + 1
          })
          .eq('user_id', sellerId);
      }
    } catch (error) {
      console.error('Error updating seller stats:', error);
    }
  }

  /**
   * Send payout success notification
   */
  static async notifyPayoutSuccess(sellerId: string, result: PayoutResult, amount: number): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'crypto_payout_success',
          title: 'Crypto Payout Sent! 💰',
          message: `Your payout of $${amount} has been sent to your crypto wallet. Transaction hash: ${result.transactionHash}. Estimated arrival: ${result.estimatedArrival}`,
          data: {
            amount,
            transactionHash: result.transactionHash,
            estimatedArrival: result.estimatedArrival,
            payoutId: result.payoutId
          }
        });

      console.log(`📧 Crypto payout success notification sent to seller: ${sellerId}`);
    } catch (error) {
      console.error('Error sending payout notification:', error);
    }
  }

  /**
   * Send payout failure notification
   */
  static async notifyPayoutFailure(sellerId: string, errorMessage: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'crypto_payout_failed',
          title: 'Crypto Payout Failed ⚠️',
          message: `Your crypto payout could not be processed: ${errorMessage}. Please check your wallet configuration.`,
          data: { error: errorMessage }
        });

      console.log(`📧 Crypto payout failure notification sent to seller: ${sellerId}`);
    } catch (error) {
      console.error('Error sending failure notification:', error);
    }
  }

  /**
   * Notify seller to setup crypto wallet
   */
  static async notifySellerToSetupWallet(sellerId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'setup_crypto_wallet',
          title: 'Setup Crypto Wallet 💳',
          message: 'You have pending earnings! Please setup your crypto wallet to receive automatic payouts.',
          data: { action: 'setup_wallet' }
        });

      console.log(`📧 Wallet setup notification sent to seller: ${sellerId}`);
    } catch (error) {
      console.error('Error sending wallet setup notification:', error);
    }
  }

  /**
   * Generate Cryptomus API signature
   */
  static async generateCryptomusSignature(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const message = jsonString + CRYPTOMUS_PAYOUT_API_KEY;
    
    // Generate MD5 hash
    const encoder = new TextEncoder();
    const msgBuffer = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get supported crypto currencies
   */
  static getSupportedCurrencies() {
    return [
      {
        currency: 'USDT',
        network: 'TRC20',
        name: 'USDT (TRC20)',
        minAmount: 10,
        fees: '~$1-3',
        processingTime: '10-30 minutes',
        recommended: true
      },
      {
        currency: 'USDC',
        network: 'ERC20',
        name: 'USDC (ERC20)',
        minAmount: 20,
        fees: '~$5-15',
        processingTime: '10-30 minutes',
        recommended: false
      },
      {
        currency: 'BTC',
        network: 'BTC',
        name: 'Bitcoin (BTC)',
        minAmount: 25,
        fees: '~$3-10',
        processingTime: '30-60 minutes',
        recommended: false
      },
      {
        currency: 'ETH',
        network: 'ERC20',
        name: 'Ethereum (ETH)',
        minAmount: 30,
        fees: '~$5-20',
        processingTime: '10-30 minutes',
        recommended: false
      }
    ];
  }

  /**
   * Validate crypto wallet address
   */
  static validateWalletAddress(address: string, currency: string, network: string): boolean {
    // Basic validation patterns
    const patterns = {
      'USDT_TRC20': /^T[A-Za-z1-9]{33}$/,
      'USDC_ERC20': /^0x[a-fA-F0-9]{40}$/,
      'BTC_BTC': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      'ETH_ERC20': /^0x[a-fA-F0-9]{40}$/
    };

    const key = `${currency}_${network}`;
    const pattern = patterns[key as keyof typeof patterns];
    
    return pattern ? pattern.test(address) : false;
  }
}