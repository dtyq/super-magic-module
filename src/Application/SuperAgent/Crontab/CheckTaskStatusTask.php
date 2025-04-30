<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Crontab;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TaskDomainService;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\SandboxInterface;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Crontab\Annotation\Crontab;
use Hyperf\Di\Annotation\Inject;
use Throwable;

/**
 * 检查长时间处于运行状态的任务
 */
#[Crontab(name: 'CheckTaskStatus', rule: '*/30 * * * *', callback: 'execute', memo: '每30分钟检查超过7小时未完成的任务和容器状态')]
class CheckTaskStatusTask
{
    #[Inject]
    protected TaskDomainService $taskDomainService;

    #[Inject]
    protected StdoutLoggerInterface $logger;

    #[Inject]
    protected SandboxInterface $sandboxService;

    /**
     * 执行任务，检查超过7小时仍在运行状态的任务并标记为错误状态
     * 同时检查容器状态，如果容器已退出则将任务状态改为stopped.
     */
    public function execute(): void
    {
        $this->logger->info('[CheckTaskStatusTask] 开始检查长时间处于运行状态的任务');

        try {
            // 1. 检查超时任务
            $this->checkStaleRunningTasks();

            // 2. 检查容器状态
            $this->checkContainerStatus();
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 执行失败: %s', $e->getMessage()));
        }
    }

    /**
     * 检查长时间处于运行状态的任务
     */
    private function checkStaleRunningTasks(): void
    {
        try {
            // 获取7小时前的时间点
            $timeThreshold = date('Y-m-d H:i:s', strtotime('-7 hours'));

            // 使用TaskDomainService执行更新操作，而不是直接操作Repository
            $updatedCount = $this->taskDomainService->updateStaleRunningTasks($timeThreshold);

            $this->logger->info(sprintf('[CheckTaskStatusTask] 已将 %d 个长时间未完成的任务标记为错误状态', $updatedCount));
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 检查超时任务失败: %s', $e->getMessage()));
        }
    }

    /**
     * 检查容器状态
     */
    private function checkContainerStatus(): void
    {
        try {
            // 通过TaskDomainService获取所有处于running状态的任务
            $runningTasks = $this->taskDomainService->getTasksByStatus(TaskStatus::RUNNING);

            if (empty($runningTasks)) {
                $this->logger->info('[CheckTaskStatusTask] 没有处于运行状态的任务需要检查');
                return;
            }

            $this->logger->info(sprintf('[CheckTaskStatusTask] 开始检查 %d 个运行中任务的容器状态', count($runningTasks)));

            $stoppedCount = 0;
            foreach ($runningTasks as $task) {
                $sandboxId = $task->getSandboxId();
                if (empty($sandboxId)) {
                    continue;
                }

                // 每次循环后休眠0.1秒，避免请求过于频繁
                usleep(100000); // 100000微秒 = 0.1秒

                // 调用SandboxService的getStatus接口获取容器状态
                $sandboxResult = $this->sandboxService->getStatus($sandboxId);

                if (! $sandboxResult->isSuccess()) {
                    $this->logger->warning(sprintf(
                        '[CheckTaskStatusTask] 获取沙箱状态失败 - 任务ID: %s, 沙箱ID: %s, 错误: %s',
                        $task->getId(),
                        $sandboxId,
                        $sandboxResult->getMessage()
                    ));
                    continue;
                }

                $sandboxData = $sandboxResult->getSandboxData();
                $containerStatus = $sandboxData->getStatus();

                $this->logger->info(sprintf(
                    '[CheckTaskStatusTask] 任务ID: %s, 沙箱ID: %s, 容器状态: %s',
                    $task->getId(),
                    $sandboxId,
                    $containerStatus
                ));

                // 如果容器状态为exited，则将任务状态更新为Stopped
                if ($containerStatus === 'exited') {
                    // 使用轻量级的方法更新任务状态，只修改状态
                    $taskId = $task->getTaskId() ?? '';
                    if (! empty($taskId) && $this->taskDomainService->updateTaskStatusByTaskId($taskId, TaskStatus::Stopped)) {
                        ++$stoppedCount;
                        $this->logger->info(sprintf(
                            '[CheckTaskStatusTask] 已将任务ID: %s 的状态从running更新为stopped(容器已退出)',
                            $task->getId()
                        ));
                    }
                }
            }

            $this->logger->info(sprintf('[CheckTaskStatusTask] 共有 %d 个任务因容器已退出而被标记为终止状态', $stoppedCount));
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 检查容器状态失败: %s', $e->getMessage()));
        }
    }
}
