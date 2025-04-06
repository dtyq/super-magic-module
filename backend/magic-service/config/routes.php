<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Infrastructure\Core\Router\RouteLoader;
use Hyperf\Context\ApplicationContext;
use Hyperf\HttpServer\Router\Router;

// 基础路由
Router::get('/', function () {
    return 'hello, magic-service!';
});
Router::get('/favicon.ico', function () {
    return '';
});
Router::addRoute(
    ['GET', 'POST', 'HEAD', 'OPTIONS'],
    '/heartbeat',
    function () {
        return ['status' => 'UP'];
    }
);

// 使用路由加载器加载所有路由
$container = ApplicationContext::getContainer();
$routeLoader = $container->get(RouteLoader::class);
$routeLoader->loadRoutes();
