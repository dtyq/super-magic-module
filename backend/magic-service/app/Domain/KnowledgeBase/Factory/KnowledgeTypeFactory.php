<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Factory;

use App\Domain\KnowledgeBase\Entity\ValueObject\Interface\KnowledgeTypeFactoryInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;

class KnowledgeTypeFactory implements KnowledgeTypeFactoryInterface
{
    public function getQueryKnowledgeTypes(): array
    {
        return [KnowledgeType::UserKnowledgeBase->value];
    }
}
