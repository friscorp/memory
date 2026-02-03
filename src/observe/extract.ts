// Conservative extraction from assistant text

import type { Decision, OpenThread, GlossaryEntry } from '../runtime/types.js';
import { randomUUID } from 'crypto';

export interface ExtractedUpdates {
    constraints: string[];
    decisions: Decision[];
    openThreads: OpenThread[];
    glossary: GlossaryEntry[];
}

export function extractStructuredUpdates(text: string): ExtractedUpdates {
    const updates: ExtractedUpdates = {
        constraints: [],
        decisions: [],
        openThreads: [],
        glossary: []
    };

    // Parse lines for structured markers (conservative)
    const lines = text.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Decision: <text>
        if (trimmed.startsWith('Decision:')) {
            const decisionText = trimmed.slice('Decision:'.length).trim();
            if (decisionText) {
                updates.decisions.push({
                    id: randomUUID(),
                    text: decisionText,
                    evidenceRefs: [],
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Constraint: <text>
        if (trimmed.startsWith('Constraint:')) {
            const constraintText = trimmed.slice('Constraint:'.length).trim();
            if (constraintText) {
                updates.constraints.push(constraintText);
            }
        }

        // Open: <question>
        if (trimmed.startsWith('Open:')) {
            const question = trimmed.slice('Open:'.length).trim();
            if (question) {
                updates.openThreads.push({
                    id: randomUUID(),
                    question,
                    createdAt: new Date().toISOString()
                });
            }
        }

        // Glossary: term - definition
        if (trimmed.startsWith('Glossary:')) {
            const entry = trimmed.slice('Glossary:'.length).trim();
            const dashIndex = entry.indexOf(' - ');
            if (dashIndex > 0) {
                const term = entry.slice(0, dashIndex).trim();
                const definition = entry.slice(dashIndex + 3).trim();
                if (term && definition) {
                    updates.glossary.push({ term, definition });
                }
            }
        }
    }

    return updates;
}
