import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Download, Upload, RefreshCw, Cloud } from 'lucide-react';

const Settings: React.FC = () => {
  const { data, user, syncStatus, exportData, importData, resetData } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        alert('Данные успешно импортированы');
      } catch (error) {
        alert('Ошибка при импорте данных');
      }
    }
  };

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
        <h2><Cloud size={20} /> Аккаунт и синхронизация</h2>
        <p><strong>{user?.email}</strong></p>
        <p>Состояние: {syncStatus === 'synced' ? 'все изменения синхронизированы' : syncStatus === 'syncing' ? 'сохраняем изменения…' : syncStatus === 'offline' ? 'нет сети — изменения сохранятся после подключения' : 'требуется проверить соединение с сервером'}.</p>
        <p><small>Для входа на телефоне откройте тот же адрес приложения и используйте эту почту и пароль.</small></p>
      </section>

      <section className="card">
        <h2>Данные приложения</h2>
        <p>Данные хранятся на вашем сервере и локально в браузере. JSON-экспорт остается дополнительной резервной копией.</p>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={exportData}>
            <Download size={16} />
            Экспортировать данные в JSON
          </button>

          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Импортировать данные из JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />

          <button className="btn btn-danger" onClick={handleReset}>
            <RefreshCw size={16} />
            Сбросить все данные
          </button>
        </div>

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
        <p>Приложение не использует платные API: вход и синхронизация работают через встроенный сервер и SQLite.</p>
      </section>
    </div>
  );
};

export default Settings;
