<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\ErrorCode;

use App\Infrastructure\Core\Exception\Annotation\ErrorMessage;

/**
 * 错误码范围:51000-51299 (300个可用码)
 * 分配方案：
 * - Workspace: 51000-51049 (50个)
 * - Topic: 51050-51099 (50个)
 * - Task: 51100-51149 (50个)
 * - File: 51150-51199 (50个)
 * - Reserved1: 51200-51249 (50个)
 * - Reserved2: 51250-51299 (50个)
 */
enum SuperAgentErrorCode: int
{
    // Workspace related error codes (51000-51049)
    #[ErrorMessage('workspace.parameter_check_failure')]
    case VALIDATE_FAILED = 51000;

    #[ErrorMessage('workspace.access_denied')]
    case WORKSPACE_ACCESS_DENIED = 51001;

    // Topic related error codes (51050-51099)
    #[ErrorMessage('topic.topic_not_found')]
    case TOPIC_NOT_FOUND = 51050;

    #[ErrorMessage('topic.create_topic_failed')]
    case CREATE_TOPIC_FAILED = 51051;

    // Task related error codes (51100-51149)
    #[ErrorMessage('task.not_found')]
    case TASK_NOT_FOUND = 51100;

    #[ErrorMessage('task.work_dir_not_found')]
    case WORK_DIR_NOT_FOUND = 51101;

    // File related error codes (51150-51199)
    #[ErrorMessage('task.create_workspace_version_failed')]
    case CREATE_WORKSPACE_VERSION_FAILED = 51202;

    #[ErrorMessage('topic.concurrent_operation_failed')]
    case TOPIC_LOCK_FAILED = 51203;

    // File save related error codes
    #[ErrorMessage('file.permission_denied')]
    case FILE_PERMISSION_DENIED = 51150;

    #[ErrorMessage('file.content_too_large')]
    case FILE_CONTENT_TOO_LARGE = 51151;

    #[ErrorMessage('file.concurrent_modification')]
    case FILE_CONCURRENT_MODIFICATION = 51152;

    #[ErrorMessage('file.save_rate_limit')]
    case FILE_SAVE_RATE_LIMIT = 51153;

    #[ErrorMessage('file.upload_failed')]
    case FILE_UPLOAD_FAILED = 51154;

    #[ErrorMessage('file.batch_file_ids_required')]
    case BATCH_FILE_IDS_REQUIRED = 51155;

    #[ErrorMessage('file.batch_file_ids_invalid')]
    case BATCH_FILE_IDS_INVALID = 51156;

    #[ErrorMessage('file.batch_too_many_files')]
    case BATCH_TOO_MANY_FILES = 51157;

    #[ErrorMessage('file.batch_no_valid_files')]
    case BATCH_NO_VALID_FILES = 51158;

    #[ErrorMessage('file.batch_access_denied')]
    case BATCH_ACCESS_DENIED = 51159;

    #[ErrorMessage('file.batch_publish_failed')]
    case BATCH_PUBLISH_FAILED = 51160;

    #[ErrorMessage('file.batch_topic_id_invalid')]
    case BATCH_TOPIC_ID_INVALID = 51161;

    #[ErrorMessage('file.batch_file_ids_or_topic_id_required')]
    case BATCH_FILE_IDS_OR_TOPIC_ID_REQUIRED = 51162;
}
