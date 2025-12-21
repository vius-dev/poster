
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { useRouter, usePathname } from 'expo-router';

interface SidebarItemProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    href: string;
    compact?: boolean;
}

export const SidebarItem = ({ label, icon, href, compact }: SidebarItemProps) => {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    // Check if current path matches href (Twitter pre-2023 style)
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <TouchableOpacity
            style={[
                styles.container,
                compact && styles.compactContainer
            ]}
            onPress={() => router.push(href as any)}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <Ionicons
                    name={isActive ? icon : `${icon}-outline` as any}
                    size={28}
                    color={isActive ? theme.primary : theme.textPrimary}
                />
                {!compact && (
                    <Text
                        style={[
                            styles.label,
                            { color: isActive ? theme.primary : theme.textPrimary },
                            isActive && styles.activeLabel
                        ]}
                    >
                        {label}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 30,
        marginVertical: 4,
        alignSelf: 'flex-start',
    },
    compactContainer: {
        alignSelf: 'center',
        paddingHorizontal: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    label: {
        fontSize: 19,
        marginRight: 10,
    },
    activeLabel: {
        fontWeight: 'bold',
    },
});
