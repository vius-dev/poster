
import React, { createContext, useContext, useEffect, useState } from 'react';
import { eventEmitter } from '@/lib/EventEmitter';
import { api } from '@/lib/api';
import { ReactionAction } from '@/types/post';

interface RealtimeState {
  counts: {
    [postId: string]: {
      likes: number;
      dislikes: number;
      laughs: number;
      reposts: number;
      comments: number;
    };
  };
  userReactions: {
    [postId: string]: ReactionAction;
  };
  userReposts: {
    [postId: string]: boolean;
  };
  userBookmarks: {
    [postId: string]: boolean;
  };
}

interface RealtimeContextType extends RealtimeState {
  setCounts: (postId: string, updates: Partial<RealtimeState['counts'][string]>) => void;
  initializePost: (postId: string, initial: {
    likes: number;
    dislikes: number;
    laughs: number;
    reposts: number;
    comments: number;
    userReaction: ReactionAction;
    isReposted: boolean;
    isBookmarked: boolean;
  }) => void;
  toggleReaction: (postId: string, action: ReactionAction) => Promise<void>;
  toggleRepost: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RealtimeState>({
    counts: {},
    userReactions: {},
    userReposts: {},
    userBookmarks: {},
  });

  const setCounts = (postId: string, updates: Partial<RealtimeState['counts'][string]>) => {
    setState((prevState) => ({
      ...prevState,
      counts: {
        ...prevState.counts,
        [postId]: {
          ...(prevState.counts[postId] || { likes: 0, dislikes: 0, laughs: 0, reposts: 0, comments: 0 }),
          ...updates,
        },
      },
    }));
  };

  const initializePost = (postId: string, initial: {
    likes: number;
    dislikes: number;
    laughs: number;
    reposts: number;
    comments: number;
    userReaction: ReactionAction;
    isReposted: boolean;
    isBookmarked: boolean;
  }) => {
    setState((prevState) => {
      if (prevState.counts[postId]) return prevState; // Don't overwrite existing dynamic state
      return {
        ...prevState,
        counts: {
          ...prevState.counts,
          [postId]: {
            likes: initial.likes,
            dislikes: initial.dislikes,
            laughs: initial.laughs,
            reposts: initial.reposts,
            comments: initial.comments,
          },
        },
        userReactions: {
          ...prevState.userReactions,
          [postId]: initial.userReaction,
        },
        userReposts: {
          ...prevState.userReposts,
          [postId]: initial.isReposted,
        },
        userBookmarks: {
          ...prevState.userBookmarks,
          [postId]: initial.isBookmarked,
        },
      };
    });
  };

  const toggleReaction = async (postId: string, action: ReactionAction) => {
    const currentReaction = state.userReactions[postId] || 'NONE';
    const nextReaction = currentReaction === action ? 'NONE' : action;

    // Optimistic Update
    const currentPostCounts = state.counts[postId] || { likes: 0, dislikes: 0, laughs: 0, reposts: 0, comments: 0 };
    const newCounts = { ...currentPostCounts };

    if (currentReaction !== 'NONE') {
      const key = (currentReaction.toLowerCase() + 's') as keyof typeof newCounts;
      if (typeof newCounts[key] === 'number') (newCounts[key] as number)--;
    }

    if (nextReaction !== 'NONE') {
      const key = (nextReaction.toLowerCase() + 's') as keyof typeof newCounts;
      if (typeof newCounts[key] === 'number') (newCounts[key] as number)++;
    }

    setState(prev => ({
      ...prev,
      counts: { ...prev.counts, [postId]: newCounts },
      userReactions: { ...prev.userReactions, [postId]: nextReaction }
    }));

    try {
      await api.react(postId, nextReaction);
    } catch (error) {
      // Rollback
      setState(prev => ({
        ...prev,
        counts: { ...prev.counts, [postId]: currentPostCounts },
        userReactions: { ...prev.userReactions, [postId]: currentReaction }
      }));
      throw error;
    }
  };

  const toggleRepost = async (postId: string) => {
    const currentlyReposted = state.userReposts[postId] || false;
    const nextReposted = !currentlyReposted;

    const currentPostCounts = state.counts[postId] || { likes: 0, dislikes: 0, laughs: 0, reposts: 0, comments: 0 };
    const newCounts = { ...currentPostCounts, reposts: currentPostCounts.reposts + (nextReposted ? 1 : -1) };

    setState(prev => ({
      ...prev,
      counts: { ...prev.counts, [postId]: newCounts },
      userReposts: { ...prev.userReposts, [postId]: nextReposted }
    }));

    try {
      await api.repost(postId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        counts: { ...prev.counts, [postId]: currentPostCounts },
        userReposts: { ...prev.userReposts, [postId]: currentlyReposted }
      }));
      throw error;
    }
  };

  const toggleBookmark = async (postId: string) => {
    const currentlyBookmarked = state.userBookmarks[postId] || false;
    const nextBookmarked = !currentlyBookmarked;

    setState(prev => ({
      ...prev,
      userBookmarks: { ...prev.userBookmarks, [postId]: nextBookmarked }
    }));

    try {
      await api.toggleBookmark(postId);
    } catch (error) {
      setState(prev => ({
        ...prev,
        userBookmarks: { ...prev.userBookmarks, [postId]: currentlyBookmarked }
      }));
      throw error;
    }
  };

  useEffect(() => {
    const handleCountUpdate = ({ postId, updates }: { postId: string, updates: Partial<RealtimeState['counts'][string]> }) => {
      setCounts(postId, updates);
    };

    const handleNewComment = ({ parentId }: { parentId: string }) => {
      const currentComments = state.counts[parentId]?.comments || 0;
      setCounts(parentId, { comments: currentComments + 1 });
    };

    eventEmitter.on('count-update', handleCountUpdate);
    eventEmitter.on('newComment', handleNewComment);

    return () => {
      eventEmitter.off('count-update', handleCountUpdate);
      eventEmitter.off('newComment', handleNewComment);
    };
  }, [state.counts]);

  return (
    <RealtimeContext.Provider value={{
      ...state,
      setCounts,
      initializePost,
      toggleReaction,
      toggleRepost,
      toggleBookmark,
    }}>
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
