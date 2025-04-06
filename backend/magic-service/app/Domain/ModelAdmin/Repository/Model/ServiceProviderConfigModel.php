<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Model;

use Hyperf\Database\Model\Model;
use Hyperf\Database\Model\SoftDeletes;
use Hyperf\Snowflake\Concern\Snowflake;

class ServiceProviderConfigModel extends Model
{
    use Snowflake;
    use SoftDeletes;

    protected ?string $table = 'service_provider_configs';

    protected array $fillable = [
        'id',
        'alias',
        'service_provider_id',
        'organization_code',
        'config',
        'status',
        'category',
        'translate',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected array $casts = [
        'service_provider_id' => 'integer',
        'config' => 'string',
        'status' => 'integer',
        'category' => 'string',
    ];
}
