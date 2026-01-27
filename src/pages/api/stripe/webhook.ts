/* eslint-disable no-console */
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(
  req: NextApiRequest,
  limitBytes = 1024 * 1024,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    req.on('data', (chunk: Uint8Array) => {
      totalBytes += chunk.byteLength;
      if (totalBytes > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const anyError = error as { code?: unknown; message?: unknown };
  if (anyError.code === '23505') return true;
  if (
    typeof anyError.message === 'string' &&
    anyError.message.includes('duplicate')
  ) {
    return true;
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await getRawBody(req);
  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res
      .status(400)
      .json({ error: 'Webhook signature verification failed' });
  }

  const supabase = createServiceClient();

  try {
    const { error: eventInsertError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        livemode: event.livemode,
      });
    if (eventInsertError) {
      if (isUniqueViolation(eventInsertError)) {
        return res.status(200).json({ received: true });
      }
      throw eventInsertError;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const priceType = session.metadata?.price_type;

        if (!userId) break;

        if (priceType === 'monthly' && session.subscription) {
          // Handle subscription - use any to handle Stripe API response flexibility
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subscriptionData: any = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );

          console.log(
            'Subscription data:',
            JSON.stringify(subscriptionData, null, 2),
          );

          // Safely convert timestamps
          const startTs = subscriptionData.current_period_start;
          const endTs = subscriptionData.current_period_end;
          const periodStart = startTs
            ? new Date(startTs * 1000).toISOString()
            : null;
          const periodEnd = endTs ? new Date(endTs * 1000).toISOString() : null;

          // Use upsert to handle cases where subscription record may not exist
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: userId,
                stripe_subscription_id: subscriptionData.id,
                status: 'active',
                plan_type: 'monthly',
                current_period_start: periodStart,
                current_period_end: periodEnd,
              },
              { onConflict: 'user_id' },
            );

          if (upsertError) {
            console.error('Subscription upsert error:', upsertError);
            throw upsertError;
          } else {
            console.log('Subscription updated successfully for user:', userId);
          }
        } else if (priceType === 'credits') {
          if (
            !session.payment_intent ||
            typeof session.payment_intent !== 'string'
          ) {
            break;
          }

          const creditsAmount = Number.parseInt(
            session.metadata?.credits_amount || '0',
            10,
          );
          const creditsToGrant =
            Number.isFinite(creditsAmount) && creditsAmount > 0
              ? creditsAmount
              : 100;

          const { error: creditsInsertError } = await supabase
            .from('credit_packages')
            .insert({
              user_id: userId,
              credits_purchased: creditsToGrant,
              credits_remaining: creditsToGrant,
              stripe_payment_intent_id: session.payment_intent,
            });
          if (creditsInsertError) {
            if (!isUniqueViolation(creditsInsertError)) {
              throw creditsInsertError;
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as any;

        // Safely convert timestamps with validation
        const startTs = subscriptionData.current_period_start;
        const endTs = subscriptionData.current_period_end;

        // Validate timestamps before creating Date objects
        const periodStart =
          startTs && typeof startTs === 'number'
            ? new Date(startTs * 1000).toISOString()
            : null;
        const periodEnd =
          endTs && typeof endTs === 'number'
            ? new Date(endTs * 1000).toISOString()
            : null;

        // Check if subscription has expired (only if we have valid periodEnd)
        const now = new Date();
        const isExpired = periodEnd ? new Date(periodEnd) < now : false;

        // Determine status: if expired or status is not active, mark as inactive
        let status = 'inactive';
        let planType = 'free';

        if (
          subscriptionData.status === 'active' &&
          !isExpired &&
          !subscriptionData.cancel_at_period_end
        ) {
          status = 'active';
          planType = 'monthly';
        } else if (subscriptionData.status === 'active' && isExpired) {
          // Subscription expired but Stripe hasn't sent deleted event yet
          status = 'canceled';
          planType = 'free';
        } else if (
          subscriptionData.status === 'active' &&
          subscriptionData.cancel_at_period_end
        ) {
          // Subscription is active but will cancel at period end
          status = 'active';
          planType = 'monthly';
        }

        const { error: subscriptionUpdateError } = await supabase
          .from('subscriptions')
          .update({
            status,
            plan_type: planType,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: subscriptionData.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscriptionData.id);
        if (subscriptionUpdateError) throw subscriptionUpdateError;
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionData = event.data.object as any;

        const { error: subscriptionDeleteError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'free',
          })
          .eq('stripe_subscription_id', subscriptionData.id);
        if (subscriptionDeleteError) throw subscriptionDeleteError;
        break;
      }

      case 'invoice.payment_failed': {
        const invoiceData = event.data.object as any;

        if (invoiceData.subscription) {
          const { error: invoiceUpdateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
            })
            .eq('stripe_subscription_id', invoiceData.subscription as string);
          if (invoiceUpdateError) throw invoiceUpdateError;
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
