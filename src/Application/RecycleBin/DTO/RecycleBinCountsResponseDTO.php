<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use Dtyq\SuperMagic\Domain\RecycleBin\Enum\RecycleBinResourceType;

class RecycleBinCountsResponseDTO
{
    /**
     * @param array<int, int> $countsByType
     */
    public function __construct(
        private readonly array $countsByType
    ) {
    }

    public function toArray(): array
    {
        $counts = [];

        foreach (RecycleBinResourceType::cases() as $type) {
            $count = (int) ($this->countsByType[$type->value] ?? 0);

            $counts[] = [
                'resource_type' => $type->value,
                'resource_type_name' => $type->getName(),
                'resource_type_label' => $type->getLabel(),
                'count' => $count,
            ];
        }

        return $counts;
    }
}
