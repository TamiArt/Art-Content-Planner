import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppData, Post, Idea, Painting, Service, Offer, MonthlyPlan } from '../types';
import { loadAppData, saveAppData, exportToJSON, importFromJSON, getDefaultAppData } from '../utils/storage';

interface AppContextValue {
  data: AppData;
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

  useEffect(() => {
    const loaded = loadAppData();
    setData(loaded);
  }, []);

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
    console.log('addPosts called with posts:', posts.length);
    setData((prevData) => {
      console.log('addPosts - Current posts in state:', prevData.posts.length);
      const newData = { ...prevData, posts: [...prevData.posts, ...posts] };
      console.log('addPosts - New total will be:', newData.posts.length);
      saveAppData(newData);
      console.log('addPosts - Saved to localStorage');
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
    console.log('addMonthlyPlan called with:', plan.id);
    setData((prevData) => {
      const newData = { ...prevData, monthlyPlans: [...prevData.monthlyPlans, plan] };
      saveAppData(newData);
      console.log('addMonthlyPlan - Saved to localStorage');
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
