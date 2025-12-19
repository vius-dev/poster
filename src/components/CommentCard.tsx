import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { Comment, ReactionAction } from '@/types/post';
import { useTheme } from '@/theme/theme';
import ReactionBar from './ReactionBar';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { timeAgo } from '@/utils/time';
import MediaGrid from './MediaGrid';
import { useRealtime } from '@/realtime/RealtimeContext';

const INDENT_UNIT = 16;
const MAX_INDENT_LEVEL = 4;

interface CommentCardProps {
  comment: Comment;
  indentationLevel: number;
}

const CommentCard = ({ comment: initialComment, indentationLevel }: CommentCardProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    counts,
    userReactions,
    userReposts,
    initializePost,
    toggleReaction,
    toggleRepost
  } = useRealtime();

  // Initialize comment state in context
  useEffect(() => {
    initializePost(initialComment.id, {
      likes: initialComment.likeCount,
      dislikes: initialComment.dislikeCount,
      laughs: initialComment.laughCount,
      reposts: initialComment.repostCount,
      comments: initialComment.commentCount,
      userReaction: initialComment.userReaction,
      isReposted: initialComment.isReposted || false,
      isBookmarked: initialComment.isBookmarked || false,
    });
  }, [initialComment.id]);

  const reaction = userReactions[initialComment.id] || initialComment.userReaction;
  const isReposted = userReposts[initialComment.id] ?? initialComment.isReposted;
  const currentCounts = counts[initialComment.id] || {
    likes: initialComment.likeCount,
    dislikes: initialComment.dislikeCount,
    laughs: initialComment.laughCount,
    reposts: initialComment.repostCount,
    comments: initialComment.commentCount,
  };

  const handleReaction = async (action: ReactionAction) => {
    try {
      await toggleReaction(initialComment.id, action);
    } catch (error) {
      console.error(`Failed to ${action} comment`, error);
    }
  };

  const handleCommentPress = () => {
    router.push({ pathname: '/(compose)/compose', params: { replyToId: initialComment.id, authorUsername: initialComment.author.username } });
  };

  const handleRepost = async () => {
    try {
      await toggleRepost(initialComment.id);
    } catch (error) {
      console.error('Failed to repost comment', error);
    }
  };

  const goToProfile = () => {
    router.push(`/(profile)/${initialComment.author.username}`);
  };


  const clampedIndentation = Math.min(indentationLevel, MAX_INDENT_LEVEL);
  const indentationStyle = {
    paddingLeft: clampedIndentation * INDENT_UNIT,
  };

  const goToPost = () => {
    router.push(`/post/${initialComment.id}`);
  };

  return (
    <View style={[styles.container, indentationStyle, { borderBottomColor: theme.borderLight }]}>
      {indentationLevel > 1 && (
        <View style={[styles.threadLine, { left: clampedIndentation * INDENT_UNIT + 20, backgroundColor: theme.border }]} />
      )}
      <TouchableOpacity onPress={goToProfile} activeOpacity={0.7}>
        <Image source={{ uri: initialComment.author.avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.contentContainer}>
        <View style={styles.authorContainer}>
          <TouchableOpacity onPress={goToProfile} activeOpacity={0.7} style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.textPrimary }]}>{initialComment.author.name}</Text>
            <Text style={[styles.authorUsername, { color: theme.textTertiary }]}>@{initialComment.author.username}</Text>
          </TouchableOpacity>
          <Text style={[styles.timestamp, { color: theme.textTertiary }]}>{timeAgo(initialComment.createdAt)}</Text>
        </View>
        <TouchableOpacity onPress={goToPost} activeOpacity={0.9}>
          <Text style={[styles.content, { color: theme.textPrimary }]}>{initialComment.content}</Text>
        </TouchableOpacity>
        {initialComment.media && initialComment.media.length > 0 && (
          <MediaGrid media={initialComment.media} onPress={goToPost} />
        )}
        <ReactionBar
          postId={initialComment.id}
          onComment={handleCommentPress}
          onRepost={handleRepost}
          onReaction={handleReaction}
          reaction={reaction}
          isReposted={isReposted}
          initialCounts={currentCounts}
        />
        {currentCounts.comments > 0 && (
          <TouchableOpacity onPress={goToPost} style={styles.viewRepliesContainer}>
            <Text style={[styles.viewRepliesText, { color: theme.link }]}>
              View {currentCounts.comments} {currentCounts.comments === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  threadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  authorUsername: {
  },
  timestamp: {
  },
  content: {
    marginTop: 5,
    lineHeight: 20,
  },
  viewRepliesContainer: {
    marginTop: 8,
    paddingLeft: 0,
  },
  viewRepliesText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CommentCard;
