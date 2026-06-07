import type { Post, AppSettings } from '../types';
import { logger } from './logger';

export const buildPromptForPost = (post: Post, settings: AppSettings): string => {
  const { style } = settings;

  const platformContext =
    post.platform === 'TikTok'
      ? 'TikTok (короткое видео, динамичное, зацепляющее с первых секунд)'
      : 'Instagram (визуальное, эстетичное, продуманное)';

  const formatContext = getFormatContext(post.format);
  const goalContext = getGoalContext(post.goal);
  const audienceContext = getAudienceContext(post.funnelStage);
  const sourceContext = getSourceContext(post);

  const prompt = `Ты профессиональный контент-мейкер для художника, специализирующегося на интерьерных скетчах и картинах маслом.

**Контекст:**
- Платформа: ${platformContext}
- Формат: ${formatContext}
- Цель контента: ${goalContext}
- Этап воронки: ${audienceContext}
- Тема: ${post.topic}
- Идея: ${post.idea}${sourceContext}
- Первый кадр: ${post.firstFrameDescription || 'предложи сильный визуальный scroll-stopper'}
- Текст на экране: ${post.onScreenHookText || post.selectedHook || 'предложи короткий текст'}
- Search SEO: ${(post.searchKeywords || post.seoKeys).join(', ') || 'подбери по теме'}

**Стиль и тон:**
${style.tone.map((t) => `- ${t}`).join('\n')}

**Что избегать:**
${style.avoidances.map((a) => `- ${a}`).join('\n')}

**На что делать акцент:**
${style.focus.map((f) => `- ${f}`).join('\n')}

**Задача:**
Создай контент для поста, который:

1. **5 вариантов хука** (первая фраза/строка):
   - Зацепляющие, останавливающие скролл
   - Тип хука: ${post.hookType || 'любой эффективный'}
   - Без банальностей
   - С фокусом на визуальное/эмоциональное

2. **Первые кадры и удержание для Reels/TikTok:**
   - Первый кадр: что видно визуально
   - Текст на экране в первые 1-2 секунды
   - План первых 3 секунд: ${post.firstThreeSecondsPlan || 'визуальный контраст → текст-хук → обещание пользы'}
   - Retention-план: ${post.retentionPlan || 'смена кадра/детали каждые 2-3 секунды'}

3. **Визуальный сценарий** (по кадрам/слайдам):
   - Что показывать на экране
   - Какие детали подчеркнуть
   - Цвета, свет, композицию
   - Движение камеры (для видео)

4. **Структура текста/сценария озвучки:**
   - Хук (первая строка)
   - Основная мысль (2-3 предложения)
   - Детали/польза/эмоция
   - Завершение
   - Длина: ${post.platform === 'TikTok' ? '50-100 слов' : '80-150 слов'}

5. **Call-to-Action (CTA):**
   - Естественный, не агрессивный
   - Направление: ${post.cta || 'по контексту'}

6. **Search SEO, ключевые слова и хэштеги:**
   - LSI-ключи для естественного встраивания
   - Ровно 5 хэштегов (не больше, не меньше)
   - Релевантные теме: ${post.topic}
   - Вставь Search SEO в первую строку описания: ${post.captionFirstLine || 'предложи первую строку'}
   - Ключи для текста на экране: ${(post.onScreenTextKeywords || []).join(', ') || 'подбери 2-3 ключа'}
   - Alt/визуальное описание: ${post.altText || 'предложи краткое описание визуала'}

7. **Короткая версия описания:**
   - 1-2 предложения для подписи/описания
   - С ключевыми словами

**Формат ответа:**
Дай структурированный ответ с четкими разделами:
- ХУКИ (5 вариантов)
- ПЕРВЫЕ КАДРЫ И RETENTION
- ВИЗУАЛЬНЫЙ СЦЕНАРИЙ
- ТЕКСТ/СЦЕНАРИЙ
- CTA
- SEARCH SEO
- LSI-КЛЮЧИ
- ХЭШТЕГИ (ровно 5)
- КОРОТКОЕ ОПИСАНИЕ

Помни: контент должен быть живым, экспертным, визуальным, без воды и с фокусом на интерьер, свет, цвет, глубину и настроение.`;

  return prompt;
};


const getSourceContext = (post: Post): string => {
  if (!post.sourceType && !post.sourceTitle && !post.notes) return '';

  const sourceTypeLabel = post.sourceType === 'painting' ? 'картина' : post.sourceType === 'service' ? 'услуга' : 'источник';
  return `
- Источник контента: ${sourceTypeLabel}${post.sourceTitle ? ` «${post.sourceTitle}»` : ''}${post.notes ? `
- Детали источника: ${post.notes}` : ''}`;
};

const getFormatContext = (format: string): string => {
  const contexts: Record<string, string> = {
    'TikTok Video': 'Короткое видео 15-60 сек, динамичное, с быстрой сменой кадров',
    'TikTok Slideshow': 'Слайд-шоу из 3-5 изображений с текстом на экране и музыкой',
    'Instagram Reels': 'Короткое видео 15-90 сек, эстетичное, с акцентом на визуал',
    'Instagram Carousel': 'Карусель из 5-10 слайдов, рассказывающая историю/процесс',
    'Instagram Post': 'Одно изображение с подробным описанием в подписи',
    'Instagram Stories': 'Вертикальный формат, живое общение, быстрый контент',
    'Instagram Highlights': 'Постоянная подборка Stories по теме',
  };
  return contexts[format] || format;
};

const getGoalContext = (goal: string): string => {
  const contexts: Record<string, string> = {
    reach: 'Максимальный охват, виральность, остановка скролла',
    engagement: 'Вовлечение: лайки, комментарии, сохранения, репосты',
    trust: 'Построение доверия, демонстрация экспертности, подписка',
    lead: 'Получение заявок в Direct, вопросы о заказе',
    sale: 'Прямая продажа картины или услуги',
  };
  return contexts[goal] || goal;
};

const getAudienceContext = (stage: string): string => {
  const contexts: Record<string, string> = {
    attraction: 'Новая аудитория, еще не знакомая с тобой',
    retention: 'Те, кто уже видел твой контент, но еще не подписан',
    trust: 'Подписчики, которые следят за тобой',
    conversion: 'Теплая аудитория, готовая к покупке/заявке',
  };
  return contexts[stage] || stage;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    // Fallback method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};
