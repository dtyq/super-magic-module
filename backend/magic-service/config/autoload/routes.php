<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use Hyperf\Config\ProviderConfig;

$routeConfigs = [
    // 基础路由配置
    'base' => [
        'path' => BASE_PATH . '/config/routes.php',
    ],

    // v1 版本 API 路由
    'v1' => [
        'path' => BASE_PATH . '/config/routes-v1',
        'files' => [
            'auth.php',
            'im.php',
            'file.php',
            'contact.php',
            'environment.php',
            'flow.php',
            'agent.php',
            'model-gateway.php',
            'callback.php',
            'favorite.php',
            'tag.php',
            'admin.php',
            'permission.php',
            'knowledge-base.php',
            'task.php',
            'open-apis.php',
        ],
    ],
    // 旧版路由文件（兼容模式，后续可以逐步迁移到 v1 版本）
    'legacy' => [
        'files' => [
            'routes-file.php',
            'routes-auth.php',
            'routes-permission.php',
            'routes-im.php',
            'routes-flow.php',
            'routes-bot.php',
            'routes-llm.php',
            'routes-callback.php',
            'routes-favorite.php',
            'routes-tag.php',
            'routes-admin.php',
        ],
    ],
];

$configFromProviders = [];
if (class_exists(ProviderConfig::class)) {
    $configFromProviders = ProviderConfig::load();
}

$routes = $configFromProviders['routes'] ?? [];
$routes = array_merge($routes, $routeConfigs);
// 合并组件包路由
$routes['components'] = $configFromProviders['routes']['components'] ?? [];

return $routes;
