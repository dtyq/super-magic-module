<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Event;

/**
 * 删除事件来源.
 */
enum DeleteEventSource: string
{
    case User = 'user';
    case Agent = 'agent';
    case InternalOverwrite = 'internal_overwrite';
    case SystemSync = 'system_sync';
}
