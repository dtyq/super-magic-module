<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\ModelAdmin\Repository\Model;

use Hyperf\Database\Model\Model;
use Hyperf\Database\Model\SoftDeletes;
use Hyperf\Snowflake\Concern\Snowflake;

class ServiceProviderOriginalModelsModel extends Model
{
    use Snowflake;
    use SoftDeletes;

    protected ?string $table = 'service_provider_original_models';

    protected array $fillable = [
        'id',
        'model_id',
        'type',
        'organization_code',
        'created_at',
        'updated_at',
        'deleted_at',
    ];
}
