// Session state management

import type { SessionState, Event, CompileOptions, CompileResult, ObserveInput, SnippetOptions } from './types.js';
import type { Store } from '../storage/types.js';
import { compile as compileContext } from '../compile/compiler.js';
import { observe as observeResponse } from '../observe/observe.js';
import { ingestEvent } from '../ingest/ingest.js';
import { ingestGitDiff as ingestGitDiffHelper } from '../ingest/gitDiff.js';
import { ingestSnippet as ingestSnippetHelper } from '../ingest/snippet.js';

export class Session {
    constructor(
        private store: Store,
        private sessionId: string,
        private stablePrefix?: string
    ) {
        // Ensure session exists in database
        this.ensureSession();
    }

    private ensureSession(): void {
        const existing = this.store.getSession(this.sessionId);
        if (!existing) {
            this.store.upsertSession(this.sessionId, JSON.stringify(this.getDefaultState()));
        }
    }

    getState(): SessionState {
        const session = this.store.getSession(this.sessionId);
        if (!session) {
            return this.getDefaultState();
        }
        return JSON.parse(session.state_json);
    }

    private getDefaultState(): SessionState {
        return {
            constraints: [],
            decisions: [],
            openThreads: [],
            glossary: [],
            workingSet: undefined
        };
    }

    ingest(event: Event): void {
        // Delegate to ingest pipeline
        ingestEvent(this.store, this.sessionId, event);
    }

    compile(options: CompileOptions): CompileResult {
        // Delegate to compile pipeline
        return compileContext(this.store, this.sessionId, options, this.stablePrefix);
    }

    observe(input: ObserveInput): void {
        // Delegate to observe pipeline
        observeResponse(this.store, this.sessionId, input);
    }

    ingestGitDiff(repoPath: string): string | null {
        return ingestGitDiffHelper(this.store, {
            sessionId: this.sessionId,
            repoPath
        });
    }

    ingestSnippet(options: SnippetOptions): string {
        return ingestSnippetHelper(this.store, {
            sessionId: this.sessionId,
            ...options
        });
    }
}
