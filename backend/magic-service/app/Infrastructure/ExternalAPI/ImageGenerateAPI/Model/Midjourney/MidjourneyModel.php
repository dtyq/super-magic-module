<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model\Midjourney;

use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderConfig;
use App\ErrorCode\ImageGenerateErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerate;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\ImageGenerateType;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Model\AbstractDingTalkAlert;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Request\ImageGenerateRequest;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Request\MidjourneyModelRequest;
use App\Infrastructure\ExternalAPI\ImageGenerateAPI\Response\ImageGenerateResponse;
use Exception;
use Hyperf\Di\Annotation\Inject;
use Psr\Log\LoggerInterface;

class MidjourneyModel extends AbstractDingTalkAlert implements ImageGenerate
{
    // 最大重试次数
    protected const MAX_RETRIES = 20;

    // 重试间隔（秒）
    protected const RETRY_INTERVAL = 10;

    #[Inject]
    protected LoggerInterface $logger;

    protected MidjourneyAPI $api;

    public function __construct(ServiceProviderConfig $serviceProviderConfig)
    {
        parent::__construct();
        $this->api = new MidjourneyAPI($serviceProviderConfig->getApiKey());
        $this->balanceThreshold = 100;
    }

    // mj 每次生成 4 张图片，不好控制生成数量，因此不用管，如果有需在实现：
    // 实现方案：取生成数量和 4 的倍数进行相比进行获取即可 TODO:xhy
    public function generateImage(ImageGenerateRequest $imageGenerateRequest): ImageGenerateResponse
    {
        if (! $imageGenerateRequest instanceof MidjourneyModelRequest) {
            $this->logger->error('MJ文生图：无效的请求类型', [
                'class' => get_class($imageGenerateRequest),
            ]);
            ExceptionBuilder::throw(ImageGenerateErrorCode::GENERAL_ERROR);
        }

        // 构建 prompt
        $prompt = $imageGenerateRequest->getPrompt();
        if ($imageGenerateRequest->getRatio()) {
            $prompt .= ' --ar ' . $imageGenerateRequest->getRatio();
        }
        if ($imageGenerateRequest->getNegativePrompt()) {
            $prompt .= ' --no ' . $imageGenerateRequest->getNegativePrompt();
        }

        $prompt .= ' --v 7.0';

        // 记录请求开始
        $this->logger->info('MJ文生图：开始生图', [
            'prompt' => $prompt,
            'ratio' => $imageGenerateRequest->getRatio(),
            'negativePrompt' => $imageGenerateRequest->getNegativePrompt(),
            'mode' => $imageGenerateRequest->getModel(),
        ]);

        try {
            $this->checkPrompt($prompt);

            $jobId = $this->submitAsyncTask($prompt, $imageGenerateRequest->getModel());

            $response = $this->pollTaskResult($jobId);

            $this->logger->info('MJ文生图：生成结束', [
                'jobId' => $jobId,
                'imageCount' => count($response->getData()),
            ]);

            // 异步检查余额
            $this->monitorBalance();

            return $response;
        } catch (Exception $e) {
            $this->logger->error('MJ文生图：失败', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            throw $e;
        }
    }

    public function setAK(string $ak)
    {
        // TODO: Implement setAK() method.
    }

    public function setSK(string $sk)
    {
        // TODO: Implement setSK() method.
    }

    public function setApiKey(string $apiKey)
    {
        $this->api->setApiKey($apiKey);
    }

    protected function submitAsyncTask(string $prompt, string $mode = 'fast'): string
    {
        try {
            $result = $this->api->submitTask($prompt, $mode);

            if (! isset($result['status'])) {
                $this->logger->error('MJ文生图：响应格式错误', [
                    'response' => $result,
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::RESPONSE_FORMAT_ERROR);
            }

            if ($result['status'] !== 'SUCCESS') {
                $this->logger->error('MJ文生图：提交失败', [
                    'message' => $result['message'] ?? '未知错误',
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::GENERAL_ERROR);
            }

            if (empty($result['data']['jobId'])) {
                $this->logger->error('MJ文生图：缺少任务ID', [
                    'response' => $result,
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::MISSING_IMAGE_DATA);
            }

            $jobId = $result['data']['jobId'];
            $this->logger->info('MJ文生图：提交任务成功', [
                'jobId' => $jobId,
            ]);
            return $jobId;
        } catch (Exception $e) {
            $this->logger->error('MJ文生图：提交任务异常', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            ExceptionBuilder::throw(ImageGenerateErrorCode::GENERAL_ERROR);
        }
    }

    /**
     * 检查 Prompt 是否合法.
     * @throws Exception
     */
    protected function checkPrompt(string $prompt): void
    {
        try {
            $result = $this->api->checkPrompt($prompt);

            if (! isset($result['status'])) {
                $this->logger->error('MJ文生图：Prompt校验响应格式错误', [
                    'response' => $result,
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::RESPONSE_FORMAT_ERROR);
            }

            if ($result['status'] !== 'SUCCESS') {
                $this->logger->warning('MJ文生图：Prompt校验失败', [
                    'message' => $result['message'] ?? '未知错误',
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::INVALID_PROMPT);
            }

            $this->logger->info('MJ文生图：Prompt校验完成');
        } catch (Exception $e) {
            $this->logger->error('MJ文生图：Prompt校验请求失败', [
                'error' => $e->getMessage(),
            ]);
            ExceptionBuilder::throw(ImageGenerateErrorCode::PROMPT_CHECK_FAILED);
        }
    }

    /**
     * 轮询任务结果.
     * @throws Exception
     */
    protected function pollTaskResult(string $jobId): ImageGenerateResponse
    {
        $retryCount = 0;

        while ($retryCount < self::MAX_RETRIES) {
            try {
                $result = $this->api->getTaskResult($jobId);

                if (! isset($result['status'])) {
                    $this->logger->error('MJ文生图：轮询响应格式错误', [
                        'jobId' => $jobId,
                        'response' => $result,
                    ]);
                    ExceptionBuilder::throw(ImageGenerateErrorCode::RESPONSE_FORMAT_ERROR);
                }

                $this->logger->info('MJ文生图：轮询状态', [
                    'jobId' => $jobId,
                    'status' => $result['status'],
                    'retryCount' => $retryCount,
                ]);

                if ($result['status'] === 'SUCCESS') {
                    // 优先使用 images 数组
                    if (! empty($result['data']['images']) && is_array($result['data']['images'])) {
                        return new ImageGenerateResponse(ImageGenerateType::URL, $result['data']['images']);
                    }

                    // 如果没有 images 数组，尝试使用 cdnImage
                    if (! empty($result['data']['cdnImage'])) {
                        return new ImageGenerateResponse(ImageGenerateType::URL, [$result['data']['cdnImage']]);
                    }

                    $this->logger->error('MJ文生图：未获取到图片URL', [
                        'jobId' => $jobId,
                        'response' => $result,
                    ]);
                    ExceptionBuilder::throw(ImageGenerateErrorCode::MISSING_IMAGE_DATA);
                }

                if ($result['status'] === 'FAILED') {
                    $this->logger->error('MJ文生图：任务执行失败', [
                        'jobId' => $jobId,
                        'message' => $result['message'] ?? '未知错误',
                    ]);
                    ExceptionBuilder::throw(ImageGenerateErrorCode::GENERAL_ERROR);
                }

                // 如果是其他状态（如 PENDING_QUEUE 或 ON_QUEUE），继续等待
                ++$retryCount;
                sleep(self::RETRY_INTERVAL);
            } catch (Exception $e) {
                $this->logger->error('MJ文生图：轮询任务结果失败', [
                    'jobId' => $jobId,
                    'error' => $e->getMessage(),
                    'retryCount' => $retryCount,
                ]);
                ExceptionBuilder::throw(ImageGenerateErrorCode::POLLING_FAILED);
            }
        }

        $this->logger->error('MJ文生图：任务执行超时', [
            'jobId' => $jobId,
            'maxRetries' => self::MAX_RETRIES,
            'totalTime' => self::MAX_RETRIES * self::RETRY_INTERVAL,
        ]);
        ExceptionBuilder::throw(ImageGenerateErrorCode::TASK_TIMEOUT);
    }

    /**
     * 检查账户余额.
     * @return float 余额
     * @throws Exception
     */
    protected function checkBalance(): float
    {
        try {
            $result = $this->api->getAccountInfo();

            if ($result['status'] !== 'SUCCESS') {
                throw new Exception('检查余额失败: ' . ($result['message'] ?? '未知错误'));
            }

            return (float) $result['data']['balance'];
        } catch (Exception $e) {
            throw new Exception('检查余额失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取告警消息前缀
     */
    protected function getAlertPrefix(): string
    {
        return 'TT API';
    }
}
