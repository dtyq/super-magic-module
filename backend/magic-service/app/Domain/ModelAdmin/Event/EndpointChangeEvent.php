<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Event;

use App\Infrastructure\Core\HighAvailability\Entity\EndpointEntity;

class EndpointChangeEvent
{
    /**
     * @param EndpointEntity[] $endpointEntities
     */
    public function __construct(
        public array $endpointEntities,
        public bool $isDelete = false,
    ) {
    }
}
