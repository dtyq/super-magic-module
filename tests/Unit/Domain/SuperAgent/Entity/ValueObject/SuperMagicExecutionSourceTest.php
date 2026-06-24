<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Domain\SuperAgent\Entity\ValueObject;

use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\SuperMagicExecutionSource;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class SuperMagicExecutionSourceTest extends TestCase
{
    public function testStampMessageContentPreservesExistingDynamicParams(): void
    {
        $messageContent = [
            'content' => 'hello',
            'extra' => [
                'super_agent' => [
                    'dynamic_params' => [
                        'message_version' => 'v2',
                    ],
                ],
            ],
        ];

        $result = SuperMagicExecutionSource::stampMessageContent(
            $messageContent,
            SuperMagicExecutionSource::OpenApi
        );

        $this->assertSame('v2', $result['extra']['super_agent']['dynamic_params']['message_version']);
        $this->assertSame(
            'open_api',
            $result['extra']['super_agent']['dynamic_params'][SuperMagicExecutionSource::DYNAMIC_PARAM_KEY]
        );
    }

    public function testEnsureDynamicParamsDoesNotOverrideExistingSource(): void
    {
        $result = SuperMagicExecutionSource::ensureDynamicParams(
            [
                SuperMagicExecutionSource::DYNAMIC_PARAM_KEY => 'message_schedule',
            ],
            SuperMagicExecutionSource::HumanChat
        );

        $this->assertSame('message_schedule', $result[SuperMagicExecutionSource::DYNAMIC_PARAM_KEY]);
    }
}
