<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\DTO\Response;

use App\Domain\Chat\DTO\Response\Common\ClientSequence;
use App\Domain\Chat\Entity\AbstractEntity;

class ClientSequenceResponse extends AbstractEntity
{
    protected string $type;

    protected ClientSequence $seq;

    public function __construct(array $data)
    {
        $this->type = $data['type'];
        if ($data['seq'] instanceof ClientSequence) {
            $this->seq = $data['seq'];
        } else {
            $this->seq = new ClientSequence($data['seq']);
        }
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'seq' => $this->seq->toArray(),
        ];
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): void
    {
        $this->type = $type;
    }

    public function getSeq(): ClientSequence
    {
        return $this->seq;
    }

    public function setSeq(ClientSequence $seq): void
    {
        $this->seq = $seq;
    }
}
