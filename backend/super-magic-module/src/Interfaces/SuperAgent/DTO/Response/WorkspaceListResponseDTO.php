<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response;

use App\Infrastructure\Core\AbstractDTO;

class WorkspaceListResponseDTO extends AbstractDTO
{
    /**
     * 总数.
     */
    public int $total = 0;

    /**
     * 是否自动创建的.
     */
    public bool $autoCreate = false;

    /**
     * 工作区列表.
     *
     * @var WorkspaceItemDTO[]
     */
    public array $list = [];

    /**
     * 从结果创建 DTO.
     *
     * @param array $result [total, list, topics, auto_create]
     */
    public static function fromResult(array $result): self
    {
        $dto = new self();
        $dto->total = $result['total'];
        $dto->autoCreate = $result['auto_create'] ?? false;

        foreach ($result['list'] as $index => $workspace) {
            $topics = [];
            $workspaceId = is_array($workspace) ? (string) $workspace['id'] : (string) $workspace->getId();

            // 获取该工作区对应的话题列表
            if (isset($result['topics']) && ! empty($result['topics'][$workspaceId])) {
                $topics = $result['topics'][$workspaceId];
            }

            if (is_array($workspace)) {
                $dto->list[] = WorkspaceItemDTO::fromArray($workspace, $topics);
            } else {
                $dto->list[] = WorkspaceItemDTO::fromEntity($workspace, $topics);
            }
        }

        return $dto;
    }

    /**
     * 转换为数组.
     * 输出保持下划线命名，以保持API兼容性.
     */
    public function toArray(): array
    {
        $workspaces = [];
        foreach ($this->list as $workspace) {
            $workspaces[] = $workspace->toArray();
        }

        return [
            'total' => $this->total,
            'auto_create' => $this->autoCreate,
            'list' => $workspaces,
        ];
    }
}
