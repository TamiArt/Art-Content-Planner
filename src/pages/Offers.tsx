import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Offer } from '../types';
import { Edit, Plus, Tag, Trash2 } from 'lucide-react';

type OfferForm = Omit<Offer, 'id' | 'clientGets'> & {
  clientGets: string;
};

const emptyOfferForm = (): OfferForm => ({
  title: '',
  clientGets: '',
  targetAudience: '',
  clientPain: '',
  solution: '',
  timeline: '',
  price: '',
  ctaPhrase: '',
});

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const splitCommaList = (value: string): string[] => value.split(',').map((item) => item.trim()).filter(Boolean);

const formFromOffer = (offer: Offer): OfferForm => ({
  title: offer.title,
  clientGets: offer.clientGets.join(', '),
  targetAudience: offer.targetAudience,
  clientPain: offer.clientPain,
  solution: offer.solution,
  timeline: offer.timeline,
  price: offer.price,
  ctaPhrase: offer.ctaPhrase,
});

const offerFromForm = (form: OfferForm, id: string): Offer => ({
  id,
  title: form.title.trim(),
  clientGets: splitCommaList(form.clientGets),
  targetAudience: form.targetAudience.trim(),
  clientPain: form.clientPain.trim(),
  solution: form.solution.trim(),
  timeline: form.timeline.trim(),
  price: form.price.trim(),
  ctaPhrase: form.ctaPhrase.trim(),
});

const Offers: React.FC = () => {
  const { data, addOffer, updateOffer, deleteOffer } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyOfferForm());

  const updateField = <K extends keyof OfferForm>(field: K, value: OfferForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyOfferForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      updateOffer(editingId, offerFromForm(form, editingId));
    } else {
      addOffer(offerFromForm(form, generateId()));
    }

    resetForm();
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm(formFromOffer(offer));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить этот оффер?')) {
      deleteOffer(id);
      if (editingId === id) resetForm();
    }
  };

  return (
    <div className="offers-page">
      <header className="page-header">
        <div>
          <h1>
            <Tag /> Офферы
          </h1>
          <p>Готовые офферы для продающего контента</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Добавить оффер
        </button>
      </header>

      {showForm && (
        <form className="card catalog-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать оффер' : 'Новый оффер'}</h2>
          <div className="form-group">
            <label>Название</label>
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Для кого</label>
              <input value={form.targetAudience} onChange={(event) => updateField('targetAudience', event.target.value)} />
            </div>
            <div className="form-group">
              <label>Сроки</label>
              <input value={form.timeline} onChange={(event) => updateField('timeline', event.target.value)} />
            </div>
            <div className="form-group">
              <label>Цена</label>
              <input value={form.price} onChange={(event) => updateField('price', event.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Что получает клиент (через запятую)</label>
            <textarea rows={3} value={form.clientGets} onChange={(event) => updateField('clientGets', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Боль клиента</label>
            <textarea rows={3} value={form.clientPain} onChange={(event) => updateField('clientPain', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Решение</label>
            <textarea rows={3} value={form.solution} onChange={(event) => updateField('solution', event.target.value)} />
          </div>
          <div className="form-group">
            <label>CTA-фраза</label>
            <input value={form.ctaPhrase} onChange={(event) => updateField('ctaPhrase', event.target.value)} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Сохранить изменения' : 'Добавить оффер'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {data.offers.length === 0 ? (
        <div className="empty-state card">
          <Tag size={48} />
          <p>Пока нет офферов. Добавьте первый через кнопку выше.</p>
        </div>
      ) : (
        <div className="offers-list">
          {data.offers.map((offer) => (
            <div key={offer.id} className="offer-card card">
              <div className="catalog-card-header">
                <h3>{offer.title}</h3>
                <div className="catalog-card-actions">
                  <button className="btn-icon" onClick={() => handleEdit(offer)} aria-label="Редактировать оффер">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(offer.id)} aria-label="Удалить оффер">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="offer-details">
                <p><strong>Для кого:</strong> {offer.targetAudience || '—'}</p>
                {offer.clientGets.length > 0 && <p><strong>Клиент получает:</strong> {offer.clientGets.join(', ')}</p>}
                {offer.clientPain && <p><strong>Боль клиента:</strong> {offer.clientPain}</p>}
                {offer.solution && <p><strong>Решение:</strong> {offer.solution}</p>}
                <p><strong>Сроки:</strong> {offer.timeline || '—'}</p>
                <p><strong>Цена:</strong> {offer.price || '—'}</p>
                {offer.ctaPhrase && <p className="offer-cta"><strong>CTA:</strong> {offer.ctaPhrase}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
