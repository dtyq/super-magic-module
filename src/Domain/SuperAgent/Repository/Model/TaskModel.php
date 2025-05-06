<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Model;

use App\Infrastructure\Core\AbstractModel;
use Hyperf\Database\Model\SoftDeletes;

/**
 * 任务模型.
 */
class TaskModel extends AbstractModel
{
    use SoftDeletes;

    /**
     * 表名.
     */
    protected ?string $table = 'magic_super_agent_task';

    /**
     * 主键.
     */
    protected string $primaryKey = 'id';

    /**
     * 可填充字段.
     */
    protected array $fillable = [
        'id',
        'user_id',
        'workspace_id',
        'topic_id',
        'task_id',
        'sandbox_id',
        'prompt',
        'attachments',
        'task_status',
        'work_dir',
        'task_mode',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * 日期字段.
     */
    protected array $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}
