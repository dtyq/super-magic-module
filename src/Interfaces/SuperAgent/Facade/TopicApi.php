<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade;

use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TopicAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\WorkspaceAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\DeleteTopicRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicAttachmentsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicMessagesByTopicIdRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\SaveTopicRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\TopicMessagesResponseDTO;
use Exception;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;
use Throwable;

#[ApiResponse('low_code')]
class TopicApi extends AbstractApi
{
    public function __construct(
        protected RequestInterface $request,
        protected WorkspaceAppService $workspaceAppService,
        protected TopicAppService $topicAppService,
    ) {
    }

    /**
     * 获取话题信息.
     */
    public function getTopic(RequestContext $requestContext, $id): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        return $this->topicAppService->getTopic($requestContext, (int) $id)->toArray();
    }

    /**
     * 保存话题（创建或更新）
     * 接口层负责处理HTTP请求和响应，不包含业务逻辑.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 操作结果，包含话题ID
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     * @throws Throwable
     */
    public function saveTopic(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 从请求创建DTO
        $requestDTO = SaveTopicRequestDTO::fromRequest($this->request);

        // 调用应用服务层处理业务逻辑
        return $this->workspaceAppService->saveTopic($requestContext, $requestDTO)->toArray();
    }

    /**
     * 删除话题（逻辑删除）
     * 接口层负责处理HTTP请求和响应，不包含业务逻辑.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 操作结果，包含被删除的话题ID
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     * @throws Exception
     */
    public function deleteTopic(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 从请求创建DTO
        $requestDTO = DeleteTopicRequestDTO::fromRequest($this->request);

        // 调用应用服务层处理业务逻辑
        return $this->workspaceAppService->deleteTopic($requestContext, $requestDTO)->toArray();
    }

    /**
     * 重命名话题.
     */
    public function renameTopic(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 话题 id
        $authorization = $requestContext->getUserAuthorization();

        $topicId = $this->request->input('id', 0);
        $userQuestion = $this->request->input('user_question', '');

        return $this->workspaceAppService->renameTopic($authorization, (int) $topicId, $userQuestion);
    }

    /**
     * 获取话题的附件列表.
     */
    public function getTopicAttachments(RequestContext $requestContext): array
    {
        // 使用 fromRequest 方法从请求中创建 DTO，这样可以从路由参数中获取 topic_id
        $dto = GetTopicAttachmentsRequestDTO::fromRequest($this->request);
        if (! empty($dto->getToken())) {
            // 走令牌校验的逻辑
            return $this->workspaceAppService->getTopicAttachmentsByAccessToken($dto);
        }
        // 登录用户使用的场景
        $requestContext->setUserAuthorization(di(AuthManager::class)->guard(name: 'web')->user());
        $userAuthorization = $requestContext->getUserAuthorization();

        return $this->workspaceAppService->getTopicAttachments($userAuthorization, $dto);
    }

    public function getSandboxStatus(RequestContext $requestContext, $id): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        return $this->workspaceAppService->getSandboxStatus($requestContext, (int) $id);
    }

    public function getSandboxDownloadUrl(RequestContext $requestContext, $id)
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        return $this->workspaceAppService->getSandboxDownloadUrl($requestContext, (int) $id);
    }

    /**
     * 通过话题ID获取消息列表.x.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 消息列表及分页信息
     */
    public function getMessagesByTopicId(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 从请求创建DTO
        $dto = GetTopicMessagesByTopicIdRequestDTO::fromRequest($this->request);

        // 校验话题消息是否是自己的
        $topicItemDTO = $this->topicAppService->getTopic($requestContext, $dto->getTopicId());
        if ($topicItemDTO->getUserId() !== $requestContext->getUserAuthorization()->getId()) {
            return ['list' => [], 'total' => 0];
        }

        // 调用应用服务
        $result = $this->workspaceAppService->getMessagesByTopicId(
            $dto->getTopicId(),
            $dto->getPage(),
            $dto->getPageSize(),
            $dto->getSortDirection()
        );

        // 构建响应
        $response = new TopicMessagesResponseDTO($result['list'], $result['total']);

        return $response->toArray();
    }
}
