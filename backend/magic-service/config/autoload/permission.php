<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use function Hyperf\Support\env;

$organizationWhitelists = parse_json_config(env('ORGANIZATION_WHITELISTS'));
$superWhitelists = parse_json_config(env('SUPER_WHITELISTS', '[]'));
return [
    // 超级管理员
    'super_whitelists' => $superWhitelists,
    // 由于暂时没有权限系统，env 配置组织的管理员
    'organization_whitelists' => $organizationWhitelists,
];
