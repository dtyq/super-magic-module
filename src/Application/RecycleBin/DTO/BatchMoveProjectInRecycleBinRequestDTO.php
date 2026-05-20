<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use App\Infrastructure\Core\AbstractRequestDTO;

use function Hyperf\Translation\trans;

/**
 * 批量移动回收站项目请求 DTO.
 *
 * 参考现有 BatchMoveProjectsRequestDTO 设计.
 */
class BatchMoveProjectInRecycleBinRequestDTO extends AbstractRequestDTO
{
    /**
     * 项目ID数组（字段名与现有批量接口保持一致）.
     */
    public array $projectIds = [];

    /**
     * 目标工作区ID（空字符串表示"无工作区"）.
     */
    public string $targetWorkspaceId = '';

    /**
     * 获取项目ID数组.
     *
     * @return array<string> 返回字符串数组（雪花ID保持字符串）
     */
    public function getProjectIds(): array
    {
        return $this->projectIds;
    }

    /**
     * 获取整型项目ID数组（供内部使用）.
     *
     * @return array<int>
     */
    public function getProjectIdsAsInt(): array
    {
        return array_map('intval', $this->projectIds);
    }

    /**
     * 获取目标工作区ID.
     */
    public function getTargetWorkspaceId(): ?int
    {
        if ($this->targetWorkspaceId === '') {
            return null;
        }
        return (int) $this->targetWorkspaceId;
    }

    /**
     * 检查是否移动到"无工作区".
     */
    public function isMovingToNoWorkspace(): bool
    {
        return $this->targetWorkspaceId === '';
    }

    /**
     * 获取验证规则.
     */
    protected static function getHyperfValidationRules(): array
    {
        return [
            'project_ids' => 'required|array|min:1|max:20',
            'project_ids.*' => 'required|string',
            'target_workspace_id' => 'present|string|max:64',
        ];
    }

    /**
     * 获取自定义错误消息.
     */
    protected static function getHyperfValidationMessage(): array
    {
        return [
            'project_ids.required' => trans('recycle_bin.validation.project_ids_required'),
            'project_ids.array' => trans('recycle_bin.validation.project_ids_array'),
            'project_ids.min' => trans('recycle_bin.validation.project_ids_min'),
            'project_ids.max' => trans('recycle_bin.validation.project_ids_max'),
            'project_ids.*.required' => trans('recycle_bin.validation.project_id_required'),
            'project_ids.*.string' => trans('recycle_bin.validation.project_id_string'),
            'target_workspace_id.present' => trans('recycle_bin.validation.target_workspace_id_present'),
            'target_workspace_id.string' => trans('recycle_bin.validation.target_workspace_id_string'),
            'target_workspace_id.max' => trans('recycle_bin.validation.target_workspace_id_max'),
        ];
    }
}
