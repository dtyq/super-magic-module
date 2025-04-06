<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\KnowledgeBase\DTO\Request;

use App\Infrastructure\Core\AbstractRequestDTO;

class UpdateDocumentRequestDTO extends AbstractRequestDTO
{
    public string $knowledgeBaseCode;

    public string $code;

    public string $name;

    public array $docMetadata = [];

    public bool $enabled = true;

    public array $fragmentConfig = [];

    public array $embeddingConfig = [];

    public array $vectorDbConfig = [];

    public array $retrieveConfig = [];

    public static function getHyperfValidationRules(): array
    {
        return [
            'code' => 'required|string|max:64',
            'name' => 'required|string|max:255',
            'doc_metadata' => 'array',
            'enabled' => 'boolean',
            'fragment_config' => 'array',
            'embedding_config' => 'array',
            'vector_db_config' => 'array',
            'retrieve_config' => 'array',
        ];
    }

    public static function getHyperfValidationMessage(): array
    {
        return [
            'code.required' => '文档编码不能为空',
            'code.max' => '文档编码长度不能超过64个字符',
            'name.required' => '文档名称不能为空',
            'name.max' => '文档名称长度不能超过255个字符',
            'doc_type.min' => '文档类型必须大于等于0',
            'enabled.boolean' => '启用状态必须为布尔值',
        ];
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;
        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
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

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function setEnabled(bool $enabled): self
    {
        $this->enabled = $enabled;
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

    public function getKnowledgeBaseCode(): string
    {
        return $this->knowledgeBaseCode;
    }

    public function setKnowledgeBaseCode(string $knowledgeBaseCode): UpdateDocumentRequestDTO
    {
        $this->knowledgeBaseCode = $knowledgeBaseCode;
        return $this;
    }
}
