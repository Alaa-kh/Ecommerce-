import { type FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createAssistantReply } from '@/features/chatbot/api/chat-assistant';
import type { ChatProductLink, ChatReply } from '@/features/chatbot/domain/assistant';
import { ProductImage } from '@/shared/components/ui/product-image';
import { IconChat, IconClose } from '@/shared/components/ui/icons';
import { formatMoney } from '@/shared/utils/money';
import styles from './site-chatbot.module.css';

type ChatWindowMode = 'closed' | 'minimized' | 'open' | 'maximized';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  /** i18n key — re-translated when locale changes. */
  textKey?: string;
  textParams?: Record<string, string | number>;
  /** Raw text for free-typed user input or managed API replies. */
  text?: string;
  products?: ChatProductLink[];
  links?: Array<{ labelKey: string; to: string }>;
  suggestionKeys?: string[];
}

const AUTO_OPEN_DELAY_MS = 700;

const DEFAULT_SUGGESTIONS = [
  'chatbot.suggestSearch',
  'chatbot.suggestCategories',
  'chatbot.suggestShipping',
] as const;

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function welcomeMessage(): ChatMessage {
  return {
    id: createId(),
    role: 'bot',
    textKey: 'chatbot.welcome',
    suggestionKeys: [...DEFAULT_SUGGESTIONS],
  };
}

function resolveMessageText(
  message: ChatMessage,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (message.textKey) {
    return t(message.textKey, message.textParams as Record<string, unknown> | undefined);
  }
  return message.text ?? '';
}

/**
 * Floating site chatbot (Ram Clinics–style window chrome):
 * close / minimize / maximize + auto-open on home.
 * Bot copy is key-based so it re-translates on locale change.
 */
export function SiteChatbot() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ChatWindowMode>('closed');
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const isHome = location.pathname === '/';
  const isExpanded = mode === 'open' || mode === 'maximized';

  useEffect(() => {
    if (!isHome) return undefined;

    const timer = window.setTimeout(() => {
      setMessages((current) => (current.length > 0 ? current : [welcomeMessage()]));
      setMode((current) => (current === 'closed' ? 'open' : current));
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isHome]);

  useEffect(() => {
    if (!isExpanded) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
    inputRef.current?.focus();
  }, [isExpanded, messages, pending]);

  function ensureWelcome() {
    setMessages((current) => (current.length > 0 ? current : [welcomeMessage()]));
  }

  function openWindow(next: 'open' | 'maximized' = 'open') {
    ensureWelcome();
    setMode(next);
  }

  async function respond(
    userText: string,
    options?: { textKey?: string },
  ) {
    const trimmed = userText.trim();
    if (!trimmed || pending) return;

    setDraft('');
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'user',
        textKey: options?.textKey,
        text: options?.textKey ? undefined : trimmed,
      },
    ]);
    setPending(true);

    try {
      const reply = await createAssistantReply(trimmed, i18n.language);
      setMessages((current) => [...current, mapReplyToMessage(reply)]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'bot',
          textKey: 'chatbot.replyError',
          suggestionKeys: ['chatbot.suggestHelp', 'chatbot.suggestSearch'],
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function mapReplyToMessage(reply: ChatReply): ChatMessage {
    return {
      id: createId(),
      role: 'bot',
      textKey: reply.text ? undefined : reply.textKey,
      textParams: reply.textParams,
      text: reply.text,
      products: reply.products,
      links: reply.links,
      suggestionKeys: reply.suggestions,
    };
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void respond(draft);
  }

  function onSuggestionClick(suggestionKey: string) {
    const label = suggestionKey.startsWith('chatbot.')
      ? t(suggestionKey)
      : suggestionKey;
    void respond(label, {
      textKey: suggestionKey.startsWith('chatbot.') ? suggestionKey : undefined,
    });
  }

  return (
    <div className={styles.root} data-mode={mode}>
      {mode === 'closed' ? (
        <button
          type="button"
          className={styles.launcher}
          aria-controls={panelId}
          aria-expanded={false}
          aria-label={t('chatbot.open')}
          title={t('chatbot.title')}
          onClick={() => openWindow('open')}
        >
          <span className={styles.launcherIcon} aria-hidden="true">
            <IconChat />
          </span>
          <span className="sr-only">{t('chatbot.title')}</span>
        </button>
      ) : null}

      {mode === 'minimized' ? (
        <button
          type="button"
          className={styles.minimized}
          aria-controls={panelId}
          onClick={() => openWindow('open')}
        >
          <IconChat />
          <span>{t('chatbot.title')}</span>
          <span className={styles.minimizedBadge} aria-hidden="true">
            1
          </span>
        </button>
      ) : null}

      {isExpanded ? (
        <section
          id={panelId}
          className={`${styles.window} ${mode === 'maximized' ? styles.windowMax : ''}`}
          aria-label={t('chatbot.title')}
          role="dialog"
          aria-modal="false"
        >
          <header className={styles.titleBar}>
            <div className={styles.titleMeta}>
              <span className={styles.avatar} aria-hidden="true">
                <IconChat />
              </span>
              <div>
                <strong>{t('chatbot.title')}</strong>
                <p>{t('chatbot.subtitle')}</p>
              </div>
            </div>
            <div className={styles.windowControls}>
              <button
                type="button"
                className={styles.control}
                aria-label={t('chatbot.minimize')}
                title={t('chatbot.minimize')}
                onClick={() => setMode('minimized')}
              >
                −
              </button>
              <button
                type="button"
                className={styles.control}
                aria-label={
                  mode === 'maximized' ? t('chatbot.restore') : t('chatbot.maximize')
                }
                title={mode === 'maximized' ? t('chatbot.restore') : t('chatbot.maximize')}
                onClick={() =>
                  setMode((current) => (current === 'maximized' ? 'open' : 'maximized'))
                }
              >
                {mode === 'maximized' ? '❐' : '+'}
              </button>
              <button
                type="button"
                className={`${styles.control} ${styles.controlClose}`}
                aria-label={t('chatbot.close')}
                title={t('chatbot.close')}
                onClick={() => setMode('closed')}
              >
                <IconClose />
              </button>
            </div>
          </header>

          <div className={styles.messages} ref={listRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === 'bot' ? styles.bot : styles.user}
              >
                <p>{resolveMessageText(message, t)}</p>

                {message.products && message.products.length > 0 ? (
                  <ul className={styles.products}>
                    {message.products.map((product) => (
                      <li key={product.id}>
                        <Link
                          to={`/products/${product.id}`}
                          className={styles.product}
                          onClick={() => setMode('minimized')}
                        >
                          <span className={styles.thumb}>
                            <ProductImage src={product.imageUrl} alt="" />
                          </span>
                          <span>
                            <strong>{product.title}</strong>
                            <em>{formatMoney(product.price, i18n.language)}</em>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {message.links && message.links.length > 0 ? (
                  <div className={styles.links}>
                    {message.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={styles.link}
                        onClick={() => setMode('minimized')}
                      >
                        {t(link.labelKey)}
                      </Link>
                    ))}
                  </div>
                ) : null}

                {message.role === 'bot' &&
                message.suggestionKeys &&
                message.suggestionKeys.length > 0 ? (
                  <div className={styles.suggestions}>
                    {message.suggestionKeys.map((suggestionKey) => (
                      <button
                        key={suggestionKey}
                        type="button"
                        className={styles.chip}
                        disabled={pending}
                        onClick={() => onSuggestionClick(suggestionKey)}
                      >
                        {suggestionKey.startsWith('chatbot.')
                          ? t(suggestionKey)
                          : suggestionKey}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {pending ? (
              <p className={styles.typing} aria-live="polite">
                {t('chatbot.typing')}
              </p>
            ) : null}
          </div>

          <form className={styles.composer} onSubmit={onSubmit}>
            <label className="sr-only" htmlFor={`${panelId}-input`}>
              {t('chatbot.inputLabel')}
            </label>
            <input
              id={`${panelId}-input`}
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('chatbot.placeholder')}
              autoComplete="off"
              disabled={pending}
            />
            <button type="submit" disabled={pending || draft.trim().length === 0}>
              {t('chatbot.send')}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
