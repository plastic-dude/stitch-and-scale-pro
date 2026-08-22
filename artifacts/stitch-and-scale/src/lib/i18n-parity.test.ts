import { describe, it, expect } from 'vitest';
import * as landing from './landing-copy';
import * as grading from './grading-copy';
import * as chart from './chart-copy';
import * as workspace from './workspace-copy';
import * as settings from './settings-copy';
import * as toast from './toast-copy';
import * as portfolio from './portfolio-copy';
import * as revenueGrowth from './revenue-growth-copy';
import * as releaseTiming from './release-timing-copy';
import * as consignmentReprice from './consignment-reprice-copy';
import * as adBreakEven from './ad-break-even-copy';
import * as brag from './brag-copy';
import * as copyright from './copyright-copy';
import * as pricingAdvisor from './pricing-advisor-copy';
import * as workspaceTabLabels from './workspace-tab-labels';
import * as launchCampaign from './launch-campaign-copy';
import * as partner from './partner-copy';
import * as photoRoi from './photo-roi-copy';
import * as studioProfile from './studio-profile-copy';
import * as translationBundle from './translation-bundle-copy';
import * as testknitDesk from './testknit-desk-copy';

// P2: CI/CD Locale Parity Gate
// This test suite ensures that all supported locales have 1:1 key parity with English.
// It is part of the mandatory gate sequence to prevent English leaks in UI.

const LOCALES = ['de', 'fr', 'es', 'pt'] as const;

function checkParity(copyObj: any, fileName: string) {
  const COPY = copyObj.COPY || copyObj.default || copyObj;
  if (!COPY || !COPY.en) {
    it(`${fileName} has valid COPY export`, () => {
      throw new Error(`${fileName}: Missing exported COPY object with 'en' key.`);
    });
    return;
  }

  const enKeys = Object.keys(COPY.en).sort();

  LOCALES.forEach(locale => {
    it(`${fileName} has parity for [${locale}]`, () => {
      if (!COPY[locale]) {
        throw new Error(`${fileName}: Locale [${locale}] is missing entirely.`);
      }
      const locKeys = Object.keys(COPY[locale]).sort();
      
      const missing = enKeys.filter(k => !locKeys.includes(k));
      const extra = locKeys.filter(k => !enKeys.includes(k));

      if (missing.length > 0 || extra.length > 0) {
        let msg = `${fileName} [${locale}] mismatch:\n`;
        if (missing.length > 0) msg += `  MISSING KEYS: ${missing.join(', ')}\n`;
        if (extra.length > 0) msg += `  EXTRA KEYS: ${extra.join(', ')}\n`;
        throw new Error(msg);
      }
      
      // Deep parity for nested objects
      enKeys.forEach(key => {
        const enVal = COPY.en[key];
        const locVal = COPY[locale][key];
        
        // Skip functions as they can't be easily compared for parity beyond existence
        if (typeof enVal === 'function') {
          expect(typeof locVal, `${fileName} [${locale}] key [${key}] should be a function`).toBe('function');
          return;
        }

        if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
          const enSubKeys = Object.keys(enVal).sort();
          const locSubKeys = Object.keys(locVal || {}).sort();
          
          const subMissing = enSubKeys.filter(k => !locSubKeys.includes(k));
          const subExtra = locSubKeys.filter(k => !enSubKeys.includes(k));

          if (subMissing.length > 0 || subExtra.length > 0) {
            let msg = `${fileName} [${locale}] nested key [${key}] mismatch:\n`;
            if (subMissing.length > 0) msg += `  MISSING SUB-KEYS: ${subMissing.join(', ')}\n`;
            if (subExtra.length > 0) msg += `  EXTRA SUB-KEYS: ${subExtra.join(', ')}\n`;
            throw new Error(msg);
          }
        }
      });
    });
  });
}

describe('I18n Locale Parity', () => {
  // Add all copy files here as they are created
  checkParity(landing, 'landing-copy.ts');
  checkParity(grading, 'grading-copy.ts');
  checkParity(chart, 'chart-copy.ts');
  checkParity(workspace, 'workspace-copy.ts');
  checkParity(settings, 'settings-copy.ts');
  checkParity(toast, 'toast-copy.ts');
  checkParity(portfolio, 'portfolio-copy.ts');
  checkParity(revenueGrowth, 'revenue-growth-copy.ts');
  checkParity(releaseTiming, 'release-timing-copy.ts');
  checkParity(consignmentReprice, 'consignment-reprice-copy.ts');
  checkParity(adBreakEven, 'ad-break-even-copy.ts');
  checkParity(brag, 'brag-copy.ts');
  checkParity(copyright, 'copyright-copy.ts');
  checkParity(pricingAdvisor, 'pricing-advisor-copy.ts');
  checkParity(workspaceTabLabels, 'workspace-tab-labels.ts');
  checkParity(launchCampaign, 'launch-campaign-copy.ts');
  checkParity(partner, 'partner-copy.ts');
  checkParity(photoRoi, 'photo-roi-copy.ts');
  checkParity(studioProfile, 'studio-profile-copy.ts');
  checkParity(translationBundle, 'translation-bundle-copy.ts');
  checkParity(testknitDesk, 'testknit-desk-copy.ts');
});
