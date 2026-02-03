// Core type definitions for memory-runtime

export type EventType =
    | 'user_message'
    | 'repo_diff'
    | 'snippet'
    | 'doc_chunk'
    | 'tool_output'
    | 'assistant_response';

export type ArtifactKind =
    | 'repo_diff'
    | 'snippet'
    | 'doc_chunk'
    | 'tool_output';

export interface Event {
    type: EventType;
    payload: Record<string, any>;
}

export interface Decision {
    id: string;
    text: string;
    evidenceRefs: string[];
    createdAt: string;
}

export interface OpenThread {
    id: string;
    question: string;
    createdAt: string;
}

export interface GlossaryEntry {
    term: string;
    definition: string;
}

export interface WorkingSet {
    paths: string[];
}

export interface SessionState {
    constraints: string[];
    decisions: Decision[];
    openThreads: OpenThread[];
    glossary: GlossaryEntry[];
    workingSet?: WorkingSet;
}

export interface RuntimeOptions {
    storagePath?: string;
    stablePrefix?: string;
}

export interface CompileOptions {
    userMessage: string;
    budgetTokens: number;
    stablePrefix?: string;
}

export interface CompileResult {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    debug: {
        includedArtifacts: string[];
        droppedArtifacts: string[];
        tokenEstimate: number;
        rationale: string;
    };
}

export interface ObserveInput {
    assistantText: string;
}

export interface SnippetOptions {
    path: string;
    startLine: number;
    endLine: number;
    text?: string;
}

export interface Runtime {
    session(sessionId: string): Session;
}

export interface Session {
    ingest(event: Event): void;
    compile(options: CompileOptions): CompileResult;
    observe(input: ObserveInput): void;
    getState(): SessionState;
    ingestGitDiff(repoPath: string): string | null;
    ingestSnippet(options: SnippetOptions): string;
}
