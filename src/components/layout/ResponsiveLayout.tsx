
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { WebSidebar } from './WebSidebar';
import { WebWidgets } from './WebWidgets';
import { useTheme } from '@/theme/theme';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
    const { isDesktop, isTablet, showSidebar, showWidgets, isWeb } = useResponsive();
    const { theme } = useTheme();

    if (!isWeb || (!showSidebar && !showWidgets)) {
        return <>{children}</>;
    }

    return (
        <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
            <View style={styles.centerContainer}>
                {/* Left Sidebar */}
                {showSidebar && (
                    <View style={[
                        styles.sidebarContainer,
                        isTablet && styles.sidebarTablet
                    ]}>
                        <WebSidebar compact={isTablet} />
                    </View>
                )}

                {/* Main Content Area */}
                <View style={[
                    styles.contentArea,
                    { borderLeftColor: theme.border, borderRightColor: theme.border }
                ]}>
                    {children}
                </View>

                {/* Right Widgets */}
                {showWidgets && (
                    <View style={styles.widgetsContainer}>
                        <WebWidgets />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    centerContainer: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: 1250, // Max width for the whole 3-column app
    },
    sidebarContainer: {
        flex: 1,
        minWidth: 250,
        maxWidth: 275,
    },
    sidebarTablet: {
        minWidth: 80,
        maxWidth: 80,
    },
    contentArea: {
        flex: 2,
        minWidth: 600,
        maxWidth: 600,
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    widgetsContainer: {
        flex: 1.5,
        minWidth: 350,
    },
});
