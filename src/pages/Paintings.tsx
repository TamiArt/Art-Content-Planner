import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { Painting } from '../types';
import { Edit, Image, Plus, Sparkles, Trash2 } from 'lucide-react';
import { createPaintingContentCampaign } from '../utils/contentWorkflows';

type PaintingForm = {
  title: string;
  imageUrl: string;
  size: string;
  technique: string;
  price: string;
  status: Painting['status'];
  colors: string;
  mood: string;
  suitableInterior: string;
  spaceContribution: string;
  keyIdea: string;
  cta: string;
};

const emptyPaintingForm = (): PaintingForm => ({
  title: '',
  imageUrl: '',
  size: '',
  technique: '',
  price: '',
  status: 'available',
  colors: '',
  mood: '',
  suitableInterior: '',
  spaceContribution: '',
  keyIdea: '',
  cta: '',
});

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const splitCommaList = (value: string): string[] => value.split(',').map((item) => item.trim()).filter(Boolean);

const formFromPainting = (painting: Painting): PaintingForm => ({
  title: painting.title,
  imageUrl: painting.imageUrl || '',
  size: painting.size,
  technique: painting.technique,
  price: painting.price?.toString() || '',
  status: painting.status,
  colors: painting.colors.join(', '),
  mood: painting.mood,
  suitableInterior: painting.suitableInterior,
  spaceContribution: painting.spaceContribution,
  keyIdea: painting.keyIdea,
  cta: painting.cta,
});

const paintingFromForm = (form: PaintingForm, id: string): Painting => ({
  id,
  title: form.title.trim(),
  imageUrl: form.imageUrl.trim() || undefined,
  size: form.size.trim(),
  technique: form.technique.trim(),
  price: form.price.trim() ? Number(form.price) : undefined,
  status: form.status,
  colors: splitCommaList(form.colors),
  mood: form.mood.trim(),
  suitableInterior: form.suitableInterior.trim(),
  spaceContribution: form.spaceContribution.trim(),
  keyIdea: form.keyIdea.trim(),
  cta: form.cta.trim(),
});

const Paintings: React.FC = () => {
  const navigate = useNavigate();
  const { data, addPainting, updatePainting, deletePainting, addPosts, updateData } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaintingForm>(emptyPaintingForm());

  const updateField = <K extends keyof PaintingForm>(field: K, value: PaintingForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyPaintingForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    if (editingId) {
      updatePainting(editingId, paintingFromForm(form, editingId));
    } else {
      addPainting(paintingFromForm(form, generateId()));
    }

    resetForm();
  };

  const handleEdit = (painting: Painting) => {
    setEditingId(painting.id);
    setForm(formFromPainting(painting));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту картину?')) {
      deletePainting(id);
      if (editingId === id) resetForm();
    }
  };

  const handleCreateCampaign = (painting: Painting) => {
    const workflow = createPaintingContentCampaign(painting);
    addPosts(workflow.posts);
    updateData({
      campaigns: [...data.campaigns, workflow.campaign],
      storySequences: [...data.storySequences, ...workflow.storySequences],
    });
    alert('Созданы посты, кампания и Stories-цепочка для картины');
    navigate('/campaigns');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Выберите файл изображения');
      return;
    }

    const maxSizeInMb = 2;
    if (file.size > maxSizeInMb * 1024 * 1024) {
      alert(`Изображение слишком большое. Лучше загрузить файл до ${maxSizeInMb} МБ, чтобы локальное сохранение работало стабильно.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="paintings-page">
      <header className="page-header">
        <div>
          <h1>
            <Image /> Мои картины
          </h1>
          <p>Картины для продажи и упоминания в контенте</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Добавить картину
        </button>
      </header>

      {showForm && (
        <form className="card catalog-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Редактировать картину' : 'Новая картина'}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Название</label>
              <input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
            </div>
            <div className="form-group">
              <label>Статус</label>
              <select value={form.status} onChange={(event) => updateField('status', event.target.value as Painting['status'])}>
                <option value="available">В наличии</option>
                <option value="sold">Продана</option>
                <option value="custom-order">На заказ</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Размер</label>
              <input value={form.size} onChange={(event) => updateField('size', event.target.value)} placeholder="60×80 см" />
            </div>
            <div className="form-group">
              <label>Техника</label>
              <input value={form.technique} onChange={(event) => updateField('technique', event.target.value)} placeholder="Масло, холст" />
            </div>
            <div className="form-group">
              <label>Цена</label>
              <input type="number" min="0" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Фото картины</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <small className="form-hint">Можно загрузить фото до 2 МБ или вставить URL ниже. Фото сохраняется локально в JSON приложения.</small>
          </div>

          <div className="form-group">
            <label>URL изображения или локальное фото</label>
            <input value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://... или data:image/..." />
          </div>

          {form.imageUrl && (
            <div className="catalog-image-preview">
              <img src={form.imageUrl} alt="Предпросмотр картины" />
              <button type="button" className="btn btn-secondary btn-small" onClick={() => updateField('imageUrl', '')}>
                Убрать фото
              </button>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Цвета (через запятую)</label>
              <input value={form.colors} onChange={(event) => updateField('colors', event.target.value)} placeholder="охра, синий, белый" />
            </div>
            <div className="form-group">
              <label>Настроение</label>
              <input value={form.mood} onChange={(event) => updateField('mood', event.target.value)} placeholder="спокойное, тёплое" />
            </div>
          </div>

          <div className="form-group">
            <label>Подходящий интерьер</label>
            <textarea rows={3} value={form.suitableInterior} onChange={(event) => updateField('suitableInterior', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Что добавляет пространству</label>
            <textarea rows={3} value={form.spaceContribution} onChange={(event) => updateField('spaceContribution', event.target.value)} />
          </div>
          <div className="form-group">
            <label>Ключевая идея</label>
            <textarea rows={3} value={form.keyIdea} onChange={(event) => updateField('keyIdea', event.target.value)} />
          </div>
          <div className="form-group">
            <label>CTA</label>
            <input value={form.cta} onChange={(event) => updateField('cta', event.target.value)} placeholder="Напишите в Direct, чтобы купить" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Сохранить изменения' : 'Добавить картину'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {data.paintings.length === 0 ? (
        <div className="empty-state card">
          <Image size={48} />
          <p>Пока нет картин. Добавьте первую через кнопку выше.</p>
        </div>
      ) : (
        <div className="paintings-grid">
          {data.paintings.map((painting) => (
            <div key={painting.id} className="painting-card card">
              {painting.imageUrl && <img className="catalog-image" src={painting.imageUrl} alt={painting.title} />}
              <div className="catalog-card-header">
                <h3>{painting.title}</h3>
                <div className="catalog-card-actions">
                  <button className="btn-icon" onClick={() => handleEdit(painting)} aria-label="Редактировать картину">
                    <Edit size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(painting.id)} aria-label="Удалить картину">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="catalog-source-actions">
                <button className="btn btn-primary" onClick={() => handleCreateCampaign(painting)}>
                  <Sparkles size={16} /> Создать посты из этой картины
                </button>
              </div>
              <div className="painting-details">
                <p><strong>Размер:</strong> {painting.size || '—'}</p>
                <p><strong>Техника:</strong> {painting.technique || '—'}</p>
                {painting.price && <p><strong>Цена:</strong> {painting.price} ₽</p>}
                <p>
                  <strong>Статус:</strong>{' '}
                  <span className={`badge badge-${painting.status}`}>
                    {painting.status === 'available' ? 'В наличии' : painting.status === 'sold' ? 'Продана' : 'На заказ'}
                  </span>
                </p>
                {painting.colors.length > 0 && <p><strong>Цвета:</strong> {painting.colors.join(', ')}</p>}
                {painting.mood && <p><strong>Настроение:</strong> {painting.mood}</p>}
                {painting.suitableInterior && <p><strong>Интерьер:</strong> {painting.suitableInterior}</p>}
                {painting.spaceContribution && <p><strong>В пространстве:</strong> {painting.spaceContribution}</p>}
                {painting.keyIdea && <p><strong>Идея:</strong> {painting.keyIdea}</p>}
                {painting.cta && <p className="offer-cta"><strong>CTA:</strong> {painting.cta}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Paintings;
