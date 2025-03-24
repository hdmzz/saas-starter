import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  debugger;
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription', 'line_items.data.price.product'],
    });

    console.log("Session Stripe récupérée:", session);

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("Aucun ID utilisateur trouvé dans client_reference_id de la session.");
    }
    
    let customerId = null;
    if (session.customer) {
      customerId = typeof session.customer === 'string' 
        ? session.customer 
        : session.customer.id;
    }
    
    if (session.mode === "payment") {
      console.log('Paiement unique détecté - Crédit de tokens...');
      
      // Récupérer les informations de l'article acheté
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        expand: ['data.price.product'],
      });
      
      if (!lineItems.data.length) {
        throw new Error('Aucun produit trouvé dans cette session de paiement.');
      }
      
      // Déterminer le nombre de tokens à créditer en fonction du produit acheté
      let tokensToAdd = 0;
      const item = lineItems.data[0];
      const product = item.price?.product as Stripe.Product;
      
      // Vous pouvez stocker le nombre de tokens dans les métadonnées du produit
      if (product && product.metadata && product.metadata.tokens) {
        tokensToAdd = parseInt(product.metadata.tokens, 10);
      } else {
        // Détermination par défaut basée sur le prix
        // Par exemple: 1€ = 10 tokens
        const priceAmount = item.amount_total ? item.amount_total / 100 : 0;
        tokensToAdd = priceAmount; // Ajustez ce ratio selon votre modèle économique
      }
      
      console.log(`Attribution de ${tokensToAdd} tokens à l'utilisateur ${userId}`);
      
      // Récupérer l'utilisateur actuel pour obtenir son solde de tokens
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      if (userResult.length === 0) {
        throw new Error('Utilisateur non trouvé en base de données.');
      }
      
      const user = userResult[0];
      const currentTokens = user.tokens || 0;
      
      // Mise à jour des tokens de l'utilisateur
      await db
        .update(users)
        .set({ 
          tokens: currentTokens + tokensToAdd,
          stripeCustomerId: customerId || user.stripeCustomerId,
          updatedAt: new Date()
        })
        .where(eq(users.id, Number(userId)));
      
      // Récupérer l'utilisateur mis à jour
      const updatedUserResult = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      // Mettre à jour la session avec les nouvelles informations utilisateur
      if (updatedUserResult.length > 0) {
        await setSession(updatedUserResult[0]);
      }
      
      return NextResponse.redirect(new URL('/dashboard?tokensAdded=' + tokensToAdd, request.url));
    } 
    else if (session.mode === "subscription") {
      // Gérer l'abonnement (code existant)
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
      
      if (!subscriptionId) {
        throw new Error('Aucun abonnement trouvé pour cette session.');
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      });
      
      const plan = subscription.items.data[0]?.price;
      if (!plan) {
        throw new Error('Aucun plan trouvé pour cet abonnement.');
      }
      
      const product = plan.product as Stripe.Product;
      
      // L'abonnement peut également fournir des tokens mensuels
      let monthlyTokens = 0;
      if (product.metadata && product.metadata.monthly_tokens) {
        monthlyTokens = parseInt(product.metadata.monthly_tokens, 10);
      }
      
      // Récupérer l'utilisateur actuel
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      if (userResult.length === 0) {
        throw new Error('Utilisateur non trouvé en base de données.');
      }
      
      const user = userResult[0];
      
      // Mise à jour des informations d'abonnement et des tokens
      await db
        .update(users)
        .set({ 
          stripeCustomerId: customerId || user.stripeCustomerId,
          stripeSubscriptionId: subscriptionId,
          stripeProductId: product.id,
          planName: product.name,
          tokens: (user.tokens || 0) + monthlyTokens, // Ajouter les tokens mensuels
          updatedAt: new Date()
        })
        .where(eq(users.id, Number(userId)));
      
      // Récupérer l'utilisateur mis à jour
      const updatedUserResult = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      // Mettre à jour la session avec les nouvelles informations utilisateur
      if (updatedUserResult.length > 0) {
        await setSession(updatedUserResult[0]);
      }
      
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Si on arrive ici, c'est un type de paiement non géré
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Erreur lors du traitement du paiement réussi:', error);
    return NextResponse.redirect(new URL('/error?reason=payment-processing', request.url));
  }
}
