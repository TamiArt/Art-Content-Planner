import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { buildPromptForPost, copyToClipboard } from '../utils/promptBuilder';
import { generateSEOKeysForPost } from '../utils/seoKeywords';
import type { Post } from '../types';
import { Copy, Check, Edit, Trash2, RefreshCw, Calendar as CalendarIcon, X } from 'lucide-react';

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, onClose }) => {
  const navigate = useNavigate();
  const { data, updatePost, deletePost } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState(post.date);
  const [newTime, setNewTime] = useState(post.time);

  const handleCopyPrompt = async () => {
    let prompt = post.promptForAI;

    if (!prompt) {
      // Generate prompt if not exists
      prompt = buildPromptForPost(post, data.settings);
      updatePost(post.id, { promptForAI: prompt, status: 'prompt-ready' });
    }

    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    // Regenerate SEO keys
    const seoData = generateSEOKeysForPost(post.topic, data.seoCluster);

    // Regenerate prompt
    const newPrompt = buildPromptForPost(post, data.settings);

    updatePost(post.id, {
      seoKeys: seoData.seoKeys,
      lsiKeys: seoData.lsiKeys,
      hashtags: seoData.hashtags,
      promptForAI: newPrompt,
      status: 'prompt-ready',
    });

    alert('Пост перегенерирован');
  };

  const handleDateChange = () => {
    updatePost(post.id, {
      date: newDate,
      time: newTime,
    });
    setShowDatePicker(false);
    alert('Дата и время обновлены');
    onClose(); // Close modal after date change
  };

  const handleDelete = () => {
    if (confirm('Удалить этот пост?')) {
      deletePost(post.id);
      onClose();
    }
  };

  const handleEdit = () => {
    navigate(`/posts/${post.id}`);
    onClose();
  };

  const goalColors: Record<string, string> = {
    reach: '#3b82f6',
    engagement: '#8b5cf6',
    trust: '#10b981',
    lead: '#f59e0b',
    sale: '#ef4444',
  };

  const goalLabels: Record<string, string> = {
    reach: 'Охват',
    engagement: 'Вовлечение',
    trust: 'Доверие',
    lead: 'Заявка',
    sale: 'Продажа',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{post.topic}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="post-info-grid">
            <div className="info-item">
              <label>Дата и время</label>
              <div className="info-value">
                {new Date(post.date).toLocaleDateString('ru-RU')} в {post.time}
              </div>
            </div>

            <div className="info-item">
              <label>Платформа</label>
              <div className="info-value">
                <span className={`badge badge-${post.platform.toLowerCase()}`}>{post.platform}</span>
              </div>
            </div>

            <div className="info-item">
              <label>Формат</label>
              <div className="info-value">{post.format}</div>
            </div>

            <div className="info-item">
              <label>Цель</label>
              <div className="info-value">
                <span className="badge" style={{ background: goalColors[post.goal], color: 'white' }}>
                  {goalLabels[post.goal]}
                </span>
              </div>
            </div>

            <div className="info-item">
              <label>Статус</label>
              <div className="info-value">
                <span className={`badge badge-${post.status}`}>{post.status}</span>
              </div>
            </div>

            <div className="info-item">
              <label>Главная метрика</label>
              <div className="info-value">{post.mainMetric}</div>
            </div>
          </div>

          <div className="info-section">
            <label>Идея</label>
            <p>{post.idea}</p>
          </div>

          {post.cta && (
            <div className="info-section">
              <label>CTA</label>
              <p>{post.cta}</p>
            </div>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="info-section">
              <label>Хэштеги</label>
              <div className="hashtags-list">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="hashtag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showDatePicker && (
            <div className="date-picker-section">
              <h3>Изменить дату и время</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Дата</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Время</label>
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleDateChange}>
                  Сохранить
                </button>
                <button className="btn btn-secondary" onClick={() => setShowDatePicker(false)}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleCopyPrompt}>
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

          <button className="btn btn-secondary" onClick={handleEdit}>
            <Edit size={16} /> Редактировать
          </button>

          <button className="btn btn-secondary" onClick={handleRegenerate}>
            <RefreshCw size={16} /> Перегенерировать
          </button>

          <button className="btn btn-secondary" onClick={() => setShowDatePicker(!showDatePicker)}>
            <CalendarIcon size={16} /> Изменить дату/время
          </button>

          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} /> Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
