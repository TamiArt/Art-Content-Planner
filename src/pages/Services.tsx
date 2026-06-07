import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { Service } from '../types';
import { Briefcase, Edit, Flame, Plus, Trash2 } from 'lucide-react';
import { createServiceWarmupCampaign } from '../utils/contentWorkflows';

type ServiceForm = Omit<Service, 'id' | 'includes' | 'clientRequirements'> & {
  includes: string;
  clientRequirements: string;
};

const emptyServiceForm = (): ServiceForm => ({
  title: '',
  description: '',
  includes: '',
  targetAudience: '',
  timeline: '',
  price: '',
  clientRequirements: '',
  result: '',
  cta: '',
});

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const splitCommaList = (value: string): string[] => value.split(',').map((item) => item.trim()).filter(Boolean);

const formFromService = (service: Service): ServiceForm => ({
  title: service.title,
  description: service.description,
  includes: service.includes.join(', '),
  targetAudience: service.targetAudience,
  timeline: service.timeline,
  price: service.price,
  clientRequirements: service.clientRequirements.join(', '),
  result: service.result,
  cta: service.cta,
});

const serviceFromForm = (form: ServiceForm, id: string): Service => ({
  id,
  title: form.title.trim(),
  description: form.description.trim(),
  includes: splitCommaList(form.includes),
  targetAudience: form.targetAudience.trim(),
  timeline: form.timeline.trim(),
  price: form.price.trim(),
  clientRequirements: splitCommaList(form.clientRequirements),
  result: form.result.trim(),
  cta: form.cta.trim(),
});

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { data, addService, updateService, deleteService, addPosts, updateData } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyServiceForm());

  const updateField = <K extends keyof ServiceForm>(field: K, value: ServiceForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyServiceForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      updateService(editingId, serviceFromForm(form, editingId));
    } else {
      addService(serviceFromForm(form, generateId()));
    }

    resetForm();
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setForm(formFromService(service));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту услугу?')) {
      deleteService(id);
      if (editingId === id) resetForm();
    }
  };

  const handleCreateWarmup = (service: Service) => {
    const workflow = createServiceWarmupCampaign(service);
    addPosts(workflow.posts);
    updateData({
      campaigns: [...data.campaigns, workflow.campaign],
      storySequences: [...data.storySequences, ...workflow.storySequences],
    });
    alert('Создан прогрев услуги: посты, кампания и Stories-цепочка');
    navigate('/campaigns');
  };

  return (
    <div className="services-page">
      <header className="page-header">
        <div>
          <h1>
            <Briefcase /> Мои услуги
          </h1>
          <p>Услуги для продвижения в контенте</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Добавить услугу
        </button>
      </header>

      {showForm && (
        <form className="card catalog-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать услугу' : 'Новая услуга'}</h2>
          <div className="form-group">
            <label>Название</label>
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
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
            <label>Что входит (через запятую)</label>
            <textarea rows={3} value={form.includes} onChange={(event) => updateField('includes', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Что нужно от клиента (через запятую)</label>
            <textarea rows={3} value={form.clientRequirements} onChange={(event) => updateField('clientRequirements', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Результат</label>
            <textarea rows={3} value={form.result} onChange={(event) => updateField('result', event.target.value)} />
          </div>
          <div className="form-group">
            <label>CTA</label>
            <input value={form.cta} onChange={(event) => updateField('cta', event.target.value)} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Сохранить изменения' : 'Добавить услугу'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {data.services.length === 0 ? (
        <div className="empty-state card">
          <Briefcase size={48} />
          <p>Пока нет услуг. Добавьте первую через кнопку выше.</p>
        </div>
      ) : (
        <div className="services-list">
          {data.services.map((service) => (
            <div key={service.id} className="service-card card">
              <div className="catalog-card-header">
                <h3>{service.title}</h3>
                <div className="catalog-card-actions">
                  <button className="btn-icon" onClick={() => handleEdit(service)} aria-label="Редактировать услугу">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(service.id)} aria-label="Удалить услугу">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {service.description && <p>{service.description}</p>}
              <div className="catalog-source-actions">
                <button className="btn btn-primary" onClick={() => handleCreateWarmup(service)}>
                  <Flame size={16} /> Создать прогрев услуги
                </button>
              </div>
              <div className="service-details">
                <p><strong>Для кого:</strong> {service.targetAudience || '—'}</p>
                <p><strong>Сроки:</strong> {service.timeline || '—'}</p>
                <p><strong>Цена:</strong> {service.price || '—'}</p>
                {service.includes.length > 0 && <p><strong>Входит:</strong> {service.includes.join(', ')}</p>}
                {service.clientRequirements.length > 0 && <p><strong>Нужно от клиента:</strong> {service.clientRequirements.join(', ')}</p>}
                {service.result && <p><strong>Результат:</strong> {service.result}</p>}
                {service.cta && <p className="offer-cta"><strong>CTA:</strong> {service.cta}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;
