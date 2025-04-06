<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\ExecuteManager\NodeRunner\Image\V1;

use App\Application\Flow\ExecuteManager\Attachment\AbstractAttachment;
use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionData;
use App\Application\Flow\ExecuteManager\NodeRunner\NodeRunner;
use App\Domain\Flow\Entity\ValueObject\NodeParamsConfig\Image\V1\ImageGenerateNodeParamsConfig;
use App\Domain\Flow\Entity\ValueObject\NodeType;
use App\Domain\ModelAdmin\Constant\ServiceProviderType;
use App\Domain\ModelGateway\Entity\MsgLogEntity;
use App\Domain\ModelGateway\Entity\ValueObject\LLMDataIsolation;
use App\Infrastructure\Core\Collector\ExecuteManager\Annotation\FlowNodeDefine;
use App\Infrastructure\Core\Dag\VertexResult;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateFactory;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateModelType;
use DateTime;

use function Hyperf\Coroutine\defer;

#[FlowNodeDefine(
    type: NodeType::ImageGenerate->value,
    code: NodeType::ImageGenerate->name,
    name: '图像生成',
    paramsConfig: ImageGenerateNodeParamsConfig::class,
    version: 'v1',
    singleDebug: false,
    needInput: false,
    needOutput: true,
)]
class ImageGenerateNodeRunner extends NodeRunner
{
    protected function run(VertexResult $vertexResult, ExecutionData $executionData, array $frontResults): void
    {
        /** @var ImageGenerateNodeParamsConfig $paramsConfig */
        $paramsConfig = $this->node->getNodeParamsConfig();

        $userPrompt = $paramsConfig->getUserPrompt()->getValue()->getResult($executionData->getExpressionFieldData());
        $vertexResult->addDebugLog('user_prompt', $userPrompt);

        $wide = $paramsConfig->getWidth()?->getValue()?->getResult($executionData->getExpressionFieldData()) ?? '512';
        $vertexResult->addDebugLog('width', $wide);

        $height = $paramsConfig->getHeight()?->getValue()?->getResult($executionData->getExpressionFieldData()) ?? '512';
        $vertexResult->addDebugLog('height', $height);

        $negativePrompt = $paramsConfig->getNegativePrompt()?->getValue()?->getResult($executionData->getExpressionFieldData()) ?? '';
        $vertexResult->addDebugLog('negative_prompt', $negativePrompt);

        $referenceImages = $paramsConfig->getReferenceImages()?->getValue()?->getResult($executionData->getExpressionFieldData()) ?? [];
        $vertexResult->addDebugLog('reference_images', $referenceImages);

        $defaultRatio = '1:1';
        $ratio = $paramsConfig->getRatio()?->getValue()?->getResult($executionData->getExpressionFieldData())[0]['id'] ?? $defaultRatio;

        $vertexResult->addDebugLog('ratio', $ratio);

        $useSr = $paramsConfig->getUseSr();
        $vertexResult->addDebugLog('useSr', $negativePrompt);

        $modelId = $paramsConfig->getModelId();
        $vertexResult->addDebugLog('model_id', $modelId);

        $serviceProviderResponse = $this->serviceProviderDomainService->getServiceProviderConfigByModelId($modelId, $executionData->getDataIsolation()->getCurrentOrganizationCode());

        $serviceProviderModelsEntity = $serviceProviderResponse->getServiceProviderModelsEntity();
        $modelVersion = $serviceProviderModelsEntity->getModelVersion();
        // 根据模型类型创建对应的服务

        $imageGenerateType = ImageGenerateModelType::fromModel($modelVersion);
        $imageGenerateService = ImageGenerateFactory::create($imageGenerateType);

        if ($serviceProviderResponse->getServiceProviderType() === ServiceProviderType::NORMAL) {
            $serviceProviderConfig = $serviceProviderResponse->getServiceProviderConfig();
            $imageGenerateService->setApiKey($serviceProviderConfig->getApiKey());
            $imageGenerateService->setAK($serviceProviderConfig->getAk());
            $imageGenerateService->setSK($serviceProviderConfig->getSk());
        }

        $data = [
            'model' => $modelVersion,
            'model_id' => $modelId,
            'height' => $height,
            'width' => $wide,
            'user_prompt' => $userPrompt,
            'negative_prompt' => $negativePrompt,
            'ratio' => $ratio,
            'use_sr' => $useSr,
            'reference_images' => $referenceImages,
        ];
        $imageGenerateRequest = ImageGenerateFactory::createRequestType($imageGenerateType, $data);
        $imageGenerateRequest->setGenerateNum(4);
        $imageGenerateResponse = $imageGenerateService->generateImage($imageGenerateRequest);
        $images = $imageGenerateResponse->getData();
        // 这里可能是 url、base64，均记录到流程执行附件中（此时会进行上传到云服务端）。上传失败的文件会直接跳过
        $attachments = $this->recordFlowExecutionAttachments($executionData, $images, true);
        $vertexResult->addDebugLog('attachments', array_map(fn (AbstractAttachment $attachment) => $attachment->toArray(), $attachments));
        $result = [
            'image_urls' => array_map(fn ($attachment) => $attachment->getUrl(), $attachments),
        ];
        $vertexResult->setResult($result);
        $executionData->saveNodeContext($this->node->getNodeId(), $result);
        $this->recordMessageLog($modelVersion, $executionData);
    }

    private function recordMessageLog(string $modelVersion, ExecutionData $executionData): void
    {
        // 记录日志
        defer(function () use ($modelVersion, $executionData) {
            $flowDataIsolation = $executionData->getDataIsolation();
            $currentUserId = $flowDataIsolation->getCurrentUserId();
            $currentOrganizationCode = $flowDataIsolation->getCurrentOrganizationCode();
            $LLMDataIsolation = LLMDataIsolation::create($currentUserId, $currentOrganizationCode);

            $nickname = $this->userDomainService->getUserById($currentUserId)->getNickname();
            $msgLog = new MsgLogEntity();
            $msgLog->setModel($modelVersion);
            $msgLog->setUserId($currentUserId);
            $msgLog->setUseAmount(0);
            $msgLog->setUseToken(0);
            $msgLog->setAppCode('');
            $msgLog->setOrganizationCode($currentOrganizationCode);
            $msgLog->setBusinessId($executionData->getFlowCode());
            $msgLog->setSourceId('sk_flow');
            $msgLog->setUserName($nickname);
            $msgLog->setCreatedAt(new DateTime());
            $this->msgLogDomainService->create($LLMDataIsolation, $msgLog);
        });
    }
}
