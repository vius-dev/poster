import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Stack } from 'expo-router';
import { api } from '@/lib/api';
import { Session } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';

export default function SessionsScreen() {
    const { theme } = useTheme();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await api.getSessions();
            setSessions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Session }) => (
        <View style={[styles.sessionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.device, { color: theme.textPrimary }]}>{item.device}</Text>
                <Text style={[styles.location, { color: theme.textSecondary }]}>{item.location}</Text>
                <Text style={[styles.lastActive, { color: theme.textTertiary }]}>Last active: {item.last_active}</Text>
            </View>
            {item.is_current && (
                <Text style={[styles.current, { color: theme.primary }]}>Current</Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Apps and Sessions' }} />
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="apps-outline" size={40} color={theme.textTertiary} />
                            <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No active sessions found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sessionItem: {
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    device: {
        fontSize: 16,
        fontWeight: '600',
    },
    location: {
        fontSize: 14,
        marginVertical: 2,
    },
    lastActive: {
        fontSize: 12,
    },
    current: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
    }
});
