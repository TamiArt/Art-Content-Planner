import { createBrowserRouter } from 'react-router';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import MonthGenerator from '../pages/MonthGenerator';
import ContentPlanReview from '../pages/ContentPlanReview';
import CalendarView from '../pages/CalendarView';
import PostEditor from '../pages/PostEditor';
import IdeaBank from '../pages/IdeaBank';
import Analytics from '../pages/Analytics';
import Paintings from '../pages/Paintings';
import Services from '../pages/Services';
import Offers from '../pages/Offers';
import Settings from '../pages/Settings';
import DebugPanel from '../pages/DebugPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'generate', Component: MonthGenerator },
      { path: 'review', Component: ContentPlanReview },
      { path: 'calendar', Component: CalendarView },
      { path: 'posts/:id', Component: PostEditor },
      { path: 'ideas', Component: IdeaBank },
      { path: 'analytics', Component: Analytics },
      { path: 'paintings', Component: Paintings },
      { path: 'services', Component: Services },
      { path: 'offers', Component: Offers },
      { path: 'settings', Component: Settings },
      { path: 'debug', Component: DebugPanel },
    ],
  },
]);
