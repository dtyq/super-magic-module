<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\RecycleBin\Enum;

enum RestoreConflictType: string
{
    case ParentMissing = 'parent_missing';
    case NameConflict = 'name_conflict';
}
