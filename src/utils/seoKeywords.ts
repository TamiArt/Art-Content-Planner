import type { SEOCluster } from '../types';

export const findBestCluster = (topic: string, clusters: SEOCluster[]): SEOCluster | null => {
  const topicLower = topic.toLowerCase();

  // Direct match
  for (const cluster of clusters) {
    if (topicLower.includes(cluster.name.toLowerCase())) {
      return cluster;
    }
  }

  // Keyword match
  for (const cluster of clusters) {
    if (
      topicLower.includes(cluster.mainKey.toLowerCase()) ||
      cluster.lsiKeys.some((key) => topicLower.includes(key.toLowerCase()))
    ) {
      return cluster;
    }
  }

  return clusters[0] || null; // Fallback to first
};

export const generateSEOKeysForPost = (topic: string, clusters: SEOCluster[]): { seoKeys: string[]; lsiKeys: string[]; hashtags: string[] } => {
  const cluster = findBestCluster(topic, clusters);

  if (!cluster) {
    return {
      seoKeys: [topic],
      lsiKeys: [],
      hashtags: ['#искусство', '#художник', '#творчество', '#интерьер', '#картина'],
    };
  }

  const seoKeys = [cluster.mainKey, ...cluster.lsiKeys.slice(0, 3)];
  const lsiKeys = cluster.lsiKeys;
  const hashtags = cluster.hashtags.slice(0, 5); // Exactly 5

  return { seoKeys, lsiKeys, hashtags };
};

export const extractKeywordsFromText = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const wordCount = new Map<string, number>();
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};
