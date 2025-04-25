<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Provider\Service;

use App\Domain\Provider\Entity\ProviderEntity;
use App\Domain\Provider\Entity\ValueObject\ProviderDataIsolation;
use App\Domain\Provider\Entity\ValueObject\Query\ProviderQuery;
use App\Domain\Provider\Repository\Facade\ProviderRepositoryInterface;
use App\Infrastructure\Core\ValueObject\Page;

readonly class ProviderService
{
    public function __construct(
        private ProviderRepositoryInterface $providerRepository
    ) {
    }

    public function getById(ProviderDataIsolation $dataIsolation, int $id): ?ProviderEntity
    {
        return $this->providerRepository->getById($dataIsolation, $id);
    }

    public function getByCode(ProviderDataIsolation $dataIsolation, string $providerCode): ?ProviderEntity
    {
        return $this->providerRepository->getByCode($dataIsolation, $providerCode);
    }

    /**
     * @return array{total: int, list: array<ProviderEntity>}
     */
    public function queries(ProviderDataIsolation $dataIsolation, ProviderQuery $query, Page $page): array
    {
        return $this->providerRepository->queries($dataIsolation, $query, $page);
    }
}
