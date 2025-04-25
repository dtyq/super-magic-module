<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\Facade;

use App\Domain\KnowledgeBase\Entity\KnowledgeBaseEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeType;
use App\Domain\KnowledgeBase\Entity\ValueObject\Query\KnowledgeBaseQuery;
use App\Domain\ModelAdmin\Constant\ServiceProviderType;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderDTO;
use App\Domain\ModelAdmin\Entity\ValueObject\ServiceProviderModelsDTO;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use App\Interfaces\Kernel\DTO\PageDTO;
use App\Interfaces\KnowledgeBase\Assembler\KnowledgeBaseAssembler;
use App\Interfaces\KnowledgeBase\DTO\Request\CreateKnowledgeBaseRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\Request\UpdateKnowledgeBaseRequestDTO;
use Dtyq\ApiResponse\Annotation\ApiResponse;

#[ApiResponse(version: 'low_code')]
class KnowledgeBaseApi extends AbstractKnowledgeBaseApi
{
    public function create()
    {
        $authorization = $this->getAuthorization();
        $dto = CreateKnowledgeBaseRequestDTO::fromRequest($this->request);
        $entity = (new KnowledgeBaseEntity($dto->toArray()))->setType(KnowledgeType::UserKnowledgeBase->value);
        $entity = $this->knowledgeBaseAppService->save($authorization, $entity, $dto->getDocumentFiles());
        return KnowledgeBaseAssembler::entityToDTO($entity);
    }

    public function update(string $code)
    {
        $authorization = $this->getAuthorization();
        $dto = UpdateKnowledgeBaseRequestDTO::fromRequest($this->request);
        $dto->setCode($code);

        $entity = (new KnowledgeBaseEntity($dto->toArray()))->setType(KnowledgeType::UserKnowledgeBase->value);
        $entity = $this->knowledgeBaseAppService->save($authorization, $entity);
        return KnowledgeBaseAssembler::entityToDTO($entity);
    }

    public function queries()
    {
        /** @var MagicUserAuthorization $authorization */
        $authorization = $this->getAuthorization();
        $query = new KnowledgeBaseQuery($this->request->all());
        $query->setOrder(['updated_at' => 'desc']);
        $query->setType(KnowledgeType::UserKnowledgeBase->value);
        $page = $this->createPage();

        $result = $this->knowledgeBaseAppService->queries($authorization, $query, $page);
        $list = KnowledgeBaseAssembler::entitiesToListDTO($result['list'], $result['users']);
        return new PageDTO($page->getPage(), $result['total'], $list);
    }

    public function show(string $code)
    {
        $userAuthorization = $this->getAuthorization();
        $magicFlowKnowledgeEntity = $this->knowledgeBaseAppService->show($userAuthorization, $code);
        // 补充文档数量
        $knowledgeBaseDocumentCountMap = $this->knowledgeBaseDocumentAppService->getDocumentCountByKnowledgeBaseCodes($userAuthorization, [$code]);
        return KnowledgeBaseAssembler::entityToDTO($magicFlowKnowledgeEntity)->setDocumentCount($knowledgeBaseDocumentCountMap[$code] ?? 0);
    }

    public function destroy(string $code)
    {
        $this->knowledgeBaseAppService->destroy($this->getAuthorization(), $code);
    }

    /**
     * 获取官方重排序提供商列表.
     * @return array<ServiceProviderDTO>
     */
    public function getOfficialRerankProviderList()
    {
        $dto = new ServiceProviderDTO();
        $dto->setId('official_rerank');
        $dto->setName('官方重排序服务商');
        $dto->setProviderType(ServiceProviderType::OFFICIAL->value);
        $dto->setDescription('官方提供的重排序服务');
        $dto->setIcon('');
        $dto->setCategory('rerank');
        $dto->setStatus(1); // 1 表示启用
        $dto->setCreatedAt(date('Y-m-d H:i:s'));

        // 设置模型列表
        $models = [];

        // 基础重排序模型
        $baseModel = new ServiceProviderModelsDTO();
        $baseModel->setId('official_rerank_model');
        $baseModel->setName('官方重排模型');
        $baseModel->setModelVersion('v1.0');
        $baseModel->setDescription('基础重排序模型，适用于一般场景');
        $baseModel->setIcon('');
        $baseModel->setModelType(1);
        $baseModel->setCategory('rerank');
        $baseModel->setStatus(1);
        $baseModel->setSort(1);
        $baseModel->setCreatedAt(date('Y-m-d H:i:s'));
        $models[] = $baseModel;

        $dto->setModels($models);

        return [$dto];
    }
}
