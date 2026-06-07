import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Image } from 'lucide-react';

const Paintings: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="paintings-page">
      <header className="page-header">
        <h1>
          <Image /> Мои картины
        </h1>
        <p>Картины для продажи и упоминания в контенте</p>
      </header>

      {data.paintings.length === 0 ? (
        <div className="empty-state card">
          <Image size={48} />
          <p>Пока нет картин. Добавьте первую через настройки!</p>
        </div>
      ) : (
        <div className="paintings-grid">
          {data.paintings.map((painting) => (
            <div key={painting.id} className="painting-card card">
              <h3>{painting.title}</h3>
              <div className="painting-details">
                <p>
                  <strong>Размер:</strong> {painting.size}
                </p>
                <p>
                  <strong>Техника:</strong> {painting.technique}
                </p>
                {painting.price && (
                  <p>
                    <strong>Цена:</strong> {painting.price} ₽
                  </p>
                )}
                <p>
                  <strong>Статус:</strong>{' '}
                  <span className={`badge badge-${painting.status}`}>
                    {painting.status === 'available'
                      ? 'В наличии'
                      : painting.status === 'sold'
                        ? 'Продана'
                        : 'На заказ'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Paintings;
