
import React, { useState, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, TouchableOpacity } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { WebHeader } from './WebHeader';
import { WebWidgets } from './WebWidgets';
import { useTheme } from '@/theme/theme';
import { MobileHeader } from './MobileHeader';
import { MobileSidebar } from './MobileSidebar';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
    const { isDesktop, showWidgets, isWeb, isHandset } = useResponsive();
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-width)).current;

    const isTwoColumn = isDesktop && showWidgets;

    const toggleSidebar = () => {
        if (isSidebarOpen) {
            Animated.timing(slideAnim, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setSidebarOpen(false));
        } else {
            setSidebarOpen(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    if (!isWeb) {
        return <>{children}</>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary }}>
            {isHandset ? (
                <MobileHeader onMenuPress={toggleSidebar} />
            ) : (
                <WebHeader />
            )}
            {isSidebarOpen && (
                <>
                    <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
                        <MobileSidebar onClose={toggleSidebar} />
                    </Animated.View>
                    <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} />
                </>
            )}
            <View style={styles.mainWrapper}>
                <View style={[styles.centerContainer, { maxWidth: isTwoColumn ? 1300 : 650 }]}>
                    {/* Main Content Area */}
                    <View style={[
                        styles.contentArea,
                        { backgroundColor: theme.background, borderRadius: isDesktop ? 20 : 0 }
                    ]}>
                        {children}
                    </View>

                    {/* Right Widgets */}
                    {isTwoColumn && (
                        <View style={styles.widgetsContainer}>
                            <WebWidgets />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    centerContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        gap: 25,
        paddingHorizontal: 20,
    },
    contentArea: {
        flex: 1,
        overflow: 'hidden',
    },
    widgetsContainer: {
        width: 350,
        paddingTop: 10,
    },
    sidebarContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '80%',
        zIndex: 1001,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
    },
});
