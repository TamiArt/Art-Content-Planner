import type {
  AppData,
  AppSettings,
  ContentGoal,
  ContentSeries,
  Format,
  FunnelStage,
  GeneratorSettings,
  HookType,
  Idea,
  MonthlyPlan,
  Offer,
  Painting,
  Platform,
  Post,
  PostAnalytics,
  PostStatus,
  SEOCluster,
  Service,
} from '../types';
import { DEFAULT_SEO_CLUSTERS, DEFAULT_SETTINGS } from '../types';

const PLATFORMS = ['TikTok', 'Instagram'] as const satisfies readonly Platform[];
const FORMATS = [
  'TikTok Video',
  'TikTok Slideshow',
  'Instagram Reels',
  'Instagram Carousel',
  'Instagram Post',
  'Instagram Stories',
  'Instagram Highlights',
] as const satisfies readonly Format[];
const CONTENT_GOALS = ['reach', 'engagement', 'trust', 'lead', 'sale'] as const satisfies readonly ContentGoal[];
const FUNNEL_STAGES = ['attraction', 'retention', 'trust', 'conversion'] as const satisfies readonly FunnelStage[];
const POST_STATUSES = ['idea', 'prompt-ready', 'text-ready', 'visual-ready', 'scheduled', 'published'] as const satisfies readonly PostStatus[];
const CONTENT_SERIES = [
  'interior-sketch-mistakes',
  'painting-in-interior',
  'how-to-order',
  'artist-process',
  'before-after',
  'color-mood',
  'perspective-construction',
  'paintings-for-sale',
] as const satisfies readonly ContentSeries[];
const HOOK_TYPES = [
  'question',
  'controversy',
  'mistake',
  'before-after',
  'process',
  'personal-story',
  'shocking-fact',
  'how-to',
] as const satisfies readonly HookType[];
const PAINTING_STATUSES = ['available', 'sold', 'custom-order'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isEnumValue = <T extends string>(values: readonly T[], value: unknown): value is T =>
  isString(value) && values.includes(value as T);

const readString = (source: Record<string, unknown>, key: string, fallback = ''): string => {
  const value = source[key];
  if (value === undefined) return fallback;
  if (isString(value)) return value;
  throw new Error(`Invalid ${key}: expected string`);
};

const readOptionalString = (source: Record<string, unknown>, key: string): string | undefined => {
  const value = source[key];
  if (value === undefined) return undefined;
  if (isString(value)) return value;
  throw new Error(`Invalid ${key}: expected string`);
};

const readOptionalNumber = (source: Record<string, unknown>, key: string): number | undefined => {
  const value = source[key];
  if (value === undefined) return undefined;
  if (isNumber(value)) return value;
  throw new Error(`Invalid ${key}: expected number`);
};

const readStringArray = (source: Record<string, unknown>, key: string, fallback: string[] = []): string[] => {
  const value = source[key];
  if (value === undefined) return fallback;
  if (Array.isArray(value) && value.every(isString)) return value;
  throw new Error(`Invalid ${key}: expected string array`);
};

const readEnum = <T extends string>(source: Record<string, unknown>, key: string, values: readonly T[], fallback: T): T => {
  const value = source[key];
  if (value === undefined) return fallback;
  if (isEnumValue(values, value)) return value;
  throw new Error(`Invalid ${key}: unsupported value`);
};

const readEnumArray = <T extends string>(
  source: Record<string, unknown>,
  key: string,
  values: readonly T[],
  fallback: T[]
): T[] => {
  const value = source[key];
  if (value === undefined) return fallback;
  if (Array.isArray(value) && value.every((item) => isEnumValue(values, item))) return value;
  throw new Error(`Invalid ${key}: unsupported values`);
};

const readObjectArray = <T>(
  source: Record<string, unknown>,
  key: string,
  parser: (value: unknown) => T,
  fallback: T[] = []
): T[] => {
  const value = source[key];
  if (value === undefined) return fallback;
  if (!Array.isArray(value)) throw new Error(`Invalid ${key}: expected array`);
  return value.map(parser);
};

const parseAnalytics = (value: unknown): PostAnalytics | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error('Invalid analytics: expected object');

  return {
    views: readOptionalNumber(value, 'views'),
    likes: readOptionalNumber(value, 'likes'),
    comments: readOptionalNumber(value, 'comments'),
    saves: readOptionalNumber(value, 'saves'),
    shares: readOptionalNumber(value, 'shares'),
    subscribes: readOptionalNumber(value, 'subscribes'),
    leads: readOptionalNumber(value, 'leads'),
    profileVisits: readOptionalNumber(value, 'profileVisits'),
    engagementRate: readOptionalNumber(value, 'engagementRate'),
    saveRate: readOptionalNumber(value, 'saveRate'),
    shareRate: readOptionalNumber(value, 'shareRate'),
    commentRate: readOptionalNumber(value, 'commentRate'),
    subscribeConversionRate: readOptionalNumber(value, 'subscribeConversionRate'),
    leadConversionRate: readOptionalNumber(value, 'leadConversionRate'),
  };
};

const parsePost = (value: unknown): Post => {
  if (!isRecord(value)) throw new Error('Invalid post: expected object');

  return {
    id: readString(value, 'id'),
    date: readString(value, 'date'),
    time: readString(value, 'time'),
    platform: readEnum(value, 'platform', PLATFORMS, 'Instagram'),
    format: readEnum(value, 'format', FORMATS, 'Instagram Post'),
    goal: readEnum(value, 'goal', CONTENT_GOALS, 'reach'),
    funnelStage: readEnum(value, 'funnelStage', FUNNEL_STAGES, 'attraction'),
    mainMetric: readString(value, 'mainMetric', 'views'),
    contentSeries: value.contentSeries === undefined ? undefined : readEnum(value, 'contentSeries', CONTENT_SERIES, 'artist-process'),
    topic: readString(value, 'topic'),
    idea: readString(value, 'idea'),
    hookType: value.hookType === undefined ? undefined : readEnum(value, 'hookType', HOOK_TYPES, 'question'),
    hookVariants: readStringArray(value, 'hookVariants'),
    selectedHook: readOptionalString(value, 'selectedHook'),
    visualScenario: readString(value, 'visualScenario'),
    textStructure: readString(value, 'textStructure'),
    cta: readString(value, 'cta'),
    seoKeys: readStringArray(value, 'seoKeys'),
    lsiKeys: readStringArray(value, 'lsiKeys'),
    hashtags: readStringArray(value, 'hashtags'),
    promptForAI: readOptionalString(value, 'promptForAI'),
    aiResponse: readOptionalString(value, 'aiResponse'),
    status: readEnum(value, 'status', POST_STATUSES, 'idea'),
    notes: readOptionalString(value, 'notes'),
    analytics: parseAnalytics(value.analytics),
  };
};

const parseIdea = (value: unknown): Idea => {
  if (!isRecord(value)) throw new Error('Invalid idea: expected object');
  return {
    id: readString(value, 'id'),
    createdAt: readString(value, 'createdAt'),
    title: readString(value, 'title'),
    description: readString(value, 'description'),
    tags: readStringArray(value, 'tags'),
    convertedToPostId: readOptionalString(value, 'convertedToPostId'),
  };
};

const parsePainting = (value: unknown): Painting => {
  if (!isRecord(value)) throw new Error('Invalid painting: expected object');
  return {
    id: readString(value, 'id'),
    title: readString(value, 'title'),
    imageUrl: readOptionalString(value, 'imageUrl'),
    size: readString(value, 'size'),
    technique: readString(value, 'technique'),
    price: readOptionalNumber(value, 'price'),
    status: readEnum(value, 'status', PAINTING_STATUSES, 'available'),
    colors: readStringArray(value, 'colors'),
    mood: readString(value, 'mood'),
    suitableInterior: readString(value, 'suitableInterior'),
    spaceContribution: readString(value, 'spaceContribution'),
    keyIdea: readString(value, 'keyIdea'),
    cta: readString(value, 'cta'),
  };
};

const parseService = (value: unknown): Service => {
  if (!isRecord(value)) throw new Error('Invalid service: expected object');
  return {
    id: readString(value, 'id'),
    title: readString(value, 'title'),
    description: readString(value, 'description'),
    includes: readStringArray(value, 'includes'),
    targetAudience: readString(value, 'targetAudience'),
    timeline: readString(value, 'timeline'),
    price: readString(value, 'price'),
    clientRequirements: readStringArray(value, 'clientRequirements'),
    result: readString(value, 'result'),
    cta: readString(value, 'cta'),
  };
};

const parseOffer = (value: unknown): Offer => {
  if (!isRecord(value)) throw new Error('Invalid offer: expected object');
  return {
    id: readString(value, 'id'),
    title: readString(value, 'title'),
    clientGets: readStringArray(value, 'clientGets'),
    targetAudience: readString(value, 'targetAudience'),
    clientPain: readString(value, 'clientPain'),
    solution: readString(value, 'solution'),
    timeline: readString(value, 'timeline'),
    price: readString(value, 'price'),
    ctaPhrase: readString(value, 'ctaPhrase'),
  };
};

const parseSEOCluster = (value: unknown): SEOCluster => {
  if (!isRecord(value)) throw new Error('Invalid SEO cluster: expected object');
  return {
    name: readString(value, 'name'),
    mainKey: readString(value, 'mainKey'),
    lsiKeys: readStringArray(value, 'lsiKeys'),
    hashtags: readStringArray(value, 'hashtags'),
  };
};

const parseGeneratorSettings = (value: unknown): GeneratorSettings => {
  if (!isRecord(value)) return DEFAULT_SETTINGS.generator;
  return {
    defaultPostsPerWeek: readOptionalNumber(value, 'defaultPostsPerWeek') ?? DEFAULT_SETTINGS.generator.defaultPostsPerWeek,
    defaultDays: readStringArray(value, 'defaultDays', DEFAULT_SETTINGS.generator.defaultDays),
    defaultTimes: readStringArray(value, 'defaultTimes', DEFAULT_SETTINGS.generator.defaultTimes),
    defaultPlatforms: readEnumArray(value, 'defaultPlatforms', PLATFORMS, DEFAULT_SETTINGS.generator.defaultPlatforms),
    defaultGoals: readEnumArray(value, 'defaultGoals', CONTENT_GOALS, DEFAULT_SETTINGS.generator.defaultGoals),
  };
};

const parseSettings = (value: unknown): AppSettings => {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  const styleValue = value.style;
  const style = isRecord(styleValue) ? styleValue : {};

  return {
    userName: readOptionalString(value, 'userName'),
    niche: readStringArray(value, 'niche', DEFAULT_SETTINGS.niche),
    style: {
      tone: readStringArray(style, 'tone', DEFAULT_SETTINGS.style.tone),
      avoidances: readStringArray(style, 'avoidances', DEFAULT_SETTINGS.style.avoidances),
      focus: readStringArray(style, 'focus', DEFAULT_SETTINGS.style.focus),
    },
    generator: parseGeneratorSettings(value.generator),
  };
};

const parseMonthlyPlan = (value: unknown): MonthlyPlan => {
  if (!isRecord(value)) throw new Error('Invalid monthly plan: expected object');
  return {
    id: readString(value, 'id'),
    month: readString(value, 'month'),
    settings: parseGeneratorSettings(value.settings),
    postIds: readStringArray(value, 'postIds'),
    createdAt: readString(value, 'createdAt'),
  };
};

export const parseAppData = (value: unknown, storageVersion: string): AppData => {
  if (!isRecord(value)) {
    throw new Error('Invalid app data: expected object');
  }

  if (value.settings === undefined && value.posts === undefined) {
    throw new Error('Invalid app data: not an Art Content Planner export');
  }

  return {
    version: storageVersion,
    settings: parseSettings(value.settings),
    monthlyPlans: readObjectArray(value, 'monthlyPlans', parseMonthlyPlan),
    posts: readObjectArray(value, 'posts', parsePost),
    ideas: readObjectArray(value, 'ideas', parseIdea),
    paintings: readObjectArray(value, 'paintings', parsePainting),
    services: readObjectArray(value, 'services', parseService),
    offers: readObjectArray(value, 'offers', parseOffer),
    seoCluster: readObjectArray(value, 'seoCluster', parseSEOCluster, DEFAULT_SEO_CLUSTERS),
    lastUpdated: readString(value, 'lastUpdated', new Date().toISOString()),
  };
};
