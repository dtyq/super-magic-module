<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use App\Infrastructure\Core\AbstractRequestDTO;

use function Hyperf\Translation\trans;

/**
 * 回收站批量话题移动请求 DTO.
 */
class BatchMoveTopicsInRecycleBinRequestDTO extends AbstractRequestDTO
{
    protected array $topicIds = [];

    protected string $targetProjectId = '';

    public function getTopicIds(): array
    {
        return $this->topicIds;
    }

    public function getTargetProjectId(): int
    {
        return (int) $this->targetProjectId;
    }

    protected static function getHyperfValidationRules(): array
    {
        return [
            'topic_ids' => 'required|array|min:1|max:50',
            'topic_ids.*' => 'required|numeric',
            'target_project_id' => 'required|numeric',
        ];
    }

    protected static function getHyperfValidationMessage(): array
    {
        return [
            'topic_ids.required' => trans('recycle_bin.validation.topic_ids_required'),
            'topic_ids.array' => trans('recycle_bin.validation.topic_ids_array'),
            'topic_ids.min' => trans('recycle_bin.validation.topic_ids_min'),
            'topic_ids.max' => trans('recycle_bin.validation.topic_ids_max'),
            'topic_ids.*.required' => trans('recycle_bin.validation.topic_id_required'),
            'topic_ids.*.numeric' => trans('recycle_bin.validation.topic_id_numeric'),
            'target_project_id.required' => trans('recycle_bin.validation.target_project_id_required'),
            'target_project_id.numeric' => trans('recycle_bin.validation.target_project_id_numeric'),
        ];
    }
}
