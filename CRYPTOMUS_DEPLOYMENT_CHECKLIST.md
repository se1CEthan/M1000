# ✅ Cryptomus Deployment Checklist

Use this checklist to ensure your Cryptomus integration is properly deployed.

---

## 📋 Pre-Deployment

- [ ] Read `CRYPTOMUS_IMPLEMENTATION_SUMMARY.md`
- [ ] Review `CRYPTOMUS_SETUP_COMPLETE.md`
- [ ] Understand the payment flow (8 steps)
- [ ] Have Cryptomus account credentials ready
- [ ] Have Supabase project access

---

## 🗄️ Database Setup

- [ ] Apply migration: `supabase db push`
- [ ] Verify columns added:
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'orders' 
  AND column_name IN (
    'cryptomus_payment_id',
    'payment_url',
    'payment_status',
    'paid_at',
    'amount'
  );
  ```
- [ ] Check indexes created:
  ```sql
  SELECT indexname 
  FROM pg_indexes 
  WHERE tablename = 'orders';
  ```

---

## 🚀 Edge Functions Deployment

- [ ] Make script executable: `chmod +x scripts/deploy-cryptomus.sh`
- [ ] Deploy functions: `./scripts/deploy-cryptomus.sh`
- [ ] Verify deployment:
  ```bash
  supabase functions list
  ```
- [ ] Check functions are active:
  - [ ] `create-cryptomus-payment`
  - [ ] `cryptomus-webhook`

---

## 🔧 Configuration

### Environment Variables
- [ ] `.env` has `VITE_CRYPTOMUS_MERCHANT_UUID`
- [ ] `.env` has `VITE_SUPABASE_URL`
- [ ] Edge function has Cryptomus API key
- [ ] Edge function has merchant UUID

### Cryptomus Dashboard
- [ ] Login to https://cryptomus.com/dashboard
- [ ] Navigate to Settings → Webhooks
- [ ] Add webhook URL:
  ```
  https://[your-project].supabase.co/functions/v1/cryptomus-webhook
  ```
- [ ] Enable webhook for payment events
- [ ] Save webhook configuration
- [ ] Copy webhook secret (if required)

---

## 🧪 Testing

### Manual Test
- [ ] Login to marketplace
- [ ] Navigate to product page
- [ ] Click "Buy Now - Pay with Crypto"
- [ ] Verify redirect to Cryptomus
- [ ] Complete test payment
- [ ] Return to success page
- [ ] Verify download unlocks

### Database Verification
- [ ] Check order created:
  ```sql
  SELECT * FROM orders 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
  ```
- [ ] Check order status updated to 'paid'
- [ ] Check download_url populated
- [ ] Check payout record created:
  ```sql
  SELECT * FROM payouts 
  WHERE created_at > NOW() - INTERVAL '1 hour';
  ```

### Logs Verification
- [ ] Check payment creation logs:
  ```bash
  supabase functions logs create-cryptomus-payment --tail
  ```
- [ ] Check webhook logs:
  ```bash
  supabase functions logs cryptomus-webhook --tail
  ```
- [ ] Look for success indicators (✅ emojis)
- [ ] No error messages (❌ emojis)

---

## 🔐 Security Checks

- [ ] Webhook URL is HTTPS
- [ ] Webhook signature validation enabled
- [ ] Order ownership verified before download
- [ ] Download links expire after 30 days
- [ ] No sensitive data in frontend logs
- [ ] API keys not exposed in frontend

---

## 📊 Monitoring Setup

### Supabase Dashboard
- [ ] Set up alerts for failed payments
- [ ] Monitor edge function invocations
- [ ] Track database query performance
- [ ] Set up error notifications

### Cryptomus Dashboard
- [ ] Monitor payment success rate
- [ ] Check webhook delivery status
- [ ] Review transaction history
- [ ] Set up payment notifications

---

## 🎯 Production Readiness

### Performance
- [ ] Test with multiple concurrent orders
- [ ] Verify webhook handles high load
- [ ] Check database query performance
- [ ] Test with large product files

### Error Handling
- [ ] Test failed payment scenario
- [ ] Test expired payment scenario
- [ ] Test network timeout scenario
- [ ] Test invalid order ID scenario

### User Experience
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Verify loading states
- [ ] Check error messages are clear

---

## 📱 Mobile Testing

- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify payment redirect works
- [ ] Check success page responsive
- [ ] Test download on mobile

---

## 🌐 Cross-Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

---

## 📧 Notifications (Optional)

- [ ] Set up order confirmation emails
- [ ] Set up payment success emails
- [ ] Set up download link emails
- [ ] Set up seller payout notifications

---

## 📈 Analytics (Optional)

- [ ] Track payment initiation
- [ ] Track payment completion
- [ ] Track payment failures
- [ ] Track download conversions
- [ ] Monitor revenue metrics

---

## 🐛 Troubleshooting Preparation

- [ ] Document common issues
- [ ] Create support response templates
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Create admin dashboard for orders
- [ ] Prepare rollback plan

---

## 📝 Documentation

- [ ] Update user documentation
- [ ] Create seller onboarding guide
- [ ] Document payment flow for support team
- [ ] Create FAQ for common issues
- [ ] Document webhook retry logic

---

## 🎉 Go Live

- [ ] All tests passing
- [ ] No errors in logs
- [ ] Webhook confirmed working
- [ ] Real payment tested successfully
- [ ] Team trained on new system
- [ ] Support team ready
- [ ] Monitoring active
- [ ] Backup plan ready

---

## 📊 Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor webhook success rate
- [ ] Check payment completion rate
- [ ] Review error logs every 2 hours
- [ ] Monitor database performance
- [ ] Check user feedback
- [ ] Verify payout calculations
- [ ] Monitor download success rate

---

## 🔄 Post-Launch Tasks (First Week)

- [ ] Review all payment transactions
- [ ] Analyze conversion rates
- [ ] Identify any issues
- [ ] Optimize based on data
- [ ] Gather user feedback
- [ ] Update documentation
- [ ] Train support team on issues

---

## ✅ Final Sign-Off

- [ ] Technical lead approval
- [ ] QA team approval
- [ ] Product owner approval
- [ ] Security review complete
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Support team trained

---

## 📞 Emergency Contacts

- **Cryptomus Support**: https://cryptomus.com/support
- **Supabase Support**: https://supabase.com/support
- **Technical Lead**: [Your contact]
- **On-Call Engineer**: [Your contact]

---

## 🎯 Success Metrics

After deployment, track:

- ✅ Payment success rate > 95%
- ✅ Webhook delivery rate > 99%
- ✅ Average payment time < 15 minutes
- ✅ Download unlock time < 10 seconds
- ✅ Zero security incidents
- ✅ User satisfaction > 4.5/5

---

## 🚨 Rollback Plan

If critical issues occur:

1. Disable Cryptomus payment option
2. Revert to previous payment method
3. Notify users of temporary issue
4. Fix issues in staging
5. Re-test thoroughly
6. Re-deploy when ready

---

**Date Deployed**: _______________

**Deployed By**: _______________

**Sign-Off**: _______________

---

🎉 **Congratulations on deploying Cryptomus!** 🎉
