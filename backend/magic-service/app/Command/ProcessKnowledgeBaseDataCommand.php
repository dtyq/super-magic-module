<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Command;

use App\Domain\Flow\Entity\ValueObject\Query\KnowledgeBaseDocumentQuery;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseFragmentDomainService;
use App\Infrastructure\Core\ValueObject\Page;
use Hyperf\Command\Annotation\Command;
use Hyperf\Command\Command as HyperfCommand;
use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\DbConnection\Db;
use Hyperf\Redis\Redis;
use Psr\Container\ContainerInterface;
use Throwable;

#[Command]
class ProcessKnowledgeBaseDataCommand extends HyperfCommand
{
    public function __construct(
        protected ContainerInterface $container,
        protected StdoutLoggerInterface $logger,
        protected KnowledgeBaseDomainService $knowledgeBaseDomainService,
        protected KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService,
        protected KnowledgeBaseFragmentDomainService $knowledgeBaseFragmentDomainService,
        protected Redis $redis,
    ) {
        parent::__construct('command:process-knowledge-base-data');
    }

    public function configure()
    {
        parent::configure();
        $this->setDescription('清洗知识库数据');
    }

    public function handle()
    {
        $this->logger->info('清洗知识库数据开始');
        $lastKnowledgeBaseIdCacheKey = 'command:knowledge_base:last_id';
        $this->redis->del($lastKnowledgeBaseIdCacheKey);
        $lastKnowledgeBaseId = $this->redis->get($lastKnowledgeBaseIdCacheKey);
        if (! $lastKnowledgeBaseId) {
            $lastKnowledgeBaseId = null;
        } else {
            $lastKnowledgeBaseId = (int) $lastKnowledgeBaseId;
        }

        while (true) {
            $this->logger->info('本轮清洗知识库数据开始,lastKnowledgeBaseId: ' . $lastKnowledgeBaseId);

            // 先按照游标获取知识库列表
            $dataIsolation = KnowledgeBaseDataIsolation::create('', '');
            $knowledgeBases = $this->knowledgeBaseDomainService->getKnowledgeBaseListForCommandProcess(
                dataIsolation: $dataIsolation,
                lastId: $lastKnowledgeBaseId,
                limit: 100
            );

            if (empty($knowledgeBases)) {
                $this->logger->info('没有更多知识库数据需要处理');
                break;
            }

            foreach ($knowledgeBases as $knowledgeBase) {
                try {
                    // 按知识库获取文档列表
                    $documentQuery = new KnowledgeBaseDocumentQuery();
                    $documentQuery->setKnowledgeBaseCode($knowledgeBase->getCode());
                    $documents = $this->knowledgeBaseDocumentDomainService->queries(
                        dataIsolation: $dataIsolation,
                        query: $documentQuery,
                        page: new Page(1, 1)
                    );

                    // 如果文档不为空，则跳过
                    if (! empty($documents['list'])) {
                        $this->logger->info('知识库已有文档，跳过处理', [
                            'knowledge_base_id' => $knowledgeBase->getId(),
                        ]);
                        continue;
                    }

                    // 如果文档为空，则处理
                    $dataIsolation->setCurrentUserId($knowledgeBase->getCreator());
                    $dataIsolation->setCurrentOrganizationCode($knowledgeBase->getOrganizationCode());
                    Db::beginTransaction();
                    try {
                        // 创建知识库文档
                        $documentEntity = $this->knowledgeBaseDocumentDomainService->getOrCreatorDefaultDocument(
                            $dataIsolation,
                            $knowledgeBase,
                        );

                        // 循环获取全量知识库文档片段
                        $fragmentQuery = new KnowledgeBaseFragmentQuery();
                        $fragmentQuery->setKnowledgeCode($knowledgeBase->getCode());
                        $fragments = [];
                        $page = 1;
                        $pageSize = 100;
                        while (true) {
                            $result = $this->knowledgeBaseFragmentDomainService->queries(
                                dataIsolation: $dataIsolation,
                                query: $fragmentQuery,
                                page: new Page($page, $pageSize)
                            );

                            if (empty($result['list'])) {
                                break;
                            }

                            $fragments = array_merge($fragments, $result['list']);

                            if (count($result['list']) < $pageSize) {
                                break;
                            }

                            ++$page;
                        }

                        if (empty($fragments)) {
                            $this->logger->info('知识库没有文档片段，跳过处理', [
                                'knowledge_base_id' => $knowledgeBase->getId(),
                            ]);
                            Db::rollBack();
                            continue;
                        }

                        // 更新知识库文档片段的document_code
                        foreach ($fragments as $fragment) {
                            $fragment->setDocumentCode($documentEntity->getCode());
                            $this->knowledgeBaseFragmentDomainService->save(
                                dataIsolation: $dataIsolation,
                                knowledgeBaseEntity: $knowledgeBase,
                                knowledgeBaseDocumentEntity: $documentEntity,
                                savingMagicFlowKnowledgeFragmentEntity: $fragment
                            );
                        }

                        Db::commit();
                        $this->logger->info('知识库文档处理成功', [
                            'knowledge_base_id' => $knowledgeBase->getId(),
                            'document_id' => $documentEntity->getId(),
                        ]);
                    } catch (Throwable $e) {
                        Db::rollBack();
                        $this->logger->error('知识库文档处理失败, knowledge_base_id' . $knowledgeBase->getId() . ', error:' . $e->getMessage() . 'errorTrace:' . $e->getTraceAsString());
                    }
                } catch (Throwable $e) {
                    $this->logger->error('知识库处理失败, knowledge_base_id' . $knowledgeBase->getId() . ', error:' . $e->getMessage() . 'errorTrace:' . $e->getTraceAsString());
                }
            }

            // 5. 更新游标
            $lastKnowledgeBase = end($knowledgeBases);
            $lastKnowledgeBaseId = $lastKnowledgeBase->getId();
            $this->redis->set($lastKnowledgeBaseIdCacheKey, (string) $lastKnowledgeBaseId);

            $this->logger->info('本轮清洗知识库数据结束');
            sleep(1); // 避免过快循环
        }

        $this->logger->info('清洗知识库数据结束,lastKnowledgeBaseId: ' . $lastKnowledgeBaseId);
    }
}
