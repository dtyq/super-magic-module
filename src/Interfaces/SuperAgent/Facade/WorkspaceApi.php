<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\Facade;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\ApiResponse\Annotation\ApiResponse;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TopicAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\WorkspaceAppService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\WorkspaceArchiveStatus;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\DeleteTopicRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetFileUrlsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTaskFilesRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicAttachmentsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicMessagesByTopicIdRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetWorkspaceTopicsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\SaveTopicRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\SaveWorkspaceRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\WorkspaceListRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\TopicMessagesResponseDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\TopicTaskMessageDTO;
use Exception;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;
use Throwable;

#[ApiResponse('low_code')]
class WorkspaceApi extends AbstractApi
{
    public function __construct(
        protected RequestInterface $request,
        protected WorkspaceAppService $workspaceAppService,
        protected TopicAppService $topicAppService,
    ) {
    }

    /**
     * 获取工作区列表.
     */
    public function getWorkspaceList(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setAuthorization($this->request->header('authorization', ''));
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 从请求创建DTO
        $requestDTO = WorkspaceListRequestDTO::fromRequest($this->request);

        // 调用应用服务
        return $this->workspaceAppService->getWorkspaceList($requestContext, $requestDTO)->toArray();
    }

    /**
     * 获取工作区下的话题列表.
     */
    public function getWorkspaceTopics(RequestContext $requestContext): array
    {
        $requestContext->setUserAuthorization($this->getAuthorization());
        $dto = GetWorkspaceTopicsRequestDTO::fromRequest($this->request);

        return $this->workspaceAppService->getWorkspaceTopics(
            $requestContext,
            $dto
        )->toArray();
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

    public function getTopic(RequestContext $requestContext, $id): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        return $this->workspaceAppService->getTopic($requestContext, (int) $id)->toArray();
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
        $topicEntity = $this->topicAppService->getTopicById($requestContext, $dto->getTopicId());
        if (! empty($topicEntity) && $topicEntity->getUserId() !== $requestContext->getUserAuthorization()->getId()) {
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

    /**
     * 保存工作区（创建或更新）.
     * 接口层负责处理HTTP请求和响应，不包含业务逻辑.
     * @throws Throwable
     */
    public function saveWorkspace(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 从请求创建DTO
        $requestDTO = SaveWorkspaceRequestDTO::fromRequest($this->request);

        // 调用应用服务层处理业务逻辑
        return $this->workspaceAppService->saveWorkspace($requestContext, $requestDTO)->toArray();
    }

    /**
     * 删除工作区（逻辑删除）.
     * 接口层负责处理HTTP请求和响应，不包含业务逻辑.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 操作结果
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     */
    public function deleteWorkspace(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 获取路由参数中的工作区ID
        $workspaceId = (int) $this->request->input('id', 0);

        if (empty($workspaceId)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'workspace.id_required');
        }

        // 调用应用服务层处理业务逻辑
        $this->workspaceAppService->deleteWorkspace($requestContext, $workspaceId);

        // 返回规范化的响应结果
        return ['id' => $workspaceId];
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
     * 获取任务下的所有附件.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 附件列表及分页信息
     * @throws BusinessException 如果参数无效则抛出异常
     */
    public function getTaskAttachments(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        $userAuthorization = $requestContext->getUserAuthorization();

        // 获取任务文件请求DTO
        $dto = GetTaskFilesRequestDTO::fromRequest($this->request);

        // 调用应用服务
        return $this->workspaceAppService->getTaskAttachments(
            $userAuthorization,
            $dto->getId(),
            $dto->getPage(),
            $dto->getPageSize()
        );
    }

    /**
     * 设置工作区归档状态.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 操作结果
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     */
    public function setArchived(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());

        // 获取请求参数
        $workspaceIds = $this->request->input('workspace_ids', []);
        $isArchived = (int) $this->request->input('is_archived', WorkspaceArchiveStatus::NotArchived->value);

        // 调用应用服务层设置归档状态
        $result = $this->workspaceAppService->setWorkspaceArchived($requestContext, $workspaceIds, $isArchived);

        // 返回规范化的响应结果
        return [
            'success' => $result,
        ];
    }

    /**
     * 获取文件URL列表.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 文件URL列表
     * @throws BusinessException 如果参数无效则抛出异常
     */
    public function getFileUrls(RequestContext $requestContext): array
    {
        // 获取请求DTO
        $dto = GetFileUrlsRequestDTO::fromRequest($this->request);
        if (! empty($dto->getToken())) {
            // 走令牌校验逻辑
            return $this->workspaceAppService->getFileUrlsByAccessToken($dto->getFileIds(), $dto->getToken());
        }
        // 设置用户授权信息
        $requestContext->setUserAuthorization(di(AuthManager::class)->guard(name: 'web')->user());
        $userAuthorization = $requestContext->getUserAuthorization();

        // 调用应用服务
        return $this->workspaceAppService->getFileUrls(
            $userAuthorization,
            $dto->getFileIds()
        );
    }

    /**
     * 投递话题任务消息.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 操作结果
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     */
    public function deliverMessage(RequestContext $requestContext): array
    {
        // 从 header 中获取 token 字段
        $token = $this->request->header('token', '');
        if (empty($token)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'token_required');
        }

        // 从 env 获取沙箱 token ，然后对比沙箱 token 和请求 token 是否一致
        $sandboxToken = env('SANDBOX_TOKEN', '');
        if ($sandboxToken !== $token) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'token_invalid');
        }

        // 从请求中创建DTO
        $messageDTO = TopicTaskMessageDTO::fromArray($this->request->all());
        // 调用应用服务进行消息投递
        return $this->workspaceAppService->deliverTopicTaskMessage($messageDTO);
    }

    /**
     * 获取所有工作区的唯一组织代码列表.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 唯一的组织代码列表
     * @throws BusinessException 如果参数无效或操作失败则抛出异常
     */
    public function getOrganizationCodes(RequestContext $requestContext): array
    {
        // 设置用户授权信息
        $requestContext->setUserAuthorization($this->getAuthorization());
        $userAuthorization = $requestContext->getUserAuthorization();

        // 调用应用服务获取唯一组织代码列表
        return $this->workspaceAppService->getUniqueOrganizationCodes($userAuthorization);
    }
}
