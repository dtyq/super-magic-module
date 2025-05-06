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
use Dtyq\SuperMagic\Application\SuperAgent\Service\FileProcessAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\WorkspaceAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetFileUrlsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\RefreshStsTokenRequestDTO;
use Hyperf\HttpServer\Contract\RequestInterface;
use Qbhy\HyperfAuth\AuthManager;

#[ApiResponse('low_code')]
class FileApi extends AbstractApi
{
    public function __construct(
        private readonly FileProcessAppService $fileProcessAppService,
        protected WorkspaceAppService $workspaceAppService,
        protected RequestInterface $request,
    ) {
    }

    /**
     * 批量处理附件，根据fileKey检查是否存在，存在则跳过，不存在则保存.
     * 仅需提供task_id和attachments参数,其他参数将从任务中自动获取.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 处理结果
     */
    public function processAttachments(RequestContext $requestContext): array
    {
        // 获取请求参数
        $attachments = $this->request->input('attachments', []);
        $sandboxId = (string) $this->request->input('sandbox_id', '');
        $organizationCode = $this->request->input('organization_code', '');

        // 参数验证
        if (empty($attachments)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'file.attachments_required');
        }

        if (empty($sandboxId)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'file.sandbox_id_required');
        }

        if (empty($organizationCode)) {
            // 如果没有提供组织编码,则使用默认值
            $organizationCode = 'default';
        }

        // 调用应用服务处理附件,传入null让服务层自动获取topic_id
        return $this->fileProcessAppService->processAttachmentsArray(
            $attachments,
            $sandboxId,
            $organizationCode,
            null // 不传入topic_id,让服务层根据taskId自动获取
        );
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
     * 刷新 STS Token.
     *
     * @param RequestContext $requestContext 请求上下文
     * @return array 刷新结果
     */
    public function refreshStsToken(RequestContext $requestContext): array
    {
        $token = $this->request->header('token', '');
        if (empty($token)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'token_required');
        }

        if ($token !== env('SANDBOX_TOKEN')) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'token_invalid');
        }

        // 创建DTO并从请求中解析数据
        $requestData = $this->request->all();
        $refreshStsTokenDTO = RefreshStsTokenRequestDTO::fromRequest($requestData);

        return $this->fileProcessAppService->refreshStsToken($refreshStsTokenDTO);
    }
}
