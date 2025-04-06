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
        Router::post('', [KnowledgeBaseApi::class, 'createKnowledgeBase']);
        Router::put('/{code}', [KnowledgeBaseApi::class, 'updateKnowledgeBase']);
        Router::post('/queries', [KnowledgeBaseApi::class, 'getKnowledgeBaseList']);
        Router::get('/{code}', [KnowledgeBaseApi::class, 'getKnowledgeBaseDetail']);
        Router::delete('/{code}', [KnowledgeBaseApi::class, 'destroyKnowledgeBase']);
    });

    // 文档
    Router::addGroup('/{knowledgeBaseCode}/documents', function () {
        Router::post('', [KnowledgeBaseDocumentApi::class, 'createDocument']);
        Router::put('/{code}', [KnowledgeBaseDocumentApi::class, 'updateDocument']);
        Router::post('/queries', [KnowledgeBaseDocumentApi::class, 'getDocumentList']);
        Router::get('/{code}', [KnowledgeBaseDocumentApi::class, 'getDocumentDetail']);
        Router::delete('/{code}', [KnowledgeBaseDocumentApi::class, 'destroyDocument']);
    });

    // 片段
    Router::addGroup('/{knowledgeBaseCode}/documents/{documentCode}/fragments', function () {
        Router::post('', [KnowledgeBaseFragmentApi::class, 'createFragment']);
        Router::put('/{id}', [KnowledgeBaseFragmentApi::class, 'updateFragment']);
        Router::post('/queries', [KnowledgeBaseFragmentApi::class, 'getFragmentList']);
        Router::get('/{id}', [KnowledgeBaseFragmentApi::class, 'fragmentShow']);
        Router::delete('/{id}', [KnowledgeBaseFragmentApi::class, 'fragmentDestroy']);
    });
}, ['middleware' => [RequestContextMiddleware::class]]);
