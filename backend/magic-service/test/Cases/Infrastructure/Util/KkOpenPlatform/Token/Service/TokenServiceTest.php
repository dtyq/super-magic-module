<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\KkOpenPlatform\Token\Service;

use Dtyq\MagicEnterprise\Infrastructure\Util\KkOpenPlatform\Token\Entity\OpenPlatformConfigEntity;
use Dtyq\MagicEnterprise\Infrastructure\Util\KkOpenPlatform\Token\Service\TokenService;
use HyperfTest\Cases\BaseTest;

/**
 * @internal
 */
class TokenServiceTest extends BaseTest
{
    public function testGenerateAppAccessToken()
    {
        $tokenService = di(TokenService::class);
        $openPlatformConfigEntity = $this->createOpenPlatformConfigEntity();
        $tokenService->saveAppTicket(
            $openPlatformConfigEntity,
            'MkxFdEVSNmgwQWxaRjY3RTpXSDdOZmdXWDM0bVVhWnFEV2Y0bVl1cXhGaFhhWjZvS3dTaHU0cXNjQUNhN0pzWGo1NVFySkFFMXpFRjYycjBJdnZqeURkSkxNY3haeTFYTFFyY0VPZz09',
            7200
        );
        $accessToken = $tokenService->generateAppAccessToken($openPlatformConfigEntity);
        var_dump($accessToken->getAccessToken());
        $this->assertTrue(true);
    }

    public function testGenerateAppStoreTenantAccessToken()
    {
        $tokenService = di(TokenService::class);
        $storeTenantAccessToken = $tokenService->generateAppStoreTenantAccessToken($this->createOpenPlatformConfigEntity(), 'APP_OTk3OW5rc2I4amNiYzIxZjZtYjNzamNiOnNEWDNIZm8yMXZDY3l6MUM6MkcwbmFMNk03VFBHY3FvM3p3aFBBTkFuU0Rud0lObnF0S0R0WlZJSVFKRXBWOW12WllVVFFXNThSbFVRTk0rOCtuRTZwSmJpaDBlMVhMcC83QnpXOUpoRDVpdXRxRWFGd2VjQVlwVEhTQWFucEhwL0ZwU1FEcHNsOGxSaGQ5b0ZCWk16U2N6UHZRVExUaTE4OUpoZVV2UktmL3VPTkpkSWhFNDJUOVRkZ3RlSnJOYzdPNUJjSmg3RXMvdHNGOUhVV1BFbC9kamVSYXBUWXBFQ2NPVEdCRElMbEdqTXl1R1FrZEI0bGJLeEJKWTBVY1lGcmRTQ3ppcDcyWkJHOGhOek9pTkt1azAvem43c2k1ZTRWNEZWbHpKRnk0eXN4eXFHNGlQQ1EveHJ2b2dRNWF2UEVpUU1pdlE4RXpHQW96SEpDbXlsdDh3NlZzdTR6b0xyQkdzZlVQeHNuUHdnVG9SL3Z0YWd6alh2dlVFPQ==', 'DT001');
        var_dump($storeTenantAccessToken->getAccessToken());
        $this->assertTrue(true);
    }

    public function testGetUserAccessTokenPro()
    {
        $tokenService = di(TokenService::class);
        $openPlatformConfigEntity = $this->createOpenPlatformConfigEntity();
        $tokenService->getUserAccessTokenPro($openPlatformConfigEntity, '606446434040061952', 'DT001');
    }

    private function createOpenPlatformConfigEntity(): OpenPlatformConfigEntity
    {
        $openPlatformEntity = new OpenPlatformConfigEntity();
        $openPlatformEntity->setHost(\Hyperf\Support\env('KK_OPEN_PLATFORM_ADDRESS'));
        $openPlatformEntity->setAppId(\Hyperf\Support\env('KK_OPEN_PLATFORM_MAGIC_CLIENT_ID'));
        $openPlatformEntity->setAppSecret(\Hyperf\Support\env('KK_OPEN_PLATFORM_MAGIC_CLIENT_SECRET'));
        $openPlatformEntity->setOidcConfigConfiguration(\Hyperf\Support\env('KK_OPEN_PLATFORM_OIDC_CONFIG_CONFIGURATION'));
        $openPlatformEntity->setMagicEnvId('1');
        $openPlatformEntity->setMagicEnvRelationIds(['1']);
        return $openPlatformEntity;
    }
}
