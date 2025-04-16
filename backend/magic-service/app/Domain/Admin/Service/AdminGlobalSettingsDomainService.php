<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Admin\Service;

use App\Domain\Admin\Entity\AdminGlobalSettingsEntity;
use App\Domain\Admin\Entity\ValueObject\AdminGlobalSettingsStatus;
use App\Domain\Admin\Entity\ValueObject\AdminGlobalSettingsType;
use App\Domain\Admin\Repository\Facade\AdminGlobalSettingsRepositoryInterface;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;

readonly class AdminGlobalSettingsDomainService
{
    public function __construct(
        private AdminGlobalSettingsRepositoryInterface $globalSettingsRepository
    ) {
    }

    public function getSettingsByType(AdminGlobalSettingsType $type, DataIsolation $dataIsolation): AdminGlobalSettingsEntity
    {
        $settings = $this->globalSettingsRepository->getSettingsByTypeAndOrganization(
            $type,
            $dataIsolation->getCurrentOrganizationCode()
        );

        if ($settings === null) {
            // 创建默认设置
            $settings = $this->globalSettingsRepository->updateSettings(
                (new AdminGlobalSettingsEntity())
                    ->setType($type)
                    ->setOrganization($dataIsolation->getCurrentOrganizationCode())
                    ->setStatus(AdminGlobalSettingsStatus::DISABLED)
            );
        }

        return $settings;
    }

    public function updateSettings(
        AdminGlobalSettingsEntity $settings,
        DataIsolation $dataIsolation
    ): AdminGlobalSettingsEntity {
        $settings->setOrganization($dataIsolation->getCurrentOrganizationCode());
        return $this->globalSettingsRepository->updateSettings($settings);
    }
}
