<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Application\KnowledgeBase\VectorDatabase\Similarity\KnowledgeSimilarityFilter;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\KnowledgeSimilarityManager;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\FragmentConfig;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Infrastructure\Core\ValueObject\Page;
use App\Infrastructure\Util\SSRF\Exception\SSRFException;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;
use Qbhy\HyperfAuth\Authenticatable;

class KnowledgeBaseFragmentAppService extends AbstractKnowledgeAppService
{
    public function save(Authenticatable $authorization, KnowledgeBaseFragmentEntity $savingMagicFlowKnowledgeFragmentEntity): KnowledgeBaseFragmentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'w', $savingMagicFlowKnowledgeFragmentEntity->getKnowledgeCode(), $savingMagicFlowKnowledgeFragmentEntity->getDocumentCode());
        $savingMagicFlowKnowledgeFragmentEntity->setCreator($dataIsolation->getCurrentUserId());
        $knowledgeBaseDocumentEntity = $this->knowledgeBaseDocumentDomainService->show($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getDocumentCode());
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $savingMagicFlowKnowledgeFragmentEntity->getKnowledgeCode());
        return $this->knowledgeBaseFragmentDomainService->save($dataIsolation, $knowledgeBaseEntity, $knowledgeBaseDocumentEntity, $savingMagicFlowKnowledgeFragmentEntity);
    }

    /**
     * @return array{total: int, list: array<KnowledgeBaseFragmentEntity>}
     */
    public function queries(Authenticatable $authorization, KnowledgeBaseFragmentQuery $query, Page $page): array
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $query->getKnowledgeCode(), $query->getDocumentCode());

        return $this->knowledgeBaseFragmentDomainService->queries($dataIsolation, $query, $page);
    }

    public function show(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode, int $id): KnowledgeBaseFragmentEntity
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'r', $knowledgeBaseCode, $documentCode, $id);
        return $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $id);
    }

    public function destroy(Authenticatable $authorization, string $knowledgeBaseCode, string $documentCode, int $id): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $knowledgeBaseCode, $documentCode, $id);
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $knowledgeBaseCode);
        $oldEntity = $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $id);
        $this->knowledgeBaseFragmentDomainService->destroy($dataIsolation, $knowledgeBaseEntity, $oldEntity);
    }

    public function destroyByMetadataFilter(Authenticatable $authorization, string $knowledgeBaseCode, array $metadataFilter): void
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $this->checkKnowledgeBaseOperation($dataIsolation, 'del', $knowledgeBaseCode);
        $knowledgeBaseEntity = $this->knowledgeBaseDomainService->show($dataIsolation, $knowledgeBaseCode);

        $filter = new KnowledgeSimilarityFilter();
        $filter->setKnowledgeCodes([$knowledgeBaseCode]);
        $filter->setMetadataFilter($metadataFilter);
        di(KnowledgeSimilarityManager::class)->destroyByMetadataFilter($dataIsolation, $knowledgeBaseEntity, $filter);
    }

    /**
     * @return array<KnowledgeBaseFragmentEntity>
     * @throws SSRFException
     */
    public function fragmentPreview(Authenticatable $authorization, DocumentFileDTO $documentFile, FragmentConfig $fragmentConfig): array
    {
        $dataIsolation = $this->createKnowledgeBaseDataIsolation($authorization);
        $fileUrl = $this->fileDomainService->getLink($dataIsolation->getCurrentOrganizationCode(), $documentFile->getKey());
        if (empty($fileUrl)) {
            $this->logger->warning('文件不存在');
        }
        $content = $this->fileParser->parse($fileUrl?->getUrl() ?? '');
        $fragmentContents = $this->knowledgeBaseFragmentDomainService->processFragmentsByContent($dataIsolation, $content, $fragmentConfig);
        return KnowledgeBaseFragmentEntity::fromFragmentContents($fragmentContents);
    }
}
