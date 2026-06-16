<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Application\RecycleBin\DTO;

use Hyperf\HttpServer\Contract\RequestInterface;

class RecycleBinCountsRequestDTO
{
    private ?string $keyword = null;

    public function __construct(array $data)
    {
        if (isset($data['keyword']) && ! empty($data['keyword'])) {
            $this->keyword = trim((string) $data['keyword']);
        }
    }

    public static function fromRequest(RequestInterface $request): self
    {
        return new self($request->all());
    }

    public function getKeyword(): ?string
    {
        return $this->keyword;
    }
}
