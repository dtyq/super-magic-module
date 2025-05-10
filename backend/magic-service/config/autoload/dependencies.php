<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
use App\Application\Chat\Service\MagicAgentEventAppService;
use App\Application\Chat\Service\SessionAppService;
use App\Application\Flow\ExecuteManager\NodeRunner\Code\CodeExecutor\PHPExecutor;
use App\Application\Flow\ExecuteManager\NodeRunner\Code\CodeExecutor\PythonExecutor;
use App\Application\Flow\ExecuteManager\NodeRunner\ReplyMessage\Struct\BaseMessageAttachmentHandler;
use App\Application\Flow\ExecuteManager\NodeRunner\ReplyMessage\Struct\MessageAttachmentHandlerInterface;
use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\ExternalFileDocumentFileStrategyDriver;
use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\Interfaces\ExternalFileDocumentFileStrategyInterface;
use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\Interfaces\ThirdPlatformDocumentFileStrategyInterface;
use App\Application\KnowledgeBase\Service\Strategy\DocumentFile\Driver\ThirdPlatformDocumentFileStrategyDriver;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\BaseFullTextSimilaritySearch;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\BaseGraphSimilaritySearch;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\BaseHybridSimilaritySearch;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\BaseSemanticSimilaritySearch;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\FullTextSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\GraphSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\HybridSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\SemanticSimilaritySearchInterface;
use App\Domain\Admin\Repository\Facade\AdminGlobalSettingsRepositoryInterface;
use App\Domain\Admin\Repository\Persistence\AdminGlobalSettingsRepository;
use App\Domain\Agent\Repository\Facade\MagicBotThirdPlatformChatRepositoryInterface;
use App\Domain\Agent\Repository\Persistence\MagicBotThirdPlatformChatRepository;
use App\Domain\Authentication\Repository\Facade\AuthenticationRepositoryInterface;
use App\Domain\Authentication\Repository\Implement\AuthenticationRepository;
use App\Domain\Chat\DTO\Message\ChatMessage\SuperAgentMessageInterface;
use App\Domain\Chat\DTO\Message\ChatMessage\UnknowChatMessage;
use App\Domain\Chat\Event\Agent\AgentExecuteInterface;
use App\Domain\Chat\Repository\Facade\MagicChatConversationRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicChatFileRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicChatMessageVersionsRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicChatSeqRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicChatTopicRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicContactIdMappingRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicFriendRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicMessageRepositoryInterface;
use App\Domain\Chat\Repository\Facade\MagicStreamMessageRepositoryInterface;
use App\Domain\Chat\Repository\Persistence\MagicChatConversationRepository;
use App\Domain\Chat\Repository\Persistence\MagicChatFileRepository;
use App\Domain\Chat\Repository\Persistence\MagicChatSeqRepository;
use App\Domain\Chat\Repository\Persistence\MagicChatTopicRepository;
use App\Domain\Chat\Repository\Persistence\MagicContactIdMappingRepository;
use App\Domain\Chat\Repository\Persistence\MagicFriendRepository;
use App\Domain\Chat\Repository\Persistence\MagicMessageRepository;
use App\Domain\Chat\Repository\Persistence\MagicMessageVersionsRepository;
use App\Domain\Chat\Repository\Persistence\MagicStreamMessageRepository;
use App\Domain\Contact\Repository\Facade\MagicAccountRepositoryInterface;
use App\Domain\Contact\Repository\Facade\MagicDepartmentRepositoryInterface;
use App\Domain\Contact\Repository\Facade\MagicDepartmentUserRepositoryInterface;
use App\Domain\Contact\Repository\Facade\MagicUserIdRelationRepositoryInterface;
use App\Domain\Contact\Repository\Facade\MagicUserRepositoryInterface;
use App\Domain\Contact\Repository\Persistence\MagicAccountRepository;
use App\Domain\Contact\Repository\Persistence\MagicDepartmentRepository;
use App\Domain\Contact\Repository\Persistence\MagicDepartmentUserRepository;
use App\Domain\Contact\Repository\Persistence\MagicUserIdRelationRepository;
use App\Domain\Contact\Repository\Persistence\MagicUserRepository;
use App\Domain\File\Repository\Persistence\CloudFileRepository;
use App\Domain\File\Repository\Persistence\Facade\CloudFileRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowAIModelRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowApiKeyRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowDraftRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowExecuteLogRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowMemoryHistoryRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowMultiModalLogRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowPermissionRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowToolSetRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowTriggerTestcaseRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowVersionRepositoryInterface;
use App\Domain\Flow\Repository\Facade\MagicFlowWaitMessageRepositoryInterface;
use App\Domain\Flow\Repository\Persistence\MagicFlowAIModelRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowApiKeyRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowDraftRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowExecuteLogRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowMemoryHistoryRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowMultiModalLogRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowPermissionRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowToolSetRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowTriggerTestcaseRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowVersionRepository;
use App\Domain\Flow\Repository\Persistence\MagicFlowWaitMessageRepository;
use App\Domain\Group\Repository\Facade\MagicGroupRepositoryInterface;
use App\Domain\Group\Repository\Persistence\MagicGroupRepository;
use App\Domain\KnowledgeBase\Entity\ValueObject\Interface\KnowledgeTypeFactoryInterface;
use App\Domain\KnowledgeBase\Factory\KnowledgeTypeFactory;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseDocumentRepositoryInterface;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseFragmentRepositoryInterface;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseRepositoryInterface;
use App\Domain\KnowledgeBase\Repository\Persistence\KnowledgeBaseBaseRepository;
use App\Domain\KnowledgeBase\Repository\Persistence\KnowledgeBaseDocumentRepository;
use App\Domain\KnowledgeBase\Repository\Persistence\KnowledgeBaseFragmentRepository;
use App\Domain\ModelGateway\Repository\Facade\AccessTokenRepositoryInterface;
use App\Domain\ModelGateway\Repository\Facade\ApplicationRepositoryInterface;
use App\Domain\ModelGateway\Repository\Facade\ModelConfigRepositoryInterface;
use App\Domain\ModelGateway\Repository\Facade\MsgLogRepositoryInterface;
use App\Domain\ModelGateway\Repository\Facade\OrganizationConfigRepositoryInterface;
use App\Domain\ModelGateway\Repository\Facade\UserConfigRepositoryInterface;
use App\Domain\ModelGateway\Repository\Persistence\AccessTokenRepository;
use App\Domain\ModelGateway\Repository\Persistence\ApplicationRepository;
use App\Domain\ModelGateway\Repository\Persistence\ModelConfigRepository;
use App\Domain\ModelGateway\Repository\Persistence\MsgLogRepository;
use App\Domain\ModelGateway\Repository\Persistence\OrganizationConfigRepository;
use App\Domain\ModelGateway\Repository\Persistence\UserConfigRepository;
use App\Domain\OrganizationEnvironment\Entity\Facade\OpenPlatformConfigInterface;
use App\Domain\OrganizationEnvironment\Entity\Item\OpenPlatformConfigItem;
use App\Domain\OrganizationEnvironment\Repository\Facade\EnvironmentRepositoryInterface;
use App\Domain\OrganizationEnvironment\Repository\Facade\OrganizationsEnvironmentRepositoryInterface;
use App\Domain\OrganizationEnvironment\Repository\Facade\OrganizationsPlatformRepositoryInterface;
use App\Domain\OrganizationEnvironment\Repository\MagicEnvironmentsRepository;
use App\Domain\OrganizationEnvironment\Repository\OrganizationsEnvironmentRepository;
use App\Domain\OrganizationEnvironment\Repository\OrganizationsPlatformRepository;
use App\Domain\Permission\Repository\Facade\OperationPermissionRepositoryInterface;
use App\Domain\Permission\Repository\Persistence\OperationPermissionRepository;
use App\Domain\Provider\Repository\Facade\ProviderConfigRepositoryInterface;
use App\Domain\Provider\Repository\Facade\ProviderModelRepositoryInterface;
use App\Domain\Provider\Repository\Facade\ProviderRepositoryInterface;
use App\Domain\Provider\Repository\Persistence\ProviderConfigRepository;
use App\Domain\Provider\Repository\Persistence\ProviderModelRepository;
use App\Domain\Provider\Repository\Persistence\ProviderRepository;
use App\Domain\Token\Item\MagicTokenExtra;
use App\Domain\Token\Repository\Facade\MagicTokenExtraInterface;
use App\Domain\Token\Repository\Facade\MagicTokenRepositoryInterface;
use App\Domain\Token\Repository\Persistence\MagicMagicTokenRepository;
use App\Infrastructure\Core\Contract\Authorization\BaseFlowOpenApiCheck;
use App\Infrastructure\Core\Contract\Authorization\FlowOpenApiCheckInterface;
use App\Infrastructure\Core\Contract\Flow\CodeExecutor\PHPExecutorInterface;
use App\Infrastructure\Core\Contract\Flow\CodeExecutor\PythonExecutorInterface;
use App\Infrastructure\Core\Contract\Session\SessionInterface;
use App\Infrastructure\Core\DataIsolation\BaseHandleDataIsolation;
use App\Infrastructure\Core\DataIsolation\BaseThirdPlatformDataIsolationManager;
use App\Infrastructure\Core\DataIsolation\HandleDataIsolationInterface;
use App\Infrastructure\Core\DataIsolation\ThirdPlatformDataIsolationManagerInterface;
use App\Infrastructure\Core\Embeddings\DocumentSplitter\DocumentSplitterInterface;
use App\Infrastructure\Core\Embeddings\DocumentSplitter\OdinRecursiveCharacterTextSplitter;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGeneratorInterface;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\OdinEmbeddingGenerator;
use App\Infrastructure\Core\File\Parser\Driver\ExcelFileParserDriver;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\ExcelFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\OcrFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\TextFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\Interfaces\WordFileParserDriverInterface;
use App\Infrastructure\Core\File\Parser\Driver\OcrFileParserDriver;
use App\Infrastructure\Core\File\Parser\Driver\TextFileParserDriver;
use App\Infrastructure\Core\File\Parser\Driver\WordFileParserDriver;
use App\Infrastructure\ExternalAPI\Sms\SmsInterface;
use App\Infrastructure\ExternalAPI\Sms\TemplateInterface;
use App\Infrastructure\ExternalAPI\Sms\Volcengine\Template;
use App\Infrastructure\ExternalAPI\Sms\Volcengine\VolceApiClient;
use App\Infrastructure\Util\Auth\Permission\Permission;
use App\Infrastructure\Util\Auth\Permission\PermissionInterface;
use App\Infrastructure\Util\Client\SimpleClientFactory;
use App\Infrastructure\Util\Locker\LockerInterface;
use App\Infrastructure\Util\Locker\RedisLocker;
use Hyperf\Config\ProviderConfig;
use Hyperf\Crontab\Strategy\CoroutineStrategy;
use Hyperf\Crontab\Strategy\StrategyInterface;
use Hyperf\HttpServer\Server;
use Hyperf\SocketIOServer\BaseNamespace;
use Hyperf\SocketIOServer\NamespaceInterface;
use Hyperf\SocketIOServer\Room\AdapterInterface;
use Hyperf\SocketIOServer\Room\RedisAdapter;
use Hyperf\SocketIOServer\SidProvider\DistributedSidProvider;
use Hyperf\SocketIOServer\SidProvider\SidProviderInterface;
use Psr\Http\Client\ClientInterface;

$dependencies = [
    SmsInterface::class => VolceApiClient::class,
    LockerInterface::class => RedisLocker::class,
    MagicTokenRepositoryInterface::class => MagicMagicTokenRepository::class,
    TemplateInterface::class => Template::class,

    // core
    ThirdPlatformDataIsolationManagerInterface::class => BaseThirdPlatformDataIsolationManager::class,
    DocumentSplitterInterface::class => OdinRecursiveCharacterTextSplitter::class,
    HandleDataIsolationInterface::class => BaseHandleDataIsolation::class,
    FlowOpenApiCheckInterface::class => BaseFlowOpenApiCheck::class,
    MessageAttachmentHandlerInterface::class => BaseMessageAttachmentHandler::class,

    // magic-chat
    MagicChatConversationRepositoryInterface::class => MagicChatConversationRepository::class,
    MagicMessageRepositoryInterface::class => MagicMessageRepository::class,
    MagicChatSeqRepositoryInterface::class => MagicChatSeqRepository::class,
    MagicChatTopicRepositoryInterface::class => MagicChatTopicRepository::class,
    MagicContactIdMappingRepositoryInterface::class => MagicContactIdMappingRepository::class,
    OrganizationsPlatformRepositoryInterface::class => OrganizationsPlatformRepository::class,
    OpenPlatformConfigInterface::class => OpenPlatformConfigItem::class,
    MagicChatMessageVersionsRepositoryInterface::class => MagicMessageVersionsRepository::class,
    SuperAgentMessageInterface::class => UnknowChatMessage::class,
    // socket-io的发布订阅改为rabbitmq实现,但是房间还是用redis
    AdapterInterface::class => RedisAdapter::class,
    SidProviderInterface::class => DistributedSidProvider::class,
    NamespaceInterface::class => BaseNamespace::class,

    // magic-flow
    MagicFlowRepositoryInterface::class => MagicFlowRepository::class,
    MagicFlowDraftRepositoryInterface::class => MagicFlowDraftRepository::class,
    MagicFlowVersionRepositoryInterface::class => MagicFlowVersionRepository::class,
    MagicFlowTriggerTestcaseRepositoryInterface::class => MagicFlowTriggerTestcaseRepository::class,
    MagicFlowMemoryHistoryRepositoryInterface::class => MagicFlowMemoryHistoryRepository::class,
    MagicFlowExecuteLogRepositoryInterface::class => MagicFlowExecuteLogRepository::class,
    MagicFlowAIModelRepositoryInterface::class => MagicFlowAIModelRepository::class,
    MagicFlowPermissionRepositoryInterface::class => MagicFlowPermissionRepository::class,
    MagicFlowApiKeyRepositoryInterface::class => MagicFlowApiKeyRepository::class,
    MagicFlowToolSetRepositoryInterface::class => MagicFlowToolSetRepository::class,
    MagicFlowWaitMessageRepositoryInterface::class => MagicFlowWaitMessageRepository::class,
    MagicFlowMultiModalLogRepositoryInterface::class => MagicFlowMultiModalLogRepository::class,

    // knowledge-base
    KnowledgeBaseRepositoryInterface::class => KnowledgeBaseBaseRepository::class,
    KnowledgeBaseDocumentRepositoryInterface::class => KnowledgeBaseDocumentRepository::class,
    KnowledgeBaseFragmentRepositoryInterface::class => KnowledgeBaseFragmentRepository::class,

    // vector
    SemanticSimilaritySearchInterface::class => BaseSemanticSimilaritySearch::class,
    FullTextSimilaritySearchInterface::class => BaseFullTextSimilaritySearch::class,
    HybridSimilaritySearchInterface::class => BaseHybridSimilaritySearch::class,
    GraphSimilaritySearchInterface::class => BaseGraphSimilaritySearch::class,

    // code
    PHPExecutorInterface::class => PHPExecutor::class,
    PythonExecutorInterface::class => PythonExecutor::class,

    // magic-bot
    MagicBotThirdPlatformChatRepositoryInterface::class => MagicBotThirdPlatformChatRepository::class,

    // provider
    ProviderRepositoryInterface::class => ProviderRepository::class,
    ProviderConfigRepositoryInterface::class => ProviderConfigRepository::class,
    ProviderModelRepositoryInterface::class => ProviderModelRepository::class,

    // magic-api
    ApplicationRepositoryInterface::class => ApplicationRepository::class,
    ModelConfigRepositoryInterface::class => ModelConfigRepository::class,
    AccessTokenRepositoryInterface::class => AccessTokenRepository::class,
    OrganizationConfigRepositoryInterface::class => OrganizationConfigRepository::class,
    UserConfigRepositoryInterface::class => UserConfigRepository::class,
    MsgLogRepositoryInterface::class => MsgLogRepository::class,

    // embeddings
    EmbeddingGeneratorInterface::class => OdinEmbeddingGenerator::class,

    // rerank

    // permission
    OperationPermissionRepositoryInterface::class => OperationPermissionRepository::class,

    // system
    ClientInterface::class => SimpleClientFactory::class,
    StrategyInterface::class => CoroutineStrategy::class,

    // contact
    MagicUserRepositoryInterface::class => MagicUserRepository::class,
    MagicFriendRepositoryInterface::class => MagicFriendRepository::class,
    MagicAccountRepositoryInterface::class => MagicAccountRepository::class,
    MagicUserIdRelationRepositoryInterface::class => MagicUserIdRelationRepository::class,
    MagicDepartmentUserRepositoryInterface::class => MagicDepartmentUserRepository::class,
    MagicDepartmentRepositoryInterface::class => MagicDepartmentRepository::class,

    // 认证体系

    EnvironmentRepositoryInterface::class => MagicEnvironmentsRepository::class,
    OrganizationsEnvironmentRepositoryInterface::class => OrganizationsEnvironmentRepository::class,

    // 群组
    MagicGroupRepositoryInterface::class => MagicGroupRepository::class,

    // 聊天文件
    MagicChatFileRepositoryInterface::class => MagicChatFileRepository::class,
    MagicStreamMessageRepositoryInterface::class => MagicStreamMessageRepository::class,

    AuthenticationRepositoryInterface::class => AuthenticationRepository::class,
    CloudFileRepositoryInterface::class => CloudFileRepository::class,

    // 登录校验
    SessionInterface::class => SessionAppService::class,

    // token 扩展字段
    MagicTokenExtraInterface::class => MagicTokenExtra::class,
    // 助理执行事件
    AgentExecuteInterface::class => MagicAgentEventAppService::class,

    // mock-http-service
    'mock-http-service' => Server::class,

    // 文件解析
    OcrFileParserDriverInterface::class => OcrFileParserDriver::class,
    TextFileParserDriverInterface::class => TextFileParserDriver::class,
    ExcelFileParserDriverInterface::class => ExcelFileParserDriver::class,
    WordFileParserDriverInterface::class => WordFileParserDriver::class,

    // 知识库
    KnowledgeTypeFactoryInterface::class => KnowledgeTypeFactory::class,

    ExternalFileDocumentFileStrategyInterface::class => ExternalFileDocumentFileStrategyDriver::class,
    ThirdPlatformDocumentFileStrategyInterface::class => ThirdPlatformDocumentFileStrategyDriver::class,

    // admin
    AdminGlobalSettingsRepositoryInterface::class => AdminGlobalSettingsRepository::class,

    // 权限
    PermissionInterface::class => Permission::class,
];

// 如果存在重复,优先取dependencies_priority的配置,不存在重复，就合并
$configFromProviders = [];
if (class_exists(ProviderConfig::class)) {
    $configFromProviders = ProviderConfig::load();
}

$dependenciesPriority = $configFromProviders['dependencies_priority'] ?? [];
foreach ($dependenciesPriority as $key => $value) {
    $dependencies[$key] = $value;
}

return $dependencies;
