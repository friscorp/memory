// Git diff ingestion helper

import type { Store } from '../storage/types.js';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

export interface IngestGitDiffOptions {
    sessionId: string;
    repoPath: string;
}

export function ingestGitDiff(store: Store, options: IngestGitDiffOptions): string | null {
    try {
        // Execute git diff command (best effort)
        const diff = execSync('git diff HEAD', {
            cwd: options.repoPath,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024, // 10MB limit
            stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
        });

        if (!diff.trim()) {
            // No changes to record
            return null;
        }

        // Create artifact with diff content
        const versionHash = createHash('sha256').update(diff).digest('hex').slice(0, 16);

        const artifactId = store.putArtifact(
            options.sessionId,
            'repo_diff',
            options.repoPath,
            versionHash,
            diff,
            {
                timestamp: new Date().toISOString()
            }
        );

        // Also record as event
        store.appendEvent(options.sessionId, 'repo_diff', {
            artifactId,
            repoPath: options.repoPath,
            versionHash
        });

        return artifactId;
    } catch (error) {
        // Git command failed - not a git repo or other error
        // Return null to indicate no diff captured
        return null;
    }
}
