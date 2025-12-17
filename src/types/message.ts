import { User } from "./user";

export interface Message {
    id: string;
    senderId: string;
    text: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    participants: User[];
    lastMessage?: Message;
    unreadCount: number;
}
