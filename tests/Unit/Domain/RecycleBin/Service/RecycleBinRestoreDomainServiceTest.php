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
        $this->projectRepo->method('existsAndNotDeleted')
            ->willReturnCallback(fn (int $projectId) => $projectId !== 404);

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

    public function testPreviewMarksOlderDuplicateTargetWhenSameNameFilesSelected(): void
    {
        $olderFileId = 110;
        $latestFileId = 111;
        $parentId = 300;

        $olderEntity = $this->makeRecycleBinEntity($olderFileId, '2026-06-16 10:00:00');
        $latestEntity = $this->makeRecycleBinEntity($latestFileId, '2026-06-16 11:00:00');
        $olderFile = $this->makeDeletedFileEntity($olderFileId, $parentId, 'same.txt', projectId: 1);
        $latestFile = $this->makeDeletedFileEntity($latestFileId, $parentId, 'same.txt', projectId: 1);
        $parent = $this->makeFileEntity($parentId, null, 'docs', projectId: 1, isDirectory: true);

        $this->recycleBinRepo->method('findLatestByResourceIds')
            ->willReturn([$olderEntity, $latestEntity]);
        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnMap([
                [$olderFileId, $olderFile],
                [$latestFileId, $latestFile],
                [$parentId, $parent],
            ]);
        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn(null);

        $result = $this->service->previewFileConflicts([(string) $olderFileId, (string) $latestFileId], 'user1');

        $this->assertCount(1, $result['items_no_conflict']);
        $this->assertEquals((string) $latestFileId, $result['items_no_conflict'][0]->resourceId);
        $this->assertCount(1, $result['items_with_conflict']);
        $this->assertEquals((string) $olderFileId, $result['items_with_conflict'][0]->resourceId);
        $this->assertEquals('duplicate_restore_target', $result['items_with_conflict'][0]->conflict->type->value);
    }

    public function testPreviewReturnsProjectMissingWhenFileProjectDeleted(): void
    {
        $fileId = 4041;
        $projectId = 404;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, null, 'orphan.txt', projectId: $projectId);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')->with($fileId)->willReturn($file);

        $result = $this->service->previewFileConflicts([(string) $fileId], 'user1');

        $this->assertCount(1, $result['items_with_conflict']);
        $this->assertCount(0, $result['items_no_conflict']);
        $this->assertEquals('project_missing', $result['items_with_conflict'][0]->conflict->type->value);
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
            $this->makeConflictResolutions($fileId, ['parent_missing' => 'skip'])
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
            $this->makeConflictResolutions(
                $fileId,
                ['parent_missing' => 'restore_to_root', 'name_conflict' => 'overwrite']
            )
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
            $this->makeConflictResolutions($fileId, ['parent_missing' => 'restore_to_root'])
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

    public function testBatchRestoreSameNameFilesDefaultsToLatestDeleted(): void
    {
        $olderFileId = 300;
        $latestFileId = 301;
        $parentId = 400;
        $projectId = 10;

        $olderEntity = $this->makeRecycleBinEntity($olderFileId, '2026-06-16 10:00:00');
        $latestEntity = $this->makeRecycleBinEntity($latestFileId, '2026-06-16 11:00:00');
        $olderFile = $this->makeDeletedFileEntity($olderFileId, $parentId, 'same.txt', projectId: $projectId);
        $latestFile = $this->makeDeletedFileEntity($latestFileId, $parentId, 'same.txt', projectId: $projectId);
        $parent = $this->makeFileEntity($parentId, null, 'docs', projectId: $projectId, isDirectory: true);

        $this->recycleBinRepo->method('findLatestByResourceIds')
            ->willReturn([$olderEntity, $latestEntity]);
        $this->recycleBinRepo->method('deleteById')->willReturn(true);

        $this->taskFileRepo->method('getByIdWithTrash')
            ->willReturnCallback(function (int $id) use (
                $olderFileId,
                $latestFileId,
                $parentId,
                $olderFile,
                $latestFile,
                $parent
            ) {
                return match ($id) {
                    $olderFileId => $olderFile,
                    $latestFileId => $latestFile,
                    $parentId => $parent,
                    default => null,
                };
            });

        $this->taskFileRepo->method('getByProjectParentAndName')->willReturn(null);

        $this->taskFileRepo->expects($this->once())
            ->method('restoreFile')
            ->with($latestFileId);

        $this->taskFileRepo->method('getById')
            ->willReturnCallback(function (int $id) use ($olderFileId, $latestFileId, $parentId, $projectId) {
                return match ($id) {
                    $olderFileId, $latestFileId => $this->makeFileEntity($id, $parentId, 'same.txt', projectId: $projectId),
                    default => null,
                };
            });
        $this->taskFileRepo->method('updateById')
            ->willReturnArgument(0);

        $result = $this->service->restoreBatch(
            [$olderFileId, $latestFileId],
            RecycleBinResourceType::File,
            'user1',
            []
        );

        $this->assertCount(1, $result['succeeded']);
        $this->assertEquals($latestFileId, (int) $result['succeeded'][0]->getResourceId());
        $this->assertCount(1, $result['failed']);
        $this->assertEquals($olderFileId, (int) $result['failed'][0]['entity']->getResourceId());
        $this->assertStringContainsString('最新删除', $result['failed'][0]['error']);
    }

    public function testRestoreFileFailsWhenProjectMissing(): void
    {
        $fileId = 4040;
        $projectId = 404;

        $entity = $this->makeRecycleBinEntity($fileId);
        $file = $this->makeDeletedFileEntity($fileId, null, 'orphan.txt', projectId: $projectId);

        $this->recycleBinRepo->method('findLatestByResourceIds')->willReturn([$entity]);
        $this->taskFileRepo->method('getByIdWithTrash')->with($fileId)->willReturn($file);
        $this->taskFileRepo->expects($this->never())->method('restoreFile');

        $result = $this->service->restoreBatch([$fileId], RecycleBinResourceType::File, 'user1', []);

        $this->assertCount(0, $result['succeeded']);
        $this->assertCount(1, $result['failed']);
        $this->assertStringContainsString('文件所属项目不存在', $result['failed'][0]['error']);
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    private function makeRecycleBinEntity(int $resourceId, ?string $deletedAt = null): RecycleBinEntity
    {
        $entity = new RecycleBinEntity();
        $entity->setId($resourceId + 10000);
        $entity->setResourceId($resourceId);
        $entity->setResourceType(RecycleBinResourceType::File);
        $entity->setResourceName('test');
        $entity->setOwnerId('user1');
        $entity->setDeletedBy('user1');
        $entity->setDeletedAt($deletedAt ?? date('Y-m-d H:i:s'));
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

    /**
     * @param array<string, string> $resolution
     * @return array<int|string, array<string, string>>
     */
    private function makeConflictResolutions(int $fileId, array $resolution): array
    {
        return [(string) $fileId => $resolution];
    }
}
