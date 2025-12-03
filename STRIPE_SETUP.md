# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for GroomIQ.

## Overview

GroomIQ uses Stripe for subscription management:
- **Free Plan**: Up to 10 clients
- **Pro Plan**: $10/month, unlimited clients

## Setup Steps

### 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete your account setup

### 2. Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Add to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

### 3. Create a Product and Price

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: "GroomIQ Pro"
   - **Description**: "Unlimited clients and advanced features"
   - **Pricing**: Recurring, $10.00 USD per month
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_`)
6. Add to your `.env` file:
   ```
   STRIPE_PRO_PRICE_ID=price_your_price_id_here
   ```

### 4. Set Up Webhooks

Webhooks are essential for Stripe to notify your app about subscription events.

#### Development (Local Testing)

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the webhook signing secret (starts with `whsec_`)
4. Add to your `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

#### Production (Vercel/Live)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your webhook URL: `https://your domain.com/api/stripe/webhook`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** and add to your production environment variables

### 5. Set App URL

Add your app's URL to `.env`:

**Development:**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production:**
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 6. Test the Integration

1. Start your app: `npm run dev`
2. Sign in and go to Settings
3. Click "Upgrade to Pro"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
5. Complete the checkout
6. You should be redirected back to Settings with Pro plan active

## Environment Variables Summary

Your `.env` should include:

```
# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth (existing)
AUTH_SECRET=your_auth_secret
```

## Testing Subscription Flow

### Test Scenarios

1. **Successful Subscription**
   - Card: `4242 4242 4242 4242`
   - Should upgrade to Pro immediately

2. **Payment Failure**
   - Card: `4000 0000 0000 0002`
   - Should fail gracefully with error message

3. **Subscription Cancellation**
   - Go to Settings → "Manage Subscription"
   - Cancel subscription in Stripe portal
   - Should downgrade to Free plan

## Switching to Live Mode

When ready for production:

1. Go to Stripe Dashboard
2. Toggle from "Test mode" to "Live mode" (top right)
3. Get live API keys (starts with `sk_live_`)
4. Create the same product/price in live mode
5. Update production environment variables with live keys
6. Set up production webhook endpoint

## Troubleshooting

### "No signature" error
- Make sure webhook secret is set in `.env`
- Restart your dev server after adding environment variables

### "Invalid signature" error
- Webhook secret might be wrong
- If using Stripe CLI, make sure it's running
- Check that the webhook secret matches what Stripe CLI shows

### Subscription not updating
- Check webhook events in Stripe Dashboard
- Ensure webhook endpoint is accessible
- Check server logs for errors

### Client limit not enforcing
- Make sure Prisma migrations ran successfully
- Check that user.plan is being set correctly
- Verify webhook events are being processed

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For GroomIQ integration issues, check the application logs and webhook event logs in Stripe Dashboard.
