<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject;

use App\Infrastructure\Core\AbstractValueObject;

class DefaultFormat extends AbstractValueObject
{
    protected array $formats = [];

    protected array $codecs = [];

    protected array $sampleRates = [];

    protected array $bitRates = [];

    protected array $channels = [];

    public function getFormats(): array
    {
        return $this->formats;
    }

    public function setFormats(array $formats): void
    {
        $this->formats = $formats;
    }

    public function getCodecs(): array
    {
        return $this->codecs;
    }

    public function setCodecs(array $codecs): void
    {
        $this->codecs = $codecs;
    }

    public function getSampleRates(): array
    {
        return $this->sampleRates;
    }

    public function setSampleRates(array $sampleRates): void
    {
        $this->sampleRates = $sampleRates;
    }

    public function getBitRates(): array
    {
        return $this->bitRates;
    }

    public function setBitRates(array $bitRates): void
    {
        $this->bitRates = $bitRates;
    }

    public function getChannels(): array
    {
        return $this->channels;
    }

    public function setChannels(array $channels): void
    {
        $this->channels = $channels;
    }
}
