import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  containsArabic,
  expandArabicGlossary,
  expandArabicGlossaryGroups,
  resolveCatalogSearchQuery,
  resolveEnglishSearchTerms,
  productMatchesSearchTerms,
  productMatchesSearchQuery,
} from '@/shared/services/localization/catalog-i18n';
import type { Product } from '@/shared/types/catalog';

const chairProduct = {
  id: 1,
  title: 'Modern Ergonomic Office Chair',
  slug: 'chair',
  price: 10,
  description: 'Also mentions toaster and headphones in the marketing copy',
  images: [],
  category: {
    id: 1,
    name: 'Furniture',
    slug: 'furniture',
    imageUrl: '',
    createdAt: null,
    updatedAt: null,
  },
  createdAt: null,
  updatedAt: null,
} satisfies Product;

const lampProduct = {
  ...chairProduct,
  id: 2,
  title: 'Golden Desk Lamp',
  slug: 'lamp',
  category: { ...chairProduct.category, name: 'Lighting' },
} satisfies Product;

describe('containsArabic', () => {
  it('detects Arabic script', () => {
    expect(containsArabic('كرسي')).toBe(true);
    expect(containsArabic('هاتف ذكي')).toBe(true);
  });

  it('returns false for Latin-only text', () => {
    expect(containsArabic('chair')).toBe(false);
    expect(containsArabic('Smart Phone')).toBe(false);
  });
});

describe('expandArabicGlossary', () => {
  it('maps common Arabic catalog terms to English', () => {
    expect(expandArabicGlossary('كرسي')).toEqual(expect.arrayContaining(['chair']));
    expect(expandArabicGlossary('سماعات')).toEqual(
      expect.arrayContaining(['headphones']),
    );
    expect(expandArabicGlossary('لابتوب')).toEqual(expect.arrayContaining(['laptop']));
  });

  it('does not expand single-character Arabic into unrelated terms', () => {
    expect(expandArabicGlossary('ا')).toEqual([]);
    expect(expandArabicGlossary('س')).toEqual([]);
  });

  it('requires every token group for multi-word Arabic', () => {
    const groups = expandArabicGlossaryGroups('كرسي مكتب');
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups[0]).toEqual(expect.arrayContaining(['chair']));
    expect(groups.some((group) => group.includes('office'))).toBe(true);
  });
});

describe('resolveEnglishSearchTerms', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          responseStatus: 429,
          responseData: {
            translatedText:
              'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.',
          },
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('still resolves Arabic via glossary when MyMemory is rate-limited', async () => {
    const terms = await resolveEnglishSearchTerms('كرسي');
    expect(terms[0]).toBe('chair');
    expect(terms.every((term) => !term.includes('MYMEMORY'))).toBe(true);
  });

  it('ignores quota warning text as a translation', async () => {
    await expect(resolveCatalogSearchQuery('كرسي')).resolves.toBe('chair');
  });

  it('passes English queries through unchanged', async () => {
    await expect(resolveEnglishSearchTerms('lamp')).resolves.toEqual(['lamp']);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns no terms for unknown Arabic when translation fails', async () => {
    await expect(resolveEnglishSearchTerms('بيتزاxyz')).resolves.toEqual([]);
  });
});

describe('productMatchesSearchTerms', () => {
  it('matches English terms against title/category only', () => {
    expect(productMatchesSearchTerms(chairProduct, ['chair'])).toBe(true);
    expect(productMatchesSearchTerms(chairProduct, ['toaster'])).toBe(false);
    expect(productMatchesSearchTerms(chairProduct, [])).toBe(false);
  });
});

describe('productMatchesSearchQuery', () => {
  it('rejects description-only noise', () => {
    expect(productMatchesSearchQuery(chairProduct, 'headphones', ['headphones'])).toBe(
      false,
    );
  });

  it('matches Arabic chair queries to chairs only', () => {
    expect(productMatchesSearchQuery(chairProduct, 'كرسي', ['chair'])).toBe(true);
    expect(productMatchesSearchQuery(lampProduct, 'كرسي', ['chair'])).toBe(false);
  });

  it('requires all English words', () => {
    expect(productMatchesSearchQuery(chairProduct, 'office chair', ['office', 'chair'])).toBe(
      true,
    );
    expect(productMatchesSearchQuery(lampProduct, 'office chair', ['office', 'chair'])).toBe(
      false,
    );
  });

  it('requires all Arabic glossary token groups', () => {
    expect(
      productMatchesSearchQuery(chairProduct, 'كرسي مكتب', ['chair', 'office']),
    ).toBe(true);
    expect(
      productMatchesSearchQuery(lampProduct, 'كرسي مكتب', ['chair', 'office']),
    ).toBe(false);
  });
});
