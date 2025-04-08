<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Facade;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseQuery;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\Flow\DTO\Knowledge\KnowledgeBaseDTO;
use App\Interfaces\Flow\DTO\Knowledge\MagicFlowKnowledgeListDTO;
use App\Interfaces\Kernel\DTO\PageDTO;
use App\Interfaces\KnowledgeBase\Assembler\KnowledgeBaseAssembler;
use App\Interfaces\KnowledgeBase\DTO\Request\CreateKnowledgeBaseRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\UpdateKnowledgeBaseRequestDTO;
use Dtyq\ApiResponse\Annotation\ApiResponse;

#[ApiResponse(version: 'low_code')]
class KnowledgeBaseApi extends AbstractKnowledgeBaseApi
{
    public function createKnowledgeBase()
    {
        $dto = CreateKnowledgeBaseRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();
        $entity = (new KnowledgeBaseEntity($dto->toArray()))->setType(KnowledgeType::UserKnowledgeBase);
        $entity = $this->knowledgeBaseAppService->save($userAuthorization, $entity, $dto->getDocumentFiles());
        return KnowledgeBaseAssembler::entityToDTO($entity);
    }

    public function updateKnowledgeBase()
    {
        $dto = UpdateKnowledgeBaseRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();

        $entity = (new KnowledgeBaseEntity($dto->toArray()))->setType(KnowledgeType::UserKnowledgeBase);
        $entity = $this->knowledgeBaseAppService->save($userAuthorization, $entity);
        return KnowledgeBaseAssembler::entityToDTO($entity);
    }

    public function getKnowledgeBaseList()
    {
        $params = $this->request->all();
        $query = new KnowledgeBaseQuery();

        $userAuthorization = $this->getAuthorization();

        $query->setOrder(['updated_at' => 'desc']);
        $query->setType($params['type'] ?? KnowledgeType::UserKnowledgeBase->value);
        $query->setSearchType($params['search_type'] ?? null);
        isset($params['name']) && $query->setName($params['name']);
        $page = new Page((int) ($params['page'] ?? 1), (int) ($params['page_size'] ?? 100));
        $result = $this->knowledgeBaseAppService->queries($userAuthorization, $query, $page);
        $knowledgeBaseCodes = array_map(fn ($item) => $item->getCode(), $result['list']);
        // 补充文档数量
        $knowledgeBaseDocumentCountMap = $this->knowledgeBaseDocumentAppService->getDocumentCountByKnowledgeBaseCodes($userAuthorization, $knowledgeBaseCodes);
        $list = KnowledgeBaseAssembler::entitiesToListDTO($result['list'], $result['users'], $knowledgeBaseDocumentCountMap);
        return new PageDTO($page->getPage(), $result['total'], $list);
    }

    public function getKnowledgeBaseDetail(string $code)
    {
        $userAuthorization = $this->getAuthorization();
        $magicFlowKnowledgeEntity = $this->knowledgeBaseAppService->show($userAuthorization, $code);
        // 补充文档数量
        $knowledgeBaseDocumentCountMap = $this->knowledgeBaseDocumentAppService->getDocumentCountByKnowledgeBaseCodes($userAuthorization, [$code]);
        return KnowledgeBaseAssembler::entityToDTO($magicFlowKnowledgeEntity)->setDocumentCount($knowledgeBaseDocumentCountMap[$code] ?? 0);
    }

    public function destroyKnowledgeBase(string $code)
    {
        $this->knowledgeBaseAppService->destroy($this->getAuthorization(), $code);
    }

    public function rebuildKnowledgeBase(string $code)
    {
        $this->knowledgeBaseAppService->rebuild($this->getAuthorization(), $code, (bool) $this->request->input('force', false));
    }
}
