<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Flow\Assembler\Knowledge;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\Flow\DTO\Knowledge\KnowledgeBaseDTO;
use App\Interfaces\Flow\DTO\Knowledge\MagicFlowKnowledgeListDTO;
use App\Interfaces\Kernel\Assembler\OperatorAssembler;
use App\Interfaces\Kernel\DTO\PageDTO;
use DateTime;

class MagicFlowKnowledgeAssembler
{
    public static function createDTO(KnowledgeBaseEntity $magicFlowKnowledgeEntity): KnowledgeBaseDTO
    {
        $dto = new KnowledgeBaseDTO();
        $dto->setId($magicFlowKnowledgeEntity->getCode());
        $dto->setName($magicFlowKnowledgeEntity->getName());
        $dto->setDescription($magicFlowKnowledgeEntity->getDescription());
        $dto->setType($magicFlowKnowledgeEntity->getType()->value);
        $dto->setEnabled($magicFlowKnowledgeEntity->isEnabled());
        $dto->setBusinessId($magicFlowKnowledgeEntity->getBusinessId());
        $dto->setSyncStatus($magicFlowKnowledgeEntity->getSyncStatus()->value);
        $dto->setSyncStatusMessage($magicFlowKnowledgeEntity->getSyncStatusMessage());
        $dto->setModel($magicFlowKnowledgeEntity->getModel());
        $dto->setVectorDB($magicFlowKnowledgeEntity->getVectorDB());
        $dto->setOrganizationCode($magicFlowKnowledgeEntity->getOrganizationCode());
        $dto->setCreator($magicFlowKnowledgeEntity->getCreator());
        $dto->setCreatedAt($magicFlowKnowledgeEntity->getCreatedAt());
        $dto->setModifier($magicFlowKnowledgeEntity->getModifier());
        $dto->setUpdatedAt($magicFlowKnowledgeEntity->getUpdatedAt());

        $dto->setFragmentCount($magicFlowKnowledgeEntity->getFragmentCount());
        $dto->setExpectedCount($magicFlowKnowledgeEntity->getExpectedCount());
        $dto->setCompletedCount($magicFlowKnowledgeEntity->getCompletedCount());
        $dto->setUserOperation($magicFlowKnowledgeEntity->getUserOperation());
        $dto->setExpectedNum($magicFlowKnowledgeEntity->getExpectedNum());
        $dto->setCompletedNum($magicFlowKnowledgeEntity->getCompletedNum());

        return $dto;
    }

    public static function creatDO(KnowledgeBaseDTO $dto): KnowledgeBaseEntity
    {
        $magicFlowKnowledgeEntity = new KnowledgeBaseEntity();
        $magicFlowKnowledgeEntity->setCode($dto->getId());
        $magicFlowKnowledgeEntity->setName($dto->getName());
        $magicFlowKnowledgeEntity->setDescription($dto->getDescription());
        $type = KnowledgeType::tryFrom($dto->getType());
        if ($type) {
            $magicFlowKnowledgeEntity->setType($type);
        }
        $magicFlowKnowledgeEntity->setEnabled($dto->isEnabled());
        $magicFlowKnowledgeEntity->setModel($dto->getModel());
        $magicFlowKnowledgeEntity->setVectorDB($dto->getVectorDB());
        $magicFlowKnowledgeEntity->setBusinessId($dto->getBusinessId());
        $magicFlowKnowledgeEntity->setCreatedAt(new DateTime());
        $magicFlowKnowledgeEntity->setExpectedNum($dto->getExpectedNum());
        $magicFlowKnowledgeEntity->setCompletedNum($dto->getCompletedNum());
        return $magicFlowKnowledgeEntity;
    }

    /**
     * @param array<KnowledgeBaseEntity> $list
     */
    public static function createPageListDTO(int $total, array $list, Page $page, array $users): PageDTO
    {
        $list = array_map(fn (KnowledgeBaseEntity $entity) => self::createListDTO($entity, $users), $list);
        return new PageDTO($page->getPage(), $total, $list);
    }

    protected static function createListDTO(KnowledgeBaseEntity $magicFlowKnowledgeEntity, array $users): MagicFlowKnowledgeListDTO
    {
        $listDTO = new MagicFlowKnowledgeListDTO($magicFlowKnowledgeEntity->toArray());
        $listDTO->setId($magicFlowKnowledgeEntity->getCode());
        $listDTO->setCreator($magicFlowKnowledgeEntity->getCreator());
        $listDTO->setCreatedAt($magicFlowKnowledgeEntity->getCreatedAt());
        $listDTO->setModifier($magicFlowKnowledgeEntity->getModifier());
        $listDTO->setUpdatedAt($magicFlowKnowledgeEntity->getUpdatedAt());
        $listDTO->setCreatorInfo(OperatorAssembler::createOperatorDTOByUserEntity($users[$magicFlowKnowledgeEntity->getCreator()] ?? null, $magicFlowKnowledgeEntity->getCreatedAt()));
        $listDTO->setModifierInfo(OperatorAssembler::createOperatorDTOByUserEntity($users[$magicFlowKnowledgeEntity->getModifier()] ?? null, $magicFlowKnowledgeEntity->getUpdatedAt()));
        $listDTO->setUserOperation($magicFlowKnowledgeEntity->getUserOperation());
        $listDTO->setExpectedNum($magicFlowKnowledgeEntity->getExpectedNum());
        $listDTO->setCompletedNum($magicFlowKnowledgeEntity->getCompletedNum());
        return $listDTO;
    }
}
