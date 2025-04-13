<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Assembler;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Interfaces\KnowledgeBase\DTO\KnowledgeBaseFragmentDTO;

class KnowledgeBaseFragmentAssembler
{
    public static function entityToDTO(KnowledgeBaseFragmentEntity $entity): KnowledgeBaseFragmentDTO
    {
        $dto = new KnowledgeBaseFragmentDTO($entity->toArray());
        $dto->setKnowledgeBaseCode($entity->getKnowledgeCode());
        unset($dto->knowledgeCode);
        return $dto;
    }

    public static function createListDTO()
    {
    }
}
