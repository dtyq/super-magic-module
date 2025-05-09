<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Factory;

use App\Domain\Provider\Entity\ProviderEntity;
use App\Domain\Provider\Entity\ValueObject\Category;
use App\Domain\Provider\Entity\ValueObject\ProviderCode;
use App\Domain\Provider\Entity\ValueObject\ProviderType;
use App\Domain\Provider\Entity\ValueObject\Status;
use App\Domain\Provider\Repository\Persistence\Model\ProviderModel;
use DateTime;

class ProviderFactory
{
    public static function createEntity(ProviderModel $model): ProviderEntity
    {
        $entity = new ProviderEntity();
        $entity->setId($model->id);
        $entity->setName($model->name);
        $entity->setProviderCode(ProviderCode::from($model->provider_code));
        $entity->setCategory(Category::from($model->category));
        $entity->setProviderType(ProviderType::from($model->provider_type));
        $entity->setStatus(Status::from($model->status));
        $entity->setDescription($model->description);
        $entity->setIcon($model->icon);
        $entity->setIsModelsEnable($model->is_models_enable);
        $entity->setTranslate($model->translate);
        $entity->setRemark($model->remark);
        $entity->setCreatedAt($model->created_at ?? new DateTime());
        $entity->setUpdatedAt($model->updated_at ?? new DateTime());

        return $entity;
    }
}
