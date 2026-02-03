// Generic event ingestion

import type { Store } from '../storage/types.js';
import type { Event, ArtifactKind } from '../runtime/types.js';
import crypto from 'crypto';

const ARTIFACT_EVENT_TYPES: Set<string> = new Set(['repo_diff', 'snippet', 'doc_chunk', 'tool_output']);

export function ingestEvent(store: Store, sessionId: string, event: Event): void {
    // Validate event type
    const validTypes = [
        'user_message',
        'repo_diff',
        'snippet',
        'doc_chunk',
        'tool_output',
        'assistant_response'
    ];

    if (!validTypes.includes(event.type)) {
        throw new Error(`Invalid event type: ${event.type}`);
    }

    // Store event in database
    store.appendEvent(sessionId, event.type, event.payload);

    // For certain event types, also create artifacts if payload contains content
    if (ARTIFACT_EVENT_TYPES.has(event.type) && event.payload.content) {
        const kind = event.type as ArtifactKind;
        const source = event.payload.source || event.payload.path || 'unknown';
        const versionHash = event.payload.versionHash || generateHash(event.payload.content);
        const content = event.payload.content;
        const pinned = event.payload.pinned === true;

        // Extract metadata (everything except content, versionHash, pinned)
        const { content: _, versionHash: __, pinned: ___, ...meta } = event.payload;

        store.putArtifact(
            sessionId,
            kind,
            source,
            versionHash,
            content,
            Object.keys(meta).length > 0 ? meta : undefined,
            pinned
        );
    }
}

function generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}
