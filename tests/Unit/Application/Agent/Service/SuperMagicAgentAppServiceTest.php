<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Application\Agent\Service;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\Mode\Entity\ModeDataIsolation;
use App\Domain\Mode\Entity\ValueQuery\ModeQuery;
use App\Domain\Mode\Service\ModeDomainService;
use App\Infrastructure\Core\DataIsolation\BaseOrganizationInfoManager;
use App\Infrastructure\Core\DataIsolation\BaseSubscriptionManager;
use App\Infrastructure\Core\DataIsolation\BaseThirdPlatformDataIsolationManager;
use App\Infrastructure\Core\DataIsolation\OrganizationInfoManagerInterface;
use App\Infrastructure\Core\DataIsolation\SubscriptionManagerInterface;
use App\Infrastructure\Core\DataIsolation\ThirdPlatformDataIsolationManagerInterface;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Core\ValueObject\Page;
use Dtyq\SuperMagic\Application\Agent\Service\SuperMagicAgentAppService;
use Dtyq\SuperMagic\Application\Collaboration\Policy\ResourceAccessPolicyService;
use Dtyq\SuperMagic\Domain\Agent\Entity\SuperMagicAgentEntity;
use Dtyq\SuperMagic\Domain\Agent\Entity\ValueObject\SuperMagicAgentDataIsolation;
use Dtyq\SuperMagic\Domain\Agent\Entity\ValueObject\SuperMagicAgentTool;
use Dtyq\SuperMagic\Domain\Agent\Entity\ValueObject\SuperMagicAgentToolType;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ProjectEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\AgentContext;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\AgentDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TaskDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Service\TopicDomainService;
use Hyperf\Codec\Packer\PhpSerializerPacker;
use Hyperf\Context\ApplicationContext;
use Hyperf\Contract\ConfigInterface;
use PHPUnit\Framework\TestCase;
use Psr\Container\ContainerInterface;
use Psr\Log\NullLogger;
use ReflectionClass;
use ReflectionMethod;
use ReflectionProperty;
use RuntimeException;

/**
 * @internal
 */
class SuperMagicAgentAppServiceTest extends TestCase
{
    private SuperMagicAgentAppService $service;

    private ?ContainerInterface $previousContainer = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->previousContainer = ApplicationContext::hasContainer() ? ApplicationContext::getContainer() : null;
        $this->service = (new ReflectionClass(SuperMagicAgentAppService::class))->newInstanceWithoutConstructor();
    }

    protected function tearDown(): void
    {
        if ($this->previousContainer !== null) {
            ApplicationContext::setContainer($this->previousContainer);
        } else {
            $containerProperty = new ReflectionProperty(ApplicationContext::class, 'container');
            $containerProperty->setAccessible(true);
            $containerProperty->setValue(null, null);
        }

        parent::tearDown();
    }

    public function testHydrateToolSchemasAddsKnowledgeSearchSchemaWhenToolExists(): void
    {
        $tool = new SuperMagicAgentTool();
        $tool->setCode('search_knowledge');
        $tool->setName('Knowledge Search');
        $tool->setDescription('Search for knowledge and related context');
        $tool->setType(SuperMagicAgentToolType::BuiltIn);

        $agent = new class([$tool]) extends SuperMagicAgentEntity {
            public function __construct(private array $stubTools)
            {
            }

            public function getTools(): array
            {
                return $this->stubTools;
            }
        };

        $flowDataIsolation = (new ReflectionClass(FlowDataIsolation::class))->newInstanceWithoutConstructor();

        $method = new ReflectionMethod($this->service, 'hydrateToolSchemas');
        $method->setAccessible(true);
        $method->invoke($this->service, $agent, $flowDataIsolation);

        self::assertSame(
            [
                'type' => 'object',
                'properties' => [
                    'query' => [
                        'type' => 'string',
                        'description' => '用于检索相关知识上下文的查询语句。',
                    ],
                ],
                'required' => ['query'],
                'additionalProperties' => false,
            ],
            $tool->getSchema()
        );
    }

    public function testAssertAgentReadableRejectsCreatorWithoutResourceAccess(): void
    {
        ApplicationContext::setContainer($this->buildContainer([]));

        $resourceAccessPolicyService = $this->createMock(ResourceAccessPolicyService::class);
        $resourceAccessPolicyService->expects($this->once())
            ->method('assertReadable')
            ->willThrowException(new BusinessException('common.not_found'));

        $this->setProperty($this->service, 'resourceAccessPolicyService', $resourceAccessPolicyService);
        $this->setProperty($this->service, 'modeDomainService', $this->createModeDomainService([]));

        $dataIsolation = new SuperMagicAgentDataIsolation('DT001', 'user-1');

        $method = new ReflectionMethod($this->service, 'assertAgentReadable');
        $method->setAccessible(true);

        $this->expectException(BusinessException::class);
        $method->invoke($this->service, $dataIsolation, 'creator-only-agent');
    }

    public function testInitializeAgentPublishSandboxUsesProjectCurrentTopicAndPoolInitialization(): void
    {
        $dataIsolation = (new ReflectionClass(SuperMagicAgentDataIsolation::class))->newInstanceWithoutConstructor();
        $dataIsolation->setCurrentOrganizationCode('ORG')->setCurrentUserId('user-1');
        ApplicationContext::setContainer($this->buildContainer([]));

        $projectEntity = new ProjectEntity([
            'id' => 123,
            'workspace_id' => 456,
            'project_name' => 'Agent Project',
            'work_dir' => '/project_123/runtime',
            'user_id' => 'user-1',
            'user_organization_code' => 'ORG',
            'current_topic_id' => 777,
        ]);
        $topicEntity = new TopicEntity([
            'id' => 777,
            'workspace_id' => 456,
            'project_id' => 123,
            'chat_topic_id' => 'chat-topic-777',
            'chat_conversation_id' => 'chat-conversation-777',
            'sandbox_id' => '777',
            'work_dir' => '/project_123/runtime',
        ]);
        $taskEntity = new TaskEntity([
            'id' => 888,
            'workspace_id' => 456,
            'project_id' => 123,
            'topic_id' => 777,
            'sandbox_id' => '',
            'prompt' => 'Agent Publish Export Task',
        ]);
        $agentContext = new AgentContext(
            sandboxId: '',
            authToken: 'auth-token',
            projectEntity: $projectEntity,
            topicEntity: $topicEntity,
            taskEntity: $taskEntity,
        );

        $topicDomainService = $this->createMock(TopicDomainService::class);
        $topicDomainService->expects($this->once())
            ->method('getTopicById')
            ->with(777)
            ->willReturn($topicEntity);
        $topicDomainService->expects($this->once())
            ->method('updateTopicAgentCode')
            ->with($this->isInstanceOf(DataIsolation::class), 777, 'SMA-agent');
        $topicDomainService->expects($this->once())
            ->method('updateTopicStatusAndSandboxId')
            ->with(777, 888, TaskStatus::FINISHED, 'pooled-agent-sandbox-1');

        $taskDomainService = $this->createMock(TaskDomainService::class);
        $taskDomainService->expects($this->once())
            ->method('initDefaultTask')
            ->with(
                $this->isInstanceOf(DataIsolation::class),
                $this->callback(static fn (TopicEntity $topic): bool => $topic->getSandboxId() === ''),
                'Agent Publish Export Task'
            )
            ->willReturn($taskEntity);
        $taskDomainService->expects($this->once())
            ->method('updateTaskStatus')
            ->with(TaskStatus::FINISHED, 888, '888', 'pooled-agent-sandbox-1');

        $agentDomainService = $this->createMock(AgentDomainService::class);
        $agentDomainService->expects($this->once())
            ->method('buildInitAgentContext')
            ->with(
                $this->isInstanceOf(DataIsolation::class),
                $projectEntity,
                $topicEntity,
                $taskEntity,
                '',
                true
            )
            ->willReturn($agentContext);
        $agentDomainService->expects($this->once())
            ->method('ensureSandboxInitialized')
            ->with($this->isInstanceOf(DataIsolation::class), $agentContext)
            ->willReturn('pooled-agent-sandbox-1');
        $agentDomainService->expects($this->never())->method('ensureSandboxRunning');

        $this->setProperty($this->service, 'topicDomainService', $topicDomainService);
        $this->setProperty($this->service, 'taskDomainService', $taskDomainService);
        $this->setProperty($this->service, 'agentDomainService', $agentDomainService);
        $this->setProperty($this->service, 'logger', new NullLogger());

        $method = new ReflectionMethod($this->service, 'initializeAgentPublishSandbox');
        $method->setAccessible(true);

        $sandboxId = $method->invoke($this->service, $dataIsolation, 'SMA-agent', $projectEntity);

        self::assertSame('pooled-agent-sandbox-1', $sandboxId);
    }

    /**
     * @param array<string> $officialCodes
     */
    private function createModeDomainService(array $officialCodes): ModeDomainService
    {
        return new class extends ModeDomainService {
            public function __construct()
            {
            }

            public function getModes(ModeDataIsolation $dataIsolation, ModeQuery $query, Page $page): array
            {
                return ['total' => 0, 'list' => []];
            }
        };
    }

    private function setProperty(object $object, string $property, mixed $value): void
    {
        $reflectionProperty = new ReflectionProperty($object, $property);
        $reflectionProperty->setAccessible(true);
        $reflectionProperty->setValue($object, $value);
    }

    private function buildContainer(array $services): ContainerInterface
    {
        return new class($services) implements ContainerInterface {
            public function __construct(private readonly array $services)
            {
            }

            public function make(string $id, array $parameters = [])
            {
                if ($this->has($id)) {
                    return $this->get($id);
                }

                return new $id(...array_values($parameters));
            }

            public function get(string $id)
            {
                if ($this->has($id)) {
                    if ($id === ThirdPlatformDataIsolationManagerInterface::class && ! isset($this->services[$id])) {
                        return new BaseThirdPlatformDataIsolationManager();
                    }
                    if ($id === SubscriptionManagerInterface::class && ! isset($this->services[$id])) {
                        return new BaseSubscriptionManager();
                    }
                    if ($id === OrganizationInfoManagerInterface::class && ! isset($this->services[$id])) {
                        return new BaseOrganizationInfoManager();
                    }
                    if ($id === PhpSerializerPacker::class && ! isset($this->services[$id])) {
                        return new PhpSerializerPacker();
                    }
                    if ($id === ConfigInterface::class && ! isset($this->services[$id])) {
                        return new class implements ConfigInterface {
                            private array $values = ['app_env' => 'testing'];

                            public function get(string $key, mixed $default = null): mixed
                            {
                                return $this->values[$key] ?? $default;
                            }

                            public function has(string $keys): bool
                            {
                                return array_key_exists($keys, $this->values);
                            }

                            public function set(string $key, mixed $value): void
                            {
                                $this->values[$key] = $value;
                            }
                        };
                    }

                    return $this->services[$id];
                }

                throw new RuntimeException(sprintf('Service %s not found.', $id));
            }

            public function has(string $id): bool
            {
                return in_array($id, [
                    ThirdPlatformDataIsolationManagerInterface::class,
                    SubscriptionManagerInterface::class,
                    OrganizationInfoManagerInterface::class,
                    PhpSerializerPacker::class,
                    ConfigInterface::class,
                ], true)
                    || array_key_exists($id, $this->services);
            }
        };
    }
}
