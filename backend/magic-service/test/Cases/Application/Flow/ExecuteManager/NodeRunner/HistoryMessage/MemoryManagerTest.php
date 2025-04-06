<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Application\Flow\ExecuteManager\NodeRunner\HistoryMessage;

use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionType;
use App\Application\Flow\ExecuteManager\Memory\FlowMemoryManager;
use App\Application\Flow\ExecuteManager\Memory\MemoryQuery;
use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\Flow\Entity\ValueObject\NodeParamsConfig\LLM\Structure\ModelConfig;
use App\Domain\Flow\Service\MagicFlowAIModelDomainService;
use HyperfTest\Cases\Application\Flow\ExecuteManager\ExecuteManagerBaseTest;

/**
 * @internal
 */
class MemoryManagerTest extends ExecuteManagerBaseTest
{
    public function testReceiveIM()
    {
        $this->markTestSkipped('Skip testReceiveIM');
        $manager = make(FlowMemoryManager::class);
        $dataIsolation = FlowDataIsolation::create('DT001', 'usi_a450dd07688be6273b5ef112ad50ba7e');
        $manager->receive(
            $dataIsolation,
            ExecutionType::IMChat,
            '715320715409252352',
            '342cfb91cba5271e3f6634b4d8b57a73',
            '123',
            json_decode('{"text": {"content": "任务结束：空", "attachments": []}, "type": "text"}', true)
        );
        $this->assertTrue(true);
    }

    public function testQueryIM()
    {
        //        $this->markTestSkipped('Skip testQueryIM');
        $manager = make(FlowMemoryManager::class);
        $ex = $this->createExecutionData();
        $modelConfig = new ModelConfig(
            vision: true,
            visionModel: 'gpt-4o-global1'
        );
        $modelConfig->setCurrentModel(di(MagicFlowAIModelDomainService::class)->getByName($ex->getDataIsolation(), 'gpt-4o-global'));
        $memoryQuery = new MemoryQuery(ExecutionType::SKApi, 'DF-usi_a450dd07688be6273b5ef112ad50ba7e_tr_5uaaCQwO12391', '5uaaCQwO12391', '');
        $memoryQuery->setDistinctMessage(true);
        $messages = $manager->queries($ex, $memoryQuery, $modelConfig);
        var_dump($messages);
    }
}
