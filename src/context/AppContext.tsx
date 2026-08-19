import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { AppData, Post, Idea, Painting, Service, Offer, MonthlyPlan } from '../types';
import { loadAppData, saveAppData, exportToJSON, importFromJSON, getDefaultAppData } from '../utils/storage';
import { mergeAppData } from '../utils/mergeAppData';
import { mergeSyncConflict } from '../utils/syncConflict';
import {
  applySyncDeleted,
  clearSyncDeleted,
  fromSyncData,
  loadSyncDeleted,
  markSyncDeleted,
  mergeSyncDeleted,
  saveSyncDeleted,
  toSyncData,
  type SyncDeleteCollection,
  type SyncDeleted,
} from '../utils/syncTombstones';
import { authApi, syncApi, type AccountUser, type ApiError } from '../utils/syncApi';

interface AppContextValue {
  data: AppData;
  user: AccountUser | null;
  authLoading: boolean;
  backendAvailable: boolean | null;
  localMode: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  continueLocally: () => void;
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
  previewImport: (file: File) => Promise<AppData>;
  replaceData: (imported: AppData) => void;
  mergeData: (imported: AppData) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(getDefaultAppData());
  const [user, setUser] = useState<AccountUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AppContextValue['syncStatus']>('idle');
  const revision = useRef(0);
  const syncReady = useRef(false);
  const skipNextSave = useRef(false);
  const localChangeId = useRef(0);
  const syncedChangeId = useRef(0);
  const deletedRef = useRef<SyncDeleted>(loadSyncDeleted());

  const persistDeleted = (deleted: SyncDeleted) => {
    deletedRef.current = deleted;
    saveSyncDeleted(deleted);
  };

  const rememberDeleted = (collection: SyncDeleteCollection, ids: string[]) => {
    persistDeleted(markSyncDeleted(deletedRef.current, collection, ids));
  };

  useEffect(() => {
    const loaded = loadAppData();
    setData(applySyncDeleted(loaded, deletedRef.current));
    authApi.me()
      .then(({ user: activeUser }) => {
        setBackendAvailable(true);
        return connectAccount(activeUser, loaded);
      })
      .catch((error: ApiError) => {
        setBackendAvailable(error.status === 401);
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user || !syncReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const changeId = ++localChangeId.current;
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');

    const timer = window.setTimeout(async () => {
      try {
        const result = await syncApi.save(toSyncData(data, deletedRef.current), revision.current);
        revision.current = result.revision;
        if (changeId === localChangeId.current) {
          syncedChangeId.current = changeId;
          setSyncStatus('synced');
        }
      } catch (error) {
        if ((error as { status?: number }).status !== 409) {
          setSyncStatus(navigator.onLine ? 'error' : 'offline');
          return;
        }

        try {
          const remote = await syncApi.load();
          revision.current = remote.revision;
          if (changeId !== localChangeId.current) return;

          let remoteData: AppData | null = null;
          let mergedDeleted = deletedRef.current;
          if (remote.data) {
            const parsed = fromSyncData(remote.data);
            remoteData = parsed.data;
            mergedDeleted = mergeSyncDeleted(deletedRef.current, parsed.deleted);
          }

          persistDeleted(mergedDeleted);
          const merged = applySyncDeleted(mergeSyncConflict(remoteData, data), mergedDeleted);
          const saved = await syncApi.save(toSyncData(merged, mergedDeleted), remote.revision);
          revision.current = saved.revision;

          if (changeId !== localChangeId.current) return;
          syncedChangeId.current = changeId;
          skipNextSave.current = true;
          setData(merged);
          saveAppData(merged);
          setSyncStatus('synced');
        } catch {
          setSyncStatus(navigator.onLine ? 'error' : 'offline');
        }
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [data, user]);

  useEffect(() => {
    if (!user) return;

    const refresh = async () => {
      if (!navigator.onLine) return setSyncStatus('offline');
      if (localChangeId.current !== syncedChangeId.current) return;

      try {
        const remote = await syncApi.load();
        if (remote.data && remote.revision > revision.current) {
          const parsed = fromSyncData(remote.data);
          const mergedDeleted = mergeSyncDeleted(deletedRef.current, parsed.deleted);
          const nextData = applySyncDeleted(parsed.data, mergedDeleted);
          persistDeleted(mergedDeleted);
          revision.current = remote.revision;
          skipNextSave.current = true;
          setData(nextData);
          saveAppData(nextData);
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    };

    const interval = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [user]);

  const connectAccount = async (activeUser: AccountUser, localData: AppData) => {
    setAuthLoading(true);
    const remote = await syncApi.load();
    revision.current = remote.revision;
    localChangeId.current = 0;
    syncedChangeId.current = 0;

    if (remote.data) {
      const parsed = fromSyncData(remote.data);
      persistDeleted(parsed.deleted);
      skipNextSave.current = true;
      setData(parsed.data);
      saveAppData(parsed.data);
    } else {
      const local = applySyncDeleted(localData, deletedRef.current);
      const saved = await syncApi.save(toSyncData(local, deletedRef.current), 0);
      revision.current = saved.revision;
      setData(local);
    }

    setUser(activeUser);
    setBackendAvailable(true);
    setLocalMode(false);
    syncReady.current = true;
    setSyncStatus('synced');
    setAuthLoading(false);
  };

  const continueLocally = () => {
    syncReady.current = false;
    revision.current = 0;
    localChangeId.current = 0;
    syncedChangeId.current = 0;
    setUser(null);
    setLocalMode(true);
    setSyncStatus('idle');
  };

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setBackendAvailable(true);
    await connectAccount(result.user, loadAppData());
  };

  const register = async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    setBackendAvailable(true);
    await connectAccount(result.user, loadAppData());
  };

  const logout = async () => {
    await authApi.logout();
    syncReady.current = false;
    revision.current = 0;
    localChangeId.current = 0;
    syncedChangeId.current = 0;
    deletedRef.current = {};
    clearSyncDeleted();
    setUser(null);
    setSyncStatus('idle');
    const empty = getDefaultAppData();
    setData(empty);
    saveAppData(empty);
  };

  const store = (next: AppData): AppData => {
    saveAppData(next);
    return next;
  };

  const updateData = (updates: Partial<AppData>) => setData((current) => store({ ...current, ...updates }));

  const addPost = (post: Post) => setData((current) => store({ ...current, posts: [...current.posts, post] }));
  const addPosts = (posts: Post[]) => setData((current) => store({ ...current, posts: [...current.posts, ...posts] }));
  const updatePost = (id: string, updates: Partial<Post>) => setData((current) => store({
    ...current,
    posts: current.posts.map((post) => (post.id === id ? { ...post, ...updates } : post)),
  }));
  const deletePost = (id: string) => {
    rememberDeleted('posts', [id]);
    setData((current) => store({ ...current, posts: current.posts.filter((post) => post.id !== id) }));
  };
  const deletePosts = (ids: string[]) => {
    rememberDeleted('posts', ids);
    const deleted = new Set(ids);
    setData((current) => store({ ...current, posts: current.posts.filter((post) => !deleted.has(post.id)) }));
  };

  const addIdea = (idea: Idea) => setData((current) => store({ ...current, ideas: [...current.ideas, idea] }));
  const updateIdea = (id: string, updates: Partial<Idea>) => setData((current) => store({
    ...current,
    ideas: current.ideas.map((idea) => (idea.id === id ? { ...idea, ...updates } : idea)),
  }));
  const deleteIdea = (id: string) => {
    rememberDeleted('ideas', [id]);
    setData((current) => store({ ...current, ideas: current.ideas.filter((idea) => idea.id !== id) }));
  };

  const addPainting = (painting: Painting) => setData((current) => store({ ...current, paintings: [...current.paintings, painting] }));
  const updatePainting = (id: string, updates: Partial<Painting>) => setData((current) => store({
    ...current,
    paintings: current.paintings.map((painting) => (painting.id === id ? { ...painting, ...updates } : painting)),
  }));
  const deletePainting = (id: string) => {
    rememberDeleted('paintings', [id]);
    setData((current) => store({ ...current, paintings: current.paintings.filter((painting) => painting.id !== id) }));
  };

  const addService = (service: Service) => setData((current) => store({ ...current, services: [...current.services, service] }));
  const updateService = (id: string, updates: Partial<Service>) => setData((current) => store({
    ...current,
    services: current.services.map((service) => (service.id === id ? { ...service, ...updates } : service)),
  }));
  const deleteService = (id: string) => {
    rememberDeleted('services', [id]);
    setData((current) => store({ ...current, services: current.services.filter((service) => service.id !== id) }));
  };

  const addOffer = (offer: Offer) => setData((current) => store({ ...current, offers: [...current.offers, offer] }));
  const updateOffer = (id: string, updates: Partial<Offer>) => setData((current) => store({
    ...current,
    offers: current.offers.map((offer) => (offer.id === id ? { ...offer, ...updates } : offer)),
  }));
  const deleteOffer = (id: string) => {
    rememberDeleted('offers', [id]);
    setData((current) => store({ ...current, offers: current.offers.filter((offer) => offer.id !== id) }));
  };

  const addMonthlyPlan = (plan: MonthlyPlan) => setData((current) => store({ ...current, monthlyPlans: [...current.monthlyPlans, plan] }));

  const exportData = () => exportToJSON(data);
  const previewImport = (file: File) => importFromJSON(file);

  const replaceData = (imported: AppData) => {
    deletedRef.current = {};
    clearSyncDeleted();
    saveAppData(imported);
    setData(imported);
  };

  const mergeData = (imported: AppData) => {
    const merged = applySyncDeleted(mergeAppData(data, imported), deletedRef.current);
    saveAppData(merged);
    setData(merged);
  };

  const resetData = () => {
    rememberDeleted('posts', data.posts.map((item) => item.id));
    rememberDeleted('ideas', data.ideas.map((item) => item.id));
    rememberDeleted('paintings', data.paintings.map((item) => item.id));
    rememberDeleted('services', data.services.map((item) => item.id));
    rememberDeleted('offers', data.offers.map((item) => item.id));
    const empty = getDefaultAppData();
    setData(empty);
    saveAppData(empty);
  };

  return (
    <AppContext.Provider value={{
      data,
      user,
      authLoading,
      backendAvailable,
      localMode,
      syncStatus,
      continueLocally,
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
      previewImport,
      replaceData,
      mergeData,
      resetData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
