<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\Service;

use App\Application\ModelGateway\Mapper\ModelGatewayMapper;
use App\Domain\Flow\Entity\MagicFlowAIModelEntity;
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
        foreach ($models as $odinModel) {
            if ($odinModel->getModel()->getModelOptions()->isEmbedding()) {
                continue;
            }

            $modelEntity = new MagicFlowAIModelEntity();
            $modelEntity->setName($odinModel->getAttributes()->getName());
            $modelEntity->setModelName($odinModel->getModel()->getModelName());
            $modelEntity->setLabel($odinModel->getAttributes()->getLabel() ?: $odinModel->getAttributes()->getName());
            $modelEntity->setIcon($odinModel->getAttributes()->getIcon());
            $modelEntity->setTags($odinModel->getAttributes()->getTags());
            $modelEntity->setDefaultConfigs(['temperature' => 0.5]);
            $modelEntity->setSupportMultiModal($odinModel->getModel()->getModelOptions()->isMultiModal());
            $list[$modelEntity->getModelName()] = $modelEntity;
        }
        return [
            'total' => count($list),
            'list' => array_values($list),
        ];
    }
}
