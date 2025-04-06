<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO\Request;

use App\Infrastructure\Core\AbstractRequestDTO;
use App\Interfaces\KnowledgeBase\DTO\DocumentFileDTO;

class CreateDocumentRequestDTO extends AbstractRequestDTO
{
    public string $knowledgeBaseCode;

    public bool $enabled;

    public array $docMetadata = [];

    public array $fragmentConfig = [];

    public array $embeddingConfig = [];

    public array $vectorDbConfig = [];

    public array $retrieveConfig = [];

    public DocumentFileDTO $documentFile;

    public static function getHyperfValidationRules(): array
    {
        return [
            'knowledge_base_code' => 'required|string|max:64',
            'enabled' => 'required|boolean',
            'doc_metadata' => 'array',
            'fragment_config' => 'array',
            'embedding_config' => 'array',
            'vector_db_config' => 'array',
            'retrieve_config' => 'array',
            'document_file' => 'required|array',
            'document_file.name' => 'required|string|max:255',
            'document_file.key' => 'required|string|max:255',
        ];
    }

    public static function getHyperfValidationMessage(): array
    {
        return [
            'knowledge_base_code.required' => '知识库编码不能为空',
            'knowledge_base_code.max' => '知识库编码长度不能超过64个字符',
            'name.required' => '文档名称不能为空',
            'name.max' => '文档名称长度不能超过255个字符',
            'doc_type.required' => '文档类型不能为空',
            'doc_type.integer' => '文档类型必须为整数',
            'doc_type.min' => '文档类型必须大于等于0',
        ];
    }

    public function getKnowledgeBaseCode(): string
    {
        return $this->knowledgeBaseCode;
    }

    public function setKnowledgeBaseCode(string $knowledgeBaseCode): self
    {
        $this->knowledgeBaseCode = $knowledgeBaseCode;
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

    public function getDocMetadata(): array
    {
        return $this->docMetadata;
    }

    public function setDocMetadata(array $docMetadata): self
    {
        $this->docMetadata = $docMetadata;
        return $this;
    }

    public function getFragmentConfig(): array
    {
        return $this->fragmentConfig;
    }

    public function setFragmentConfig(array $fragmentConfig): self
    {
        $this->fragmentConfig = $fragmentConfig;
        return $this;
    }

    public function getEmbeddingConfig(): array
    {
        return $this->embeddingConfig;
    }

    public function setEmbeddingConfig(array $embeddingConfig): self
    {
        $this->embeddingConfig = $embeddingConfig;
        return $this;
    }

    public function getVectorDbConfig(): array
    {
        return $this->vectorDbConfig;
    }

    public function setVectorDbConfig(array $vectorDbConfig): self
    {
        $this->vectorDbConfig = $vectorDbConfig;
        return $this;
    }

    public function getRetrieveConfig(): array
    {
        return $this->retrieveConfig;
    }

    public function setRetrieveConfig(array $retrieveConfig): self
    {
        $this->retrieveConfig = $retrieveConfig;
        return $this;
    }

    public function getDocumentFile(): ?DocumentFileDTO
    {
        return $this->documentFile;
    }

    public function setDocumentFile(array|DocumentFileDTO $documentFile): void
    {
        is_array($documentFile) && $documentFile = new DocumentFileDTO($documentFile);
        $this->documentFile = $documentFile;
    }
}
