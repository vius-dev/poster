
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { SidebarItem } from './SidebarItem';
import { useAuthStore } from '@/state/auth';
import { useRouter } from 'expo-router';

interface MobileSidebarProps {
    onClose: () => void;
}

export const MobileSidebar = ({ onClose }: MobileSidebarProps) => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const router = useRouter();

    const username = user?.user_metadata?.username || 'devteam';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={32} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>
            <View style={styles.menuContainer}>
                <SidebarItem label="Home" icon="home" href="/" />
                <SidebarItem label="Explore" icon="search" href="/explore" />
                <SidebarItem label="Notifications" icon="notifications" href="/notifications" />
                <SidebarItem label="Messages" icon="mail" href="/messages" />
                <SidebarItem label="Shop" icon="cart" href="/shop" />
                <SidebarItem label="Bookmarks" icon="bookmark" href="/bookmarks" />
                <TouchableOpacity style={styles.userContainer} onPress={() => router.push(`/(profile)/${username}`)}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                        <Ionicons name="person" size={20} color={theme.textTertiary} />
                    </View>
                    <Text style={[styles.username, { color: theme.textPrimary }]}>{username}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '80%',
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
    },
    closeButton: {
        padding: 10,
    },
    menuContainer: {
        paddingHorizontal: 10,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        marginTop: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
