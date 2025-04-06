<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\ModelGateway\Service;

use App\Application\Kernel\SuperPermissionEnum;
use App\Domain\ModelGateway\Entity\ModelConfigEntity;
use App\Domain\ModelGateway\Entity\ValueObject\Query\ModelConfigQuery;
use App\Infrastructure\Core\ValueObject\Page;
use Qbhy\HyperfAuth\Authenticatable;

class ModelConfigAppService extends AbstractLLMAppService
{
    public function save(Authenticatable $authorization, ModelConfigEntity $modelConfigEntity): ModelConfigEntity
    {
        $this->checkInternalWhite($authorization, SuperPermissionEnum::MODEL_CONFIG_ADMIN);
        return $this->modelConfigDomainService->save($this->createLLMDataIsolation($authorization), $modelConfigEntity);
    }

    public function show(Authenticatable $authorization, string $model): ModelConfigEntity
    {
        $this->checkInternalWhite($authorization, SuperPermissionEnum::MODEL_CONFIG_ADMIN);
        return $this->modelConfigDomainService->show($this->createLLMDataIsolation($authorization), $model);
    }

    /**
     * 根据ID获取模型配置.
     */
    public function showById(Authenticatable $authorization, string $id): ModelConfigEntity
    {
        $this->checkInternalWhite($authorization, SuperPermissionEnum::MODEL_CONFIG_ADMIN);
        return $this->modelConfigDomainService->showById($id);
    }

    /**
     * @return ModelConfigEntity[]
     */
    public function queries(Authenticatable $authorization, ModelConfigQuery $query): array
    {
        $this->checkInternalWhite($authorization, SuperPermissionEnum::MODEL_CONFIG_ADMIN);
        return $this->modelConfigDomainService->queries($this->createLLMDataIsolation($authorization), Page::createNoPage(), $query)['list'];
    }

    public function enabledModels(Authenticatable $authorization): array
    {
        $query = new ModelConfigQuery();
        $query->setEnabled(true);
        $data = $this->modelConfigDomainService->queries($this->createLLMDataIsolation($authorization), Page::createNoPage(), $query);

        return array_map(function (ModelConfigEntity $modelConfigEntity) {
            return $modelConfigEntity->getModel();
        }, $data['list']);
    }
}
