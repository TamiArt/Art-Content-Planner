import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { buildPromptForPost, copyToClipboard } from '../utils/promptBuilder';
import { calculateAnalytics } from '../utils/analytics';
import type { Post, PostStatus, Platform, Format, ContentGoal } from '../types';
import { Copy, Check, Trash2 } from 'lucide-react';

const PostEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, updatePost, deletePost } = useAppContext();

  const post = data.posts.find((p) => p.id === id);

  const [formData, setFormData] = useState<Partial<Post>>(post || {});
  const [copied, setCopied] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData(post);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="post-editor">
        <div className="card">
          <h2>Пост не найден</h2>
          <button className="btn btn-primary" onClick={() => navigate('/calendar')}>
            Вернуться к календарю
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof Post, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    if (id) {
      updatePost(id, formData);
      alert('Пост сохранен');
      navigate('/calendar');
    }
  };

  const handleDelete = () => {
    if (confirm('Удалить этот пост?')) {
      deletePost(id!);
      navigate('/calendar');
    }
  };

  const handleGeneratePrompt = () => {
    const prompt = buildPromptForPost({ ...post, ...formData } as Post, data.settings);
    handleChange('promptForAI', prompt);
    handleChange('status', 'prompt-ready');
  };

  const handleCopyPrompt = async () => {
    if (formData.promptForAI) {
      const success = await copyToClipboard(formData.promptForAI);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleAnalyticsChange = (field: string, value: number) => {
    const newAnalytics = { ...(formData.analytics || {}), [field]: value };
    const calculated = calculateAnalytics(newAnalytics);
    handleChange('analytics', calculated);
  };

  return (
    <div className="post-editor">
      <header className="page-header">
        <h1>Редактор поста</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} />
            Удалить
          </button>
        </div>
      </header>

      <div className="editor-layout">
        <section className="card">
          <h2>Основная информация</h2>

          <div className="form-group">
            <label>Дата публикации</label>
            <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Время</label>
            <input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Платформа</label>
            <select value={formData.platform} onChange={(e) => handleChange('platform', e.target.value as Platform)}>
              <option value="TikTok">TikTok</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>

          <div className="form-group">
            <label>Формат</label>
            <select value={formData.format} onChange={(e) => handleChange('format', e.target.value as Format)}>
              <option value="TikTok Video">TikTok Video</option>
              <option value="TikTok Slideshow">TikTok Slideshow</option>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="Instagram Carousel">Instagram Carousel</option>
              <option value="Instagram Post">Instagram Post</option>
              <option value="Instagram Stories">Instagram Stories</option>
            </select>
          </div>

          <div className="form-group">
            <label>Цель</label>
            <select value={formData.goal} onChange={(e) => handleChange('goal', e.target.value as ContentGoal)}>
              <option value="reach">Охват</option>
              <option value="engagement">Вовлечение</option>
              <option value="trust">Доверие</option>
              <option value="lead">Заявка</option>
              <option value="sale">Продажа</option>
            </select>
          </div>

          <div className="form-group">
            <label>Статус</label>
            <select value={formData.status} onChange={(e) => handleChange('status', e.target.value as PostStatus)}>
              <option value="idea">Идея</option>
              <option value="prompt-ready">Промпт готов</option>
              <option value="text-ready">Текст готов</option>
              <option value="visual-ready">Визуал готов</option>
              <option value="scheduled">Запланировано</option>
              <option value="published">Опубликовано</option>
            </select>
          </div>

          <div className="form-group">
            <label>Тема</label>
            <input type="text" value={formData.topic} onChange={(e) => handleChange('topic', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Идея</label>
            <textarea
              rows={3}
              value={formData.idea}
              onChange={(e) => handleChange('idea', e.target.value)}
              placeholder="Опишите основную идею поста"
            />
          </div>

          <div className="form-group">
            <label>Call-to-Action (CTA)</label>
            <input
              type="text"
              value={formData.cta}
              onChange={(e) => handleChange('cta', e.target.value)}
              placeholder="Что должен сделать зритель?"
            />
          </div>

          <div className="form-group">
            <label>Заметки</label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Любые заметки по посту"
            />
          </div>
        </section>

        <section className="card">
          <h2>Промпт для ИИ</h2>
          <button className="btn btn-primary" onClick={handleGeneratePrompt}>
            Сгенерировать промпт
          </button>

          {formData.promptForAI && (
            <>
              <div className="prompt-display">
                <pre>{formData.promptForAI}</pre>
              </div>
              <button className="btn btn-secondary" onClick={handleCopyPrompt}>
                {copied ? (
                  <>
                    <Check size={16} /> Скопировано
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Скопировать промпт
                  </>
                )}
              </button>
            </>
          )}
        </section>

        <section className="card">
          <h2>Контент</h2>

          <div className="form-group">
            <label>Визуальный сценарий</label>
            <textarea
              rows={5}
              value={formData.visualScenario}
              onChange={(e) => handleChange('visualScenario', e.target.value)}
              placeholder="Опишите, что будет на экране кадр за кадром"
            />
          </div>

          <div className="form-group">
            <label>Структура текста</label>
            <textarea
              rows={5}
              value={formData.textStructure}
              onChange={(e) => handleChange('textStructure', e.target.value)}
              placeholder="Структура текста или сценарий озвучки"
            />
          </div>

          <div className="form-group">
            <label>Ответ ИИ / Готовый текст</label>
            <textarea
              rows={8}
              value={formData.aiResponse || ''}
              onChange={(e) => handleChange('aiResponse', e.target.value)}
              placeholder="Вставьте ответ от ChatGPT/Claude или напишите финальный текст"
            />
          </div>

          <div className="form-group">
            <label>Хэштеги (через запятую)</label>
            <input
              type="text"
              value={formData.hashtags?.join(', ')}
              onChange={(e) => handleChange('hashtags', e.target.value.split(',').map((h) => h.trim()))}
              placeholder="#хэштег1, #хэштег2, #хэштег3, #хэштег4, #хэштег5"
            />
          </div>
        </section>

        <section className="card">
          <h2>Аналитика</h2>
          <button className="btn btn-secondary" onClick={() => setShowAnalytics(!showAnalytics)}>
            {showAnalytics ? 'Скрыть' : 'Добавить результаты'}
          </button>

          {showAnalytics && (
            <div className="analytics-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Просмотры</label>
                  <input
                    type="number"
                    value={formData.analytics?.views || 0}
                    onChange={(e) => handleAnalyticsChange('views', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Лайки</label>
                  <input
                    type="number"
                    value={formData.analytics?.likes || 0}
                    onChange={(e) => handleAnalyticsChange('likes', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Комментарии</label>
                  <input
                    type="number"
                    value={formData.analytics?.comments || 0}
                    onChange={(e) => handleAnalyticsChange('comments', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Сохранения</label>
                  <input
                    type="number"
                    value={formData.analytics?.saves || 0}
                    onChange={(e) => handleAnalyticsChange('saves', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Репосты</label>
                  <input
                    type="number"
                    value={formData.analytics?.shares || 0}
                    onChange={(e) => handleAnalyticsChange('shares', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Подписки</label>
                  <input
                    type="number"
                    value={formData.analytics?.subscribes || 0}
                    onChange={(e) => handleAnalyticsChange('subscribes', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Заявки</label>
                  <input
                    type="number"
                    value={formData.analytics?.leads || 0}
                    onChange={(e) => handleAnalyticsChange('leads', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Переходы в профиль</label>
                  <input
                    type="number"
                    value={formData.analytics?.profileVisits || 0}
                    onChange={(e) => handleAnalyticsChange('profileVisits', Number(e.target.value))}
                  />
                </div>
              </div>

              {formData.analytics && (
                <div className="calculated-metrics">
                  <h3>Рассчитанные метрики</h3>
                  <p>Engagement Rate: {formData.analytics.engagementRate}%</p>
                  <p>Save Rate: {formData.analytics.saveRate}%</p>
                  <p>Share Rate: {formData.analytics.shareRate}%</p>
                  <p>Comment Rate: {formData.analytics.commentRate}%</p>
                  <p>Subscribe Conversion: {formData.analytics.subscribeConversionRate}%</p>
                  <p>Lead Conversion: {formData.analytics.leadConversionRate}%</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PostEditor;
