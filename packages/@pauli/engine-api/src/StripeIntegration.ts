import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceUSD: number;
  features: string[];
}

export interface CreatorSubscription {
  subscriptionId: string;
  customerId: string;
  planId: string;
  status: string;
  currentPeriodEnd: Date;
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd'
): Promise<string | null> {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
    });
    return intent.client_secret;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    return null;
  }
}

export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<CreatorSubscription | null> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      planId: priceId,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return null;
  }
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event | null> {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}
