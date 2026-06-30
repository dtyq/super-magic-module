<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Interfaces\Agent\DTO\Request;

use App\Infrastructure\Core\AbstractRequestDTO;

use function Hyperf\Translation\__;

class GetMyAvailableAgentsRequestDTO extends AbstractRequestDTO
{
    public int $page = 1;

    public int $pageSize = 20;

    /**
     * @var array<int, string>
     */
    public array $keywords = [];

    public static function getHyperfValidationRules(): array
    {
        return [
            'page' => 'nullable|integer|min:1',
            'page_size' => 'nullable|integer|min:1|max:100',
            'keywords' => 'nullable|array',
            'keywords.*' => 'string|max:255',
        ];
    }

    public static function getHyperfValidationMessage(): array
    {
        return [
            'page.integer' => __('super_magic.agent.page_must_be_integer'),
            'page.min' => __('super_magic.agent.page_must_be_greater_than_zero'),
            'page_size.integer' => __('super_magic.agent.page_size_must_be_integer'),
            'page_size.min' => __('super_magic.agent.page_size_must_be_greater_than_zero'),
            'page_size.max' => __('super_magic.agent.page_size_must_not_exceed_100'),
            'keywords.array' => __('validation.array', ['attribute' => 'keywords']),
            'keywords.*.string' => __('validation.string', ['attribute' => 'keywords']),
            'keywords.*.max' => __('validation.max.string', ['attribute' => 'keywords', 'max' => 255]),
        ];
    }

    public function getPage(): int
    {
        return $this->page;
    }

    public function getPageSize(): int
    {
        return $this->pageSize;
    }

    /**
     * @return array<int, string>
     */
    public function getKeywords(): array
    {
        $keywords = [];
        foreach ($this->keywords as $keyword) {
            $keyword = trim($keyword);
            if ($keyword === '' || in_array($keyword, $keywords, true)) {
                continue;
            }
            $keywords[] = $keyword;
        }

        return $keywords;
    }
}
