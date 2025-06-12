<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Request;

use App\Infrastructure\Core\Exception\ExceptionBuilder;
use Dtyq\SuperMagic\ErrorCode\SuperAgentErrorCode;

class CreateBatchDownloadRequestDTO
{
    /**
     * @var array File ID array
     */
    private array $fileIds = [];

    /**
     * Get file ID array.
     */
    public function getFileIds(): array
    {
        return $this->fileIds;
    }

    /**
     * Set file ID array.
     */
    public function setFileIds(array $fileIds): self
    {
        $this->fileIds = $fileIds;
        return $this;
    }

    /**
     * Create DTO from request data.
     *
     * @param array $requestData Request data
     */
    public static function fromRequest(array $requestData): self
    {
        $dto = new self();
        $fileIds = $requestData['file_ids'] ?? [];

        // Validation
        if (empty($fileIds) || ! is_array($fileIds)) {
            ExceptionBuilder::throw(SuperAgentErrorCode::BATCH_FILE_IDS_REQUIRED);
        }

        if (count($fileIds) > 50) {
            ExceptionBuilder::throw(SuperAgentErrorCode::BATCH_TOO_MANY_FILES);
        }

        foreach ($fileIds as $fileId) {
            if (empty($fileId) || ! is_string($fileId)) {
                ExceptionBuilder::throw(SuperAgentErrorCode::BATCH_FILE_IDS_INVALID);
            }
        }

        $dto->setFileIds($fileIds);
        return $dto;
    }
}
