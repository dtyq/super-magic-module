<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Flow\Factory;

use App\Domain\Flow\Entity\MagicFlowToolSetEntity;
use App\Domain\Flow\Repository\Persistence\Model\MagicFlowToolSetModel;

class MagicFlowToolSetFactory
{
    public static function modelToEntity(MagicFlowToolSetModel $model): MagicFlowToolSetEntity
    {
        $array = $model->toArray();
        $entity = new MagicFlowToolSetEntity();
        $entity->setId($model->id);
        $entity->setOrganizationCode($model->organization_code);
        $entity->setCode($model->code);
        $entity->setName($model->name);
        $entity->setDescription($model->description);
        $entity->setIcon($model->icon);
        $entity->setEnabled($model->enabled);
        if (! empty($array['tools'])) {
            $entity->setTools($array['tools']);
        }
        $entity->setCreator($model->created_uid);
        $entity->setCreatedAt($model->created_at);
        $entity->setModifier($model->updated_uid);
        $entity->setUpdatedAt($model->updated_at);
        return $entity;
    }
}
