<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Api\KnowledgeBase;

use App\Domain\KnowledgeBase\Entity\ValueObject\FragmentMode;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Domain\KnowledgeBase\Entity\ValueObject\SearchType;
use App\Domain\KnowledgeBase\Entity\ValueObject\TextPreprocessRule;
use App\ErrorCode\FlowErrorCode;
use Hyperf\Snowflake\IdGeneratorInterface;
use HyperfTest\HttpTestCase;

/**
 * @internal
 * @coversNothing
 */
class KnowledgeBaseApiTest extends HttpTestCase
{
    public const string API = '/api/v1/knowledge-bases';

    protected function setUp(): void
    {
        $this->clearTestKnowledgeBaseData();
        parent::setUp();
    }

    public function testCreateKnowledgeBase()
    {
        $data = [
            'name' => '测试知识库',
            'description' => '这是一个测试知识库描述',
            'icon' => 'DT001/588417216353927169/4c9184f37cff01bcdc32dc486ec36961/Oz_iUDWyjYwLxME31WwFn.jpg',
            'enabled' => true,
            'is_draft' => true,
            'embedding_config' => ['model_id' => 'dmeta-embedding'],
            'retrieve_config' => [
                'top_k' => 4,
                'weights' => null,
                'search_method' => 'graph_search',
                'reranking_model' => ['reranking_model_name' => 'BAAI/bge-reranker-large'],
                'score_threshold' => 0.67,
                'reranking_enable' => true,
                'score_threshold_enabled' => true,
            ],
            'fragment_config' => [
                'mode' => FragmentMode::NORMAL->value,
                'normal' => [
                    'text_preprocess_rule' => [
                        TextPreprocessRule::REPLACE_WHITESPACE->value,
                        TextPreprocessRule::REMOVE_URL_EMAIL->value,
                    ],
                    'segment_rule' => [
                        'separator' => '\n',
                        'chunk_size' => 50,
                        'chunk_overlap' => 10,
                    ],
                ],
            ],
        ];

        $knowledgeBase = $this->createKnowledgeBase($data);

        $this->assertIsString($knowledgeBase['id']);
        $this->assertIsString($knowledgeBase['code']);
        $this->assertSame('测试知识库', $knowledgeBase['name']);
        $this->assertSame('这是一个测试知识库描述', $knowledgeBase['description']);
        $this->assertTrue($knowledgeBase['enabled']);
        $this->assertIsString($knowledgeBase['organization_code']);
        $this->assertSame(KnowledgeType::UserKnowledgeBase->value, $knowledgeBase['type']);
        $this->assertIsString($knowledgeBase['created_at']);
        $this->assertIsString($knowledgeBase['updated_at']);
        $this->assertIsInt($knowledgeBase['word_count']);
        $this->assertIsInt($knowledgeBase['document_count']);
        $this->assertIsString($knowledgeBase['icon']);
    }

    /**
     * 测试搜素知识库名字.
     */
    public function testGetKnowledgeBaseList1()
    {
        $name = 'test_' . md5((string) di(IdGeneratorInterface::class)->generate());
        $created = $this->createKnowledgeBase(['name' => $name]);
        $res = $this->post(self::API . '/queries', ['name' => $name], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);

        $this->assertCount(1, $res['data']['list']);
        $knowledgeBase = $res['data']['list'][0];
        $this->assertSame($created['code'], $knowledgeBase['code']);
        $this->assertSame($name, $knowledgeBase['name']);
        $this->assertIsString($knowledgeBase['description']);
        $this->assertTrue($knowledgeBase['enabled']);
        $this->assertIsInt($knowledgeBase['word_count']);
        $this->assertIsInt($knowledgeBase['document_count']);
    }

    /**
     * 测试按搜索状态为启用的知识库.
     */
    public function testGetKnowledgeBaseList2()
    {
        $name = 'test_' . md5((string) di(IdGeneratorInterface::class)->generate());
        $created = $this->createKnowledgeBase(['name' => $name]);
        $res = $this->post(self::API . '/queries', ['name' => $name, 'search_type' => SearchType::ENABLED->value], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);

        $this->assertCount(1, $res['data']['list']);
        $knowledgeBase = $res['data']['list'][0];
        $this->assertSame($created['code'], $knowledgeBase['code']);
    }

    /**
     * 测试搜索状态为禁用知识库.
     */
    public function testGetKnowledgeBaseList3()
    {
        $name = 'test_' . md5((string) di(IdGeneratorInterface::class)->generate());
        $knowledgeBase = $this->createKnowledgeBase(['name' => $name]);
        $knowledgeBaseCode = $knowledgeBase['code'];
        $res = $this->post(self::API . '/queries', ['name' => $name, 'search_type' => SearchType::DISABLED->value], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertCount(0, $res['data']['list']);

        // 状态改为禁用后，能查到列表
        $this->updateKnowledgeBase($knowledgeBaseCode, ['name' => $name, 'description' => '1', 'enabled' => false]);
        $res = $this->post(self::API . '/queries', ['name' => $name, 'search_type' => SearchType::DISABLED->value], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertCount(1, $res['data']['list']);
        $this->assertSame($knowledgeBaseCode, $res['data']['list'][0]['code']);
    }

    public function testUpdateKnowledgeBase()
    {
        $knowledgeBase = $this->createKnowledgeBase();
        $code = $knowledgeBase['code'];
        $data = [
            'name' => '更新后的知识库',
            'description' => '这是更新后的知识库描述',
            'enabled' => false,
        ];

        $this->updateKnowledgeBase($code, $data);

        $res = $this->get(self::API . '/' . $code, [], $this->getCommonHeaders());
        $knowledgeBase = $res['data'];
        $this->assertSame('更新后的知识库', $knowledgeBase['name']);
        $this->assertSame('这是更新后的知识库描述', $knowledgeBase['description']);
        $this->assertFalse($knowledgeBase['enabled']);
    }

    public function testDeleteKnowledgeBase()
    {
        $knowledgeBase = $this->createKnowledgeBase();
        $code = $knowledgeBase['code'];

        $res = $this->get(self::API . '/' . $code, [], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code']);
        $this->assertNotEmpty($res['data']);

        $res = $this->delete(self::API . '/' . $code, [], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);

        $res = $this->get(self::API . '/' . $code, [], $this->getCommonHeaders());
        $this->assertSame(FlowErrorCode::KnowledgeValidateFailed->value, $res['code']);
    }

    public function testCreateDocument()
    {
        $document = $this->createDocument();
        $this->assertNotEmpty($document['code']);
        $this->assertSame('test.txt', $document['name']);
        $this->assertIsInt($document['doc_type']);
        $this->assertTrue($document['enabled']);
        $this->assertSame(['source' => 'test'], $document['doc_metadata']);
        $this->assertSame(['chunk_size' => 500], $document['fragment_config']);
        $this->assertSame(['model' => 'test-embedding'], $document['embedding_config']);
        $this->assertSame(['engine' => 'test-db'], $document['vector_db_config']);
        $this->assertSame([], $document['retrieve_config']);
        $this->assertArrayHasKey('knowledge_base_code', $document);
    }

    public function testUpdateDocument()
    {
        $document = $this->createDocument();

        $updateData = [
            'name' => '更新后的文档名称',
            'enabled' => false,
            'doc_metadata' => ['source' => 'updated'],
            'fragment_config' => ['chunk_size' => 800],
            'embedding_config' => ['model' => 'test-embedding-v2'],
            'vector_db_config' => ['engine' => 'test-db-v2'],
            'retrieve_config' => [],
        ];

        $res = $this->put(
            sprintf('%s/%s/documents/%s', self::API, $document['knowledge_base_code'], $document['code']),
            $updateData,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertSame($document['code'], $res['data']['code']);
        $this->assertSame($updateData['name'], $res['data']['name']);
        $this->assertSame($updateData['enabled'], $res['data']['enabled']);
        $this->assertSame($updateData['doc_metadata'], $res['data']['doc_metadata']);
        $this->assertSame($updateData['fragment_config'], $res['data']['fragment_config']);
        $this->assertSame($updateData['embedding_config'], $res['data']['embedding_config']);
        $this->assertSame($updateData['vector_db_config'], $res['data']['vector_db_config']);
        $this->assertSame($updateData['retrieve_config'], $res['data']['retrieve_config']);
    }

    public function testGetDocumentDetail()
    {
        $document = $this->createDocument();

        $res = $this->get(
            sprintf('%s/%s/documents/%s', self::API, $document['knowledge_base_code'], $document['code']),
            [],
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $data = $res['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('code', $data);
        $this->assertArrayHasKey('version', $data);
        $this->assertArrayHasKey('name', $data);
        $this->assertArrayHasKey('description', $data);
        $this->assertArrayHasKey('doc_type', $data);
        $this->assertArrayHasKey('enabled', $data);
        $this->assertArrayHasKey('sync_status', $data);
        $this->assertArrayHasKey('embedding_model', $data);
        $this->assertArrayHasKey('vector_db', $data);
        $this->assertArrayHasKey('organization_code', $data);
        $this->assertArrayHasKey('created_uid', $data);
        $this->assertArrayHasKey('created_at', $data);
        $this->assertArrayHasKey('updated_uid', $data);
        $this->assertArrayHasKey('updated_at', $data);
        $this->assertArrayHasKey('fragment_config', $data);
        $this->assertArrayHasKey('embedding_config', $data);
        $this->assertArrayHasKey('retrieve_config', $data);
        $this->assertArrayHasKey('creator_info', $data);
        $this->assertArrayHasKey('modifier_info', $data);
        $this->assertArrayHasKey('word_count', $data);
    }

    public function testGetDocumentList()
    {
        // 创建几个测试文档
        $knowledgeBase = $this->createKnowledgeBase();
        $knowledgeBaseCode = $knowledgeBase['code'];
        $this->createDocument(knowledgeBaseCode: $knowledgeBaseCode);
        $this->createDocument(['name' => '测试文档2'], $knowledgeBaseCode);

        $params = [
            'page' => 1,
            'page_size' => 10,
        ];

        $res = $this->post(
            sprintf('%s/%s/documents/queries', self::API, $knowledgeBaseCode),
            $params,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertArrayHasKey('total', $res['data']);
        $this->assertArrayHasKey('list', $res['data']);
        $this->assertIsArray($res['data']['list']);
        $this->assertGreaterThanOrEqual(2, count($res['data']['list']));
    }

    public function testDestroyDocument()
    {
        $document = $this->createDocument();

        $res = $this->delete(
            sprintf('%s/%s/documents/%s', self::API, $document['knowledge_base_code'], $document['code']),
            [],
            $this->getCommonHeaders()
        );
        $this->assertSame(1000, $res['code'], $res['message']);

        // 验证文档已被删除
        $res = $this->get(
            sprintf('%s/%s/documents/%s', self::API, $document['knowledge_base_code'], $document['code']),
            [],
            $this->getCommonHeaders()
        );
        $this->assertSame(FlowErrorCode::KnowledgeValidateFailed->value, $res['code']);
        // 验证知识库字符数变为0
        $res = $this->get(self::API . '/' . $document['knowledge_base_code'], [], $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertSame(0, $res['data']['word_count']);
    }

    public function testCreateFragment()
    {
        $fragment = $this->createFragment();

        $this->assertIsString($fragment['creator']);
        $this->assertIsString($fragment['modifier']);
        $this->assertIsString($fragment['created_at']);
        $this->assertIsString($fragment['updated_at']);
        $this->assertIsString($fragment['id']);
        $this->assertIsString($fragment['knowledge_base_code']);
        $this->assertIsString($fragment['document_code']);
        $this->assertSame('这是一个测试片段内容', $fragment['content']);
        $this->assertSame(['page' => 1], $fragment['metadata']);
        $this->assertSame('', $fragment['business_id']);
        $this->assertSame(0, $fragment['sync_status']);
        $this->assertSame('', $fragment['sync_status_message']);
        $this->assertSame(0, $fragment['score']);
    }

    public function testUpdateFragment()
    {
        $fragment = $this->createFragment();

        $updateData = [
            'content' => '更新后的片段内容',
            'metadata' => ['page' => 2],
        ];

        $res = $this->put(
            sprintf(
                '%s/%s/documents/%s/fragments/%s',
                self::API,
                $fragment['knowledge_base_code'],
                $fragment['document_code'],
                $fragment['id']
            ),
            $updateData,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertSame($fragment['id'], $res['data']['id']);
        $this->assertSame($updateData['content'], $res['data']['content']);
        $this->assertSame($updateData['metadata'], $res['data']['metadata']);
    }

    public function testGetFragmentList()
    {
        $document = $this->createDocument();
        // 创建多个片段
        $this->createFragment(['content' => '片段1'], $document['code'], $document['knowledge_base_code']);
        $this->createFragment(['content' => '片段2'], $document['code'], $document['knowledge_base_code']);

        $params = [
            'page' => 1,
            'page_size' => 10,
        ];

        $res = $this->post(
            sprintf('%s/%s/documents/%s/fragments/queries', self::API, $document['knowledge_base_code'], $document['code']),
            $params,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertArrayHasKey('total', $res['data']);
        $this->assertArrayHasKey('list', $res['data']);
        $this->assertIsArray($res['data']['list']);
        $this->assertCount(4, $res['data']['list']);
    }

    public function testGetFragmentDetail()
    {
        $fragment = $this->createFragment();

        $res = $this->get(
            sprintf(
                '%s/%s/documents/%s/fragments/%s',
                self::API,
                $fragment['knowledge_base_code'],
                $fragment['document_code'],
                $fragment['id']
            ),
            [],
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $data = $res['data'];
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('content', $data);
        $this->assertArrayHasKey('metadata', $data);
        $this->assertArrayHasKey('document_code', $data);
        $this->assertArrayHasKey('knowledge_base_code', $data);
        $this->assertArrayHasKey('created_at', $data);
        $this->assertArrayHasKey('updated_at', $data);
        $this->assertArrayHasKey('word_count', $data);
    }

    public function testDestroyFragment()
    {
        $fragment = $this->createFragment();

        $res = $this->delete(
            sprintf(
                '%s/%s/documents/%s/fragments/%s',
                self::API,
                $fragment['knowledge_base_code'],
                $fragment['document_code'],
                $fragment['id']
            ),
            [],
            $this->getCommonHeaders()
        );
        $this->assertSame(1000, $res['code'], $res['message']);

        // 验证片段已被删除
        $res = $this->get(
            sprintf(
                '%s/%s/documents/%s/fragments/%s',
                self::API,
                $fragment['knowledge_base_code'],
                $fragment['document_code'],
                $fragment['id']
            ),
            [],
            $this->getCommonHeaders()
        );
        $this->assertSame(FlowErrorCode::KnowledgeValidateFailed->value, $res['code']);
    }

    /**
     * 测试知识库片段预览功能.
     */
    public function testFragmentPreview()
    {
        $data = [
            'document_file' => [
                'name' => 'test.md',
                'key' => 'test001/open/4c9184f37cff01bcdc32dc486ec36961/9w-fHAaMI4hY3VEIhhozL.md',
            ],
            'fragment_config' => [
                'mode' => FragmentMode::NORMAL->value,
                'normal' => [
                    'text_preprocess_rule' => [
                        TextPreprocessRule::REPLACE_WHITESPACE->value,
                        TextPreprocessRule::REMOVE_URL_EMAIL->value,
                    ],
                    'segment_rule' => [
                        'separator' => '\n',
                        'chunk_size' => 50,
                        'chunk_overlap' => 10,
                    ],
                ],
            ],
        ];

        $res = $this->post(
            self::API . '/fragments/preview',
            $data,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertArrayHasKey('data', $res);
        $this->assertArrayHasKey('total', $res['data']);
        $this->assertArrayHasKey('list', $res['data']);
        $this->assertIsArray($res['data']['list']);

        if (! empty($res['data']['list'])) {
            $fragment = $res['data']['list'][0];
            $this->assertArrayHasKey('id', $fragment);
            $this->assertArrayHasKey('content', $fragment);
            $this->assertArrayHasKey('metadata', $fragment);
            $this->assertArrayHasKey('document_code', $fragment);
            $this->assertArrayHasKey('knowledge_base_code', $fragment);
            $this->assertArrayHasKey('created_at', $fragment);
            $this->assertArrayHasKey('updated_at', $fragment);
            $this->assertArrayHasKey('word_count', $fragment);
        }
    }

    /**
     * 创建测试文档并返回文档数据.
     */
    protected function createDocument(array $overrideData = [], ?string $knowledgeBaseCode = null): array
    {
        if (empty($knowledgeBaseCode)) {
            $knowledgeBase = $this->createKnowledgeBase();
            $knowledgeBaseCode = $knowledgeBase['code'];
        }
        $defaultData = [
            'name' => '测试文档',
            'doc_type' => 1,
            'enabled' => true,
            'doc_metadata' => ['source' => 'test'],
            'fragment_config' => ['chunk_size' => 500],
            'embedding_config' => ['model' => 'test-embedding'],
            'vector_db_config' => ['engine' => 'test-db'],
            'retrieve_config' => [],
            'document_file' => ['name' => 'test.txt', 'key' => 'test001/open/4c9184f37cff01bcdc32dc486ec36961/9w-fHAaMI4hY3VEIhhozL.md'],
        ];

        $data = array_merge($defaultData, $overrideData);
        $res = $this->post(
            sprintf('%s/%s/documents', self::API, $knowledgeBaseCode),
            $data,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        $this->assertArrayHasKey('code', $res['data']);
        $this->assertSame($data['document_file']['name'], $res['data']['name']);
        $this->assertIsInt($res['data']['doc_type']);

        return $res['data'];
    }

    /**
     * 清理测试数据.
     */
    protected function clearTestKnowledgeBaseData()
    {
        // 根据实际情况实现清理逻辑
        // 可以直接调用数据库操作删除测试数据
        // 或者调用相应的服务方法
    }

    protected function createKnowledgeBase(array $data = []): array
    {
        $data = array_merge([
            'name' => '测试知识库',
            'description' => '这是一个测试知识库描述',
            'icon' => 'qqqq',
            'enabled' => true,
            'is_draft' => true,
            'document_files' => [['name' => 'aaa.txt', 'key' => 'test001/open/4c9184f37cff01bcdc32dc486ec36961/9w-fHAaMI4hY3VEIhhozL.md']],
            'fragment_config' => [
                'mode' => FragmentMode::NORMAL->value,
                'normal' => [
                    'text_preprocess_rule' => [
                        TextPreprocessRule::REPLACE_WHITESPACE->value,
                        TextPreprocessRule::REMOVE_URL_EMAIL->value,
                    ],
                    'segment_rule' => [
                        'separator' => '\n',
                        'chunk_size' => 50,
                        'chunk_overlap' => 10,
                    ],
                ],
            ],
            'embedding_config' => [
                'model_id' => 'dmeta-embedding',
            ],
        ], $data);

        $res = $this->post(self::API, $data, $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);

        return $res['data'];
    }

    protected function updateKnowledgeBase(string $code, array $data): array
    {
        $res = $this->put(self::API . '/' . $code, $data, $this->getCommonHeaders());
        $this->assertSame(1000, $res['code'], $res['message']);
        return $res['data'];
    }

    /**
     * 创建测试片段并返回数据.
     */
    protected function createFragment(array $overrideData = [], ?string $documentCode = null, ?string $knowledgeBaseCode = null): array
    {
        if (empty($documentCode)) {
            $document = $this->createDocument();
            $documentCode = $document['code'];
            $knowledgeBaseCode = $document['knowledge_base_code'];
        } else {
            $document = $this->get(
                sprintf('%s/%s/documents/%s', self::API, $knowledgeBaseCode, $documentCode),
                [],
                $this->getCommonHeaders()
            );
            $knowledgeBaseCode = $document['data']['knowledge_base_code'];
        }

        $defaultData = [
            'content' => '这是一个测试片段内容',
            'metadata' => ['page' => 1],
            'embedding_model' => 'test-model',
            'vector_db' => 'test-db',
        ];

        $data = array_merge($defaultData, $overrideData);
        $res = $this->post(
            sprintf('%s/%s/documents/%s/fragments', self::API, $knowledgeBaseCode, $documentCode),
            $data,
            $this->getCommonHeaders()
        );

        $this->assertSame(1000, $res['code'], $res['message']);
        return $res['data'];
    }
}
