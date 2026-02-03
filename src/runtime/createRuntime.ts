// Runtime factory function

import type { Runtime, RuntimeOptions } from './types.js';
import { Session } from './session.js';
import { createSqliteStore } from '../storage/sqliteStore.js';

export function createRuntime(options: RuntimeOptions = {}): Runtime {
    const storagePath = options.storagePath || './.memory-runtime/runtime.sqlite';
    const stablePrefix = options.stablePrefix;

    // Initialize SQLite store
    const store = createSqliteStore(storagePath);

    return {
        session(sessionId: string): Session {
            return new Session(store, sessionId, stablePrefix);
        }
    };
}
