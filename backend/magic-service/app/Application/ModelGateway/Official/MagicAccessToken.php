<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\ModelGateway\Official;

use App\Domain\ModelGateway\Entity\AccessTokenEntity;
use App\Domain\ModelGateway\Entity\ApplicationEntity;
use App\Domain\ModelGateway\Entity\ValueObject\AccessTokenType;
use App\Domain\ModelGateway\Entity\ValueObject\LLMDataIsolation;
use App\Domain\ModelGateway\Entity\ValueObject\ModelGatewayOfficialApp;
use App\Domain\ModelGateway\Service\AccessTokenDomainService;
use App\Domain\ModelGateway\Service\ApplicationDomainService;

class MagicAccessToken
{
    private const string ORG_CODE = 'DT001';

    public static function init(): void
    {
        if (defined('MAGIC_ACCESS_TOKEN')) {
            return;
        }

        // todo 因为后续使用的时候，组织错误是没关系，所以暂定使用 DT001 来代表官方应用
        $llmDataIsolation = new LLMDataIsolation(self::ORG_CODE, 'system');

        // 检查应用是否已经创建
        $applicationDomainService = di(ApplicationDomainService::class);
        $application = $applicationDomainService->getByCodeWithNull($llmDataIsolation, ModelGatewayOfficialApp::APP_CODE);
        if (! $application) {
            $application = new ApplicationEntity();
            $application->setCode(ModelGatewayOfficialApp::APP_CODE);
            $application->setName('灯塔引擎');
            $application->setDescription('灯塔引擎官方应用');
            $application->setOrganizationCode(self::ORG_CODE);
            $application->setCreator('system');
            $application = $applicationDomainService->save($llmDataIsolation, $application);
        }

        // 检查 access_token 是否创建
        $accessTokenDomainService = di(AccessTokenDomainService::class);
        $accessToken = $accessTokenDomainService->getByName($llmDataIsolation, $application->getCode());
        if (! $accessToken) {
            $accessToken = new AccessTokenEntity();
            $accessToken->setName($application->getCode());
            $accessToken->setType(AccessTokenType::Application);
            $accessToken->setRelationId((string) $application->getId());
            $accessToken->setOrganizationCode(self::ORG_CODE);
            $accessToken->setModels(['all']);
            $accessToken->setCreator('system');
            $accessToken = $accessTokenDomainService->save($llmDataIsolation, $accessToken);
        }

        define('MAGIC_ACCESS_TOKEN', $accessToken->getAccessToken());
    }
}
