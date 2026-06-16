<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Enum;

enum RestoreConflictResolution: string
{
    /** Restore to project root directory — for parent_missing only */
    case RestoreToRoot = 'restore_to_root';

    /** Soft-delete the conflicting file/directory (self only, no recursive) — for name_conflict only */
    case Overwrite = 'overwrite';

    /** Do not restore this resource — valid for both conflict types */
    case Skip = 'skip';

    public static function validForParentMissing(): array
    {
        return [self::RestoreToRoot, self::Skip];
    }

    public static function validForNameConflict(): array
    {
        return [self::Overwrite, self::Skip];
    }
}
