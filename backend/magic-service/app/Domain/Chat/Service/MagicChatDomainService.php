<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Service;

use App\Application\Chat\Event\Publish\MessagePushPublisher;
use App\Domain\Chat\DTO\Message\StreamMessage\StreamCachedDTO;
use App\Domain\Chat\DTO\Message\StreamMessage\StreamMessageStatus;
use App\Domain\Chat\DTO\Message\StreamMessage\StreamOptions;
use App\Domain\Chat\DTO\Message\StreamMessageInterface;
use App\Domain\Chat\DTO\Message\TextContentInterface;
use App\Domain\Chat\DTO\MessagesQueryDTO;
use App\Domain\Chat\DTO\Response\ClientSequenceResponse;
use App\Domain\Chat\Entity\Items\ReceiveList;
use App\Domain\Chat\Entity\Items\SeqExtra;
use App\Domain\Chat\Entity\MagicConversationEntity;
use App\Domain\Chat\Entity\MagicMessageEntity;
use App\Domain\Chat\Entity\MagicSeqEntity;
use App\Domain\Chat\Entity\MagicTopicEntity;
use App\Domain\Chat\Entity\ValueObject\ConversationStatus;
use App\Domain\Chat\Entity\ValueObject\ConversationType;
use App\Domain\Chat\Entity\ValueObject\MagicMessageStatus;
use App\Domain\Chat\Entity\ValueObject\MessagePriority;
use App\Domain\Chat\Entity\ValueObject\MessageType\ChatMessageType;
use App\Domain\Chat\Entity\ValueObject\SocketEventType;
use App\Domain\Chat\Event\Seq\SeqCreatedEvent;
use App\Domain\Contact\Entity\MagicUserEntity;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Contact\Entity\ValueObject\UserType;
use App\ErrorCode\ChatErrorCode;
use App\ErrorCode\UserErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\IdGenerator\IdGenerator;
use App\Interfaces\Chat\Assembler\PageListAssembler;
use App\Interfaces\Chat\Assembler\SeqAssembler;
use Hyperf\Codec\Json;
use Hyperf\DbConnection\Db;
use Hyperf\SocketIOServer\Socket;
use Throwable;

use function Hyperf\Coroutine\co;

/**
 * 处理聊天消息相关.
 */
class MagicChatDomainService extends AbstractDomainService
{
    /**
     * 加入房间.
     */
    public function login(string $accountId, Socket $socket): void
    {
        $socket->join($accountId);
        $this->logger->info(__METHOD__ . sprintf(' login accountId:%s sid:%s', $accountId, $socket->getSid()));
    }

    public function getUserInfo(string $userId): MagicUserEntity
    {
        $receiverInfo = $this->magicUserRepository->getUserById($userId);
        if ($receiverInfo === null) {
            ExceptionBuilder::throw(UserErrorCode::USER_NOT_EXIST);
        }
        return $receiverInfo;
    }

    /**
     * 返回最大消息的倒数 n 条序列.
     * @return ClientSequenceResponse[]
     * @deprecated
     */
    public function pullMessage(DataIsolation $dataIsolation, array $params): array
    {
        // 检查用户本地 seq 和服务端 seq 的差异
        $seqID = (int) $params['max_seq_info']['user_local_seq_id'];
        // 返回最近的 N 条消息
        return $this->magicSeqRepository->getAccountSeqListByMagicId($dataIsolation, $seqID, 50);
    }

    /**
     * 返回最大消息的倒数 n 条序列.
     * @return ClientSequenceResponse[]
     */
    public function pullByPageToken(DataIsolation $dataIsolation, array $params, int $pageSize): array
    {
        // 检查用户本地 seq 和服务端 seq 的差异
        $seqID = (int) $params['page_token'];
        // 返回最近的 N 条消息
        $clientSeqList = $this->magicSeqRepository->getAccountSeqListByMagicId($dataIsolation, $seqID, $pageSize);
        $data = [];
        foreach ($clientSeqList as $clientSeq) {
            $data[$clientSeq->getSeq()->getSeqId()] = $clientSeq->toArray();
        }
        $hasMore = count($clientSeqList) === $pageSize;
        $pageToken = (string) array_key_first($data);
        return PageListAssembler::pageByElasticSearch(array_values($data), $pageToken, $hasMore);
    }

    /**
     * 根据 app_message_id 拉取消息.
     * @return ClientSequenceResponse[]
     */
    public function pullByAppMessageId(DataIsolation $dataIsolation, string $appMessageId, string $pageToken, int $pageSize): array
    {
        $clientSeqList = $this->magicSeqRepository->getAccountSeqListByAppMessageId($dataIsolation, $appMessageId, $pageToken, $pageSize);
        $data = [];
        foreach ($clientSeqList as $clientSeq) {
            $data[$clientSeq->getSeq()->getSeqId()] = $clientSeq->toArray();
        }
        $hasMore = count($clientSeqList) === $pageSize;
        $pageToken = (string) array_key_first($data);
        return PageListAssembler::pageByElasticSearch(array_values($data), $pageToken, $hasMore);
    }

    /**
     * 返回最大消息的倒数 n 条序列.
     * @return ClientSequenceResponse[]
     */
    public function pullRecentMessage(DataIsolation $dataIsolation, MessagesQueryDTO $messagesQueryDTO): array
    {
        // 检查用户本地 seq 和服务端 seq 的差异
        $seqId = (int) $messagesQueryDTO->getPageToken();
        $pageSize = 200;
        // 返回最近的 N 条消息
        $clientSeqList = $this->magicSeqRepository->pullRecentMessage($dataIsolation, $seqId, $pageSize);
        $data = [];
        foreach ($clientSeqList as $clientSeq) {
            $data[$clientSeq->getSeq()->getSeqId()] = $clientSeq->toArray();
        }
        $pageToken = (string) array_key_first($data);
        return PageListAssembler::pageByElasticSearch(array_values($data), $pageToken);
    }

    public function getConversationById(string $conversationId): ?MagicConversationEntity
    {
        // 从会话 id中解析 接收方类型和接收方 id
        return $this->magicConversationRepository->getConversationById($conversationId);
    }

    /**
     * 系统稳定性保障模块之一:消息优先级的确定
     * 优先级规则:
     * 1.私聊/100人以内的群聊,优先级最高
     * 2.系统应用消息,高优先级
     * 3.api消息(第三方调用生成)/100~1000人群聊,中优先级
     * 4.控制消息/1000人以上的群聊,最低优先级.
     * 5.部分控制消息与聊天强相关的,可以把优先级提到高. 比如会话窗口的创建.
     */
    public function getChatMessagePriority(ConversationType $conversationType, ?int $receiveUserCount = 1): MessagePriority
    {
        return match ($conversationType) {
            ConversationType::User => MessagePriority::Highest,
            ConversationType::CloudDocument, ConversationType::MultidimensionalTable => MessagePriority::High,
            ConversationType::System, ConversationType::App => MessagePriority::Medium,
            ConversationType::Group => match (true) {
                $receiveUserCount <= 100 => MessagePriority::Highest,
                $receiveUserCount <= 500 => MessagePriority::Medium,
                default => MessagePriority::Low,
            },
            default => MessagePriority::Low,
        };
    }

    /**
     * 如果用户给ai发送了多条消息,ai回复时,需要让用户知晓ai回复的是他的哪条消息.
     */
    public function aiReferMessage(MagicSeqEntity $aiSeqDTO, bool $doNotParseReferMessageId = false): MagicSeqEntity
    {
        $aiReferMessageId = $aiSeqDTO->getReferMessageId();
        $aiConversationId = $aiSeqDTO->getConversationId();
        if (empty($aiReferMessageId) || empty($aiConversationId) || $doNotParseReferMessageId) {
            return $aiSeqDTO;
        }
        // 清除无效的引用消息
        $aiSeqDTO->setReferMessageId('');
        // 反查用户与ai的会话窗口
        $aiConversationEntity = $this->getConversationById($aiConversationId);
        if ($aiConversationEntity === null) {
            return $aiSeqDTO;
        }
        # ai 回复时引用消息的规则:
        // 1. 本次回复前,用户连续发了2条及以上的消息
        // 2. 算上本次回复.ai连续发了2条及以上的消息
        $conversationMessagesQueryDTO = new MessagesQueryDTO();
        $conversationMessagesQueryDTO->setConversationId($aiConversationEntity->getId())->setLimit(2)->setTopicId($aiSeqDTO->getExtra()?->getTopicId());
        $messages = $this->getConversationChatMessages($aiConversationEntity->getId(), $conversationMessagesQueryDTO);
        $userSendCount = 0;
        $aiSendCount = 1;
        // 消息是会话窗口展示的倒序
        foreach ($messages as $message) {
            $senderMessageId = $message->getSeq()->getSenderMessageId();
            if (! empty($senderMessageId)) {// 对方发送的
                ++$userSendCount;
                $aiSendCount = max(0, $aiSendCount - 1);
            }

            if (empty($senderMessageId)) {// ai自己发送的
                ++$aiSendCount;
            }
            if ($userSendCount >= 2 || $aiSendCount >= 2) {
                $aiSeqDTO->setReferMessageId($aiReferMessageId);
            }
        }
        return $aiSeqDTO;
    }

    public function getChatSeqCreatedEvent(ConversationType $receiveType, string $seqId, int $receiveUserCount): SeqCreatedEvent
    {
        $messagePriority = $this->getChatMessagePriority($receiveType, $receiveUserCount);
        $seqCreatedEvent = new SeqCreatedEvent([$seqId]);
        $seqCreatedEvent->setPriority($messagePriority);
        return $seqCreatedEvent;
    }

    /**
     * 通知收件方有新消息(收件方可能是自己,或者是chat对象).
     * @todo 考虑对 seqIds 合并同类项,减少push次数,减轻网络/mq/服务器压力
     */
    public function pushChatSequence(SeqCreatedEvent $seqCreatedEvent): void
    {
        // 投递消息
        $seqCreatedPublisher = new MessagePushPublisher($seqCreatedEvent);
        if (! $this->producer->produce($seqCreatedPublisher)) {
            // 允许失败
            $this->logger->error('pushMessage failed message:' . Json::encode($seqCreatedEvent));
        }
    }

    /**
     * 生成收件方的消息序列.
     */
    public function generateReceiveSequenceByChatMessage(
        MagicSeqEntity $senderSeqEntity,
        MagicMessageEntity $messageEntity,
        MagicMessageStatus $seqStatus = MagicMessageStatus::Unread
    ): MagicSeqEntity {
        if (empty($messageEntity->getMagicMessageId())) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR);
        }
        $time = date('Y-m-d H:i:s');
        // 需要按收件人的身份去查询会话窗口id
        $receiveConversationDTO = new MagicConversationEntity();
        $receiveConversationDTO->setUserId($messageEntity->getReceiveId());
        $receiveConversationDTO->setUserOrganizationCode($messageEntity->getReceiveOrganizationCode());
        $receiveConversationDTO->setReceiveId($messageEntity->getSenderId());
        $receiveConversationDTO->setReceiveType($messageEntity->getSenderType());
        $receiveConversationDTO->setReceiveOrganizationCode($messageEntity->getSenderOrganizationCode());

        $receiveConversationEntity = $this->magicConversationRepository->getConversationByUserIdAndReceiveId($receiveConversationDTO);
        if ($receiveConversationEntity === null) {
            // 自动为收件人创建会话窗口,但不用触发收件人的窗口打开事件
            $receiveConversationEntity = $this->magicConversationRepository->addConversation($receiveConversationDTO);
        }
        // 如果收件方已经隐藏了这个会话窗口，改为正常
        if ($receiveConversationEntity->getStatus() !== ConversationStatus::Normal) {
            $this->magicConversationRepository->updateConversationById(
                $receiveConversationEntity->getId(),
                [
                    'status' => ConversationStatus::Normal->value,
                ]
            );
        }
        $receiveConversationId = $receiveConversationEntity->getId();
        $receiveUserEntity = $this->getUserInfo($messageEntity->getReceiveId());
        // 由于一条消息,在2个会话窗口渲染时,会生成2个消息id,因此需要解析出来收件方能看到的消息引用的id.
        $receiverSeqList = $this->getReceiverReferMessageId($senderSeqEntity);
        $receiverReferMessageId = $receiverSeqList[$receiveUserEntity->getMagicId()] ?? '';
        $seqId = (string) IdGenerator::getSnowId();
        // 节约存储空间,聊天消息在seq表不存具体内容,只存消息id
        $content = $this->getSeqContent($messageEntity);
        $receiveAccountId = $this->getAccountId($messageEntity->getReceiveId());
        // 根据发送方的 extra,生成接收方对应的 extra
        $extra = $this->handlerReceiveExtra($senderSeqEntity, $receiveConversationEntity);
        $seqData = [
            'id' => $seqId,
            'organization_code' => $messageEntity->getReceiveOrganizationCode(),
            'object_type' => $messageEntity->getReceiveType()->value,
            'object_id' => $receiveAccountId,
            'seq_id' => $seqId,
            'seq_type' => $messageEntity->getMessageType()->getName(),
            // 收件方的content不需要记录未读/已读/已查看列表
            'content' => $content,
            'receive_list' => '',
            'magic_message_id' => $messageEntity->getMagicMessageId(),
            'message_id' => $seqId,
            'refer_message_id' => $receiverReferMessageId,
            'sender_message_id' => $senderSeqEntity->getMessageId(), // 判断控制消息类型,如果是已读/撤回/编辑/引用,需要解析出来引用的id
            'conversation_id' => $receiveConversationId,
            'status' => $seqStatus->value,
            'created_at' => $time,
            'updated_at' => $time,
            'extra' => isset($extra) ? $extra->toArray() : [],
            'app_message_id' => $messageEntity->getAppMessageId(),
        ];
        return $this->magicSeqRepository->createSequence($seqData);
    }

    /**
     * 由于存在序列号合并/删除的场景,所以不需要保证序列号的连续性.
     */
    public function generateSenderSequenceByChatMessage(MagicSeqEntity $seqDTO, MagicMessageEntity $messageEntity, ?MagicConversationEntity $conversationEntity): MagicSeqEntity
    {
        if (empty($messageEntity->getMagicMessageId())) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR);
        }
        $time = date('Y-m-d H:i:s');
        $conversationId = $conversationEntity === null ? '' : $conversationEntity->getId();
        // 节约存储空间,聊天消息在seq表不存具体内容,只存消息id
        $content = $this->getSeqContent($messageEntity);
        $receiveList = new ReceiveList();
        if ($conversationEntity) {
            $unreadList = $this->getUnreadList($conversationEntity);
            $receiveList->setUnreadList($unreadList);
        }
        $senderAccountId = $this->getAccountId($messageEntity->getSenderId());
        $seqId = (string) IdGenerator::getSnowId();
        $seqData = [
            'id' => $seqId,
            'organization_code' => $messageEntity->getSenderOrganizationCode(),
            'object_type' => $messageEntity->getSenderType()->value,
            'object_id' => $senderAccountId,
            'seq_id' => $seqId,
            'seq_type' => $messageEntity->getMessageType()->getName(),
            // 聊天消息的seq只记录未读/已读/已查看列表
            'content' => $content,
            // 接收人列表
            'receive_list' => $receiveList->toArray(),
            'magic_message_id' => $messageEntity->getMagicMessageId(),
            'message_id' => $seqId,
            'refer_message_id' => $seqDTO->getReferMessageId(), // 判断控制消息类型,如果是已读/撤回/编辑/引用,需要解析出来引用的id
            'sender_message_id' => '', // 判断控制消息类型,如果是已读/撤回/编辑/引用,需要解析出来引用的id
            'conversation_id' => $conversationId,
            'status' => MagicMessageStatus::Read, // 自己发送的消息,不需要判断阅读状态
            'created_at' => $time,
            'updated_at' => $time,
            'extra' => (array) $seqDTO->getExtra()?->toArray(),
            'app_message_id' => $seqDTO->getAppMessageId() ?: $messageEntity->getAppMessageId(),
        ];
        return $this->magicSeqRepository->createSequence($seqData);
    }

    /**
     * @return ClientSequenceResponse[]
     */
    public function getConversationChatMessages(string $conversationId, MessagesQueryDTO $messagesQueryDTO): array
    {
        if (empty($messagesQueryDTO->getConversationId())) {
            $messagesQueryDTO->setConversationId($conversationId);
        }
        $timeStart = $messagesQueryDTO->getTimeStart();
        $timeEnd = $messagesQueryDTO->getTimeEnd();
        $conversationEntity = $this->magicConversationRepository->getConversationById($conversationId);
        if ($conversationEntity === null) {
            ExceptionBuilder::throw(ChatErrorCode::CONVERSATION_NOT_FOUND);
        }
        if ($messagesQueryDTO->getLimit() > 1000) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR, 'chat.common.param_error', ['param' => 'limit']);
        }
        if (isset($timeEnd, $timeStart) && $timeEnd->lessThanOrEqualTo($timeStart)) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR, 'chat.common.param_error', ['param' => 'timeEnd']);
        }
        if ($messagesQueryDTO->getTopicId() === null) {
            // 获取会话窗口的所有消息. 有话题 + 没有话题
            return $this->magicSeqRepository->getConversationChatMessages($messagesQueryDTO);
        }
        if ($messagesQueryDTO->getTopicId() === '') {
            // todo 获取本会话窗口中,不包含任何话题的消息.
            return $this->magicSeqRepository->getConversationChatMessages($messagesQueryDTO);
        }
        return $this->magicChatTopicRepository->getTopicMessages($messagesQueryDTO);
    }

    /**
     * @return ClientSequenceResponse[]
     * @deprecated
     */
    public function getConversationsChatMessages(MessagesQueryDTO $messagesQueryDTO): array
    {
        $conversationEntities = $this->magicConversationRepository->getConversationByIds($messagesQueryDTO->getConversationIds());
        if (empty($conversationEntities)) {
            ExceptionBuilder::throw(ChatErrorCode::CONVERSATION_NOT_FOUND);
        }
        if ($messagesQueryDTO->getLimit() > 1000) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR, 'chat.common.param_error', ['param' => 'limit']);
        }
        // todo 获取本会话窗口中,不包含任何话题的消息.
        return $this->magicSeqRepository->getConversationsChatMessages($messagesQueryDTO, $messagesQueryDTO->getConversationIds());
    }

    /**
     * 按会话 id 分组获取几条最新消息.
     * @return ClientSequenceResponse[]
     */
    public function getConversationsMessagesGroupById(MessagesQueryDTO $messagesQueryDTO): array
    {
        $conversationEntities = $this->magicConversationRepository->getConversationByIds($messagesQueryDTO->getConversationIds());
        if (empty($conversationEntities)) {
            ExceptionBuilder::throw(ChatErrorCode::CONVERSATION_NOT_FOUND);
        }
        if ($messagesQueryDTO->getLimit() > 100) {
            ExceptionBuilder::throw(ChatErrorCode::INPUT_PARAM_ERROR, 'chat.common.param_error', ['param' => 'limit']);
        }
        return $this->magicSeqRepository->getConversationsMessagesGroupById($messagesQueryDTO, $messagesQueryDTO->getConversationIds());
    }

    public function getTopicsByConversationId(DataIsolation $dataIsolation, string $conversationId, array $topicIds): array
    {
        $conversationEntity = $this->magicConversationRepository->getConversationById($conversationId);
        if ($conversationEntity === null || $conversationEntity->getUserId() !== $dataIsolation->getCurrentUserId()) {
            return [];
        }
        $topicEntities = $this->magicChatTopicRepository->getTopicsByConversationId($conversationEntity->getId(), $topicIds);
        // 将时间转为时间戳
        $topics = [];
        foreach ($topicEntities as &$topic) {
            $topic = $topic->toArray();
            $topic['id'] = (string) $topic['topic_id'];
            $topic['created_at'] = strtotime($topic['created_at']);
            $topic['updated_at'] = strtotime($topic['updated_at']);
            unset($topic['topic_id']);
            $topics[] = $topic;
        }
        return $topics;
    }

    /**
     * 分发群会话创建消息.
     * 群聊场景,批量生成消息序列号.
     * 由于存在序列号合并/删除的场景,所以不需要保证序列号的连续性.
     * @return MagicSeqEntity[]
     * @throws Throwable
     */
    public function generateGroupReceiveSequence(
        MagicSeqEntity $senderSeqEntity,
        MagicMessageEntity $messageEntity,
        MagicMessageStatus $seqStatus = MagicMessageStatus::Unread
    ): array {
        if (! $senderSeqEntity->getSeqType() instanceof ChatMessageType) {
            $this->logger->error(sprintf('messageDispatch 分发群聊消息失败,原因:非聊天消息 senderSeqEntity:%s', Json::encode($senderSeqEntity->toArray())));
            return [];
        }
        // 根据会话id查询一下群信息
        $conversationEntity = $this->magicConversationRepository->getConversationById($senderSeqEntity->getConversationId());
        if ($conversationEntity === null || $conversationEntity->getReceiveType() !== ConversationType::Group) {
            $this->logger->error(sprintf(
                'messageDispatch 会话为空或者不是群聊 $senderSeqEntity:%s $conversationEntity:%s',
                Json::encode($senderSeqEntity->toArray()),
                Json::encode($conversationEntity?->toArray() ?? [])
            ));
            return [];
        }
        $groupId = $conversationEntity->getReceiveId();
        $groupEntity = $this->magicGroupRepository->getGroupInfoById($groupId);
        if ($groupEntity === null) {
            $this->logger->error(sprintf(
                'messageDispatch  群组为空 $senderSeqEntity:%s $groupEntity:%s',
                Json::encode($senderSeqEntity->toArray()),
                Json::encode($senderSeqEntity->toArray())
            ));
            return [];
        }
        try {
            Db::beginTransaction();
            // 获取 除发送者以外的 所有群成员. (因为发送者的 seq 已经另外生成,单独推送)
            $groupUsers = $this->magicGroupRepository->getGroupUserList($groupId, '');
            $groupUsers = array_column($groupUsers, null, 'user_id');
            $senderUserId = $messageEntity->getSenderId();
            unset($groupUsers[$senderUserId]);
            // 获取成员的magic_id
            $userIds = array_values(array_keys($groupUsers));
            $users = $this->magicUserRepository->getUserByIds($userIds);
            $users = array_column($users, null, 'user_id');
            // 批量获取群成员的会话信息
            $groupUserConversations = $this->magicConversationRepository->batchGetConversations($userIds, $groupEntity->getId(), ConversationType::Group);
            $groupUserConversations = array_column($groupUserConversations, null, 'user_id');
            // 找到被隐藏的会话，更改状态
            $this->handlerGroupReceiverConversation($groupUserConversations);
            // 这条消息是否有引用其他消息
            $magicMessageSeqList = $this->getReceiverReferMessageId($senderSeqEntity);
            // 给这些群成员批量生成聊天消息的 seq. 对于万人群,应该每批一千条seq.
            $seqListCreateDTO = [];
            foreach ($groupUsers as $groupUser) {
                $user = $users[$groupUser['user_id']] ?? null;
                if (empty($groupUser['user_id']) || empty($users[$groupUser['user_id']]) || empty($user['magic_id'])) {
                    $this->logger->error(sprintf(
                        'messageDispatch handlerConversationCreated 群成员没有匹配到 $groupUser:%s $users:%s seq:%s',
                        Json::encode($groupUser),
                        Json::encode($users),
                        Json::encode($senderSeqEntity->toArray())
                    ));
                    continue;
                }

                $receiveUserConversationEntity = $groupUserConversations[$groupUser['user_id']] ?? null;
                if (empty($receiveUserConversationEntity)) {
                    $this->logger->error(sprintf(
                        'messageDispatch handlerConversationCreated 群成员的会话不存在 $groupUser:%s $users:%s seq:%s userConversation:%s',
                        Json::encode($groupUser),
                        Json::encode($users),
                        Json::encode($senderSeqEntity->toArray()),
                        Json::encode($receiveUserConversationEntity)
                    ));
                    continue;
                }
                // 多个参数都放在DTO里处理
                $receiveSeqDTO = clone $senderSeqEntity;
                $receiveSeqDTO->setReferMessageId($magicMessageSeqList[$user['magic_id']] ?? '');
                // 根据发件方的 seq,为群聊的每个成员生成 seq
                $seqEntity = $this->generateGroupSeqEntityByChatSeq(
                    $user,
                    $receiveUserConversationEntity,
                    $receiveSeqDTO,
                    $messageEntity,
                    $seqStatus
                );
                $seqListCreateDTO[$seqEntity->getId()] = $seqEntity;
            }
            # 批量生成 seq
            if (! empty($seqListCreateDTO)) {
                $seqListCreateDTO = $this->magicSeqRepository->batchCreateSeq($seqListCreateDTO);
            }
            Db::commit();
        } catch (Throwable$exception) {
            Db::rollBack();
            throw $exception;
        }

        return $seqListCreateDTO;
    }

    /**
     * 根据已经存在的聊天相关 seqEntity,给群成员生成会话窗口.
     */
    public function generateGroupSeqEntityByChatSeq(
        array $userEntity,
        MagicConversationEntity $receiveUserConversationEntity,
        MagicSeqEntity $receiveSeqDTO,
        MagicMessageEntity $messageEntity,
        MagicMessageStatus $seqStatus = MagicMessageStatus::Unread,
    ): MagicSeqEntity {
        $time = date('Y-m-d H:i:s');
        $content = $this->getSeqContent($messageEntity);
        $seqId = (string) IdGenerator::getSnowId();
        // 节约存储空间,聊天消息在seq表不存具体内容,只存消息id
        // 根据发送方的 extra,生成接收方对应的 extra
        $extra = $this->handlerReceiveExtra($receiveSeqDTO, $receiveUserConversationEntity);
        $seqData = [
            'id' => $seqId,
            'organization_code' => $userEntity['organization_code'],
            'object_type' => $userEntity['user_type'],
            'object_id' => $userEntity['magic_id'],
            'seq_id' => $seqId,
            'seq_type' => $receiveSeqDTO->getSeqType()->value,
            // 收件方的content不需要记录未读/已读/已查看列表
            'content' => $content,
            'receive_list' => '',
            'magic_message_id' => $messageEntity->getMagicMessageId(),
            'message_id' => $seqId,
            'refer_message_id' => $receiveSeqDTO->getReferMessageId(),
            'sender_message_id' => $receiveSeqDTO->getMessageId(), // 判断控制消息类型,如果是已读/撤回/编辑/引用,需要解析出来引用的id
            'conversation_id' => $receiveUserConversationEntity->getId(),
            'status' => $seqStatus->value,
            'created_at' => $time,
            'updated_at' => $time,
            'extra' => isset($extra) ? $extra->toArray() : [],
            'app_message_id' => $messageEntity->getAppMessageId(),
        ];
        return SeqAssembler::getSeqEntity($seqData);
    }

    public function getMessageReceiveList(string $messageId, DataIsolation $dataIsolation): array
    {
        $seq = $this->magicSeqRepository->getMessageReceiveList($messageId, $dataIsolation->getCurrentMagicId(), ConversationType::User);
        $receiveList = $seq['receive_list'] ?? '{}';
        $receiveList = Json::decode($receiveList);
        return [
            'unseen_list' => $receiveList['unread_list'] ?? [],
            'seen_list' => $receiveList['seen_list'] ?? [],
            'read_list' => $receiveList['read_list'] ?? [],
        ];
    }

    /**
     * 给AI助理用的方法，包含了过滤ai卡片消息的逻辑.
     */
    public function getLLMContentForAgent(string $conversationId, string $topicId): array
    {
        $conversationEntity = $this->getConversationById($conversationId);
        if ($conversationEntity === null) {
            return [];
        }
        $userEntity = $this->getUserInfo($conversationEntity->getUserId());
        // 确定自己发送消息的角色类型. 只有当自己是 ai 时，自己发送的消息才是 assistant。（两个 ai 互相对话暂不考虑）
        if ($userEntity->getUserType() === UserType::Ai) {
            $selfSendMessageRoleType = 'assistant';
            $otherSendMessageRoleType = 'user';
        } else {
            $selfSendMessageRoleType = 'user';
            $otherSendMessageRoleType = 'assistant';
        }
        // 组装大模型的消息请求
        $messagesQueryDTO = new MessagesQueryDTO();
        $messagesQueryDTO->setConversationId($conversationId)->setLimit(200)->setTopicId($topicId);
        // 获取话题的最近 20 条对话记录
        $clientSeqResponseDTOS = $this->getConversationChatMessages($conversationId, $messagesQueryDTO);

        $userMessages = [];
        foreach ($clientSeqResponseDTOS as $clientSeqResponseDTO) {
            // 确定消息的角色类型
            if (empty($clientSeqResponseDTO->getSeq()->getSenderMessageId())) {
                $roleType = $selfSendMessageRoleType;
            } else {
                $roleType = $otherSendMessageRoleType;
            }
            $message = $clientSeqResponseDTO->getSeq()->getMessage()->getContent();
            // 暂时只解决处理用户的输入，以及能获取纯文本的消息类型
            if ($message instanceof TextContentInterface) {
                $messageContent = $message->getTextContent();
            } else {
                continue;
            }
            $seqId = $clientSeqResponseDTO->getSeq()->getSeqId();
            $userMessages[$seqId] = ['role' => $roleType, 'content' => $messageContent];
        }
        if (empty($userMessages)) {
            return [];
        }
        // 根据 seq_id 升序排列
        ksort($userMessages);
        return array_values($userMessages);
    }

    public function deleteChatMessageByMagicMessageIds(array $magicMessageIds): void
    {
        $this->magicMessageRepository->deleteByMagicMessageIds($magicMessageIds);
    }

    public function getSeqMessageByIds(array $ids)
    {
        return $this->magicSeqRepository->getSeqMessageByIds($ids);
    }

    public function deleteTopicByIds(array $topicIds): void
    {
        $this->magicChatTopicRepository->deleteTopicByIds($topicIds);
    }

    public function deleteSeqMessageByIds(array $seqIds): void
    {
        $this->magicSeqRepository->deleteSeqMessageByIds($seqIds);
    }

    public function deleteTrashMessages(): array
    {
        $magicIds = $this->magicSeqRepository->getHasTrashMessageUsers();
        $magicIds = array_column($magicIds, 'object_id');
        $deleteCount = 0;
        foreach ($magicIds as $magicId) {
            $sequences = $this->magicSeqRepository->getSeqByMagicId($magicId, 100);
            if (count($sequences) < 100) {
                // 只对新用户产生了少量脏数据
                $deleteCount += $this->magicSeqRepository->deleteSeqMessageByIds(array_column($sequences, 'id'));
            }
        }
        return ['$deleteCount' => $deleteCount];
    }

    /**
     * 流式发送消息,默认只推送增量消息，但是可以选择推送历史消息+增量消息.
     */
    public function streamSendMessage(
        MagicSeqEntity $senderSeqDTO,
        MagicMessageEntity $senderMessageDTO,
        MagicConversationEntity $senderConversationEntity
    ): array {
        $senderMessageStruct = $senderMessageDTO->getContent();
        if (! $senderMessageStruct instanceof StreamMessageInterface) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_MESSAGE_NOT_FOUND);
        }
        $streamOptions = $senderMessageStruct->getStreamOptions();
        $streamAppMessageId = $streamOptions->getStreamAppMessageId();
        // 自旋锁,避免数据竞争。另外还需要一个定时任务扫描 redis ，对于超时的流式消息，更新数据库。
        $lockKey = 'magic_stream_message:' . $streamAppMessageId;
        $lockOwner = random_bytes(16);
        $this->locker->spinLock($lockKey, $lockOwner);
        try {
            $cachedStreamMessageKey = $this->getStreamMessageCacheKey($streamAppMessageId);
            // 处理 appMessageId，避免 appMessageId 为空
            $appMsgId = $senderSeqDTO->getAppMessageId() ?: $senderMessageDTO->getAppMessageId();
            $senderSeqDTO->setAppMessageId($appMsgId);
            $senderMessageDTO->setAppMessageId($appMsgId);
            // 只推送增量消息
            $reasoningContent = $senderMessageStruct->getReasoningContent();
            $content = $senderMessageStruct->getContent();
            if ($streamOptions->getStatus() === StreamMessageStatus::Start) {
                $messageEntity = $this->createMagicMessageByAppClient($senderMessageDTO, $senderConversationEntity);
                // 给自己的消息流生成序列,并确定消息的接收人列表
                $senderSeqEntity = $this->generateSenderSequenceByChatMessage($senderSeqDTO, $messageEntity, $senderConversationEntity);
                // 立即给收件方生成 seq
                $receiveSeqEntity = $this->generateReceiveSequenceByChatMessage($senderSeqEntity, $messageEntity);
                // 发件方的话题消息
                $this->createTopicMessage($senderSeqEntity);
                // 收件方的话题消息
                $this->createTopicMessage($receiveSeqEntity);
                $streamCachedDTO = (new StreamCachedDTO())
                    ->setSenderMessageId($senderSeqEntity->getMessageId())
                    ->setReceiveMessageId($receiveSeqEntity->getMessageId())
                    ->setReasoningContent($reasoningContent)
                    ->setContent($content)
                    ->setStatus(StreamMessageStatus::Start)
                    ->setLastUpdateDatabaseTime(time());
                $this->redis->setex($cachedStreamMessageKey, 600, Json::encode($streamCachedDTO));
            } elseif ($streamOptions->getStatus() === StreamMessageStatus::Processing) {
                $streamCachedDTO = $this->getStreamCachedDTO($streamAppMessageId);
                [$senderSeqEntity, $messageEntity, $receiveSeqEntity] = $this->getStreamMessage(
                    $streamCachedDTO->getSenderMessageId(),
                    $streamCachedDTO->getReceiveMessageId()
                );
                // 如果思考和正文都为空，直接返回
                if (($reasoningContent === '' || $reasoningContent === null) && $content === '') {
                    return [$senderSeqEntity, $messageEntity];
                }
                // 缓存流式消息，用于最后返回
                $streamCachedDTO->setReasoningContent($streamCachedDTO->getReasoningContent() . $reasoningContent);
                $streamCachedDTO->setContent($streamCachedDTO->getContent() . $content);
                // 如果距离上次落库超过 3 秒，本次更新数据库
                if (time() - $streamCachedDTO->getLastUpdateDatabaseTime() >= 3) {
                    $this->updateStreamMessageContent($messageEntity, $streamCachedDTO, $streamOptions);
                    $streamCachedDTO->setLastUpdateDatabaseTime(time());
                }
                // 更新需要缓存的内容
                $this->redis->setex($cachedStreamMessageKey, 600, Json::encode($streamCachedDTO));
            } else {
                // 更新 messageEntity
                $streamCachedDTO = $this->getStreamCachedDTO($streamAppMessageId);
                [$senderSeqEntity, $messageEntity, $receiveSeqEntity] = $this->getStreamMessage(
                    $streamCachedDTO->getSenderMessageId(),
                    $streamCachedDTO->getReceiveMessageId()
                );
                $this->updateStreamMessageContent($messageEntity, $streamCachedDTO, $streamOptions);
                $this->redis->del($cachedStreamMessageKey);
            }
            // 前端渲染需要：如果是流式开始是，推一个普通 seq 给前端，用于渲染占位
            if ($streamOptions->getStatus() === StreamMessageStatus::Start) {
                $receiveData = SeqAssembler::getClientSeqStruct($receiveSeqEntity, $messageEntity)->toArray();
                $this->socketIO->of('/im')->to($receiveSeqEntity->getObjectId())->compress(true)->emit(SocketEventType::Chat->value, $receiveData);
            } elseif ($streamOptions->getStatus() === StreamMessageStatus::Processing) {
                // 平滑字符推送
                $this->smoothTypewriterEffect($content, $reasoningContent, $messageEntity, $receiveSeqEntity, $streamOptions);
            } elseif ($streamOptions->getStatus() === StreamMessageStatus::Completed) {
                // 如果是结束状态，直接推送全量记录
                // 及时给调用方返回结果
                co(function () use ($streamOptions, $receiveSeqEntity, $messageEntity) {
                    // 睡 1 秒，避免前端渲染过快
                    // sleep(1);
                    $receiveData = SeqAssembler::getClientStreamSeqStruct($streamOptions, $receiveSeqEntity, $messageEntity)?->toArray(true);
                    $receiveData && $this->socketIO->of('/im')->to($receiveSeqEntity->getObjectId())->compress(true)->emit(SocketEventType::Stream->value, $receiveData);
                });
            }
            return [$senderSeqEntity, $messageEntity];
        } finally {
            $this->locker->release($lockKey, $lockOwner);
        }
    }

    /**
     * 批量获取会话详情.
     * @param array $conversationIds 会话ID数组
     * @return array<string,MagicConversationEntity> 以会话ID为键的会话实体数组
     */
    public function getConversationsByIds(array $conversationIds): array
    {
        if (empty($conversationIds)) {
            return [];
        }

        // 直接使用现有的Repository方法获取会话实体
        $conversationEntities = $this->magicConversationRepository->getConversationByIds($conversationIds);

        // 以会话ID为键，方便调用方快速查找
        $result = [];
        foreach ($conversationEntities as $entity) {
            $result[$entity->getId()] = $entity;
        }

        return $result;
    }

    /**
     * 因为前端已支持平滑渲染，后端尽快推流就好.
     */
    private function smoothTypewriterEffect(
        string $content,
        ?string $reasoningContent,
        MagicMessageEntity $messageEntity,
        MagicSeqEntity $receiveSeqEntity,
        StreamOptions $streamOptions
    ): void {
        /** @var StreamMessageInterface $messageStruct */
        $messageStruct = $messageEntity->getContent();

        // 检查是否有实际内容需要推送（注意：字符串'0'是有效内容）
        if ($reasoningContent !== '' && $reasoningContent !== null) {
            $messageStruct->setContent('');
            $messageStruct->setReasoningContent($reasoningContent);
        } else {
            $messageStruct->setContent($content);
            $messageStruct->setReasoningContent(null);
        }
        // 设置流式选项
        $messageStruct->setStreamOptions(
            new StreamOptions([
                'status' => StreamMessageStatus::Processing,
                'stream' => true,
            ])
        );
        $messageEntity->setContent($messageStruct);
        // 准备WebSocket推送数据并发送
        $receiveData = SeqAssembler::getClientStreamSeqStruct($streamOptions, $receiveSeqEntity, $messageEntity)?->toArray(true);
        // 推送消息给接收方
        if ($receiveData) {
            $this->socketIO->of('/im')->to($receiveSeqEntity->getObjectId())->compress(true)->emit(SocketEventType::Stream->value, $receiveData);
        }
    }

    private function updateStreamMessageContent(MagicMessageEntity $messageEntity, StreamCachedDTO $streamCachedDTO, StreamOptions $streamOptions): void
    {
        $updateMessageEntity = clone $messageEntity;
        /** @var StreamMessageInterface $messageStruct */
        $messageStruct = $updateMessageEntity->getContent();
        // 把全量的流式消息内容更新到 messageEntity
        $messageStruct->setContent($streamCachedDTO->getContent())
            ->setReasoningContent($streamCachedDTO->getReasoningContent())
            ->setStreamOptions(new StreamOptions([
                'status' => $streamOptions->getStatus(),
                'stream' => true,
            ]));
        $updateMessageEntity->setContent($messageStruct);
        $this->magicMessageRepository->updateMessageContent($updateMessageEntity);
    }

    /**
     * @param MagicConversationEntity[] $groupUserConversations
     */
    private function handlerGroupReceiverConversation(array $groupUserConversations): void
    {
        $needUpdateIds = [];
        // 如果会话窗口被隐藏，那么再次打开
        foreach ($groupUserConversations as $groupUserConversation) {
            if ($groupUserConversation->getStatus() !== ConversationStatus::Normal) {
                $needUpdateIds[] = $groupUserConversation->getId();
            }
        }
        if (! empty($needUpdateIds)) {
            $this->magicConversationRepository->updateConversationStatusByIds($needUpdateIds, ConversationStatus::Normal);
        }
    }

    private function handlerReceiveExtra(MagicSeqEntity $senderSeqEntity, MagicConversationEntity $receiveConversationEntity): ?SeqExtra
    {
        // 处理话题
        $senderTopicId = $senderSeqEntity->getExtra()?->getTopicId();
        if (empty($senderTopicId)) {
            return null;
        }
        // 收发双发的话题id一致,但是话题所属会话id不同
        $seqExtra = new SeqExtra();
        $seqExtra->setTopicId($senderTopicId);
        // 发件方所在的环境id
        $seqExtra->setMagicEnvId($senderSeqEntity->getExtra()?->getMagicEnvId());
        // 判断收件方的话题 id是否存在
        $topicDTO = new MagicTopicEntity();
        $topicDTO->setConversationId($receiveConversationEntity->getId());
        $topicDTO->setTopicId($senderTopicId);
        $topicDTO->setOrganizationCode($receiveConversationEntity->getUserOrganizationCode());
        $topicDTO->setName('');
        $topicDTO->setDescription('');
        $topicEntity = $this->magicChatTopicRepository->getTopicEntity($topicDTO);
        if ($topicEntity === null) {
            // 为收件方创建话题
            $this->magicChatTopicRepository->createTopic($topicDTO);
        }
        return $seqExtra;
    }

    /**
     * 未读用户列表.
     */
    private function getUnreadList(MagicConversationEntity $conversationEntity): array
    {
        $unreadList = [];
        if ($conversationEntity->getReceiveType() === ConversationType::Group) {
            $groupId = $conversationEntity->getReceiveId();
            // 群聊
            $groupUserList = $this->magicGroupRepository->getGroupUserList($groupId, '', columns: ['user_id']);
            $groupUserList = array_column($groupUserList, null, 'user_id');
            // 排除自己
            unset($groupUserList[$conversationEntity->getUserId()]);
            $unreadList = array_keys($groupUserList);
        }
        if (in_array($conversationEntity->getReceiveType(), [ConversationType::User, ConversationType::Ai], true)) {
            // 私聊
            $unreadList = [$conversationEntity->getReceiveId()];
        }
        return $unreadList;
    }

    private function getStreamCachedDTO(string $appMessageId): StreamCachedDTO
    {
        $streamMessageKey = $this->getStreamMessageCacheKey($appMessageId);
        $streamOptionsData = $this->redis->get($streamMessageKey);
        if (empty($streamOptionsData)) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_MESSAGE_NOT_FOUND);
        }
        $streamOptionsData = Json::decode($streamOptionsData);
        return new StreamCachedDTO($streamOptionsData);
    }

    private function getStreamMessageCacheKey(string $appMessageId): string
    {
        return 'cached_magic_stream_message:' . $appMessageId;
    }

    private function getStreamMessage(string $messageId, string $receiveMessageId): array
    {
        if (empty($messageId)) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_SEQUENCE_ID_NOT_FOUND);
        }
        $senderSeqEntity = $this->getSeqEntityByMessageId($messageId);
        if ($senderSeqEntity === null) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_SEQUENCE_ID_NOT_FOUND);
        }
        $messageEntity = $this->getMessageByMagicMessageId($senderSeqEntity->getMagicMessageId());
        if ($messageEntity === null) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_MESSAGE_NOT_FOUND);
        }
        $messageStruct = $messageEntity->getContent();
        if (! $messageStruct instanceof StreamMessageInterface) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_MESSAGE_NOT_FOUND);
        }
        if (empty($receiveMessageId)) {
            ExceptionBuilder::throw(ChatErrorCode::STREAM_RECEIVE_MESSAGE_ID_NOT_FOUND);
        }
        $receiveSeqEntity = $this->getSeqEntityByMessageId($receiveMessageId);
        return [$senderSeqEntity, $messageEntity, $receiveSeqEntity];
    }
}
