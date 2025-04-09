<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Assembler;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use App\Interfaces\KnowledgeBase\DTO\KnowledgeBaseDocumentDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\CreateDocumentRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\UpdateDocumentRequestDTO;

class KnowledgeBaseDocumentAssembler
{
    public static function entityToDTO(KnowledgeBaseDocumentEntity $entity): KnowledgeBaseDocumentDTO
    {
        return new KnowledgeBaseDocumentDTO($entity->toArray());
    }

    /**
     * 从创建DTO创建实体.
     */
    public static function createDTOToEntity(CreateDocumentRequestDTO $dto, MagicUserAuthorization $auth): KnowledgeBaseDocumentEntity
    {
        $data = $dto->toArray();
        $data['created_uid'] = $auth->getId();
        $data['updated_uid'] = $auth->getId();
        $data['name'] = $dto->getDocumentFile()->getName();
        return new KnowledgeBaseDocumentEntity($data);
    }

    /**
     * 从更新DTO创建实体.
     */
    public static function updateDTOToEntity(UpdateDocumentRequestDTO $dto, MagicUserAuthorization $auth): KnowledgeBaseDocumentEntity
    {
        $data = $dto->toArray();
        $data['updated_uid'] = $auth->getId();
        return new KnowledgeBaseDocumentEntity($data);
    }
}
