'use server';

import Stripe from 'stripe';

export async function createPaymentIntentAction(
  amountInPaise: number
): Promise<{ clientSecret: string; paymentIntentId: string } | { error: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'Payment service not configured.' };
  }
  if (amountInPaise < 100) {
    return { error: 'Order total is too low.' };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });

    if (!intent.client_secret) {
      return { error: 'Failed to initialise payment session.' };
    }

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  } catch (e: any) {
    return { error: e.message ?? 'Payment initialisation failed.' };
  }
}
