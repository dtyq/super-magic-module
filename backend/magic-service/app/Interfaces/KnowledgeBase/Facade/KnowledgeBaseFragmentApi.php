<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Facade;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseFragmentQuery;
use App\Infrastructure\Core\ValueObject\Page;
use App\Interfaces\Flow\DTO\Knowledge\MagicFlowKnowledgeFragmentDTO;
use App\Interfaces\Kernel\DTO\PageDTO;
use App\Interfaces\KnowledgeBase\Assembler\KnowledgeBaseFragmentAssembler;
use App\Interfaces\KnowledgeBase\DTO\Request\CreateFragmentRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\GetFragmentListRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\UpdateFragmentRequestDTO;
use DateTime;
use Dtyq\ApiResponse\Annotation\ApiResponse;

#[ApiResponse(version: 'low_code')]
class KnowledgeBaseFragmentApi extends AbstractKnowledgeBaseApi
{
    /**
     * 查询片段.(本期不做).
     */
    public function similarity()
    {
    }

    public function createFragment()
    {
        $dto = CreateFragmentRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();

        $entity = (new KnowledgeBaseFragmentEntity($dto->toArray()))
            ->setKnowledgeCode($dto->getKnowledgeBaseCode())
            ->setCreatedAt(new DateTime());
        $entity = $this->knowledgeBaseFragmentAppService->save($userAuthorization, $entity);
        return KnowledgeBaseFragmentAssembler::entityToDTO($entity);
    }

    public function updateFragment()
    {
        $dto = UpdateFragmentRequestDTO::fromRequest($this->request);
        $userAuthorization = $this->getAuthorization();

        $entity = (new KnowledgeBaseFragmentEntity($dto->toArray()))
            ->setKnowledgeCode($dto->getKnowledgeBaseCode())
            ->setCreatedAt(new DateTime());
        $entity = $this->knowledgeBaseFragmentAppService->save($userAuthorization, $entity);
        return KnowledgeBaseFragmentAssembler::entityToDTO($entity);
    }

    public function getFragmentList()
    {
        $dto = GetFragmentListRequestDTO::fromRequest($this->request);
        $query = KnowledgeBaseFragmentQuery::fromGetFragmentListRequestDTO($dto);
        $page = new Page($dto->getPage(), $dto->getPageSize());
        $result = $this->knowledgeBaseFragmentAppService->queries($this->getAuthorization(), $query, $page);
        $list = array_map(function (KnowledgeBaseFragmentEntity $entity) {
            return KnowledgeBaseFragmentAssembler::entityToDTO($entity);
        }, $result['list']);
        return new PageDTO($page->getPage(), $result['total'], $list);
    }

    public function fragmentShow(string $knowledgeBaseCode, string $documentCode, int $id)
    {
        $entity = $this->knowledgeBaseFragmentAppService->show($this->getAuthorization(), $knowledgeBaseCode, $documentCode, $id);
        return KnowledgeBaseFragmentAssembler::entityToDTO($entity);
    }

    public function fragmentDestroy(string $knowledgeBaseCode, string $documentCode, int $id)
    {
        $this->knowledgeBaseFragmentAppService->destroy($this->getAuthorization(), $knowledgeBaseCode, $documentCode, $id);
    }
}
