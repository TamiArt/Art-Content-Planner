import type {
  Post,
  Platform,
  Format,
  ContentGoal,
  FunnelStage,
  ContentSeries,
  HookType,
  GeneratorSettings,
  Painting,
  Service,
  ContentBalanceMatrix,
  Rubric,
} from '../types';
import { formatDateLocal } from './date';
import { logger } from './logger';

// Helper to generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface TopicRule {
  topic: string;
  series?: ContentSeries;
  formats: Format[];
  platforms: Platform[];
  funnelStages: FunnelStage[];
  hookTypes: HookType[];
}

type CatalogContentSource =
  | {
      type: 'painting';
      id: string;
      title: string;
      topic: string;
      idea: string;
      cta: string;
      seoKeys: string[];
      notes: string;
      preferredGoals: ContentGoal[];
      preferredFormats: Format[];
      preferredPlatforms: Platform[];
      series: ContentSeries;
    }
  | {
      type: 'service';
      id: string;
      title: string;
      topic: string;
      idea: string;
      cta: string;
      seoKeys: string[];
      notes: string;
      preferredGoals: ContentGoal[];
      preferredFormats: Format[];
      preferredPlatforms: Platform[];
      series: ContentSeries;
    };

const normalizeHashTag = (value: string): string => `#${value.replace(/^#/, '').replace(/\s+/g, '').toLowerCase()}`;

const buildCatalogSources = (paintings: Painting[] = [], services: Service[] = []): CatalogContentSource[] => {
  const paintingSources: CatalogContentSource[] = paintings
    .filter((painting) => painting.status !== 'sold')
    .map((painting) => ({
      type: 'painting',
      id: painting.id,
      title: painting.title,
      topic: `Картина «${painting.title}» в интерьере`,
      idea: [
        painting.keyIdea,
        painting.mood ? `настроение: ${painting.mood}` : '',
        painting.size ? `размер: ${painting.size}` : '',
        painting.technique ? `техника: ${painting.technique}` : '',
        painting.suitableInterior ? `подходит для: ${painting.suitableInterior}` : '',
        painting.spaceContribution ? `добавляет пространству: ${painting.spaceContribution}` : '',
        painting.price ? `цена: ${painting.price} ₽` : '',
      ]
        .filter(Boolean)
        .join('; '),
      cta: painting.cta || 'Напиши в Direct, если хочешь увидеть картину в своём интерьере',
      seoKeys: [painting.title, 'картина маслом', 'картина в интерьер', ...painting.colors, painting.mood].filter(Boolean),
      notes: `Источник: картина «${painting.title}». Фото/URL: ${painting.imageUrl ? 'добавлено' : 'не добавлено'}.`,
      preferredGoals: ['trust', 'lead', 'sale'],
      preferredFormats: ['Instagram Post', 'Instagram Carousel', 'Instagram Stories', 'TikTok Slideshow'],
      preferredPlatforms: ['Instagram', 'TikTok'],
      series: 'paintings-for-sale',
    }));

  const serviceSources: CatalogContentSource[] = services.map((service) => ({
    type: 'service',
    id: service.id,
    title: service.title,
    topic: `Услуга: ${service.title}`,
    idea: [
      service.description,
      service.targetAudience ? `для кого: ${service.targetAudience}` : '',
      service.includes.length > 0 ? `что входит: ${service.includes.join(', ')}` : '',
      service.timeline ? `сроки: ${service.timeline}` : '',
      service.price ? `цена: ${service.price}` : '',
      service.result ? `результат: ${service.result}` : '',
    ]
      .filter(Boolean)
      .join('; '),
    cta: service.cta || 'Напиши в Direct, расскажу подробнее об услуге',
    seoKeys: [service.title, 'услуга художника', 'интерьерный скетч', service.targetAudience, ...service.includes].filter(Boolean),
    notes: `Источник: услуга «${service.title}». ${service.clientRequirements.length > 0 ? `Нужно от клиента: ${service.clientRequirements.join(', ')}` : ''}`,
    preferredGoals: ['trust', 'lead', 'sale'],
    preferredFormats: ['Instagram Carousel', 'Instagram Reels', 'Instagram Stories', 'TikTok Video'],
    preferredPlatforms: ['Instagram', 'TikTok'],
    series: 'how-to-order',
  }));

  return [...paintingSources, ...serviceSources];
};

const shouldUseCatalogSource = (sourceCount: number, goal: ContentGoal, postIndex: number): boolean => {
  if (sourceCount === 0) return false;
  if (goal === 'lead' || goal === 'sale' || goal === 'trust') return true;
  return postIndex % 4 === 2;
};


const buildWeightedGoals = (balance?: ContentBalanceMatrix): ContentGoal[] => {
  if (!balance) return [];
  const goals = Object.entries(balance).flatMap(([goal, percent]) =>
    Array.from({ length: Math.max(0, Math.round(Number(percent) / 5)) }, () => goal as ContentGoal)
  );
  return goals.length > 0 ? goals : [];
};

const buildRubricTopicRules = (rubrics: Rubric[] = []): TopicRule[] =>
  rubrics
    .filter((rubric) => rubric.enabled)
    .map((rubric) => ({
      topic: rubric.title,
      series: 'artist-process' as ContentSeries,
      formats: rubric.formats,
      platforms: rubric.platforms,
      funnelStages: rubric.goals.map(getFunnelStageForGoal),
      hookTypes: rubric.hookTypes,
    }));


const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'Ошибки в интерьерном скетче',
    series: 'interior-sketch-mistakes',
    formats: ['TikTok Video', 'TikTok Slideshow', 'Instagram Reels', 'Instagram Carousel'],
    platforms: ['TikTok', 'Instagram'],
    funnelStages: ['attraction', 'retention'],
    hookTypes: ['mistake', 'how-to', 'question'],
  },
  {
    topic: 'Процесс создания интерьерного скетча',
    series: 'artist-process',
    formats: ['TikTok Video', 'Instagram Reels', 'Instagram Stories'],
    platforms: ['TikTok', 'Instagram'],
    funnelStages: ['retention', 'trust'],
    hookTypes: ['process', 'personal-story'],
  },
  {
    topic: 'Картина в интерьере - примеры',
    series: 'painting-in-interior',
    formats: ['Instagram Carousel', 'Instagram Post', 'TikTok Slideshow'],
    platforms: ['Instagram', 'TikTok'],
    funnelStages: ['retention', 'trust'],
    hookTypes: ['before-after', 'shocking-fact'],
  },
  {
    topic: 'Как заказать картину - процесс',
    series: 'how-to-order',
    formats: ['Instagram Carousel', 'Instagram Reels', 'Instagram Stories'],
    platforms: ['Instagram'],
    funnelStages: ['trust', 'conversion'],
    hookTypes: ['how-to', 'question'],
  },
  {
    topic: 'До и после - трансформация интерьера',
    series: 'before-after',
    formats: ['TikTok Video', 'Instagram Reels', 'Instagram Carousel'],
    platforms: ['TikTok', 'Instagram'],
    funnelStages: ['attraction', 'retention'],
    hookTypes: ['before-after', 'shocking-fact'],
  },
  {
    topic: 'Цвет и настроение в живописи',
    series: 'color-mood',
    formats: ['Instagram Carousel', 'Instagram Post', 'TikTok Slideshow'],
    platforms: ['Instagram', 'TikTok'],
    funnelStages: ['retention', 'trust'],
    hookTypes: ['how-to', 'personal-story'],
  },
  {
    topic: 'Перспектива - типичные ошибки',
    series: 'perspective-construction',
    formats: ['TikTok Video', 'Instagram Reels', 'Instagram Carousel'],
    platforms: ['TikTok', 'Instagram'],
    funnelStages: ['attraction', 'retention'],
    hookTypes: ['mistake', 'how-to'],
  },
  {
    topic: 'Готовая картина маслом - на продажу',
    series: 'paintings-for-sale',
    formats: ['Instagram Post', 'Instagram Carousel', 'Instagram Stories'],
    platforms: ['Instagram'],
    funnelStages: ['conversion'],
    hookTypes: ['question', 'shocking-fact'],
  },
  {
    topic: 'Быстрый скетч из жизни',
    series: 'artist-process',
    formats: ['TikTok Video', 'Instagram Reels', 'Instagram Stories'],
    platforms: ['TikTok', 'Instagram'],
    funnelStages: ['attraction', 'retention'],
    hookTypes: ['process', 'personal-story'],
  },
  {
    topic: 'Свет и глубина в интерьерном скетче',
    series: 'interior-sketch-mistakes',
    formats: ['Instagram Carousel', 'TikTok Slideshow', 'Instagram Post'],
    platforms: ['Instagram', 'TikTok'],
    funnelStages: ['retention', 'trust'],
    hookTypes: ['how-to', 'question'],
  },
];

const CTA_TEMPLATES: Record<ContentGoal, string[]> = {
  reach: [
    'Сохраняй, чтобы не потерять',
    'Поделись с тем, кому это нужно',
    'А ты замечал эту ошибку?',
    'Пиши в комментариях свое мнение',
  ],
  engagement: [
    'Какой вариант нравится больше? Пиши в комментариях',
    'Сохрани и покажи другу',
    'Согласен? Поделись своим опытом',
    'Что думаешь об этом? Пиши',
  ],
  trust: [
    'Хочешь узнать больше? Подписывайся',
    'Подписывайся, чтобы не пропустить следующий пост',
    'Больше полезного в профиле',
    'Следи за обновлениями',
  ],
  lead: [
    'Напиши в Direct, расскажу подробнее',
    'Есть вопросы? Пиши в Direct',
    'Хочешь заказать? Пиши в Direct',
    'Подробности в Direct',
  ],
  sale: [
    'Купить можно в Direct',
    'Заказать можно прямо сейчас - пиши в Direct',
    'Свободна для заказа - пиши',
    'Готова к отправке - пиши в Direct',
  ],
};

// Anti-repetition state
class RepetitionGuard {
  private recentTopics: string[] = [];
  private recentGoals: ContentGoal[] = [];
  private recentFormats: Format[] = [];
  private recentHooks: HookType[] = [];
  private recentCTAs: string[] = [];

  check(value: string, type: 'topic' | 'goal' | 'format' | 'hook' | 'cta'): boolean {
    switch (type) {
      case 'topic':
        return !this.recentTopics.slice(-3).includes(value);
      case 'goal':
        return !this.recentGoals.slice(-2).includes(value as ContentGoal);
      case 'format':
        return !this.recentFormats.slice(-2).includes(value as Format);
      case 'hook':
        return !this.recentHooks.slice(-2).includes(value as HookType);
      case 'cta':
        return !this.recentCTAs.slice(-2).includes(value);
      default:
        return true;
    }
  }

  add(value: string, type: 'topic' | 'goal' | 'format' | 'hook' | 'cta'): void {
    switch (type) {
      case 'topic':
        this.recentTopics.push(value);
        if (this.recentTopics.length > 5) this.recentTopics.shift();
        break;
      case 'goal':
        this.recentGoals.push(value as ContentGoal);
        if (this.recentGoals.length > 3) this.recentGoals.shift();
        break;
      case 'format':
        this.recentFormats.push(value as Format);
        if (this.recentFormats.length > 3) this.recentFormats.shift();
        break;
      case 'hook':
        this.recentHooks.push(value as HookType);
        if (this.recentHooks.length > 3) this.recentHooks.shift();
        break;
      case 'cta':
        this.recentCTAs.push(value);
        if (this.recentCTAs.length > 3) this.recentCTAs.shift();
        break;
    }
  }
}

const selectRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getFunnelStageForGoal = (goal: ContentGoal): FunnelStage => {
  if (goal === 'reach') return 'attraction';
  if (goal === 'engagement') return 'retention';
  if (goal === 'trust') return 'trust';
  return 'conversion';
};

const getMainMetricForGoal = (goal: ContentGoal): string => {
  if (goal === 'reach') return 'views';
  if (goal === 'engagement') return 'saves';
  if (goal === 'trust') return 'subscribes';
  return 'leads';
};


const selectTopicRuleWithGuard = (rules: TopicRule[], guard: RepetitionGuard): TopicRule => {
  const available = rules.filter((rule) => guard.check(rule.topic, 'topic'));
  if (available.length === 0) return rules[0];
  return selectRandom(available);
};

const selectRandomWithGuard = <T extends string>(
  array: T[],
  guard: RepetitionGuard,
  type: 'topic' | 'goal' | 'format' | 'hook' | 'cta'
): T => {
  const available = array.filter((item) => guard.check(item, type));
  if (available.length === 0) return array[0]; // Fallback
  return selectRandom(available);
};

export interface MonthGeneratorParams {
  month: string; // YYYY-MM
  settings: GeneratorSettings;
  paintings?: Painting[];
  services?: Service[];
  contentBalance?: ContentBalanceMatrix;
  rubrics?: Rubric[];
}

export const generateMonthPlan = (params: MonthGeneratorParams): Post[] => {
  const { month, settings, paintings = [], services = [], contentBalance, rubrics = [] } = params;
  const { defaultDays, defaultTimes, defaultPlatforms, defaultGoals } = settings;
  const weightedGoals = buildWeightedGoals(contentBalance);
  const goalRotation = weightedGoals.length > 0 ? weightedGoals : defaultGoals;
  const topicRules = [...buildRubricTopicRules(rubrics), ...TOPIC_RULES];

  const posts: Post[] = [];
  const catalogSources = buildCatalogSources(paintings, services);
  const guard = new RepetitionGuard();

  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);

  logger.debug('Month generator:', {
    year,
    monthNum,
    firstDay: firstDay.toISOString(),
    lastDay: lastDay.toISOString(),
    days: defaultDays,
    times: defaultTimes,
    catalogSources: catalogSources.length,
    balanceGoals: goalRotation,
    enabledRubrics: rubrics.filter((rubric) => rubric.enabled).length,
  });

  const dayNameToNum: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const selectedDayNums = defaultDays.map((day) => dayNameToNum[day]).filter((dayNum) => dayNum !== undefined);
  const dates: Date[] = [];

  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    if (selectedDayNums.includes(currentDate.getDay()) && currentDate.getMonth() === monthNum - 1) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  logger.debug('Generated dates count:', dates.length);
  if (dates.length > 0) {
    logger.debug('First date:', dates[0].toISOString());
    logger.debug('Last date:', dates[dates.length - 1].toISOString());
  }

  let postIndex = 0;

  dates.forEach((date) => {
    defaultTimes.forEach((time) => {
      const goal = goalRotation[postIndex % goalRotation.length];
      const funnelStage = getFunnelStageForGoal(goal);

      const source = shouldUseCatalogSource(catalogSources.length, goal, postIndex)
        ? catalogSources[postIndex % catalogSources.length]
        : undefined;

      const compatibleTopics = topicRules.filter(
        (rule) => rule.funnelStages.includes(funnelStage) && rule.platforms.some((platform) => defaultPlatforms.includes(platform))
      );
      const funnelTopics = topicRules.filter((rule) => rule.funnelStages.includes(funnelStage));
      const suitableTopics = compatibleTopics.length > 0 ? compatibleTopics : funnelTopics.length > 0 ? funnelTopics : topicRules;
      const topicRule = source ? undefined : selectTopicRuleWithGuard(suitableTopics, guard);

      const sourcePlatforms = source?.preferredPlatforms.filter((platform) => defaultPlatforms.includes(platform)) || [];
      const matchingPlatforms = topicRule?.platforms.filter((platform) => defaultPlatforms.includes(platform)) || [];
      const platform = source
        ? selectRandom(sourcePlatforms.length > 0 ? sourcePlatforms : defaultPlatforms)
        : selectRandom(matchingPlatforms.length > 0 ? matchingPlatforms : topicRule!.platforms);

      const sourceFormats = source?.preferredFormats.filter((format) =>
        platform === 'TikTok' ? format.startsWith('TikTok') : format.startsWith('Instagram')
      ) || [];
      const platformFormats = topicRule?.formats.filter((format) =>
        platform === 'TikTok' ? format.startsWith('TikTok') : format.startsWith('Instagram')
      ) || [];
      const format = selectRandomWithGuard(
        source
          ? sourceFormats.length > 0
            ? sourceFormats
            : source.preferredFormats
          : platformFormats.length > 0
            ? platformFormats
            : topicRule!.formats,
        guard,
        'format'
      );

      const hookTypes = source ? (source.type === 'painting' ? ['question', 'before-after', 'personal-story'] as HookType[] : ['how-to', 'question', 'process'] as HookType[]) : topicRule!.hookTypes;
      const hookType = selectRandomWithGuard(hookTypes, guard, 'hook');
      const ctaOptions = source ? [source.cta, ...(CTA_TEMPLATES[goal] || CTA_TEMPLATES.reach)] : CTA_TEMPLATES[goal] || CTA_TEMPLATES.reach;
      const cta = selectRandomWithGuard(ctaOptions, guard, 'cta');
      const topic = source?.topic || topicRule!.topic;

      guard.add(topic, 'topic');
      guard.add(goal, 'goal');
      guard.add(format, 'format');
      guard.add(hookType, 'hook');
      guard.add(cta, 'cta');

      const post: Post = {
        id: generateId(),
        date: formatDateLocal(date),
        time,
        platform,
        format,
        goal,
        funnelStage,
        mainMetric: getMainMetricForGoal(goal),
        contentSeries: source?.series || topicRule!.series,
        topic,
        idea: source?.idea || `${topicRule!.topic} - ${format}`,
        hookType,
        hookVariants: [],
        visualScenario: '',
        textStructure: '',
        cta,
        seoKeys: source?.seoKeys || [],
        lsiKeys: [],
        hashtags: source?.seoKeys.slice(0, 5).map(normalizeHashTag) || [],
        status: 'idea',
        notes: source?.notes,
        sourceType: source?.type,
        sourceId: source?.id,
        sourceTitle: source?.title,
      };

      posts.push(post);
      postIndex += 1;
    });
  });

  return posts;
};
