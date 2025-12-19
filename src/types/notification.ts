
import { User } from "./user";
import { Post } from "./post";

export type NotificationType = 'MENTION' | 'REPLY' | 'REACTION' | 'REPOST' | 'QUOTE' | 'FOLLOW' | 'COMMENT' | 'MESSAGE';

export interface Notification {
    id: string;
    type: NotificationType;
    actor: User;
    recipientId: string;
    postId?: string;
    postSnippet?: string;
    createdAt: string;
    isRead: boolean;
}
