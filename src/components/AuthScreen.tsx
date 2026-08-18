import React, { useState } from 'react';
import { Loader2, LockKeyhole, Mail, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AuthScreen: React.FC = () => {
  const { login, register, backendAvailable, continueLocally } = useAppContext();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (mode === 'login' ? login(email, password) : register(email, password));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  };

  const backendMissing = backendAvailable === false;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><span>ACP</span><div><strong>Art Content Planner</strong><small>Ваш план — на любом устройстве</small></div></div>
        <h1>{mode === 'login' ? 'Вход в приложение' : 'Создание аккаунта'}</h1>
        <p className="auth-intro"><RefreshCw size={18} /> Данные синхронизируются между телефоном и компьютером через ваш собственный сервер.</p>

        {backendMissing && (
          <div className="auth-error" role="alert">
            Сервер синхронизации не подключен к этому адресу. Аккаунт сейчас создать нельзя, но приложение может работать локально в этом браузере.
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <label><span>Почта</span><div className="auth-input"><Mail size={18} /><input type="email" autoComplete="email" required disabled={backendMissing} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div></label>
          <label><span>Пароль</span><div className="auth-input"><LockKeyhole size={18} /><input type="password" minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required disabled={backendMissing} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 8 символов" /></div></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="btn btn-primary auth-submit" disabled={busy || backendMissing}>{busy && <Loader2 size={17} className="spin" />}{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
        </form>

        {backendMissing && (
          <button type="button" className="btn btn-secondary auth-submit" onClick={continueLocally}>
            Продолжить локально
          </button>
        )}

        {!backendMissing && (
          <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        )}
        <p className="auth-note">Без платных API: аккаунты и данные хранятся в SQLite на сервере приложения.</p>
      </section>
    </main>
  );
};

export default AuthScreen;
