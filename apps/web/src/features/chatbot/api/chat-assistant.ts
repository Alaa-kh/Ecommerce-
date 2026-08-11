import { productsApi } from '@/features/products/api/productsApi';
import {
  buildStaticReply,
  detectIntent,
  resolveSearchTerm,
  type ChatProductLink,
  type ChatReply,
} from '@/features/chatbot/domain/assistant';
import { resolveEnglishSearchTerms } from '@/shared/services/localization/catalog-i18n';
import { appConfig } from '@/app/config/env';

export function isManagedChatConfigured(): boolean {
  return Boolean(appConfig.chatApiUrl);
}

async function searchProducts(query: string): Promise<ChatProductLink[]> {
  const terms = await resolveEnglishSearchTerms(query);
  const title = terms[0] ?? query;
  const result = await productsApi.list({
    title,
    page: 1,
    pageSize: 4,
    sort: 'relevance',
  });

  return result.items.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.price,
    imageUrl: product.images[0] ?? null,
  }));
}

async function replyFromManagedApi(
  message: string,
  locale: string,
): Promise<ChatReply | null> {
  if (!appConfig.chatApiUrl) return null;

  try {
    const response = await fetch(appConfig.chatApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, locale }),
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') return null;
    const row = payload as { text?: unknown; suggestions?: unknown };
    if (typeof row.text !== 'string' || row.text.trim().length === 0) return null;

    return {
      intent: 'fallback',
      textKey: 'chatbot.managedText',
      text: row.text.trim(),
      suggestions: Array.isArray(row.suggestions)
        ? row.suggestions
            .filter((item): item is string => typeof item === 'string')
            .slice(0, 4)
        : ['chatbot.suggestHelp', 'chatbot.suggestSearch'],
    };
  } catch {
    return null;
  }
}

export async function createAssistantReply(
  message: string,
  locale: string,
): Promise<ChatReply> {
  const managed = await replyFromManagedApi(message, locale);
  if (managed) return managed;

  const intent = detectIntent(message);

  if (intent !== 'search') {
    return buildStaticReply(intent);
  }

  const searchQuery = resolveSearchTerm(message);
  if (!searchQuery) {
    return buildStaticReply('search');
  }

  try {
    const products = await searchProducts(searchQuery);
    if (products.length === 0) {
      return {
        intent: 'search',
        textKey: 'chatbot.replySearchEmpty',
        textParams: { query: searchQuery },
        suggestions: [
          'chatbot.suggestShoes',
          'chatbot.suggestFurniture',
          'chatbot.suggestElectronics',
        ],
        links: [
          {
            labelKey: 'chatbot.linkSearch',
            to: `/search?q=${encodeURIComponent(searchQuery)}`,
          },
        ],
        searchQuery,
      };
    }

    return {
      intent: 'search',
      textKey: 'chatbot.replySearchHits',
      textParams: { query: searchQuery, count: products.length },
      suggestions: ['chatbot.suggestCategories', 'chatbot.suggestHelp'],
      products,
      links: [
        {
          labelKey: 'chatbot.linkSearch',
          to: `/search?q=${encodeURIComponent(searchQuery)}`,
        },
      ],
      searchQuery,
    };
  } catch {
    return {
      intent: 'search',
      textKey: 'chatbot.replySearchError',
      textParams: { query: searchQuery },
      suggestions: ['chatbot.suggestHelp', 'chatbot.suggestCategories'],
      searchQuery,
    };
  }
}
