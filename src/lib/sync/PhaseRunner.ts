import * as SQLite from 'expo-sqlite';

export interface SyncContext {
    db: SQLite.SQLiteDatabase;
    userId: string;
    now: number;
}

export interface SyncPhase {
    name: string;
    run(ctx: SyncContext): Promise<void>;
}

export class PhaseRunner {
    private running = false;
    private abortController: AbortController | null = null;

    async run(phases: SyncPhase[], ctx: SyncContext) {
        if (this.running) {
            // Prevent concurrent sync cycles
            console.log('[PhaseRunner] Sync cycle already running');
            return;
        }
        this.running = true;
        this.abortController = new AbortController();

        try {
            for (const phase of phases) {
                if (this.abortController.signal.aborted) {
                    console.log('[PhaseRunner] Sync cycle aborted');
                    break;
                }

                console.log(`[PhaseRunner] Running phase: ${phase.name}`);
                try {
                    await phase.run(ctx);
                } catch (phaseError) {
                    console.error(`[PhaseRunner] Phase ${phase.name} failed:`, phaseError);
                    // Continue to next phase
                }
            }
        } catch (e) {
            console.error('[PhaseRunner] Sync cycle failed', e);
            // We don't throw here to ensure finally block runs and prevents stuck state
        } finally {
            this.running = false;
            this.abortController = null;
        }
    }

    abort() {
        if (this.running && this.abortController) {
            this.abortController.abort();
            this.running = false;
        }
    }

    isRunning() {
        return this.running;
    }
}
