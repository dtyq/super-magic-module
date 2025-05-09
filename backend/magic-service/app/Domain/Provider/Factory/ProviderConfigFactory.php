<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Factory;

use App\Domain\Provider\Entity\ProviderConfigEntity;
use App\Domain\Provider\Entity\ValueObject\ProviderConfigVO;
use App\Domain\Provider\Entity\ValueObject\Status;
use App\Domain\Provider\Repository\Persistence\Model\ProviderConfigModel;
use DateTime;

class ProviderConfigFactory
{
    public static function createEntity(ProviderConfigModel $model): ProviderConfigEntity
    {
        $entity = new ProviderConfigEntity();
        $entity->setId($model->id);
        $entity->setProviderId($model->service_provider_id);
        $entity->setOrganizationCode($model->organization_code);
        // Model accessors handle encoding/decoding, so we can pass the raw config array
        $entity->setConfig(new ProviderConfigVO($model->config));
        $entity->setStatus(Status::from($model->status)); // Convert int to Enum
        $entity->setAlias($model->alias ?? ''); // Ensure non-null string
        $entity->setTranslate($model->translate ?? []); // Ensure non-null array
        $entity->setCreatedAt($model->created_at ?? new DateTime());
        $entity->setUpdatedAt($model->updated_at ?? new DateTime());

        return $entity;
    }
}
