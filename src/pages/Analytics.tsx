import React from 'react';
import { useAppContext } from '../context/AppContext';
import { getAnalyticsSummary } from '../utils/analytics';
import { TrendingUp, Eye, Heart, MessageCircle, Bookmark } from 'lucide-react';

const Analytics: React.FC = () => {
  const { data } = useAppContext();
  const summary = getAnalyticsSummary(data.posts);

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>Аналитика публикаций</h1>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <Eye size={32} />
          <div>
            <h3>{summary.totalViews.toLocaleString()}</h3>
            <p>Просмотры</p>
          </div>
        </div>

        <div className="stat-card">
          <Heart size={32} />
          <div>
            <h3>{summary.totalLikes.toLocaleString()}</h3>
            <p>Лайки</p>
          </div>
        </div>

        <div className="stat-card">
          <MessageCircle size={32} />
          <div>
            <h3>{summary.totalComments.toLocaleString()}</h3>
            <p>Комментарии</p>
          </div>
        </div>

        <div className="stat-card">
          <Bookmark size={32} />
          <div>
            <h3>{summary.totalSaves.toLocaleString()}</h3>
            <p>Сохранения</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <section className="card">
          <h2>Средние показатели</h2>
          <div className="metrics-list">
            <div className="metric">
              <span>Engagement Rate</span>
              <strong>{summary.avgEngagementRate.toFixed(2)}%</strong>
            </div>
            <div className="metric">
              <span>Save Rate</span>
              <strong>{summary.avgSaveRate.toFixed(2)}%</strong>
            </div>
            <div className="metric">
              <span>Share Rate</span>
              <strong>{summary.avgShareRate.toFixed(2)}%</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>
            <TrendingUp size={20} /> Лучшие темы
          </h2>
          {summary.bestPerformingTopics.length === 0 ? (
            <p className="empty-state">Недостаточно данных</p>
          ) : (
            <div className="ranking-list">
              {summary.bestPerformingTopics.map((item, index) => (
                <div key={index} className="ranking-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{item.topic}</span>
                  <span className="value">{item.avgEngagement.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>
            <TrendingUp size={20} /> Лучшие форматы
          </h2>
          {summary.bestPerformingFormats.length === 0 ? (
            <p className="empty-state">Недостаточно данных</p>
          ) : (
            <div className="ranking-list">
              {summary.bestPerformingFormats.map((item, index) => (
                <div key={index} className="ranking-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{item.format}</span>
                  <span className="value">{item.avgEngagement.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>
            <TrendingUp size={20} /> Лучшие дни недели
          </h2>
          {summary.bestPerformingDays.length === 0 ? (
            <p className="empty-state">Недостаточно данных</p>
          ) : (
            <div className="ranking-list">
              {summary.bestPerformingDays.map((item, index) => (
                <div key={index} className="ranking-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{item.day}</span>
                  <span className="value">{item.avgEngagement.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>
            <TrendingUp size={20} /> Лучшее время публикации
          </h2>
          {summary.bestPerformingTimes.length === 0 ? (
            <p className="empty-state">Недостаточно данных</p>
          ) : (
            <div className="ranking-list">
              {summary.bestPerformingTimes.map((item, index) => (
                <div key={index} className="ranking-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{item.time}</span>
                  <span className="value">{item.avgEngagement.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Конверсия</h2>
          <div className="metrics-list">
            <div className="metric">
              <span>Подписки</span>
              <strong>{summary.totalSubscribes}</strong>
            </div>
            <div className="metric">
              <span>Заявки</span>
              <strong>{summary.totalLeads}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
