// CHK-145 localization module — Pre-Order Campaign Lab labels (was bare English).
import type { LanguageCode } from '@/lib/i18n';

export interface PreorderCampaignCopy {
  earlyBirdPriceLabel: string;
  garmentPriceLabel: string;
  earlyBirdShare: string;
  platformFee: string;
  campaignDays: string;
  leadTime: string;
  materialsPerUnit: string;
  knitHrsPerUnit: string;
  laborRate: string;
  fixedSeriesCosts: string;
  fulfillmentHrsPerUnit: string;
  shippingPerUnit: string;
  safetyMargin: string;
  bufferStock: string;
  emailListSize: string;
  waitlistSize: string;
  socialExpectedOrders: string;
  thresholdShareOfPredicted: string;
  pickYarn: string;
}

const en: PreorderCampaignCopy = {
  earlyBirdPriceLabel: 'Early-bird price ($)',
  garmentPriceLabel: 'Garment price ($)',
  earlyBirdShare: 'Early-bird share',
  platformFee: 'Platform fee',
  campaignDays: 'Campaign days',
  leadTime: 'Lead time',
  materialsPerUnit: 'Materials / unit',
  knitHrsPerUnit: 'Knit hrs / unit',
  laborRate: 'Labor rate',
  fixedSeriesCosts: 'Fixed series costs',
  fulfillmentHrsPerUnit: 'Fulfillment hrs / unit',
  shippingPerUnit: 'Shipping / unit',
  safetyMargin: 'Safety margin',
  bufferStock: 'Buffer stock',
  emailListSize: 'Email list size',
  waitlistSize: 'Waitlist size',
  socialExpectedOrders: 'Social expected orders',
  thresholdShareOfPredicted: 'Threshold share of predicted',
  pickYarn: 'Pick a yarn...',
};

const de: PreorderCampaignCopy = {
  ...en,
  earlyBirdPriceLabel: 'Frühbucher-Preis ($)',
  garmentPriceLabel: 'Preis des Kleidungsstücks ($)',
  earlyBirdShare: 'Frühbucher-Anteil',
  platformFee: 'Plattformgebühr',
  campaignDays: 'Kampagnentage',
  leadTime: 'Vorlaufzeit',
  materialsPerUnit: 'Material / Stück',
  knitHrsPerUnit: 'Strickstunden / Stück',
  laborRate: 'Stundensatz',
  fixedSeriesCosts: 'Fixkosten der Serie',
  fulfillmentHrsPerUnit: 'Versandabwicklung / Stück',
  shippingPerUnit: 'Versand / Stück',
  safetyMargin: 'Sicherheitsmarge',
  bufferStock: 'Pufferbestand',
  emailListSize: 'Größe der E-Mail-Liste',
  waitlistSize: 'Größe der Warteliste',
  socialExpectedOrders: 'Erwartete Social-Bestellungen',
  thresholdShareOfPredicted: 'Schwellenanteil der Prognose',
  pickYarn: 'Garn auswählen …',
};

const fr: PreorderCampaignCopy = {
  ...en,
  earlyBirdPriceLabel: 'Prix early-bird ($)',
  garmentPriceLabel: 'Prix du vêtement ($)',
  earlyBirdShare: 'Part des acheteurs early-bird',
  platformFee: 'Frais de plateforme',
  campaignDays: 'Jours de campagne',
  leadTime: 'Délai de production',
  materialsPerUnit: 'Matériel / unité',
  knitHrsPerUnit: 'Heures de tricot / unité',
  laborRate: 'Taux horaire',
  fixedSeriesCosts: 'Coûts fixes de la série',
  fulfillmentHrsPerUnit: 'Expédition / unité',
  shippingPerUnit: 'Livraison / unité',
  safetyMargin: 'Marge de sécurité',
  bufferStock: 'Stock tampon',
  emailListSize: 'Taille de la liste e-mail',
  waitlistSize: 'Taille de la liste d\u2019attente',
  socialExpectedOrders: 'Commandes sociales prévues',
  thresholdShareOfPredicted: 'Seuil en part des prévisions',
  pickYarn: 'Choisir une laine…',
};

const es: PreorderCampaignCopy = {
  ...en,
  earlyBirdPriceLabel: 'Precio early-bird ($)',
  garmentPriceLabel: 'Precio de la prenda ($)',
  earlyBirdShare: 'Proporción de compradores early-bird',
  platformFee: 'Comisión de plataforma',
  campaignDays: 'Días de campaña',
  leadTime: 'Tiempo de preparación',
  materialsPerUnit: 'Material / unidad',
  knitHrsPerUnit: 'Horas de tejido / unidad',
  laborRate: 'Tarifa por hora',
  fixedSeriesCosts: 'Costes fijos de la serie',
  fulfillmentHrsPerUnit: 'Gestión de envío / unidad',
  shippingPerUnit: 'Envío / unidad',
  safetyMargin: 'Margen de seguridad',
  bufferStock: 'Stock de reserva',
  emailListSize: 'Tamaño de la lista de correo',
  waitlistSize: 'Tamaño de la lista de espera',
  socialExpectedOrders: 'Pedidos sociales previstos',
  thresholdShareOfPredicted: 'Umbral en parte de lo previsto',
  pickYarn: 'Elige un hilo…',
};

const pt: PreorderCampaignCopy = {
  ...en,
  earlyBirdPriceLabel: 'Preço early-bird ($)',
  garmentPriceLabel: 'Preço da peça ($)',
  earlyBirdShare: 'Parcela de compradores early-bird',
  platformFee: 'Taxa da plataforma',
  campaignDays: 'Dias de campanha',
  leadTime: 'Tempo de preparação',
  materialsPerUnit: 'Material / unidade',
  knitHrsPerUnit: 'Horas de tricô / unidade',
  laborRate: 'Valor por hora',
  fixedSeriesCosts: 'Custos fixos da série',
  fulfillmentHrsPerUnit: 'Processamento de envio / unidade',
  shippingPerUnit: 'Frete / unidade',
  safetyMargin: 'Margem de segurança',
  bufferStock: 'Estoque de reserva',
  emailListSize: 'Tamanho da lista de e-mail',
  waitlistSize: 'Tamanho da lista de espera',
  socialExpectedOrders: 'Pedidos sociais previstos',
  thresholdShareOfPredicted: 'Limiar em parte do previsto',
  pickYarn: 'Escolha um fio…',
};

export const PREORDER_CAMPAIGN_COPY: Record<LanguageCode, PreorderCampaignCopy> = {
  en, de, fr, es, pt,
};

export function getPreorderCampaignCopy(language: LanguageCode): PreorderCampaignCopy {
  return PREORDER_CAMPAIGN_COPY[language] ?? PREORDER_CAMPAIGN_COPY.en;
}
