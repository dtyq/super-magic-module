<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\KnowledgeBase\Event\Subscribe;

use App\Application\KnowledgeBase\Service\KnowledgeBaseFragmentAppService;
use App\Domain\Contact\Entity\ValueObject\UserType;
use App\Domain\KnowledgeBase\Entity\KnowledgeBaseFragmentEntity;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeBaseDataIsolation;
use App\Domain\KnowledgeBase\Entity\ValueObject\KnowledgeSyncStatus;
use App\Domain\KnowledgeBase\Event\KnowledgeBaseDocumentSavedEvent;
use App\Domain\KnowledgeBase\Service\KnowledgeBaseDocumentDomainService;
use App\Infrastructure\Core\Exception\BusinessException;
use App\Infrastructure\Core\File\FileParser;
use App\Infrastructure\Util\Odin\TextSplitter\TokenTextSplitter;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Dtyq\AsyncEvent\Kernel\Annotation\AsyncListener;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Log\LoggerInterface;
use Throwable;

use function di;

#[AsyncListener]
#[Listener]
readonly class KnowledgeBaseDocumentSyncSubscriber implements ListenerInterface
{
    public function __construct()
    {
    }

    public function listen(): array
    {
        return [
            KnowledgeBaseDocumentSavedEvent::class,
        ];
    }

    public function process(object $event): void
    {
        if (! $event instanceof KnowledgeBaseDocumentSavedEvent) {
            return;
        }
        $knowledge = $event->knowledgeBaseEntity;
        $documentEntity = $event->knowledgeBaseDocumentEntity;
        $dataIsolation = KnowledgeBaseDataIsolation::create($knowledge->getOrganizationCode(), $knowledge->getCreator());
        /** @var KnowledgeBaseDocumentDomainService $knowledgeBaseDocumentDomainService */
        $knowledgeBaseDocumentDomainService = di(KnowledgeBaseDocumentDomainService::class);
        /** @var KnowledgeBaseFragmentAppService $knowledgeBaseFragmentAppService */
        $knowledgeBaseFragmentAppService = di(KnowledgeBaseFragmentAppService::class);
        /** @var FileParser $fileParser */
        $fileParser = di(FileParser::class);
        /** @var LoggerInterface $logger */
        $logger = di(LoggerInterface::class);

        try {
            $vector = $knowledge->getVectorDBDriver();
            $collection = $vector->getCollection($knowledge->getCollectionName());
            if (! $collection) {
                throw new BusinessException('collection不存在');
            }

            $file = $event->documentFile;
            $authorization = new MagicUserAuthorization();
            $authorization->setId($knowledge->getCreator());
            $authorization->setMagicId($knowledge->getCreator());
            $authorization->setOrganizationCode($knowledge->getOrganizationCode());
            $authorization->setUserType(UserType::Human);
            if ($file) {
                $tokenSplitter = new TokenTextSplitter(chunkSize: 500, chunkOverlap: 50);
                $documentEntity->setSyncStatus(KnowledgeSyncStatus::Syncing->value);
                $documentEntity = $knowledgeBaseDocumentDomainService->save($dataIsolation, $knowledge, $documentEntity);
                $logger->info('正在解析文件，文件名：' . $file->getName());
                $content = $fileParser->parse($file->getFileLink()->getUrl());
                $logger->info('解析文件完成，正在文件分段，文件名：' . $file->getName());
                $splitText = $tokenSplitter->splitText($content);
                $logger->info('文件分段完成，文件名：' . $file->getName() . '，分段数量:' . count($splitText));

                foreach ($splitText as $text) {
                    $fragmentEntity = (new KnowledgeBaseFragmentEntity())
                        ->setKnowledgeCode($knowledge->getCode())
                        ->setDocumentCode($documentEntity->getCode())
                        ->setContent($text)
                        ->setCreator($documentEntity->getCreatedUid())
                        ->setModifier($documentEntity->getUpdatedUid());
                    $knowledgeBaseFragmentAppService->save($authorization, $fragmentEntity);
                }
            }

            $documentEntity->setSyncStatus(KnowledgeSyncStatus::Synced->value);
        } catch (Throwable $throwable) {
            $logger->error($throwable->getMessage() . PHP_EOL . $throwable->getTraceAsString());
            $documentEntity->setSyncStatus(KnowledgeSyncStatus::SyncFailed->value);
            $documentEntity->setSyncStatusMessage($throwable->getMessage());
        }
        $knowledgeBaseDocumentDomainService->changeSyncStatus($dataIsolation, $documentEntity);
    }
}
