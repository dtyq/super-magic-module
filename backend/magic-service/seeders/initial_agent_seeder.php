<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Application\Agent\Service\MagicAgentAppService;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Hyperf\Database\Seeders\Seeder;
use Hyperf\DbConnection\Db;

class InitialAgentSeeder extends Seeder
{
    public function run(): void
    {
        // 定义要获取的组织和用户信息
        $organizationCodes = ['test001', 'test002'];

        try {
            foreach ($organizationCodes as $orgCode) {
                echo "开始为组织 {$orgCode} 初始化助手...\n";

                // 获取组织内所有用户
                $users = Db::table('magic_contact_users')
                    ->where('organization_code', $orgCode)
                    ->get()
                    ->toArray();

                if (empty($users)) {
                    echo "组织 {$orgCode} 中未找到用户，跳过初始化助手\n";
                    continue;
                }

                foreach ($users as $user) {
                    // 创建用户授权对象
                    $authorization = new MagicUserAuthorization();
                    $authorization->setId($user->user_id);
                    $authorization->setMagicId($user->magic_id);
                    $authorization->setOrganizationCode($orgCode);

                    // 初始化助手
                    echo "为用户 {$user->user_id} 初始化助手...\n";
                    try {
                        /** @var MagicAgentAppService $agentService */
                        $agentService = di(MagicAgentAppService::class);
                        $agentService->initAgents($authorization);
                        echo "用户 {$user->user_id} 助手初始化成功\n";
                    } catch (Throwable $e) {
                        echo '初始化助手失败: ' . $e->getMessage() . "\n";
                        echo 'file: ' . $e->getFile() . "\n";
                        echo 'line: ' . $e->getLine() . "\n";
                        // 继续下一个用户，不中断整个流程
                        continue;
                    }
                }

                echo "组织 {$orgCode} 助手初始化完成\n";
            }

            echo "所有组织助手初始化完成\n";
        } catch (Throwable $e) {
            echo '助手初始化过程失败: ' . $e->getMessage() . "\n";
            echo 'file: ' . $e->getFile() . "\n";
            echo 'line: ' . $e->getLine() . "\n";
            echo 'trace: ' . $e->getTraceAsString() . "\n";
            // 不抛出异常，避免整个种子执行中断
        }
    }
}
