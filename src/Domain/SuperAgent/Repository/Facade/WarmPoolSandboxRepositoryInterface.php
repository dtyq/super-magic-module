<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WarmPoolSandboxEntity;

/**
 * Data-access facade for the warm-pool sandboxes table.
 *
 * Implementations must be safe to call from concurrent crontab workers
 * and request handlers — the `claimOneReady*` helper is expected to use
 * `SELECT ... FOR UPDATE SKIP LOCKED` so that two consumers never grab
 * the same row.
 */
interface WarmPoolSandboxRepositoryInterface
{
    /**
     * Persist a brand-new entry (status = creating) and return the saved
     * entity with its DB-assigned ID populated.
     */
    public function insert(WarmPoolSandboxEntity $entity): WarmPoolSandboxEntity;

    public function findById(int $id): ?WarmPoolSandboxEntity;

    public function findBySandboxId(string $sandboxId): ?WarmPoolSandboxEntity;

    /**
     * @return WarmPoolSandboxEntity[]
     */
    public function findExpired(string $now, int $limit = 100): array;

    /**
     * @param string[] $statuses
     * @return WarmPoolSandboxEntity[]
     */
    public function findByImageAndStatuses(string $agentImage, string $agfsImage, array $statuses, int $limit = 100): array;

    /**
     * Find ready/creating entries whose image generation is NOT the current
     * one — i.e. agent_image OR agfs_image differs from the given pair.
     *
     * @return WarmPoolSandboxEntity[]
     */
    public function findReadyExcludingImage(string $currentAgentImage, string $currentAgfsImage, int $limit = 100): array;

    public function countByImageAndStatuses(string $agentImage, string $agfsImage, array $statuses): int;

    /**
     * Atomically claim ONE `ready` row matching the given image generation
     * (agent_image AND agfs_image) and stamp status/bound_* columns to
     * `claimed`/<user>/<project>/<topic>. Uses `FOR UPDATE SKIP LOCKED` so
     * concurrent claimers don't collide.
     *
     * Returns the claimed entity (post-update) or null if none available.
     */
    public function claimOneReady(
        string $agentImage,
        string $agfsImage,
        string $userId,
        string $projectId,
        string $now,
        ?string $topicId = null
    ): ?WarmPoolSandboxEntity;

    public function updateStatus(int $id, string $status, ?string $deadReason = null): bool;

    /**
     * Atomically flip a pooled row (creating / ready / dead) to `dead` so it can
     * be safely evicted. Returns false when the row is no longer evictable —
     * most importantly when a concurrent user request has just claimed it — in
     * which case the caller must leave the underlying pod untouched.
     */
    public function markForEviction(int $id, string $reason): bool;

    /**
     * Flip a `creating` row to `ready`. Optionally records how long
     * (in milliseconds) provisioning took, and back-fills the gateway-issued
     * sandbox name / image generation now that the create call has returned.
     * The non-duration metadata is passed because the row is persisted
     * BEFORE the gateway call (record-ahead), so its name/image were only
     * provisional at insert time.
     */
    public function markReady(
        int $id,
        ?int $provisionDurationMs = null,
        ?string $sandboxName = null,
        ?string $agentImage = null,
        ?string $agfsImage = null
    ): bool;

    public function deleteById(int $id): bool;

    /**
     * Count rows currently in `$status` whose updated_at is at or after
     * `$since`. Used by the refill circuit breaker to size the recent
     * failure rate without keeping any out-of-band counter.
     */
    public function countByStatusUpdatedSince(string $status, string $since): int;

    /**
     * Return rows in `$status` whose updated_at is at or before
     * `$updatedBefore`, oldest first. Used by the error-pod cleanup pass to
     * reap leaked pods and GC their tombstone rows once they have aged past
     * the retention window (kept long enough for the circuit breaker to have
     * counted them).
     *
     * @return WarmPoolSandboxEntity[]
     */
    public function findByStatusUpdatedBefore(string $status, string $updatedBefore, int $limit = 100): array;

    /**
     * Return all sandbox rows still sitting in the pool (creating / ready / dead).
     * Claimed rows are excluded because they belong to active user sessions.
     *
     * @return WarmPoolSandboxEntity[]
     */
    public function findAllPooled(int $limit = 500): array;

    /**
     * Return ready rows to reconcile against the gateway, oldest first so the
     * reconciler naturally rotates through the pool tick by tick.
     *
     * @return WarmPoolSandboxEntity[]
     */
    public function findReadyForReconcile(int $limit = 100): array;

    /**
     * Return `claimed` rows bound at or before `$boundBefore`, oldest binding
     * first. The cutoff keeps freshly-claimed rows whose mount may still be
     * settling out of the reconciler's blast radius.
     *
     * @return WarmPoolSandboxEntity[]
     */
    public function findClaimedBefore(string $boundBefore, int $limit = 100): array;

    /**
     * Most recently observed agent_image stored in the warm pool. Used to
     * detect generation changes without an event bus.
     */
    public function findLatestAgentImage(): ?string;

    /**
     * Most recently observed agfs_image stored in the warm pool. Used to
     * detect generation changes without an event bus.
     */
    public function findLatestAgfsImage(): ?string;
}
