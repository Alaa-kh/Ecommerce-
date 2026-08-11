export type ChatIntent =
  | 'greeting'
  | 'help'
  | 'search'
  | 'categories'
  | 'shipping'
  | 'payment'
  | 'cart'
  | 'orders'
  | 'fallback';

export interface ChatProductLink {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
}

export interface ChatReply {
  intent: ChatIntent;
  textKey: string;
  textParams?: Record<string, string | number>;
  /** Optional raw text (managed API). Prefer over textKey when present. */
  text?: string;
  suggestions: string[];
  products?: ChatProductLink[];
  links?: Array<{ labelKey: string; to: string }>;
  searchQuery?: string;
}

const SEARCH_PREFIX =
  /^(?:search|find|show|looking for|ابحث(?:\s+عن)?|دور(?:\s+على)?|أريد|بدي)\s+/i;

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function detectFaqIntent(text: string): ChatIntent | null {
  if (
    includesAny(text, [
      'hello',
      'hi',
      'hey',
      'مرحبا',
      'اهلا',
      'أهلا',
      'السلام',
    ])
  ) {
    return 'greeting';
  }

  if (
    includesAny(text, [
      'help',
      'what can you',
      'مساعدة',
      'ساعد',
      'كيف استخدم',
      'بتقدر',
      'تقدر تعمل',
    ])
  ) {
    return 'help';
  }

  if (
    includesAny(text, [
      'categor',
      'collection',
      'تصنيف',
      'تصنيفات',
      'أقسام',
      'اقسام',
    ])
  ) {
    return 'categories';
  }

  if (
    includesAny(text, [
      'ship',
      'deliver',
      'توصيل',
      'شحن',
      'التوصيل',
    ])
  ) {
    return 'shipping';
  }

  if (
    includesAny(text, [
      'pay',
      'payment',
      'cod',
      'stripe',
      'paypal',
      'دفع',
      'الدفع',
      'كاش',
    ])
  ) {
    return 'payment';
  }

  if (includesAny(text, ['cart', 'basket', 'سلة', 'العربة'])) {
    return 'cart';
  }

  if (includesAny(text, ['order', 'track', 'طلب', 'طلباتي', 'تتبع'])) {
    return 'orders';
  }

  return null;
}

export function extractSearchQuery(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const prefixed = trimmed.match(SEARCH_PREFIX);
  if (prefixed) {
    const rest = trimmed.slice(prefixed[0].length).trim();
    return rest.length > 0 ? rest : null;
  }

  if (trimmed.toLowerCase().startsWith('q:')) {
    const rest = trimmed.slice(2).trim();
    return rest.length > 0 ? rest : null;
  }

  return null;
}

export function detectIntent(input: string): ChatIntent {
  const text = input.trim().toLowerCase();
  if (!text) return 'greeting';

  const faq = detectFaqIntent(text);
  if (faq) return faq;

  if (extractSearchQuery(input) || (text.length >= 2 && text.length <= 48)) {
    return 'search';
  }

  return 'fallback';
}

export function resolveSearchTerm(input: string): string {
  return extractSearchQuery(input) ?? input.trim();
}

export function buildStaticReply(intent: ChatIntent): ChatReply {
  switch (intent) {
    case 'greeting':
      return {
        intent,
        textKey: 'chatbot.replyGreeting',
        suggestions: [
          'chatbot.suggestSearch',
          'chatbot.suggestCategories',
          'chatbot.suggestShipping',
        ],
      };
    case 'help':
      return {
        intent,
        textKey: 'chatbot.replyHelp',
        suggestions: [
          'chatbot.suggestSearch',
          'chatbot.suggestPayment',
          'chatbot.suggestCart',
        ],
      };
    case 'categories':
      return {
        intent,
        textKey: 'chatbot.replyCategories',
        suggestions: ['chatbot.suggestSearch', 'chatbot.suggestHelp'],
        links: [{ labelKey: 'chatbot.linkCategories', to: '/categories' }],
      };
    case 'shipping':
      return {
        intent,
        textKey: 'chatbot.replyShipping',
        suggestions: ['chatbot.suggestPayment', 'chatbot.suggestCart'],
        links: [{ labelKey: 'chatbot.linkCheckout', to: '/checkout' }],
      };
    case 'payment':
      return {
        intent,
        textKey: 'chatbot.replyPayment',
        suggestions: ['chatbot.suggestShipping', 'chatbot.suggestCart'],
      };
    case 'cart':
      return {
        intent,
        textKey: 'chatbot.replyCart',
        suggestions: ['chatbot.suggestSearch', 'chatbot.suggestOrders'],
        links: [{ labelKey: 'chatbot.linkCart', to: '/cart' }],
      };
    case 'orders':
      return {
        intent,
        textKey: 'chatbot.replyOrders',
        suggestions: ['chatbot.suggestHelp', 'chatbot.suggestCart'],
        links: [{ labelKey: 'chatbot.linkOrders', to: '/orders' }],
      };
    case 'search':
      return {
        intent,
        textKey: 'chatbot.replySearchPrompt',
        suggestions: [
          'chatbot.suggestShoes',
          'chatbot.suggestFurniture',
          'chatbot.suggestElectronics',
        ],
      };
    default:
      return {
        intent: 'fallback',
        textKey: 'chatbot.replyFallback',
        suggestions: [
          'chatbot.suggestSearch',
          'chatbot.suggestHelp',
          'chatbot.suggestCategories',
        ],
      };
  }
}
