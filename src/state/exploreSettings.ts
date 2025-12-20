
import { create } from 'zustand';

interface ExploreSettingsState {
    showLocationContent: boolean;
    personalizeTrends: boolean;
    explorationLocation: string;
    setShowLocationContent: (value: boolean) => void;
    setPersonalizeTrends: (value: boolean) => void;
    setExplorationLocation: (value: string) => void;
}

export const useExploreSettings = create<ExploreSettingsState>((set) => ({
    showLocationContent: true,
    personalizeTrends: true,
    explorationLocation: 'Worldwide',
    setShowLocationContent: (showLocationContent) => set({ showLocationContent }),
    setPersonalizeTrends: (personalizeTrends) => set({ personalizeTrends }),
    setExplorationLocation: (explorationLocation) => set({ explorationLocation }),
}));
