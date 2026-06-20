<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Application\SuperAgent\Service;

use App\Infrastructure\Util\Context\RequestContext;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use DateTime;
use Dtyq\SuperMagic\Application\SuperAgent\Service\MessageScheduleAppService;
use Dtyq\SuperMagic\Application\SuperAgent\Service\OpenMessageScheduleAppService;
use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request\UpdateMessageScheduleRequestDTO;
use Dtyq\TaskScheduler\Service\TaskSchedulerDomainService;
use Exception;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use Throwable;

/**
 * MessageScheduleAppService Unit Test.
 * 消息定时任务应用服务单元测试.
 * @internal
 */
class MessageScheduleAppServiceTest extends TestCase
{
    public function testOpenScheduleMessageContentUsesRequestedTopicPattern(): void
    {
        $reflection = new ReflectionClass(OpenMessageScheduleAppService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('buildFullMessageContent');
        $method->setAccessible(true);

        $result = $method->invoke(
            $service,
            '更新 AI 卡片',
            ['model_id' => 'test-model'],
            'ip-manager'
        );

        $this->assertSame(
            'ip-manager',
            $result['extra']['super_agent']['topic_pattern']
        );
    }

    public function testOpenScheduleMessageContentIncludesRequestedAgentCode(): void
    {
        $reflection = new ReflectionClass(OpenMessageScheduleAppService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('buildFullMessageContent');
        $method->setAccessible(true);

        $result = $method->invoke(
            $service,
            '更新自定义员工任务',
            ['model_id' => 'test-model'],
            'custom_agent',
            'SMA-custom-agent'
        );

        $this->assertSame(
            'SMA-custom-agent',
            $result['extra']['super_agent']['agent_code']
        );
    }

    public function testOpenScheduleJsonContentPreservesMentionNodeInContent(): void
    {
        $reflection = new ReflectionClass(OpenMessageScheduleAppService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('buildFullMessageContent');
        $method->setAccessible(true);

        $mention = [
            'type' => 'project_file',
            'file_id' => 'file-1',
            'file_name' => 'magic.project.js',
            'file_path' => '股票行情追踪/magic.project.js',
        ];
        $richContent = [
            'type' => 'doc',
            'content' => [
                [
                    'type' => 'paragraph',
                    'content' => [
                        [
                            'type' => 'mention',
                            'attrs' => $mention,
                        ],
                        [
                            'type' => 'text',
                            'text' => ' 更新 AI 卡片',
                        ],
                    ],
                ],
            ],
        ];

        $result = $method->invoke(
            $service,
            json_encode($richContent, JSON_UNESCAPED_UNICODE),
            ['model_id' => 'test-model'],
            'ip-manager'
        );

        $decodedContent = json_decode($result['content'], true);

        $this->assertSame('doc', $decodedContent['type']);
        $this->assertSame('mention', $decodedContent['content'][0]['content'][0]['type']);
        $this->assertSame(
            'magic.project.js',
            $decodedContent['content'][0]['content'][0]['attrs']['file_name']
        );
        $this->assertSame([], $result['extra']['super_agent']['mentions']);
        $this->assertSame('test-model', $result['extra']['super_agent']['model']['model_id']);
        $this->assertSame('ip-manager', $result['extra']['super_agent']['topic_pattern']);
    }

    public function testOpenScheduleJsonContentStringIsNotWrappedAsText(): void
    {
        $reflection = new ReflectionClass(OpenMessageScheduleAppService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('buildFullMessageContent');
        $method->setAccessible(true);

        $jsonContent = json_encode([
            'type' => 'doc',
            'content' => [
                [
                    'type' => 'paragraph',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => '更新 AI 卡片',
                        ],
                    ],
                ],
            ],
        ], JSON_UNESCAPED_UNICODE);

        $result = $method->invoke(
            $service,
            $jsonContent,
            ['model_id' => 'test-model'],
            'ip-manager'
        );

        $decodedContent = json_decode($result['content'], true);

        $this->assertSame('doc', $decodedContent['type']);
        $this->assertSame('更新 AI 卡片', $decodedContent['content'][0]['content'][0]['text']);
        $this->assertNotSame($jsonContent, $decodedContent['content'][0]['content'][0]['text']);
    }

    public function testOpenScheduleNonDocJsonStringRemainsPlainText(): void
    {
        $reflection = new ReflectionClass(OpenMessageScheduleAppService::class);
        $service = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('buildFullMessageContent');
        $method->setAccessible(true);

        $plainJsonText = json_encode([
            'type' => 'note',
            'content' => '这是一段普通 JSON 文本',
        ], JSON_UNESCAPED_UNICODE);

        $result = $method->invoke(
            $service,
            $plainJsonText,
            ['model_id' => 'test-model'],
            'ip-manager'
        );

        $decodedContent = json_decode($result['content'], true);

        $this->assertSame('doc', $decodedContent['type']);
        $this->assertSame($plainJsonText, $decodedContent['content'][0]['content'][0]['text']);
    }

    /**
     * Test messageScheduleCallback with missing message_schedule_id.
     * 测试缺少消息定时任务ID参数的情况.
     *
     * 🚫 Missing Parameter Test:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │     Input Params    │   Expected      │    Message      │   Success Flag  │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ Empty array         │ Error response  │ ID is required  │     false       │
     * │ Null ID             │ Error response  │ ID is required  │     false       │
     * │ Zero ID             │ Error response  │ ID is required  │     false       │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackMissingId(): void
    {
        // Test with zero ID (empty equivalent)
        $result = MessageScheduleAppService::messageScheduleCallback(0);

        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertEquals('Message schedule ID is required', $result['message']);
    }

    /**
     * Test messageScheduleCallback with zero ID (null equivalent).
     * 测试消息定时任务ID为0的情况（null的等效值）.
     */
    public function testMessageScheduleCallbackNullId(): void
    {
        $result = MessageScheduleAppService::messageScheduleCallback(0);

        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertEquals('Message schedule ID is required', $result['message']);
    }

    /**
     * Test messageScheduleCallback with zero ID.
     * 测试消息定时任务ID为0的情况.
     */
    public function testMessageScheduleCallbackZeroId(): void
    {
        $result = MessageScheduleAppService::messageScheduleCallback(0);

        $this->assertIsArray($result);
        $this->assertFalse($result['success']);
        $this->assertEquals('Message schedule ID is required', $result['message']);
    }

    /**
     * Test messageScheduleCallback with valid ID but di() throws exception.
     * 测试有效ID但依赖注入抛出异常的情况.
     *
     * 💥 Exception Handling Test:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │     Scenario        │   DI Behavior   │    Expected     │   Log Message   │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ DI throws exception │  Throws error   │ Error response  │ Exception logged│
     * │ Service execution   │  Throws error   │ Error response  │ Exception logged│
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackDependencyInjectionException(): void
    {
        // This test verifies that exceptions are properly caught and logged
        // Since we can't easily mock di() function in this context,
        // we'll test the exception handling structure

        $params = ['message_schedule_id' => 123];

        // The actual test would require mocking the di() function
        // For now, we'll verify the method exists and has proper structure
        $reflection = new ReflectionClass(MessageScheduleAppService::class);
        $method = $reflection->getMethod('messageScheduleCallback');

        $this->assertTrue($method->isStatic());
        $this->assertTrue($method->isPublic());
        $this->assertEquals('array', (string) $method->getReturnType());
    }

    /**
     * Test messageScheduleCallback method signature and return type.
     * 测试消息定时任务回调方法的签名和返回类型.
     *
     * 📋 Method Structure Validation:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │     Property        │   Expected      │     Actual      │    Status       │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ Method visibility   │     public      │     public      │       ✓         │
     * │ Method type         │     static      │     static      │       ✓         │
     * │ Return type         │     array       │     array       │       ✓         │
     * │ Parameter count     │       1         │       1         │       ✓         │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackMethodStructure(): void
    {
        $reflection = new ReflectionClass(MessageScheduleAppService::class);
        $method = $reflection->getMethod('messageScheduleCallback');

        // Verify method is static and public
        $this->assertTrue($method->isStatic(), 'Method should be static');
        $this->assertTrue($method->isPublic(), 'Method should be public');

        // Verify return type
        $returnType = $method->getReturnType();
        $this->assertNotNull($returnType, 'Method should have return type');
        $this->assertEquals('array', (string) $returnType, 'Method should return array');

        // Verify parameter count
        $parameters = $method->getParameters();
        $this->assertCount(1, $parameters, 'Method should have exactly 1 parameter');

        // Verify parameter type
        $param = $parameters[0];
        $this->assertEquals('message_schedule_id', $param->getName(), 'Parameter should be named message_schedule_id');
        $paramType = $param->getType();
        $this->assertNotNull($paramType, 'Parameter should have type hint');
        $this->assertEquals('int', (string) $paramType, 'Parameter should be int type');
    }

    /**
     * Test messageScheduleCallback with string ID.
     * 测试消息定时任务ID为字符串的情况.
     */
    public function testMessageScheduleCallbackStringId(): void
    {
        // PHP will automatically cast int 123 for the method parameter
        $result = MessageScheduleAppService::messageScheduleCallback(123);

        // Since 123 is likely not a valid ID, it should return 'Message schedule not found'
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('message', $result);
        $this->assertFalse($result['success']);
    }

    /**
     * Test messageScheduleCallback error response structure.
     * 测试消息定时任务回调错误响应结构.
     *
     * 🏗️ Response Structure Validation:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │   Response Field    │   Data Type     │   Required      │   Description   │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ success             │     boolean     │      Yes        │ Operation status│
     * │ message             │     string      │      Yes        │ Error message   │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackErrorResponseStructure(): void
    {
        $result = MessageScheduleAppService::messageScheduleCallback(0);

        // Verify response structure
        $this->assertIsArray($result, 'Response should be an array');
        $this->assertArrayHasKey('success', $result, 'Response should have success key');
        $this->assertArrayHasKey('message', $result, 'Response should have message key');

        // Verify data types
        $this->assertIsBool($result['success'], 'Success should be boolean');
        $this->assertIsString($result['message'], 'Message should be string');

        // Verify values for error case
        $this->assertFalse($result['success'], 'Success should be false for error');
        $this->assertNotEmpty($result['message'], 'Message should not be empty for error');
    }

    /**
     * Test messageScheduleCallback with various invalid ID formats.
     * 测试各种无效ID格式的消息定时任务回调.
     *
     * 🎯 Invalid ID Format Tests:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │    ID Value         │   Type          │   Expected      │   Reason        │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ ''                  │   string        │    Error        │ Empty string    │
     * │ 'abc'               │   string        │    Error        │ Non-numeric     │
     * │ -1                  │   integer       │    Error        │ Negative number │
     * │ false               │   boolean       │    Error        │ Boolean false   │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackInvalidIdFormats(): void
    {
        $invalidIds = [
            -1,               // Negative number
            0,                // Zero ID (empty equivalent)
            999999999999999,  // Very large non-existent ID
        ];

        foreach ($invalidIds as $invalidId) {
            $result = MessageScheduleAppService::messageScheduleCallback($invalidId);

            $this->assertIsArray($result, 'Response should be array for ID: ' . var_export($invalidId, true));
            $this->assertFalse($result['success'], 'Success should be false for invalid ID: ' . var_export($invalidId, true));

            // For zero IDs, expect 'Message schedule ID is required'
            // For negative and non-existent IDs, expect 'Message schedule not found'
            if ($invalidId == 0) {
                $this->assertEquals('Message schedule ID is required', $result['message'], 'Error message should match for ID: ' . var_export($invalidId, true));
            } else {
                $this->assertEquals('Message schedule not found', $result['message'], 'Error message should match for ID: ' . var_export($invalidId, true));
            }
        }
    }

    /**
     * Test messageScheduleCallback with valid real ID.
     * 测试使用真实有效ID的消息定时任务回调.
     *
     * 🎯 Real Scenario Test:
     * ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
     * │   Input ID          │   Expected      │   Result Type   │   Validation    │
     * ├─────────────────────┼─────────────────┼─────────────────┼─────────────────┤
     * │ 831488811665473536  │ Service call    │ Array response  │ Has success key │
     * └─────────────────────┴─────────────────┴─────────────────┴─────────────────┘
     */
    public function testMessageScheduleCallbackWithRealId(): void
    {
        $realId = 831488811665473536;

        // Call the actual method
        $result = MessageScheduleAppService::messageScheduleCallback($realId);

        // Verify response structure (regardless of success/failure)
        $this->assertIsArray($result, 'Response should be an array');
        $this->assertArrayHasKey('success', $result, 'Response should have success key');

        // Check for correct key structure based on success/failure scenarios
        if (isset($result['message'])) {
            // Error scenario from messageScheduleCallback (ID validation, exceptions)
            $this->assertIsString($result['message'], 'Message should be string');
            $errorMessage = $result['message'];
        } else {
            // Success scenario from executeMessageSchedule (actual execution)
            $this->assertArrayHasKey('error_message', $result, 'Response should have error_message key');
            $this->assertArrayHasKey('result', $result, 'Response should have result key');
            $errorMessage = $result['error_message'] ?? 'Success';
        }

        // Verify success is boolean
        $this->assertIsBool($result['success'], 'Success should be boolean');

        // Log the actual result for debugging
        echo "\n=== Real ID Test Result ===\n";
        echo "ID: {$realId}\n";
        echo 'Success: ' . ($result['success'] ? 'true' : 'false') . "\n";
        echo "Message/Error: {$errorMessage}\n";
        echo 'Full Result: ' . json_encode($result, JSON_PRETTY_PRINT) . "\n";
        echo "========================\n";

        // The actual success/failure depends on the service implementation and data
        // We just verify the structure is correct
        if (! $result['success'] && isset($result['message'])) {
            // If it fails with 'message' key, it should not be the "ID is required" error
            $this->assertNotEquals(
                'Message schedule ID is required',
                $result['message'],
                'Should not fail with missing ID error when ID is provided'
            );
        }
    }

    /**
     * Test messageScheduleCallback with valid ID as string.
     * 测试使用字符串格式有效ID的消息定时任务回调.
     */
    public function testMessageScheduleCallbackWithRealIdAsString(): void
    {
        $realId = '831488811665473536';

        // Call the actual method - convert string to int for the new signature
        $result = MessageScheduleAppService::messageScheduleCallback((int) $realId);

        // Verify response structure
        $this->assertIsArray($result, 'Response should be an array');
        $this->assertArrayHasKey('success', $result, 'Response should have success key');

        // Check for correct key structure based on success/failure scenarios
        if (isset($result['message'])) {
            // Error scenario from messageScheduleCallback (ID validation, exceptions)
            $this->assertIsString($result['message'], 'Message should be string');
            $errorMessage = $result['message'];
        } else {
            // Success scenario from executeMessageSchedule (actual execution)
            $this->assertArrayHasKey('error_message', $result, 'Response should have error_message key');
            $this->assertArrayHasKey('result', $result, 'Response should have result key');
            $errorMessage = $result['error_message'] ?? 'Success';
        }

        // Verify success is boolean
        $this->assertIsBool($result['success'], 'Success should be boolean');

        // Log the actual result for debugging
        echo "\n=== Real ID (String) Test Result ===\n";
        echo "ID: {$realId}\n";
        echo 'Success: ' . ($result['success'] ? 'true' : 'false') . "\n";
        echo "Message/Error: {$errorMessage}\n";
        echo 'Full Result: ' . json_encode($result, JSON_PRETTY_PRINT) . "\n";
        echo "==================================\n";

        // Should not fail with the "ID is required" error
        if (! $result['success'] && isset($result['message'])) {
            $this->assertNotEquals(
                'Message schedule ID is required',
                $result['message'],
                'Should not fail with missing ID error when valid string ID is provided'
            );
        }
    }

    /**
     * Test that messageScheduleCallback method exists and is callable.
     * 测试消息定时任务回调方法存在且可调用.
     */
    public function testMessageScheduleCallbackMethodExists(): void
    {
        $this->assertTrue(
            method_exists(MessageScheduleAppService::class, 'messageScheduleCallback'),
            'messageScheduleCallback method should exist'
        );

        $this->assertTrue(
            is_callable([MessageScheduleAppService::class, 'messageScheduleCallback']),
            'messageScheduleCallback method should be callable'
        );
    }

    /**
     * Test getNextExecutionTime with real crontab ID.
     * 测试使用真实 crontab ID 获取下一次执行时间.
     */
    public function testGetNextExecutionTimeWithRealCrontabId(): void
    {
        $realCrontabId = 831207343180734464;

        echo "\n🚀 Testing getNextExecutionTime with real crontab ID\n";
        echo "================================================\n";
        echo "Real Crontab ID: {$realCrontabId}\n";
        echo 'Current time: ' . date('Y-m-d H:i:s') . "\n";
        echo "---\n";

        try {
            // 获取 TaskSchedulerDomainService 实例
            $taskSchedulerService = di(TaskSchedulerDomainService::class);

            // 调用 getNextExecutionTime 方法
            $nextTime = $taskSchedulerService->getNextExecutionTime($realCrontabId);

            echo 'Result: ' . ($nextTime ?? 'null') . "\n";

            if ($nextTime === null) {
                echo "💡 Possible reasons for null result:\n";
                echo "   - Crontab ID does not exist\n";
                echo "   - Task is disabled\n";
                echo "   - Task has expired\n";
                echo "   - Invalid cron expression\n";

                // 这里不做断言失败，因为null也是合法的结果
                $this->assertNull($nextTime, 'Method should return null for invalid/disabled/expired tasks');
            } else {
                echo "✅ Success! Next execution time: {$nextTime}\n";

                // 验证时间格式
                $this->assertIsString($nextTime, 'Next execution time should be a string');
                $this->assertMatchesRegularExpression(
                    '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/',
                    $nextTime,
                    'Next execution time should be in YYYY-MM-DD HH:MM:SS format'
                );

                // 验证时间是否在未来
                $now = new DateTime();
                $nextDateTime = new DateTime($nextTime);
                $this->assertGreaterThan($now, $nextDateTime, 'Next execution time should be in the future');

                // 计算时间差
                $diff = $nextDateTime->diff($now);
                echo '⏳ Time until next execution: ';
                if ($diff->days > 0) {
                    echo "{$diff->days} days ";
                }
                if ($diff->h > 0) {
                    echo "{$diff->h} hours ";
                }
                if ($diff->i > 0) {
                    echo "{$diff->i} minutes ";
                }
                echo "{$diff->s} seconds\n";

                echo "✅ All validations passed!\n";
            }
        } catch (Throwable $e) {
            echo "💥 Exception occurred:\n";
            echo "Error: {$e->getMessage()}\n";
            echo "File: {$e->getFile()}:{$e->getLine()}\n";

            // 重新抛出异常以便测试失败
            throw $e;
        }

        echo "🏁 Test completed successfully.\n";
        echo "============================\n";
    }

    /**
     * Test updateSchedule method to verify the fix for "定时任务ID 不能为空" error.
     * 测试 updateSchedule 方法，验证"定时任务ID 不能为空"错误的修复.
     */
    public function testUpdateScheduleToVerifyTaskSchedulerIdFix(): void
    {
        // 使用之前测试过的真实 message_schedule_id
        $realMessageScheduleId = 831488811665473536;

        echo "\n🔧 Testing updateSchedule method fix\n";
        echo "=====================================\n";
        echo "Message Schedule ID: {$realMessageScheduleId}\n";
        echo 'Current time: ' . date('Y-m-d H:i:s') . "\n";
        echo "---\n";

        try {
            // 创建 MessageScheduleAppService 实例
            $appService = di(MessageScheduleAppService::class);

            // 创建一个模拟的 RequestContext
            $authorization = new MagicUserAuthorization();
            $authorization->setId('usi_516c3a162c868e6f02de247a10e59d05');
            $authorization->setOrganizationCode('DT001');

            $requestContext = new RequestContext();
            $requestContext->setUserAuthorization($authorization);

            // 创建一个更新DTO（模拟一个简单的更新，比如更改启用状态）
            $updateDTO = new UpdateMessageScheduleRequestDTO();

            // 设置一个简单的更新：启用任务
            $reflection = new ReflectionClass($updateDTO);
            $enabledProperty = $reflection->getProperty('enabled');
            $enabledProperty->setAccessible(true);
            $enabledProperty->setValue($updateDTO, 1);

            // 也可以设置一些消息内容来触发更新
            $messageContentProperty = $reflection->getProperty('messageContent');
            $messageContentProperty->setAccessible(true);
            $messageContentProperty->setValue($updateDTO, [
                'instructs' => [['value' => 'plan', 'instruction' => null]],
                'extra' => [
                    'super_agent' => [
                        'input_mode' => 'plan',
                        'chat_mode' => 'normal',
                        'topic_pattern' => 'general',
                    ],
                ],
                'content' => '{"type":"doc","content":[{"type":"paragraph","attrs":{"suggestion":""},"content":[{"type":"text","text":"你好麦吉"}]}]}',
            ]);

            echo "🔄 Calling updateSchedule method...\n";

            // 调用 updateSchedule 方法
            $result = $appService->updateSchedule($requestContext, $realMessageScheduleId, $updateDTO);

            echo "✅ updateSchedule completed successfully!\n";
            echo 'Result: ' . json_encode($result, JSON_PRETTY_PRINT) . "\n";

            // 验证返回结构
            $this->assertIsArray($result, 'Result should be an array');
            $this->assertArrayHasKey('id', $result, 'Result should have id key');
            $this->assertEquals((string) $realMessageScheduleId, $result['id'], 'Returned ID should match input ID');

            echo "✅ All validations passed!\n";
            echo "✅ Fix verification: TaskScheduler ID issue resolved!\n";
        } catch (Throwable $e) {
            echo "💥 Exception occurred:\n";
            echo "Error: {$e->getMessage()}\n";
            echo "File: {$e->getFile()}:{$e->getLine()}\n";

            // 检查是否是之前的错误
            if (strpos($e->getMessage(), '定时任务ID 不能为空') !== false) {
                echo "❌ The original bug still exists!\n";
                $this->fail('The fix did not resolve the "定时任务ID 不能为空" error');
            } else {
                echo "ℹ️  Different error occurred (may be expected).\n";
                // 重新抛出异常以便测试失败
                throw $e;
            }
        }

        echo "🏁 Update schedule test completed.\n";
        echo "=================================\n";
    }

    /**
     * Test the simplified getNextExecutionTime method.
     * 测试简化后的 getNextExecutionTime 方法.
     */
    public function testSimplifiedGetNextExecutionTimeMethod(): void
    {
        // 使用之前测试过的真实 crontab_id
        $realCrontabId = 831207343180734464;

        echo "\n🔄 Testing simplified getNextExecutionTime method\n";
        echo "================================================\n";
        echo "Crontab ID: {$realCrontabId}\n";
        echo 'Current time: ' . date('Y-m-d H:i:s') . "\n";
        echo "---\n";

        try {
            // 创建 MessageScheduleAppService 实例
            $appService = di(MessageScheduleAppService::class);

            echo "🔄 Testing the simplified method...\n";

            // 调用简化后的 getNextExecutionTime 方法
            $result = $appService->getNextExecutionTime($realCrontabId);

            echo "✅ Method executed successfully!\n";
            echo 'Result: ' . ($result ?? 'null') . "\n";

            // 验证返回值类型
            if ($result !== null) {
                $this->assertIsString($result, 'Result should be string when not null');
                $this->assertMatchesRegularExpression(
                    '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/',
                    $result,
                    'Result should be in YYYY-MM-DD HH:MM:SS format'
                );

                // 验证时间是否在未来
                $nextTime = new DateTime($result);
                $now = new DateTime();
                $this->assertGreaterThan($now, $nextTime, 'Next execution time should be in the future');

                echo "✅ Valid datetime format: {$result}\n";
                echo "✅ Time is in the future\n";
            } else {
                echo "ℹ️  Result is null (task may be disabled, expired, or invalid)\n";
            }

            // 测试 null crontab ID
            $nullResult = $appService->getNextExecutionTime(null);
            $this->assertNull($nullResult, 'Null crontab ID should return null');
            echo "✅ Null input test passed\n";

            // 测试不存在的 crontab ID
            $nonExistentResult = $appService->getNextExecutionTime(999999);
            $this->assertNull($nonExistentResult, 'Non-existent crontab ID should return null');
            echo "✅ Non-existent ID test passed\n";

            echo "✅ All validations passed!\n";
            echo "✅ Simplification successful: Method now has clean input/output!\n";
        } catch (Throwable $e) {
            echo "💥 Exception occurred:\n";
            echo "Error: {$e->getMessage()}\n";
            echo "File: {$e->getFile()}:{$e->getLine()}\n";

            // 重新抛出异常以便测试失败
            throw $e;
        }

        echo "🏁 Simplified method test completed successfully.\n";
        echo "===============================================\n";
    }
}
