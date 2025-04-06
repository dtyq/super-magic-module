<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\VectorDatabase\Similarity;

use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\FullTextSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\GraphSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\HybridSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\SemanticSimilaritySearchInterface;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\Driver\SimilaritySearchDriverInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseQuery;
use App\Domain\KnowledgeBase\Entity\ValueObject\RetrievalMethod;
use App\Domain\KnowledgeBase\Entity\ValueObject\RetrieveConfig;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\ErrorCode\FlowErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\ValueObject\Page;

class KnowledgeSimilarityManager
{
    public function __construct(
        protected KnowledgeBaseDomainService $knowledgeBaseDomainService,
    ) {
    }

    public function similarity(KnowledgeBaseDataIsolation $dataIsolation, KnowledgeSimilarityFilter $filter, ?RetrieveConfig $retrieveConfig = null): array
    {
        $filter->validate();

        $query = new KnowledgeBaseQuery();
        $query->setCodes($filter->getKnowledgeCodes());
        $knowledgeList = $this->knowledgeBaseDomainService->queries($dataIsolation, $query, Page::createNoPage())['list'];
        if (empty($knowledgeList)) {
            return [];
        }
        $defaultRetrieveConfig = new RetrieveConfig();
        $defaultRetrieveConfig->setSearchMethod(RetrievalMethod::SEMANTIC_SEARCH);
        $defaultRetrieveConfig->setTopK($filter->getLimit());
        $defaultRetrieveConfig->setScoreThreshold($filter->getScore());

        $result = [];
        foreach ($knowledgeList as $knowledge) {
            if (! $knowledge->isEnabled()) {
                ExceptionBuilder::throw(FlowErrorCode::ValidateFailed, 'common.disabled', ['code' => $knowledge->getCode()]);
            }
            if (! $retrieveConfig) {
                $retrieveConfig = $knowledge->getRetrieveConfig() ?? $defaultRetrieveConfig;
            }
            $knowledge->setRetrieveConfig($retrieveConfig);
            $similaritySearchInterface = match ($retrieveConfig->getSearchMethod()) {
                RetrievalMethod::FULL_TEXT_SEARCH => FullTextSimilaritySearchInterface::class,
                RetrievalMethod::HYBRID_SEARCH => HybridSimilaritySearchInterface::class,
                RetrievalMethod::GRAPH_SEARCH => GraphSimilaritySearchInterface::class,
                default => SemanticSimilaritySearchInterface::class,
            };
            if (container()->has($similaritySearchInterface)) {
                /** @var SimilaritySearchDriverInterface $similaritySearchDriver */
                $similaritySearchDriver = di($similaritySearchInterface);
                $retrievalResults = $similaritySearchDriver->search($dataIsolation, $filter, $knowledge, $retrieveConfig);
                foreach ($retrievalResults as $data) {
                    $result[] = $data;
                }
            }
        }

        return $result;
    }
}
