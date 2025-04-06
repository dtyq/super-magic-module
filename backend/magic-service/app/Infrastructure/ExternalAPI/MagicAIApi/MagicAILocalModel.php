<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\ExternalAPI\MagicAIApi;

use App\Application\ModelGateway\Service\LLMAppService;
use App\Domain\ModelGateway\Entity\Dto\CompletionDTO;
use App\Domain\ModelGateway\Entity\Dto\EmbeddingsDTO;
use Hyperf\Odin\Api\Providers\OpenAI\OpenAI;
use Hyperf\Odin\Api\Providers\OpenAI\OpenAIConfig;
use Hyperf\Odin\Api\Response\ChatCompletionResponse;
use Hyperf\Odin\Api\Response\ChatCompletionStreamResponse;
use Hyperf\Odin\Api\Response\EmbeddingResponse;
use Hyperf\Odin\Api\Response\TextCompletionResponse;
use Hyperf\Odin\Contract\Api\ClientInterface;
use Hyperf\Odin\Contract\Message\MessageInterface;
use Hyperf\Odin\Contract\Model\EmbeddingInterface;
use Hyperf\Odin\Contract\Model\ModelInterface;
use Hyperf\Odin\Model\AbstractModel;
use Hyperf\Odin\Utils\ToolUtil;
use Psr\Log\LoggerInterface;

class MagicAILocalModel extends AbstractModel implements ModelInterface, EmbeddingInterface
{
    private string $accessToken;

    public function __construct(
        protected string $model,
        protected array $config,
        protected ?LoggerInterface $logger = null
    ) {
        $this->accessToken = defined('MAGIC_ACCESS_TOKEN') ? MAGIC_ACCESS_TOKEN : ($this->config['access_token'] ?? '');
        parent::__construct($this->model, $this->config, $this->logger);
    }

    public function embeddings(array|string $input, ?string $encoding_format = 'float', ?string $user = null, array $businessParams = []): EmbeddingResponse
    {
        $this->checkEmbeddingSupport();
        $sendMsgGPTDTO = new EmbeddingsDTO();
        $sendMsgGPTDTO->setModel($this->model);
        $sendMsgGPTDTO->setInput($input);
        $sendMsgGPTDTO->setAccessToken($this->accessToken);
        $sendMsgGPTDTO->setUser($user);
        $sendMsgGPTDTO->setBusinessParams($businessParams);
        return di(LLMAppService::class)->embeddings($sendMsgGPTDTO);
    }

    /**
     * @param MessageInterface[] $messages
     */
    public function chatStream(
        array $messages,
        float $temperature = 0.9,
        int $maxTokens = 0,
        array $stop = [],
        array $tools = [],
        float $frequencyPenalty = 0.0,
        float $presencePenalty = 0.0,
        array $businessParams = [],
    ): ChatCompletionStreamResponse {
        $this->checkFunctionCallSupport($tools);
        $this->checkMultiModalSupport($messages);
        return $this->modelChat($messages, $temperature, $maxTokens, $stop, $tools, $businessParams, true);
    }

    /**
     * @param MessageInterface[] $messages
     */
    public function chat(
        array $messages,
        float $temperature = 0.9,
        int $maxTokens = 0,
        array $stop = [],
        array $tools = [],
        float $frequencyPenalty = 0.0,
        float $presencePenalty = 0.0,
        array $businessParams = [],
    ): ChatCompletionResponse {
        $this->checkFunctionCallSupport($tools);
        $this->checkMultiModalSupport($messages);
        return $this->modelChat($messages, $temperature, $maxTokens, $stop, $tools, $businessParams);
    }

    public function completions(string $prompt, float $temperature = 0.9, int $maxTokens = 0, array $stop = [], float $frequencyPenalty = 0.0, float $presencePenalty = 0.0, array $businessParams = []): TextCompletionResponse
    {
        $sendMsgGPTDTO = new CompletionDTO();
        $sendMsgGPTDTO->setAccessToken($this->accessToken);
        $sendMsgGPTDTO->setModel($this->model);
        $sendMsgGPTDTO->setTemperature($temperature);
        $sendMsgGPTDTO->setPrompt($prompt);
        $sendMsgGPTDTO->setStop($stop);
        $sendMsgGPTDTO->setMaxTokens($maxTokens);
        $sendMsgGPTDTO->setBusinessParams($businessParams);

        return di(LLMAppService::class)->chatCompletion($sendMsgGPTDTO);
    }

    public function getModelName(): string
    {
        return $this->model;
    }

    public function getVectorSize(): int
    {
        return 1536;
    }

    protected function getClient(): ClientInterface
    {
        $config = $this->config;
        $this->processApiBaseUrl($config);

        $openAI = new OpenAI();
        $config = new OpenAIConfig(
            apiKey: $config['access_token'] ?? '',
            organization: '',
            baseUrl: 'http://127.0.0.1:9501',
        );
        return $openAI->getClient($config, $this->getApiRequestOptions(), $this->logger);
    }

    private function modelChat(
        array $messages,
        float $temperature = 0.9,
        int $maxTokens = 0,
        array $stop = [],
        array $tools = [],
        array $businessParams = [],
        bool $stream = false,
    ): ChatCompletionResponse|ChatCompletionStreamResponse {
        $messageList = [];
        foreach ($messages as $message) {
            if (! $message instanceof MessageInterface) {
                continue;
            }
            $messageList[] = $message->toArray();
        }
        $sendMsgGPTDTO = new CompletionDTO();
        $sendMsgGPTDTO->setAccessToken($this->accessToken);
        $sendMsgGPTDTO->setModel($this->model);
        $sendMsgGPTDTO->setTemperature($temperature);
        $sendMsgGPTDTO->setTools(ToolUtil::filter($tools));
        $sendMsgGPTDTO->setStop($stop);
        $sendMsgGPTDTO->setMaxTokens($maxTokens);
        $sendMsgGPTDTO->setMessages($messageList);
        $sendMsgGPTDTO->setStream($stream);
        $sendMsgGPTDTO->setBusinessParams($businessParams);

        return di(LLMAppService::class)->chatCompletion($sendMsgGPTDTO);
    }
}
