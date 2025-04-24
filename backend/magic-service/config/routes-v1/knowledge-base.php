<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Infrastructure\Util\Middleware\RequestContextMiddleware;
use App\Interfaces\KnowledgeBase\Facade\KnowledgeBaseApi;
use App\Interfaces\KnowledgeBase\Facade\KnowledgeBaseDocumentApi;
use App\Interfaces\KnowledgeBase\Facade\KnowledgeBaseFragmentApi;
use Hyperf\HttpServer\Router\Router;

Router::addGroup('/api/v1/knowledge-bases', static function () {
    // 知识库
    Router::addGroup('', function () {
        Router::post('', [KnowledgeBaseApi::class, 'create']);
        Router::put('/{code}', [KnowledgeBaseApi::class, 'update']);
        Router::post('/queries', [KnowledgeBaseApi::class, 'queries']);
        Router::get('/{code}', [KnowledgeBaseApi::class, 'show']);
        Router::delete('/{code}', [KnowledgeBaseApi::class, 'destroy']);
        Router::get('/providers/rerank/list', [KnowledgeBaseApi::class, 'getOfficialRerankProviderList']);
    });

    // 文档
    Router::addGroup('/{knowledgeBaseCode}/documents', function () {
        Router::post('', [KnowledgeBaseDocumentApi::class, 'create']);
        Router::put('/{code}', [KnowledgeBaseDocumentApi::class, 'update']);
        Router::post('/queries', [KnowledgeBaseDocumentApi::class, 'queries']);
        Router::get('/{code}', [KnowledgeBaseDocumentApi::class, 'show']);
        Router::delete('/{code}', [KnowledgeBaseDocumentApi::class, 'destroy']);
    });

    // 片段
    Router::addGroup('/{knowledgeBaseCode}/documents/{documentCode}/fragments', function () {
        Router::post('', [KnowledgeBaseFragmentApi::class, 'create']);
        Router::put('/{id}', [KnowledgeBaseFragmentApi::class, 'update']);
        Router::post('/queries', [KnowledgeBaseFragmentApi::class, 'queries']);
        Router::get('/{id}', [KnowledgeBaseFragmentApi::class, 'show']);
        Router::delete('/{id}', [KnowledgeBaseFragmentApi::class, 'destroy']);
    });
    Router::post('/fragments/preview', [KnowledgeBaseFragmentApi::class, 'fragmentPreview']);
    Router::post('/{code}/similarity', [KnowledgeBaseFragmentApi::class, 'similarity']);
}, ['middleware' => [RequestContextMiddleware::class]]);
