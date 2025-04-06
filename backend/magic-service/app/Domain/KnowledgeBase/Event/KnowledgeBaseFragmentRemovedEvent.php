<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Event;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;

class KnowledgeBaseFragmentRemovedEvent
{
    public function __construct(
        public KnowledgeBaseEntity $magicFlowKnowledgeEntity,
        public KnowledgeBaseFragmentEntity $magicFlowKnowledgeFragmentEntity,
    ) {
    }
}
