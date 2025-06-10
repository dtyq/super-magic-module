<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\SuperAgent\Crontab;

use Dtyq\SuperMagic\Application\SuperAgent\Service\TaskAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\TopicAppService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\SandboxInterface;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Crontab\Annotation\Crontab;
use Throwable;

/**
 * 检查长时间处于运行状态的任务
 */
#[Crontab(rule: '15 * * * *', name: 'CheckTaskStatus', singleton: true, onOneServer: true, callback: 'execute', memo: '每小时的第15分钟检查超过6小时未完成的话题和容器状态')]
readonly class CheckTaskStatusTask
{
    public function __construct(
        protected TopicAppService $topicAppService,
        protected TaskAppService $taskAppService,
        protected StdoutLoggerInterface $logger,
        protected SandboxInterface $sandboxService,
    ) {
    }

    /**
     * 执行任务，检查超过3小时未更新的任务并根据沙箱状态更新任务状态
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
            // 获取6小时前的时间点
            $timeThreshold = date('Y-m-d H:i:s', strtotime('-3 hours'));

            // 获取超时话题列表（更新时间超过7小时的话题，最多100条）
            $staleRunningTopics = $this->topicAppService->getTopicsExceedingUpdateTime($timeThreshold, 100);

            if (empty($staleRunningTopics)) {
                $this->logger->info('[CheckTaskStatusTask] 没有需要检查的超时话题');
                return;
            }

            $this->logger->info(sprintf('[CheckTaskStatusTask] 开始检查 %d 个超时话题的容器状态', count($staleRunningTopics)));

            $updatedToRunningCount = 0;
            $updatedToErrorCount = 0;

            foreach ($staleRunningTopics as $topic) {
                $sandboxId = $topic->getSandboxId();
                if (empty($sandboxId)) {
                    continue;
                }
                // 每次循环后休眠0.1秒，避免请求过于频繁
                usleep(100000); // 100000微秒 = 0.1秒
                $status = $this->taskAppService->updateTaskStatusFromSandbox($topic);
                if ($status === TaskStatus::RUNNING) {
                    ++$updatedToRunningCount;
                    continue;
                }
                ++$updatedToErrorCount;
            }
            $this->logger->info(sprintf(
                '[CheckTaskStatusTask] 检查完成，共更新 %d 个话题为运行状态，%d 个话题为错误状态',
                $updatedToRunningCount,
                $updatedToErrorCount
            ));
        } catch (Throwable $e) {
            $this->logger->error(sprintf('[CheckTaskStatusTask] 检查任务状态失败: %s', $e->getMessage()));
            throw $e;
        }
    }
}
