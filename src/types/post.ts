
import { Poll } from "@/types/poll";
import { User } from "@/types/user";

export type ReactionAction = 'LIKE' | 'DISLIKE' | 'LAUGH' | 'NONE';

export type Author = Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'is_suspended' | 'is_shadow_banned' | 'is_limited' | 'is_verified' | 'verification_type' | 'official_logo' | 'authority_end'>;

export type Media = {
  type: 'image' | 'video';
  url: string;
};

export type Comment = {
  userReaction: ReactionAction;
  likeCount: number;
  dislikeCount: number;
  laughCount: number;
  repostCount: number;
  commentCount: number;
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  comments?: Comment[];
  media?: Media[];
  parentPostId?: string;
  repostedPostId?: string;
  isReposted?: boolean;
  isBookmarked?: boolean;
};

export type Post = {
  id: string;
  author: Author;
  content: string;
  type: 'original' | 'repost' | 'quote' | 'reply';
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  dislikeCount: number;
  laughCount: number;
  repostCount: number;
  commentCount: number;
  userReaction: ReactionAction;
  repostedBy?: Author;
  isReposted?: boolean;
  quotedPost?: Post;
  repostedPost?: Post;
  poll?: Poll;
  comments?: Comment[];
  media?: Media[];
  parentPostId?: string;
  quotedPostId?: string;
  repostedPostId?: string;
  visibility?: 'public' | 'followers' | 'private';
  isBookmarked?: boolean;
};

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'MISINFORMATION' | 'OTHER';

export type FeedPost = Post;
