
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface TrendItemProps {
    hashtag: string;
    count: number;
    rank: number;
}

export default function TrendItem({ hashtag, count, rank }: TrendItemProps) {
    const { theme } = useTheme();

    return (
        <TouchableOpacity style={[styles.container, { borderBottomColor: theme.border }]}>
            <View style={styles.header}>
                <Text style={[styles.rank, { color: theme.textTertiary }]}>{rank} · Trending</Text>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={16} color={theme.textTertiary} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.hashtag, { color: theme.textPrimary }]}>#{hashtag}</Text>
            <Text style={[styles.count, { color: theme.textTertiary }]}>{count} Posts</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    rank: {
        fontSize: 13,
    },
    hashtag: {
        fontSize: 15,
        fontWeight: 'bold',
        marginVertical: 2,
    },
    count: {
        fontSize: 13,
    },
});
