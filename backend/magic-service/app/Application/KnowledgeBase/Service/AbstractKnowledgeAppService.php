<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Service;

use App\Application\Kernel\AbstractKernelAppService;
use App\Application\KnowledgeBase\VectorDatabase\Similarity\KnowledgeSimilarityManager;
use App\Application\Permission\Service\OperationPermissionAppService;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Domain\File\Service\FileDomainService;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\DocumentFileInterface;
use App\Domain\KnowledgeBase\Entity\ValueObject\DocumentFile\ExternalDocumentFile;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDomainService;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseFragmentDomainService;
use App\Domain\ModelAdmin\Service\ServiceProviderDomainService;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\Operation;
use App\Domain\Permission\Entity\ValueObject\OperationPermission\ResourceType;
use App\ErrorCode\FlowErrorCode;
use App\ErrorCode\PermissionErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Core\File\Parser\FileParser;
use App\Interfaces\KnowledgeBase\DTO\DocumentFile\DocumentFileDTOInterface;
use App\Interfaces\KnowledgeBase\DTO\DocumentFile\ExternalDocumentFileDTO;
use App\Interfaces\KnowledgeBase\DTO\DocumentFile\ThirdPlatformDocumentFileDTO;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

abstract class AbstractKnowledgeAppService extends AbstractKernelAppService
{
    protected LoggerInterface $logger;

    public function __construct(
        protected readonly MagicUserDomainService $magicUserDomainService,
        protected readonly OperationPermissionAppService $operationPermissionAppService,
        protected readonly KnowledgeBaseDomainService $knowledgeBaseDomainService,
        protected readonly KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService,
        protected readonly KnowledgeBaseFragmentDomainService $knowledgeBaseFragmentDomainService,
        protected readonly FileDomainService $fileDomainService,
        protected readonly ServiceProviderDomainService $serviceProviderDomainService,
        protected readonly FileParser $fileParser,
        protected readonly KnowledgeSimilarityManager $knowledgeSimilarityManager,
        LoggerFactory $loggerFactory,
    ) {
        $this->logger = $loggerFactory->get(get_class($this));
    }

    public function documentFileDTOToVO(?DocumentFileDTOInterface $dto): ?DocumentFileInterface
    {
        if ($dto === null) {
            return null;
        }
        switch (get_class($dto)) {
            case ExternalDocumentFileDTO::class:
                $data = $dto->toArray();
                unset($data['file_link']);
                return (new ExternalDocumentFile($data))->setFileLink($dto->getFileLink());
            case ThirdPlatformDocumentFileDTO::class:
                return new ExternalDocumentFile($dto->toArray());
            default:
                ExceptionBuilder::throw(FlowErrorCode::KnowledgeValidateFailed);
        }
    }

    /**
     * @param array<DocumentFileDTOInterface> $dtoList
     * @return array<DocumentFileInterface>
     */
    public function documentFileDTOListToVOList(array $dtoList): array
    {
        return array_map(fn (DocumentFileDTOInterface $dto) => $this->documentFileDTOToVO($dto), $dtoList);
    }

    protected function getKnowledgeOperation(KnowledgeBaseDataIsolation $dataIsolation, int|string $knowledgeCode): Operation
    {
        $permissionDataIsolation = $this->createPermissionDataIsolation($dataIsolation);

        if (empty($knowledgeCode)) {
            return Operation::None;
        }
        return $this->operationPermissionAppService->getOperationByResourceAndUser(
            $permissionDataIsolation,
            ResourceType::Knowledge,
            (string) $knowledgeCode,
            $permissionDataIsolation->getCurrentUserId()
        );
    }

    /**
     * 知识库权限校验.
     * @param string $knowledgeBaseCode 必传
     * @param null|string $documentCode 选传
     * @param null|int $fragmentId 选传
     */
    protected function checkKnowledgeBaseOperation(
        KnowledgeBaseDataIsolation $dataIsolation,
        string $operation,
        string $knowledgeBaseCode,
        ?string $documentCode = null,
        ?int $fragmentId = null,
    ): Operation {
        // 如果传了片段id，就获取文档对应的知识库code和文档code，并进行校验
        if ($fragmentId) {
            $fragment = $this->knowledgeBaseFragmentDomainService->show($dataIsolation, $fragmentId);
            if ($knowledgeBaseCode !== $fragment->getKnowledgeCode() || $documentCode !== $fragment->getDocumentCode()) {
                ExceptionBuilder::throw(PermissionErrorCode::AccessDenied, 'common.access', ['label' => $operation]);
            }
        }
        // 如果传了文档code，就获取文档对应的知识库code，并进行校验
        if ($documentCode) {
            $document = $this->knowledgeBaseDocumentDomainService->show($dataIsolation, $knowledgeBaseCode, $documentCode);
            if ($knowledgeBaseCode !== $document->getKnowledgeBaseCode()) {
                ExceptionBuilder::throw(PermissionErrorCode::AccessDenied, 'common.access', ['label' => $operation]);
            }
        }
        $operationVO = $this->getKnowledgeOperation($dataIsolation, $knowledgeBaseCode);
        $operationVO->validate($operation, $knowledgeBaseCode);
        return $operationVO;
    }
}
