import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Tag } from 'lucide-react';

const Offers: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="offers-page">
      <header className="page-header">
        <h1>
          <Tag /> Офферы
        </h1>
        <p>Готовые офферы для продающего контента</p>
      </header>

      {data.offers.length === 0 ? (
        <div className="empty-state card">
          <Tag size={48} />
          <p>Пока нет офферов. Добавьте первый через настройки!</p>
        </div>
      ) : (
        <div className="offers-list">
          {data.offers.map((offer) => (
            <div key={offer.id} className="offer-card card">
              <h3>{offer.title}</h3>
              <div className="offer-details">
                <p>
                  <strong>Для кого:</strong> {offer.targetAudience}
                </p>
                <p>
                  <strong>Боль клиента:</strong> {offer.clientPain}
                </p>
                <p>
                  <strong>Решение:</strong> {offer.solution}
                </p>
                <p>
                  <strong>Сроки:</strong> {offer.timeline}
                </p>
                <p>
                  <strong>Цена:</strong> {offer.price}
                </p>
                <p className="offer-cta">
                  <strong>CTA:</strong> {offer.ctaPhrase}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
