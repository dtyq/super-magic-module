<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\KnowledgeBase\Entity\ValueObject;

use App\Domain\KnowledgeBase\Entity\ValueObject\Enum\ParentModeEnum;
use App\Domain\KnowledgeBase\Entity\ValueObject\Enum\TextPreprocessRuleEnum;
use App\Infrastructure\Core\AbstractDTO;

class ParentChildConfigVO extends AbstractDTO
{
    protected string $separator;

    protected string $chunkSize;

    protected ParentModeEnum $parentMode;

    protected SegmentRuleVO $childSegmentRule;

    protected SegmentRuleVO $parentSegmentRule;

    /** @var TextPreprocessRuleEnum[] */
    protected array $textPreprocessRule;

    public function getSeparator(): string
    {
        return $this->separator;
    }

    public function setSeparator(string $separator): self
    {
        $this->separator = $separator;
        return $this;
    }

    public function getChunkSize(): string
    {
        return $this->chunkSize;
    }

    public function setChunkSize(string $chunkSize): self
    {
        $this->chunkSize = $chunkSize;
        return $this;
    }

    public function getParentMode(): ParentModeEnum
    {
        return $this->parentMode;
    }

    public function setParentMode(ParentModeEnum $parentMode): self
    {
        $this->parentMode = $parentMode;
        return $this;
    }

    public function getChildSegmentRule(): SegmentRuleVO
    {
        return $this->childSegmentRule;
    }

    public function setChildSegmentRule(SegmentRuleVO $childSegmentRule): self
    {
        $this->childSegmentRule = $childSegmentRule;
        return $this;
    }

    public function getParentSegmentRule(): SegmentRuleVO
    {
        return $this->parentSegmentRule;
    }

    public function setParentSegmentRule(SegmentRuleVO $parentSegmentRule): self
    {
        $this->parentSegmentRule = $parentSegmentRule;
        return $this;
    }

    /**
     * @return TextPreprocessRuleEnum[]
     */
    public function getTextPreprocessRule(): array
    {
        return $this->textPreprocessRule;
    }

    /**
     * @param TextPreprocessRuleEnum[] $textPreprocessRule
     */
    public function setTextPreprocessRule(array $textPreprocessRule): self
    {
        $this->textPreprocessRule = $textPreprocessRule;
        return $this;
    }

    public static function fromArray(array $data): self
    {
        $config = new self();
        $config->setSeparator($data['separator']);
        $config->setChunkSize($data['chunk_size']);
        $config->setParentMode(ParentModeEnum::from($data['parent_mode']));
        $config->setChildSegmentRule(SegmentRuleVO::fromArray($data['child_segment_rule']));
        $config->setParentSegmentRule(SegmentRuleVO::fromArray($data['parent_segment_rule']));
        $config->setTextPreprocessRule(TextPreprocessRuleEnum::fromArray($data['text_preprocess_rule']));
        return $config;
    }
}
