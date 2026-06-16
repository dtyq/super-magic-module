<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RestoreConflictType;

class RestoreConflictDTO
{
    public function __construct(
        public readonly RestoreConflictType $type,
        /** For parent_missing: the original parent file_id (may no longer exist) */
        public readonly ?int $originalParentId = null,
        /** For name_conflict: the file_id of the conflicting entry at the target location */
        public readonly ?int $existingFileId = null,
        /** For name_conflict: whether the conflicting entry is a directory */
        public readonly ?bool $existingIsDirectory = null,
    ) {
    }

    public function toArray(): array
    {
        $data = ['type' => $this->type->value];

        if ($this->type === RestoreConflictType::ParentMissing) {
            $data['original_parent_id'] = $this->originalParentId !== null
                ? (string) $this->originalParentId
                : null;
        }

        if ($this->type === RestoreConflictType::NameConflict) {
            $data['existing_file_id'] = $this->existingFileId !== null
                ? (string) $this->existingFileId
                : null;
            $data['existing_is_directory'] = $this->existingIsDirectory;
        }

        return $data;
    }
}
