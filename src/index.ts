// Main public API exports for memory-runtime

export { createRuntime } from './runtime/createRuntime.js';
export { ingestGitDiff } from './ingest/gitDiff.js';
export { ingestSnippet } from './ingest/snippet.js';
export type {
    Runtime,
    RuntimeOptions,
    Session,
    SessionState,
    Event,
    EventType,
    ArtifactKind,
    CompileOptions,
    CompileResult,
    ObserveInput,
    SnippetOptions,
    Decision,
    OpenThread,
    GlossaryEntry,
    WorkingSet
} from './runtime/types.js';
export type { IngestGitDiffOptions } from './ingest/gitDiff.js';
export type { IngestSnippetOptions } from './ingest/snippet.js';
