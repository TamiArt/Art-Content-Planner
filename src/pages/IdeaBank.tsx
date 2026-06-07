import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Idea } from '../types';
import { Lightbulb, Plus, Trash2 } from 'lucide-react';

const IdeaBank: React.FC = () => {
  const { data, addIdea, deleteIdea } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newIdea: Idea = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      title: title.trim(),
      description: description.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    addIdea(newIdea);
    setTitle('');
    setDescription('');
    setTags('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту идею?')) {
      deleteIdea(id);
    }
  };

  return (
    <div className="idea-bank">
      <header className="page-header">
        <h1>
          <Lightbulb /> Банк идей
        </h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          Добавить идею
        </button>
      </header>

      {showForm && (
        <form className="card idea-form" onSubmit={handleSubmit}>
          <h2>Новая идея</h2>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Короткое название идеи"
              required
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание идеи"
            />
          </div>

          <div className="form-group">
            <label>Теги (через запятую)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="TikTok, Reels, процесс, ошибка"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
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
                <h3>{idea.title}</h3>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(idea.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {idea.description && <p className="idea-description">{idea.description}</p>}
              {idea.tags.length > 0 && (
                <div className="idea-tags">
                  {idea.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="idea-footer">
                <small>{new Date(idea.createdAt).toLocaleDateString('ru-RU')}</small>
                {idea.convertedToPostId && <span className="converted-badge">Превращено в пост</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IdeaBank;
