<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject;

/**
 * Lifecycle states of a single sandbox sitting in the warm pool.
 */
enum WarmPoolSandboxStatus: string
{
    case Creating = 'creating';
    case Ready = 'ready';
    case Claimed = 'claimed';
    case Dead = 'dead';

    /**
     * Provisioning failed at create time (gateway returned an error or the
     * readiness probe timed out). Distinct from `dead`, which marks a row
     * that was once `ready`/`claimed` and whose pod later disappeared.
     *
     * An `error` row is BOTH a tombstone for the (possibly leaked) pod —
     * so the cleanup pass can reap it — AND the signal the refill circuit
     * breaker counts to decide whether the cluster is too unhealthy to keep
     * creating sandboxes.
     */
    case Error = 'error';

    public static function isClaimable(string $status): bool
    {
        return $status === self::Ready->value;
    }
}
