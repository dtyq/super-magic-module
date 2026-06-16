<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;
use Hyperf\HttpServer\Contract\RequestInterface;
use InvalidArgumentException;
use ValueError;

use function Hyperf\Translation\trans;

/**
 * Restore resource request DTO.
 *
 * Uses resource_ids (resource IDs) rather than recycle bin record IDs:
 * - Clearer semantics: the restore target is the resource itself
 * - Each resource has exactly one recycle bin record (deleted on restore)
 * - Frontend-friendly: users work with resource lists
 */
class RestoreRequestDTO
{
    private array $resourceIds = [];

    private RecycleBinResourceType $resourceType;

    /**
     * Per-resource conflict resolution map.
     * Shape: [ 'resource_id' => [ 'parent_missing' => 'restore_to_root', 'name_conflict' => 'overwrite' ] ].
     *
     * @var array<int|string, array<string, string>>
     */
    private array $conflictResolutions = [];

    public function __construct(array $data)
    {
        if (! isset($data['resource_ids']) || ! is_array($data['resource_ids'])) {
            throw new InvalidArgumentException(trans('recycle_bin.validation.resource_ids_must_be_array'));
        }

        if (! isset($data['resource_type'])) {
            throw new InvalidArgumentException(trans('recycle_bin.validation.resource_type_required'));
        }

        $this->resourceIds = array_map(fn ($id) => (string) $id, $data['resource_ids']);

        if (empty($this->resourceIds)) {
            throw new InvalidArgumentException(trans('recycle_bin.validation.resource_ids_empty'));
        }

        try {
            $this->resourceType = RecycleBinResourceType::from((int) $data['resource_type']);
        } catch (ValueError $e) {
            throw new InvalidArgumentException(trans('recycle_bin.validation.resource_type_invalid'));
        }

        if (isset($data['conflict_resolutions']) && is_array($data['conflict_resolutions'])) {
            $this->conflictResolutions = $data['conflict_resolutions'];
        }
    }

    public static function fromRequest(RequestInterface $request): self
    {
        return new self($request->all());
    }

    public function getResourceIds(): array
    {
        return $this->resourceIds;
    }

    public function getResourceType(): RecycleBinResourceType
    {
        return $this->resourceType;
    }

    /**
     * Returns the conflict resolution map.
     * Shape: [ 'resource_id' => [ 'parent_missing' => 'restore_to_root', 'name_conflict' => 'overwrite' ] ].
     *
     * @return array<int|string, array<string, string>>
     */
    public function getConflictResolutions(): array
    {
        return $this->conflictResolutions;
    }

    public function toArray(): array
    {
        return [
            'resource_ids' => $this->resourceIds,
            'resource_type' => $this->resourceType->value,
            'conflict_resolutions' => $this->conflictResolutions,
        ];
    }
}
