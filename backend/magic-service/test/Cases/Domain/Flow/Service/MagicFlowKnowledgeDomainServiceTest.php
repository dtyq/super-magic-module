<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Domain\Flow\Service;

use App\Application\Authentication\Service\Oauth2AuthenticationAppService;
use App\Application\Kernel\EnvManager;
use App\Application\Kernel\TeamshareMultipleEnvApiFactory;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\KnowledgeSimilarityFilter;
use App\Domain\Authentication\Entity\ValueObject\ThirdPartyPlatform;
use App\Domain\Flow\Entity\MagicFlowAIModelEntity;
use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\Flow\Repository\Facade\MagicFlowAIModelRepositoryInterface;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\RerankMode;
use App\Domain\KnowledgeBase\Entity\ValueObject\RetrievalMethod;
use App\Domain\KnowledgeBase\Entity\ValueObject\RetrieveConfig;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeBaseRepositoryInterface;
use App\Domain\KnowledgeBase\Repository\Facade\KnowledgeFragmentRepositoryInterface;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Infrastructure\Core\Embeddings\EmbeddingGenerator\EmbeddingGeneratorInterface;
use App\Infrastructure\Core\Embeddings\VectorStores\VectorStoreInterface;
use HyperfTest\Cases\BaseTest;
use Mockery;
use Psr\Container\ContainerInterface;
use Psr\SimpleCache\CacheInterface;

/**
 * @internal
 */
class MagicFlowKnowledgeDomainServiceTest extends BaseTest
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * 测试 advancedSimilarity 方法的基本功能.
     */
    public function testAdvancedSimilarity()
    {
        $service = di(KnowledgeBaseDomainService::class);
        // 创建服务实例

        // 创建测试数据
        $dataIsolation = FlowDataIsolation::create('DT001', 'usi_a450dd07688be6273b5ef112ad50ba7e', '606446434040061952');
        EnvManager::initDataIsolationEnv($dataIsolation);
        $knowledgeSimilarity = new KnowledgeSimilarityFilter();
        // KNOWLEDGE-67a5a8f618c024-82574592， KNOWLEDGE-67641254d2f772-45254302
        $knowledgeSimilarity->knowledgeCodes = ['KNOWLEDGE-67641254d2f772-45254302'];
        $knowledgeSimilarity->query = '管培生的带教是谁';
        $knowledgeSimilarity->question = '管培生的带教是谁';
        $knowledgeSimilarity->limit = 3;
        $knowledgeSimilarity->score = 0.5;

        $service->teamshareApi = di(TeamshareMultipleEnvApiFactory::class)->getByEnvId(
            $dataIsolation->getEnvId(),
            $dataIsolation->getTeamshareConfigManager()
        );
        $service->teamshareApiToken = di(Oauth2AuthenticationAppService::class)->getAccessToken(
            $dataIsolation,
            $dataIsolation->getCurrentUserId(),
            ThirdPartyPlatform::TeamshareOpenPlatformPro
        );

        // 执行测试
        $result = $service->similarity($dataIsolation, $knowledgeSimilarity);
    }

    /**
     * 测试空知识库列表的情况.
     */
    public function testEmptyKnowledgeList()
    {
        // 创建模拟对象
        $knowledgeRepository = Mockery::mock(KnowledgeBaseRepositoryInterface::class);
        $knowledgeRepository->shouldReceive('getByCodes')
            ->andReturn([]);

        $fragmentRepository = $this->createMockFragmentRepository();
        $aiModelRepository = $this->createMockAIModelRepository();
        $cache = $this->createMockCache();

        // 创建服务实例
        $service = new KnowledgeBaseDomainService(
            $knowledgeRepository,
            $fragmentRepository,
            $aiModelRepository,
            $cache
        );

        // 创建测试数据
        $dataIsolation = FlowDataIsolation::create('DT001');
        $knowledgeSimilarity = new KnowledgeSimilarityFilter();
        $knowledgeSimilarity->knowledgeCodes = ['KB001', 'KB002'];
        $knowledgeSimilarity->query = '测试查询';

        // 执行测试
        $result = $service->advancedSimilarity($dataIsolation, $knowledgeSimilarity);

        // 验证结果
        $this->assertIsArray($result);
        $this->assertEmpty($result); // 结果应该为空
    }

    private function createMockKnowledgeRepository(): KnowledgeBaseRepositoryInterface
    {
        $repository = Mockery::mock(KnowledgeBaseRepositoryInterface::class);

        // 模拟 getByCodes 方法
        $repository->shouldReceive('getByCodes')
            ->with(Mockery::type(FlowDataIsolation::class), Mockery::type('array'))
            ->andReturn([
                $this->createMockKnowledgeEntity('KB001', RetrievalMethod::SEMANTIC_SEARCH),
                $this->createMockKnowledgeEntity('KB002', RetrievalMethod::SEMANTIC_SEARCH),
            ]);

        return $repository;
    }

    private function createMockFragmentRepository(): KnowledgeFragmentRepositoryInterface
    {
        return Mockery::mock(KnowledgeFragmentRepositoryInterface::class);
    }

    private function createMockAIModelRepository(): MagicFlowAIModelRepositoryInterface
    {
        $repository = Mockery::mock(MagicFlowAIModelRepositoryInterface::class);

        // 模拟 getByName 方法
        $repository->shouldReceive('getByName')
            ->with(Mockery::type(FlowDataIsolation::class), Mockery::type('string'))
            ->andReturn($this->createMockAIModelEntity());

        return $repository;
    }

    private function createMockCache(): CacheInterface
    {
        return Mockery::mock(CacheInterface::class);
    }

    private function createMockContainer(): ContainerInterface
    {
        $container = Mockery::mock(ContainerInterface::class);

        // 模拟 di 函数返回的 EmbeddingGeneratorInterface 实例
        $container->shouldReceive('get')
            ->with(EmbeddingGeneratorInterface::class)
            ->andReturn($this->createMockEmbeddingGenerator());

        return $container;
    }

    private function createMockEmbeddingGenerator(): EmbeddingGeneratorInterface
    {
        $generator = Mockery::mock(EmbeddingGeneratorInterface::class);

        // 模拟 embedText 方法
        $generator->shouldReceive('embedText')
            ->andReturn([0.1, 0.2, 0.3, 0.4]);

        return $generator;
    }

    private function createMockKnowledgeEntity(string $code, string $searchMethod): KnowledgeBaseEntity
    {
        $entity = Mockery::mock(KnowledgeBaseEntity::class);

        // 基本属性
        $entity->shouldReceive('getCode')->andReturn($code);
        $entity->shouldReceive('getModel')->andReturn('test-model');
        $entity->shouldReceive('getCollectionName')->andReturn($code . '-1');
        $entity->shouldReceive('isEnabled')->andReturn(true);

        // 检索配置
        $retrieveConfig = new RetrieveConfig();
        $retrieveConfig->setSearchMethod($searchMethod);
        $retrieveConfig->setTopK(3);
        $retrieveConfig->setScoreThreshold(0.5);
        $retrieveConfig->setScoreThresholdEnabled(true);
        $retrieveConfig->setRerankingMode(RerankMode::WEIGHTED_SCORE);
        $retrieveConfig->setRerankingEnable(false);

        $entity->shouldReceive('getRetrieveConfig')->andReturn($retrieveConfig);

        // 向量数据库驱动
        $vectorStore = $this->createMockVectorStore($code);
        $entity->shouldReceive('getVectorDBDriver')->andReturn($vectorStore);

        return $entity;
    }

    private function createMockVectorStore(string $code): VectorStoreInterface
    {
        $vectorStore = Mockery::mock(VectorStoreInterface::class);

        // 模拟 searchPoints 方法
        $vectorStore->shouldReceive('searchPoints')
            ->andReturn($this->getMockPoints($code));

        return $vectorStore;
    }

    private function createMockAIModelEntity(): MagicFlowAIModelEntity
    {
        $entity = Mockery::mock(MagicFlowAIModelEntity::class);

        // 模拟 createEmbedding 方法
        $entity->shouldReceive('createEmbedding')->andReturn('test-embedding');

        return $entity;
    }

    private function getMockPoints(string $code): array
    {
        return [
            [
                'id' => 1,
                'vector' => [0.1, 0.2, 0.3],
                'payload' => [
                    'text' => '测试文本1 - ' . $code,
                    'metadata' => ['source' => 'test1'],
                ],
                'score' => 0.9,
            ],
            [
                'id' => 2,
                'vector' => [0.2, 0.3, 0.4],
                'payload' => [
                    'text' => '测试文本2 - ' . $code,
                    'metadata' => ['source' => 'test2'],
                ],
                'score' => 0.8,
            ],
        ];
    }
}
