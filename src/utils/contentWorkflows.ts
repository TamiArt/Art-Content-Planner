import type {
  ContentCampaign,
  ContentGoal,
  Format,
  FunnelStage,
  HookType,
  Painting,
  Platform,
  Post,
  Service,
  SourceType,
  StorySequence,
} from '../types';
import { formatDateLocal } from './date';

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const goalToFunnel = (goal: ContentGoal): FunnelStage => {
  if (goal === 'reach') return 'attraction';
  if (goal === 'engagement') return 'retention';
  if (goal === 'trust') return 'trust';
  return 'conversion';
};

const goalToMetric = (goal: ContentGoal): string => {
  if (goal === 'reach') return 'views';
  if (goal === 'engagement') return 'saves';
  if (goal === 'trust') return 'subscribes';
  if (goal === 'lead') return 'leads';
  return 'sales';
};

const normalizeHashtag = (value: string): string => `#${value.replace(/^#/, '').replace(/\s+/g, '').toLowerCase()}`;

const createPost = (params: {
  date: string;
  time: string;
  platform: Platform;
  format: Format;
  goal: ContentGoal;
  topic: string;
  idea: string;
  cta: string;
  sourceType?: SourceType;
  sourceId?: string;
  sourceTitle?: string;
  campaignId?: string;
  storySequenceId?: string;
  repackagedFromPostId?: string;
  keywords?: string[];
  hookType?: HookType;
}): Post => {
  const keywords = params.keywords?.filter(Boolean) || [];
  const hookText = params.topic.length > 58 ? `${params.topic.slice(0, 58)}…` : params.topic;

  return {
    id: generateId(),
    date: params.date,
    time: params.time,
    platform: params.platform,
    format: params.format,
    goal: params.goal,
    funnelStage: goalToFunnel(params.goal),
    mainMetric: goalToMetric(params.goal),
    topic: params.topic,
    idea: params.idea,
    hookType: params.hookType || 'question',
    hookVariants: [hookText],
    selectedHook: hookText,
    visualScenario: '',
    textStructure: '',
    cta: params.cta,
    seoKeys: keywords,
    lsiKeys: [],
    hashtags: keywords.slice(0, 5).map(normalizeHashtag),
    status: 'idea',
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    sourceTitle: params.sourceTitle,
    campaignId: params.campaignId,
    storySequenceId: params.storySequenceId,
    repackagedFromPostId: params.repackagedFromPostId,
    firstFrameDescription: `Крупный визуальный акцент: ${params.sourceTitle || params.topic}`,
    onScreenHookText: hookText,
    firstThreeSecondsPlan: '0–1 сек: показать сильный визуальный кадр; 1–3 сек: вывести текст-хук и быстрый контраст/деталь.',
    retentionPlan: 'Смена визуального акцента каждые 2–3 секунды: деталь → польза → пример → CTA.',
    searchKeywords: keywords,
    onScreenTextKeywords: keywords.slice(0, 3),
    captionFirstLine: hookText,
    altText: params.sourceTitle ? `${params.sourceTitle}: ${params.idea}` : params.idea,
    contentBalanceSlot: params.goal,
  };
};

const createStorySequence = (params: {
  title: string;
  date: string;
  platform?: Platform;
  sourceType?: SourceType;
  sourceId?: string;
  sourceTitle?: string;
  campaignId?: string;
  slides: Array<{ frame: string; text: string; sticker?: 'poll' | 'question' | 'quiz' | 'link' | 'none'; cta?: string }>;
}): StorySequence => ({
  id: generateId(),
  title: params.title,
  platform: params.platform || 'Instagram',
  goal: 'warm-up',
  date: params.date,
  sourceType: params.sourceType,
  sourceId: params.sourceId,
  sourceTitle: params.sourceTitle,
  campaignId: params.campaignId,
  slides: params.slides.map((slide, index) => ({ id: generateId(), order: index + 1, ...slide })),
  createdAt: new Date().toISOString(),
});

export const createPaintingContentCampaign = (painting: Painting, startDate = new Date()) => {
  const campaignId = generateId();
  const keywords = [painting.title, 'картина маслом', 'картина в интерьер', painting.mood, ...painting.colors].filter(Boolean);
  const base = {
    sourceType: 'painting' as const,
    sourceId: painting.id,
    sourceTitle: painting.title,
    campaignId,
    keywords,
  };

  const posts = [
    createPost({
      ...base,
      date: formatDateLocal(startDate),
      time: '10:00',
      platform: 'Instagram',
      format: 'Instagram Reels',
      goal: 'reach',
      topic: `Почему картина «${painting.title}» меняет ощущение интерьера`,
      idea: painting.keyIdea || `Показать ${painting.title}, детали, цвет и настроение в пространстве`,
      cta: 'Сохрани идею для своего интерьера',
      hookType: 'question',
    }),
    createPost({
      ...base,
      date: formatDateLocal(addDays(startDate, 2)),
      time: '13:00',
      platform: 'Instagram',
      format: 'Instagram Carousel',
      goal: 'trust',
      topic: `Как подобрать интерьер под «${painting.title}»`,
      idea: `Разобрать размер ${painting.size || '—'}, технику ${painting.technique || '—'}, цвета ${painting.colors.join(', ') || '—'} и настроение ${painting.mood || '—'}`,
      cta: 'Напиши, если хочешь примерить картину к своему интерьеру',
      hookType: 'how-to',
    }),
    createPost({
      ...base,
      date: formatDateLocal(addDays(startDate, 5)),
      time: '18:00',
      platform: 'Instagram',
      format: 'Instagram Post',
      goal: painting.status === 'available' ? 'sale' : 'lead',
      topic: `Картина «${painting.title}» ${painting.status === 'available' ? 'доступна' : 'как идея для заказа'}`,
      idea: [painting.spaceContribution, painting.suitableInterior, painting.price ? `Цена: ${painting.price} ₽` : ''].filter(Boolean).join('; '),
      cta: painting.cta || 'Напиши в Direct, расскажу детали',
      hookType: 'personal-story',
    }),
  ];

  const storySequence = createStorySequence({
    title: `Instagram Stories-прогрев: ${painting.title}`,
    date: formatDateLocal(addDays(startDate, 1)),
    platform: 'Instagram',
    sourceType: 'painting',
    sourceId: painting.id,
    sourceTitle: painting.title,
    campaignId,
    slides: [
      { frame: 'Крупная деталь картины', text: `Покажу, что делает «${painting.title}» особенной`, sticker: 'none' },
      { frame: 'Картина рядом с интерьерным референсом', text: 'Куда бы ты повесила эту работу?', sticker: 'poll' },
      { frame: 'Размер, фактура, цвет', text: painting.keyIdea || painting.mood || 'Детали, которые видны только близко', sticker: 'none' },
      { frame: 'Финальный кадр картины', text: painting.cta || 'Напиши в Direct, если хочешь примерить её к своему интерьеру', sticker: 'question', cta: painting.cta },
    ],
  });

  const campaign: ContentCampaign = {
    id: campaignId,
    title: `Кампания картины: ${painting.title}`,
    goal: 'sell-painting',
    sourceType: 'painting',
    sourceId: painting.id,
    sourceTitle: painting.title,
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(addDays(startDate, 7)),
    postIds: posts.map((post) => post.id),
    storySequenceIds: [storySequence.id],
    targetMetric: 'Заявки в Direct / продажи',
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  return { campaign, posts, storySequences: [storySequence] };
};

export const createServiceWarmupCampaign = (service: Service, startDate = new Date()) => {
  const campaignId = generateId();
  const keywords = [service.title, 'услуга художника', 'интерьерный скетч', service.targetAudience, ...service.includes].filter(Boolean);
  const base = {
    sourceType: 'service' as const,
    sourceId: service.id,
    sourceTitle: service.title,
    campaignId,
    keywords,
  };

  const posts = [
    createPost({
      ...base,
      date: formatDateLocal(startDate),
      time: '10:00',
      platform: 'TikTok',
      format: 'TikTok Video',
      goal: 'reach',
      topic: `Главная ошибка перед заказом услуги «${service.title}»`,
      idea: service.description || service.targetAudience,
      cta: 'Сохрани, если планируешь заказ',
      hookType: 'mistake',
    }),
    createPost({
      ...base,
      date: formatDateLocal(addDays(startDate, 2)),
      time: '12:00',
      platform: 'Instagram',
      format: 'Instagram Carousel',
      goal: 'trust',
      topic: `Как проходит услуга «${service.title}»`,
      idea: `Что входит: ${service.includes.join(', ')}. Сроки: ${service.timeline || 'уточняются'}. Результат: ${service.result || 'понятный визуальный результат'}`,
      cta: service.cta || 'Напиши в Direct, расскажу подробнее',
      hookType: 'process',
    }),
    createPost({
      ...base,
      date: formatDateLocal(addDays(startDate, 4)),
      time: '18:00',
      platform: 'Instagram',
      format: 'Instagram Stories',
      goal: 'lead',
      topic: `Подойдёт ли тебе «${service.title}»?`,
      idea: `Для кого: ${service.targetAudience || 'для тех, кто хочет визуальное решение'}. Нужно от клиента: ${service.clientRequirements.join(', ') || 'бриф/референсы'}`,
      cta: service.cta || 'Напиши слово “услуга” в Direct',
      hookType: 'question',
    }),
  ];

  const storySequence = createStorySequence({
    title: `TikTok Stories-прогрев услуги: ${service.title}`,
    date: formatDateLocal(addDays(startDate, 1)),
    platform: 'TikTok',
    sourceType: 'service',
    sourceId: service.id,
    sourceTitle: service.title,
    campaignId,
    slides: [
      { frame: 'Боль клиента / частая ситуация', text: service.targetAudience ? `Для ${service.targetAudience}: знакомо?` : 'Знакома такая задача?', sticker: 'poll' },
      { frame: 'Короткий процесс работы', text: `Что входит: ${service.includes.slice(0, 3).join(', ') || service.description}`, sticker: 'none' },
      { frame: 'Результат/пример', text: service.result || 'Показываю, какой результат получает клиент', sticker: 'none' },
      { frame: 'Вопрос-ответ', text: service.cta || 'Напиши в Direct — подскажу формат', sticker: 'question', cta: service.cta },
    ],
  });

  const campaign: ContentCampaign = {
    id: campaignId,
    title: `Прогрев услуги: ${service.title}`,
    goal: 'promote-service',
    sourceType: 'service',
    sourceId: service.id,
    sourceTitle: service.title,
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(addDays(startDate, 7)),
    postIds: posts.map((post) => post.id),
    storySequenceIds: [storySequence.id],
    targetMetric: 'Заявки / вопросы в Direct',
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  return { campaign, posts, storySequences: [storySequence] };
};

export const createFormatVariations = (post: Post): Post[] => {
  const date = formatDateLocal(addDays(new Date(post.date), 1));
  return [
    createPost({
      date,
      time: post.time,
      platform: post.platform === 'TikTok' ? 'Instagram' : 'TikTok',
      format: post.platform === 'TikTok' ? 'Instagram Reels' : 'TikTok Video',
      goal: post.goal,
      topic: `${post.topic} — короткий видеоформат`,
      idea: post.idea,
      cta: post.cta,
      sourceType: post.sourceType,
      sourceId: post.sourceId,
      sourceTitle: post.sourceTitle,
      campaignId: post.campaignId,
      repackagedFromPostId: post.id,
      keywords: post.searchKeywords || post.seoKeys,
      hookType: post.hookType,
    }),
    createPost({
      date: formatDateLocal(addDays(new Date(post.date), 2)),
      time: '12:00',
      platform: 'Instagram',
      format: 'Instagram Carousel',
      goal: post.goal === 'reach' ? 'engagement' : post.goal,
      topic: `${post.topic} — карусель/чек-лист`,
      idea: `Разложить идею на 5–7 слайдов: ${post.idea}`,
      cta: 'Сохрани, чтобы вернуться позже',
      sourceType: post.sourceType,
      sourceId: post.sourceId,
      sourceTitle: post.sourceTitle,
      campaignId: post.campaignId,
      repackagedFromPostId: post.id,
      keywords: post.searchKeywords || post.seoKeys,
      hookType: 'how-to',
    }),
  ];
};
