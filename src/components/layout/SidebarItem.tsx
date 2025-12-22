
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { useRouter, usePathname } from 'expo-router';

interface SidebarItemProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    href: string;
    horizontal?: boolean;
    hideLabel?: boolean;
}

export const SidebarItem = ({ label, icon, href, horizontal, hideLabel }: SidebarItemProps) => {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <TouchableOpacity
            style={[
                styles.container,
                horizontal && styles.horizontalContainer,
                isActive && (horizontal ? { backgroundColor: theme.primary } : styles.activeVertical),
            ]}
            onPress={() => router.push(href as any)}
            activeOpacity={0.7}
        >
            <View style={[styles.content, horizontal && styles.horizontalContent]}>
                <Ionicons
                    name={isActive ? icon : `${icon}-outline` as any}
                    size={horizontal ? 24 : 28}
                    color={isActive ? (horizontal ? theme.textInverse : theme.primary) : theme.textPrimary}
                />
                {!hideLabel && (
                    <Text
                        style={[
                            styles.label,
                            horizontal && styles.horizontalLabel,
                            { color: isActive ? (horizontal ? theme.textInverse : theme.primary) : theme.textPrimary },
                            isActive && { fontWeight: 'bold' },
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
        paddingHorizontal: 20,
        borderRadius: 15,
        marginVertical: 4,
        alignSelf: 'center',
        width: '90%',
    },
    horizontalContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginVertical: 0,
        width: 'auto',
        borderRadius: 30,
    },
    activeVertical: {
        backgroundColor: '#E7F5FD',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    horizontalContent: {
        gap: 8,
    },
    label: {
        fontSize: 19,
        marginRight: 10,
    },
    horizontalLabel: {
        fontSize: 15,
        marginRight: 0,
    },
});
