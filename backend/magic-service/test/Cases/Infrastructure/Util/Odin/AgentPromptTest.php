<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Odin;

use App\Infrastructure\Util\Odin\AgentPrompt;
use HyperfTest\Cases\BaseTest;

/**
 * @internal
 */
class AgentPromptTest extends BaseTest
{
    public function testGet()
    {
        $prompt = new AgentPrompt('你叫小青');
        $this->assertEquals("你叫小青\nxx", $prompt->getSystemPrompt('xx')->getContent());
        $this->assertEquals('', $prompt->getUserPrompt('')->getContent());
    }
}
