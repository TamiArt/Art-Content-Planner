import type { Post, PostAnalytics } from '../types';

export const calculateAnalytics = (analytics: Partial<PostAnalytics>): PostAnalytics => {
  const { views = 0, likes = 0, comments = 0, saves = 0, shares = 0, subscribes = 0, leads = 0, profileVisits = 0 } = analytics;

  const engagementRate = views > 0 ? ((likes + comments + saves + shares) / views) * 100 : 0;
  const saveRate = views > 0 ? (saves / views) * 100 : 0;
  const shareRate = views > 0 ? (shares / views) * 100 : 0;
  const commentRate = views > 0 ? (comments / views) * 100 : 0;
  const subscribeConversionRate = views > 0 ? (subscribes / views) * 100 : 0;
  const leadConversionRate = views > 0 ? (leads / views) * 100 : 0;

  return {
    views,
    likes,
    comments,
    saves,
    shares,
    subscribes,
    leads,
    profileVisits,
    engagementRate: Math.round(engagementRate * 100) / 100,
    saveRate: Math.round(saveRate * 100) / 100,
    shareRate: Math.round(shareRate * 100) / 100,
    commentRate: Math.round(commentRate * 100) / 100,
    subscribeConversionRate: Math.round(subscribeConversionRate * 100) / 100,
    leadConversionRate: Math.round(leadConversionRate * 100) / 100,
  };
};

export interface AnalyticsSummary {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalShares: number;
  totalSubscribes: number;
  totalLeads: number;
  avgEngagementRate: number;
  avgSaveRate: number;
  avgShareRate: number;
  bestPerformingTopics: Array<{ topic: string; avgEngagement: number }>;
  bestPerformingFormats: Array<{ format: string; avgEngagement: number }>;
  bestPerformingDays: Array<{ day: string; avgEngagement: number }>;
  bestPerformingTimes: Array<{ time: string; avgEngagement: number }>;
}

export const getAnalyticsSummary = (posts: Post[]): AnalyticsSummary => {
  const publishedPosts = posts.filter((p) => p.status === 'published' && p.analytics);

  const totalViews = publishedPosts.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
  const totalLikes = publishedPosts.reduce((sum, p) => sum + (p.analytics?.likes || 0), 0);
  const totalComments = publishedPosts.reduce((sum, p) => sum + (p.analytics?.comments || 0), 0);
  const totalSaves = publishedPosts.reduce((sum, p) => sum + (p.analytics?.saves || 0), 0);
  const totalShares = publishedPosts.reduce((sum, p) => sum + (p.analytics?.shares || 0), 0);
  const totalSubscribes = publishedPosts.reduce((sum, p) => sum + (p.analytics?.subscribes || 0), 0);
  const totalLeads = publishedPosts.reduce((sum, p) => sum + (p.analytics?.leads || 0), 0);

  const avgEngagementRate =
    publishedPosts.length > 0
      ? publishedPosts.reduce((sum, p) => sum + (p.analytics?.engagementRate || 0), 0) / publishedPosts.length
      : 0;

  const avgSaveRate =
    publishedPosts.length > 0
      ? publishedPosts.reduce((sum, p) => sum + (p.analytics?.saveRate || 0), 0) / publishedPosts.length
      : 0;

  const avgShareRate =
    publishedPosts.length > 0
      ? publishedPosts.reduce((sum, p) => sum + (p.analytics?.shareRate || 0), 0) / publishedPosts.length
      : 0;

  // Group by topic
  const topicMap = new Map<string, { total: number; count: number }>();
  publishedPosts.forEach((p) => {
    if (p.analytics?.engagementRate) {
      const current = topicMap.get(p.topic) || { total: 0, count: 0 };
      topicMap.set(p.topic, { total: current.total + p.analytics.engagementRate, count: current.count + 1 });
    }
  });
  const bestPerformingTopics = Array.from(topicMap.entries())
    .map(([topic, data]) => ({ topic, avgEngagement: data.total / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Group by format
  const formatMap = new Map<string, { total: number; count: number }>();
  publishedPosts.forEach((p) => {
    if (p.analytics?.engagementRate) {
      const current = formatMap.get(p.format) || { total: 0, count: 0 };
      formatMap.set(p.format, { total: current.total + p.analytics.engagementRate, count: current.count + 1 });
    }
  });
  const bestPerformingFormats = Array.from(formatMap.entries())
    .map(([format, data]) => ({ format, avgEngagement: data.total / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Group by day
  const dayMap = new Map<string, { total: number; count: number }>();
  publishedPosts.forEach((p) => {
    if (p.analytics?.engagementRate) {
      const day = new Date(p.date).toLocaleDateString('ru-RU', { weekday: 'long' });
      const current = dayMap.get(day) || { total: 0, count: 0 };
      dayMap.set(day, { total: current.total + p.analytics.engagementRate, count: current.count + 1 });
    }
  });
  const bestPerformingDays = Array.from(dayMap.entries())
    .map(([day, data]) => ({ day, avgEngagement: data.total / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  // Group by time
  const timeMap = new Map<string, { total: number; count: number }>();
  publishedPosts.forEach((p) => {
    if (p.analytics?.engagementRate) {
      const current = timeMap.get(p.time) || { total: 0, count: 0 };
      timeMap.set(p.time, { total: current.total + p.analytics.engagementRate, count: current.count + 1 });
    }
  });
  const bestPerformingTimes = Array.from(timeMap.entries())
    .map(([time, data]) => ({ time, avgEngagement: data.total / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  return {
    totalPosts: posts.length,
    publishedPosts: publishedPosts.length,
    totalViews,
    totalLikes,
    totalComments,
    totalSaves,
    totalShares,
    totalSubscribes,
    totalLeads,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    avgSaveRate: Math.round(avgSaveRate * 100) / 100,
    avgShareRate: Math.round(avgShareRate * 100) / 100,
    bestPerformingTopics,
    bestPerformingFormats,
    bestPerformingDays,
    bestPerformingTimes,
  };
};
