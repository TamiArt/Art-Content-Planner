import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { AppData, Post, Idea, Painting, Service, Offer, MonthlyPlan } from '../types';
import { loadAppData, saveAppData, exportToJSON, importFromJSON, getDefaultAppData } from '../utils/storage';
import { logger } from '../utils/logger';
import { authApi, syncApi, type AccountUser } from '../utils/syncApi';

interface AppContextValue {
  data: AppData;
  user: AccountUser | null;
  authLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateData: (updates: Partial<AppData>) => void;
  addPost: (post: Post) => void;
  addPosts: (posts: Post[]) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  deletePosts: (ids: string[]) => void;
  addIdea: (idea: Idea) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  addPainting: (painting: Painting) => void;
  updatePainting: (id: string, updates: Partial<Painting>) => void;
  deletePainting: (id: string) => void;
  addService: (service: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  addMonthlyPlan: (plan: MonthlyPlan) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(getDefaultAppData());
  const [user, setUser] = useState<AccountUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<AppContextValue['syncStatus']>('idle');
  const revision = useRef(0);
  const syncReady = useRef(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    const loaded = loadAppData();
    setData(loaded);
    authApi.me()
      .then(({ user: activeUser }) => connectAccount(activeUser, loaded))
      .catch(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!user || !syncReady.current) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
    const timer = window.setTimeout(async () => {
      try {
        const result = await syncApi.save(data, revision.current);
        revision.current = result.revision;
        setSyncStatus('synced');
      } catch (error) {
        if ((error as { status?: number }).status === 409) {
          try {
            const remote = await syncApi.load();
            revision.current = remote.revision;
            if (remote.data) { setData(remote.data); saveAppData(remote.data); }
            setSyncStatus('synced');
          } catch { setSyncStatus('error'); }
        } else setSyncStatus(navigator.onLine ? 'error' : 'offline');
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, user]);

  useEffect(() => {
    if (!user) return;
    const refresh = async () => {
      if (!navigator.onLine) return setSyncStatus('offline');
      try {
        const remote = await syncApi.load();
        if (remote.data && remote.revision > revision.current) {
          revision.current = remote.revision;
          skipNextSave.current = true;
          setData(remote.data);
          saveAppData(remote.data);
        }
        setSyncStatus('synced');
      } catch { setSyncStatus('error'); }
    };
    const interval = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); window.removeEventListener('online', onFocus); };
  }, [user]);

  const connectAccount = async (activeUser: AccountUser, localData: AppData) => {
    setAuthLoading(true);
    const remote = await syncApi.load();
    revision.current = remote.revision;
    if (remote.data) {
      skipNextSave.current = true;
      setData(remote.data);
      saveAppData(remote.data);
    } else {
      const saved = await syncApi.save(localData, 0);
      revision.current = saved.revision;
    }
    setUser(activeUser);
    syncReady.current = true;
    setSyncStatus('synced');
    setAuthLoading(false);
  };

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    await connectAccount(result.user, loadAppData());
  };

  const register = async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    await connectAccount(result.user, loadAppData());
  };

  const logout = async () => {
    await authApi.logout();
    syncReady.current = false;
    revision.current = 0;
    setUser(null);
    setSyncStatus('idle');
    const empty = getDefaultAppData();
    setData(empty);
    saveAppData(empty);
  };

  const updateData = (updates: Partial<AppData>) => {
    setData((prevData) => {
      const newData = { ...prevData, ...updates };
      saveAppData(newData);
      return newData;
    });
  };

  const addPost = (post: Post) => {
    setData((prevData) => {
      const newData = { ...prevData, posts: [...prevData.posts, post] };
      saveAppData(newData);
      return newData;
    });
  };

  const addPosts = (posts: Post[]) => {
    logger.debug('addPosts called with posts:', posts.length);
    setData((prevData) => {
      logger.debug('addPosts - Current posts in state:', prevData.posts.length);
      const newData = { ...prevData, posts: [...prevData.posts, ...posts] };
      logger.debug('addPosts - New total will be:', newData.posts.length);
      saveAppData(newData);
      logger.debug('addPosts - Saved to localStorage');
      return newData;
    });
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setData((prevData) => {
      const newPosts = prevData.posts.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const newData = { ...prevData, posts: newPosts };
      saveAppData(newData);
      return newData;
    });
  };

  const deletePost = (id: string) => {
    setData((prevData) => {
      const newData = { ...prevData, posts: prevData.posts.filter((p) => p.id !== id) };
      saveAppData(newData);
      return newData;
    });
  };

  const deletePosts = (ids: string[]) => {
    setData((prevData) => {
      const newData = { ...prevData, posts: prevData.posts.filter((p) => !ids.includes(p.id)) };
      saveAppData(newData);
      return newData;
    });
  };

  const addIdea = (idea: Idea) => {
    setData((prevData) => {
      const newData = { ...prevData, ideas: [...prevData.ideas, idea] };
      saveAppData(newData);
      return newData;
    });
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    setData((prevData) => {
      const newIdeas = prevData.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i));
      const newData = { ...prevData, ideas: newIdeas };
      saveAppData(newData);
      return newData;
    });
  };

  const deleteIdea = (id: string) => {
    setData((prevData) => {
      const newData = { ...prevData, ideas: prevData.ideas.filter((i) => i.id !== id) };
      saveAppData(newData);
      return newData;
    });
  };

  const addPainting = (painting: Painting) => {
    setData((prevData) => {
      const newData = { ...prevData, paintings: [...prevData.paintings, painting] };
      saveAppData(newData);
      return newData;
    });
  };

  const updatePainting = (id: string, updates: Partial<Painting>) => {
    setData((prevData) => {
      const newPaintings = prevData.paintings.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const newData = { ...prevData, paintings: newPaintings };
      saveAppData(newData);
      return newData;
    });
  };

  const deletePainting = (id: string) => {
    setData((prevData) => {
      const newData = { ...prevData, paintings: prevData.paintings.filter((p) => p.id !== id) };
      saveAppData(newData);
      return newData;
    });
  };

  const addService = (service: Service) => {
    setData((prevData) => {
      const newData = { ...prevData, services: [...prevData.services, service] };
      saveAppData(newData);
      return newData;
    });
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setData((prevData) => {
      const newServices = prevData.services.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const newData = { ...prevData, services: newServices };
      saveAppData(newData);
      return newData;
    });
  };

  const deleteService = (id: string) => {
    setData((prevData) => {
      const newData = { ...prevData, services: prevData.services.filter((s) => s.id !== id) };
      saveAppData(newData);
      return newData;
    });
  };

  const addOffer = (offer: Offer) => {
    setData((prevData) => {
      const newData = { ...prevData, offers: [...prevData.offers, offer] };
      saveAppData(newData);
      return newData;
    });
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setData((prevData) => {
      const newOffers = prevData.offers.map((o) => (o.id === id ? { ...o, ...updates } : o));
      const newData = { ...prevData, offers: newOffers };
      saveAppData(newData);
      return newData;
    });
  };

  const deleteOffer = (id: string) => {
    setData((prevData) => {
      const newData = { ...prevData, offers: prevData.offers.filter((o) => o.id !== id) };
      saveAppData(newData);
      return newData;
    });
  };

  const addMonthlyPlan = (plan: MonthlyPlan) => {
    logger.debug('addMonthlyPlan called with:', plan.id);
    setData((prevData) => {
      const newData = { ...prevData, monthlyPlans: [...prevData.monthlyPlans, plan] };
      saveAppData(newData);
      logger.debug('addMonthlyPlan - Saved to localStorage');
      return newData;
    });
  };

  const exportData = () => {
    exportToJSON(data);
  };

  const importData = async (file: File) => {
    const imported = await importFromJSON(file);
    setData(imported);
    saveAppData(imported);
  };

  const resetData = () => {
    const newData = getDefaultAppData();
    setData(newData);
    saveAppData(newData);
  };

  return (
    <AppContext.Provider
      value={{
        data,
        user,
        authLoading,
        syncStatus,
        login,
        register,
        logout,
        updateData,
        addPost,
        addPosts,
        updatePost,
        deletePost,
        deletePosts,
        addIdea,
        updateIdea,
        deleteIdea,
        addPainting,
        updatePainting,
        deletePainting,
        addService,
        updateService,
        deleteService,
        addOffer,
        updateOffer,
        deleteOffer,
        addMonthlyPlan,
        exportData,
        importData,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
