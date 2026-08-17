import { describe, expect, it } from 'vitest';
import { CONVENTION_BOOTH_COPY } from './convention-booth-copy';
import { INTL_PRICING_COPY } from './intl-pricing-copy';

describe('new lab copy catalogues', () => {
  it('keeps Convention Booth keys in parity across all supported locales', () => {
    const keys = Object.keys(CONVENTION_BOOTH_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(CONVENTION_BOOTH_COPY[locale]).sort()).toEqual(keys);
      expect(CONVENTION_BOOTH_COPY[locale].title).not.toBe('');
      expect(CONVENTION_BOOTH_COPY[locale].description).not.toBe('');
    }
  });

  it('keeps International Pricing keys in parity across all supported locales', () => {
    const keys = Object.keys(INTL_PRICING_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(INTL_PRICING_COPY[locale]).sort()).toEqual(keys);
      expect(INTL_PRICING_COPY[locale].intro).not.toBe('');
      expect(INTL_PRICING_COPY[locale].markets).not.toBe('');
    }
  });
});

import { HIRE_VS_SELF_COPY } from './hire-vs-self-copy';

describe('Hire vs Self copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(HIRE_VS_SELF_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(HIRE_VS_SELF_COPY[locale]).sort()).toEqual(keys);
      expect(HIRE_VS_SELF_COPY[locale].title).not.toBe('');
    }
  });
});

import { PLATFORM_MIX_COPY } from './platform-mix-copy';

describe('Platform Mix copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(PLATFORM_MIX_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(PLATFORM_MIX_COPY[locale]).sort()).toEqual(keys);
      expect(PLATFORM_MIX_COPY[locale].title).not.toBe('');
    }
  });
});

import { PATTERN_CLUB_COPY } from './pattern-club-copy';

describe('Pattern Club copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(PATTERN_CLUB_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(PATTERN_CLUB_COPY[locale]).sort()).toEqual(keys);
      expect(PATTERN_CLUB_COPY[locale].title).not.toBe('');
    }
  });
});

import { INSTALL_BANNER_COPY } from './install-banner-copy';

describe('Install banner copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(INSTALL_BANNER_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(INSTALL_BANNER_COPY[locale]).sort()).toEqual(keys);
      expect(INSTALL_BANNER_COPY[locale].dismiss).not.toBe('');
    }
  });
});

import { CHANNEL_MIGRATION_COPY } from './channel-migration-copy';

describe('Channel Migration copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(CHANNEL_MIGRATION_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(CHANNEL_MIGRATION_COPY[locale]).sort()).toEqual(keys);
      expect(CHANNEL_MIGRATION_COPY[locale].title).not.toBe('');
    }
  });
});

import { CLUB_REVENUE_COPY } from './club-revenue-copy';

describe('Club Revenue copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(CLUB_REVENUE_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(CLUB_REVENUE_COPY[locale]).sort()).toEqual(keys);
      expect(CLUB_REVENUE_COPY[locale].title).not.toBe('');
    }
  });
});

import { COLLAB_DEAL_MATH_COPY } from './collab-deal-math-copy';

describe('Collab Deal Math copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(COLLAB_DEAL_MATH_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(COLLAB_DEAL_MATH_COPY[locale]).sort()).toEqual(keys);
      expect(COLLAB_DEAL_MATH_COPY[locale].title).not.toBe('');
    }
  });
});

import { COLLAB_EVALUATOR_COPY } from './collab-evaluator-copy';

describe('Collab Evaluator copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(COLLAB_EVALUATOR_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(COLLAB_EVALUATOR_COPY[locale]).sort()).toEqual(keys);
      expect(COLLAB_EVALUATOR_COPY[locale].title).not.toBe('');
    }
  });
});

import { DESIGN_LEDGER_COPY } from './design-ledger-copy';

describe('Design Ledger copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(DESIGN_LEDGER_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(DESIGN_LEDGER_COPY[locale]).sort()).toEqual(keys);
      expect(DESIGN_LEDGER_COPY[locale].title).not.toBe('');
      expect(DESIGN_LEDGER_COPY[locale].csvDownloaded).not.toBe('');
    }
  });
});

import { KAL_PLANNER_COPY } from './kal-planner-copy';

describe('KAL Planner copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(KAL_PLANNER_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(KAL_PLANNER_COPY[locale]).sort()).toEqual(keys);
      expect(KAL_PLANNER_COPY[locale].title).not.toBe('');
      expect(KAL_PLANNER_COPY[locale].redFlags).not.toBe('');
    }
  });
});

import { KAL_ROI_COPY } from './kal-roi-copy';

describe('KAL and Collab ROI copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(KAL_ROI_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(KAL_ROI_COPY[locale]).sort()).toEqual(keys);
      expect(KAL_ROI_COPY[locale].title).not.toBe('');
      expect(KAL_ROI_COPY[locale].rights).not.toBe('');
      expect(KAL_ROI_COPY[locale].pitch).not.toBe('');
    }
  });
});

import { KIT_ECONOMICS_COPY } from './kit-economics-copy';

describe('Kit Economics copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(KIT_ECONOMICS_COPY.en).sort();
    for (const locale of ['de','fr','es','pt'] as const) {
      expect(Object.keys(KIT_ECONOMICS_COPY[locale]).sort()).toEqual(keys);
      expect(KIT_ECONOMICS_COPY[locale].title).not.toBe('');
      expect(KIT_ECONOMICS_COPY[locale].checklist).not.toBe('');
      expect(KIT_ECONOMICS_COPY[locale].proposal).not.toBe('');
    }
  });
});

import { LAUNCH_CAMPAIGN_COPY } from './launch-campaign-copy';

describe('Launch Campaign copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(LAUNCH_CAMPAIGN_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(LAUNCH_CAMPAIGN_COPY[locale]).sort()).toEqual(keys);
      expect(LAUNCH_CAMPAIGN_COPY[locale].title).not.toBe('');
      expect(LAUNCH_CAMPAIGN_COPY[locale].gates).not.toBe('');
      expect(LAUNCH_CAMPAIGN_COPY[locale].timeline).not.toBe('');
      expect(LAUNCH_CAMPAIGN_COPY[locale].reset).not.toBe('');
    }
  });
});

import { LISTING_SEO_COPY } from './listing-seo-copy';

describe('Listing SEO copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(LISTING_SEO_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(LISTING_SEO_COPY[locale]).sort()).toEqual(keys);
      expect(LISTING_SEO_COPY[locale].title).not.toBe('');
      expect(LISTING_SEO_COPY[locale].netSale).not.toBe('');
      expect(LISTING_SEO_COPY[locale].copyKit).not.toBe('');
      expect(LISTING_SEO_COPY[locale].momentum).not.toBe('');
    }
  });
});

import { LISTING_TEST_COPY } from './listing-test-copy';

describe('Listing Test Lab copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(LISTING_TEST_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(LISTING_TEST_COPY[locale]).sort()).toEqual(keys);
      expect(LISTING_TEST_COPY[locale].title).not.toBe('');
      expect(LISTING_TEST_COPY[locale].honestMath).not.toBe('');
      expect(LISTING_TEST_COPY[locale].warnings).not.toBe('');
      expect(LISTING_TEST_COPY[locale].verdict).not.toBe('');
    }
  });
});

import { LOOKBOOK_DESK_COPY } from './lookbook-desk-copy';

describe('Lookbook Desk copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(LOOKBOOK_DESK_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(LOOKBOOK_DESK_COPY[locale]).sort()).toEqual(keys);
      expect(LOOKBOOK_DESK_COPY[locale].title).not.toBe('');
      expect(LOOKBOOK_DESK_COPY[locale].shootTier).not.toBe('');
      expect(LOOKBOOK_DESK_COPY[locale].shotList).not.toBe('');
      expect(Object.keys(LOOKBOOK_DESK_COPY[locale].platforms)).toEqual(Object.keys(LOOKBOOK_DESK_COPY.en.platforms));
    }
  });
});

import { MAGAZINE_SUBMISSION_COPY } from './magazine-submission-copy';

describe('Magazine Submission Lab copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(MAGAZINE_SUBMISSION_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(MAGAZINE_SUBMISSION_COPY[locale]).sort()).toEqual(keys);
      expect(MAGAZINE_SUBMISSION_COPY[locale].title).not.toBe('');
      expect(MAGAZINE_SUBMISSION_COPY[locale].dealStructure).not.toBe('');
      expect(MAGAZINE_SUBMISSION_COPY[locale].dealVsSelf).not.toBe('');
      expect(MAGAZINE_SUBMISSION_COPY[locale].watchouts).not.toBe('');
    }
  });
});

import { MARKETPLACE_TAKERATE_COPY } from './marketplace-takerate-copy';

describe('Marketplace Take-rate copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(MARKETPLACE_TAKERATE_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(MARKETPLACE_TAKERATE_COPY[locale]).sort()).toEqual(keys);
      expect(MARKETPLACE_TAKERATE_COPY[locale].title).not.toBe('');
      expect(MARKETPLACE_TAKERATE_COPY[locale].monthlyUnits).not.toBe('');
      expect(MARKETPLACE_TAKERATE_COPY[locale].leaderboard).not.toBe('');
      expect(Object.keys(MARKETPLACE_TAKERATE_COPY[locale].channels)).toEqual(Object.keys(MARKETPLACE_TAKERATE_COPY.en.channels));
    }
  });
});

import { MEMBERSHIP_SITE_COPY } from './membership-site-copy';

describe('Membership Site Lab copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(MEMBERSHIP_SITE_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(MEMBERSHIP_SITE_COPY[locale]).sort()).toEqual(keys);
      expect(MEMBERSHIP_SITE_COPY[locale].title).not.toBe('');
      expect(MEMBERSHIP_SITE_COPY[locale].audience).not.toBe('');
      expect(MEMBERSHIP_SITE_COPY[locale].numbers).not.toBe('');
      expect(Object.keys(MEMBERSHIP_SITE_COPY[locale].channels)).toEqual(Object.keys(MEMBERSHIP_SITE_COPY.en.channels));
    }
  });
});

import { PATTERN_BUNDLE_COPY } from './pattern-bundle-copy';

describe('Pattern Bundle Lab copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(PATTERN_BUNDLE_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(PATTERN_BUNDLE_COPY[locale]).sort()).toEqual(keys);
      expect(PATTERN_BUNDLE_COPY[locale].title).not.toBe('');
      expect(PATTERN_BUNDLE_COPY[locale].patterns).not.toBe('');
      expect(PATTERN_BUNDLE_COPY[locale].dealMath).not.toBe('');
      expect(PATTERN_BUNDLE_COPY[locale].verdict).not.toBe('');
    }
  });
});

import { PAYBACK_COPY } from './payback-copy';

describe('Payback Lab copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(PAYBACK_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(PAYBACK_COPY[locale]).sort()).toEqual(keys);
      expect(PAYBACK_COPY[locale].title).not.toBe('');
      expect(PAYBACK_COPY[locale].rateLabel).not.toBe('');
      expect(PAYBACK_COPY[locale].localFirst).not.toBe('');
    }
  });
});


import { POD_BOOK_COPY } from './pod-book-copy';

describe('POD Book copy catalogue', () => {
  it('keeps all supported locale keys aligned', () => {
    const keys = Object.keys(POD_BOOK_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(POD_BOOK_COPY[locale]).sort()).toEqual(keys);
      expect(POD_BOOK_COPY[locale].title).not.toBe('');
      expect(POD_BOOK_COPY[locale].description).not.toBe('');
      expect(POD_BOOK_COPY[locale].copySummary).not.toBe('');
    }
  });
});


import { PRICING_ADVISOR_COPY } from './pricing-advisor-copy';

describe('Pricing Advisor copy catalogue', () => {
  it('keeps all supported locale keys and option maps aligned', () => {
    const keys = Object.keys(PRICING_ADVISOR_COPY.en).sort();
    const itemKeys = Object.keys(PRICING_ADVISOR_COPY.en.itemTypes).sort();
    const skillKeys = Object.keys(PRICING_ADVISOR_COPY.en.skills).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(PRICING_ADVISOR_COPY[locale]).sort()).toEqual(keys);
      expect(Object.keys(PRICING_ADVISOR_COPY[locale].itemTypes).sort()).toEqual(itemKeys);
      expect(Object.keys(PRICING_ADVISOR_COPY[locale].skills).sort()).toEqual(skillKeys);
      expect(PRICING_ADVISOR_COPY[locale].title).not.toBe('');
      expect(PRICING_ADVISOR_COPY[locale].disclosure).not.toBe('');
    }
  });
});


import { PRICE_WINDOW_COPY } from './price-window-copy';

describe('Price Window copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(PRICE_WINDOW_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(PRICE_WINDOW_COPY[locale]).sort()).toEqual(keys);
      expect(PRICE_WINDOW_COPY[locale].title).not.toBe('');
      expect(PRICE_WINDOW_COPY[locale].description).not.toBe('');
      expect(PRICE_WINDOW_COPY[locale].discountHint).not.toBe('');
      expect(PRICE_WINDOW_COPY[locale].seasonMap).not.toBe('');
    }
  });
});


import { RETENTION_COPY } from './retention-copy';

describe('Retention Planner copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(RETENTION_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(RETENTION_COPY[locale]).sort()).toEqual(keys);
      expect(RETENTION_COPY[locale].title).not.toBe('');
      expect(RETENTION_COPY[locale].description).not.toBe('');
      expect(RETENTION_COPY[locale].benchmark).not.toBe('');
      expect(RETENTION_COPY[locale].advantage).not.toBe('');
    }
  });
});


import { LAUNCH_CAMPAIGN_COPY } from './launch-campaign-copy';

describe('Launch Campaign copy catalogue', () => {
  it('keeps all supported locale keys aligned and date summaries populated', () => {
    const keys = Object.keys(LAUNCH_CAMPAIGN_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(LAUNCH_CAMPAIGN_COPY[locale]).sort()).toEqual(keys);
      expect(LAUNCH_CAMPAIGN_COPY[locale].title).not.toBe('');
      expect(LAUNCH_CAMPAIGN_COPY[locale].launchDateSummary('Saturday')).not.toBe('');
      expect(LAUNCH_CAMPAIGN_COPY[locale].ravelryPlaceholder).toContain('ravelry');
      expect(LAUNCH_CAMPAIGN_COPY[locale].reset).not.toBe('');
    }
  });
});


import { STORAGE_COPY } from './storage-copy';

describe('Storage Badge copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(STORAGE_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(STORAGE_COPY[locale]).sort()).toEqual(keys);
      expect(STORAGE_COPY[locale].aria).not.toBe('');
      expect(STORAGE_COPY[locale].warning).not.toBe('');
      expect(STORAGE_COPY[locale].backup).not.toBe('');
    }
  });
});

import { SUBMISSION_PIPELINE_COPY } from './submission-pipeline-copy';
describe('Submission Pipeline copy catalogue', () => {
  it('keeps all supported locale keys aligned and populated', () => {
    const keys = Object.keys(SUBMISSION_PIPELINE_COPY.en).sort();
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(Object.keys(SUBMISSION_PIPELINE_COPY[locale]).sort()).toEqual(keys);
      expect(SUBMISSION_PIPELINE_COPY[locale].title).not.toBe('');
      expect(SUBMISSION_PIPELINE_COPY[locale].description).not.toBe('');
      expect(SUBMISSION_PIPELINE_COPY[locale].submissionPack).not.toBe('');
      expect(SUBMISSION_PIPELINE_COPY[locale].copyCoverLetter).not.toBe('');
    }
  });
});

