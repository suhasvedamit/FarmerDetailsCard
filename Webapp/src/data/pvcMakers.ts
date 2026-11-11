import { FarmerRecord } from '../types';
import { Language } from '../i18n';

export interface PvcMakerAgent {
  id: string;
  shopName: string;
  shopNameMr?: string;
  agentName?: string;
  agentNameMr?: string;
  /** Display / tel: phone number (include country code, e.g. "+91 98765 43210") */
  phone?: string;
  /** Digits-only WhatsApp number with country code (no '+' or spaces), e.g. "919876543210" */
  whatsapp?: string;
  village: string;
  villageMr?: string;
  taluka: string;
  talukaMr?: string;
  district: string;
  districtMr?: string;
  state: string;
  stateMr?: string;
  pincode: string;
  address: string;
  addressMr?: string;
  services: string[];
  servicesMr?: string[];
  timings?: string;
  timingsMr?: string;
  priceNote?: string;
  priceNoteMr?: string;
  isVerified?: boolean;
  /** Optional custom Google Maps URL; falls back to address search if omitted */
  mapsUrl?: string;
}

/**
 * Hardcoded PVC Maker Agents directory.
 *
 * To update this agent or add more agents later, edit the entries below.
 * Ensure `whatsapp` uses country code + digits only (e.g. "919876543210").
 */
export const PVC_MAKERS: PvcMakerAgent[] = [
  {
    id: 'pvc-maker-1',
    shopName: 'Nagarik Suvidha Center',
    shopNameMr: 'नागरिक सुविधा सेंटर',
    agentName: 'Mr. Rajendra Auti',
    agentNameMr: 'श्री. राजेंद्र औटी',
    phone: '918208158592',
    whatsapp: '918208158592',
    village: 'Belhe',
    villageMr: 'बेल्हे',
    taluka: 'Junnar',
    talukaMr: 'जुन्नर',
    district: 'Pune',
    districtMr: 'पुणे',
    state: 'Maharashtra',
    stateMr: 'महाराष्ट्र',
    pincode: '412410',
    address: 'Kalyan Nagar Bypass, Shivmalhar Automobile, Belhe, Tal. Junnar, Dist. Pune, Maharashtra - 412410',
    addressMr: 'कल्याण नगर बायपास, शिवमल्हार ऑटोमोबाईल, बेल्हे, ता. जुन्नर, जि. पुणे, महाराष्ट्र - 412410',
    services: ['CR80 PVC Card Print', 'Front & Back Duplex', 'Documentation & Print Services'],
    servicesMr: ['CR80 PVC कार्ड प्रिंट', 'दोन्ही बाजू प्रिंट', 'दस्तऐवज व प्रिंट सेवा'],
    timings: '',
    timingsMr: '',
    priceNote: '',
    priceNoteMr: '',
    isVerified: true,
    mapsUrl: 'https://maps.app.goo.gl/uNhMmm6qmb9fMUhe7',
  },
];

function pickLocalized(
  language: Language,
  enValue: string,
  mrValue?: string
): string {
  return language === 'mr' && mrValue ? mrValue : enValue;
}

export function getAgentShopName(agent: PvcMakerAgent, language: Language): string {
  return pickLocalized(language, agent.shopName, agent.shopNameMr);
}

export function getAgentName(agent: PvcMakerAgent, language: Language): string {
  return pickLocalized(language, agent.agentName || '', agent.agentNameMr).trim();
}

export function getAgentAddress(agent: PvcMakerAgent, language: Language): string {
  return pickLocalized(language, agent.address, agent.addressMr);
}

export function getAgentLocationLabel(agent: PvcMakerAgent, language: Language): string {
  const parts = [
    pickLocalized(language, agent.village, agent.villageMr),
    pickLocalized(language, agent.taluka, agent.talukaMr),
    pickLocalized(language, agent.district, agent.districtMr),
    pickLocalized(language, agent.state, agent.stateMr),
  ].filter(Boolean);

  // Deduplicate adjacent identical names (e.g. village "Shirur" and taluka "Shirur")
  const deduped = parts.filter(
    (part, idx) => idx === 0 || part.toLowerCase() !== parts[idx - 1].toLowerCase()
  );

  const base = deduped.join(', ');
  return agent.pincode ? `${base} - ${agent.pincode}` : base;
}

export function getAgentServices(agent: PvcMakerAgent, language: Language): string[] {
  return language === 'mr' && agent.servicesMr?.length ? agent.servicesMr : agent.services;
}

export function getAgentTimings(agent: PvcMakerAgent, language: Language): string | undefined {
  return language === 'mr' && agent.timingsMr ? agent.timingsMr : agent.timings;
}

export function getAgentPriceNote(agent: PvcMakerAgent, language: Language): string | undefined {
  return language === 'mr' && agent.priceNoteMr ? agent.priceNoteMr : agent.priceNote;
}

export function getAgentMapsUrl(agent: PvcMakerAgent): string {
  if (agent.mapsUrl) return agent.mapsUrl;
  const query = [agent.shopName, agent.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getAgentTelHref(phone?: string): string {
  const cleaned = (phone || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

export interface DistrictOption {
  value: string;
  label: string;
}

export function getUniqueDistricts(
  makers: PvcMakerAgent[],
  language: Language = 'en'
): DistrictOption[] {
  const seen = new Set<string>();
  const districts: DistrictOption[] = [];
  for (const maker of makers) {
    const clean = maker.district.trim();
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      districts.push({
        value: clean,
        label: pickLocalized(language, clean, maker.districtMr),
      });
    }
  }
  return districts.sort((a, b) => a.label.localeCompare(b.label));
}

function buildSearchableText(agent: PvcMakerAgent): string {
  return [
    agent.shopName,
    agent.shopNameMr,
    agent.agentName,
    agent.agentNameMr,
    agent.village,
    agent.villageMr,
    agent.taluka,
    agent.talukaMr,
    agent.district,
    agent.districtMr,
    agent.state,
    agent.stateMr,
    agent.pincode,
    agent.address,
    agent.addressMr,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function filterPvcMakersByLocation(
  makers: PvcMakerAgent[],
  query: string,
  selectedDistrict: string = ''
): PvcMakerAgent[] {
  const districtFilter = selectedDistrict.trim().toLowerCase();
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter(Boolean);

  return makers.filter((agent) => {
    if (districtFilter && agent.district.trim().toLowerCase() !== districtFilter) {
      return false;
    }
    if (tokens.length === 0) return true;
    const haystack = buildSearchableText(agent);
    return tokens.every((token) => haystack.includes(token));
  });
}

/**
 * Builds the pre-filled WhatsApp message text containing farmer & card details
 * so the user can attach the downloaded card PDF in the chat.
 */
export function buildPvcOrderWhatsAppText(
  agent: PvcMakerAgent,
  options: {
    record?: FarmerRecord | null;
    hasCardData: boolean;
    templateName?: string;
    language: Language;
    searchQuery?: string;
  }
): string {
  const { record, hasCardData, templateName, language, searchQuery } = options;
  const shopName = getAgentShopName(agent, language);

  if (!hasCardData || !record) {
    if (language === 'mr') {
      const lines = [
        `नमस्कार ${shopName},`,
        `मला माझे शेतकरी माहिती कार्ड PVC कार्डवर प्रिंट करायचे आहे.`,
        searchQuery ? `माझे ठिकाण: ${searchQuery}` : '',
        `कृपया प्रिंटिंग शुल्क व प्रक्रिया कळवावी.`,
      ].filter(Boolean);
      return lines.join('\n');
    }

    const lines = [
      `Hello ${shopName},`,
      `I would like to order a PVC print for my Farmer Details Card.`,
      searchQuery ? `My Location: ${searchQuery}` : '',
      `Please share the printing charges and delivery/pickup details.`,
    ].filter(Boolean);
    return lines.join('\n');
  }

  const visibleAddress = (record.address || '').trim();
  const visibleVillage = (record.land_records?.[0]?.village || record.land_detail?.village || '').trim();
  const locationSummary = visibleAddress || visibleVillage || (searchQuery || '').trim();

  const labels =
    language === 'mr'
      ? {
        greeting: `नमस्कार ${shopName},`,
        intro: `मला खालील शेतकरी माहिती कार्ड PVC कार्डवर प्रिंट करून हवे आहे:`,
        name: 'शेतकऱ्याचे नाव',
        farmerId: 'फार्मर नंबर (Farmer ID)',
        pmKisan: 'PM किसान नंबर',
        mobile: 'मोबाईल नंबर',
        location: 'ठिकाण',
        design: 'कार्ड डिझाइन',
        outro: `मी कार्डाची PDF फाइल या संदेशासोबत पाठवत आहे.`,
      }
      : {
        greeting: `Hello ${shopName},`,
        intro: `I would like to order a CR80 PVC print for my Farmer Details Card:`,
        name: 'Farmer Name',
        farmerId: 'Farmer ID',
        pmKisan: 'PM Kisan No.',
        mobile: 'Mobile No.',
        location: 'Location',
        design: 'Card Design',
        outro: `I am attaching the Card PDF file with this message.`,
      };

  const detailLines = [
    record.farmer_name ? `• ${labels.name}: ${record.farmer_name}` : '',
    record.farmer_id ? `• ${labels.farmerId}: ${record.farmer_id}` : '',
    record.enrollment_no ? `• ${labels.pmKisan}: ${record.enrollment_no}` : '',
    record.mobile_number ? `• ${labels.mobile}: ${record.mobile_number}` : '',
    locationSummary ? `• ${labels.location}: ${locationSummary}` : '',
    templateName ? `• ${labels.design}: ${templateName}` : '',
  ].filter(Boolean);

  return [
    labels.greeting,
    labels.intro,
    ...(detailLines.length > 0 ? ['', ...detailLines] : []),
    '',
    labels.outro,
  ].join('\n');
}

export function buildPvcOrderWhatsAppUrl(
  agent: PvcMakerAgent,
  options: {
    record?: FarmerRecord | null;
    hasCardData: boolean;
    templateName?: string;
    language: Language;
    searchQuery?: string;
    allowEmptyRecipient?: boolean;
  }
): string {
  const cleanNumber = (agent.whatsapp || '').replace(/\D/g, '');
  if (!cleanNumber && !options.allowEmptyRecipient) return '';
  const message = buildPvcOrderWhatsAppText(agent, options);
  return cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}
