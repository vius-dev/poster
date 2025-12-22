
import { useWindowDimensions, Platform } from 'react-native';

export const BREAKPOINTS = {
    TABLET: 768,
    DESKTOP: 1024,
    MAX_WIDTH: 1200,
};

export const useResponsive = () => {
    const { width } = useWindowDimensions();

    const isMobile = width < BREAKPOINTS.TABLET;
    const isTablet = width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
    const isDesktop = width >= BREAKPOINTS.DESKTOP;

    // Specifically for the multi-column web experience
    const showSidebar = width >= BREAKPOINTS.TABLET;
    const showWidgets = width >= BREAKPOINTS.DESKTOP;

    return {
        width,
        isMobile,
        isTablet,
        isDesktop,
        showSidebar,
        showWidgets,
        isWeb: Platform.OS === 'web',
        isHandset: isMobile, // alias for isMobile
    };
};
