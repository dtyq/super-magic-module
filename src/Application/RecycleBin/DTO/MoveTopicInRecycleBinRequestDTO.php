<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use App\Infrastructure\Core\AbstractRequestDTO;

use function Hyperf\Translation\trans;

/**
 * 回收站话题移动请求 DTO.
 */
class MoveTopicInRecycleBinRequestDTO extends AbstractRequestDTO
{
    protected string $sourceTopicId = '';

    protected string $targetProjectId = '';

    public function getSourceTopicId(): int
    {
        return (int) $this->sourceTopicId;
    }

    public function getTargetProjectId(): int
    {
        return (int) $this->targetProjectId;
    }

    protected static function getHyperfValidationRules(): array
    {
        return [
            'source_topic_id' => 'required|numeric',
            'target_project_id' => 'required|numeric',
        ];
    }

    protected static function getHyperfValidationMessage(): array
    {
        return [
            'source_topic_id.required' => trans('recycle_bin.validation.source_topic_id_required'),
            'source_topic_id.numeric' => trans('recycle_bin.validation.source_topic_id_numeric'),
            'target_project_id.required' => trans('recycle_bin.validation.target_project_id_required'),
            'target_project_id.numeric' => trans('recycle_bin.validation.target_project_id_numeric'),
        ];
    }
}
