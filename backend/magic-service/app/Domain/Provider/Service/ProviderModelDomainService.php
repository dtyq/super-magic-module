<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Service;

use App\Domain\Provider\Entity\ProviderModelEntity;
use App\Domain\Provider\Entity\ValueObject\ProviderDataIsolation;
use App\Domain\Provider\Entity\ValueObject\Query\ProviderModelQuery;
use App\Domain\Provider\Repository\Facade\ProviderModelRepositoryInterface;
use App\Infrastructure\Core\ValueObject\Page;

readonly class ProviderModelDomainService
{
    public function __construct(
        private ProviderModelRepositoryInterface $providerModelRepository
    ) {
    }

    public function getById(ProviderDataIsolation $dataIsolation, int $id): ?ProviderModelEntity
    {
        return $this->providerModelRepository->getById($dataIsolation, $id);
    }

    /**
     * @return array{total: int, list: array<ProviderModelEntity>}
     */
    public function queries(ProviderDataIsolation $dataIsolation, ProviderModelQuery $query, Page $page): array
    {
        return $this->providerModelRepository->queries($dataIsolation, $query, $page);
    }
}
