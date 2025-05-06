<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade;

use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\StatisticsAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicAttachmentsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetUserUsageRequestDTO;
use Hyperf\HttpServer\Contract\RequestInterface;

#[ApiResponse('low_code')]
class StatisticsApi extends AbstractApi
{
    public function __construct(
        protected RequestInterface $request,
        private readonly StatisticsAppService $statisticsAppService
    ) {
    }

    public function getUserUsage(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        // 使用fromRequest方法创建DTO
        $dto = GetUserUsageRequestDTO::fromRequest($this->request);
        return $this->statisticsAppService->getUserUsage($this->getAuthorization(), $dto);
    }

    /**
     * 获取话题状态统计指标.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 包含状态统计和总计数据的数组
     */
    public function getTopicMetrics(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 获取可选的组织代码参数
        $organizationCode = $this->request->input('organization_code', '');

        // 调用应用服务获取统计数据
        return $this->statisticsAppService->getTopicStatusMetrics($this->getAuthorization(), $organizationCode);
    }

    /**
     * 获取用户话题消息列表.
     */
    public function getUserTopicMessage(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 获取 topic_id  参数
        $topicId = $this->request->input('topic_id', '');
        $page = $this->request->input('page', 1);
        $pageSize = $this->request->input('page_size', 10);
        $sortDirection = $this->request->input('sort_direction', 'desc');

        // 获取用户 topic 消息列表
        return $this->statisticsAppService->getUserTopicMessage($this->getAuthorization(), (int) $topicId, $page, $pageSize, $sortDirection);
    }

    public function getUserTopicAttachment(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        $dto = GetTopicAttachmentsRequestDTO::fromRequest($this->request);

        return $this->statisticsAppService->getUserTopicAttachments($this->getAuthorization(), $dto);
    }
}
