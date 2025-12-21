
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { SidebarItem } from './SidebarItem';
import { useAuthStore } from '@/state/auth';
import { useRouter } from 'expo-router';

interface WebSidebarProps {
    compact?: boolean;
}

export const WebSidebar = ({ compact }: WebSidebarProps) => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const router = useRouter();

    const username = user?.user_metadata?.username || 'devteam';

    return (
        <View style={[styles.container, { borderRightColor: theme.border }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => router.push('/')}
                >
                    <Ionicons name="logo-twitter" size={32} color={theme.primary} />
                </TouchableOpacity>

                {/* Global Nav */}
                <SidebarItem label="Home" icon="home" href="/" compact={compact} />
                <SidebarItem label="Explore" icon="search" href="/explore" compact={compact} />
                <SidebarItem label="Notifications" icon="notifications" href="/notifications" compact={compact} />
                <SidebarItem label="Messages" icon="mail" href="/messages" compact={compact} />
                <SidebarItem label="Shop" icon="cart" href="/shop" compact={compact} />
                <SidebarItem label="Bookmarks" icon="bookmark" href="/bookmarks" compact={compact} />
                <SidebarItem label="Profile" icon="person" href={`/(profile)/${username}`} compact={compact} />

                {/* Post Button */}
                <TouchableOpacity
                    style={[
                        styles.postButton,
                        { backgroundColor: theme.primary },
                        compact && styles.postButtonCompact
                    ]}
                    onPress={() => router.push('/(compose)/compose')}
                >
                    {compact ? (
                        <Ionicons name="add" size={24} color="#FFF" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* User Mini Profile */}
            <TouchableOpacity style={styles.userContainer}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                        <Ionicons name="person" size={20} color={theme.textTertiary} />
                    </View>
                    {!compact && (
                        <View style={styles.userText}>
                            <Text style={[styles.userName, { color: theme.textPrimary }]} numberOfLines={1}>
                                {user?.user_metadata?.name || 'Dev Team'}
                            </Text>
                            <Text style={[styles.userHandle, { color: theme.textTertiary }]} numberOfLines={1}>
                                @{username}
                            </Text>
                        </View>
                    )}
                </View>
                {!compact && <Ionicons name="ellipsis-horizontal" size={18} color={theme.textPrimary} />}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    scrollContent: {
        alignItems: 'flex-start',
    },
    logoContainer: {
        padding: 12,
        marginBottom: 10,
        marginTop: 5,
        borderRadius: 30,
    },
    postButton: {
        width: '90%',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
        alignSelf: 'center',
    },
    postButtonCompact: {
        width: 50,
        height: 50,
        borderRadius: 25,
        paddingVertical: 0,
        justifyContent: 'center',
    },
    postButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 35,
        marginTop: 'auto',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userText: {
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    userHandle: {
        fontSize: 14,
    },
});
