<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Infrastructure\Util\Middleware\RequestContextMiddleware;
use App\Interfaces\ModelAdmin\Facade\ServiceProviderApi;
use Hyperf\HttpServer\Router\Router;

// 组织管理后台路由
Router::addGroup('/api/v1/admin', static function () {
    Router::addGroup('/service-providers', static function () {
        // 服务商管理
        Router::get('', [ServiceProviderApi::class, 'getServiceProviders']);
        Router::get('/{serviceProviderConfigId:\d+}', [ServiceProviderApi::class, 'getServiceProviderConfig']);
        Router::put('', [ServiceProviderApi::class, 'updateServiceProviderConfig']);
        Router::post('', [ServiceProviderApi::class, 'addServiceProviderForOrganization']);
        Router::delete('/{serviceProviderConfigId:\d+}', [ServiceProviderApi::class, 'deleteServiceProviderForOrganization']);

        // 模型管理
        Router::post('/models', [ServiceProviderApi::class, 'saveModelToServiceProvider']);
        Router::delete('/models/{modelId}', [ServiceProviderApi::class, 'deleteModel']);
        Router::put('/models/{modelId}/status', [ServiceProviderApi::class, 'updateModelStatus']);

        // 模型标识管理
        Router::post('/model-id', [ServiceProviderApi::class, 'addModelIdForOrganization']);
        Router::delete('/model-ids/{modelId}', [ServiceProviderApi::class, 'deleteModelIdForOrganization']);

        // 原始模型管理
        Router::get('/original-models', [ServiceProviderApi::class, 'listOriginalModels']);
        Router::post('/original-models', [ServiceProviderApi::class, 'addOriginalModel']);

        // 其他功能
        Router::post('/connectivity-test', [ServiceProviderApi::class, 'connectivityTest']);
        Router::get('/by-category', [ServiceProviderApi::class, 'getServiceProvidersByCategory']);
        Router::get('/non-official-llm', [ServiceProviderApi::class, 'getNonOfficialLlmProviders']);
    });
});

// 超级管理员路由 todo xhy 先保留，新功能还需要等待开发
Router::addGroup('/api/v1/super/admin', static function () {
    Router::addGroup('/service-providers', static function () {
        Router::post('', [ServiceProviderApi::class, 'addServiceProvider']);
        Router::put('', [ServiceProviderApi::class, 'updateServiceProvider']);
        Router::delete('/{serviceProviderConfigId}', [ServiceProviderApi::class, 'deleteServiceProviderForAdmin']);

        // 模型管理
        Router::post('/models', [ServiceProviderApi::class, 'saveModelToServiceProviderForAdmin']);
        Router::delete('/models/{modelId}', [ServiceProviderApi::class, 'deleteModelForAdmin']);

        // 模型标识管理
        Router::post('/model-ids', [ServiceProviderApi::class, 'addModelId']);

        // 原始模型管理
        Router::delete('/original-models/{modelId}', [ServiceProviderApi::class, 'deleteOriginalModel']);
    });
}, ['middleware' => [RequestContextMiddleware::class]]);
