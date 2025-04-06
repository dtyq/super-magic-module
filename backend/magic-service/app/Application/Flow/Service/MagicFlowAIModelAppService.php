<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\Service;

use App\Application\ModelGateway\Mapper\ModelGatewayMapper;
use App\Domain\Flow\Entity\MagicFlowAIModelEntity;
use Hyperf\Odin\Model\AbstractModel;
use Qbhy\HyperfAuth\Authenticatable;

class MagicFlowAIModelAppService extends AbstractFlowAppService
{
    /**
     * @return array{total: int, list: array<MagicFlowAIModelEntity>}
     */
    public function getEnabled(Authenticatable $authorization): array
    {
        $dataIsolation = $this->createFlowDataIsolation($authorization);
        $mapper = di(ModelGatewayMapper::class);

        $list = [];
        $models = $mapper->getChatModels($dataIsolation->getCurrentOrganizationCode());
        /** @var AbstractModel $model */
        foreach ($models as $name => $model) {
            if ($model->getModelOptions()->isEmbedding()) {
                continue;
            }
            $attributes = $mapper->getAttributes($model->getModelName());

            $label = $attributes['label'] ?? $name;

            $modelEntity = new MagicFlowAIModelEntity();
            $modelEntity->setName($model->getModelName());
            $modelEntity->setModelName($model->getModelName());
            $modelEntity->setLabel((string) $label);
            $modelEntity->setIcon($attributes['icon'] ?? '');
            $modelEntity->setTags($attributes['tags'] ?? []);
            $modelEntity->setDefaultConfigs(['temperature' => 0.5]);
            $modelEntity->setSupportMultiModal($model->getModelOptions()->isMultiModal());
            $list[$modelEntity->getModelName()] = $modelEntity;
        }
        return [
            'total' => count($list),
            'list' => array_values($list),
        ];
    }
}
