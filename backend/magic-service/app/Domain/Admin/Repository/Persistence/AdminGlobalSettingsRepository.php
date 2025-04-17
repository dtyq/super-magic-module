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
use Hyperf\DbConnection\Db;

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

    /**
     * @param AdminGlobalSettingsType[] $types
     * @return AdminGlobalSettingsEntity[]
     */
    public function getSettingsByTypesAndOrganization(array $types, string $organization): array
    {
        $typeValues = array_map(fn ($type) => $type->value, $types);
        $query = AdminGlobalSettingsModel::query()
            ->whereIn('type', $typeValues)
            ->where('organization', $organization);

        $models = Db::select($query->toSql(), $query->getBindings());

        $settings = [];
        foreach ($models as $model) {
            $settings[] = new AdminGlobalSettingsEntity($model);
        }

        return $settings;
    }

    /**
     * @param AdminGlobalSettingsEntity[] $entities
     * @return AdminGlobalSettingsEntity[]
     */
    public function updateSettingsBatch(array $entities): array
    {
        if (empty($entities)) {
            return [];
        }

        // 准备批量更新的数据
        $values = array_map(function ($entity) {
            return [
                'type' => $entity->getType()->value,
                'organization' => $entity->getOrganization(),
                'status' => $entity->getStatus()->value,
                'extra' => $entity->getExtra()?->toJsonString(),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
        }, $entities);

        // 一次性更新或创建所有记录
        AdminGlobalSettingsModel::query()->upsert(
            $values,
            ['type', 'organization'],
            ['status', 'extra', 'updated_at']
        );

        // 获取更新后的记录
        $typeValues = array_map(fn ($entity) => $entity->getType()->value, $entities);
        $organization = $entities[0]->getOrganization();

        $query = AdminGlobalSettingsModel::query()
            ->whereIn('type', $typeValues)
            ->where('organization', $organization);

        $models = Db::select($query->toSql(), $query->getBindings());

        return array_map(fn ($model) => new AdminGlobalSettingsEntity($model), $models);
    }
}
