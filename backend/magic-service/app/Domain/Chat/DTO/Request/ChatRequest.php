<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Request;

use App\Domain\Chat\DTO\Request\Common\ChatRequestData;
use App\Domain\Chat\DTO\Request\Common\MagicContext;

class ChatRequest extends AbstractRequest
{
    protected MagicContext $context;

    protected ChatRequestData $data;

    public function __construct(array $data)
    {
        if ($data['context'] instanceof MagicContext) {
            $this->context = $data['context'];
        } else {
            $this->context = new MagicContext($data['context']);
        }
        if ($data['data'] instanceof ChatRequestData) {
            $this->data = $data['data'];
        } else {
            $this->data = new ChatRequestData($data['data']);
        }
    }

    public function getContext(): MagicContext
    {
        return $this->context;
    }

    public function setContext(MagicContext $context): void
    {
        $this->context = $context;
    }

    public function getData(): ChatRequestData
    {
        return $this->data;
    }

    public function setData(ChatRequestData $data): void
    {
        $this->data = $data;
    }
}
