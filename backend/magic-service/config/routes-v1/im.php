<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Infrastructure\Util\Middleware\RequestContextMiddleware;
use App\Interfaces\Chat\Facade\MagicChatHttpApi;
use Hyperf\HttpServer\Router\Router;

Router::addGroup('/api/v1/im', static function () {
    // 会话
    Router::addGroup('/conversations', static function () {
        // 话题列表查询接口
        Router::post('/{conversationId}/topics/queries', [MagicChatHttpApi::class, 'getTopicList']);
        // 智能重命名话题
        Router::put('/{conversationId}/topics/{topicId}/name', [MagicChatHttpApi::class, 'intelligenceGetTopicName']);
        // 会话列表查询接口
        Router::post('/queries', [MagicChatHttpApi::class, 'conversationQueries']);
        // 聊天窗口打字时补全
        Router::post('/{conversationId}/completions', [MagicChatHttpApi::class, 'conversationChatCompletions']);
        // 保存交互指令
        Router::post('/{conversationId}/instructs', [MagicChatHttpApi::class, 'saveInstruct']);

        // 会话的历史消息滚动加载
        Router::post('/{conversationId}/messages/queries', [MagicChatHttpApi::class, 'messageQueries']);
        // （前端性能有问题的临时方案）按会话 id 分组获取几条最新消息.
        Router::post('/messages/queries', [MagicChatHttpApi::class, 'conversationsMessagesGroupQueries']);
    });

    // 消息
    Router::addGroup('/messages', static function () {
        // （新设备登录）拉取账号最近一段时间的消息
        Router::get('', [MagicChatHttpApi::class, 'pullRecentMessage']);
        // 拉取账号下所有组织的消息（支持全量滑动窗口拉取）
        Router::get('/page', [MagicChatHttpApi::class, 'pullByPageToken']);
        // 消息接收人列表
        Router::get('/{messageId}/recipients', [MagicChatHttpApi::class, 'getMessageReceiveList']);
        // 根据app_message_id 拉取消息
        Router::post('/app-message-ids/{appMessageId}/queries', [MagicChatHttpApi::class, 'pullByAppMessageId']);
    });

    // 文件
    Router::addGroup('/files', static function () {
        Router::post('', [MagicChatHttpApi::class, 'fileUpload']);
        Router::post('/download-urls/queries', [MagicChatHttpApi::class, 'getFileDownUrl']);
    });
}, ['middleware' => [RequestContextMiddleware::class]]);
