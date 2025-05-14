<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response;

use App\Infrastructure\Core\AbstractDTO;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WorkspaceEntity;

class WorkspaceItemDTO extends AbstractDTO
{
    /**
     * 工作区ID.
     */
    public string $id;

    /**
     * 会话ID.
     */
    public string $conversationId;

    /**
     * 工作区名称.
     */
    public string $name;

    /**
     * 是否归档 0否 1是.
     */
    public int $isArchived;

    /**
     * 当前话题ID.
     */
    public ?string $currentTopicId;

    /**
     * 状态 0:正常 1:不显示 2:删除.
     */
    public int $status;

    /**
     * 话题列表.
     *
     * @var TopicItemDTO[]
     */
    public array $topics = [];

    /**
     * 从实体创建DTO.
     *
     * @param WorkspaceEntity $entity 工作区实体
     * @param array $topics 话题列表
     */
    public static function fromEntity(WorkspaceEntity $entity, array $topics = []): self
    {
        $dto = new self();
        $dto->id = (string) $entity->getId();
        $dto->conversationId = $entity->getChatConversationId();
        $dto->name = $entity->getName();
        $dto->isArchived = $entity->getIsArchived();
        $dto->currentTopicId = $entity->getCurrentTopicId() ? (string) $entity->getCurrentTopicId() : null;
        $dto->status = $entity->getStatus();

        // 设置话题列表
        foreach ($topics as $topic) {
            if ($topic instanceof TopicEntity) {
                $dto->topics[] = TopicItemDTO::fromEntity($topic);
            } elseif (is_array($topic)) {
                $dto->topics[] = TopicItemDTO::fromArray($topic);
            }
        }

        return $dto;
    }

    /**
     * 从数组创建DTO.
     *
     * @param array $data 工作区数据
     * @param array $topics 话题列表
     */
    public static function fromArray(array $data, array $topics = []): self
    {
        $dto = new self();
        $dto->id = (string) $data['id'];
        $dto->conversationId = $data['conversation_id'];
        $dto->name = $data['name'];
        $dto->isArchived = $data['is_archived'];
        $dto->currentTopicId = $data['current_topic_id'] ? (string) $data['current_topic_id'] : null;
        $dto->status = $data['status'];

        // 设置话题列表
        foreach ($topics as $topic) {
            if ($topic instanceof TopicEntity) {
                $dto->topics[] = TopicItemDTO::fromEntity($topic);
            } elseif (is_array($topic)) {
                $dto->topics[] = TopicItemDTO::fromArray($topic);
            }
        }

        return $dto;
    }
}
