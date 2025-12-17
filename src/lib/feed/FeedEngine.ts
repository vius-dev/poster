
import { Post } from "@/types/post";

export interface FeedEngineOptions {
    fetchAuthorTimeline: (authorId: string) => Promise<Post[]>;
    getFollowedAuthorIds: (userId: string) => Promise<string[]>;
}

export interface FeedRequest {
    userId: string;
    cursor?: { timestamp: string; lastId: string };
    pageSize: number;
    depth: number; // Page number essentially
}

export interface FeedResponse {
    posts: Post[];
    nextCursor?: { timestamp: string; lastId: string };
    degradationLevel: number;
}

export class FeedEngine {
    private options: FeedEngineOptions;
    private timelineCache = new Map<string, { posts: Post[]; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly CACHE_MAX_POSTS = 100;

    constructor(options: FeedEngineOptions) {
        this.options = options;
    }

    /**
     * Main entry point for fetching a feed page.
     */
    async fetchFeed(request: FeedRequest): Promise<FeedResponse> {
        const degradationLevel = this.calculateDegradationLevel(request.depth);
        const killSwitchActive = this.isKillSwitchActive();

        // 1. Get authors to fetch
        const followedIds = await this.options.getFollowedAuthorIds(request.userId);

        // 2. Adjust candidate set based on degradation
        const candidateIds = this.applyDegradationToAuthors(followedIds, degradationLevel, killSwitchActive);

        // 3. Retrieve timelines (from cache or source)
        const timelines = await Promise.all(
            candidateIds.map(id => this.getAuthorTimeline(id, degradationLevel))
        );

        // 4. Merge engine (Fan-out-on-read)
        const mergedPosts = this.mergeTimelines(timelines, request.pageSize, request.cursor);

        // 5. Build next cursor
        const nextCursor = this.buildCursor(mergedPosts, request.pageSize);

        return {
            posts: mergedPosts.slice(0, request.pageSize),
            nextCursor,
            degradationLevel,
        };
    }

    private async getAuthorTimeline(authorId: string, degradationLevel: number): Promise<Post[]> {
        const cached = this.timelineCache.get(authorId);
        const now = Date.now();

        if (cached && (now - cached.timestamp < this.CACHE_TTL)) {
            console.log(`[FeedEngine] Cache HIT for author: ${authorId}`);
            return cached.posts;
        }

        console.log(`[FeedEngine] Cache MISS for author: ${authorId}`);
        const posts = await this.options.fetchAuthorTimeline(authorId);

        // Store in cache (sorted reverse-chrono)
        const sorted = [...posts].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, this.CACHE_MAX_POSTS);

        this.timelineCache.set(authorId, {
            posts: sorted,
            timestamp: now
        });

        return sorted;
    }

    private mergeTimelines(timelines: Post[][], pageSize: number, cursor?: { timestamp: string; lastId: string }): Post[] {
        // Flatten and filter by cursor
        let allCandidates = timelines.flat();

        if (cursor) {
            const cursorTime = new Date(cursor.timestamp).getTime();
            allCandidates = allCandidates.filter(post => {
                const postTime = new Date(post.createdAt).getTime();
                if (postTime < cursorTime) return true;
                if (postTime === cursorTime && post.id < cursor.lastId) return true;
                return false;
            });
        }

        // Sort globally
        return allCandidates.sort((a, b) => {
            const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (timeDiff !== 0) return timeDiff;
            return b.id.localeCompare(a.id); // Tie-breaker
        });
    }

    private calculateDegradationLevel(depth: number): number {
        if (depth <= 3) return 0; // Full fidelity
        if (depth <= 6) return 1; // Partial degradation
        return 2; // High degradation
    }

    private isKillSwitchActive(): boolean {
        // In a real app, this would check a central policy service
        return false;
    }

    private applyDegradationToAuthors(authorIds: string[], level: number, killSwitch: boolean): string[] {
        if (killSwitch) return authorIds.slice(0, 10); // Extreme limit
        if (level === 2) return authorIds.slice(0, 50); // High degradation limit
        return authorIds;
    }

    private buildCursor(posts: Post[], pageSize: number): FeedResponse['nextCursor'] {
        if (posts.length <= pageSize) return undefined;
        const lastPost = posts[pageSize - 1];
        return {
            timestamp: lastPost.createdAt,
            lastId: lastPost.id
        };
    }

    // Cleanup/Eviction logic could be added here
    invalidateCache(authorId?: string) {
        if (authorId) {
            this.timelineCache.delete(authorId);
        } else {
            this.timelineCache.clear();
        }
    }
}
