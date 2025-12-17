
import React, { createContext, useContext, useEffect, useState } from 'react';
import { eventEmitter } from '@/lib/EventEmitter';

interface RealtimeState {
  counts: {
    [postId: string]: {
      likes: number;
      dislikes: number;
      laughs: number;
      reposts: number;
    };
  };
}

interface RealtimeContextType extends RealtimeState {
  setCounts: (postId: string, updates: Partial<RealtimeState['counts'][string]>) => void;
  initializeCounts: (postId: string, initial: RealtimeState['counts'][string]) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RealtimeState>({ counts: {} });

  const setCounts = (postId: string, updates: Partial<RealtimeState['counts'][string]>) => {
    setState((prevState) => ({
      ...prevState,
      counts: {
        ...prevState.counts,
        [postId]: {
          ...(prevState.counts[postId] || { likes: 0, dislikes: 0, laughs: 0, reposts: 0 }),
          ...updates,
        },
      },
    }));
  };

  const initializeCounts = (postId: string, initial: RealtimeState['counts'][string]) => {
    setState((prevState) => {
      if (prevState.counts[postId]) return prevState; // Don't overwrite existing dynamic state
      return {
        ...prevState,
        counts: {
          ...prevState.counts,
          [postId]: initial,
        },
      };
    });
  };

  useEffect(() => {
    const handleCountUpdate = ({ postId, updates }: { postId: string, updates: Partial<RealtimeState['counts'][string]> }) => {
      setCounts(postId, updates);
    };

    eventEmitter.on('count-update', handleCountUpdate);

    return () => {
      eventEmitter.off('count-update', handleCountUpdate);
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ ...state, setCounts, initializeCounts }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
