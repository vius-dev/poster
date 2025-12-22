
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';
import { SidebarItem } from './SidebarItem';
import { useAuthStore } from '@/state/auth';
import { useRouter } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

export const WebHeader = () => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const router = useRouter();
    const { isHandset } = useResponsive();

    const username = user?.user_metadata?.username || 'devteam';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
            <View style={[styles.leftContainer, { gap: isHandset ? 2 : 10 }]}>
                <TouchableOpacity
                    style={styles.logoContainer}
                    onPress={() => router.push('/')}
                >
                    <Image source={require('../../../assets/images/logo.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
                </TouchableOpacity>
                <SidebarItem label="Home" icon="home" href="/" horizontal hideLabel={isHandset} />
                <SidebarItem label="Explore" icon="search" href="/explore" horizontal hideLabel={isHandset} />
                <SidebarItem label="Notifications" icon="notifications" href="/notifications" horizontal hideLabel={isHandset} />
                <SidebarItem label="Messages" icon="mail" href="/messages" horizontal hideLabel={isHandset} />
                <SidebarItem label="Shop" icon="cart" href="/shop" horizontal hideLabel={isHandset} />
                <SidebarItem label="Bookmarks" icon="bookmark" href="/bookmarks" horizontal hideLabel={isHandset} />
            </View>

            <View style={styles.rightContainer}>
                <TouchableOpacity
                    style={[
                        styles.postButton,
                        { backgroundColor: theme.primary },
                        isHandset && styles.postButtonCompact
                    ]}
                    onPress={() => router.push('/(compose)/compose')}
                >
                    {isHandset ? (
                        <Ionicons name="add" size={24} color={theme.textInverse} />
                    ) : (
                        <Text style={[styles.postButtonText, { color: theme.textInverse }]}>Post</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.userContainer} onPress={() => router.push(`/(profile)/${username}`)}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]}>
                            <Ionicons name="person" size={20} color={theme.textTertiary} />
                        </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoContainer: {
        paddingRight: 10,
    },
    postButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
    },
    postButtonCompact: {
        width: 50,
        height: 50,
        borderRadius: 25,
        paddingVertical: 0,
        paddingHorizontal: 0,
        justifyContent: 'center',
    },
    postButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    userContainer: {
        padding: 12,
        borderRadius: 35,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
