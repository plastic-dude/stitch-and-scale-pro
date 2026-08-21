import { analyzeTakeRate, CHANNEL_LABELS, type ChannelId, type MarketplaceTakeRateInput, type TakeRateResult } from './marketplace-takerate-lab.js';
import type { McpValidationIssue } from './mcp-contract.js';
import { MCP_CONTRACT_VERSION } from './mcp-contract.js';

const CHANNEL_IDS = Object.keys(CHANNEL_LABELS) as ChannelId[];
const MAX_CHANNELS = 6;
const MAX_TEXT = 24;

export interface McpTakeRateOutput {
  schemaVersion: number;
  calculation: 'marketplace-take-rate';
  calculationVersion: string;
  valid: boolean;
  input?: MarketplaceTakeRateInput;
  result?: TakeRateResult;
  issues: McpValidationIssue[];
  caveats: string[];
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown, fallback: number, min: number, max: number, path: string, issues: McpValidationIssue[], required = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path, code: required && value === undefined ? 'missing' : 'invalid_type', message: `${path} must be a finite number.`, severity: 'error' });
    return fallback;
  }
  if (value < min || value > max) {
    issues.push({ path, code: 'out_of_range', message: `${path} must be between ${min} and ${max}.`, severity: 'error' });
    return Math.min(max, Math.max(min, value));
  }
  return value;
}

function text(value: unknown, fallback: string, path: string, issues: McpValidationIssue[], required = false): string {
  if (typeof value !== 'string' || !value.trim()) {
    issues.push({ path, code: required && value === undefined ? 'missing' : 'invalid_type', message: `${path} must be non-empty text.`, severity: 'error' });
    return fallback;
  }
  return value.trim().slice(0, MAX_TEXT);
}

export function prepareMcpTakeRateCalculation(input: Record<string, unknown>): McpTakeRateOutput {
  const raw = record(input.calculation) ? input.calculation : input;
  const issues: McpValidationIssue[] = [];
  if (!record(input.calculation) && !Array.isArray(input.channels)) {
    issues.push({ path: 'calculation', code: 'missing', message: 'Supply calculation.channels and all fee assumptions explicitly; defaults are not applied by the MCP boundary.', severity: 'error' });
  }
  const rawChannels = Array.isArray(raw.channels) ? raw.channels : [];
  if (rawChannels.length === 0) issues.push({ path: 'calculation.channels', code: 'missing', message: 'At least one explicit marketplace channel is required.', severity: 'error' });
  if (rawChannels.length > MAX_CHANNELS) issues.push({ path: 'calculation.channels', code: 'out_of_range', message: `No more than ${MAX_CHANNELS} channels are supported.`, severity: 'error' });
  const channels = rawChannels.slice(0, MAX_CHANNELS).map((value, index) => {
    const channel = record(value) ? value : {};
    const id = typeof channel.id === 'string' && CHANNEL_IDS.includes(channel.id as ChannelId) ? channel.id as ChannelId : undefined;
    if (!id) issues.push({ path: `calculation.channels[${index}].id`, code: 'invalid_value', message: 'Channel id must be one of the canonical marketplace ids.', severity: 'error' });
    return {
      id: id || 'own-site',
      label: text(channel.label, id ? CHANNEL_LABELS[id] : 'Own site (Stripe)', `calculation.channels[${index}].label`, issues),
      unitsPerMonth: Math.round(finite(channel.unitsPerMonth, 0, 0, 100000, `calculation.channels[${index}].unitsPerMonth`, issues, true)),
      price: finite(channel.price, 0, 0, 100000, `calculation.channels[${index}].price`, issues, true),
      offsiteAdsShare: finite(channel.offsiteAdsShare, 0, 0, 1, `calculation.channels[${index}].offsiteAdsShare`, issues),
      hasAudience: typeof channel.hasAudience === 'boolean' ? channel.hasAudience : false,
    };
  });
  const sellerRegion: MarketplaceTakeRateInput['sellerRegion'] = raw.sellerRegion === 'uk-eu' ? 'uk-eu' : raw.sellerRegion === 'us' ? 'us' : (() => { issues.push({ path: 'calculation.sellerRegion', code: 'missing', message: 'sellerRegion must be explicitly set to us or uk-eu.', severity: 'error' }); return 'us' as const; })();
  const resultInput: MarketplaceTakeRateInput = {
    currency: text(raw.currency, 'USD', 'calculation.currency', issues, true),
    currencySymbol: text(raw.currencySymbol, '$', 'calculation.currencySymbol', issues, true),
    sellerRegion,
    channels,
    offsiteAdsRate: finite(raw.offsiteAdsRate, 0, 0, 1, 'calculation.offsiteAdsRate', issues, true),
    ravelryPayPalPct: finite(raw.ravelryPayPalPct, 0, 0, 1, 'calculation.ravelryPayPalPct', issues, true),
    ravelryPayPalFixed: finite(raw.ravelryPayPalFixed, 0, 0, 100, 'calculation.ravelryPayPalFixed', issues, true),
    ravelryHighTier: typeof raw.ravelryHighTier === 'boolean' ? raw.ravelryHighTier : false,
  };
  if (issues.some(issue => issue.severity === 'error')) return { schemaVersion: MCP_CONTRACT_VERSION, calculation: 'marketplace-take-rate', calculationVersion: 'take-rate-engine-2026-08', valid: false, issues, caveats: ['No result was calculated because the MCP boundary rejected incomplete or unsafe assumptions.'] };
  return { schemaVersion: MCP_CONTRACT_VERSION, calculation: 'marketplace-take-rate', calculationVersion: 'take-rate-engine-2026-08', valid: true, input: resultInput, result: analyzeTakeRate(resultInput), issues: [], caveats: ['This is a deterministic model using the supplied assumptions and the canonical fee schedule; it is not a statement of a platform contract.', 'Confirm current platform fees and seller region before making a commercial decision.', 'The server does not read account data, browse marketplaces, or persist this calculation.'] };
}
