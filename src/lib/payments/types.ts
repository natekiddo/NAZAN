export type PaymentProvider = 'chapa' | 'stripe' | 'test';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: 'free' | 'team';
  name: string;
  tagline: string;
  priceUSD: number;
  priceETB: number;
  period: 'month' | 'year';
  memberLimit: number | 'Unlimited';
  badge?: string;
  popular?: boolean;
  features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Ideal for individuals, student projects, and duo collaborations.',
    priceUSD: 0,
    priceETB: 0,
    period: 'month',
    memberLimit: 2,
    features: [
      'Strictly up to 2 workspace members',
      'Unlimited personal & team projects',
      'Google Drive cloud storage integration',
      'Built-in Gemini 3.8 Flash AI Assistant',
      'Basic tasks, Kanban, and milestones',
      'Work session & stopping point tracking',
    ],
  },
  {
    id: 'team',
    name: 'Pro Team',
    tagline: 'For fast-moving software teams, startups, and agencies.',
    priceUSD: 15,
    priceETB: 1500,
    period: 'month',
    memberLimit: 'Unlimited',
    popular: true,
    badge: 'Recommended',
    features: [
      'Unlimited workspace members & collaborators',
      '23-point granular custom permissions matrix',
      'Owner, Admin, Member & Guest access controls',
      'Encrypted real-time Team Chat & live channels',
      'In-app Voice & Video mesh conference rooms',
      'Deep AI Project Memory & stopping point briefings',
      'Google Drive automatic project folder creation',
      'Audit log inspection & project status exports',
      'Local Ethiopian payment via Chapa (Telebirr, CBE Birr)',
    ],
  },
];

export interface ChapaInitResponse {
  status: string;
  message: string;
  data?: {
    checkout_url: string;
  };
}
