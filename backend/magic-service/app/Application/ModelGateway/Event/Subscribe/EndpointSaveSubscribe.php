<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\ModelGateway\Event\Subscribe;

use App\Domain\ModelAdmin\Event\EndpointChangeEvent;
use App\Infrastructure\Core\HighAvailability\Entity\EndpointEntity;
use App\Infrastructure\Core\HighAvailability\Interface\HighAvailabilityInterface;
use Hyperf\Context\ApplicationContext;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Throwable;

#[Listener]
class EndpointSaveSubscribe implements ListenerInterface
{
    public function listen(): array
    {
        return [
            EndpointChangeEvent::class,
        ];
    }

    /**
     * 将端点操作同步到高可用服务.
     *
     * @param EndpointChangeEvent $event
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function process(object $event): void
    {
        $log = ApplicationContext::getContainer()->get(LoggerFactory::class)->get('endpointHighAvailability 将端点操作同步到高可用服务');
        // 处理事件
        /** @var EndpointEntity[] $endpointEntities */
        $endpointEntities = $event->endpointEntities;
        $isDelete = $event->isDelete;

        // 检查 HighAvailabilityInterface 在 DI 容器中是否有注入
        $container = ApplicationContext::getContainer();
        if (! $container->has(HighAvailabilityInterface::class)) {
            return;
        }

        // 获取高可用服务实例
        $highAvailabilityService = $container->get(HighAvailabilityInterface::class);
        if (! $highAvailabilityService instanceof HighAvailabilityInterface) {
            return;
        }

        // 处理删除操作和更新操作
        if (empty($endpointEntities)) {
            return;
        }
        try {
            // 根据操作类型选择不同的处理方法
            if ($isDelete) {
                // 硬删除操作
                $result = $highAvailabilityService->deleteEndpointEntities($endpointEntities);
            } else {
                // 创建或更新操作
                $result = $highAvailabilityService->batchSaveEndpointEntities($endpointEntities);
            }

            if (! $result) {
                // 记录错误日志或异常处理
                $log->error('Failed to ' . ($isDelete ? 'delete' : 'save') . ' endpoint entities.');
            }
        } catch (Throwable $e) {
            // 处理异常情况
            $log->error('Exception when processing endpoint entities: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
        }
    }
}
