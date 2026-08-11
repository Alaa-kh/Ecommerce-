import type { Category, Product } from '@/shared/types/catalog';

const cache = new Map<string, string>();
const STORAGE_KEY = 'lumina.translate.cache.v1';

/** Common Fake Store / catalog terms — works offline when MyMemory is rate-limited. */
const ARABIC_GLOSSARY: Record<string, string[]> = {
  كرسي: ['chair', 'armchair'],
  كراسي: ['chair', 'armchair'],
  طاولة: ['table', 'dining'],
  طاولات: ['table', 'dining'],
  أريكة: ['sofa', 'leather'],
  اريكة: ['sofa', 'leather'],
  كنبة: ['sofa'],
  سرير: ['bed'],
  مصباح: ['lamp', 'lighting'],
  هاتف: ['phone'],
  جوال: ['phone'],
  موبايل: ['phone'],
  ساعة: ['watch', 'smartwatch'],
  حاسوب: ['laptop', 'computer'],
  لابتوب: ['laptop'],
  كمبيوتر: ['computer', 'laptop'],
  سماعات: ['headphones', 'headphone', 'earbud'],
  سماعة: ['headphones', 'headphone', 'earbud'],
  فأرة: ['mouse'],
  ماوس: ['mouse'],
  حقيبة: ['bag'],
  قبعة: ['cap', 'baseball'],
  قميص: ['shirt', 'tee', 't-shirt'],
  تيشرت: ['shirt', 'tee'],
  حذاء: ['shoes', 'shoe'],
  أحذية: ['shoes', 'shoe'],
  كنترولر: ['controller', 'gaming'],
  ذراع: ['controller'],
  محمصة: ['toaster'],
  أثاث: ['furniture'],
  اثاث: ['furniture'],
  إلكترونيات: ['electronics'],
  الكترونيات: ['electronics'],
  ملابس: ['clothes', 'shirt', 'tee'],
  جلد: ['leather'],
  لاسلكي: ['wireless'],
  حديث: ['modern', 'sleek'],
  عصري: ['modern', 'sleek'],
  أنيق: ['sleek', 'elegant', 'stylish'],
  ابيض: ['white'],
  أبيض: ['white'],
  أسود: ['black'],
  اسود: ['black'],
  أحمر: ['red'],
  احمر: ['red'],
  ذهبي: ['golden', 'gold'],
  خشبي: ['wooden', 'wood'],
  مكتب: ['office'],
  طعام: ['dining'],
  ألعاب: ['gaming', 'game'],
  العاب: ['gaming', 'game'],
};

function isBadTranslation(value: string): boolean {
  const upper = value.toUpperCase();
  return (
    upper.includes('MYMEMORY WARNING') ||
    upper.includes('AVAILABLE FREE TRANSLATIONS') ||
    upper.includes('QUERY LENGTH LIMIT') ||
    upper.includes('INVALID') ||
    upper.includes('ERROR')
  );
}

function loadCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' && !isBadTranslation(value)) {
        cache.set(key, value);
      }
    }
  } catch {
    // ignore
  }
}

function persistCache() {
  try {
    const obj: Record<string, string> = {};
    let i = 0;
    for (const [key, value] of cache.entries()) {
      if (isBadTranslation(value)) continue;
      obj[key] = value;
      i += 1;
      if (i >= 400) break;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

loadCache();

export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'for',
  'to',
  'in',
  'on',
  'with',
  'from',
  'by',
  'at',
  'is',
  'are',
  'this',
  'that',
]);

/** Drop junk / too-short terms that would match almost anything. */
export function isUsableSearchTerm(term: string): boolean {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 3) return false;
  if (SEARCH_STOP_WORDS.has(normalized)) return false;
  if (containsArabic(normalized)) return false;
  if (isBadTranslation(normalized)) return false;
  return true;
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const normalized = term.trim().toLowerCase();
    if (!isUsableSearchTerm(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function glossarySynonymsForToken(token: string): string[] {
  const exact = ARABIC_GLOSSARY[token];
  if (exact) return uniqueTerms(exact);

  // Prefix only (min 3 chars) — avoids single-letter / substring false positives.
  if (token.length < 3) return [];
  const hits: string[] = [];
  for (const [arabic, english] of Object.entries(ARABIC_GLOSSARY)) {
    if (arabic.startsWith(token) || token.startsWith(arabic)) {
      hits.push(...english);
    }
  }
  return uniqueTerms(hits);
}

/** Synonym groups per Arabic token — used for AND matching across tokens. */
export function expandArabicGlossaryGroups(query: string): string[][] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const exact = ARABIC_GLOSSARY[trimmed];
  if (exact) return [uniqueTerms(exact)];

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const groups: string[][] = [];
  for (const token of tokens) {
    const synonyms = glossarySynonymsForToken(token);
    if (synonyms.length > 0) groups.push(synonyms);
  }
  return groups;
}

export function expandArabicGlossary(query: string): string[] {
  return uniqueTerms(expandArabicGlossaryGroups(query).flat());
}

async function translateText(text: string, target: 'ar' | 'en'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (target === 'en' && !containsArabic(trimmed)) return text;
  if (target === 'ar' && containsArabic(trimmed) && !/[A-Za-z]/.test(trimmed)) {
    return text;
  }

  const key = `${target}:${trimmed}`;
  const cached = cache.get(key);
  if (cached && !isBadTranslation(cached)) return cached;

  try {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', trimmed.slice(0, 450));
    url.searchParams.set('langpair', target === 'ar' ? 'en|ar' : 'ar|en');

    const response = await fetch(url);
    if (!response.ok) return text;
    const payload: unknown = await response.json();

    const status =
      typeof payload === 'object' &&
      payload !== null &&
      'responseStatus' in payload
        ? Number((payload as { responseStatus: unknown }).responseStatus)
        : 200;

    if (status === 429 || Number.isNaN(status) || status >= 400) {
      return text;
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'responseData' in payload &&
      typeof (payload as { responseData: unknown }).responseData === 'object' &&
      (payload as { responseData: { translatedText?: unknown } }).responseData !== null &&
      typeof (payload as { responseData: { translatedText?: unknown } }).responseData
        .translatedText === 'string'
    ) {
      const translated = (
        payload as { responseData: { translatedText: string } }
      ).responseData.translatedText.trim();
      if (translated && !isBadTranslation(translated)) {
        // If AR→EN still returned Arabic, ignore.
        if (target === 'en' && containsArabic(translated)) return text;
        cache.set(key, translated);
        persistCache();
        return translated;
      }
    }
  } catch {
    return text;
  }
  return text;
}

/** Prefer glossary, then live translation. Returns English terms for Platzi title filter. */
export async function resolveEnglishSearchTerms(
  query: string | undefined | null,
): Promise<string[]> {
  if (query == null) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (!containsArabic(trimmed)) {
    return uniqueTerms(
      trimmed
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((word) => [word, trimmed]),
    );
  }

  const glossary = expandArabicGlossary(trimmed);
  const translated = await translateText(trimmed, 'en');
  const fromApi =
    translated !== trimmed && !containsArabic(translated) && !isBadTranslation(translated)
      ? translated.split(/\s+/).filter(Boolean)
      : [];

  return uniqueTerms([...glossary, ...fromApi]);
}

/** First usable English term for Platzi (glossary-first, API second). */
export async function resolveCatalogSearchQuery(
  query: string | undefined | null,
): Promise<string | undefined> {
  const terms = await resolveEnglishSearchTerms(query);
  return terms[0];
}

function productSearchHaystack(product: Product): string {
  // Title + category only — descriptions create noisy false positives.
  return `${product.title} ${product.category.name}`.toLowerCase();
}

export function productMatchesSearchTerms(product: Product, terms: string[]): boolean {
  const usable = uniqueTerms(terms);
  if (usable.length === 0) return false;
  const haystack = productSearchHaystack(product);
  return usable.some((term) => haystack.includes(term));
}

/**
 * Strict catalog match: English requires every usable word; Arabic requires
 * every glossary token group (AND). Falls back to resolved English terms.
 */
export function productMatchesSearchQuery(
  product: Product,
  query: string,
  englishTerms: string[],
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  const haystack = productSearchHaystack(product);

  if (!containsArabic(trimmed)) {
    const words = uniqueTerms(trimmed.split(/\s+/).filter(Boolean));
    if (words.length === 0) return false;
    return words.every((word) => haystack.includes(word));
  }

  const groups = expandArabicGlossaryGroups(trimmed);
  if (groups.length > 0) {
    return groups.every((group) => group.some((term) => haystack.includes(term)));
  }

  const usable = uniqueTerms(englishTerms);
  if (usable.length === 0) return false;
  const phrase = usable.join(' ');
  if (haystack.includes(phrase)) return true;
  return usable.every((term) => haystack.includes(term));
}

export async function localizeProduct(product: Product, locale: string): Promise<Product> {
  if (locale !== 'ar') return product;
  const [title, description, categoryName] = await Promise.all([
    translateText(product.title, 'ar'),
    translateText(product.description, 'ar'),
    translateText(product.category.name, 'ar'),
  ]);
  return {
    ...product,
    title,
    description,
    category: {
      ...product.category,
      name: categoryName,
    },
  };
}

export async function localizeProducts(
  products: Product[],
  locale: string,
): Promise<Product[]> {
  if (locale !== 'ar') return products;
  return Promise.all(products.map((product) => localizeProduct(product, locale)));
}

export async function localizeCategory(category: Category, locale: string): Promise<Category> {
  if (locale !== 'ar') return category;
  const name = await translateText(category.name, 'ar');
  return { ...category, name };
}

export async function localizeCategories(
  categories: Category[],
  locale: string,
): Promise<Category[]> {
  if (locale !== 'ar') return categories;
  return Promise.all(categories.map((category) => localizeCategory(category, locale)));
}
