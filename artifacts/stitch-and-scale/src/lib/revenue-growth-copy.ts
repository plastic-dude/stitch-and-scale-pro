import type { LanguageCode } from '@/lib/i18n';

export interface RevenueGrowthCopy {
  title: string;
  description: string;
  tabPricing: string;
  tabGrowth: string;
  tabMetrics: string;
  pricingDisclaimer: string;
  metricLabel: string;
  metricTarget: string;
  metricInsight: string;
}

const en: RevenueGrowthCopy = {
  title: 'Revenue & Growth Planner',
  description: 'Evidence-led pricing hypotheses and organic growth experiments based on the August 2026 strategic audit.',
  tabPricing: 'Pricing Hypotheses',
  tabGrowth: 'Growth Pillars',
  tabMetrics: 'Beta Metrics',
  pricingDisclaimer: 'These are hypotheses for monetization testing, not committed product prices. A hobbyist mother and a professional designer have different value profiles; validate with paid pilots before scaling.',
  metricLabel: 'Metric',
  metricTarget: 'Target',
  metricInsight: 'Strategic Insight',
};

const de: RevenueGrowthCopy = {
  title: 'Umsatz- & Wachstumsplaner',
  description: 'Evidenzbasierte Preishypothesen und organische Wachstumsexperimente basierend auf dem Audit vom August 2026.',
  tabPricing: 'Preishypothesen',
  tabGrowth: 'Wachstumssäulen',
  tabMetrics: 'Beta-Metriken',
  pricingDisclaimer: 'Dies sind Hypothesen für Monetarisierungstests, keine verbindlichen Produktpreise. Eine hobbymäßig strickende Mutter und ein professioneller Designer haben unterschiedliche Wertprofile; validiere dies mit bezahlten Piloten, bevor du skalierst.',
  metricLabel: 'Metrik',
  metricTarget: 'Ziel',
  metricInsight: 'Strategische Erkenntnis',
};

const fr: RevenueGrowthCopy = {
  title: 'Planificateur de revenus et croissance',
  description: 'Hypothèses de tarification basées sur des preuves et expériences de croissance organique selon l’audit d’août 2026.',
  tabPricing: 'Hypothèses de prix',
  tabGrowth: 'Piliers de croissance',
  tabMetrics: 'Indicateurs bêta',
  pricingDisclaimer: 'Il s’agit d’hypothèses pour les tests de monétisation, et non de prix de produits définitifs. Une mère de famille pratiquant le tricot comme loisir et un designer professionnel ont des profils de valeur différents ; validez avec des pilotes payants avant de passer à l’échelle.',
  metricLabel: 'Indicateur',
  metricTarget: 'Objectif',
  metricInsight: 'Vision stratégique',
};

const es: RevenueGrowthCopy = {
  title: 'Planificador de ingresos y crecimiento',
  description: 'Hipótesis de precios basadas en evidencia y experimentos de crecimiento orgánico según la auditoría de agosto de 2026.',
  tabPricing: 'Hipótesis de precios',
  tabGrowth: 'Pilares de crecimiento',
  tabMetrics: 'Métricas beta',
  pricingDisclaimer: 'Estas son hipótesis para pruebas de monetización, no precios de productos definitivos. Una madre aficionada al tejido y un diseñador profesional tienen perfiles de valor diferentes; valida con pilotos de pago antes de escalar.',
  metricLabel: 'Métrica',
  metricTarget: 'Objetivo',
  metricInsight: 'Visión estratégica',
};

const pt: RevenueGrowthCopy = {
  title: 'Planeador de Receita e Crescimento',
  description: 'Hipóteses de preços baseadas em evidências e experiências de crescimento orgânico de acordo com a auditoria de agosto de 2026.',
  tabPricing: 'Hipóteses de Preços',
  tabGrowth: 'Pilares de Crescimento',
  tabMetrics: 'Métricas Beta',
  pricingDisclaimer: 'Estas são hipóteses para testes de monetização, não preços definitivos de produtos. Uma mãe que faz tricô como passatempo e um designer profissional têm perfis de valor diferentes; valide com pilotos pagos antes de escalar.',
  metricLabel: 'Métrica',
  metricTarget: 'Meta',
  metricInsight: 'Visão Estratégica',
};

export const REVENUE_GROWTH_COPY: Record<LanguageCode, RevenueGrowthCopy> = { en, de, fr, es, pt };
