<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Service;

use App\Application\Flow\ExecuteManager\Attachment\AbstractAttachment;
use App\Domain\Chat\DTO\AIImage\Request\MagicChatAIImageReqDTO;
use App\Domain\Chat\DTO\Message\ChatMessage\AIImageCardMessage;
use App\Domain\Chat\DTO\Message\ChatMessage\ImageConvertHighCardMessage;
use App\Domain\Chat\Entity\Items\SeqExtra;
use App\Domain\Chat\Entity\MagicChatFileEntity;
use App\Domain\Chat\Entity\MagicSeqEntity;
use App\Domain\Chat\Entity\ValueObject\AIImage\AIImageCardResponseType;
use App\Domain\Chat\Entity\ValueObject\AIImage\AIImageGenerateParamsVO;
use App\Domain\Chat\Entity\ValueObject\AIImage\Radio;
use App\Domain\Chat\Entity\ValueObject\FileType;
use App\Domain\Chat\Service\MagicAIImageDomainService;
use App\Domain\Chat\Service\MagicChatDomainService;
use App\Domain\Chat\Service\MagicChatFileDomainService;
use App\Domain\Chat\Service\MagicConversationDomainService;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Domain\File\Service\FileDomainService;
use App\Domain\ModelAdmin\Constant\ServiceProviderType;
use App\Domain\ModelAdmin\Service\ServiceProviderDomainService;
use App\Domain\ModelGateway\Entity\MsgLogEntity;
use App\Domain\ModelGateway\Entity\ValueObject\LLMDataIsolation;
use App\Domain\ModelGateway\Service\MsgLogDomainService;
use App\ErrorCode\ImageGenerateErrorCode;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateFactory;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateModelType;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model\MiracleVision\MiracleVisionModel;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model\MiracleVision\MiracleVisionModelResponse;
use App\Infrastructure\Util\Context\RequestContext;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;
use App\Infrastructure\Util\SSRF\SSRFUtil;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use DateTime;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Hyperf\Codec\Json;
use Hyperf\Logger\LoggerFactory;
use Hyperf\Redis\Redis;
use Hyperf\Snowflake\IdGeneratorInterface;
use JetBrains\PhpStorm\ArrayShape;
use Psr\Log\LoggerInterface;
use Throwable;

use function di;
use function Hyperf\Coroutine\defer;
use function Hyperf\Translation\__;
use function mb_strlen;

/**
 * AI文生图.
 */
class MagicChatAIImageAppService extends AbstractAIImageAppService
{
    protected LoggerInterface $logger;

    public function __construct(
        protected readonly MagicConversationDomainService $magicConversationDomainService,
        protected readonly MagicUserDomainService $magicUserDomainService,
        protected readonly MagicChatDomainService $magicChatDomainService,
        protected readonly MagicAIImageDomainService $magicAIImageDomainService,
        protected readonly FileDomainService $fileDomainService,
        protected readonly MagicChatFileDomainService $magicChatFileDomainService,
        protected readonly ServiceProviderDomainService $serviceProviderDomainService,
        protected readonly MsgLogDomainService $msgLogDomainService,
        protected readonly Redis $redis,
        protected IdGeneratorInterface $idGenerator,
    ) {
        $this->logger = di()->get(LoggerFactory::class)->get(get_class($this));
    }

    public function handleUserMessage(RequestContext $requestContext, MagicChatAIImageReqDTO $reqDTO): void
    {
        $referContent = $this->getReferContentForAIImage($reqDTO->getReferMessageId());
        $referText = $this->getReferTextByContentForAIImage($referContent);
        // 如果是图生图，则尺寸保持和原始图片尺寸一致
        if ($referContent instanceof AIImageCardMessage || $referContent instanceof ImageConvertHighCardMessage) {
            // 设置实际请求的尺寸和比例
            $radio = $referContent->getRadio() ?? Radio::OneToOne->value;
            $enumModel = ImageGenerateModelType::fromModel($reqDTO->getParams()->getModel(), false);
            $reqDTO->getParams()->setRatioForModel($radio, $enumModel);
            $radio = $reqDTO->getParams()->getRatio();
            $reqDTO->getParams()->setSizeFromRadioAndModel($radio, $enumModel);
        }
        $reqDTO->setReferText($referText);
        $dataIsolation = $this->createDataIsolation($requestContext->getUserAuthorization());
        $requestContext->setDataIsolation($dataIsolation);
        $reqDTO->setAppMessageId((string) $this->idGenerator->generate());
        try {
            /** @var null|AbstractAttachment $attachment */
            $attachment = $reqDTO->getAttachments()[0] ?? null;
            $this->aiSendMessage(
                $reqDTO->getConversationId(),
                null,
                AIImageCardResponseType::START_GENERATE,
                [
                    'refer_file_id' => ! empty($reqDTO->getAttachments()) ? $attachment?->getUrl() : null,
                    'radio' => $reqDTO->getParams()->getRatio(),
                ],
                $reqDTO->getAppMessageId(),
                $reqDTO->getTopicId(),
                $reqDTO->getReferMessageId(),
            );
            if (! empty($reqDTO->getAttachments())) {
                // 对引用内容重新文生图
                $this->handleGenerateImageByReference($requestContext, $reqDTO);
            } else {
                // 文生图
                $this->handleGenerateImage($requestContext, $reqDTO);
            }
        } catch (Throwable $e) {
            // 发生异常时，发送终止消息，并抛出异常
            $this->handleGlobalThrowable($reqDTO, $e);
        }
    }

    // 转高清

    /**
     * @throws SSRFException
     */
    public function imageConvertHigh(string $url, MagicUserAuthorization $authenticatable): string
    {
        $url = SSRFUtil::getSafeUrl($url, replaceIp: false);
        /**
         * @var MiracleVisionModel $imageGenerateService
         */
        $imageGenerateService = ImageGenerateFactory::create(ImageGenerateModelType::MiracleVision);

        // 目前只能这么取值，后续再优化
        $miracleVisionServiceProviderConfig = $this->serviceProviderDomainService->getMiracleVisionServiceProviderConfig(ImageGenerateModelType::MiracleVisionHightModelId->value, $authenticatable->getOrganizationCode());

        if ($miracleVisionServiceProviderConfig->getServiceProviderType() === ServiceProviderType::NORMAL) {
            $imageGenerateService->setApiKey($miracleVisionServiceProviderConfig->getServiceProviderConfig()->getApiKey());
        }

        $imageConvertHigh = $this->magicAIImageDomainService->imageConvertHigh($url, $imageGenerateService);

        $this->recordMessageLog(ImageGenerateModelType::MiracleVisionHightModelId->value, $authenticatable->getId(), $authenticatable->getOrganizationCode());
        return $imageConvertHigh;
    }

    public function imageConvertHighQuery(string $taskId, string $organizationCode): MiracleVisionModelResponse
    {
        /**
         * @var MiracleVisionModel $imageGenerateService
         */
        $imageGenerateService = ImageGenerateFactory::create(ImageGenerateModelType::MiracleVision);

        $miracleVisionServiceProviderConfig = $this->serviceProviderDomainService->getMiracleVisionServiceProviderConfig(ImageGenerateModelType::MiracleVisionHightModelId->value, $organizationCode);

        if ($miracleVisionServiceProviderConfig->getServiceProviderType() === ServiceProviderType::NORMAL) {
            $imageGenerateService->setApiKey($miracleVisionServiceProviderConfig->getServiceProviderConfig()->getApiKey());
        }

        return $this->magicAIImageDomainService->imageConvertHighQuery($taskId, $imageGenerateService);
    }

    /**
     * 对引用内容重新文生图.
     */
    private function handleGenerateImageByReference(RequestContext $requestContext, MagicChatAIImageReqDTO $reqDTO): void
    {
        $reqDTO->getParams()->setGenerateNum(1);
        // 清空空值
        $urls = array_filter(array_map(fn ($attachment) => $attachment->getUrl(), $reqDTO->getAttachments()));
        $reqDTO->getParams()->setReferenceImages($urls);
        $this->handleGenerateImage($requestContext, $reqDTO);
    }

    /**
     * 文生图.
     */
    private function handleGenerateImage(RequestContext $requestContext, MagicChatAIImageReqDTO $reqDTO): void
    {
        $res = $this->generateImage($requestContext, $reqDTO->getParams());
        $this->aiSendMessage(
            $reqDTO->getConversationId(),
            (string) $this->idGenerator->generate(),
            AIImageCardResponseType::GENERATED,
            [
                'items' => $res['images'],
                'radio' => $reqDTO->getParams()->getRatio(),
                'refer_text' => $reqDTO->getReferText(),
            ],
            $reqDTO->getAppMessageId(),
            $reqDTO->getTopicId(),
            $reqDTO->getReferMessageId(),
        );
    }

    #[ArrayShape(
        [
            'images' => [
                [
                    'file_id' => 'string',
                    'url' => 'string',
                ],
            ],
        ]
    )]
    private function generateImage(RequestContext $requestContext, AIImageGenerateParamsVO $generateParamsVO): array
    {
        $model = $generateParamsVO->getModel();
        // 根据模型类型创建对应的服务

        $data = $generateParamsVO->toArray();
        $serviceProviderResponse = $this->serviceProviderDomainService->getServiceProviderConfig($model, '', $requestContext->getOrganizationCode());

        if ($serviceProviderResponse->getServiceProviderType() === ServiceProviderType::NORMAL) {
            $model = $serviceProviderResponse->getServiceProviderModelsEntity()->getModelVersion();
        }

        $imageGenerateType = ImageGenerateModelType::fromModel($model, false);
        $imageGenerateRequest = ImageGenerateFactory::createRequestType($imageGenerateType, $data);
        $imageGenerateService = ImageGenerateFactory::create($imageGenerateType);

        if ($serviceProviderResponse->getServiceProviderType() === ServiceProviderType::NORMAL) {
            $serviceProviderConfig = $serviceProviderResponse->getServiceProviderConfig();
            $imageGenerateService->setApiKey($serviceProviderConfig->getApiKey());
            $imageGenerateService->setAK($serviceProviderConfig->getAk());
            $imageGenerateService->setSK($serviceProviderConfig->getSk());
        }

        $imageGenerateResponse = $imageGenerateService->generateImage($imageGenerateRequest);
        $images = $imageGenerateResponse->getData();
        $this->logger->info('images', $images);
        $images = $this->upLoadFiles($requestContext, $images);
        $this->recordMessageLog($model, $requestContext->getUserId(), $requestContext->getOrganizationCode());
        return [
            'images' => $images,
        ];
    }

    /**
     * 将文件上传到云端.
     */
    #[ArrayShape([['file_id' => 'string', 'url' => 'string']])]
    private function upLoadFiles(RequestContext $requestContext, array $attachments): array
    {
        $images = [];
        foreach ($attachments as $attachment) {
            if (! is_string($attachment)) {
                continue;
            }
            try {
                // 上传OSS
                $uploadFile = new UploadFile($attachment);
                $this->fileDomainService->uploadByCredential($requestContext->getUserAuthorization()->getOrganizationCode(), $uploadFile);
                // 获取url
                $url = $this->fileDomainService->getLink($requestContext->getUserAuthorization()->getOrganizationCode(), $uploadFile->getKey())->getUrl();
                // 同步文件至magic
                $fileUploadDTOs = [];
                $fileType = FileType::getTypeFromFileExtension($uploadFile->getExt());
                $fileUploadDTO = new MagicChatFileEntity();
                $fileUploadDTO->setFileKey($uploadFile->getKey());
                $fileUploadDTO->setFileSize($uploadFile->getSize());
                $fileUploadDTO->setFileExtension($uploadFile->getExt());
                $fileUploadDTO->setFileName($uploadFile->getName());
                $fileUploadDTO->setFileType($fileType);
                $fileUploadDTOs[] = $fileUploadDTO;
                $magicChatFileEntity = $this->magicChatFileDomainService->fileUpload($fileUploadDTOs, $requestContext->getDataIsolation())[0] ?? null;
                $images[] = [
                    'file_id' => $magicChatFileEntity->getFileId(),
                    'url' => $url,
                ];
            } catch (Throwable $throwable) {
                // 提交图片失败
                $this->logger->error('upload_attachment_error', [
                    'error' => $throwable->getMessage(),
                    'file' => $attachment,
                ]);
            }
        }
        return $images;
    }

    private function handleGlobalThrowable(MagicChatAIImageReqDTO $reqDTO, Throwable $e)
    {
        $errorCode = $e->getCode();
        $errorMessage = __('chat.agent.user_call_agent_fail_notice');
        $errorCode = ImageGenerateErrorCode::tryFrom($errorCode);
        if ($errorCode instanceof ImageGenerateErrorCode) {
            $errorMessage = $e->getMessage();
        }
        $this->aiSendMessage(
            $reqDTO->getConversationId(),
            (string) $this->idGenerator->generate(),
            AIImageCardResponseType::TERMINATE,
            ['error_message' => $errorMessage],
            $reqDTO->getAppMessageId(),
            $reqDTO->getTopicId(),
            $reqDTO->getReferMessageId(),
        );
        $errMsg = [
            'function' => 'aiImageCardError',
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'message' => $errorMessage,
            'trace' => $e->getTraceAsString(),
        ];
        $this->logger->error('aiImageCardError ' . Json::encode($errMsg, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        //        throw $e;
    }

    private function aiSendMessage(
        string $conversationId,
        ?string $id,
        AIImageCardResponseType $type,
        array $content,
        // 流式响应，拿到客户端传来的 app_message_id ，作为响应时候的唯一标识
        string $appMessageId = '',
        string $topicId = '',
        string $referMessageId = '',
    ): array {
        $logMessageContent = Json::encode($content, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (mb_strlen($logMessageContent) > 300) {
            $logMessageContent = '';
        }
        $this->logger->info(sprintf(
            'aiImageSendMessage conversationId:%s id:%s messageName:%s Type:%s appMessageId:%s topicId:%s logMessageContent:%s',
            $conversationId,
            $id,
            AIImageCardResponseType::getNameFromType($type),
            $type->value,
            $appMessageId,
            $topicId,
            $logMessageContent
        ));
        $content = $content + [
            'id' => $id ?? (string) $this->idGenerator->generate(),
            'type' => $type,
        ];
        $messageInterface = new AIImageCardMessage($content);
        $extra = new SeqExtra();
        $extra->setTopicId($topicId);
        $seqDTO = (new MagicSeqEntity())
            ->setConversationId($conversationId)
            ->setContent($messageInterface)
            ->setSeqType($messageInterface->getMessageTypeEnum())
            ->setAppMessageId($appMessageId)
            ->setExtra($extra)
            ->setReferMessageId($referMessageId);
        // 设置话题 id
        return $this->getMagicChatMessageAppService()->aiSendMessage($seqDTO, $appMessageId, doNotParseReferMessageId: true);
    }

    private function recordMessageLog(string $modelVersion, string $userId, string $organizationCode): void
    {
        // 记录日志
        defer(function () use ($modelVersion, $userId, $organizationCode) {
            $LLMDataIsolation = LLMDataIsolation::create($userId, $organizationCode);

            $nickname = $this->magicUserDomainService->getUserById($userId)->getNickname();
            $msgLog = new MsgLogEntity();
            $msgLog->setModel($modelVersion);
            $msgLog->setUserId($userId);
            $msgLog->setUseAmount(0);
            $msgLog->setUseToken(0);
            $msgLog->setAppCode('');
            $msgLog->setOrganizationCode($organizationCode);
            $msgLog->setBusinessId('');
            $msgLog->setSourceId('chat_completions');
            $msgLog->setUserName($nickname);
            $msgLog->setCreatedAt(new DateTime());
            $this->msgLogDomainService->create($LLMDataIsolation, $msgLog);
        });
    }

    private function getMagicChatMessageAppService(): MagicChatMessageAppService
    {
        return di(MagicChatMessageAppService::class);
    }
}
