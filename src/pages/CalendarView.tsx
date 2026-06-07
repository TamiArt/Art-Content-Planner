import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router';
import PostModal from '../components/PostModal';
import type { Post, PostStatus } from '../types';

const CalendarView: React.FC = () => {
  const { data } = useAppContext();
  const [view, setView] = useState<'month' | 'week' | 'list' | 'kanban'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { posts } = data;

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const renderMonthView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    // Debug logging
    console.log('Calendar Debug:', {
      totalPosts: posts.length,
      year,
      month,
      samplePostDates: posts.slice(0, 3).map(p => p.date)
    });

    for (let i = 0; i < 42; i++) {
      const dateStr = formatDateLocal(currentDate);
      const dayPosts = posts.filter((p) => p.date === dateStr);

      if (dayPosts.length > 0) {
        console.log(`Found ${dayPosts.length} posts for ${dateStr}`);
      }

      days.push({
        date: new Date(currentDate),
        posts: dayPosts,
        isCurrentMonth: currentDate.getMonth() === month,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="calendar-month">
        <div className="calendar-header">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
            <div key={day} className="calendar-day-name">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.posts.length > 0 ? 'has-posts' : ''}`}
            >
              <div className="day-number">{day.date.getDate()}</div>
              {day.posts.length > 0 && (
                <div className="day-posts-mini">
                  {day.posts.map((post) => (
                    <div
                      key={post.id}
                      className="post-mini-card"
                      style={{ borderLeftColor: goalColors[post.goal] }}
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="post-mini-time">{post.time}</div>
                      <div className="post-mini-platform">{post.platform === 'TikTok' ? 'TT' : 'IG'}</div>
                      <div className="post-mini-topic">{post.topic.substring(0, 20)}...</div>
                      <span
                        className="post-mini-goal"
                        style={{ background: goalColors[post.goal], color: 'white' }}
                      >
                        {goalLabels[post.goal]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = formatDateLocal(date);
      const dayPosts = posts.filter((p) => p.date === dateStr);
      weekDays.push({ date, posts: dayPosts });
    }

    return (
      <div className="calendar-week">
        {weekDays.map((day, index) => (
          <div key={index} className="week-day">
            <div className="week-day-header">
              <div className="week-day-name">{day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
              <div className="week-day-date">{day.date.getDate()}</div>
            </div>
            <div className="week-day-posts">
              {day.posts.length === 0 ? (
                <p className="no-posts">Нет постов</p>
              ) : (
                day.posts.map((post) => (
                  <div
                    key={post.id}
                    className="week-post-card"
                    style={{ borderLeftColor: goalColors[post.goal] }}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="week-post-time">{post.time}</div>
                    <div className="week-post-header">
                      <span className={`badge badge-${post.platform.toLowerCase()}`}>{post.platform}</span>
                      <span className="badge" style={{ background: goalColors[post.goal], color: 'white' }}>
                        {goalLabels[post.goal]}
                      </span>
                    </div>
                    <h4>{post.topic}</h4>
                    <p className="week-post-format">{post.format}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    const sortedPosts = [...posts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="calendar-list">
        {sortedPosts.length === 0 ? (
          <div className="empty-state">
            <p>Нет постов. Создайте контент-план!</p>
          </div>
        ) : (
          <table className="posts-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Платформа</th>
                <th>Цель</th>
                <th>Тема</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((post) => (
                <tr key={post.id} onClick={() => setSelectedPost(post)} className="table-row-clickable">
                  <td>{new Date(post.date).toLocaleDateString('ru-RU')}</td>
                  <td>{post.time}</td>
                  <td>
                    <span className={`badge badge-${post.platform.toLowerCase()}`}>{post.platform}</span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: goalColors[post.goal], color: 'white' }}>
                      {goalLabels[post.goal]}
                    </span>
                  </td>
                  <td>{post.topic}</td>
                  <td>
                    <span className={`badge badge-${post.status}`}>{post.status}</span>
                  </td>
                  <td>
                    <Link to={`/posts/${post.id}`} className="btn btn-small btn-secondary" onClick={(e) => e.stopPropagation()}>
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderKanbanView = () => {
    const statuses: PostStatus[] = ['idea', 'prompt-ready', 'text-ready', 'visual-ready', 'scheduled', 'published'];
    const statusLabels: Record<PostStatus, string> = {
      idea: 'Идея',
      'prompt-ready': 'Промпт готов',
      'text-ready': 'Текст готов',
      'visual-ready': 'Визуал готов',
      scheduled: 'Запланировано',
      published: 'Опубликовано',
    };

    return (
      <div className="kanban-board">
        {statuses.map((status) => (
          <div key={status} className="kanban-column">
            <h3 className={`column-header status-${status}`}>
              {statusLabels[status]} <span className="count">{posts.filter((p) => p.status === status).length}</span>
            </h3>
            <div className="kanban-cards">
              {posts
                .filter((p) => p.status === status)
                .map((post) => (
                  <Link key={post.id} to={`/posts/${post.id}`} className="kanban-card">
                    <div className="card-header">
                      <span className={`badge badge-${post.platform.toLowerCase()}`}>{post.platform}</span>
                      <span className="post-date">{new Date(post.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <h4>{post.topic}</h4>
                    <p className="card-format">{post.format}</p>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="calendar-view">
      <header className="page-header">
        <h1>Календарь публикаций</h1>
        <div className="view-controls">
          <button className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('month')}>
            Месяц
          </button>
          <button className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('week')}>
            Неделя
          </button>
          <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('list')}>
            Список
          </button>
          <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('kanban')}>
            Канбан
          </button>
        </div>
      </header>

      {view === 'month' && (
        <div className="month-controls">
          <button className="btn btn-secondary" onClick={() => changeMonth(-1)}>
            ← Предыдущий
          </button>
          <h2>{currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn btn-secondary" onClick={() => changeMonth(1)}>
            Следующий →
          </button>
        </div>
      )}

      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'list' && renderListView()}
      {view === 'kanban' && renderKanbanView()}

      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  );
};

export default CalendarView;
