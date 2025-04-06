<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\TaskScheduler;

class ConfigProvider
{
    public function __invoke(): array
    {
        return [
            'dependencies' => [
            ],
            'commands' => [
            ],
            'annotations' => [
                'scan' => [
                    'paths' => [
                        __DIR__,
                    ],
                ],
            ],
            'publish' => [
                [
                    'id' => 'config',
                    'description' => 'The config for schedule-task.',
                    'source' => __DIR__ . '/../publish/task_scheduler.php',
                    'destination' => BASE_PATH . '/config/autoload/task_scheduler.php',
                ],
                [
                    'id' => 'migration',
                    'description' => 'migration file.',
                    'source' => __DIR__ . '/../publish/migrations/2024_08_28_110155_create_task_scheduler.php',  // 对应的配置文件路径
                    'destination' => BASE_PATH . '/migrations/2024_08_28_110155_create_task_scheduler.php', // 复制为这个路径下的该文件
                ],
                [
                    'id' => 'migration',
                    'description' => 'migration file.',
                    'source' => __DIR__ . '/../publish/migrations/2024_08_28_110158_create_task_scheduler_log.php',  // 对应的配置文件路径
                    'destination' => BASE_PATH . '/migrations/2024_08_28_110158_create_task_scheduler_log.php', // 复制为这个路径下的该文件
                ],
                [
                    'id' => 'migration',
                    'description' => 'migration file.',
                    'source' => __DIR__ . '/../publish/migrations/2024_08_28_110202_create_task_scheduler_crontab.php',  // 对应的配置文件路径
                    'destination' => BASE_PATH . '/migrations/2024_08_28_110202_create_task_scheduler_crontab.php', // 复制为这个路径下的该文件
                ],
                [
                    'id' => 'migration',
                    'description' => 'migration file.',
                    'source' => __DIR__ . '/../publish/migrations/2024_10_22_101130_task_scheduler_add_environment.php',  // 对应的配置文件路径
                    'destination' => BASE_PATH . '/migrations/2024_10_22_101130_task_scheduler_add_environment.php', // 复制为这个路径下的该文件
                ],
            ],
        ];
    }
}
