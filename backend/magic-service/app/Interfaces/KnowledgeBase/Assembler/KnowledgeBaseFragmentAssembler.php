<?php

namespace App\Interfaces\KnowledgeBase\Assembler;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Interfaces\Flow\DTO\Knowledge\MagicFlowKnowledgeFragmentDTO;

class KnowledgeBaseFragmentAssembler
{
    public static function entityToDTO(KnowledgeBaseFragmentEntity $entity): MagicFlowKnowledgeFragmentDTO
    {
        $dto = new MagicFlowKnowledgeFragmentDTO($entity->toArray());
        $dto->setKnowledgeBaseCode($entity->getKnowledgeCode());
        unset($dto->knowledgeCode);
        return $dto;
    }
}