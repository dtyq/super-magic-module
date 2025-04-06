<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO\Request;

use App\Domain\KnowledgeBase\Entity\ValueObject\RetrieveConfig;
use App\Infrastructure\Core\AbstractRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;

class CreateKnowledgeBaseRequestDTO extends AbstractRequestDTO
{
    public string $name;

    public string $description;

    public string $icon;

    public bool $enabled;

    public ?array $fragmentConfig = null;

    public ?array $embeddingConfig = null;

    public ?array $retrieveConfig = null;

    /** @var array<DocumentFileDTO> */
    public array $documentFiles = [];

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function setEnabled(bool $enabled): self
    {
        $this->enabled = $enabled;
        return $this;
    }

    public function getFragmentConfig(): ?array
    {
        return $this->fragmentConfig;
    }

    public function setFragmentConfig(?array $fragmentConfig): self
    {
        $this->fragmentConfig = $fragmentConfig;
        return $this;
    }

    public function getEmbeddingConfig(): ?array
    {
        return $this->embeddingConfig;
    }

    public function setEmbeddingConfig(?array $embeddingConfig): self
    {
        $this->embeddingConfig = $embeddingConfig;
        return $this;
    }

    public function getRetrieveConfig(): ?array
    {
        return $this->retrieveConfig ?? RetrieveConfig::createDefault()->toArray();
    }

    public function setRetrieveConfig(?array $retrieveConfig): self
    {
        $this->retrieveConfig = $retrieveConfig;
        return $this;
    }

    public function getIcon(): string
    {
        return $this->icon;
    }

    public function setIcon(string $icon): CreateKnowledgeBaseRequestDTO
    {
        $this->icon = $icon;
        return $this;
    }

    public function getDocumentFiles(): array
    {
        return $this->documentFiles;
    }

    public function setDocumentFiles(array $documentFiles): void
    {
        $this->documentFiles = array_map(fn ($file) => new DocumentFileDTO($file), $documentFiles);
    }

    protected static function getHyperfValidationRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'string|max:255',
            'icon' => 'string|max:255',
            'enabled' => 'required|boolean',
            'fragment_config' => 'array',
            'embedding_config' => 'array',
            'retrieve_config' => 'array',
            'document_files' => 'required|array',
            'document_files.*.name' => 'required|string',
            'document_files.*.key' => 'required|string',
        ];
    }

    protected static function getHyperfValidationMessage(): array
    {
        return [];
    }
}
