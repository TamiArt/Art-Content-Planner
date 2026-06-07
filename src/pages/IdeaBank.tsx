import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { ContentGoal, Format, FunnelStage, Idea, Platform, Post } from '../types';
import { formatDateLocal } from '../utils/date';
import { goalLabels } from '../utils/contentLabels';
import { CalendarPlus, Edit3, FilePlus, Lightbulb, Plus, Trash2, X } from 'lucide-react';

type IdeaFormState = {
  title: string;
  description: string;
  tags: string;
  platform: Platform;
  format: Format;
  goal: ContentGoal;
  plannedDate: string;
  plannedTime: string;
};

type PostIntent = 'draft' | 'scheduled';

const createEmptyIdeaForm = (): IdeaFormState => ({
  title: '',
  description: '',
  tags: '',
  platform: 'Instagram',
  format: 'Instagram Post',
  goal: 'reach',
  plannedDate: formatDateLocal(new Date()),
  plannedTime: '09:00',
});

const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const parseTags = (tags: string) =>
  tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatTags = (tags: string[]) => tags.join(', ');

const getFunnelStageForGoal = (goal: ContentGoal): FunnelStage => {
  const funnelByGoal: Record<ContentGoal, FunnelStage> = {
    reach: 'attraction',
    engagement: 'retention',
    trust: 'trust',
    lead: 'conversion',
    sale: 'conversion',
  };

  return funnelByGoal[goal];
};

const getMainMetricForGoal = (goal: ContentGoal) => {
  const metricByGoal: Record<ContentGoal, string> = {
    reach: 'views',
    engagement: 'engagementRate',
    trust: 'saves',
    lead: 'leadConversionRate',
    sale: 'sales',
  };

  return metricByGoal[goal];
};

const createPostFromIdea = (idea: Idea, intent: PostIntent): Post => {
  const goal = idea.goal || 'reach';
  const tags = idea.tags.slice(0, 5);
  const hashtags = tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`));

  return {
    id: createId(),
    date: idea.plannedDate || formatDateLocal(new Date()),
    time: idea.plannedTime || '09:00',
    platform: idea.platform || 'Instagram',
    format: idea.format || 'Instagram Post',
    goal,
    funnelStage: getFunnelStageForGoal(goal),
    mainMetric: getMainMetricForGoal(goal),
    topic: idea.title,
    idea: idea.description || idea.title,
    hookVariants: [],
    visualScenario: '',
    textStructure: '',
    cta: '',
    seoKeys: tags,
    lsiKeys: [],
    hashtags,
    status: intent === 'scheduled' ? 'scheduled' : 'idea',
    notes: `Создано из идеи: ${idea.title}`,
  };
};

const IdeaBank: React.FC = () => {
  const navigate = useNavigate();
  const { data, addIdea, updateIdea, deleteIdea, addPost } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [form, setForm] = useState<IdeaFormState>(createEmptyIdeaForm);

  const isEditing = editingIdeaId !== null;

  const resetForm = () => {
    setForm(createEmptyIdeaForm());
    setEditingIdeaId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const ideaData = {
      title: form.title.trim(),
      description: form.description.trim(),
      tags: parseTags(form.tags),
      platform: form.platform,
      format: form.format,
      goal: form.goal,
      plannedDate: form.plannedDate,
      plannedTime: form.plannedTime,
    };

    if (editingIdeaId) {
      updateIdea(editingIdeaId, ideaData);
    } else {
      addIdea({
        id: createId(),
        createdAt: new Date().toISOString(),
        ...ideaData,
      });
    }

    resetForm();
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdeaId(idea.id);
    setForm({
      title: idea.title,
      description: idea.description,
      tags: formatTags(idea.tags),
      platform: idea.platform || 'Instagram',
      format: idea.format || 'Instagram Post',
      goal: idea.goal || 'reach',
      plannedDate: idea.plannedDate || formatDateLocal(new Date()),
      plannedTime: idea.plannedTime || '09:00',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту идею?')) {
      deleteIdea(id);
      if (editingIdeaId === id) resetForm();
    }
  };

  const handleCreatePost = (idea: Idea, intent: PostIntent) => {
    const post = createPostFromIdea(idea, intent);
    addPost(post);
    updateIdea(idea.id, { convertedToPostId: post.id });

    if (intent === 'scheduled') {
      alert('Идея отправлена в календарь');
      navigate('/calendar');
      return;
    }

    navigate(`/posts/${post.id}`);
  };

  return (
    <div className="idea-bank">
      <header className="page-header">
        <h1>
          <Lightbulb /> Банк идей
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Закрыть форму' : 'Добавить идею'}
        </button>
      </header>

      {showForm && (
        <form className="card idea-form" onSubmit={handleSubmit}>
          <h2>{isEditing ? 'Редактировать идею' : 'Новая идея'}</h2>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Короткое название идеи"
                required
              />
            </div>

            <div className="form-group">
              <label>Теги (через запятую)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="TikTok, Reels, процесс, ошибка"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Подробное описание идеи: ракурс, смысл, что показать, что сказать зрителю"
            />
          </div>

          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label>Платформа</label>
              <select value={form.platform} onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value as Platform }))}>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            <div className="form-group">
              <label>Формат</label>
              <select value={form.format} onChange={(e) => setForm((prev) => ({ ...prev, format: e.target.value as Format }))}>
                <option value="Instagram Post">Instagram Post</option>
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Instagram Carousel">Instagram Carousel</option>
                <option value="Instagram Stories">Instagram Stories</option>
                <option value="TikTok Video">TikTok Video</option>
                <option value="TikTok Slideshow">TikTok Slideshow</option>
              </select>
            </div>

            <div className="form-group">
              <label>Цель</label>
              <select value={form.goal} onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value as ContentGoal }))}>
                {Object.entries(goalLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-date-time-inline">
              <label>Дата и время</label>
              <div>
                <input type="date" value={form.plannedDate} onChange={(e) => setForm((prev) => ({ ...prev, plannedDate: e.target.value }))} />
                <input type="time" value={form.plannedTime} onChange={(e) => setForm((prev) => ({ ...prev, plannedTime: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Сохранить изменения' : 'Сохранить идею'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="ideas-grid">
        {data.ideas.length === 0 ? (
          <div className="empty-state card">
            <Lightbulb size={48} />
            <p>Пока нет идей. Добавьте первую!</p>
          </div>
        ) : (
          data.ideas.map((idea) => (
            <div key={idea.id} className="idea-card card">
              <div className="idea-header">
                <div>
                  <h3>{idea.title}</h3>
                  <small>{new Date(idea.createdAt).toLocaleDateString('ru-RU')}</small>
                </div>
                <div className="idea-card-actions">
                  <button className="btn-icon" title="Редактировать идею" onClick={() => handleEdit(idea)}>
                    <Edit3 size={16} />
                  </button>
                  <button className="btn-icon btn-danger" title="Удалить идею" onClick={() => handleDelete(idea.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {idea.description && <p className="idea-description">{idea.description}</p>}

              <div className="idea-meta">
                <span>{idea.platform || 'Instagram'}</span>
                <span>{idea.format || 'Instagram Post'}</span>
                <span>{goalLabels[idea.goal || 'reach']}</span>
                <span>{idea.plannedDate || 'Без даты'} · {idea.plannedTime || '09:00'}</span>
              </div>

              {idea.tags.length > 0 && (
                <div className="idea-tags">
                  {idea.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="idea-convert-actions">
                <button className="btn btn-secondary" onClick={() => handleCreatePost(idea, 'draft')}>
                  <FilePlus size={16} />
                  Сделать постом
                </button>
                <button className="btn btn-primary" onClick={() => handleCreatePost(idea, 'scheduled')}>
                  <CalendarPlus size={16} />
                  В календарь
                </button>
              </div>

              <div className="idea-footer">
                <small>ID: {idea.id}</small>
                {idea.convertedToPostId && <span className="converted-badge">Связано с постом</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IdeaBank;
