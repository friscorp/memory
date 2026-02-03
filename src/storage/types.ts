// Storage layer type definitions

export interface StoredSession {
    session_id: string;
    state_json: string;
    created_at: string;
    updated_at: string;
}

export interface StoredEvent {
    id: number;
    session_id: string;
    type: string;
    payload_json: string;
    created_at: string;
}

export interface StoredArtifact {
    artifact_id: string;
    session_id: string;
    kind: string;
    source: string;
    version_hash: string;
    content: string;
    meta_json: string | null;
    pinned: boolean;
    created_at: string;
}

export interface Store {
    // Initialize database
    init(): void;

    // Session operations
    getSession(sessionId: string): StoredSession | null;
    upsertSession(sessionId: string, stateJson: string): void;

    // Event operations
    appendEvent(sessionId: string, type: string, payload: Record<string, any>): number;
    listRecentEvents(sessionId: string, types?: string[], limit?: number): StoredEvent[];

    // Artifact operations
    putArtifact(
        sessionId: string,
        kind: string,
        source: string,
        versionHash: string,
        content: string,
        meta?: Record<string, any>,
        pinned?: boolean
    ): string;
    listRecentArtifacts(sessionId: string, kinds?: string[], limit?: number): StoredArtifact[];

    // Cleanup
    close(): void;
}
