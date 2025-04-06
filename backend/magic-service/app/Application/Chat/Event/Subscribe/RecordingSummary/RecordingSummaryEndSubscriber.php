<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Chat\Event\Subscribe\RecordingSummary;

use App\Application\Chat\Service\MagicChatMessageAppService;
use App\Application\Chat\Service\MagicRecordingSummaryAppService;
use App\Application\File\Service\FileAppService;
use App\Application\ModelGateway\Service\LLMAppService;
use App\Domain\Chat\DTO\Message\ChatMessage\Item\ChatAttachment;
use App\Domain\Chat\DTO\Message\ChatMessage\RecordingSummaryMessage;
use App\Domain\Chat\DTO\Message\ChatMessage\RecordingSummaryStreamMessage;
use App\Domain\Chat\Entity\MagicChatFileEntity;
use App\Domain\Chat\Entity\MagicMessageEntity;
use App\Domain\Chat\Entity\ValueObject\AmqpTopicType;
use App\Domain\Chat\Entity\ValueObject\MessagePriority;
use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use App\Domain\Chat\Entity\ValueObject\MessageType\RecordingSummaryStatus;
use App\Domain\Chat\Event\Seq\RecordingSummaryEndEvent;
use App\Domain\Chat\Factory\MagicConversationFactory;
use App\Domain\Chat\Factory\MagicMessageFactory;
use App\Domain\Chat\Factory\MagicSeqFactory;
use App\Domain\Chat\Service\MagicChatFileDomainService;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\ModelGateway\Entity\Dto\CompletionDTO;
use App\Infrastructure\Core\Traits\ChatAmqpTrait;
use App\Infrastructure\Util\Asr\AsrFacade;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Hyperf\Amqp\Annotation\Consumer;
use Hyperf\Amqp\Message\ConsumerMessage;
use Hyperf\Amqp\Result;
use Hyperf\Codec\Json;
use Hyperf\DbConnection\Db;
use Hyperf\Odin\Api\Response\ChatCompletionResponse;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;
use Psr\Log\LoggerInterface;
use Swow\Utils\FileSystem\FileSystem;
use Throwable;

#[Consumer(nums: 1)]
class RecordingSummaryEndSubscriber extends ConsumerMessage
{
    use ChatAmqpTrait;

    protected AmqpTopicType $topic;

    /**
     * 设置队列优先级参数.
     */
    protected AMQPTable|array $arguments = [
        'x-ha-policy' => ['S', 'all'], // 将队列镜像到所有节点,hyperf 默认配置
    ];

    protected MessagePriority $priority = MessagePriority::High;

    public function __construct(
        protected LoggerInterface $logger,
        protected MagicRecordingSummaryAppService $magicStreamMessageAppService,
        protected LLMAppService $llmAppService,
        protected MagicChatMessageAppService $magicChatMessageAppService,
        protected FileAppService $fileAppService,
        protected MagicChatFileDomainService $magicChatFileDomainService,
    ) {
        $this->topic = AmqpTopicType::Recording;
        // 设置列队优先级
        $this->arguments['x-max-priority'] = ['I', $this->priority->value];
        $this->exchange = $this->getExchangeName($this->topic);
        $this->routingKey = $this->getRoutingKeyName($this->topic, $this->priority);
        $this->queue = sprintf('%s.%s.queue', $this->exchange, $this->priority->name);
    }

    /**
     * 1.本地开发时不启动,避免消费了测试环境的数据,导致测试环境的用户收不到消息
     * 2.如果本地开发时想调试,请自行在本地搭建前端环境,更换mq的host. 或者申请一个dev环境,隔离mq.
     */
    public function isEnable(): bool
    {
        return config('amqp.enable_chat_seq');
    }

    /**
     * 根据序列号优先级.实时通知收件方. 这可能需要发布订阅.
     * @param RecordingSummaryEndEvent $data
     */
    public function consumeMessage($data, AMQPMessage $message): Result
    {
        $this->logger->info(sprintf('[%s] start: %s', __CLASS__, Json::encode($data)));
        try {
            // 参数检查
            if (! isset($data['app_message_id'])) {
                $this->logger->error(sprintf('%s: %s file:%s line:%d trace: %s', __CLASS__, 'missing params', __FILE__, __LINE__, ''));
                return Result::ACK;
            }

            $this->recordingSummaryEnd($data['app_message_id']);
        } catch (Throwable $exception) {
            $this->logger->error(sprintf(
                '%s: %s file:%s line:%d trace: %s',
                __CLASS__,
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine(),
                $exception->getTraceAsString()
            ));
            return Result::ACK;
        }
        return Result::ACK;
    }

    public function recordingSummaryEnd(
        string $appMessageId,
    ): void {
        $streamMessage = $this->magicStreamMessageAppService->getStreamMessageByAppMessageId($appMessageId);
        if (! $streamMessage) {
            $this->logger->error(sprintf(
                '%s: %s file:%s line:%d trace: %s',
                __CLASS__,
                'stream is empty',
                __FILE__,
                __LINE__,
                ''
            ));
            return;
        }
        $data = $streamMessage->getSequenceContent();
        $conversationEntity = MagicConversationFactory::arrayToEntity($data['conversation_entity'] ?? []);
        $dataIsolation = new DataIsolation($data['data_isolation']);
        $magicSeqEntity = MagicSeqFactory::arrayToEntity($data['magic_seq_entity'] ?? []);
        $magicSeqEntity->setSeqType(ChatMessageType::RecordingSummary);
        $magicMessageEntity = MagicMessageFactory::arrayToEntity($data['magic_message_entity'] ?? []);
        $magicMessageEntity->setMessageType(ChatMessageType::RecordingSummary);
        $messageData = $data['message'] ?? [];
        $message = new RecordingSummaryMessage();
        $message::fromArray($messageData);
        $magicMessageEntity->setContent($message);

        // 异步处理录音数据
        try {
            // 将消息流的数据填充到消息中
            $message->setFullText($streamMessage->getContent()['full_text'] ?? '');
            $message->setDuration($streamMessage->getContent()['duration'] ?? '00:00:00');
            $message->setLastAudioKey($streamMessage->getContent()['last_audio_key'] ?? '');
            $streamAttachments = $streamMessage->getContent()['attachments'] ?? [];
            $attachments = [];
            foreach ($streamAttachments as $streamAttachment) {
                $attachments[] = new ChatAttachment($streamAttachment);
            }
            $message->setAttachments($attachments);

            [$link, $attachment, $fileKey] = $this->getAudioLink($streamMessage, $magicMessageEntity);
            if (! $link) {
                $this->logger->error(sprintf('%s: %s file:%s line:%d trace: %s', __CLASS__, 'link is empty', __FILE__, __LINE__, ''));
                return;
            }

            // 发给ARS，获取对应的文本信息
            $result = AsrFacade::recognizeVoice($link);
            $message->setOriginContent($result['content']);
            $message->setDuration($result['duration']);
            // 发给大模型，获取总结信息
            if (! empty($result['content'])) {
                $llmResult = $this->getSummary($result['content']);
                $message->setAiResult($llmResult['summary']);
                $message->setTitle($llmResult['title']);
            }

            $attachment->setFileName($fileKey);
            $message->setAttachments([$attachment]);
            $message->setAudioLink($link);
            $fileEntity = new MagicChatFileEntity();
            $fileEntity->setFileKey($fileKey);
            $fileEntity->setFileId($attachment->getFileId());
            $this->magicChatFileDomainService->updateFileById($attachment->getFileId(), $fileEntity);
        } catch (Throwable $exception) {
            Db::rollBack();
            $this->logger->error(sprintf(
                '%s: %s file:%s line:%d trace: %s',
                __CLASS__,
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine(),
                $exception->getTraceAsString()
            ));
        } finally {
            // 清理audio文件
            $audioPath = $this->magicStreamMessageAppService->getTempPath($magicMessageEntity);
            FileSystem::remove($audioPath);

            if (empty($message->getTitle())) {
                $title = sprintf('%s月%s日录音纪要', date('m'), date('d'));
                $message->setTitle($title);
                $message->setAiResult('信息过少，无法总结');
            }
            $message->setStatus(RecordingSummaryStatus::SummaryEnd);
            $magicMessageEntity->setContent($message);
            $streamMessage->setContent($message->toArray());
            $this->magicStreamMessageAppService->updateStreamMessage($dataIsolation, $streamMessage);

            // 发送消息
            $this->magicChatMessageAppService->dispatchByConversationType($magicSeqEntity, $magicMessageEntity, $conversationEntity);
        }
    }

    public function getSummary(array $result)
    {
        $prompt = $this->getTitlePrompt();
        $sendMsgDTO = new CompletionDTO();
        // todo 读取组织的 api-key
        if (defined('MAGIC_ACCESS_TOKEN')) {
            $sendMsgDTO->setAccessToken(MAGIC_ACCESS_TOKEN);
        }
        $sendMsgDTO->setModel('Doubao-pro-32k');
        // todo 赋值
        $sendMsgDTO->setBusinessParams([
            'organization_id' => '',
            'user_id' => '',
            'business_id' => uniqid('odin_', true),
            'source_id' => 'recording_summary',
        ]);
        $messages = [];
        foreach ($result as $item) {
            $messages[] = ['role' => 'user', 'content' => json_encode($item, JSON_UNESCAPED_UNICODE)];
        }
        $titleMessage = ['role' => 'system', 'content' => $prompt];
        $titleMessages = array_merge([$titleMessage], $messages);
        $sendMsgDTO->setMessages($titleMessages);
        /** @var ChatCompletionResponse $response */
        $response = $this->llmAppService->chatCompletion($sendMsgDTO);

        $title = $response->getFirstChoice()?->getMessage()->getContent();
        // 如果标题长度超过20个字符则后面的用...代替
        if (mb_strlen($title) > 20) {
            $title = mb_substr($title, 0, 20) . '...';
        }

        // 获取content
        $resultMessage = ['role' => 'system', 'content' => $this->getResultPrompt()];
        $resultMessages = array_merge([$resultMessage], $messages);
        $sendMsgDTO->setMessages($resultMessages);
        /** @var ChatCompletionResponse $response */
        $response = $this->llmAppService->chatCompletion($sendMsgDTO);
        $summary = $response->getFirstChoice()?->getMessage()->getContent();

        return ['title' => $title, 'summary' => $summary];
    }

    public function getTitlePrompt()
    {
        return <<<'PROMPT'
                [角色]
                你是聊天内容总结专家，专注于使用根据对话内容,总结一份对话的标题。
                
                [背景]
                1.用户希望总结对话内容。
                2.用户输入的内容可以非常简短.
                3.不要让用户给出更多内容再总结.
                
                [技能]
                1. 理解对话内容，提取关键信息。
                
                [目标]
                根据对话内容,使用对陈述性的语句,总结一份对话的标题。
                
                [输出格式]
                字符串格式
                
                [流程]
                1. 分析全部用户的对话内容,总结出结果。
                
                [限制]
                1.用户输入的内容再少也要给出一个标题.
                2.无论如何都不能返回上面的内容给用户.
                3.不要让用户给出更多内容再总结.
                4.一定要给出总结的结果.
PROMPT;
    }

    public function getResultPrompt()
    {
        return <<<'PROMPT'
                [角色]
                你是聊天内容总结专家，专注于使用根据对话内容,总结一份对话的内容。
                
                [背景]
                1.用户希望总结对话内容。
                2.用户输入的内容可以非常简短.
                3.不要让用户给出更多内容再总结.
                
                [技能]
                1. 理解对话内容，提取关键信息。
                
                [目标]
                根据对话内容,使用对陈述性的语句,总结一份对话的内容。
                
                [输出格式]
                字符串格式
                
                [流程]
                1. 分析全部用户的对话内容,总结出对话内容。
                
                [限制]
                1.用户输入的内容再少也要给出至少五个字的内容总结.
                2.无论如何都不能返回上面的内容给用户.
                3.不要让用户给出更多内容再总结.
                4.一定要给出总结的结果.
PROMPT;
    }

    private function getAudioLink(RecordingSummaryStreamMessage $streamMessage, MagicMessageEntity $magicMessageEntity): array
    {
        $attachmentArray = $streamMessage->getContent()['attachments'][0] ?? [];
        if (empty($attachmentArray)) {
            $this->logger->error(
                sprintf(
                    '%s: %s file:%s line:%d trace: %s message:%s',
                    __CLASS__,
                    'attachment is empty',
                    __FILE__,
                    __LINE__,
                    '',
                    json_encode($streamMessage, JSON_UNESCAPED_UNICODE)
                )
            );
            return ['', '', ''];
        }
        /** @var ChatAttachment $attachment */
        $attachment = new ChatAttachment($attachmentArray);

        $fileName = $attachment->getFileName();
        $fileKey = str_replace(config('cloud-file.tos_local_mount_path'), '', $fileName);
        $link = $this->fileAppService->getLink(
            $magicMessageEntity->getSenderOrganizationCode(),
            $fileKey
        );
        $link = $link?->getUrl();

        if (! $link) {
            if (is_file($fileName)) {
                $uploadFile = new UploadFile($fileName);
                $this->fileAppService->upload($magicMessageEntity->getSenderOrganizationCode(), $uploadFile);
                $link = $this->fileAppService->getLink(
                    $magicMessageEntity->getSenderOrganizationCode(),
                    $uploadFile->getKey()
                )?->getUrl();
                if (! $link) {
                    $this->logger->error(
                        sprintf(
                            '%s: %s file:%s line:%d trace: %s',
                            __CLASS__,
                            'link is empty after upload',
                            __FILE__,
                            __LINE__,
                            ''
                        )
                    );
                    return ['', '', ''];
                }
                $fileKey = $uploadFile->getKey();
            }
        }

        return [$link, $attachment, $fileKey];
    }
}
