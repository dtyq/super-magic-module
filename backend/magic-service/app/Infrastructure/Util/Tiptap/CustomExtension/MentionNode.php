<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Tiptap\CustomExtension;

use App\Infrastructure\Util\Tiptap\AbstractCustomNode;
use Hyperf\Codec\Json;

/**
 * 富文本的@功能.
 */
class MentionNode extends AbstractCustomNode
{
    public static $name = 'mention';

    public function addAttributes(): array
    {
        return [
            'type' => [
                'type' => '',
                'isRequired' => true,
            ],
            'id' => [
                'default' => null,
                'isRequired' => true,
            ],
            'label' => [
                'default' => null,
                'isRequired' => true,
            ],
            'avatar' => [
                'default' => null,
            ],
        ];
    }

    public function renderText($node): string
    {
        $nodeForArray = Json::decode(Json::encode($node));
        $userName = $nodeForArray['attrs']['label'] ?? '';
        return '@' . $userName;
    }
}
