<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Event;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFileVO;

class KnowledgeBaseDocumentSavedEvent
{
    private bool $isSync = false;

    public function __construct(
        public KnowledgeBaseEntity $knowledgeBaseEntity,
        public KnowledgeBaseDocumentEntity $knowledgeBaseDocumentEntity,
        public bool $create,
        public ?DocumentFileVO $documentFile = null,
    ) {
    }

    public function isSync(): bool
    {
        return $this->isSync;
    }

    public function setIsSync(bool $isSync): void
    {
        $this->isSync = $isSync;
    }
}
