import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { ContentBalanceMatrix } from '../types';
import { Grid3X3, SlidersHorizontal } from 'lucide-react';
import { goalLabels } from '../utils/contentLabels';

const balanceKeys: Array<keyof ContentBalanceMatrix> = ['reach', 'engagement', 'trust', 'lead', 'sale'];

const Rubrics: React.FC = () => {
  const { data, updateData } = useAppContext();
  const total = balanceKeys.reduce((sum, key) => sum + data.contentBalance[key], 0);

  const updateBalance = (key: keyof ContentBalanceMatrix, value: number) => {
    updateData({ contentBalance: { ...data.contentBalance, [key]: value } });
  };

  const toggleRubric = (id: string) => {
    updateData({ rubrics: data.rubrics.map((rubric) => rubric.id === id ? { ...rubric, enabled: !rubric.enabled } : rubric) });
  };

  return (
    <div className="rubrics-page">
      <header className="page-header">
        <div>
          <h1><Grid3X3 /> Рубрики и баланс</h1>
          <p>Управляйте контент-матрицей: сколько охвата, доверия, заявок и продаж должно быть в плане.</p>
        </div>
      </header>

      <section className="card">
        <h2><SlidersHorizontal size={20} /> Матрица контент-балансов</h2>
        <p className="info-box">Рекомендуемая сумма — 100%. Сейчас: {total}%.</p>
        <div className="balance-grid">
          {balanceKeys.map((key) => (
            <div key={key} className="balance-item">
              <label>{goalLabels[key]}</label>
              <input type="range" min="0" max="60" value={data.contentBalance[key]} onChange={(event) => updateBalance(key, Number(event.target.value))} />
              <strong>{data.contentBalance[key]}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Раздел «Рубрики»</h2>
        <div className="ideas-grid">
          {data.rubrics.map((rubric) => (
            <div key={rubric.id} className="card rubric-card">
              <div className="catalog-card-header">
                <h3>{rubric.title}</h3>
                <label className="checkbox-label rubric-toggle">
                  <input type="checkbox" checked={rubric.enabled} onChange={() => toggleRubric(rubric.id)} />
                  <span>{rubric.enabled ? 'Включена' : 'Выключена'}</span>
                </label>
              </div>
              <p>{rubric.description}</p>
              <div className="idea-meta">
                {rubric.goals.map((goal) => <span key={goal}>{goalLabels[goal]}</span>)}
                <span>{rubric.frequencyPerMonth}×/мес</span>
              </div>
              <p><strong>Форматы:</strong> {rubric.formats.join(', ')}</p>
              <p><strong>CTA:</strong> {rubric.cta}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Rubrics;
