// Evidence selection logic with deterministic strategy

import type { Store, StoredArtifact } from '../storage/types.js';
import type { SessionState } from '../runtime/types.js';

export interface EvidenceItem {
    artifact: StoredArtifact;
    priority: number;
    rationale: string;
}

export function selectEvidence(
    store: Store,
    sessionId: string,
    userMessage: string,
    state: SessionState
): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    // 1. Recent repo_diff artifacts (highest priority)
    const repoDiffs = store.listRecentArtifacts(sessionId, ['repo_diff'], 5);
    for (const artifact of repoDiffs) {
        evidence.push({
            artifact,
            priority: 100,
            rationale: 'Recent repository changes'
        });
    }

    // 2. Relevant snippet artifacts based on workingSet and keyword match
    const snippets = store.listRecentArtifacts(sessionId, ['snippet'], 20);
    const workingSetPaths = state.workingSet?.paths || [];
    const userMessageLower = userMessage.toLowerCase();

    // Track artifact IDs to avoid duplicates
    const seenArtifacts = new Set<string>();

    for (const artifact of snippets) {
        seenArtifacts.add(artifact.artifact_id);
        let priority = 50;
        let rationale = 'Code snippet';

        // Parse metadata to get path
        const meta = artifact.meta_json ? JSON.parse(artifact.meta_json) : {};
        const snippetPath = meta.path || artifact.source;

        // Boost priority if in working set
        if (workingSetPaths.some(wsPath => snippetPath.includes(wsPath))) {
            priority = 80;
            rationale = 'Snippet in working set';
        }

        // Boost priority if path/source matches keywords in user message
        const pathLower = snippetPath.toLowerCase();
        const pathParts = pathLower.split('/').filter((p: string) => p.length > 2);

        for (const part of pathParts) {
            if (userMessageLower.includes(part)) {
                priority = Math.max(priority, 70);
                rationale = 'Snippet matches user message keywords';
                break;
            }
        }

        // Pinned artifacts get highest priority
        if (artifact.pinned) {
            priority = 95;
            rationale = 'Pinned artifact - never drop';
        }

        evidence.push({
            artifact,
            priority,
            rationale
        });
    }

    // 2.5 Ensure ALL pinned snippets are included (even if outside top-20 recent)
    const allRecentSnippets = store.listRecentArtifacts(sessionId, ['snippet'], 100);
    for (const artifact of allRecentSnippets) {
        if (artifact.pinned && !seenArtifacts.has(artifact.artifact_id)) {
            seenArtifacts.add(artifact.artifact_id);
            evidence.push({
                artifact,
                priority: 95,
                rationale: 'Pinned artifact - never drop'
            });
        }
    }

    // 3. Other artifact types (doc_chunk, tool_output)
    const otherArtifacts = store.listRecentArtifacts(sessionId, ['doc_chunk', 'tool_output'], 10);
    for (const artifact of otherArtifacts) {
        evidence.push({
            artifact,
            priority: 40,
            rationale: `${artifact.kind} artifact`
        });
    }

    // Sort by priority (descending) then by recency (most recent first)
    evidence.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }
        // More recent artifacts first (created_at is ISO string, so lexicographic sort works)
        return b.artifact.created_at.localeCompare(a.artifact.created_at);
    });

    return evidence;
}
