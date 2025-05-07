<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Repository\Model;

use App\Infrastructure\Core\AbstractModel;
use Hyperf\Database\Model\SoftDeletes;

class TaskFileModel extends AbstractModel
{
    use SoftDeletes;

    protected ?string $table = 'magic_super_agent_task_files';

    protected string $primaryKey = 'file_id';

    /**
     * 可填充字段列表
     * 
     * @var array
     */
    protected array $fillable = [
        'file_id',
        'user_id',
        'organization_code',
        'topic_id',
        'task_id',
        'file_type',
        'file_name',
        'file_extension',
        'file_key',
        'file_size',
        'external_url',
        'menu',
        'storage_type', // 存储类型，由FileProcessAppService.processAttachmentsArray方法传入
        'created_at',
        'updated_at',
        'deleted_at',
    ];
    
    /**
     * 默认属性值
     * 
     * @var array
     */
    protected array $attributes = [
        'storage_type' => 'workspace', // 默认存储类型为workspace
    ];
}
