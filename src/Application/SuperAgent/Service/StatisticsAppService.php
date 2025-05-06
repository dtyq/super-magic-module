<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Service;

use App\Application\Kernel\SuperPermissionEnum;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Infrastructure\Util\Auth\PermissionChecker;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\Query\TopicQuery;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TaskDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\WorkspaceDomainService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetTopicAttachmentsRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\GetUserUsageRequestDTO;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\MessageItemDTO;

class StatisticsAppService extends AbstractAppService
{
    public function __construct(
        protected WorkspaceAppService $workspaceAppService,
        protected WorkspaceDomainService $workspaceDomainService,
        protected MagicUserDomainService $userDomainService,
        protected TaskDomainService $taskDomainService,
        protected PermissionChecker $permissionChecker,
    ) {
    }

    /**
     * 获取用户使用情况统计
     *
     * @param MagicUserAuthorization $userAuthorization 用户授权信息
     * @param GetUserUsageRequestDTO $requestDTO 请求参数
     * @return array 包含total和list的数组
     */
    public function getUserUsage(MagicUserAuthorization $userAuthorization, GetUserUsageRequestDTO $requestDTO): array
    {
        // 当前只有白名单用户能够进行访问
        if (! PermissionChecker::mobileHasPermission($userAuthorization->getMobile(), SuperPermissionEnum::SUPER_MAGIC_BOARD_OPERATOR)) {
            return [
                'total' => 0,
                'list' => [],
            ];
        }

        $defaultTaskLimit = config('super-magic.task_number_limit', 3);
        // 创建数据隔离对象
        $dataIsolation = new DataIsolation();
        $dataIsolation->setCurrentUserId($userAuthorization->getId());
        $dataIsolation->setCurrentOrganizationCode($userAuthorization->getOrganizationCode());

        // 根据用户名查找用户ID
        $userIds = [];
        if (! empty($requestDTO->getUserName())) {
            $userResults = $this->userDomainService->searchUserByNickName(
                $requestDTO->getUserName(),
                $dataIsolation
            );
            if (! empty($userResults)) {
                foreach ($userResults as $user) {
                    $userIds[] = $user['user_id'] ?? '';
                }
            }
        }

        // 创建查询对象
        $topicQuery = new TopicQuery();
        $topicQuery->setPage($requestDTO->getPage());
        $topicQuery->setPageSize($requestDTO->getPageSize());

        // 设置查询条件
        if (! empty($requestDTO->getTopicId())) {
            $topicQuery->setTopicId($requestDTO->getTopicId());
        }

        if (! empty($requestDTO->getTopicName())) {
            $topicQuery->setTopicName($requestDTO->getTopicName());
        }

        if (! empty($requestDTO->getSandboxId())) {
            $topicQuery->setSandboxId($requestDTO->getSandboxId());
        }

        if (! empty($requestDTO->getTopicStatus())) {
            $topicQuery->setTopicStatus($requestDTO->getTopicStatus());
        }

        if (! empty($requestDTO->getOrganizationCode())) {
            $topicQuery->setOrganizationCode($requestDTO->getOrganizationCode());
        }

        if (! empty($userIds)) {
            $topicQuery->setUserIds($userIds);
        }

        // 调用领域服务查询数据
        $result = $this->workspaceDomainService->getTopicsByQuery($topicQuery);
        $topics = $result['list'] ?? [];
        $total = $result['total'] ?? 0;

        // 用户信息和手机号缓存
        $userInfoCache = [];
        $userPhoneCache = [];

        // 任务信息缓存
        $userTaskInfoCache = [];

        // 构建结果列表
        $list = [];
        foreach ($topics as $topic) {
            /* @var TopicEntity $topic */
            $userId = $topic->getUserId();

            // 获取用户信息（使用缓存）
            if (! isset($userInfoCache[$userId])) {
                $userInfoCache[$userId] = $this->userDomainService->getUserById($userId);
                // 如果用户不存在，跳过这个话题
                if (! $userInfoCache[$userId]) {
                    continue;
                }
            }
            $user = $userInfoCache[$userId];

            // 获取用户手机号（使用缓存）
            if (! isset($userPhoneCache[$userId])) {
                $userPhoneCache[$userId] = $this->userDomainService->getUserPhoneByUserId($userId);
            }
            $phone = $userPhoneCache[$userId];

            // 获取用户任务信息（使用缓存）
            if (! isset($userTaskInfoCache[$userId])) {
                $userTaskInfoCache[$userId] = $this->taskDomainService->getTasksCountByUserId($userId);
            }
            $userTaskInfo = $userTaskInfoCache[$userId];

            // 获取 topic_id 下任务次数, 任务次就代表对话轮次
            $taskRounds = 0;
            $lastTaskStartTime = '';
            $lastMessageSendTimestamp = '';
            $lastMessageContent = '';

            if (isset($userTaskInfo[$topic->getId()])) {
                $taskRounds = $userTaskInfo[$topic->getId()]['task_rounds'];
                $lastTaskStartTime = $userTaskInfo[$topic->getId()]['last_task_start_time'];
                $lastMessageSendTimestamp = $userTaskInfo[$topic->getId()]['last_message_send_timestamp'];
                $lastMessageContent = $userTaskInfo[$topic->getId()]['last_message_content'];
            }

            $list[] = [
                'user_name' => $user['nickname'],
                'user_id' => $user['user_id'],
                'user_phone' => (string) $phone,
                'topic_name' => $topic->getTopicName(),
                'topic_id' => (string) $topic->getId(),
                'topic_status' => $topic->getCurrentTaskStatus()?->value,
                'sandbox_id' => $topic->getSandboxId(),
                'task_rounds' => $taskRounds,
                'last_task_start_time' => $lastTaskStartTime,
                'last_message_send_timestamp' => $lastMessageSendTimestamp,
                'last_message_content' => $lastMessageContent,
                'limit_times' => $defaultTaskLimit,
            ];
        }

        return [
            'total' => $total,
            'list' => $list,
        ];
    }

    /**
     * 获取话题状态指标统计
     *
     * @param MagicUserAuthorization $userAuthorization 用户授权信息
     * @param string $organizationCode 可选的组织代码过滤
     * @return array 话题状态统计指标数据
     */
    public function getTopicStatusMetrics(MagicUserAuthorization $userAuthorization, string $organizationCode = ''): array
    {
        // 当前只有白名单用户能够进行访问
        if (! PermissionChecker::mobileHasPermission($userAuthorization->getMobile(), SuperPermissionEnum::SUPER_MAGIC_BOARD_OPERATOR)) {
            return [
                'total' => 0,
                'list' => [],
            ];
        }
        // 创建数据隔离对象
        $dataIsolation = new DataIsolation();
        $dataIsolation->setCurrentUserId($userAuthorization->getId());

        // 如果传入了组织代码，优先使用传入的
        if (! empty($organizationCode)) {
            $dataIsolation->setCurrentOrganizationCode($organizationCode);
        }

        // 调用领域服务获取统计数据
        return $this->workspaceDomainService->getTopicStatusMetrics($dataIsolation, $organizationCode);
    }

    public function getUserTopicMessage(MagicUserAuthorization $userAuthorization, int $topicId, int $page, int $pageSize, string $sortDirection): array
    {
        // 只有看板管理员才有权限访问
        if (! PermissionChecker::mobileHasPermission($userAuthorization->getMobile(), SuperPermissionEnum::SUPER_MAGIC_BOARD_ADMIN)) {
            return [
                'total' => 0,
                'list' => [],
            ];
        }

        // 获取消息列表
        $result = $this->taskDomainService->getMessagesByTopicId($topicId, $page, $pageSize, true, $sortDirection);

        // 转换为响应格式
        $messages = [];
        foreach ($result['list'] as $message) {
            $messages[] = new MessageItemDTO($message->toArray());
        }

        return [
            'list' => $messages,
            'total' => $result['total'],
        ];
    }

    public function getUserTopicAttachments(MagicUserAuthorization $userAuthorization, GetTopicAttachmentsRequestDTO $requestDto): array
    {
        $dataIsolation = $this->createDataIsolation($userAuthorization);
        return $this->workspaceAppService->getTopicAttachmentList($dataIsolation, $requestDto);
    }
}
