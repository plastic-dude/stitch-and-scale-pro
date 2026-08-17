import { describe, expect, it } from 'vitest';
import { CHANNEL_FUNNEL_COPY } from './channel-funnel-copy';

describe('Channel and Funnel copy catalogue', () => {
  it('contains translated primary vocabulary in all supported locales', () => {
    const locales = Object.values(CHANNEL_FUNNEL_COPY);
    expect(locales).toHaveLength(5);
    for (const copy of locales) {
      expect(copy.title).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.offer).toBeTruthy();
      expect(copy.channelType).toBeTruthy();
      expect(copy.channelName).toBeTruthy();
      expect(copy.channelPlaceholder).toBeTruthy();
      expect(copy.funnel).toBeTruthy();
      expect(copy.pitch).toBeTruthy();
      expect(copy.copied).toBeTruthy();
      expect(copy.copyManual).toBeTruthy();
    }
    expect(CHANNEL_FUNNEL_COPY.de.title).not.toBe(CHANNEL_FUNNEL_COPY.en.title);
    expect(CHANNEL_FUNNEL_COPY.fr.title).not.toBe(CHANNEL_FUNNEL_COPY.en.title);
    expect(CHANNEL_FUNNEL_COPY.es.title).not.toBe(CHANNEL_FUNNEL_COPY.en.title);
    expect(CHANNEL_FUNNEL_COPY.pt.title).not.toBe(CHANNEL_FUNNEL_COPY.en.title);
  });
});
