<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Model;

use Hyperf\Database\Model\Model;
use Hyperf\Database\Model\SoftDeletes;
use Hyperf\Snowflake\Concern\Snowflake;

class ServiceProviderModel extends Model
{
    use Snowflake;
    use SoftDeletes;

    protected ?string $table = 'service_provider';

    protected array $fillable = [
        'id',
        'name',
        'remark',
        'provider_code',
        'description',
        'icon',
        'provider_type',
        'category',
        'status',
        'translate',
        'is_models_enable',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected array $casts = [
        'type' => 'integer',
        'status' => 'integer',
    ];
}
