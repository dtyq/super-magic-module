<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Crontab;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TaskDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TopicDomainService;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\SandboxInterface;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\SandboxResult;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Crontab\Annotation\Crontab;
use Throwable;

/**
 * 检查长时间处于运行状态的任务
 */
#[Crontab(rule: '*/30 * * * *', name: 'CheckTaskStatus', singleton: true, onOneServer: true, callback: 'execute', memo: '每30分钟检查超过7小时未完成的任务和容器状态')]
readonly class CheckTaskStatusTask
{
    public function __construct(
        protected TaskDomainService $taskDomainService,
        protected TopicDomainService $topicDomainService,
        protected StdoutLoggerInterface $logger,
        protected SandboxInterface $sandboxService,
    ) {
    }

    /**
     * 执行任务，检查超过7小时未更新的任务并根据沙箱状态更新任务状态
     */
    public function execute(): void
    {
        $this->logger->info('[CheckTaskStatusTask] 开始检查长时间未更新的任务');
        try {
            // 检查任务状态和容器状态
            $this->checkTasksStatus();
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 执行失败: %s', $e->getMessage()));
        }
    }

    /**
     * 检查任务状态和容器状态
     */
    private function checkTasksStatus(): void
    {
        try {
            // 获取3小时前的时间点
            $timeThreshold = date('Y-m-d H:i:s', strtotime('-7 hours'));

            // 获取超时任务列表（更新时间超过3小时的任务，最多100条）
            $staleRunningTasks = $this->taskDomainService->getTasksExceedingUpdateTime($timeThreshold, 100);

            if (empty($staleRunningTasks)) {
                $this->logger->info('[CheckTaskStatusTask] 没有需要检查的超时任务');
                return;
            }

            $this->logger->info(sprintf('[CheckTaskStatusTask] 开始检查 %d 个超时任务的容器状态', count($staleRunningTasks)));

            $updatedToRunningCount = 0;
            $updatedToErrorCount = 0;

            foreach ($staleRunningTasks as $task) {
                $sandboxId = $task->getSandboxId();
                if (empty($sandboxId)) {
                    continue;
                }

                // 每次循环后休眠0.1秒，避免请求过于频繁
                usleep(100000); // 100000微秒 = 0.1秒

                // 调用SandboxService的getStatus接口获取容器状态
                $result = $this->sandboxService->getStatus($sandboxId);

                // 如果沙箱存在且状态为 running，直接返回该沙箱
                if ($result->getCode() === SandboxResult::Normal
                    && $result->getSandboxData()->getStatus() === 'running') {
                    $this->logger->info(sprintf('沙箱状态正常(running): sandboxId=%s', $sandboxId));
                    continue;
                }

                // 记录需要创建新沙箱的原因（调试使用，没有业务逻辑，可忽略）
                if ($result->getCode() === SandboxResult::NotFound) {
                    $errMsg = '沙箱不存在';
                } elseif ($result->getCode() === SandboxResult::Normal
                    && $result->getSandboxData()->getStatus() === 'exited') {
                    $errMsg = '沙箱已经退出';
                } else {
                    $errMsg = '沙箱异常';
                }

                // 更新任务表
                $this->taskDomainService->updateTaskStatusByTaskId($task->getId(), TaskStatus::ERROR, $errMsg);
                // 更新话题表
                $this->topicDomainService->updateTopicStatus($task->getTopicId(), $task->getId(), TaskStatus::ERROR);
            }

            $this->logger->info(sprintf(
                '[CheckTaskStatusTask] 检查完成，共更新 %d 个任务为运行状态，%d 个任务为错误状态',
                $updatedToRunningCount,
                $updatedToErrorCount
            ));
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 检查任务状态失败: %s', $e->getMessage()));
            throw $e;
        }
    }
}
