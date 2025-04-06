<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Agent\Factory;

use App\Domain\Agent\Entity\MagicAgentEntity;
use App\Domain\Agent\Repository\Persistence\Model\MagicAgentModel;

class MagicAgentFactory
{
    public static function modelToEntity(MagicAgentModel $model): MagicAgentEntity
    {
        $entityArray = $model->toArray();
        $magicAgentEntity = new MagicAgentEntity($entityArray);
        $magicAgentEntity->setAgentDescription($magicAgentEntity->getRobotDescription());
        $magicAgentEntity->setAgentVersionId($magicAgentEntity->getBotVersionId());
        $magicAgentEntity->setAgentAvatar($magicAgentEntity->getRobotAvatar());
        $magicAgentEntity->setAgentName($magicAgentEntity->getRobotName());
        if (isset($entityArray['last_version_info'])) {
            $lastVersionInfo = $magicAgentEntity->getLastVersionInfo();
            $lastVersionInfo['agent_id'] = $lastVersionInfo['root_id'];
            $lastVersionInfo['agent_name'] = $lastVersionInfo['robot_name'];
            $lastVersionInfo['agent_description'] = $lastVersionInfo['robot_description'];
            $lastVersionInfo['agent_avatar'] = $lastVersionInfo['robot_avatar'];
            $magicAgentEntity->setLastVersionInfo($lastVersionInfo);
        }

        return $magicAgentEntity;
    }

    public static function toEntity(array $bot): MagicAgentEntity
    {
        $magicAgentEntity = new MagicAgentEntity($bot);
        $magicAgentEntity->setAgentVersionId($magicAgentEntity->getBotVersionId());
        $magicAgentEntity->setAgentAvatar($magicAgentEntity->getRobotAvatar());
        $magicAgentEntity->setAgentName($magicAgentEntity->getRobotName());
        $magicAgentEntity->setAgentDescription($magicAgentEntity->getRobotDescription());
        if (isset($bot['last_version_info'])) {
            $lastVersionInfo = $magicAgentEntity->getLastVersionInfo();
            $lastVersionInfo['agent_id'] = $lastVersionInfo['root_id'];
            $lastVersionInfo['agent_name'] = $lastVersionInfo['robot_name'];
            $lastVersionInfo['agent_description'] = $lastVersionInfo['robot_description'];
            $lastVersionInfo['agent_avatar'] = $lastVersionInfo['robot_avatar'];
            $magicAgentEntity->setLastVersionInfo($lastVersionInfo);
        }
        return $magicAgentEntity;
    }

    public static function toEntities(array $bots): array
    {
        if (empty($bots)) {
            return [];
        }
        $botEntities = [];
        foreach ($bots as $bot) {
            $botEntities[] = self::toEntity((array) $bot);
        }
        return $botEntities;
    }

    /**
     * @param $botEntities MagicAgentEntity[]
     */
    public static function toArrays(array $botEntities): array
    {
        if (empty($botEntities)) {
            return [];
        }
        $result = [];
        foreach ($botEntities as $entity) {
            $result[] = $entity->toArray();
        }
        return $result;
    }
}
