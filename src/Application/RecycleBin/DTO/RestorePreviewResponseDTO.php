<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

class RestorePreviewResponseDTO
{
    /** @var RestorePreviewItemDTO[] */
    private array $itemsWithConflict = [];

    /** @var RestorePreviewItemDTO[] */
    private array $itemsNoConflict = [];

    public function __construct(array $itemsWithConflict, array $itemsNoConflict)
    {
        $this->itemsWithConflict = $itemsWithConflict;
        $this->itemsNoConflict   = $itemsNoConflict;
    }

    public function toArray(): array
    {
        return [
            'items_with_conflict' => array_map(
                fn (RestorePreviewItemDTO $item) => $item->toArray(),
                $this->itemsWithConflict
            ),
            'items_no_conflict' => array_map(
                fn (RestorePreviewItemDTO $item) => $item->toArray(),
                $this->itemsNoConflict
            ),
        ];
    }
}
