<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Auth\Permission;

class Permission implements PermissionInterface
{
    /**
     * 判断是否超级管理员.
     *
     * @param string $organizationCode 组织编码
     * @param string $mobile 手机号
     *
     * @return bool 是否超级管理员
     */
    public function isOrganizationAdmin(string $organizationCode, string $mobile): bool
    {
        $whiteMap = config('permission.organization_whitelists');
        if (empty($whiteMap)
            || ! isset($whiteMap[$organizationCode])
            || ! in_array($mobile, $whiteMap[$organizationCode])
        ) {
            return false;
        }
        return true;
    }
}
