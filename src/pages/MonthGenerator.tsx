import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { generateMonthPlan } from '../utils/contentGenerator';
import { generateSEOKeysForPost } from '../utils/seoKeywords';
import { buildPromptForPost } from '../utils/promptBuilder';
import type { Platform, ContentGoal } from '../types';
import { goalLabels } from '../utils/contentLabels';
import { logger } from '../utils/logger';
import { Sparkles } from 'lucide-react';

const MonthGenerator: React.FC = () => {
  const { data, deletePosts } = useAppContext();
  const navigate = useNavigate();

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [month, setMonth] = useState(currentMonth);
  const [selectedDays, setSelectedDays] = useState<string[]>(data.settings.generator.defaultDays);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(data.settings.generator.defaultTimes);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(data.settings.generator.defaultPlatforms);
  const [selectedGoals, setSelectedGoals] = useState<ContentGoal[]>(data.settings.generator.defaultGoals);
  const [isGenerating, setIsGenerating] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabels: Record<string, string> = {
    Monday: 'Понедельник',
    Tuesday: 'Вторник',
    Wednesday: 'Среда',
    Thursday: 'Четверг',
    Friday: 'Пятница',
    Saturday: 'Суббота',
    Sunday: 'Воскресенье',
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const toggleGoal = (goal: ContentGoal) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  const addTime = () => {
    const newTime = '09:00';
    setSelectedTimes([...selectedTimes, newTime]);
  };

  const updateTime = (index: number, value: string) => {
    const newTimes = [...selectedTimes];
    newTimes[index] = value;
    setSelectedTimes(newTimes);
  };

  const removeTime = (index: number) => {
    setSelectedTimes(selectedTimes.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    // Validation
    if (selectedDays.length === 0 || selectedPlatforms.length === 0 || selectedGoals.length === 0) {
      alert('Выберите хотя бы один день, платформу и цель');
      return;
    }

    if (selectedTimes.length === 0) {
      alert('Добавьте хотя бы одно время публикации');
      return;
    }

    // Check if posts already exist for this month
    const [year, monthNum] = month.split('-').map(Number);
    const existingPosts = data.posts.filter((post) => {
      const postDate = new Date(post.date);
      return postDate.getFullYear() === year && postDate.getMonth() === monthNum - 1;
    });

    if (existingPosts.length > 0) {
      const userChoice = window.prompt(
        `На ${month} уже есть ${existingPosts.length} постов.\n\nВведите:\n1 - Добавить новые посты\n2 - Заменить весь план\n3 - Отмена`,
        '1'
      );

      if (userChoice === '3' || userChoice === null) {
        setIsGenerating(false);
        return;
      }

      if (userChoice === '2') {
        // User wants to replace - delete existing posts
        const existingIds = existingPosts.map((p) => p.id);
        deletePosts(existingIds);
      }
      // If userChoice === '1', we just add new posts
    }

    setIsGenerating(true);

    setTimeout(() => {
      logger.debug('Starting content plan generation for month:', month);

      const generatedPosts = generateMonthPlan({
        month,
        settings: {
          defaultPostsPerWeek: selectedDays.length * selectedTimes.length,
          defaultDays: selectedDays,
          defaultTimes: selectedTimes,
          defaultPlatforms: selectedPlatforms,
          defaultGoals: selectedGoals,
        },
      });

      logger.debug('Generated posts count:', generatedPosts.length);
      if (generatedPosts.length > 0) {
        logger.debug('Sample generated post:', generatedPosts[0]);
      }

      // Add SEO keys and generate prompts for each post
      const postsWithSEO = generatedPosts.map((post) => {
        const seoData = generateSEOKeysForPost(post.topic, data.seoCluster);
        const prompt = buildPromptForPost(post, data.settings);
        return {
          ...post,
          seoKeys: seoData.seoKeys,
          lsiKeys: seoData.lsiKeys,
          hashtags: seoData.hashtags,
          promptForAI: prompt,
          status: 'prompt-ready' as const,
        };
      });

      logger.debug('Posts with SEO count:', postsWithSEO.length);

      // Prepare monthly plan data
      const monthlyPlan = {
        id: `${month}-${Date.now()}`,
        month,
        settings: {
          defaultPostsPerWeek: selectedDays.length * selectedTimes.length,
          defaultDays: selectedDays,
          defaultTimes: selectedTimes,
          defaultPlatforms: selectedPlatforms,
          defaultGoals: selectedGoals,
        },
        postIds: postsWithSEO.map((p) => p.id),
        createdAt: new Date().toISOString(),
      };

      logger.debug('Navigating to review page with posts');

      setIsGenerating(false);

      // Navigate to review page with generated posts
      navigate('/review', {
        state: {
          posts: postsWithSEO,
          monthlyPlan: monthlyPlan,
        },
      });
    }, 1000);
  };

  return (
    <div className="month-generator">
      <header className="page-header">
        <h1>Генерация контент-плана на месяц</h1>
        <p>Заполните параметры, и приложение автоматически создаст контент-план с постами</p>
      </header>

      <div className="generator-form card">
        <div className="form-group">
          <label>Месяц</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        <div className="info-box">
          План создаётся по выбранным дням недели и каждому указанному времени. Если выбрать 2 времени, в этот день будет 2 публикации.
        </div>

        <div className="form-group">
          <label>Дни недели для публикаций</label>
          <div className="checkbox-group">
            {daysOfWeek.map((day) => (
              <label key={day} className="checkbox-label">
                <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} />
                <span>{dayLabels[day]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Время публикаций (каждое время создаёт отдельный пост в выбранный день)</label>
          <div className="time-inputs">
            {selectedTimes.map((time, index) => (
              <div key={index} className="time-input-row">
                <input type="time" value={time} onChange={(e) => updateTime(index, e.target.value)} />
                <button className="btn btn-small btn-danger" onClick={() => removeTime(index)}>
                  Удалить
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addTime}>
              + Добавить время
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Платформы</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('TikTok')}
                onChange={() => togglePlatform('TikTok')}
              />
              <span>TikTok</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('Instagram')}
                onChange={() => togglePlatform('Instagram')}
              />
              <span>Instagram</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Цели контента (будут чередоваться)</label>
          <div className="checkbox-group">
            {(['reach', 'engagement', 'trust', 'lead', 'sale'] as ContentGoal[]).map((goal) => (
              <label key={goal} className="checkbox-label">
                <input type="checkbox" checked={selectedGoals.includes(goal)} onChange={() => toggleGoal(goal)} />
                <span>{goalLabels[goal]}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-large" onClick={handleGenerate} disabled={isGenerating}>
          <Sparkles />
          {isGenerating ? 'Генерация...' : 'Сгенерировать контент-план'}
        </button>
      </div>

      <div className="info-card card">
        <h3>Как работает генератор?</h3>
        <ul>
          <li>Распределяет посты по выбранным дням и времени</li>
          <li>Чередует цели контента согласно воронке</li>
          <li>Подбирает темы под каждую цель и этап воронки</li>
          <li>Выбирает подходящие форматы для каждой платформы</li>
          <li>Защищает от повторов тем, форматов и хуков</li>
          <li>Добавляет SEO-ключи и хэштеги к каждому посту</li>
        </ul>
      </div>
    </div>
  );
};

export default MonthGenerator;
