import { AppPage } from '../lib/navigation';

export const STUDIO_BRAND = {
  name: 'Card Studio',
  nameMr: 'कार्ड स्टुडिओ',
  domain: 'cardstudio.vedamit.com',
  siteUrl: 'https://cardstudio.vedamit.com',
  supportEmail: 'sairajservice7@gmail.com',
  developerName: 'Vedamit Solutions',
  developerUrl: 'https://vedamit.com',
} as const;

export type CardToolId = 'farmer-card' | 'aadhaar-print' | 'pvc-makers';

export type CardToolStatus = 'live' | 'coming-soon';

export interface CardToolDefinition {
  id: CardToolId;
  status: CardToolStatus;
  page?: AppPage;
  routePath?: string;
  accent: 'emerald' | 'sky' | 'amber';
}

export const CARD_STUDIO_TOOLS: CardToolDefinition[] = [
  {
    id: 'farmer-card',
    status: 'live',
    page: 'create-card',
    routePath: '/farmer',
    accent: 'emerald',
  },
  {
    id: 'aadhaar-print',
    status: 'coming-soon',
    accent: 'sky',
  },
  {
    id: 'pvc-makers',
    status: 'live',
    page: 'pvc-makers',
    routePath: '/pvc-makers',
    accent: 'amber',
  },
];
