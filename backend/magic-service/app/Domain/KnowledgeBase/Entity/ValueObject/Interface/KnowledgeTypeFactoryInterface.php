<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject\Interface;

interface KnowledgeTypeFactoryInterface
{
    public function getQueryKnowledgeTypes(): array;
}
