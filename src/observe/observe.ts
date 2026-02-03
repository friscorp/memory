// Observe assistant response and update state

import type { Store } from '../storage/types.js';
import type { SessionState, ObserveInput } from '../runtime/types.js';
import { extractStructuredUpdates } from './extract.js';

export function observe(
    store: Store,
    sessionId: string,
    input: ObserveInput
): void {
    // Append assistant_response event
    store.appendEvent(sessionId, 'assistant_response', {
        text: input.assistantText,
        timestamp: new Date().toISOString()
    });

    // Extract structured updates
    const updates = extractStructuredUpdates(input.assistantText);

    // Load current session state
    const session = store.getSession(sessionId);
    if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
    }

    const currentState: SessionState = JSON.parse(session.state_json);

    // Apply updates with deduplication
    const newState = { ...currentState };

    // Add constraints (deduplicate by exact text match)
    if (updates.constraints.length > 0) {
        const existingConstraints = new Set(newState.constraints);
        for (const constraint of updates.constraints) {
            if (!existingConstraints.has(constraint)) {
                newState.constraints.push(constraint);
            }
        }
    }

    // Add decisions (always append - they have unique IDs)
    if (updates.decisions.length > 0) {
        newState.decisions = [...newState.decisions, ...updates.decisions];
    }

    // Add open threads (always append - they have unique IDs)
    if (updates.openThreads.length > 0) {
        newState.openThreads = [...newState.openThreads, ...updates.openThreads];
    }

    // Add glossary entries (deduplicate by term)
    if (updates.glossary.length > 0) {
        const existingTerms = new Map(newState.glossary.map(e => [e.term.toLowerCase(), e]));
        for (const entry of updates.glossary) {
            const termLower = entry.term.toLowerCase();
            if (!existingTerms.has(termLower)) {
                newState.glossary.push(entry);
            } else {
                // Update definition if term already exists
                const existing = existingTerms.get(termLower)!;
                existing.definition = entry.definition;
            }
        }
    }

    // Store updated state
    store.upsertSession(sessionId, JSON.stringify(newState));
}
