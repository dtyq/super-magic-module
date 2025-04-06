<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\KkOpenPlatform\Contacts\Service;

use Dtyq\MagicEnterprise\Infrastructure\Util\KkOpenPlatform\Contacts\DTO\QueryDepartmentsDTO;
use Dtyq\MagicEnterprise\Infrastructure\Util\KkOpenPlatform\Contacts\Service\TeamshareContactsService;
use Dtyq\MagicEnterprise\Infrastructure\Util\KkOpenPlatform\Token\Service\TokenService;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class ContactsServiceTest extends TestCase
{
    public function testQueryPartnerGroups()
    {
        $this->markTestSkipped('获取部门查询相关的调用案例');
        $contactsService = make(TeamshareContactsService::class);
        $tokenService = make(TokenService::class);

        $kkOpenPlatformConfig = config('teamshare_open_platform_sdk');

        $account = $kkOpenPlatformConfig['accounts']['magic'];

        $appAccessToken = $tokenService->generateAppAccessToken($account['client_id'], $account['client_secret']);
        $appStoreTenantAccessToken = $tokenService->generateAppStoreTenantAccessToken($appAccessToken->getAuthorization(), 'DT001');
        $queryDepartmentsDTO = new QueryDepartmentsDTO(
            [
                'page_size' => 100,
                'page_token' => $pageToken,
                'authorization' => $appStoreTenantAccessToken->getAuthorization(),
                'department_id' => '0',
                'fetch_child' => false,
            ]
        );
        $contactsService->queryChildDepartmentsByDepartmentId($queryDepartmentsDTO);
    }
}
