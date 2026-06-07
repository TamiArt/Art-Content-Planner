import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router';
import { getAnalyticsSummary } from '../utils/analytics';
import { Calendar, FilePlus, Lightbulb, Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { data } = useAppContext();
  const { posts } = data;

  const upcomingPosts = posts
    .filter((p) => new Date(p.date) >= new Date() && p.status !== 'published')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const analytics = getAnalyticsSummary(posts);

  const statusCounts = {
    idea: posts.filter((p) => p.status === 'idea').length,
    'prompt-ready': posts.filter((p) => p.status === 'prompt-ready').length,
    'text-ready': posts.filter((p) => p.status === 'text-ready').length,
    'visual-ready': posts.filter((p) => p.status === 'visual-ready').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Art Content Planner</h1>
        <p>Личный контент-оператор для художника</p>
      </header>

      <section className="dashboard-quick-actions" aria-label="Быстрые действия">
        <Link to="/ideas" className="quick-action-card quick-action-idea">
          <Lightbulb size={28} />
          <span>Добавить идею</span>
        </Link>
        <Link to="/posts/new" className="quick-action-card quick-action-post">
          <Plus size={30} />
          <span>Создать пост</span>
        </Link>
        <Link to="/generate" className="quick-action-card quick-action-generate">
          <FilePlus size={28} />
          <span>Сгенерировать месяц</span>
        </Link>
        <Link to="/calendar" className="quick-action-card quick-action-calendar">
          <Calendar size={28} />
          <span>Календарь</span>
        </Link>
      </section>

      <div className="content-grid">
        <section className="card upcoming-section">
          <h2>Ближайшие публикации</h2>
          {upcomingPosts.length === 0 ? (
            <p className="empty-state">Нет запланированных постов</p>
          ) : (
            <div className="post-list">
              {upcomingPosts.map((post) => (
                <Link to={`/posts/${post.id}`} key={post.id} className="post-item">
                  <div className="post-date">
                    <strong>{new Date(post.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</strong>
                    <span>{post.time}</span>
                  </div>
                  <div className="post-details">
                    <h4>{post.topic}</h4>
                    <div className="post-meta">
                      <span className={`badge badge-${post.platform.toLowerCase()}`}>{post.platform}</span>
                      <span className={`badge badge-${post.status}`}>{post.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/calendar" className="btn btn-secondary">
            Открыть календарь
          </Link>
        </section>

        <section className="card status-section">
          <h2>Статусы постов</h2>
          <div className="status-bars">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="status-bar">
                <div className="status-label">
                  <span>{status}</span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill status-${status}`}
                    style={{ width: `${posts.length > 0 ? (count / posts.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card analytics-preview">
          <h2>Аналитика</h2>
          {analytics.publishedPosts === 0 ? (
            <p className="empty-state">Нет опубликованных постов для аналитики</p>
          ) : (
            <div className="analytics-summary">
              <div className="metric">
                <span>Средний Engagement Rate</span>
                <strong>{analytics.avgEngagementRate.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Средний Save Rate</span>
                <strong>{analytics.avgSaveRate.toFixed(2)}%</strong>
              </div>
              <div className="metric">
                <span>Просмотры</span>
                <strong>{analytics.totalViews.toLocaleString()}</strong>
              </div>
              <div className="metric">
                <span>Заявки</span>
                <strong>{analytics.totalLeads}</strong>
              </div>
            </div>
          )}
          <Link to="/analytics" className="btn btn-secondary">
            Подробная аналитика
          </Link>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;
