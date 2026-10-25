import React from 'react';
import PricingSection from '@/components/pricing/PricingSection';

export const metadata = {
  title: 'Pricing — ProjectHub',
  description: 'Free workspaces support up to two members. Teams of three or more require a subscription.',
};

export default function PricingPage() {
  return <PricingSection standalone />;
}

