<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Service;

use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\IdGenerator\IdGenerator;
use Dtyq\SuperMagic\Domain\SuperAgent\Constant\TaskFileType;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskFileEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TaskMessageEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\TopicEntity;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\ChatInstruction;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\MessageType;
use Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject\TaskStatus;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskFileRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskMessageRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TaskRepositoryInterface;
use Dtyq\SuperMagic\Domain\SuperAgent\Repository\Facade\TopicRepositoryInterface;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\Config\WebSocketConfig;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\SandboxResult;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\Volcengine\SandboxService;
use Dtyq\SuperMagic\Infrastructure\ExternalAPI\Sandbox\WebSocket\WebSocketSession;
use Hyperf\Contract\StdoutLoggerInterface;
use RuntimeException;

class TaskDomainService
{
    public function __construct(
        protected TopicRepositoryInterface $topicRepository,
        protected TaskRepositoryInterface $taskRepository,
        protected TaskMessageRepositoryInterface $messageRepository,
        protected TaskFileRepositoryInterface $taskFileRepository,
        protected StdoutLoggerInterface $logger,
        protected SandboxService $sandboxService,
    ) {
    }

    /**
     * Initialize topic task.
     *
     * @param DataIsolation $dataIsolation Data isolation object
     * @param TopicEntity $topicEntity Topic entity
     * @param string $prompt User's question
     * @param string $attachments User uploaded attachment information (JSON format)
     * @param ChatInstruction $instruction Instruction: normal, follow-up, interrupt
     * @return TaskEntity Task entity
     * @throws RuntimeException If task repository or topic repository not injected
     */
    public function initTopicTask(DataIsolation $dataIsolation, TopicEntity $topicEntity, ChatInstruction $instruction, string $taskMode, string $prompt = '', string $attachments = ''): TaskEntity
    {
        // Get current user ID
        $userId = $dataIsolation->getCurrentUserId();
        $topicId = $topicEntity->getId();

        // If instruction is interrupt or follow-up
        // If there are other changes later, pass task_id from frontend
        if ($instruction == ChatInstruction::Interrupted) {
            $taskList = $this->taskRepository->getTasksByTopicId($topicId, 1, 1, ['task_status' => TaskStatus::RUNNING]);
            if (empty($taskList['list'])) {
                ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'task.not_found');
            }
            return $taskList['list'][0];
        }
        // If $taskMode is empty, use topic's task_mode
        if ($taskMode == '') {
            $taskMode = $topicEntity->getTaskMode();
        }
        // All other cases create a new task
        $taskEntity = new TaskEntity([
            'user_id' => $userId,
            'workspace_id' => $topicEntity->getWorkspaceId(),
            'topic_id' => $topicId,
            'task_id' => '', // Initially empty, this is agent's task id
            'task_mode' => $taskMode,
            'sandbox_id' => $topicEntity->getSandboxId(), // Current task prioritizes reusing previous topic's sandbox id
            'prompt' => $prompt,
            'attachments' => $attachments,
            'task_status' => TaskStatus::WAITING->value,
            'work_dir' => $topicEntity->getWorkDir() ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        // Create task
        $taskEntity = $this->taskRepository->createTask($taskEntity);

        // 4. Update topic's current task ID and status
        $topicEntity->setCurrentTaskId($taskEntity->getId());
        $topicEntity->setCurrentTaskStatus(TaskStatus::WAITING);
        $topicEntity->setUpdatedAt(date('Y-m-d H:i:s'));
        $topicEntity->setUpdatedUid($userId);
        $topicEntity->setTaskMode($taskMode);
        $this->topicRepository->updateTopic($topicEntity);

        return $taskEntity;
    }

    /**
     * Create task and update topic's current task ID and status.
     *
     * @param TaskEntity $taskEntity Task entity
     * @return TaskEntity Created task entity
     */
    public function createTask(TaskEntity $taskEntity): TaskEntity
    {
        // Create task
        $task = $this->taskRepository->createTask($taskEntity);

        // Update topic's current task ID and status
        $topic = $this->topicRepository->getTopicById($task->getTopicId());
        if ($topic) {
            $topic->setCurrentTaskId($task->getId());
            $topic->setCurrentTaskStatus(TaskStatus::WAITING);
            $this->topicRepository->updateTopic($topic);
        }

        return $task;
    }

    public function updateTaskStatus(DataIsolation $dataIsolation, int $topicId, TaskStatus $status, int $id, string $taskId, string $sandboxId, ?string $errMsg = null): bool
    {
        // 1. Get topic entity by topic id
        $topicEntity = $this->topicRepository->getTopicById($topicId);
        if (! $topicEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'topic.not_found');
        }

        // Get current user ID
        $userId = $dataIsolation->getCurrentUserId();

        // 2. Find task
        $taskEntity = $this->taskRepository->getTaskById($id);
        if (! $taskEntity) {
            ExceptionBuilder::throw(GenericErrorCode::IllegalOperation, 'task.not_found');
        }

        // Update task status
        $taskEntity->setTaskStatus($status->value);
        $taskEntity->setSandboxId($sandboxId);
        $taskEntity->setTaskId($taskId);
        $taskEntity->setUpdatedAt(date('Y-m-d H:i:s'));

        // If error message is provided and status is ERROR, set error message
        if ($status === TaskStatus::ERROR && $errMsg !== null) {
            if (mb_strlen($errMsg, 'UTF-8') > 500) {
                $errMsg = mb_substr($errMsg, 0, 497, 'UTF-8') . '...';
            }
            $taskEntity->setErrMsg($errMsg);
        }

        $this->taskRepository->updateTask($taskEntity);

        // 3. Update topic's related information
        $topicEntity->setSandboxId($sandboxId);
        $topicEntity->setCurrentTaskId($id);
        $topicEntity->setCurrentTaskStatus($status);
        $topicEntity->setUpdatedAt(date('Y-m-d H:i:s'));
        $topicEntity->setUpdatedUid($userId);

        // Save topic update
        return $this->topicRepository->updateTopic($topicEntity);
    }

    public function handleSandboxMessage(string $taskId, string $messageJson): TaskMessageEntity
    {
        $messageData = json_decode($messageJson, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Invalid message JSON');
        }

        return new TaskMessageEntity([
            'task_id' => $taskId,
            'type' => $messageData['type'] ?? MessageType::TaskUpdate->value,
            'content' => $messageData['content'] ?? '',
            'raw_data' => $messageJson,
            'status' => $messageData['status'] ?? null,
        ]);
    }

    /**
     * Delete task.
     *
     * @param int $taskId Task ID
     * @return bool Whether deletion was successful
     */
    public function deleteTask(int $taskId): bool
    {
        // Check if task exists
        $task = $this->taskRepository->getTaskById($taskId);
        if (! $task) {
            return false;
        }

        // Check if task is running
        if ($task->getStatus() === TaskStatus::RUNNING) {
            return false;
        }

        // Delete task
        return $this->taskRepository->deleteTask($taskId);
    }

    /**
     * Record task message.
     */
    public function recordTaskMessage(
        string $taskId,
        string $role,
        string $senderUid,
        string $receiverUid,
        string $messageType,
        string $content,
        ?string $status = null,
        ?array $steps = null,
        ?array $tool = null,
        ?int $topicId = null,
        ?string $event = null,
        ?array $attachments = null,
        bool $showInUi = true,
        ?string $messageId = null
    ): TaskMessageEntity {
        $messageData = [
            'task_id' => $taskId,
            'sender_type' => $role,
            'sender_uid' => $senderUid,
            'receiver_uid' => $receiverUid,
            'type' => $messageType,
            'content' => $content,
            'status' => $status,
            'steps' => $steps,
            'tool' => $tool,
            'attachments' => $attachments,
            'topic_id' => $topicId,
            'event' => $event,
            'show_in_ui' => $showInUi,
        ];

        // Add message_id if provided
        if ($messageId !== null) {
            $messageData['message_id'] = $messageId;
        }

        $message = new TaskMessageEntity($messageData);

        $this->messageRepository->save($message);
        return $message;
    }

    /**
     * Record user sent message.
     */
    public function recordUserMessage(
        string $taskId,
        string $userId,
        string $aiId,
        string $content,
        ?array $tool = null,
        ?int $topicId = null,
        ?string $event = null,
        ?array $attachments = null,
        bool $showInUi = true,
        ?string $messageId = null
    ): TaskMessageEntity {
        return $this->recordTaskMessage(
            $taskId,
            'user',
            $userId,
            $aiId,
            'chat',
            $content,
            null,
            null,
            $tool,
            $topicId,
            $event,
            $attachments,
            $showInUi,
            $messageId
        );
    }

    /**
     * Record AI replied message.
     */
    public function recordAiMessage(
        string $taskId,
        string $aiId,
        string $userId,
        string $messageType,
        string $content,
        ?string $status = null,
        ?array $steps = null,
        ?array $tool = null,
        ?int $topicId = null,
        ?string $event = null,
        ?array $attachments = null,
        bool $showInUi = true,
        ?string $messageId = null
    ): TaskMessageEntity {
        return $this->recordTaskMessage(
            $taskId,
            'assistant',
            $aiId,
            $userId,
            $messageType,
            $content,
            $status,
            $steps,
            $tool,
            $topicId,
            $event,
            $attachments,
            $showInUi,
            $messageId
        );
    }

    /**
     * Get task by task ID (task ID returned by sandbox service).
     *
     * @param string $taskId Task ID
     * @return null|TaskEntity Task entity or null
     */
    public function getTaskByTaskId(string $taskId): ?TaskEntity
    {
        return $this->taskRepository->getTaskByTaskId($taskId);
    }

    /**
     * Get task entity by id.
     */
    public function getTaskById(int $id): ?TaskEntity
    {
        return $this->taskRepository->getTaskById($id);
    }

    /**
     * Save task file.
     *
     * @param TaskFileEntity $entity Task file entity
     * @return TaskFileEntity Saved entity
     */
    public function saveTaskFile(TaskFileEntity $entity): TaskFileEntity
    {
        // Save task file through storage interface
        return $this->taskFileRepository->insert($entity);
    }

    public function getTaskFile(int $fileId): ?TaskFileEntity
    {
        return $this->taskFileRepository->getById($fileId);
    }

    /**
     * Update task file.
     */
    public function updateTaskFile(TaskFileEntity $taskFileEntity): TaskFileEntity
    {
        return $this->taskFileRepository->updateById($taskFileEntity);
    }

    /**
     * Get task file by file key and task ID.
     */
    public function getTaskFileByFileKey(string $fileKey, int $topicId): ?TaskFileEntity
    {
        return $this->taskFileRepository->getByFileKey($fileKey);
    }

    /**
     * insert or update task file entity by file key.
     */
    public function saveTaskFileByFileKey(
        DataIsolation $dataIsolation,
        string $fileKey,
        array $fileData,
        int $topicId,
        int $taskId,
        string $fileType = TaskFileType::PROCESS->value,
        bool $isUpdate = false
    ): TaskFileEntity {
        // First, check if the file already exists
        $taskFileEntity = $this->getTaskFileByFileKey($fileKey, $topicId);

        // If exists and no need to update, return directly
        if ($taskFileEntity && ! $isUpdate) {
            return $taskFileEntity;
        }

        // If exists, update and return
        if ($taskFileEntity) {
            // $taskFileEntity->setFileKey($fileKey);
            // $taskFileEntity->setOrganizationCode($dataIsolation->getCurrentOrganizationCode());
            // $taskFileEntity->setTopicId($topicId);
            // $taskFileEntity->setTaskId($taskId);
            // $taskFileEntity->setFileType($fileType);
            // $taskFileEntity->setFileName($fileData['display_filename'] ?? $fileData['filename'] ?? '');
            // $taskFileEntity->setFileExtension($fileData['file_extension'] ?? '');
            // $taskFileEntity->setFileSize($fileData['file_size'] ?? 0);
            // // Check and set whether it's a hidden file
            // $taskFileEntity->setIsHidden($this->isHiddenFile($fileKey));
            // // Update storage type if provided
            // if (isset($fileData['storage_type'])) {
            //     $taskFileEntity->setStorageType($fileData['storage_type']);
            // }

            // return $this->taskFileRepository->updateById($taskFileEntity);
            return $taskFileEntity;
        }

        // If not exists, create new entity
        $taskFileEntity = new TaskFileEntity();
        $fileId = ! empty($fileData['file_id']) ? (int) $fileData['file_id'] : IdGenerator::getSnowId();
        $taskFileEntity->setFileId($fileId);
        $taskFileEntity->setFileKey($fileKey);

        // Process user ID: Priority use user ID from DataIsolation, if null use from task
        $userId = $dataIsolation->getCurrentUserId();
        if (empty($userId)) {
            // Get task entity by task ID, get user ID
            $taskEntity = $this->taskRepository->getTaskById($taskId);
            if ($taskEntity) {
                $userId = $taskEntity->getUserId();
            }
        }
        $taskFileEntity->setUserId($userId ?? 'system');
        $taskFileEntity->setOrganizationCode($dataIsolation->getCurrentOrganizationCode());
        $taskFileEntity->setTopicId($topicId);
        $taskFileEntity->setTaskId($taskId);
        $taskFileEntity->setFileType($fileType);
        $taskFileEntity->setFileName($fileData['display_filename'] ?? $fileData['filename'] ?? '');
        $taskFileEntity->setFileExtension($fileData['file_extension'] ?? '');
        $taskFileEntity->setFileSize($fileData['file_size'] ?? 0);
        // Check and set whether it's a hidden file
        $taskFileEntity->setIsHidden($this->isHiddenFile($fileKey));
        // Set storage type, default to workspace
        $taskFileEntity->setStorageType($fileData['storage_type'] ?? 'workspace');

        // Use insertOrIgnore method, if there's already a record with the same file_key and topic_id, return the existing entity
        $result = $this->taskFileRepository->insertOrIgnore($taskFileEntity);
        return $result ?: $taskFileEntity;
    }

    /**
     * Get message list by topic ID.
     *
     * @param int $topicId Topic ID
     * @param int $page Page number
     * @param int $pageSize Page size
     * @param bool $shouldPage Whether to page
     * @param string $sortDirection Sort direction, supports asc and desc
     * @param bool $showInUi Whether to display only UI visible messages, default true
     * @return array Return message list and total
     */
    public function getMessagesByTopicId(int $topicId, int $page = 1, int $pageSize = 20, bool $shouldPage = true, string $sortDirection = 'asc', bool $showInUi = true): array
    {
        return $this->messageRepository->findByTopicId($topicId, $page, $pageSize, $shouldPage, $sortDirection, $showInUi);
    }

    /**
     * Get topic attachment list.
     *
     * @param int $topicId Topic ID
     * @param DataIsolation $dataIsolation Data isolation object
     * @param int $page Page number
     * @param int $pageSize Page size
     * @param array $fileType File type filter
     * @param string $storageType Storage type
     * @return array Attachment list and total
     */
    public function getTaskAttachmentsByTopicId(int $topicId, DataIsolation $dataIsolation, int $page = 1, int $pageSize = 20, array $fileType = [], string $storageType = 'workspace'): array
    {
        // Call TaskFileRepository to get file list
        return $this->taskFileRepository->getByTopicId($topicId, $page, $pageSize, $fileType, $storageType);
        // Directly return entity object list, let application layer handle URL acquisition
    }

    public function getTaskBySandboxId(string $sandboxId): ?TaskEntity
    {
        return $this->taskRepository->getTaskBySandboxId($sandboxId);
    }

    public function getTasksCountByUserId(string $userId): array
    {
        $data = $this->taskRepository->getTasksByUserId($userId);
        if (empty($data)) {
            return [];
        }
        // Output format is topicId => ['total' => 0, 'last_task_start_time' => '', 'last_task_update_time' => '']
        $result = [];
        foreach ($data as $item) {
            /**
             * @var TaskEntity $item
             */
            if (! isset($result[$item->getTopicId()])) {
                $result[$item->getTopicId()] = [];
                $result[$item->getTopicId()]['task_rounds'] = 0;
                $result[$item->getTopicId()]['last_task_start_time'] = '';
            }
            $result[$item->getTopicId()]['task_rounds'] = $result[$item->getTopicId()]['task_rounds'] + 1;
            // Convert time string to timestamp for comparison
            $currentTime = strtotime($item->getCreatedAt());
            $lastTime = strtotime($result[$item->getTopicId()]['last_task_start_time']);
            if ($currentTime > $lastTime) {
                $result[$item->getTopicId()]['last_task_start_time'] = $item->getCreatedAt();
            }
        }

        // Get the latest message time and content in the current task message of the topic, and output it
        foreach ($result as $topicId => $item) {
            $result[$topicId]['last_message_send_timestamp'] = '';
            $result[$topicId]['last_message_content'] = '';
            // Because of performance issues, it's temporarily commented out, will optimize later
            //            $messages = $this->messageRepository->findByTopicId($topicId, 1, 1, true, 'desc');
            //            if (! empty($messages['list'])) {
            //                /**
            //                 * @var TaskMessageEntity $lastMessage
            //                 */
            //                $lastMessage = $messages['list'][0];
            //                $result[$topicId]['last_message_send_timestamp'] = $lastMessage->getSendTimestamp();
            //                $result[$topicId]['last_message_content'] = $lastMessage->getContent();
            //            } else {
            //                $result[$topicId]['last_message_send_timestamp'] = '';
            //                $result[$topicId]['last_message_content'] = '';
            //            }
        }

        return $result;
    }

    public function handleInterruptInstruction(DataIsolation $dataIsolation, TaskEntity $taskEntity): bool
    {
        // Check if sandbox ID is empty
        if (empty($taskEntity->getSandboxId())) {
            return false;
        }

        // Check if container exists through sandbox ID
        // Check if sandbox exists
        $result = $this->sandboxService->checkSandboxExists($taskEntity->getSandboxId());
        // If sandbox exists and status is running, return directly
        if ($result->getCode() === SandboxResult::Normal
            && $result->getSandboxData()->getStatus() === 'running') {
            // Sandbox status is running, need to connect to sandbox, process
            $config = new WebSocketConfig();
            $sandboxId = $taskEntity->getSandboxId();
            $wsUrl = $this->sandboxService->getWebsocketUrl($sandboxId);

            // Print connection parameters
            $this->logger->info(sprintf(
                'WebSocket connection parameters, URL: %s, Maximum connection time: %d seconds',
                $wsUrl,
                $config->getConnectTimeout()
            ));

            // Create WebSocket session
            $session = new WebSocketSession(
                $config,
                $this->logger,
                $wsUrl,
                $taskEntity->getTaskId()
            );

            // Establish connection
            $session->connect();
            $message = (new MessageBuilderDomainService())->buildInterruptMessage($taskEntity->getUserId(), $taskEntity->getId());
            $session->send($message);
            // Wait for response
            $message = $session->receive(60);
            if ($message === null) {
                throw new RuntimeException('Waiting for agent response timeout');
            }
        }

        return true;
    }

    /**
     * Update tasks that have been running for a long time to error status.
     *
     * @param string $timeThreshold Time threshold, tasks running before this time will be marked as error
     * @return int Updated task count
     */
    public function updateStaleRunningTasks(string $timeThreshold): int
    {
        return $this->taskRepository->updateStaleRunningTasks($timeThreshold);
    }

    /**
     * Get task list by specified status.
     *
     * @param TaskStatus $status Task status
     * @return array<TaskEntity> Task entity list
     */
    public function getTasksByStatus(TaskStatus $status): array
    {
        return $this->taskRepository->getTasksByStatus($status);
    }

    /**
     * Lightweight update task status method, only modify task status.
     *
     * @param int $id Task ID
     * @param TaskStatus $status Task status
     * @param null|string $errMsg Error message, only meaningful when status is ERROR
     * @return bool Whether update was successful
     */
    public function updateTaskStatusByTaskId(int $id, TaskStatus $status, ?string $errMsg = null): bool
    {
        if ($status === TaskStatus::ERROR && $errMsg !== null) {
            return $this->taskRepository->updateTaskStatusAndErrMsgByTaskId($id, $status, $errMsg);
        }
        return $this->taskRepository->updateTaskStatusByTaskId($id, $status);
    }

    /**
     * Get task list whose update time exceeds specified time.
     *
     * @param string $timeThreshold Time threshold, if task update time is earlier than this time, it will be included in the result
     * @param int $limit Maximum number of results returned
     * @return array<TaskEntity> Task entity list
     */
    public function getTasksExceedingUpdateTime(string $timeThreshold, int $limit = 100): array
    {
        return $this->taskRepository->getTasksExceedingUpdateTime($timeThreshold, $limit);
    }

    public function getTaskNumByTopicId(int $topicId): int
    {
        return $this->taskRepository->getTaskCountByTopicId($topicId);
    }

    public function getUserFirstMessageByTopicId(int $topicId, string $userId): ?TaskMessageEntity
    {
        return $this->messageRepository->getUserFirstMessageByTopicId($topicId, $userId);
    }

    public function updateTaskStatusBySandboxIds(array $sandboxIds, TaskStatus $taskStatus, ?string $errMsg = null): int
    {
        return $this->taskRepository->updateTaskStatusBySandboxIds($sandboxIds, $taskStatus->value, $errMsg);
    }

    /**
     * Check if file is hidden file.
     *
     * @param string $fileKey File path
     * @return bool Whether it's a hidden file: true-yes, false-no
     */
    private function isHiddenFile(string $fileKey): bool
    {
        // Remove leading slash, uniform processing
        $fileKey = ltrim($fileKey, '/');

        // Split path into parts
        $pathParts = explode('/', $fileKey);

        // Check if each path part starts with .
        foreach ($pathParts as $part) {
            if (! empty($part) && str_starts_with($part, '.')) {
                return true; // It's a hidden file
            }
        }

        return false; // It's not a hidden file
    }
}
