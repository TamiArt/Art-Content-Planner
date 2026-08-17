import React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  Home,
  Calendar,
  Sparkles,
  FileText,
  Lightbulb,
  Image,
  Briefcase,
  Tag,
  BarChart3,
  Megaphone,
  Target,
  Grid3X3,
  Settings,
  Menu,
  X,
  Cloud,
  CloudOff,
  LogOut,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, syncStatus, logout } = useAppContext();

  const navItems = [
    { path: '/', label: 'Главная', icon: Home },
    { path: '/generate', label: 'Генератор месяца', icon: Sparkles },
    { path: '/calendar', label: 'Календарь', icon: Calendar },
    { path: '/ideas', label: 'Банк идей', icon: Lightbulb },
    { path: '/analytics', label: 'Аналитика', icon: BarChart3 },
    { path: '/paintings', label: 'Мои картины', icon: Image },
    { path: '/services', label: 'Услуги', icon: Briefcase },
    { path: '/offers', label: 'Офферы', icon: Tag },
    { path: '/campaigns', label: 'Кампании', icon: Megaphone },
    { path: '/hooks', label: 'Хуки', icon: Target },
    { path: '/rubrics', label: 'Рубрики', icon: Grid3X3 },
    { path: '/settings', label: 'Настройки', icon: Settings },
    ...(import.meta.env.DEV ? [{ path: '/debug', label: '🐛 Debug', icon: Settings }] : []),
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Art Content</h2>
          <p>Planner</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="account-panel">
          <div className={`sync-state ${syncStatus}`} title="Состояние синхронизации">
            {syncStatus === 'offline' || syncStatus === 'error' ? <CloudOff size={16} /> : <Cloud size={16} />}
            <span>{syncStatus === 'syncing' ? 'Синхронизация…' : syncStatus === 'synced' ? 'Синхронизировано' : syncStatus === 'offline' ? 'Нет сети' : syncStatus === 'error' ? 'Ошибка синхронизации' : 'Локально'}</span>
          </div>
          <div className="account-email" title={user?.email}>{user?.email}</div>
          <button className="account-logout" onClick={() => void logout()}><LogOut size={16} /> Выйти</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
