
import { User } from './user';

export interface PostrList {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    isPrivate: boolean;
    memberIds: string[];
    subscriberIds: string[];
    banner?: string;
    createdAt: string;
}
