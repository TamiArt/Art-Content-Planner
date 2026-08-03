import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { AppData } from '../types';
import { Download, Upload, RefreshCw, X, FileCheck2 } from 'lucide-react';
import { countImportConflicts } from '../utils/mergeAppData';

type ImportPreview = {
  data: AppData;
  fileName: string;
  fileSize: number;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

const Settings: React.FC = () => {
  const { data, exportData, previewImport, replaceData, mergeData, resetData } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isCheckingImport, setIsCheckingImport] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setIsCheckingImport(true);
      setImportError('');
      setImportSuccess('');
      try {
        const imported = await previewImport(file);
        setImportPreview({ data: imported, fileName: file.name, fileSize: file.size });
      } catch {
        setImportPreview(null);
        setImportError('Файл не удалось проверить. Выберите корректный JSON-экспорт Art Content Planner.');
      } finally {
        setIsCheckingImport(false);
      }
    }
  };

  const applyImport = (mode: 'merge' | 'replace') => {
    if (!importPreview) return;
    try {
      if (mode === 'merge') {
        mergeData(importPreview.data);
      } else {
        replaceData(importPreview.data);
      }
      setImportPreview(null);
      setImportSuccess(mode === 'merge' ? 'Данные успешно объединены.' : 'Данные успешно заменены.');
    } catch {
      setImportError('Не удалось сохранить импортированные данные. Текущие данные не были заменены.');
    }
  };

  const attachmentCount = importPreview?.data.ideas.reduce((total, idea) => total + (idea.images?.length || 0), 0) || 0;
  const conflictCount = importPreview ? countImportConflicts(data, importPreview.data) : 0;

  const handleReset = () => {
    if (confirm('Вы уверены? Все данные будут удалены. Экспортируйте их перед сбросом.')) {
      resetData();
      alert('Данные сброшены');
    }
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Настройки</h1>
      </header>

      <section className="card">
        <h2>Данные приложения</h2>
        <p>Все данные хранятся локально в вашем браузере. Регулярно делайте резервные копии.</p>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={exportData}>
            <Download size={16} />
            Экспортировать данные в JSON
          </button>

          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isCheckingImport}>
            <Upload size={16} />
            {isCheckingImport ? 'Проверка файла…' : 'Импортировать данные из JSON'}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />

          <button className="btn btn-danger" onClick={handleReset}>
            <RefreshCw size={16} />
            Сбросить все данные
          </button>
        </div>

        {importError && <p className="settings-message settings-message-error" role="alert">{importError}</p>}
        {importSuccess && <p className="settings-message settings-message-success" role="status">{importSuccess}</p>}

        <div className="data-summary">
          <h3>Текущее состояние</h3>
          <ul>
            <li>Постов: {data.posts.length}</li>
            <li>Идей: {data.ideas.length}</li>
            <li>Картин: {data.paintings.length}</li>
            <li>Услуг: {data.services.length}</li>
            <li>Офферов: {data.offers.length}</li>
            <li>Кампаний: {data.campaigns.length}</li>
            <li>Хуков: {data.hookLibrary.length}</li>
            <li>Stories-цепочек: {data.storySequences.length}</li>
            <li>Рубрик: {data.rubrics.length}</li>
            <li>Месячных планов: {data.monthlyPlans.length}</li>
          </ul>
          <p>
            <small>Последнее обновление: {new Date(data.lastUpdated).toLocaleString('ru-RU')}</small>
          </p>
        </div>
      </section>

      <section className="card">
        <h2>О приложении</h2>
        <p>
          <strong>Art Content Planner</strong> v{data.version}
        </p>
        <p>
          Личный контент-оператор для художника. Генерирует контент-план, создает промпты для ИИ и помогает вести
          аналитику публикаций.
        </p>
        <p>Приложение работает без сервера, без регистрации и без платных API. Полноценный PWA/offline-режим находится в разработке и будет реализован в будущем.</p>
      </section>

      {importPreview && (
        <div className="modal-overlay" role="presentation" onMouseDown={() => setImportPreview(null)}>
          <section
            className="modal-content import-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <h2 id="import-preview-title"><FileCheck2 size={22} /> Проверка резервной копии</h2>
                <p>{importPreview.fileName} · {formatFileSize(importPreview.fileSize)}</p>
              </div>
              <button className="btn-icon" onClick={() => setImportPreview(null)} aria-label="Закрыть проверку импорта">
                <X size={20} />
              </button>
            </header>
            <div className="modal-body">
              <div className="import-preview-meta">
                <span><strong>Версия:</strong> {importPreview.data.version}</span>
                <span><strong>Обновлено:</strong> {new Date(importPreview.data.lastUpdated).toLocaleString('ru-RU')}</span>
              </div>
              <div className="import-preview-grid">
                <span>Посты<strong>{importPreview.data.posts.length}</strong></span>
                <span>Идеи<strong>{importPreview.data.ideas.length}</strong></span>
                <span>Изображения<strong>{attachmentCount}</strong></span>
                <span>Картины<strong>{importPreview.data.paintings.length}</strong></span>
                <span>Кампании<strong>{importPreview.data.campaigns.length}</strong></span>
                <span>Месячные планы<strong>{importPreview.data.monthlyPlans.length}</strong></span>
              </div>
              <p className="import-warning">
                Найдено совпадений по ID: <strong>{conflictCount}</strong>. При объединении записи из файла обновят
                совпадающие записи, а уникальные текущие данные сохранятся. Полная замена удалит данные, которых нет в файле.
              </p>
              {importError && <p className="settings-message settings-message-error" role="alert">{importError}</p>}
            </div>
            <footer className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>Отмена</button>
              <button className="btn btn-primary" onClick={() => applyImport('merge')}>Объединить данные</button>
              <button className="btn btn-danger" onClick={() => applyImport('replace')}>Заменить всё</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

export default Settings;
