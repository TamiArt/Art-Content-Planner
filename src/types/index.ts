// Core data types for Art Content Planner

export type Platform = 'TikTok' | 'Instagram';

export type Format =
  | 'TikTok Video'
  | 'TikTok Slideshow'
  | 'Instagram Reels'
  | 'Instagram Carousel'
  | 'Instagram Post'
  | 'Instagram Stories'
  | 'Instagram Highlights';

export type ContentGoal = 'reach' | 'engagement' | 'trust' | 'lead' | 'sale';

export type SourceType = 'painting' | 'service' | 'offer';

export type FunnelStage = 'attraction' | 'retention' | 'trust' | 'conversion';

export type PostStatus =
  | 'idea'
  | 'prompt-ready'
  | 'text-ready'
  | 'visual-ready'
  | 'scheduled'
  | 'published';

export type ContentSeries =
  | 'interior-sketch-mistakes'
  | 'painting-in-interior'
  | 'how-to-order'
  | 'artist-process'
  | 'before-after'
  | 'color-mood'
  | 'perspective-construction'
  | 'paintings-for-sale';

export type HookType =
  | 'question'
  | 'controversy'
  | 'mistake'
  | 'before-after'
  | 'process'
  | 'personal-story'
  | 'shocking-fact'
  | 'how-to';

export interface Post {
  id: string;
  date: string; // ISO date
  time: string; // HH:mm
  platform: Platform;
  format: Format;
  goal: ContentGoal;
  funnelStage: FunnelStage;
  mainMetric: string;
  contentSeries?: ContentSeries;
  topic: string;
  idea: string;
  hookType?: HookType;
  hookVariants: string[];
  selectedHook?: string;
  visualScenario: string;
  textStructure: string;
  cta: string;
  seoKeys: string[];
  lsiKeys: string[];
  hashtags: string[]; // exactly 5
  promptForAI?: string;
  aiResponse?: string;
  status: PostStatus;
  notes?: string;
  analytics?: PostAnalytics;
  sourceType?: SourceType;
  sourceId?: string;
  sourceTitle?: string;
  campaignId?: string;
  storySequenceId?: string;
  repackagedFromPostId?: string;
  firstFrameDescription?: string;
  onScreenHookText?: string;
  firstThreeSecondsPlan?: string;
  retentionPlan?: string;
  searchKeywords?: string[];
  onScreenTextKeywords?: string[];
  captionFirstLine?: string;
  altText?: string;
  contentBalanceSlot?: ContentGoal;
}

export interface PostAnalytics {
  views?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
  subscribes?: number;
  leads?: number;
  profileVisits?: number;
  // Calculated metrics
  engagementRate?: number;
  saveRate?: number;
  shareRate?: number;
  commentRate?: number;
  subscribeConversionRate?: number;
  leadConversionRate?: number;
}

export interface Idea {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  tags: string[];
  platform?: Platform;
  format?: Format;
  goal?: ContentGoal;
  plannedDate?: string;
  plannedTime?: string;
  convertedToPostId?: string;
}

export interface Painting {
  id: string;
  title: string;
  imageUrl?: string;
  size: string;
  technique: string;
  price?: number;
  status: 'available' | 'sold' | 'custom-order';
  colors: string[];
  mood: string;
  suitableInterior: string;
  spaceContribution: string;
  keyIdea: string;
  cta: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  includes: string[];
  targetAudience: string;
  timeline: string;
  price: string;
  clientRequirements: string[];
  result: string;
  cta: string;
}

export interface Offer {
  id: string;
  title: string;
  clientGets: string[];
  targetAudience: string;
  clientPain: string;
  solution: string;
  timeline: string;
  price: string;
  ctaPhrase: string;
}

export interface SEOCluster {
  name: string;
  mainKey: string;
  lsiKeys: string[];
  hashtags: string[];
}

export interface ContentCampaign {
  id: string;
  title: string;
  goal: 'sell-painting' | 'promote-service' | 'launch-offer' | 'warm-audience';
  sourceType?: SourceType;
  sourceId?: string;
  sourceTitle?: string;
  startDate: string;
  endDate: string;
  postIds: string[];
  storySequenceIds: string[];
  targetMetric: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
}

export interface HookLibraryItem {
  id: string;
  text: string;
  hookType: HookType;
  platform: Platform;
  format: Format;
  sourcePostId?: string;
  avgEngagementRate?: number;
  avgRetentionRate?: number;
  usageCount: number;
  status: 'testing' | 'works' | 'weak';
  notes?: string;
  createdAt: string;
}

export interface StorySlide {
  id: string;
  order: number;
  frame: string;
  text: string;
  sticker?: 'poll' | 'question' | 'quiz' | 'link' | 'none';
  cta?: string;
}

export interface StorySequence {
  id: string;
  title: string;
  platform: Platform;
  goal: 'warm-up' | 'poll' | 'direct' | 'sale' | 'behind-scenes';
  date: string;
  sourceType?: SourceType;
  sourceId?: string;
  sourceTitle?: string;
  campaignId?: string;
  slides: StorySlide[];
  createdAt: string;
}

export interface ContentBalanceMatrix {
  reach: number;
  engagement: number;
  trust: number;
  lead: number;
  sale: number;
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  goals: ContentGoal[];
  platforms: Platform[];
  formats: Format[];
  hookTypes: HookType[];
  frequencyPerMonth: number;
  cta: string;
  enabled: boolean;
}

export interface GeneratorSettings {
  defaultPostsPerWeek: number;
  defaultDays: string[]; // ['Monday', 'Wednesday', 'Friday']
  defaultTimes: string[]; // ['09:00', '15:00', '18:00']
  defaultPlatforms: Platform[];
  defaultGoals: ContentGoal[]; // ['reach', 'trust', 'lead']
}

export interface MonthlyPlan {
  id: string;
  month: string; // YYYY-MM
  settings: GeneratorSettings;
  postIds: string[];
  createdAt: string;
}

export interface AppSettings {
  userName?: string;
  niche: string[];
  style: {
    tone: string[];
    avoidances: string[];
    focus: string[];
  };
  generator: GeneratorSettings;
}

export interface AppData {
  version: string;
  settings: AppSettings;
  monthlyPlans: MonthlyPlan[];
  posts: Post[];
  ideas: Idea[];
  paintings: Painting[];
  services: Service[];
  offers: Offer[];
  campaigns: ContentCampaign[];
  hookLibrary: HookLibraryItem[];
  storySequences: StorySequence[];
  rubrics: Rubric[];
  contentBalance: ContentBalanceMatrix;
  seoCluster: SEOCluster[];
  lastUpdated: string;
}

// Default values
export const DEFAULT_SETTINGS: AppSettings = {
  niche: [
    'Интерьерные скетчи на iPad',
    'Картины маслом',
    'Визуализация картин в интерьере',
    'Процесс рисования',
    'Ошибки в перспективе',
    'До/после',
    'Быстрые зарисовки',
    'Картины на продажу',
    'Услуги художника',
  ],
  style: {
    tone: ['живой', 'экспертный', 'мягкий', 'визуальный'],
    avoidances: ['банальности', 'агрессивные продажи', 'длинные тексты', 'SEO-спам'],
    focus: ['интерьер', 'свет', 'цвет', 'глубина', 'настроение', 'пространство'],
  },
  generator: {
    defaultPostsPerWeek: 3,
    defaultDays: ['Monday', 'Wednesday', 'Friday'],
    defaultTimes: ['09:00', '15:00', '18:00'],
    defaultPlatforms: ['TikTok', 'Instagram'],
    defaultGoals: ['reach', 'trust', 'lead'],
  },
};

export const DEFAULT_CONTENT_BALANCE: ContentBalanceMatrix = {
  reach: 35,
  engagement: 20,
  trust: 25,
  lead: 15,
  sale: 5,
};

export const DEFAULT_RUBRICS: Rubric[] = [
  {
    id: 'rubric-hooks-mistakes',
    title: 'Ошибки в интерьере',
    description: 'Короткие ролики и карусели про ошибки выбора картин, света, цвета и перспективы.',
    goals: ['reach', 'engagement'],
    platforms: ['TikTok', 'Instagram'],
    formats: ['TikTok Video', 'Instagram Reels', 'Instagram Carousel'],
    hookTypes: ['mistake', 'question', 'how-to'],
    frequencyPerMonth: 4,
    cta: 'Сохрани, чтобы не повторить эту ошибку',
    enabled: true,
  },
  {
    id: 'rubric-painting-in-interior',
    title: 'Картина в интерьере',
    description: 'Показывает конкретные работы, настроение, размеры, цвет и пользу для пространства.',
    goals: ['trust', 'lead', 'sale'],
    platforms: ['Instagram', 'TikTok'],
    formats: ['Instagram Post', 'Instagram Carousel', 'Instagram Stories', 'TikTok Slideshow'],
    hookTypes: ['before-after', 'personal-story', 'question'],
    frequencyPerMonth: 6,
    cta: 'Напиши в Direct, если хочешь примерить картину к своему интерьеру',
    enabled: true,
  },
  {
    id: 'rubric-service-warmup',
    title: 'Прогрев услуги',
    description: 'Польза, процесс, результат, FAQ и мягкий переход к заявке.',
    goals: ['trust', 'lead'],
    platforms: ['Instagram', 'TikTok'],
    formats: ['Instagram Carousel', 'Instagram Reels', 'Instagram Stories', 'TikTok Video'],
    hookTypes: ['how-to', 'process', 'question'],
    frequencyPerMonth: 4,
    cta: 'Напиши в Direct — подскажу, какой формат подойдёт',
    enabled: true,
  },
];

export const DEFAULT_SEO_CLUSTERS: SEOCluster[] = [
  {
    name: 'Интерьерные скетчи',
    mainKey: 'интерьерный скетч',
    lsiKeys: ['скетч интерьера', 'эскиз помещения', 'рисунок интерьера', 'дизайн скетч', 'интерьерная графика'],
    hashtags: ['#интерьерныйскетч', '#скетчинг', '#интерьер', '#дизайнинтерьера', '#рисунокинтерьера'],
  },
  {
    name: 'Картины маслом',
    mainKey: 'картина маслом',
    lsiKeys: ['живопись маслом', 'масляная живопись', 'картина художника', 'авторская картина', 'живопись'],
    hashtags: ['#картинамаслом', '#живописьмаслом', '#картинахудожника', '#живопись', '#масло'],
  },
  {
    name: 'Картина в интерьере',
    mainKey: 'картина в интерьер',
    lsiKeys: ['картина на стену', 'подбор картины', 'картина для дома', 'искусство в интерьере', 'декор стен'],
    hashtags: ['#картинавинтерьере', '#картинанастену', '#декорстен', '#интерьер', '#картинадлядома'],
  },
  {
    name: 'Процесс рисования',
    mainKey: 'процесс рисования',
    lsiKeys: ['как рисовать', 'создание картины', 'работа художника', 'этапы рисования', 'рисование'],
    hashtags: ['#процессрисования', '#какрисовать', '#художник', '#рисование', '#творчество'],
  },
  {
    name: 'Ошибки и обучение',
    mainKey: 'ошибки в рисовании',
    lsiKeys: ['типичные ошибки', 'как не ошибиться', 'ошибки новичков', 'исправление ошибок', 'учимся рисовать'],
    hashtags: ['#ошибкихудожника', '#учусьрисовать', '#урокирисования', '#советыхудожника', '#рисование'],
  },
  {
    name: 'Продажа и заявки',
    mainKey: 'купить картину',
    lsiKeys: ['заказать картину', 'картина на заказ', 'авторская работа', 'купить живопись', 'заказ картины'],
    hashtags: ['#купитькартину', '#заказатькартину', '#картинаназаказ', '#продажакартин', '#авторскаяработа'],
  },
];
