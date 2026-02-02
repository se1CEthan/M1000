// =============================================
// DISPUTE RESOLUTION SERVICE
// Complete service layer for dispute management
// =============================================

import { supabase } from '@/integrations/supabase/clients';
import type { Dispute } from '@/types/freelancing';

export interface CreateDisputeForm {
  contract_id: string;
  reason: string;
  description: string;
  amount_disputed?: number;
  evidence?: File[];
}

export interface DisputeResponse {
  dispute_id: string;
  message: string;
  evidence?: File[];
}

export class DisputeService {
  static async create(data: CreateDisputeForm): Promise<Dispute> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert([{
        contract_id: data.contract_id,
        initiated_by: user.id,
        reason: data.reason,
        description: data.description,
        amount_disputed: data.amount_disputed,
        status: 'open'
      }])
      .select()
      .single();

    if (error) throw error;

    // Upload evidence files if any
    if (data.evidence && data.evidence.length > 0) {
      await this.uploadEvidence(dispute.id, data.evidence);
    }

    // Send notification to other party
    await this.notifyParties(dispute);

    return dispute;
  }

  static async getById(id: string): Promise<Dispute | null> {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        contract:contracts(
          *,
          freelancer:freelancer_profiles(*),
          business:business_profiles(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  static async getByContractId(contractId: string): Promise<Dispute[]> {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByUserId(userId: string): Promise<Dispute[]> {
    const { data, error } = await supabase
      .from('disputes')
      .select(`
        *,
        contract:contracts(
          *,
          freelancer:freelancer_profiles(*),
          business:business_profiles(*)
        )
      `)
      .or(`initiated_by.eq.${userId},contract.freelancer_id.eq.${userId},contract.business_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addResponse(disputeId: string, response: DisputeResponse): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Add response to dispute_responses table (would need to create this table)
    const { error } = await supabase
      .from('dispute_responses')
      .insert([{
        dispute_id: disputeId,
        user_id: user.id,
        message: response.message,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    // Upload evidence if any
    if (response.evidence && response.evidence.length > 0) {
      await this.uploadEvidence(disputeId, response.evidence);
    }

    // Update dispute status
    await supabase
      .from('disputes')
      .update({ 
        status: 'in_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);
  }

  static async updateStatus(
    disputeId: string, 
    status: Dispute['status'], 
    resolution?: string
  ): Promise<Dispute> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: dispute, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', disputeId)
      .select()
      .single();

    if (error) throw error;

    // Notify parties of status change
    await this.notifyStatusChange(dispute);

    return dispute;
  }

  static async resolve(
    disputeId: string, 
    resolution: string, 
    resolvedBy: string
  ): Promise<Dispute> {
    const { data: dispute, error } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) throw error;

    // Notify parties of resolution
    await this.notifyResolution(dispute);

    return dispute;
  }

  static async escalate(disputeId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('disputes')
      .update({
        status: 'escalated',
        escalation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (error) throw error;

    // Notify admin team
    await this.notifyEscalation(disputeId, reason);
  }

  static async getDisputeResponses(disputeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('dispute_responses')
      .select(`
        *,
        user:auth.users(*)
      `)
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  private static async uploadEvidence(disputeId: string, files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileName = `dispute-${disputeId}-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('dispute-evidence')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading evidence:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dispute-evidence')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    // Store evidence URLs in database
    if (uploadedUrls.length > 0) {
      await supabase
        .from('dispute_evidence')
        .insert(
          uploadedUrls.map(url => ({
            dispute_id: disputeId,
            file_url: url,
            uploaded_at: new Date().toISOString()
          }))
        );
    }

    return uploadedUrls;
  }

  private static async notifyParties(dispute: Dispute): Promise<void> {
    // Get contract details to identify parties
    const { data: contract } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_profiles(user_id),
        business:business_profiles(user_id)
      `)
      .eq('id', dispute.contract_id)
      .single();

    if (!contract) return;

    // Notify the other party (not the one who initiated the dispute)
    const otherPartyUserId = dispute.initiated_by === contract.freelancer.user_id 
      ? contract.business.user_id 
      : contract.freelancer.user_id;

    await supabase
      .from('notifications')
      .insert([{
        user_id: otherPartyUserId,
        type: 'dispute',
        title: 'New Dispute Filed',
        message: `A dispute has been filed for contract: ${contract.title}`,
        data: {
          dispute_id: dispute.id,
          contract_id: dispute.contract_id,
          reason: dispute.reason
        }
      }]);
  }

  private static async notifyStatusChange(dispute: Dispute): Promise<void> {
    // Notify all parties involved in the dispute
    const { data: contract } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_profiles(user_id),
        business:business_profiles(user_id)
      `)
      .eq('id', dispute.contract_id)
      .single();

    if (!contract) return;

    const userIds = [contract.freelancer.user_id, contract.business.user_id];

    for (const userId of userIds) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'dispute',
          title: 'Dispute Status Updated',
          message: `Dispute status changed to: ${dispute.status}`,
          data: {
            dispute_id: dispute.id,
            contract_id: dispute.contract_id,
            status: dispute.status
          }
        }]);
    }
  }

  private static async notifyResolution(dispute: Dispute): Promise<void> {
    // Notify all parties of the resolution
    const { data: contract } = await supabase
      .from('contracts')
      .select(`
        *,
        freelancer:freelancer_profiles(user_id),
        business:business_profiles(user_id)
      `)
      .eq('id', dispute.contract_id)
      .single();

    if (!contract) return;

    const userIds = [contract.freelancer.user_id, contract.business.user_id];

    for (const userId of userIds) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'dispute',
          title: 'Dispute Resolved',
          message: `Your dispute has been resolved: ${dispute.resolution}`,
          data: {
            dispute_id: dispute.id,
            contract_id: dispute.contract_id,
            resolution: dispute.resolution
          }
        }]);
    }
  }

  private static async notifyEscalation(disputeId: string, reason: string): Promise<void> {
    // Notify admin team of escalated dispute
    // This would typically send to admin users or a support queue
    console.log(`Dispute ${disputeId} escalated: ${reason}`);
  }

  static async getDisputeStatistics(): Promise<{
    total: number;
    open: number;
    resolved: number;
    averageResolutionTime: number;
  }> {
    const { data: disputes } = await supabase
      .from('disputes')
      .select('status, created_at, resolved_at');

    if (!disputes) {
      return { total: 0, open: 0, resolved: 0, averageResolutionTime: 0 };
    }

    const total = disputes.length;
    const open = disputes.filter(d => d.status === 'open' || d.status === 'in_review').length;
    const resolved = disputes.filter(d => d.status === 'resolved').length;

    // Calculate average resolution time
    const resolvedDisputes = disputes.filter(d => d.resolved_at);
    const totalResolutionTime = resolvedDisputes.reduce((sum, dispute) => {
      const created = new Date(dispute.created_at);
      const resolved = new Date(dispute.resolved_at);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);

    const averageResolutionTime = resolvedDisputes.length > 0 
      ? Math.round(totalResolutionTime / resolvedDisputes.length / (1000 * 60 * 60 * 24)) // days
      : 0;

    return {
      total,
      open,
      resolved,
      averageResolutionTime
    };
  }
}

export default DisputeService;