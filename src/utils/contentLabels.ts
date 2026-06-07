import type { ContentGoal, PostStatus } from '../types';

export const goalColors: Record<ContentGoal, string> = {
  reach: '#3b82f6',
  engagement: '#8b5cf6',
  trust: '#10b981',
  lead: '#f59e0b',
  sale: '#ef4444',
};

export const goalLabels: Record<ContentGoal, string> = {
  reach: 'Охват',
  engagement: 'Вовлечение',
  trust: 'Доверие',
  lead: 'Заявка',
  sale: 'Продажа',
};

export const statusLabels: Record<PostStatus, string> = {
  idea: 'Идея',
  'prompt-ready': 'Промпт готов',
  'text-ready': 'Текст готов',
  'visual-ready': 'Визуал готов',
  scheduled: 'Запланировано',
  published: 'Опубликовано',
};
