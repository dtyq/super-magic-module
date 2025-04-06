<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Request;

use App\Domain\Chat\DTO\Request\Common\ControlRequestData;
use App\Domain\Chat\DTO\Request\Common\MagicContext;

class ControlRequest extends AbstractRequest
{
    protected MagicContext $context;

    protected ControlRequestData $data;

    public function __construct(array $data)
    {
        $this->context = new MagicContext($data['context']);
        $this->data = new ControlRequestData($data['data']);
    }

    public function getContext(): MagicContext
    {
        return $this->context;
    }

    public function setContext(MagicContext $context): void
    {
        $this->context = $context;
    }

    public function getData(): ControlRequestData
    {
        return $this->data;
    }

    public function setData(ControlRequestData $data): void
    {
        $this->data = $data;
    }
}
