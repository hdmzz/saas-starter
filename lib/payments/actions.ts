'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession, createOneTimeCheckoutSession } from './stripe';
import { withUser } from '@/lib/auth/middleware';

export const checkoutAction = withUser(async (formData, user) => {
  const priceId = formData.get('priceId') as string;

  console.log(formData);
  
  const paymentType = formData.get('paymentType') as "subscription" | "one-time";

  if (paymentType === "subscription")
    await createCheckoutSession({ user, priceId });
  else if (paymentType === "one-time")
    await createOneTimeCheckoutSession({ user, priceId });
});

export const customerPortalAction = withUser(async (_, user) => {
  const portalSession = await createCustomerPortalSession(user);
  redirect(portalSession.url);
});
