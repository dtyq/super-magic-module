<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Admin\Repository\Persistence;

use App\Domain\Admin\Entity\AdminGlobalSettingsEntity;
use App\Domain\Admin\Entity\ValueObject\AdminGlobalSettingsType;
use App\Domain\Admin\Repository\Facade\AdminGlobalSettingsRepositoryInterface;
use App\Domain\Admin\Repository\Persistence\Model\AdminGlobalSettingsModel;

class AdminGlobalSettingsRepository implements AdminGlobalSettingsRepositoryInterface
{
    public function getSettingsByTypeAndOrganization(AdminGlobalSettingsType $type, string $organization): ?AdminGlobalSettingsEntity
    {
        $model = AdminGlobalSettingsModel::query()
            ->where('type', $type->value)
            ->where('organization', $organization)
            ->first();

        return $model ? new AdminGlobalSettingsEntity($model->toArray()) : null;
    }

    public function updateSettings(AdminGlobalSettingsEntity $entity): AdminGlobalSettingsEntity
    {
        $model = AdminGlobalSettingsModel::query()->updateOrCreate(
            [
                'type' => $entity->getType()->value,
                'organization' => $entity->getOrganization(),
            ],
            [
                'status' => $entity->getStatus()->value,
                'extra' => $entity->getExtra()?->jsonSerialize(),
            ]
        );

        return new AdminGlobalSettingsEntity($model->toArray());
    }
}
