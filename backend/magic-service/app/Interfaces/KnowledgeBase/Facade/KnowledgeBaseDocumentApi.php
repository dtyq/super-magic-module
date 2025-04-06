<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Facade;

use App\Domain\Flow\Entity\ValueObject\Query\KnowledgeBaseDocumentQuery;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseDocumentEntity;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\Kernel\DTO\PageDTO;
use App\Interfaces\KnowledgeBase\DTO\KnowledgeBaseDocumentDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\CreateDocumentRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\DocumentQueryRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\UpdateDocumentRequestDTO;
use Dtyq\ApiResponse\Annotation\ApiResponse;

#[ApiResponse(version: 'low_code')]
class KnowledgeBaseDocumentApi extends AbstractKnowledgeBaseApi
{
    /**
     * 创建文档.
     */
    public function createDocument()
    {
        $dto = CreateDocumentRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();

        $entity = KnowledgeBaseDocumentEntity::fromCreateDTO($dto, $userAuthorization);
        $entity = $this->knowledgeBaseDocumentAppService->save($userAuthorization, $entity, $dto->getDocumentFile());
        return KnowledgeBaseDocumentDTO::fromEntity($entity)->toArray();
    }

    /**
     * 更新文档.
     */
    public function updateDocument()
    {
        $dto = UpdateDocumentRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();

        $entity = KnowledgeBaseDocumentEntity::fromUpdateDTO($dto, $userAuthorization);
        $entity = $this->knowledgeBaseDocumentAppService->save($userAuthorization, $entity);
        return KnowledgeBaseDocumentDTO::fromEntity($entity)->toArray();
    }

    /**
     * 获取文档列表.
     */
    public function getDocumentList()
    {
        $dto = DocumentQueryRequestDTO::fromRequest($this->request);
        $query = new KnowledgeBaseDocumentQuery();

        // 设置查询条件
        $query->setOrder(['updated_at' => 'desc']);
        $query->setKnowledgeBaseCode($dto->getKnowledgeBaseCode());
        $query->setName($dto->name);
        $query->setDocType($dto->getDocType());
        $query->setEnabled($dto->enabled);
        $query->setSyncStatus($dto->getSyncStatus());

        $page = new Page($dto->getPage(), $dto->getPageSize());
        $result = $this->knowledgeBaseDocumentAppService->query($this->getAuthorization(), $query, $page);

        return new PageDTO(
            $page->getPage(),
            $result['total'],
            array_map(fn ($entity) => KnowledgeBaseDocumentDTO::fromEntity($entity)->toArray(), $result['list'])
        );
    }

    /**
     * 获取文档详情.
     */
    public function getDocumentDetail(string $knowledgeBaseCode, string $code)
    {
        $entity = $this->knowledgeBaseDocumentAppService->show($this->getAuthorization(), $knowledgeBaseCode, $code);
        return KnowledgeBaseDocumentDTO::fromEntity($entity)->toArray();
    }

    /**
     * 删除文档.
     */
    public function destroyDocument(string $knowledgeBaseCode, string $code)
    {
        $this->knowledgeBaseDocumentAppService->destroy($this->getAuthorization(), $knowledgeBaseCode, $code);
    }
}
