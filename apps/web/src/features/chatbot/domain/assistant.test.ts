import { describe, expect, it } from 'vitest';
import {
  detectIntent,
  extractSearchQuery,
  resolveSearchTerm,
} from '@/features/chatbot/domain/assistant';

describe('chatbot assistant', () => {
  it('detects FAQ intents in Arabic and English', () => {
    expect(detectIntent('مرحبا')).toBe('greeting');
    expect(detectIntent('help please')).toBe('help');
    expect(detectIntent('كيف التوصيل؟')).toBe('shipping');
    expect(detectIntent('طرق الدفع')).toBe('payment');
  });

  it('extracts search queries with prefixes', () => {
    expect(extractSearchQuery('ابحث عن chair')).toBe('chair');
    expect(extractSearchQuery('search shoes')).toBe('shoes');
    expect(resolveSearchTerm('laptop')).toBe('laptop');
  });
});
