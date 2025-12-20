
import { create } from 'zustand';

interface NotificationsSettingsState {
    qualityFilter: boolean;
    mutedWords: string[];
    mentionsOnly: boolean;
    setQualityFilter: (value: boolean) => void;
    setMentionsOnly: (value: boolean) => void;
    addMutedWord: (word: string) => void;
    removeMutedWord: (word: string) => void;
}

export const useNotificationsSettings = create<NotificationsSettingsState>((set) => ({
    qualityFilter: true,
    mutedWords: [],
    mentionsOnly: false,
    setQualityFilter: (qualityFilter) => set({ qualityFilter }),
    setMentionsOnly: (mentionsOnly) => set({ mentionsOnly }),
    addMutedWord: (word) => set((state) => ({
        mutedWords: Array.from(new Set([...state.mutedWords, word.toLowerCase()]))
    })),
    removeMutedWord: (word) => set((state) => ({
        mutedWords: state.mutedWords.filter(w => w !== word.toLowerCase())
    })),
}));

// --- Messages Settings ---

interface MessagesSettingsState {
    allowMessageRequests: boolean;
    filterLowQuality: boolean;
    showReadReceipts: boolean;
    setAllowMessageRequests: (value: boolean) => void;
    setFilterLowQuality: (value: boolean) => void;
    setShowReadReceipts: (value: boolean) => void;
}

export const useMessagesSettings = create<MessagesSettingsState>((set) => ({
    allowMessageRequests: true,
    filterLowQuality: true,
    showReadReceipts: true,
    setAllowMessageRequests: (allowMessageRequests) => set({ allowMessageRequests }),
    setFilterLowQuality: (filterLowQuality) => set({ filterLowQuality }),
    setShowReadReceipts: (showReadReceipts) => set({ showReadReceipts }),
}));
