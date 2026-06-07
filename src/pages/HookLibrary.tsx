import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Format, HookLibraryItem, HookType, Platform } from '../types';
import { Plus, Target, Trash2 } from 'lucide-react';

const createId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const HookLibrary: React.FC = () => {
  const { data, updateData } = useAppContext();
  const [text, setText] = useState('');
  const [hookType, setHookType] = useState<HookType>('question');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [format, setFormat] = useState<Format>('Instagram Reels');

  const addHook = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    const hook: HookLibraryItem = {
      id: createId(),
      text: text.trim(),
      hookType,
      platform,
      format,
      usageCount: 0,
      status: 'testing',
      createdAt: new Date().toISOString(),
    };
    updateData({ hookLibrary: [hook, ...data.hookLibrary] });
    setText('');
  };

  const deleteHook = (id: string) => updateData({ hookLibrary: data.hookLibrary.filter((hook) => hook.id !== id) });

  return (
    <div className="hook-library-page">
      <header className="page-header">
        <div>
          <h1><Target /> Библиотека хуков</h1>
          <p>Собирайте первые фразы и первые кадры, которые реально останавливают скролл.</p>
        </div>
      </header>

      <form className="card catalog-form" onSubmit={addHook}>
        <h2>Новый хук</h2>
        <div className="form-group">
          <label>Текст хука / надпись на первом кадре</label>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Почему эта картина делает интерьер дороже?" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Тип</label>
            <select value={hookType} onChange={(event) => setHookType(event.target.value as HookType)}>
              <option value="question">Вопрос</option>
              <option value="mistake">Ошибка</option>
              <option value="before-after">До/после</option>
              <option value="process">Процесс</option>
              <option value="personal-story">История</option>
              <option value="controversy">Спорное мнение</option>
              <option value="shocking-fact">Факт</option>
              <option value="how-to">How-to</option>
            </select>
          </div>
          <div className="form-group">
            <label>Платформа</label>
            <select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
            </select>
          </div>
          <div className="form-group">
            <label>Формат</label>
            <select value={format} onChange={(event) => setFormat(event.target.value as Format)}>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="Instagram Carousel">Instagram Carousel</option>
              <option value="Instagram Stories">Instagram Stories</option>
              <option value="TikTok Video">TikTok Video</option>
              <option value="TikTok Slideshow">TikTok Slideshow</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit"><Plus size={16} /> Добавить хук</button>
      </form>

      <div className="ideas-grid">
        {data.hookLibrary.length === 0 ? (
          <div className="empty-state card">Пока нет хуков. Добавьте первые рабочие формулировки.</div>
        ) : data.hookLibrary.map((hook) => (
          <div key={hook.id} className="card hook-card">
            <div className="catalog-card-header">
              <h3>{hook.text}</h3>
              <button className="btn-icon btn-danger" onClick={() => deleteHook(hook.id)} aria-label="Удалить хук"><Trash2 size={16} /></button>
            </div>
            <div className="idea-meta">
              <span>{hook.platform}</span><span>{hook.format}</span><span>{hook.hookType}</span><span>{hook.status}</span>
            </div>
            <p><strong>Использований:</strong> {hook.usageCount}</p>
            <p><strong>Engagement:</strong> {hook.avgEngagementRate ?? '—'}% · <strong>Retention:</strong> {hook.avgRetentionRate ?? '—'}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HookLibrary;
