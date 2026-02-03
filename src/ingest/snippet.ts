// Code snippet ingestion helper

import type { Store } from '../storage/types.js';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

export interface IngestSnippetOptions {
    sessionId: string;
    path: string;
    startLine: number;
    endLine: number;
    text?: string;
}

export function ingestSnippet(store: Store, options: IngestSnippetOptions): string {
    // Read snippet content (from text or file)
    let content: string;

    if (options.text) {
        content = options.text;
    } else {
        // Read from file and extract lines
        const fullText = readFileSync(options.path, 'utf-8');
        const lines = fullText.split('\n');
        const snippetLines = lines.slice(options.startLine - 1, options.endLine);
        content = snippetLines.join('\n');
    }

    // Create artifact with snippet
    const versionHash = createHash('sha256').update(content).digest('hex').slice(0, 16);

    const artifactId = store.putArtifact(
        options.sessionId,
        'snippet',
        options.path,
        versionHash,
        content,
        {
            path: options.path,
            startLine: options.startLine,
            endLine: options.endLine,
            timestamp: new Date().toISOString()
        }
    );

    // Also record as event
    store.appendEvent(options.sessionId, 'snippet', {
        artifactId,
        path: options.path,
        startLine: options.startLine,
        endLine: options.endLine,
        versionHash
    });

    return artifactId;
}
