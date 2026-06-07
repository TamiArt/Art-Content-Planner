import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { Post } from '../types';
import { CheckCircle, XCircle, Calendar, Edit } from 'lucide-react';

const ContentPlanReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPosts, addMonthlyPlan } = useAppContext();

  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [monthlyPlanData, setMonthlyPlanData] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    // Get generated posts from navigation state
    const state = location.state as { posts?: Post[]; monthlyPlan?: any };

    if (state?.posts && state.posts.length > 0) {
      console.log('Content Plan Review - received posts:', state.posts.length);
      setGeneratedPosts(state.posts);
      setMonthlyPlanData(state.monthlyPlan);
    } else {
      console.log('No posts found in navigation state, redirecting to generator');
      navigate('/generate');
    }
  }, [location.state, navigate]);

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

  const handleApprove = () => {
    if (generatedPosts.length === 0) {
      alert('Нет постов для одобрения');
      return;
    }

    setIsApproving(true);

    console.log('Approving posts:', generatedPosts.length);

    // Add all posts to the app context
    addPosts(generatedPosts);

    // Add monthly plan if provided
    if (monthlyPlanData) {
      addMonthlyPlan(monthlyPlanData);
    }

    console.log('Posts approved and saved');

    // Small delay to ensure state is saved
    setTimeout(() => {
      setIsApproving(false);
      alert(`✅ ${generatedPosts.length} постов добавлено в календарь!`);
      navigate('/calendar');
    }, 500);
  };

  const handleReject = () => {
    if (confirm('Отклонить этот контент-план? Все сгенерированные посты будут потеряны.')) {
      navigate('/generate');
    }
  };

  const handleEditPost = (postId: string) => {
    // Navigate to post editor with the generated post data
    const post = generatedPosts.find(p => p.id === postId);
    if (post) {
      // For now, just show an alert - можно будет доработать редактор
      alert('Редактирование пока недоступно на этапе просмотра. Одобрите план и отредактируйте пост в календаре.');
    }
  };

  if (generatedPosts.length === 0) {
    return (
      <div className="content-plan-review">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Загрузка контент-плана...</h2>
          <p>Если эта страница не обновляется, вернитесь к генератору.</p>
        </div>
      </div>
    );
  }

  const monthName = generatedPosts[0]?.date
    ? new Date(generatedPosts[0].date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="content-plan-review">
      <header className="page-header">
        <div>
          <h1>Просмотр контент-плана</h1>
          <p>{monthName} — {generatedPosts.length} публикаций</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-danger"
            onClick={handleReject}
            disabled={isApproving}
          >
            <XCircle size={16} />
            Отклонить
          </button>
          <button
            className="btn btn-primary btn-large"
            onClick={handleApprove}
            disabled={isApproving}
          >
            <CheckCircle size={16} />
            {isApproving ? 'Сохранение...' : 'Одобрить и добавить в календарь'}
          </button>
        </div>
      </header>

      <div className="review-summary card">
        <h3>Сводка плана</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Всего постов:</strong> {generatedPosts.length}
          </div>
          <div className="summary-item">
            <strong>Платформы:</strong>{' '}
            {Array.from(new Set(generatedPosts.map(p => p.platform))).join(', ')}
          </div>
          <div className="summary-item">
            <strong>Форматы:</strong>{' '}
            {Array.from(new Set(generatedPosts.map(p => p.format))).length} различных
          </div>
          <div className="summary-item">
            <strong>Период:</strong>{' '}
            {new Date(generatedPosts[0].date).toLocaleDateString('ru-RU')} -{' '}
            {new Date(generatedPosts[generatedPosts.length - 1].date).toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Список публикаций</h3>
        <div className="review-table-wrapper">
          <table className="review-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Дата</th>
                <th>Время</th>
                <th>Платформа</th>
                <th>Формат</th>
                <th>Цель</th>
                <th>Тема</th>
                <th>Хэштеги</th>
                <th>Промпт</th>
              </tr>
            </thead>
            <tbody>
              {generatedPosts.map((post, index) => (
                <tr key={post.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(post.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</td>
                  <td>{post.time}</td>
                  <td>
                    <span className={`badge badge-${post.platform.toLowerCase()}`}>
                      {post.platform}
                    </span>
                  </td>
                  <td className="format-cell">{post.format}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ background: goalColors[post.goal], color: 'white' }}
                    >
                      {goalLabels[post.goal]}
                    </span>
                  </td>
                  <td className="topic-cell">{post.topic}</td>
                  <td className="hashtags-cell">
                    {post.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="hashtag-mini">{tag}</span>
                    ))}
                    {post.hashtags.length > 3 && (
                      <span className="hashtag-more">+{post.hashtags.length - 3}</span>
                    )}
                  </td>
                  <td>
                    {post.promptForAI ? (
                      <span className="status-indicator status-ready">✓ Готов</span>
                    ) : (
                      <span className="status-indicator status-pending">Нет</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="review-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/generate')}>
          ← Вернуться к генератору
        </button>
        <button
          className="btn btn-primary btn-large"
          onClick={handleApprove}
          disabled={isApproving}
        >
          <Calendar size={20} />
          {isApproving ? 'Добавление в календарь...' : `Добавить ${generatedPosts.length} постов в календарь`}
        </button>
      </div>
    </div>
  );
};

export default ContentPlanReview;
