import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Briefcase } from 'lucide-react';

const Services: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="services-page">
      <header className="page-header">
        <h1>
          <Briefcase /> Мои услуги
        </h1>
        <p>Услуги для продвижения в контенте</p>
      </header>

      {data.services.length === 0 ? (
        <div className="empty-state card">
          <Briefcase size={48} />
          <p>Пока нет услуг. Добавьте первую через настройки!</p>
        </div>
      ) : (
        <div className="services-list">
          {data.services.map((service) => (
            <div key={service.id} className="service-card card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="service-details">
                <p>
                  <strong>Для кого:</strong> {service.targetAudience}
                </p>
                <p>
                  <strong>Сроки:</strong> {service.timeline}
                </p>
                <p>
                  <strong>Цена:</strong> {service.price}
                </p>
                <p>
                  <strong>CTA:</strong> {service.cta}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
