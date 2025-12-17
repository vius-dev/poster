
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/theme';

interface ProfileStatsProps {
  postCount: number;
  followingCount: number;
  followerCount: number;
  onFollowingPress: () => void;
  onFollowersPress: () => void;
  onPostsPress?: () => void;
  activeTab?: string;
}

export default function ProfileStats({
  postCount,
  followingCount,
  followerCount,
  onFollowingPress,
  onFollowersPress,
  onPostsPress,
  activeTab,
}: ProfileStatsProps) {
  const { theme } = useTheme();

  const isPostsActive = activeTab === 'Posts';
  const isFollowingActive = activeTab === 'Following';
  const isFollowersActive = activeTab === 'Followers';

  return (
    <View style={[styles.container, { borderColor: theme.borderLight, borderTopWidth: 1, borderBottomWidth: 1 }]}>
      <TouchableOpacity
        style={[styles.stat, isPostsActive && { borderBottomWidth: 2, borderBottomColor: theme.primary }]}
        onPress={onPostsPress}
      >
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{postCount}</Text>
        <Text style={[styles.statLabel, { color: isPostsActive ? theme.primary : theme.textTertiary }]}>Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.stat, isFollowingActive && { borderBottomWidth: 2, borderBottomColor: theme.primary }]}
        onPress={onFollowingPress}
      >
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followingCount}</Text>
        <Text style={[styles.statLabel, { color: isFollowingActive ? theme.primary : theme.textTertiary }]}>Following</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.stat, isFollowersActive && { borderBottomWidth: 2, borderBottomColor: theme.primary }]}
        onPress={onFollowersPress}
      >
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{followerCount}</Text>
        <Text style={[styles.statLabel, { color: isFollowersActive ? theme.primary : theme.textTertiary }]}>Followers</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E1E8ED',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});
