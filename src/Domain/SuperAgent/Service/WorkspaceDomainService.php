<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Service;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestContext;
use Dtyq\SuperMagic\Domain\SuperAgent\Constant\AgentConstant;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\Query\TopicQuery;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\WorkspaceArchiveStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\WorkspaceCreationParams;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\WorkspaceStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\WorkspaceEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskFileRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TopicRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\WorkspaceRepositoryInterface;
use Exception;
use RuntimeException;

class WorkspaceDomainService
{
    public function __construct(
        protected WorkspaceRepositoryInterface $workspaceRepository,
        protected TopicRepositoryInterface $topicRepository,
        protected TaskFileRepositoryInterface $taskFileRepository,
        protected TaskRepositoryInterface $taskRepository,
        protected TaskDomainService $taskDomainService,
    ) {
    }

    /**
     * 创建工作区. 默认会初始化一个话题
     * 遵循DDD风格，领域服务负责处理业务逻辑.
     * @return array 包含工作区实体和话题实体的数组 ['workspace' => WorkspaceEntity, 'topic' => TopicEntity|null]
     */
    public function createWorkspace(DataIsolation $dataIsolation, WorkspaceCreationParams $creationParams): array
    {
        // 从DataIsolation获取当前用户ID作为创建者ID
        $currentUserId = $dataIsolation->getCurrentUserId();
        $organizationCode = $dataIsolation->getCurrentOrganizationCode();

        // 创建工作区实体
        $currentTime = date('Y-m-d H:i:s');
        $workspaceEntity = new WorkspaceEntity();
        $workspaceEntity->setUserId($currentUserId); // 使用当前用户ID
        $workspaceEntity->setUserOrganizationCode($dataIsolation->getCurrentOrganizationCode());
        $workspaceEntity->setChatConversationId($creationParams->getChatConversationId());
        $workspaceEntity->setName($creationParams->getWorkspaceName());
        $workspaceEntity->setArchiveStatus(WorkspaceArchiveStatus::NotArchived); // 默认未归档
        $workspaceEntity->setWorkspaceStatus(WorkspaceStatus::Normal); // 默认状态：正常
        $workspaceEntity->setCreatedUid($currentUserId); // 从DataIsolation获取
        $workspaceEntity->setUpdatedUid($currentUserId); // 创建时更新者与创建者相同
        $workspaceEntity->setCreatedAt($currentTime);
        $workspaceEntity->setUpdatedAt($currentTime);

        // 使用事务保证工作区和话题同时创建成功
        $topicEntity = null;
        // 调用仓储层保存工作区
        $savedWorkspaceEntity = $this->workspaceRepository->createWorkspace($workspaceEntity);

        // 创建话题
        if ($savedWorkspaceEntity->getId() && ! empty($creationParams->getChatConversationTopicId())) {
            // 创建话题实体
            $topicEntity = new TopicEntity();
            $topicEntity->setUserId($currentUserId);
            $topicEntity->setUserOrganizationCode($organizationCode);
            $topicEntity->setWorkspaceId($savedWorkspaceEntity->getId());
            $topicEntity->setChatTopicId($creationParams->getChatConversationTopicId());
            $topicEntity->setChatConversationId($creationParams->getChatConversationId());
            $topicEntity->setSandboxId(''); // 初始为空
            $topicEntity->setWorkDir(''); // 初始为空
            $topicEntity->setCurrentTaskId(0);
            $topicEntity->setTopicName($creationParams->getTopicName());
            $topicEntity->setCurrentTaskStatus(TaskStatus::WAITING); // 默认状态：等待中
            $topicEntity->setCreatedUid($currentUserId); // 设置创建者用户ID
            $topicEntity->setUpdatedUid($currentUserId); // 设置更新者用户ID

            // 使用 topicRepository 保存话题
            $savedTopicEntity = $this->topicRepository->createTopic($topicEntity);

            if ($savedTopicEntity->getId()) {
                // 设置工作区的当前话题ID为新创建的话题ID
                $savedWorkspaceEntity->setCurrentTopicId($savedTopicEntity->getId());
                // 更新工作区
                $this->workspaceRepository->save($savedWorkspaceEntity);
                // 更新工作目录
                $topicEntity->setWorkDir($this->generateWorkDir($currentUserId, $savedTopicEntity->getId()));
                $this->topicRepository->updateTopic($topicEntity);
            }

            $topicEntity = $savedTopicEntity;
        }

        $result = $savedWorkspaceEntity;
        return [
            'workspace' => $result,
            'topic' => $topicEntity,
        ];
    }

    /**
     * 更新工作区.
     * 遵循DDD风格，领域服务负责处理业务逻辑.
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $workspaceId 工作区ID
     * @param string $workspaceName 工作区名称
     * @return bool 是否更新成功
     */
    public function updateWorkspace(DataIsolation $dataIsolation, int $workspaceId, string $workspaceName = ''): bool
    {
        // 获取工作区实体
        $workspaceEntity = $this->workspaceRepository->getWorkspaceById($workspaceId);

        if (! $workspaceEntity) {
            throw new RuntimeException('Workspace not found');
        }

        // 如果有传入工作区名称，则更新名称
        if (! empty($workspaceName)) {
            $workspaceEntity->setName($workspaceName);
            $workspaceEntity->setUpdatedAt(date('Y-m-d H:i:s'));
            $workspaceEntity->setUpdatedUid($dataIsolation->getCurrentUserId()); // 设置更新者用户ID
        }

        // 使用通用 save 方法保存
        $this->workspaceRepository->save($workspaceEntity);
        return true;
    }

    /**
     * 获取工作区详情.
     */
    public function getWorkspaceDetail(int $workspaceId): ?WorkspaceEntity
    {
        return $this->workspaceRepository->getWorkspaceById($workspaceId);
    }

    /**
     * 归档/解除归档工作区.
     */
    public function archiveWorkspace(RequestContext $requestContext, int $workspaceId, bool $isArchived): bool
    {
        $archiveStatus = $isArchived ? WorkspaceArchiveStatus::Archived : WorkspaceArchiveStatus::NotArchived;
        return $this->workspaceRepository->updateWorkspaceArchivedStatus($workspaceId, $archiveStatus->value);
    }

    /**
     * 删除工作区（逻辑删除）.
     *
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $workspaceId 工作区ID
     * @return bool 是否删除成功
     * @throws RuntimeException 如果工作区不存在则抛出异常
     */
    public function deleteWorkspace(DataIsolation $dataIsolation, int $workspaceId): bool
    {
        // 获取工作区实体
        $workspaceEntity = $this->workspaceRepository->getWorkspaceById($workspaceId);

        if (! $workspaceEntity) {
            // 使用ExceptionBuilder抛出"未找到"类型的错误
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.not_found');
        }

        // 获取工作区下的话题列表
        $conditions = [
            'workspace_id' => $workspaceId,
            'user_id' => $dataIsolation->getCurrentUserId(),
        ];

        $topics = $this->topicRepository->getTopicsByConditions($conditions, false);
        if (! empty($topics['list'])) {
            // 检查是否有正在运行的话题任务
            foreach ($topics['list'] as $topic) {
                if ($topic->getCurrentTaskStatus() === TaskStatus::RUNNING) {
                    // 如果有正在运行的话题任务，不允许删除工作区
                    ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.cannot_delete_with_running_topics');
                }
            }
        }

        // 设置删除时间
        $workspaceEntity->setDeletedAt(date('Y-m-d H:i:s'));
        $workspaceEntity->setUpdatedUid($dataIsolation->getCurrentUserId());
        $workspaceEntity->setUpdatedAt(date('Y-m-d H:i:s'));

        // 保存更新
        $this->workspaceRepository->save($workspaceEntity);
        return true;
    }

    /**
     * 设置当前话题.
     */
    public function setCurrentTopic(RequestContext $requestContext, int $workspaceId, string $topicId): bool
    {
        return $this->workspaceRepository->updateWorkspaceCurrentTopic($workspaceId, $topicId);
    }

    /**
     * 根据条件获取工作区列表.
     */
    public function getWorkspacesByConditions(
        array $conditions,
        int $page,
        int $pageSize,
        DataIsolation $dataIsolation
    ): array {
        // 应用数据隔离
        $conditions = $this->applyDataIsolation($conditions, $dataIsolation);

        // 调用仓储层获取数据
        return $this->workspaceRepository->getWorkspacesByConditions(
            $conditions,
            $page,
            $pageSize
        );
    }

    /**
     * 获取工作区下的话题列表.
     * @param array $workspaceIds 工作区ID数组
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param bool $needPagination 是否需要分页
     * @param int $pageSize 每页数量
     * @param int $page 页码
     * @param string $orderBy 排序字段
     * @param string $orderDirection 排序方向
     * @return array 话题列表
     */
    public function getWorkspaceTopics(
        array $workspaceIds,
        DataIsolation $dataIsolation,
        bool $needPagination = true,
        int $pageSize = 20,
        int $page = 1,
        string $orderBy = 'id',
        string $orderDirection = 'desc'
    ): array {
        $conditions = [
            'workspace_id' => $workspaceIds,
            'user_id' => $dataIsolation->getCurrentUserId(),
        ];

        return $this->topicRepository->getTopicsByConditions(
            $conditions,
            $needPagination,
            $pageSize,
            $page,
            $orderBy,
            $orderDirection
        );
    }

    /**
     * 获取任务的附件列表.
     *
     * @param int $taskId 任务ID
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $page 页码
     * @param int $pageSize 每页数量
     * @return array 附件列表和总数
     */
    public function getTaskAttachments(int $taskId, DataIsolation $dataIsolation, int $page = 1, int $pageSize = 20): array
    {
        // 调用TaskFileRepository获取文件列表
        return $this->taskFileRepository->getByTaskId($taskId, $page, $pageSize);
        // 直接返回实体对象列表，让应用层处理URL获取
    }

    /**
     * 创建话题.
     *
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $workspaceId 工作区ID
     * @param string $chatTopicId 会话的话题ID，存储在topic_id字段中
     * @param string $topicName 话题名称
     * @return TopicEntity 创建的话题实体
     * @throws Exception 如果创建失败
     */
    public function createTopic(DataIsolation $dataIsolation, int $workspaceId, string $chatTopicId, string $topicName): TopicEntity
    {
        // 获取当前用户ID
        $userId = $dataIsolation->getCurrentUserId();
        $organizationCode = $dataIsolation->getCurrentOrganizationCode();

        // 获取工作区详情，检查工作区是否存在
        $workspaceEntity = $this->workspaceRepository->getWorkspaceById($workspaceId);
        if (! $workspaceEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.not_found');
        }

        // 检查工作区是否已归档
        if ($workspaceEntity->getArchiveStatus() === WorkspaceArchiveStatus::Archived) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.archived');
        }

        // 获取会话ID
        $chatConversationId = $workspaceEntity->getChatConversationId();
        if (empty($chatConversationId)) {
            ExceptionBuilder::throw(GenericErrorCode::SystemError, 'workspace.conversation_id_not_found');
        }

        // 如果话题ID为空，抛出异常
        if (empty($chatTopicId)) {
            ExceptionBuilder::throw(GenericErrorCode::ParameterMissing, 'topic.id_required');
        }

        // 创建话题实体
        $topicEntity = new TopicEntity();
        $topicEntity->setUserId($userId);
        $topicEntity->setUserOrganizationCode($organizationCode);
        $topicEntity->setWorkspaceId($workspaceId);
        $topicEntity->setChatTopicId($chatTopicId);
        $topicEntity->setChatConversationId($chatConversationId);
        $topicEntity->setTopicName($topicName);
        $topicEntity->setSandboxId(''); // 初始为空
        $topicEntity->setWorkDir(''); // 初始为空
        $topicEntity->setCurrentTaskId(0);
        $topicEntity->setCurrentTaskStatus(TaskStatus::WAITING); // 默认状态：等待中
        $topicEntity->setCreatedUid($userId); // 设置创建者用户ID
        $topicEntity->setUpdatedUid($userId); // 设置更新者用户ID

        // 保存话题
        $topicEntity = $this->topicRepository->createTopic($topicEntity);
        // 更新工作区
        if ($topicEntity->getId()) {
            $topicEntity->setWorkDir($this->generateWorkDir($userId, $topicEntity->getId()));
            $this->topicRepository->updateTopic($topicEntity);
        }
        return $topicEntity;
    }

    /**
     * 更新话题名称.
     *
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $id 话题主键ID
     * @param string $topicName 话题名称
     * @return bool 是否更新成功
     * @throws Exception 如果更新失败
     */
    public function updateTopicName(DataIsolation $dataIsolation, int $id, string $topicName): bool
    {
        // 获取当前用户ID
        $userId = $dataIsolation->getCurrentUserId();

        // 通过主键ID获取话题
        $topicEntity = $this->topicRepository->getTopicById($id);
        if (! $topicEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'topic.not_found');
        }

        // 检查用户权限（检查话题是否属于当前用户）
        if ($topicEntity->getUserId() !== $userId) {
            ExceptionBuilder::throw(GenericErrorCode::AccessDenied, 'topic.access_denied');
        }

        // 获取工作区详情，检查工作区是否存在
        $workspaceEntity = $this->workspaceRepository->getWorkspaceById($topicEntity->getWorkspaceId());
        if (! $workspaceEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.not_found');
        }

        // 检查工作区是否已归档
        if ($workspaceEntity->getArchiveStatus() === WorkspaceArchiveStatus::Archived) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.archived');
        }

        // 更新话题名称
        $topicEntity->setTopicName($topicName);
        // 设置更新者用户ID
        $topicEntity->setUpdatedUid($userId);
        // 保存更新
        return $this->topicRepository->updateTopic($topicEntity);
    }

    /**
     * 通过ID获取话题实体.
     *
     * @param int $id 话题ID(主键)
     * @return null|TopicEntity 话题实体
     */
    public function getTopicById(int $id): ?TopicEntity
    {
        return $this->topicRepository->getTopicById($id);
    }

    public function getTopicBySandboxId(string $sandboxId): ?TopicEntity
    {
        $topics = $this->topicRepository->getTopicsByConditions(['sandbox_id' => $sandboxId], true, 1, 1);
        if (! isset($topics['list']) || empty($topics['list'])) {
            return null;
        }
        return $topics['list'][0];
    }

    /**
     * 保存工作区实体
     * 直接保存工作区实体，不需要重复查询.
     * @param WorkspaceEntity $workspaceEntity 工作区实体
     * @return WorkspaceEntity 保存后的工作区实体
     */
    public function saveWorkspaceEntity(WorkspaceEntity $workspaceEntity): WorkspaceEntity
    {
        return $this->workspaceRepository->save($workspaceEntity);
    }

    /**
     * 获取工作区的话题列表.
     *
     * @param array|int $workspaceIds 工作区ID或ID数组
     * @param string $userId 用户ID
     * @return array 话题列表，以工作区ID为键
     */
    public function getWorkspaceTopicsByWorkspaceIds(array|int $workspaceIds, string $userId): array
    {
        if (! is_array($workspaceIds)) {
            $workspaceIds = [$workspaceIds];
        }

        // 如果没有工作区ID，直接返回空数组
        if (empty($workspaceIds)) {
            return [];
        }

        // 定义查询条件
        $conditions = [
            'workspace_id' => $workspaceIds,
            'user_id' => $userId,
        ];

        // 获取所有符合条件的话题
        $result = $this->topicRepository->getTopicsByConditions(
            $conditions,
            false, // 不分页，获取所有
            100,
            1,
            'id',
            'asc'
        );

        // 重新按工作区 ID 分组
        $topics = [];
        foreach ($result['list'] as $topic) {
            $workspaceId = $topic->getWorkspaceId();
            if (! isset($topics[$workspaceId])) {
                $topics[$workspaceId] = [];
            }
            $topics[$workspaceId][] = $topic;
        }

        return $topics;
    }

    public function getUserTopics(string $userId): array
    {
        // 考虑是否需要组织 code
        $topics = $this->topicRepository->getTopicsByConditions(
            ['user_id' => $userId],
            false, // 不分页，获取所有
            100,
            1,
            'id',
            'asc'
        );
        if (empty($topics['list'])) {
            return [];
        }

        return $topics['list'];
    }

    public function getTopicList(int $page, int $pageSize): array
    {
        // 考虑是否需要组织 code
        // 不分页，获取所有
        $topics = $this->topicRepository->getTopicsByConditions([], true, $pageSize, $page);
        if (empty($topics['list'])) {
            return [];
        }

        return $topics['list'];
    }

    /**
     * 根据任务状态获取工作区的话题列表.
     *
     * @param array|int $workspaceIds 工作区ID或ID数组
     * @param string $userId 用户ID
     * @param null|TaskStatus $taskStatus 任务状态，如果为null则返回所有状态
     * @return array 话题列表，以工作区ID为键
     */
    public function getWorkspaceTopicsByTaskStatus(array|int $workspaceIds, string $userId, ?TaskStatus $taskStatus = null): array
    {
        // 获取所有话题
        $allTopics = $this->getWorkspaceTopicsByWorkspaceIds($workspaceIds, $userId);

        // 如果不需要过滤任务状态，直接返回所有话题
        if ($taskStatus === null) {
            return $allTopics;
        }

        // 根据任务状态过滤话题
        $filteredTopics = [];
        foreach ($allTopics as $workspaceId => $topics) {
            $filteredTopicList = [];
            foreach ($topics as $topic) {
                // 如果话题的当前任务状态与指定状态匹配，或者话题没有任务状态且指定的是等待状态
                if (($topic->getCurrentTaskStatus() === $taskStatus)
                    || ($topic->getCurrentTaskStatus() === null && $taskStatus === TaskStatus::WAITING)) {
                    $filteredTopicList[] = $topic;
                }
            }

            if (! empty($filteredTopicList)) {
                $filteredTopics[$workspaceId] = $filteredTopicList;
            }
        }

        return $filteredTopics;
    }

    /**
     * 删除话题（逻辑删除）.
     *
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param int $id 话题ID(主键)
     * @return bool 是否删除成功
     * @throws Exception 如果删除失败或任务状态为运行中
     */
    public function deleteTopic(DataIsolation $dataIsolation, int $id): bool
    {
        // 获取当前用户ID
        $userId = $dataIsolation->getCurrentUserId();

        // 通过主键ID获取话题
        $topicEntity = $this->topicRepository->getTopicById($id);
        if (! $topicEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'topic.not_found');
        }

        // 检查用户权限（检查话题是否属于当前用户）
        if ($topicEntity->getUserId() !== $userId) {
            ExceptionBuilder::throw(GenericErrorCode::AccessDenied, 'topic.access_denied');
        }

        // 检查任务状态，如果是运行中则不允许删除
        if ($topicEntity->getCurrentTaskStatus() === TaskStatus::RUNNING) {
            // 向 agent 发送停止命令
            $taskEntity = $this->taskRepository->getTaskById($topicEntity->getCurrentTaskId());
            if (! empty($taskEntity)) {
                $this->taskDomainService->handleInterruptInstruction($taskEntity);
            }
        }

        // 获取工作区详情，检查工作区是否存在
        $workspaceEntity = $this->workspaceRepository->getWorkspaceById($topicEntity->getWorkspaceId());
        if (! $workspaceEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.not_found');
        }

        // 检查工作区是否已归档
        if ($workspaceEntity->getArchiveStatus() === WorkspaceArchiveStatus::Archived) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'workspace.archived');
        }

        // 删除该话题下的所有任务（调用仓储层的批量删除方法）
        $this->taskRepository->deleteTasksByTopicId($id);

        // 设置删除时间
        $topicEntity->setDeletedAt(date('Y-m-d H:i:s'));
        // 设置更新者用户ID
        $topicEntity->setUpdatedUid($userId);

        // 保存更新
        return $this->topicRepository->updateTopic($topicEntity);
    }

    /**
     * 获取任务详情.
     *
     * @param int $taskId 任务ID
     * @return null|TaskEntity 任务实体
     */
    public function getTaskById(int $taskId): ?TaskEntity
    {
        return $this->taskRepository->getTaskById($taskId);
    }

    /**
     * 获取话题关联的任务列表.
     *
     * @param int $topicId 话题ID
     * @param int $page 页码
     * @param int $pageSize 每页数量
     * @param null|DataIsolation $dataIsolation 数据隔离对象
     * @return array{list: TaskEntity[], total: int} 任务列表和总数
     */
    public function getTasksByTopicId(int $topicId, int $page = 1, int $pageSize = 10, ?DataIsolation $dataIsolation = null): array
    {
        return $this->taskRepository->getTasksByTopicId($topicId, $page, $pageSize);
    }

    /**
     * 通过话题ID集合获取工作区信息.
     *
     * @param array $topicIds 话题ID集合
     * @return array 以话题ID为键，工作区信息为值的关联数组
     */
    public function getWorkspaceInfoByTopicIds(array $topicIds): array
    {
        if (empty($topicIds)) {
            return [];
        }

        return $this->topicRepository->getWorkspaceInfoByTopicIds($topicIds);
    }

    public function updateTopicSandboxConfig(DataIsolation $dataIsolation, int $topicId, array $sandboxConfig): bool
    {
        $topicEntity = $this->topicRepository->getTopicById($topicId);
        if (! $topicEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'topic.not_found');
        }

        $topicEntity->setSandboxConfig(json_encode($sandboxConfig));
        return $this->topicRepository->updateTopic($topicEntity);
    }

    /**
     * 获取所有工作区的唯一组织代码列表.
     *
     * @return array 唯一的组织代码列表
     */
    public function getUniqueOrganizationCodes(): array
    {
        return $this->workspaceRepository->getUniqueOrganizationCodes();
    }

    /**
     * 根据话题查询对象获取话题列表.
     *
     * @param TopicQuery $query 话题查询对象
     * @return array{total: int, list: array<TopicEntity>} 话题列表和总数
     */
    public function getTopicsByQuery(TopicQuery $query): array
    {
        $conditions = $query->toConditions();

        // 查询话题
        return $this->topicRepository->getTopicsByConditions(
            $conditions,
            true,
            $query->getPageSize(),
            $query->getPage()
        );
    }

    /**
     * 获取话题状态统计指标.
     *
     * @param DataIsolation $dataIsolation 数据隔离对象
     * @param string $organizationCode 可选的组织代码过滤
     * @return array 话题状态统计指标数据
     */
    public function getTopicStatusMetrics(DataIsolation $dataIsolation, string $organizationCode = ''): array
    {
        // 构建查询条件
        $conditions = [];
        // 如果提供了组织代码，添加到查询条件
        if (! empty($organizationCode)) {
            $conditions['user_organization_code'] = $organizationCode;
        }

        // 使用仓储层查询统计数据
        return $this->topicRepository->getTopicStatusMetrics($conditions);
    }

    /**
     * 应用数据隔离到查询条件.
     */
    private function applyDataIsolation(array $conditions, DataIsolation $dataIsolation): array
    {
        // 用户id 和 组织代码
        $conditions['user_id'] = $dataIsolation->getCurrentUserId();
        $conditions['user_organization_code'] = $dataIsolation->getCurrentOrganizationCode();
        return $conditions;
    }

    /**
     * 生成工作目录.
     */
    private function generateWorkDir(string $userId, int $topicId): string
    {
        return sprintf('/%s/%s/topic_%d', AgentConstant::SUPER_MAGIC_CODE, $userId, $topicId);
    }
}
