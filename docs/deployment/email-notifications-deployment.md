# Email Notifications - Deployment Guide

Quick reference para deployment del sistema de notificaciones por email.

**Prerequisites**: 
- ✅ Código implementado y pusheado
- ✅ Migraciones aplicadas localmente
- ⏳ Resend account pendiente
- ⏳ Supabase secrets pendientes
- ⏳ Cron job pendiente

---

## Step 1: Resend Account Setup (5 min)

### 1.1 Create Account
1. Visit: https://resend.com/signup
2. Sign up with email
3. Verify email

### 1.2 Verify Domain
1. Go to **Domains** → **Add Domain**
2. Enter: `enregla.app`
3. Add DNS records to your domain provider:

```
Type: TXT
Name: @
Value: [provided by Resend]

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: CNAME
Name: [provided by Resend]
Value: [provided by Resend]
```

4. Wait for verification (green checkmark)
5. Test: Send test email from Resend dashboard

### 1.3 Get API Key
1. Go to **API Keys** → **Create API Key**
2. Name: `EnRegla Production`
3. Permissions: `Full Access` (default)
4. Copy key (starts with `re_`)
5. **Save it securely** - shown only once

---

## Step 2: Supabase Secrets (2 min)

```bash
# Get your project ref from Supabase Dashboard URL
# Format: https://app.supabase.com/project/YOUR_PROJECT_REF
PROJECT_REF="your-project-ref-here"

# Set Resend API key
supabase secrets set RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx" --project-ref $PROJECT_REF

# Set app URL
supabase secrets set APP_URL="https://enregla.app" --project-ref $PROJECT_REF

# Verify secrets are set
supabase secrets list --project-ref $PROJECT_REF
```

**Expected output**:
```
RESEND_API_KEY  re_******
APP_URL         https://enregla.app
```

---

## Step 3: Deploy Edge Function (2 min)

```bash
# Deploy send-expiry-alerts function
supabase functions deploy send-expiry-alerts --project-ref $PROJECT_REF

# Expected output:
# Deploying function send-expiry-alerts...
# Function send-expiry-alerts deployed successfully.
```

### Verify Deployment

Get your service role key from Supabase Dashboard → Settings → API → `service_role` key

```bash
SERVICE_ROLE_KEY="your-service-role-key-here"

# Test function
curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Expected response** (no permits expiring today):
```json
{
  "message": "No permits expiring today",
  "sent": 0,
  "failed": 0,
  "skipped": 0
}
```

If you get errors, check function logs:
```bash
supabase functions logs send-expiry-alerts --project-ref $PROJECT_REF
```

---

## Step 4: Create Cron Job (3 min)

### 4.1 Open SQL Editor
1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### 4.2 Create Cron Job

**IMPORTANT**: Replace placeholders before running:
- `YOUR_PROJECT_REF` → Your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` → Your service role key (from Step 3)

```sql
SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *', -- 8:00 AM UTC every day
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Click **Run** ▶️

**Expected output**: `Success. No rows returned`

### 4.3 Verify Cron Job

Run this query:
```sql
SELECT 
  jobname,
  schedule,
  active,
  jobid
FROM cron.job 
WHERE jobname = 'send-expiry-alerts-daily';
```

**Expected output**:
| jobname | schedule | active | jobid |
|---------|----------|--------|-------|
| send-expiry-alerts-daily | 0 8 * * * | true | (number) |

### 4.4 Test Cron Execution (Optional)

To test immediately without waiting for 8:00 AM:

```sql
-- Temporarily change schedule to run in 1 minute
SELECT cron.unschedule('send-expiry-alerts-daily');

SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '* * * * *', -- Every minute (TEMPORARY)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Wait 1 minute, then check execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-expiry-alerts-daily')
ORDER BY start_time DESC 
LIMIT 5;

-- IMPORTANT: Reset to daily schedule after testing
SELECT cron.unschedule('send-expiry-alerts-daily');

SELECT cron.schedule(
  'send-expiry-alerts-daily',
  '0 8 * * *', -- Back to 8:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## Step 5: End-to-End Testing (5 min)

### 5.1 Create Test Permit

```sql
-- Update a permit to expire in 30 days
UPDATE permits
SET expiry_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = (SELECT id FROM permits WHERE is_active = true LIMIT 1)
RETURNING id, type, expiry_date;
```

Note the permit ID returned.

### 5.2 Trigger Function Manually

```bash
curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-expiry-alerts \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -v
```

**Expected response**:
```json
{
  "sent": 1,
  "failed": 0,
  "skipped": 0,
  "errors": []
}
```

### 5.3 Check Email Inbox

1. Check your email inbox (user associated with the company)
2. Look for email with subject: **"📅 1 permiso vence próximamente - [Company Name]"**
3. Verify email content:
   - ✅ Greeting with your name
   - ✅ Alert message (blue box with 📅)
   - ✅ Permit details (type, sede, expiry date)
   - ✅ "Ver en EnRegla" button
   - ✅ Unsubscribe link

### 5.4 Check Notification Logs

```sql
SELECT 
  nl.*,
  u.email,
  p.type as permit_type
FROM notification_logs nl
JOIN auth.users u ON nl.user_id = u.id
JOIN permits p ON nl.permit_id = p.id
ORDER BY nl.created_at DESC
LIMIT 5;
```

**Expected**: 1 row with `email_status = 'sent'` and `resend_message_id` populated

### 5.5 Test Preferences Toggle

1. Login to app: https://enregla.app
2. Navigate to **Settings** → **Notificaciones** (or `/settings/notifications`)
3. Uncheck **"Alertas de permisos por vencer"**
4. Trigger function again (Step 5.2)
5. Expected: Response shows `"skipped": 1` and no email received

**Verify in database**:
```sql
SELECT 
  u.email,
  np.email_enabled,
  np.expiry_alerts_enabled
FROM auth.users u
JOIN notification_preferences np ON u.id = np.user_id;
```

6. Re-enable notifications and test again

---

## Rollback Plan

If something goes wrong, you can disable notifications without downtime:

### Disable Cron Job (keeps function deployed)

```sql
SELECT cron.unschedule('send-expiry-alerts-daily');
```

Verify:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-expiry-alerts-daily';
-- Should return 0 rows
```

### Re-enable Later

Re-run the cron creation SQL from Step 4.2

---

## Monitoring After Deployment

### Daily Checks (First Week)

```sql
-- Check daily execution
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-expiry-alerts-daily')
  AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;

-- Check sent emails
SELECT 
  DATE(sent_at) as date,
  notification_type,
  COUNT(*) as count
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at), notification_type
ORDER BY date DESC, notification_type;
```

### Resend Dashboard Monitoring

1. Go to https://resend.com/emails
2. Monitor:
   - Delivery rate (should be 95%+)
   - Open rate
   - Bounce rate (should be <5%)
   - Complaint rate (should be <0.1%)

### Edge Function Logs

```bash
# View recent logs
supabase functions logs send-expiry-alerts --project-ref $PROJECT_REF | tail -50

# Follow live logs
supabase functions logs send-expiry-alerts --project-ref $PROJECT_REF --follow
```

---

## Troubleshooting

### Issue: "RESEND_API_KEY is not set"

**Cause**: Secret not configured

**Fix**:
```bash
supabase secrets set RESEND_API_KEY="re_xxx" --project-ref $PROJECT_REF
supabase functions deploy send-expiry-alerts --project-ref $PROJECT_REF
```

### Issue: Emails not arriving

**Checks**:
1. Spam folder
2. Resend dashboard → Check delivery status
3. User preferences: `expiry_alerts_enabled = true`
4. Domain verification in Resend (green checkmark)

### Issue: Cron job not executing

**Check execution history**:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-expiry-alerts-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

If `status = 'failed'`, check `return_message` for error details.

### Issue: Rate limit exceeded

**Cause**: Resend free tier = 100 emails/day

**Solutions**:
1. Upgrade Resend plan: https://resend.com/pricing
2. Reduce frequency (change cron to weekly)
3. Filter recipients (only send to admins)

---

## Cost Estimates

### Resend Pricing

| Plan | Emails/month | Cost |
|------|--------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20/mo |
| Business | 100,000 | $80/mo |

**Current usage estimate**: ~1,500 emails/month (50/day)  
**Recommended plan**: Free tier (sufficient for 6+ months)

### Supabase

Edge Function execution: Included in Supabase plan (generous free tier)

---

## Success Criteria

✅ Deployment complete when:

1. [ ] Resend domain verified (green checkmark)
2. [ ] Secrets configured in Supabase
3. [ ] Edge Function deployed successfully
4. [ ] Cron job created and active
5. [ ] Test email received in inbox
6. [ ] Notification logged in database with `email_status = 'sent'`
7. [ ] Preferences toggle works (can disable/enable notifications)
8. [ ] No errors in function logs
9. [ ] Cron execution history shows successful runs

---

## Next Steps After Deployment

1. **Monitor**: Check daily for first week
2. **Optimize**: Adjust batch size if needed
3. **Feedback**: Collect user feedback on email content/frequency
4. **Phase 3**: Plan weekly digest feature (see roadmap)

---

**Questions?** Check main documentation: [`docs/features/email-notifications.md`](../features/email-notifications.md)
