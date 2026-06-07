import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Check, Layers, Trash2 } from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import { buildPromptForPost, copyToClipboard } from '../utils/promptBuilder';
import { calculateAnalytics } from '../utils/analytics';
import { formatDateLocal } from '../utils/date';
import { createFormatVariations } from '../utils/contentWorkflows';

import type {
  ContentGoal,
  Format,
  Platform,
  Post,
  PostAnalytics,
  PostStatus,
} from '../types';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const parseCommaList = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const createEmptyPost = (): Post => ({
  id: generateId(),
  date: formatDateLocal(new Date()),
  time: '09:00',

  platform: 'Instagram',
  format: 'Instagram Post',
  goal: 'reach',
  funnelStage: 'attraction',
  mainMetric: 'views',

  topic: '',
  idea: '',
  hookVariants: [],
  selectedHook: '',
  hookType: 'question',

  visualScenario: '',
  textStructure: '',
  cta: '',

  seoKeys: [],
  lsiKeys: [],
  hashtags: [],
  searchKeywords: [],
  onScreenTextKeywords: [],

  firstFrameDescription: '',
  onScreenHookText: '',
  firstThreeSecondsPlan: '',
  retentionPlan: '',
  captionFirstLine: '',
  altText: '',

  promptForAI: '',
  aiResponse: '',
  notes: '',

  status: 'idea',
});

const emptyAnalyticsFields: Array<
  keyof Omit<
    PostAnalytics,
    | 'engagementRate'
    | 'saveRate'
    | 'shareRate'
    | 'commentRate'
    | 'subscribeConversionRate'
    | 'leadConversionRate'
  >
> = [
  'views',
  'likes',
  'comments',
  'saves',
  'shares',
  'subscribes',
  'leads',
  'profileVisits',
];

function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data,
    addPost,
    addPosts,
    updatePost,
    deletePost,
    updateData,
  } = useAppContext();

  const isNewPost = id === 'new';

  const existingPost = useMemo(() => {
    if (isNewPost || !id) return undefined;
    return data.posts.find((post) => post.id === id);
  }, [data.posts, id, isNewPost]);

  const [formData, setFormData] = useState<Post>(() => {
    return existingPost ?? createEmptyPost();
  });

  const [copied, setCopied] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (existingPost) {
      setFormData(existingPost);
      return;
    }

    if (isNewPost) {
      setFormData(createEmptyPost());
    }
  }, [existingPost, isNewPost]);

  const handleChange = <K extends keyof Post>(field: K, value: Post[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSelectedHookToLibrary = (postToSave: Post) => {
    if (!postToSave.selectedHook) return;

    const hookLibrary = data.hookLibrary ?? [];
    const alreadyExists = hookLibrary.some(
      (hook) => hook.text === postToSave.selectedHook,
    );

    if (alreadyExists) return;

    updateData({
      hookLibrary: [
        {
          id: generateId(),
          text: postToSave.selectedHook,
          hookType: postToSave.hookType || 'question',
          platform: postToSave.platform,
          format: postToSave.format,
          sourcePostId: postToSave.id,
          usageCount: 1,
          status: 'testing',
          createdAt: new Date().toISOString(),
        },
        ...hookLibrary,
      ],
    });
  };

  const handleSave = () => {
    const postToSave: Post = {
      ...createEmptyPost(),
      ...formData,
      id: formData.id || generateId(),
    };

    saveSelectedHookToLibrary(postToSave);

    if (isNewPost) {
      addPost(postToSave);
      alert('Пост создан');
    } else if (id) {
      updatePost(id, postToSave);
      alert('Пост сохранен');
    }

    navigate('/calendar');
  };

  const handleDelete = () => {
    if (isNewPost) {
      navigate('/calendar');
      return;
    }

    if (!id) return;

    const confirmed = window.confirm('Удалить этот пост?');

    if (confirmed) {
      deletePost(id);
      navigate('/calendar');
    }
  };

  const handleCreateFormatVersions = () => {
    const postForVariations: Post = {
      ...createEmptyPost(),
      ...existingPost,
      ...formData,
    };

    const variations = createFormatVariations(postForVariations);

    addPosts(variations);
    alert('Созданы варианты этого материала в других форматах');
    navigate('/calendar');
  };

  const handleGeneratePrompt = () => {
    const prompt = buildPromptForPost(formData, data.settings);

    setFormData((prev) => ({
      ...prev,
      promptForAI: prompt,
      status: 'prompt-ready',
    }));
  };

  const handleCopyPrompt = async () => {
    if (!formData.promptForAI) return;

    const success = await copyToClipboard(formData.promptForAI);

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAnalyticsChange = (
    field: keyof Omit<
      PostAnalytics,
      | 'engagementRate'
      | 'saveRate'
      | 'shareRate'
      | 'commentRate'
      | 'subscribeConversionRate'
      | 'leadConversionRate'
    >,
    value: number,
  ) => {
    const newAnalytics = {
      ...(formData.analytics || {}),
      [field]: value,
    };

    const calculatedAnalytics = calculateAnalytics(newAnalytics);

    handleChange('analytics', calculatedAnalytics);
  };

  if (!existingPost && !isNewPost) {
    return (
      <div className="post-editor">
        <div className="card">
          <h2>Пост не найден</h2>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/calendar')}
          >
            Вернуться к календарю
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-editor">
      <header className="page-header">
        <h1>{isNewPost ? 'Новый пост' : 'Редактор поста'}</h1>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCreateFormatVersions}
          >
            <Layers size={16} />
            Переупаковать в форматы
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            Сохранить
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            {isNewPost ? 'Отмена' : 'Удалить'}
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <section className="card">
          <h2>Основная информация</h2>

          <div className="form-group">
            <label htmlFor="post-date">Дата публикации</label>
            <input
              id="post-date"
              type="date"
              value={formData.date}
              onChange={(event) => handleChange('date', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-time">Время</label>
            <input
              id="post-time"
              type="time"
              value={formData.time}
              onChange={(event) => handleChange('time', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-platform">Платформа</label>
            <select
              id="post-platform"
              value={formData.platform}
              onChange={(event) =>
                handleChange('platform', event.target.value as Platform)
              }
            >
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-format">Формат</label>
            <select
              id="post-format"
              value={formData.format}
              onChange={(event) =>
                handleChange('format', event.target.value as Format)
              }
            >
              <option value="TikTok Video">TikTok Video</option>
              <option value="TikTok Slideshow">TikTok Slideshow</option>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="Instagram Carousel">Instagram Carousel</option>
              <option value="Instagram Post">Instagram Post</option>
              <option value="Instagram Stories">Instagram Stories</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-goal">Цель</label>
            <select
              id="post-goal"
              value={formData.goal}
              onChange={(event) =>
                handleChange('goal', event.target.value as ContentGoal)
              }
            >
              <option value="reach">Охват</option>
              <option value="engagement">Вовлечение</option>
              <option value="trust">Доверие</option>
              <option value="lead">Заявка</option>
              <option value="sale">Продажа</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-status">Статус</label>
            <select
              id="post-status"
              value={formData.status}
              onChange={(event) =>
                handleChange('status', event.target.value as PostStatus)
              }
            >
              <option value="idea">Идея</option>
              <option value="prompt-ready">Промпт готов</option>
              <option value="text-ready">Текст готов</option>
              <option value="visual-ready">Визуал готов</option>
              <option value="scheduled">Запланировано</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-topic">Тема</label>
            <input
              id="post-topic"
              type="text"
              value={formData.topic}
              onChange={(event) => handleChange('topic', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-idea">Идея</label>
            <textarea
              id="post-idea"
              rows={3}
              value={formData.idea}
              onChange={(event) => handleChange('idea', event.target.value)}
              placeholder="Опишите основную идею поста"
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-cta">Call-to-Action</label>
            <input
              id="post-cta"
              type="text"
              value={formData.cta}
              onChange={(event) => handleChange('cta', event.target.value)}
              placeholder="Что должен сделать зритель?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="first-frame">
              Контроль первых кадров для Reels/TikTok
            </label>
            <textarea
              id="first-frame"
              rows={2}
              value={formData.firstFrameDescription || ''}
              onChange={(event) =>
                handleChange('firstFrameDescription', event.target.value)
              }
              placeholder="Что видно в первом кадре, чтобы остановить скролл?"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="screen-hook">Текст на экране</label>
              <input
                id="screen-hook"
                value={formData.onScreenHookText || ''}
                onChange={(event) =>
                  handleChange('onScreenHookText', event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="first-seconds">Первые 3 секунды</label>
              <input
                id="first-seconds"
                value={formData.firstThreeSecondsPlan || ''}
                onChange={(event) =>
                  handleChange('firstThreeSecondsPlan', event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="retention-plan">Retention-план</label>
            <textarea
              id="retention-plan"
              rows={2}
              value={formData.retentionPlan || ''}
              onChange={(event) =>
                handleChange('retentionPlan', event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="search-keywords">Search SEO: ключевые фразы</label>
            <input
              id="search-keywords"
              value={formData.searchKeywords?.join(', ') || ''}
              onChange={(event) =>
                handleChange('searchKeywords', parseCommaList(event.target.value))
              }
              placeholder="картина в интерьер, интерьерный скетч, картина маслом"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="screen-keywords">Ключи на экране</label>
              <input
                id="screen-keywords"
                value={formData.onScreenTextKeywords?.join(', ') || ''}
                onChange={(event) =>
                  handleChange(
                    'onScreenTextKeywords',
                    parseCommaList(event.target.value),
                  )
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="caption-line">Первая строка описания</label>
              <input
                id="caption-line"
                value={formData.captionFirstLine || ''}
                onChange={(event) =>
                  handleChange('captionFirstLine', event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="alt-text">Alt/описание визуала</label>
            <input
              id="alt-text"
              value={formData.altText || ''}
              onChange={(event) => handleChange('altText', event.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="post-notes">Заметки</label>
            <textarea
              id="post-notes"
              rows={3}
              value={formData.notes || ''}
              onChange={(event) => handleChange('notes', event.target.value)}
              placeholder="Любые заметки по посту"
            />
          </div>
        </section>

        <section className="card">
          <h2>Промпт для ИИ</h2>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGeneratePrompt}
          >
            Сгенерировать промпт
          </button>

          {formData.promptForAI && (
            <>
              <div className="prompt-display">
                <pre>{formData.promptForAI}</pre>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyPrompt}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Скопировать промпт
                  </>
                )}
              </button>
            </>
          )}
        </section>

        <section className="card">
          <h2>Контент</h2>

          <div className="form-group">
            <label htmlFor="visual-scenario">Визуальный сценарий</label>
            <textarea
              id="visual-scenario"
              rows={5}
              value={formData.visualScenario}
              onChange={(event) =>
                handleChange('visualScenario', event.target.value)
              }
              placeholder="Опишите, что будет на экране кадр за кадром"
            />
          </div>

          <div className="form-group">
            <label htmlFor="text-structure">Структура текста</label>
            <textarea
              id="text-structure"
              rows={5}
              value={formData.textStructure}
              onChange={(event) =>
                handleChange('textStructure', event.target.value)
              }
              placeholder="Структура текста или сценарий озвучки"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ai-response">Ответ ИИ / готовый текст</label>
            <textarea
              id="ai-response"
              rows={8}
              value={formData.aiResponse || ''}
              onChange={(event) => handleChange('aiResponse', event.target.value)}
              placeholder="Вставьте ответ от ChatGPT/Claude или напишите финальный текст"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hashtags">Хэштеги, максимум 5</label>
            <input
              id="hashtags"
              type="text"
              value={formData.hashtags?.join(', ') || ''}
              onChange={(event) =>
                handleChange('hashtags', parseCommaList(event.target.value).slice(0, 5))
              }
              placeholder="#хэштег1, #хэштег2, #хэштег3, #хэштег4, #хэштег5"
            />
          </div>
        </section>

        <section className="card">
          <h2>Аналитика</h2>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAnalytics((prev) => !prev)}
          >
            {showAnalytics ? 'Скрыть' : 'Добавить результаты'}
          </button>

          {showAnalytics && (
            <div className="analytics-form">
              <div className="form-row">
                {emptyAnalyticsFields.slice(0, 3).map((field) => (
                  <div className="form-group" key={field}>
                    <label>{analyticsLabelMap[field]}</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.analytics?.[field] || 0}
                      onChange={(event) =>
                        handleAnalyticsChange(field, Number(event.target.value))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                {emptyAnalyticsFields.slice(3, 6).map((field) => (
                  <div className="form-group" key={field}>
                    <label>{analyticsLabelMap[field]}</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.analytics?.[field] || 0}
                      onChange={(event) =>
                        handleAnalyticsChange(field, Number(event.target.value))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="form-row">
                {emptyAnalyticsFields.slice(6).map((field) => (
                  <div className="form-group" key={field}>
                    <label>{analyticsLabelMap[field]}</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.analytics?.[field] || 0}
                      onChange={(event) =>
                        handleAnalyticsChange(field, Number(event.target.value))
                      }
                    />
                  </div>
                ))}
              </div>

              {formData.analytics && (
                <div className="calculated-metrics">
                  <h3>Рассчитанные метрики</h3>
                  <p>Engagement Rate: {formData.analytics.engagementRate}%</p>
                  <p>Save Rate: {formData.analytics.saveRate}%</p>
                  <p>Share Rate: {formData.analytics.shareRate}%</p>
                  <p>Comment Rate: {formData.analytics.commentRate}%</p>
                  <p>
                    Subscribe Conversion:{' '}
                    {formData.analytics.subscribeConversionRate}%
                  </p>
                  <p>
                    Lead Conversion: {formData.analytics.leadConversionRate}%
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const analyticsLabelMap: Record<
  keyof Omit<
    PostAnalytics,
    | 'engagementRate'
    | 'saveRate'
    | 'shareRate'
    | 'commentRate'
    | 'subscribeConversionRate'
    | 'leadConversionRate'
  >,
  string
> = {
  views: 'Просмотры',
  likes: 'Лайки',
  comments: 'Комментарии',
  saves: 'Сохранения',
  shares: 'Репосты',
  subscribes: 'Подписки',
  leads: 'Заявки',
  profileVisits: 'Переходы в профиль',
};

export default PostEditor;