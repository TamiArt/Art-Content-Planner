import type {
  Post,
  Platform,
  Format,
  ContentGoal,
  FunnelStage,
  ContentSeries,
  HookType,
  GeneratorSettings,
} from '../types';

// Helper to generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper to format date as YYYY-MM-DD without timezone conversion
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TopicRule {
  topic: string;
  series?: ContentSeries;
  formats: Format[];
  platforms: Platform[];
  funnelStages: FunnelStage[];
  hookTypes: HookType[];
}

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

const FUNNEL_TO_GOAL_MAP: Record<FunnelStage, ContentGoal[]> = {
  attraction: ['reach'],
  retention: ['engagement', 'reach'],
  trust: ['trust', 'engagement'],
  conversion: ['lead', 'sale'],
};

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
}

export const generateMonthPlan = (params: MonthGeneratorParams): Post[] => {
  const { month, settings } = params;
  const { defaultPostsPerWeek, defaultDays, defaultTimes, defaultPlatforms, defaultGoals } = settings;

  const posts: Post[] = [];
  const guard = new RepetitionGuard();

  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);

  console.log('Month generator:', { year, monthNum, firstDay: firstDay.toISOString(), lastDay: lastDay.toISOString() });

  // Get all Mondays, Wednesdays, Fridays (or selected days) in the month
  const dayNameToNum: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const selectedDayNums = defaultDays.map((d) => dayNameToNum[d]);
  const dates: Date[] = [];

  // Fix: Create new Date for each iteration to avoid mutation issues
  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    if (selectedDayNums.includes(currentDate.getDay())) {
      // Only add if date is within the selected month
      if (currentDate.getMonth() === monthNum - 1) {
        dates.push(new Date(currentDate));
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('Generated dates count:', dates.length);
  if (dates.length > 0) {
    console.log('First date:', dates[0].toISOString());
    console.log('Last date:', dates[dates.length - 1].toISOString());
  }

  // Generate posts for each date
  dates.forEach((date, index) => {
    const dayIndex = index % defaultDays.length;
    const goal = defaultGoals[dayIndex % defaultGoals.length];
    const time = defaultTimes[dayIndex % defaultTimes.length];

    // Map goal to funnel stage
    const funnelStage: FunnelStage =
      goal === 'reach'
        ? 'attraction'
        : goal === 'engagement'
          ? 'retention'
          : goal === 'trust'
            ? 'trust'
            : 'conversion';

    // Find suitable topics
    const suitableTopics = TOPIC_RULES.filter((rule) => rule.funnelStages.includes(funnelStage));
    const topicRule = selectRandomWithGuard(
      suitableTopics,
      guard,
      'topic'
    ) as TopicRule;

    // Select platform
    const platform = selectRandom(topicRule.platforms.filter((p) => defaultPlatforms.includes(p)));

    // Select format for platform
    const platformFormats = topicRule.formats.filter((f) =>
      platform === 'TikTok' ? f.startsWith('TikTok') : f.startsWith('Instagram')
    );
    const format = selectRandomWithGuard(platformFormats, guard, 'format');

    // Select hook type
    const hookType = selectRandomWithGuard(topicRule.hookTypes, guard, 'hook');

    // Select CTA
    const ctaOptions = CTA_TEMPLATES[goal] || CTA_TEMPLATES.reach;
    const cta = selectRandomWithGuard(ctaOptions, guard, 'cta');

    // Add to guard
    guard.add(topicRule.topic, 'topic');
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
      mainMetric: goal === 'reach' ? 'views' : goal === 'engagement' ? 'saves' : goal === 'trust' ? 'subscribes' : 'leads',
      contentSeries: topicRule.series,
      topic: topicRule.topic,
      idea: `${topicRule.topic} - ${format}`,
      hookType,
      hookVariants: [],
      visualScenario: '',
      textStructure: '',
      cta,
      seoKeys: [],
      lsiKeys: [],
      hashtags: [],
      status: 'idea',
    };

    posts.push(post);
  });

  return posts;
};
