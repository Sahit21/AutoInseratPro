export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  paymentLink?: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1T3wm2GHP7k9rrK3cPWiCgVm',
    name: 'AutoInserat Pro | Pro - Plan',
    description: '50 Inserate / Monat\nPremium KI-Texte & SEO\nPro Bildveredelung (Hintergründe)\nExport zu mobile.de & AutoScout24\nEigene Vorlagen & Branding',
    mode: 'subscription',
    price: 59.00,
    currency: 'EUR',
    paymentLink: 'https://buy.stripe.com/test_14AbJ12Qr3xicKFarE0Jq02',
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}
