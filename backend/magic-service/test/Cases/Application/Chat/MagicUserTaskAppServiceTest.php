<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Chat;

use App\Application\Chat\Service\MagicUserTaskAppService;
use App\Interfaces\Chat\DTO\UserTaskDTO;
use App\Interfaces\Chat\DTO\UserTaskValueDTO;
use DateTime;
use HyperfTest\Cases\BaseTest;
use Mockery;

/**
 * @internal
 */
class MagicUserTaskAppServiceTest extends BaseTest
{
    protected function tearDown(): void
    {
        Mockery::close();
    }

    // public function testCallbackSuccess()
    // {
    //     // 准备测试数据
    //     $userTask = [
    //         'conversation_id' => '728277721403252736',
    //         'topic_id' => '749639569880518657',
    //         'magic_env_id' => 1,
    //         'name' => '查询数据列表',
    //         'creator' => 'usi_3715ce50bc02d7e72ba7891649b7f1da',
    //         'nickname' => 'xxx',
    //         'agent_id' => '737330322528899073',
    //         'day' => null,
    //         'time' => '00:00',
    //         'type' => 'daily_repeat',
    //         'topic' => ['name' => null, 'type' => ''],
    //         'value' => ['unit' => null, 'values' => null, 'deadline' => null, 'interval' => null],
    //     ];

    //     $userTaskValue = [
    //         'unit' => null,
    //         'values' => null,
    //         'deadline' => null,
    //         'interval' => null,
    //     ];
    //     // 创建被测试的服务实例, 使用依赖注入
    //     $service = make(MagicUserTaskAppService::class);
    //     // {"branchId": "branch_83f180194d23", "flowCode": "MAGIC-FLOW-6784c05fc92ec0-09863904", "routineConfig": {"day": null, "time": "00:00", "type": "daily_repeat", "topic": {"name": null, "type": ""}, "value": {"unit": null, "values": null, "deadline": null, "interval": null}}}
    //     $flowCode = 'MAGIC-FLOW-6784c05fc92ec0-09863904';
    //     //  $branchId = 'branch_83f180194d23';
    //     // 执行测试
    //      $service::callback($flowCode, $userTask, $userTaskValue);

    //     // 验证结果
    //     $this->assertTrue(true);
    // }

    // 测试创建自定义重复任务 day 场景
    public function testCreateCustomRepeatTaskDay()
    {
        $service = make(MagicUserTaskAppService::class);
        $userTask = new UserTaskDTO();
        $userTask->setAgentId('737330322528899073');
        $userTask->setTopicId('749639569880518657');
        $userTask->setCreator('usi_3715ce50bc02d7e72ba7891649b7f1da');
        $userTask->setNickname('xxxx');
        $userTask->setName('测试自定义重复任务');
        $userTask->setAgentId('737330322528899073');
        $userTask->setDay('');
        $userTask->setTime('22:00');
        $userTask->setType('custom_repeat');
        $userTask->setValue(['unit' => 'day', 'values' => [], 'deadline' => '2025-03-03', 'interval' => 2]);

        $userTaskValue = new UserTaskValueDTO();
        $userTaskValue->setUnit($userTask->getValue()['unit']);
        $userTaskValue->setValues($userTask->getValue()['values']);
        $userTaskValue->setInterval($userTask->getValue()['interval']);
        $userTaskValue->setDeadline($userTask->getValue()['deadline'] ? new DateTime($userTask->getValue()['deadline']) : null);
        $service->createTask($userTask, $userTaskValue);
        $this->assertTrue(true);
    }

    // 测试创建自定义重复任务 week 场景
    public function testCreateCustomRepeatTaskWeek()
    {
        $service = make(MagicUserTaskAppService::class);
        $userTask = new UserTaskDTO();
        $userTask->setAgentId('737330322528899073');
        $userTask->setTopicId('749639569880518657');
        $userTask->setCreator('usi_3715ce50bc02d7e72ba7891649b7f1da');
        $userTask->setNickname('xxx');
        $userTask->setName('自定义每两周重复任务-2');
        $userTask->setAgentId('737330322528899073');
        $userTask->setDay('');
        $userTask->setTime('16:00');
        $userTask->setType('custom_repeat');
        $userTask->setValue(['unit' => 'week', 'values' => [3, 5], 'deadline' => '2028-03-14', 'interval' => 2]);

        $userTaskValue = new UserTaskValueDTO();
        $userTaskValue->setUnit($userTask->getValue()['unit']);
        $userTaskValue->setValues($userTask->getValue()['values']);
        $userTaskValue->setInterval($userTask->getValue()['interval']);
        $userTaskValue->setDeadline($userTask->getValue()['deadline'] ? new DateTime($userTask->getValue()['deadline']) : null);
        $service->createTask($userTask, $userTaskValue);
        $this->assertTrue(true);
    }

    // 测试创建自定义重复任务 month 场景
    public function testCreateCustomRepeatTaskMonth()
    {
        $service = make(MagicUserTaskAppService::class);
        $userTask = new UserTaskDTO();
        $userTask->setAgentId('737330322528899073');
        $userTask->setTopicId('749639569880518657');
        $userTask->setCreator('usi_3715ce50bc02d7e72ba7891649b7f1da');
        $userTask->setNickname('xxx');
        $userTask->setName('测试自定义重复任务-月');
        $userTask->setAgentId('737330322528899073');
        $userTask->setDay('');
        $userTask->setTime('22:00');
        $userTask->setType('custom_repeat');
        $userTask->setValue(['unit' => 'month', 'values' => [1, 5, 10, 15, 26, 27, 28], 'deadline' => '2028-04-28', 'interval' => 2]);

        $userTaskValue = new UserTaskValueDTO();
        $userTaskValue->setUnit($userTask->getValue()['unit']);
        $userTaskValue->setValues($userTask->getValue()['values']);
        $userTaskValue->setInterval($userTask->getValue()['interval']);
        $userTaskValue->setDeadline($userTask->getValue()['deadline'] ? new DateTime($userTask->getValue()['deadline']) : null);
        $service->createTask($userTask, $userTaskValue);
        $this->assertTrue(true);
    }

    // 测试创建自定义重复任务 year 场景
    public function testCreateCustomRepeatTaskYear()
    {
        $service = make(MagicUserTaskAppService::class);

        $userTask = new UserTaskDTO();
        $userTask->setAgentId('737330322528899073');
        $userTask->setTopicId('749639569880518657');
        $userTask->setCreator('usi_3715ce50bc02d7e72ba7891649b7f1da');
        $userTask->setNickname('xxx');
        $userTask->setName('测试自定义重复年任务');
        $userTask->setAgentId('737330322528899073');
        $userTask->setDay('2025-02-27');
        $userTask->setTime('13:00');
        $userTask->setType('custom_repeat');
        $userTask->setValue(['unit' => 'year', 'month' => 2, 'values' => [3, 15, 25, 28], 'deadline' => '', 'interval' => 2]);

        $userTaskValue = new UserTaskValueDTO();
        $userTaskValue->setUnit($userTask->getValue()['unit']);
        $userTaskValue->setValues($userTask->getValue()['values']);
        $userTaskValue->setInterval($userTask->getValue()['interval']);
        $userTaskValue->setMonth((string) ($userTask->getValue()['month'] ?? ''));
        $userTaskValue->setDeadline($userTask->getValue()['deadline'] ? new DateTime($userTask->getValue()['deadline']) : null);
        $service->createTask($userTask, $userTaskValue);
        $this->assertTrue(true);
    }
}
