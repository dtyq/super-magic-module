<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use App\Infrastructure\Core\AbstractDTO;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\WorkspaceArchiveStatus;
use Hyperf\HttpServer\Contract\RequestInterface;

class WorkspaceListRequestDTO extends AbstractDTO
{
    /**
     * 是否归档 0否 1是.
     */
    public ?int $isArchived = null;

    /**
     * 页码
     */
    public int $page = 1;

    /**
     * 每页数量.
     */
    public int $pageSize = 10;

    /**
     * 从请求中创建DTO.
     */
    public static function fromRequest(RequestInterface $request): self
    {
        $dto = new self();
        $dto->isArchived = $request->has('is_archived')
            ? (int) $request->input('is_archived')
            : WorkspaceArchiveStatus::NotArchived->value;
        $dto->page = (int) ($request->input('page', 1) ?: 1);
        $dto->pageSize = (int) ($request->input('page_size', 10) ?: 10);

        return $dto;
    }

    /**
     * 构建查询条件.
     */
    public function buildConditions(): array
    {
        $conditions = [];

        if ($this->isArchived !== null) {
            $conditions['is_archived'] = $this->isArchived;
        } else {
            // 默认归档
            $conditions['is_archived'] = WorkspaceArchiveStatus::NotArchived->value;
        }

        return $conditions;
    }
}
