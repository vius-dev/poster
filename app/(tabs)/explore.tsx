
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import TrendItem from '@/components/TrendItem';
import PostCard from '@/components/PostCard';
import { Post } from '@/types/post';
import { User } from '@/types/user';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState<{ hashtag: string, count: number }[]>([]);
  const [searchResults, setSearchResults] = useState<{ posts: Post[], users: User[] }>({ posts: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    const data = await api.getTrends();
    setTrends(data);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsSearching(true);
      const results = await api.search(query);
      setSearchResults(results);
    } else {
      setIsSearching(false);
    }
  };

  const renderSearchResult = () => {
    if (searchResults.users.length === 0 && searchResults.posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No results for "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsScroll}>
        {searchResults.users.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>People</Text>
            {searchResults.users.map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.userItem}
                onPress={() => router.push(`/(profile)/${user.username}`)}
              >
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View>
                  <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.name}</Text>
                  <Text style={[styles.userHandle, { color: theme.textTertiary }]}>@{user.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {searchResults.posts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, paddingBottom: 10 }]}>Latest</Text>
            {searchResults.posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search Twitter"
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.settingsIcon}>
          <Ionicons name="settings-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {!isSearching ? (
        <FlatList
          data={trends}
          keyExtractor={(item) => item.hashtag}
          renderItem={({ item, index }) => (
            <TrendItem hashtag={item.hashtag} count={item.count} rank={index + 1} />
          )}
          ListHeaderComponent={
            <View style={[styles.trendsHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.trendsTitle, { color: theme.textPrimary }]}>Trends for you</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      ) : (
        renderSearchResult()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  settingsIcon: {
    marginLeft: 15,
  },
  trendsHeader: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsScroll: {
    flex: 1,
  },
  section: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  userHandle: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
  },
});
