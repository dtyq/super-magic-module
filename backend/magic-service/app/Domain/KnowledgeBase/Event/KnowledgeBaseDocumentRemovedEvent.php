<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Event;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;

class KnowledgeBaseDocumentRemovedEvent
{
    public function __construct(
        public KnowledgeBaseDocumentEntity $knowledgeBaseDocumentEntity,
    ) {
    }
}
