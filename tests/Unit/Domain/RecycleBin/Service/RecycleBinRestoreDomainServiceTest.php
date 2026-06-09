<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Domain\RecycleBin\Service;

use Dtyq\SuperMagic\Domain\RecycleBin\Entity\RecycleBinEntity;
use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Dtyq\SuperMagic\Domain\RecycleBin\Repository\Facade\RecycleBinRepositoryInterface;
use Dtyq\SuperMagic\Domain\RecycleBin\Service\RecycleBinRestoreDomainService;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\ProjectMemberRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\ProjectRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskFileRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TopicRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\WorkspaceRepositoryInterface;
use Hyperf\Logger\LoggerFactory;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * @internal
 */
class RecycleBinRestoreDomainServiceTest extends TestCase
{
    private MockObject|RecycleBinRepositoryInterface $recycleBinRepo;

    private MockObject|TaskFileRepositoryInterface $taskFileRepo;

    private MockObject|ProjectRepositoryInterface $projectRepo;

    private MockObject|TopicRepositoryInterface $topicRepo;

    private MockObject|WorkspaceRepositoryInterface $workspaceRepo;

    private MockObject|ProjectMemberRepositoryInterface $projectMemberRepo;

    private RecycleBinRestoreDomainService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->recycleBinRepo = $this->createMock(RecycleBinRepositoryInterface::class);
        $this->taskFileRepo = $this->createMock(TaskFileRepositoryInterface::class);
        $this->projectRepo = $this->createMock(ProjectRepositoryInterface::class);
        $this->topicRepo = $this->createMock(TopicRepositoryInterface::class);
        $this->workspaceRepo = $this->createMock(WorkspaceRepositoryInterface::class);
        $this->projectMemberRepo = $this->createMock(ProjectMemberRepositoryInterface::class);

        $logger = $this->createMock(LoggerInterface::class);
        $loggerFactory = $this->createMock(LoggerFactory::class);
        $loggerFactory->method('get')->willReturn($logger);

        $this->service = new RecycleBinRestoreDomainService(
            $this->recycleBinRepo,
            $this->workspaceRepo,
            $this->projectRepo,
            $this->topicRepo,
            $this->taskFileRepo,
            $this->projectMemberRepo,
            $loggerFactory
        );
    }

    // ----------------------------------------------------------------
    // previewFileConflicts — parent_missing
    // ----------------------------------------------------------------

    public function testPreviewReturnsParentMissingWhenParentNotFound(): void
    {
        $fileId = 100;
        $parentId = 200;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeFileEntity($fileId, $parentId, 'report.docx', projectId: 1);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);

        $result = $this->service->previewFileConflicts([(string) $fileId], 'user1');

        $this->assertCount(1, $result['items_with_conflict']);
        $this->assertCount(0, $result['items_no_conflict']);

        $item = $result['items_with_conflict'][0];
        $this->assertEquals('parent_missing', $item->conflict->type->value);
        $this->assertEquals($parentId, $item->conflict->originalParentId);
    }

    public function testPreviewReturnsNameConflictWhenSameNameExists(): void
    {
        $fileId = 101;
        $parentId = 300;
        $conflictId = 999;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeFileEntity($fileId, $parentId, 'imgs', projectId: 1, isDirectory: true);
        $parent = $this->makeFileEntity($parentId, null, 'parent', projectId: 1, isDirectory: true);
        $conflict = $this->makeFileEntity($conflictId, $parentId, 'imgs', projectId: 1, isDirectory: true);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, $parent]]);
        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn($conflict);

        $result = $this->service->previewFileConflicts([(string) $fileId], 'user1');

        $this->assertCount(1, $result['items_with_conflict']);
        $item = $result['items_with_conflict'][0];
        $this->assertEquals('name_conflict', $item->conflict->type->value);
        $this->assertEquals($conflictId, $item->conflict->existingFileId);
        $this->assertTrue($item->conflict->existingIsDirectory);
    }

    public function testPreviewReturnsNoConflictWhenParentExistsAndNoNameConflict(): void
    {
        $fileId = 102;
        $parentId = 300;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeFileEntity($fileId, $parentId, 'test.txt', projectId: 1);
        $parent = $this->makeFileEntity($parentId, null, 'docs', projectId: 1, isDirectory: true);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, $parent]]);
        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn(null);

        $result = $this->service->previewFileConflicts([(string) $fileId], 'user1');

        $this->assertCount(0, $result['items_with_conflict']);
        $this->assertCount(1, $result['items_no_conflict']);
    }

    public function testPreviewParentMissingDoesNotCheckNameConflict(): void
    {
        $fileId = 103;
        $parentId = 200;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeFileEntity($fileId, $parentId, 'data.csv', projectId: 1);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);

        // When parent is missing, name conflict check must NOT be called
        $this->taskFileRepo->expects($this->never())->method('getByProjectParentAndName');

        $result = $this->service->previewFileConflicts([(string) $fileId], 'user1');

        $this->assertEquals('parent_missing', $result['items_with_conflict'][0]->conflict->type->value);
    }

    public function testPreviewEmptyInputReturnsEmptyArrays(): void
    {
        $result = $this->service->previewFileConflicts([], 'user1');

        $this->assertArrayHasKey('items_with_conflict', $result);
        $this->assertArrayHasKey('items_no_conflict', $result);
        $this->assertCount(0, $result['items_with_conflict']);
        $this->assertCount(0, $result['items_no_conflict']);
    }

    // ----------------------------------------------------------------
    // restoreFile — blocks when conflict has no resolution
    // ----------------------------------------------------------------

    public function testRestoreFileThrowsWhenParentMissingAndNoResolution(): void
    {
        $fileId = 100;
        $parentId = 200;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, $parentId, 'report.docx', projectId: 1);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);

        // No resolutions passed
        $result = $this->service->restoreBatch([$fileId], RecycleBinResourceType::File, 'user1', []);

        $this->assertCount(0, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
    }

    public function testRestoreFileFailsWhenParentMissingAndSkipResolution(): void
    {
        $fileId = 100;
        $parentId = 200;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, $parentId, 'report.docx', projectId: 1);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);

        $result = $this->service->restoreBatch(
            [$fileId],
            RecycleBinResourceType::File,
            'user1',
            [(string) $fileId => ['parent_missing' => 'skip']]
        );

        $this->assertCount(0, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
    }

    public function testRestoreFileThrowsWhenNameConflictAndNoResolution(): void
    {
        $fileId = 101;
        $parentId = 300;
        $conflictId = 999;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, $parentId, 'imgs', projectId: 1, isDirectory: true);
        $parent = $this->makeFileEntity($parentId, null, 'docs', projectId: 1, isDirectory: true);
        $conflict = $this->makeFileEntity($conflictId, $parentId, 'imgs', projectId: 1, isDirectory: true);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, $parent]]);
        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn($conflict);

        $result = $this->service->restoreBatch(
            [$fileId],
            RecycleBinResourceType::File,
            'user1',
            []
        );

        $this->assertCount(0, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
    }

    // ----------------------------------------------------------------
    // restoreFile — restore_to_root + name_conflict (critical scenario)
    // ----------------------------------------------------------------

    public function testRestoreToRootThenNameConflictOverwrite(): void
    {
        $fileId = 100;
        $parentId = 200;
        $rootId = 1;
        $conflictId = 888;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, $parentId, 'report.docx', projectId: 5);
        $root = $this->makeFileEntity($rootId, null, '/', projectId: 5, isDirectory: true);
        $conflict = $this->makeFileEntity($conflictId, $rootId, 'report.docx', projectId: 5);
        $restoredFile = $this->makeFileEntity($fileId, $rootId, 'report.docx', projectId: 5);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->recycleBinRepo->method('deleteById')->willReturn(true);

        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);
        $this->taskFileRepo->method('findRootDirectoryByProjectId')->with(5)->willReturn($root);
        $this->taskFileRepo->method('getByProjectParentAndName')
            ->with(5, $rootId, 'report.docx')
            ->willReturn($conflict);
        $this->taskFileRepo->expects($this->once())
            ->method('deleteById')
            ->with($conflictId, false);
        $this->taskFileRepo->method('restoreFile')->with($fileId);
        $this->taskFileRepo->method('getById')->with($fileId)->willReturn($restoredFile);
        $this->taskFileRepo->method('updateById')->willReturn($restoredFile);

        $result = $this->service->restoreBatch(
            [$fileId],
            RecycleBinResourceType::File,
            'user1',
            [(string) $fileId => ['parent_missing' => 'restore_to_root', 'name_conflict' => 'overwrite']]
        );

        $this->assertCount(1, $result['succeeded']);
        $this->assertCount(0, $result['failed']);
    }

    public function testRestoreToRootThenNameConflictMissingResolutionFails(): void
    {
        $fileId = 100;
        $parentId = 200;
        $rootId = 1;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, $parentId, 'report.docx', projectId: 5);
        $root = $this->makeFileEntity($rootId, null, '/', projectId: 5, isDirectory: true);
        $conflict = $this->makeFileEntity(888, $rootId, 'report.docx', projectId: 5);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([[$fileId, $file], [$parentId, null]]);
        $this->taskFileRepo->method('findRootDirectoryByProjectId')->willReturn($root);
        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn($conflict);

        // Only parent_missing resolved, name_conflict resolution not provided
        $result = $this->service->restoreBatch(
            [$fileId],
            RecycleBinResourceType::File,
            'user1',
            [(string) $fileId => ['parent_missing' => 'restore_to_root']]
        );

        $this->assertCount(0, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
    }

    // ----------------------------------------------------------------
    // restoreBatch — partial success
    // ----------------------------------------------------------------

    public function testBatchRestorePartialSuccess(): void
    {
        $okFileId = 200;
        $failedFileId = 201;
        $parentId = 300;

        $okEntity = $this->makeRecycleBinEntity($okFileId);
        $failedEntity = $this->makeRecycleBinEntity($failedFileId);
        $okFile = $this->makeDeletedFileEntity($okFileId, $parentId, 'ok.txt', projectId: 1);
        $failedFile = $this->makeDeletedFileEntity($failedFileId, 999, 'fail.txt', projectId: 1);
        $parent = $this->makeFileEntity($parentId, null, 'docs', projectId: 1, isDirectory: true);
        $restoredFile = $this->makeFileEntity($okFileId, $parentId, 'ok.txt', projectId: 1);

        $this->recycleBinRepo->method('findLatestByResourceIds')
            ->willReturn([$okEntity, $failedEntity]);
        $this->recycleBinRepo->method('deleteById')->willReturn(true);

        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnCallback(function (int $id) use ($okFileId, $failedFileId, $parentId, $okFile, $failedFile, $parent) {
                return match ($id) {
                    $okFileId => $okFile,
                    $failedFileId => $failedFile,
                    $parentId => $parent,
                    999 => null,
                    default => null,
                };
            });

        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn(null);
        $this->taskFileRepo->method('restoreFile');
        $this->taskFileRepo->method('getById')->willReturn($restoredFile);
        $this->taskFileRepo->method('updateById')->willReturn($restoredFile);

        // okFile: parent exists, no name conflict — should succeed
        // failedFile: parent 999 missing, no resolution → fail
        $result = $this->service->restoreBatch(
            [$okFileId, $failedFileId],
            RecycleBinResourceType::File,
            'user1',
            []
        );

        $this->assertCount(1, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
        $this->assertEquals($okFileId, (int) $result['succeeded'][0]->getResourceId());
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private function makeRecycleBinEntity(int $resourceId): RecycleBinEntity
    {
        $entity = new RecycleBinEntity();
        $entity->setId($resourceId + 10000);
        $entity->setResourceId($resourceId);
        $entity->setResourceType(RecycleBinResourceType::File);
        $entity->setResourceName('test');
        $entity->setOwnerId('user1');
        $entity->setDeletedBy('user1');
        $entity->setDeletedAt(date('Y-m-d H:i:s'));
        return $entity;
    }

    private function makeFileEntity(
        int $fileId,
        ?int $parentId,
        string $fileName,
        int $projectId = 1,
        bool $isDirectory = false
    ): TaskFileEntity {
        return new TaskFileEntity([
            'file_id' => $fileId,
            'parent_id' => $parentId,
            'file_name' => $fileName,
            'project_id' => $projectId,
            'is_directory' => $isDirectory,
            'deleted_at' => null,
        ]);
    }

    private function makeDeletedFileEntity(
        int $fileId,
        ?int $parentId,
        string $fileName,
        int $projectId = 1,
        bool $isDirectory = false
    ): TaskFileEntity {
        return new TaskFileEntity([
            'file_id' => $fileId,
            'parent_id' => $parentId,
            'file_name' => $fileName,
            'project_id' => $projectId,
            'is_directory' => $isDirectory,
            'deleted_at' => date('Y-m-d H:i:s'),
        ]);
    }
}
