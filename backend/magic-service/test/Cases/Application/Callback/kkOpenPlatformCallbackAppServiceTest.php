<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Callback;

use Dtyq\MagicEnterprise\Application\Chat\Service\kkOpenPlatformCallbackAppService;
use Hyperf\Codec\Json;
use Hyperf\Context\ApplicationContext;
use Hyperf\Redis\RedisFactory;
use HyperfTest\Cases\BaseTest;
use Mockery;

/**
 * @internal
 */
class kkOpenPlatformCallbackAppServiceTest extends BaseTest
{
    public int $syncCount = 0; // 记录同步次数

    public array $lastSyncInfo = []; // 记录最后一次同步信息

    protected kkOpenPlatformCallbackAppService $callbackAppService;

    protected $redis;

    protected function setUp(): void
    {
        parent::setUp();

        // 定义单元测试环境常量
        if (! defined('UNIT_TESTING_ENV')) {
            define('UNIT_TESTING_ENV', true);
        }

        // 初始化计数器
        $this->syncCount = 0;
        $this->lastSyncInfo = [];

        // 获取Redis实例
        $container = ApplicationContext::getContainer();
        $redisFactory = $container->get(RedisFactory::class);
        $this->callbackAppService = $container->get(kkOpenPlatformCallbackAppService::class);
        $this->redis = $redisFactory->get('default');

        // 清理测试中使用的Redis键
        $this->clearTestRedisKeys('test_org', 123);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        if ($this->redis) {
            // 清理测试中使用的Redis键
            $this->clearTestRedisKeys('test_org', 123);
        }

        // 清理Mockery
        Mockery::close();
    }

    /**
     * 完整测试场景：测试窗口期内只有第一个和最后一个激活用户才会触发组织架构同步.
     */
    public function testCompleteSyncScenario()
    {
        $organizationCode = 'test_org';
        $envId = 123;
        $now = time();

        // 定义新的状态键
        $stateKey = sprintf('teamshare_sync_state:%s:%d', $organizationCode, $envId);
        $delayCheckKey = sprintf('teamshare_delay_check:%s:%d', $organizationCode, $envId);

        // 第一阶段：测试第一次激活触发同步
        $this->callbackAppService->syncTeamshareOrganization($organizationCode, $envId, $this->syncCount, $this->lastSyncInfo);

        // 验证第一次激活触发了同步
        $this->assertEquals(1, $this->syncCount, '第一次激活应该触发同步');
        // 新版本中type变为了"窗口开始"而不是"first"
        $this->assertEquals('窗口开始', $this->lastSyncInfo['type'] ?? null, '第一次激活应标记为窗口开始');

        // 检查Redis中状态是否正确
        $stateJson = $this->redis->get($stateKey);
        $state = $stateJson ? Json::decode($stateJson) : [];
        $this->assertNotEmpty($state, 'Redis中应该有状态数据');
        $this->assertArrayHasKey('window_start', $state, '状态中应包含窗口开始时间');
        $this->assertArrayHasKey('last_activation', $state, '状态中应包含最后激活时间');
        $this->assertArrayHasKey('pending_sync', $state, '状态中应包含待处理同步标志');
        $this->assertTrue($state['pending_sync'], '待处理同步标志应为true');

        // 第二阶段：测试窗口期内的中间激活不触发同步
        // 确保同步计数器开始值记录
        $initialSyncCount = $this->syncCount;

        // 模拟窗口期内的第二次激活（时间间隔较短，不触发延迟同步）
        $this->callbackAppService->syncTeamshareOrganization($organizationCode, $envId, $this->syncCount, $this->lastSyncInfo);

        // 验证中间激活没有触发同步
        $this->assertEquals($initialSyncCount, $this->syncCount, '窗口期内短时间内的第二次激活不应该触发同步');

        // 第三阶段：测试窗口期内的最后一次激活触发同步（模拟延迟检测机制）
        // 修改Redis状态，模拟最后一次激活的条件
        $updatedState = [
            'window_start' => $now - 25, // 窗口期已经过去25秒
            'last_activation' => $now - 6, // 上次激活6秒前
            'pending_sync' => true,
        ];
        $this->redis->set($stateKey, Json::encode($updatedState), ['EX' => 40]);

        // 直接调用检查和执行最后同步的方法
        $this->callbackAppService->checkAndExecuteLastSync($organizationCode, $envId, $this->syncCount, $this->lastSyncInfo);

        // 验证最后一次激活触发了同步
        $this->assertEquals(2, $this->syncCount, '窗口期结束时的最后一次激活应该触发同步');
        $this->assertEquals('窗口结束', $this->lastSyncInfo['type'] ?? null, '最后一次激活应标记为窗口结束');

        // 验证窗口期已结束（通过检查Redis状态）
        $stateAfterSync = $this->redis->get($stateKey);
        $this->assertEmpty($stateAfterSync, '窗口期结束后，状态应被清除');

        // 验证同步信息包含正确的数据
        $this->assertArrayHasKey('organizationCode', $this->lastSyncInfo, '同步信息应包含组织编码');
        $this->assertEquals($organizationCode, $this->lastSyncInfo['organizationCode'], '同步信息的组织编码应正确');
        $this->assertEquals($envId, $this->lastSyncInfo['envId'], '同步信息的环境ID应正确');

        // 第四阶段：测试延迟检测机制
        // 重置计数和信息
        $this->syncCount = 0;
        $this->lastSyncInfo = [];

        // 模拟条件满足延迟检测的Redis状态
        $delayTestState = [
            'window_start' => $now - 20, // 窗口期已经过去20秒
            'last_activation' => $now - 6, // 上次激活6秒前
            'pending_sync' => true,
        ];
        $this->redis->set($stateKey, Json::encode($delayTestState), ['EX' => 40]);

        // 直接调用检查方法模拟延迟检测
        $this->callbackAppService->checkAndExecuteLastSync($organizationCode, $envId, $this->syncCount, $this->lastSyncInfo);

        // 验证延迟检测机制的结果
        $this->assertEquals(1, $this->syncCount, '延迟检测机制应该触发同步');
        $this->assertEquals('窗口结束', $this->lastSyncInfo['type'] ?? null, '延迟检测同步应标记为窗口结束');

        // 验证延迟检测后的Redis状态
        $stateAfterDelay = $this->redis->get($stateKey);
        $this->assertEmpty($stateAfterDelay, '延迟检测完成后，状态应被清除');
    }

    /**
     * 清理测试中使用的Redis键，更新为新的Redis键格式.
     */
    protected function clearTestRedisKeys(string $organizationCode, int $envId): void
    {
        if (! $this->redis) {
            return;
        }

        // 新的Redis键格式
        $keys = [
            sprintf('teamshare_sync_state:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_sync_lock:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_delay_check:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_last_sync_lock:%s:%d', $organizationCode, $envId),
        ];

        // 旧的Redis键格式（为了兼容性和清理）
        $oldKeys = [
            sprintf('teamshare_sync_window:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_last_activation:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_pending_sync:%s:%d', $organizationCode, $envId),
            sprintf('teamshare_organization_sync_lock:%s:%d', $organizationCode, $envId),
        ];

        $allKeys = array_merge($keys, $oldKeys);

        foreach ($allKeys as $key) {
            $this->redis->del($key);
        }
    }
}
