import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeedList from '@/components/FeedList';
import FAB from '@/components/FAB';
import { Post } from '@/types/post';
import { useTheme } from '@/theme/theme';
import HomeHeader from '@/components/HomeHeader';
import { eventEmitter } from '@/lib/EventEmitter';
import { useResponsive } from '@/hooks/useResponsive';
import { getDb } from '@/lib/db/sqlite';
import { SyncEngine } from '@/lib/sync/SyncEngine';
import { api } from '@/lib/api';

const mapPoll = (jsonStr: string | null, userVoteIndex?: number | null) => {
  if (!jsonStr || jsonStr === 'null') return undefined;
  try {
    const data = JSON.parse(jsonStr);
    if (!data.choices) return undefined;

    return {
      question: data.question || '',
      choices: (data.choices || []).map((c: any) => ({
        text: c.text || c.label,
        color: c.color,
        vote_count: c.vote_count || 0
      })),
      expiresAt: data.expiresAt || data.expires_at || new Date(Date.now() + 86400000).toISOString(),
      totalVotes: data.totalVotes || data.total_votes || (data.choices ? data.choices.reduce((sum: number, c: any) => sum + (Number(c.vote_count) || 0), 0) : 0),
      userVoteIndex: userVoteIndex !== null && userVoteIndex !== undefined ? userVoteIndex : data.userVoteIndex
    };
  } catch (e) {
    console.warn('[Feed] Failed to parse poll_json', e);
    return undefined;
  }
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  const loadPosts = useCallback(async () => {
    try {
      const db = await getDb();
      const user = await api.getCurrentUser(); // Need current user for reactions
      const currentUserId = user?.id;

      const rows = await db.getAllAsync(`
        SELECT 
          p.*, 
          u.username, u.display_name, u.avatar_url, u.verified as is_verified,
          r.reaction_type as my_reaction,
          qp.id as quoted_post_id, qp.content as quoted_content, qp.type as quoted_type,
          qp.created_at as quoted_created_at, qp.updated_at as quoted_updated_at,
          qp.media_json as quoted_media_json, qp.poll_json as quoted_poll_json, qp.like_count as quoted_like_count,
          qp.reply_count as quoted_reply_count, qp.repost_count as quoted_repost_count,
          qu.id as quoted_author_id, qu.username as quoted_author_username,
          qu.display_name as quoted_author_name, qu.avatar_url as quoted_author_avatar,
          qu.verified as quoted_author_verified,
          rp.id as reposted_post_id, rp.content as reposted_content, rp.type as reposted_type,
          rp.created_at as reposted_created_at, rp.updated_at as reposted_updated_at,
          rp.media_json as reposted_media_json, rp.poll_json as reposted_poll_json, rp.like_count as reposted_like_count,
          rp.reply_count as reposted_reply_count, rp.repost_count as reposted_repost_count,
          ru.id as reposted_author_id, ru.username as reposted_author_username,
          ru.display_name as reposted_author_name, ru.avatar_url as reposted_author_avatar,
          ru.verified as reposted_author_verified,
          pv.choice_index as user_vote_index
        FROM feed_items f
        JOIN posts p ON f.post_id = p.id
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN reactions r ON p.id = r.post_id AND r.user_id = ?
        LEFT JOIN poll_votes pv ON p.id = pv.post_id AND pv.user_id = ?
        LEFT JOIN posts qp ON p.quoted_post_id = qp.id AND qp.deleted = 0
        LEFT JOIN users qu ON qp.owner_id = qu.id
        LEFT JOIN posts rp ON p.reposted_post_id = rp.id AND rp.deleted = 0
        LEFT JOIN users ru ON rp.owner_id = ru.id
        WHERE f.feed_type = 'home'
        ORDER BY f.rank_score DESC
        LIMIT 50
      `, [currentUserId || '', currentUserId || '']);

      // Debug: Log the first row to see what data we're getting
      if (rows.length > 0) {
        console.log('[FeedScreen] Sample row:', JSON.stringify(rows[0], null, 2));
      }

      const mappedPosts: Post[] = rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        type: row.type || 'original',
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
        author: {
          id: row.owner_id,
          username: row.username,
          name: row.display_name,
          avatar: row.avatar_url,
          is_verified: !!row.is_verified,
          is_suspended: false,
          is_shadow_banned: false,
          is_limited: false,
        },
        media: (row.media_json && row.media_json !== 'null') ? JSON.parse(row.media_json) : [],
        poll: mapPoll(row.poll_json, row.user_vote_index),
        likeCount: row.like_count || 0,
        commentCount: row.reply_count || 0,
        repostCount: row.repost_count || 0,
        dislikeCount: 0,
        laughCount: 0,
        userReaction: row.my_reaction || 'NONE',
        isBookmarked: false,
        quotedPostId: row.quoted_post_id || undefined,
        quotedPost: row.quoted_post_id ? {
          id: row.quoted_post_id,
          content: row.quoted_content,
          type: row.quoted_type || 'original',
          createdAt: new Date(row.quoted_created_at).toISOString(),
          updatedAt: row.quoted_updated_at ? new Date(row.quoted_updated_at).toISOString() : undefined,
          author: {
            id: row.quoted_author_id,
            username: row.quoted_author_username,
            name: row.quoted_author_name,
            avatar: row.quoted_author_avatar,
            is_verified: !!row.quoted_author_verified,
            is_suspended: false,
            is_shadow_banned: false,
            is_limited: false,
          },
          media: (row.quoted_media_json && row.quoted_media_json !== 'null') ? JSON.parse(row.quoted_media_json) : [],
          poll: mapPoll(row.quoted_poll_json),
          likeCount: row.quoted_like_count || 0,
          commentCount: row.quoted_reply_count || 0,
          repostCount: row.quoted_repost_count || 0,
          dislikeCount: 0,
          laughCount: 0,
          userReaction: 'NONE',
          isBookmarked: false,
        } : undefined,
        repostedPostId: row.reposted_post_id || undefined,
        repostedPost: row.reposted_post_id ? {
          id: row.reposted_post_id,
          content: row.reposted_content,
          type: row.reposted_type || 'original',
          createdAt: new Date(row.reposted_created_at).toISOString(),
          updatedAt: row.reposted_updated_at ? new Date(row.reposted_updated_at).toISOString() : undefined,
          author: {
            id: row.reposted_author_id,
            username: row.reposted_author_username,
            name: row.reposted_author_name,
            avatar: row.reposted_author_avatar,
            is_verified: !!row.reposted_author_verified,
            is_suspended: false,
            is_shadow_banned: false,
            is_limited: false,
          },
          media: (row.reposted_media_json && row.reposted_media_json !== 'null') ? JSON.parse(row.reposted_media_json) : [],
          poll: mapPoll(row.reposted_poll_json),
          likeCount: row.reposted_like_count || 0,
          commentCount: row.reposted_reply_count || 0,
          repostCount: row.reposted_repost_count || 0,
          dislikeCount: 0,
          laughCount: 0,
          userReaction: 'NONE',
          isBookmarked: false,
        } : undefined,
      }));

      setPosts(mappedPosts);
    } catch (e) {
      console.error('Failed to load posts from DB', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    const handleFeedUpdate = () => {
      loadPosts();
    };

    const handlePostDeleted = (deletedPostId: string) => {
      // Optimistic delete from UI
      setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
      // We should also delete from DB here or let SyncEngine handle it, 
      // but for immediate feedback we assume UI update is enough until next reload.
    };

    eventEmitter.on('feedUpdated', handleFeedUpdate);
    eventEmitter.on('postDeleted', handlePostDeleted);

    return () => {
      eventEmitter.off('feedUpdated', handleFeedUpdate);
      eventEmitter.off('postDeleted', handlePostDeleted);
    };
  }, [loadPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await SyncEngine.startSync();
    // feedUpdated event will trigger reload, but we also reload after await just in case
    loadPosts();
  };

  const handleLoadMore = () => {
    // Pagination todo: implement offset based on current posts length
  };

  const { isWeb } = useResponsive();
  const Container = isWeb ? View : SafeAreaView;

  return (
    <Container style={[styles.container, { backgroundColor: theme.background }]}>
      <HomeHeader />
      {loading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FeedList
          posts={posts}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          refreshing={refreshing}
        />
      )}
      <FAB />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
