import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripeOneTimePrices, getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { log } from 'console';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [recurringPrices, oneTimePrices, products] = await Promise.all([
    getStripePrices(), // Prix d'abonnement
    getStripeOneTimePrices(), // Prix uniques (si nécessaire)
    getStripeProducts(),
  ]);

  console.log("one time prices", oneTimePrices);
  const productsWithPrices = [];
  
  // Associer les prix récurrents aux produits
  const subscriptionProducts = products.map(product => {
    const productPrice = recurringPrices.find(price => price.productId === product.id);
    return {
      product,
      price: productPrice,
      type: 'subscription'
    };
  }).filter(p => p.price); 

  const oneTimeProducts = products.map(product => {
    const productPrice = oneTimePrices.find(price => price.productId === product.id);
    return {
      product,
      price: productPrice,
      type: 'one-time'
    };
  }).filter(p => p.price);
  
  productsWithPrices.push(...subscriptionProducts, ...oneTimeProducts);
  console.log("one product", oneTimeProducts);
  

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
        {productsWithPrices.map(({ product, price, type }) => (
          <PricingCard
            key={product.id}
            name={product.name || 'Plan'}
            description={product.description as string}
            price={price?.unitAmount || 0}
            priceId={price?.id}
            type={type}
          />
        ))}
      </div>
    </main>
  );
}

function PricingCard({
  name,
  description,
  price,
  priceId,
  type
}: {
  name: string;
  description: string;
  price: number;
  priceId?: string;
  type: string;
}) {
  return (
    <div className="pt-6 border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
    <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
    <p className="text-gray-500 mb-4">
      <Check className="h-4 w-4 inline-block mr-1" />
      {description}
    </p>
    <p className="text-4xl font-medium text-gray-900 mb-6">
      {price / 100}{' '}€
      {type === 'subscription' && <span className="text-lg text-gray-500"> /mois</span>}
    </p>

    <form action={checkoutAction}>
      <input type="hidden" name="priceId" value={priceId} />
      <input type="hidden" name="paymentType" value={type} />
      <SubmitButton />
    </form>
  </div>
  );
}
