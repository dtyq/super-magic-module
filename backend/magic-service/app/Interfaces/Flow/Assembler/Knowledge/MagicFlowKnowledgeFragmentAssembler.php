<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\Assembler\Knowledge;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\Kernel\DTO\PageDTO;
use App\Interfaces\KnowledgeBase\DTO\KnowledgeBaseFragmentDTO;
use DateTime;

class MagicFlowKnowledgeFragmentAssembler
{
    public static function createDTO(KnowledgeBaseFragmentEntity $entity): KnowledgeBaseFragmentDTO
    {
        $dto = new KnowledgeBaseFragmentDTO();
        $dto->setId((string) $entity->getId());
        $dto->setKnowledgeCode($entity->getKnowledgeCode());
        $dto->setContent($entity->getContent());
        $dto->setMetadata($entity->getMetadata());
        $dto->setBusinessId($entity->getBusinessId());
        $dto->setSyncStatus($entity->getSyncStatus()->value);
        $dto->setSyncStatusMessage($entity->getSyncStatusMessage());
        $dto->setCreator($entity->getCreator());
        $dto->setCreatedAt($entity->getCreatedAt()->format('Y-m-d H:i:s'));
        $dto->setModifier($entity->getModifier());
        $dto->setUpdatedAt($entity->getUpdatedAt()->format('Y-m-d H:i:s'));
        $dto->setScore($entity->getScore());
        return $dto;
    }

    public static function createDO(KnowledgeBaseFragmentDTO $dto): KnowledgeBaseFragmentEntity
    {
        $do = new KnowledgeBaseFragmentEntity();
        $do->setId((int) $dto->getId());
        $do->setKnowledgeCode($dto->getKnowledgeCode());
        $do->setContent($dto->getContent());
        $do->setMetadata($dto->getMetadata());
        $do->setBusinessId($dto->getBusinessId());
        $do->setCreatedAt(new DateTime());
        return $do;
    }

    public static function createPageListDTO(int $total, array $list, Page $page): PageDTO
    {
        $list = array_map(function (KnowledgeBaseFragmentEntity $entity) {
            return self::createDTO($entity);
        }, $list);
        return new PageDTO($page->getPage(), $total, $list);
    }
}
