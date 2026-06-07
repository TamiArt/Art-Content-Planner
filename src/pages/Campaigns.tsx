import React from 'react';
import { Link } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { CalendarDays, Flame, Layers, Megaphone } from 'lucide-react';

const Campaigns: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="campaigns-page">
      <header className="page-header">
        <div>
          <h1><Megaphone /> Контент-кампании</h1>
          <p>Кампании объединяют посты, Stories-воронки и источник: картину, услугу или оффер.</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card"><Megaphone size={28} /><div><h3>{data.campaigns.length}</h3><p>Кампаний</p></div></div>
        <div className="stat-card"><Layers size={28} /><div><h3>{data.storySequences.length}</h3><p>Story-цепочек</p></div></div>
        <div className="stat-card"><CalendarDays size={28} /><div><h3>{data.campaigns.filter((c) => c.status === 'active').length}</h3><p>Активных</p></div></div>
      </div>

      <section className="card">
        <h2>Как создать кампанию</h2>
        <p className="info-box">
          Для картины нажмите «Создать посты из этой картины» в разделе «Мои картины». Для услуги нажмите «Создать прогрев услуги» в разделе «Услуги».
          Приложение создаст связку постов и отдельную Instagram Stories-воронку.
        </p>
        <div className="form-actions">
          <Link className="btn btn-primary" to="/paintings">Перейти к картинам</Link>
          <Link className="btn btn-secondary" to="/services">Перейти к услугам</Link>
        </div>
      </section>

      <div className="content-grid">
        <section className="card">
          <h2><Flame size={20} /> Кампании</h2>
          {data.campaigns.length === 0 ? (
            <p className="empty-state">Пока нет кампаний. Создайте кампанию из картины или услуги.</p>
          ) : (
            <div className="workflow-list">
              {data.campaigns.map((campaign) => (
                <div key={campaign.id} className="workflow-card">
                  <div className="catalog-card-header">
                    <h3>{campaign.title}</h3>
                    <span className="badge">{campaign.status}</span>
                  </div>
                  <p><strong>Источник:</strong> {campaign.sourceTitle || '—'}</p>
                  <p><strong>Период:</strong> {campaign.startDate} — {campaign.endDate}</p>
                  <p><strong>Цель:</strong> {campaign.targetMetric}</p>
                  <p><strong>Постов:</strong> {campaign.postIds.length} · <strong>Stories:</strong> {campaign.storySequenceIds.length}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2><Layers size={20} /> Instagram / TikTok Stories как воронка</h2>
          {data.storySequences.length === 0 ? (
            <p className="empty-state">Story-воронки появятся после создания прогрева картины или услуги.</p>
          ) : (
            <div className="workflow-list">
              {data.storySequences.map((sequence) => (
                <div key={sequence.id} className="workflow-card">
                  <div className="catalog-card-header">
                    <h3>{sequence.title}</h3>
                    <span className="badge">{sequence.platform}</span>
                  </div>
                  <p><strong>Дата:</strong> {sequence.date}</p>
                  <p><strong>Источник:</strong> {sequence.sourceTitle || '—'}</p>
                  <ol className="story-slide-list">
                    {sequence.slides.map((slide) => (
                      <li key={slide.id}>
                        <strong>{slide.frame}</strong><br />
                        <span>{slide.text}</span>
                        {slide.sticker && slide.sticker !== 'none' && <em> · sticker: {slide.sticker}</em>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Campaigns;
