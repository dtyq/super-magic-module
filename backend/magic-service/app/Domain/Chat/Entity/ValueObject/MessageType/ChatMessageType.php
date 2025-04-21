<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\ValueObject\MessageType;

/**
 * 聊天消息内容的类型.
 * 值从0开始.
 */
enum ChatMessageType: string
{
    // 文本
    case Text = 'text';

    // 图片
    case Image = 'image';

    // 视频
    case Video = 'video';

    // 文件
    case File = 'file';
    case Files = 'files';

    // 附件
    case Attachment = 'attachment';

    // 语音
    case Voice = 'voice';

    // 文本卡片
    case TextCard = 'text_card';

    // markdown
    case Markdown = 'markdown';

    // 位置
    case Location = 'location';

    // 麦吉搜索卡片
    case MagicSearchCard = 'magic_search_card';

    /**
     * 多次流式响应后，最终合并成一条消息入库.
     */
    case AggregateAISearchCard = 'aggregate_ai_search_card';

    /**
     * 流式响应.
     */
    case StreamAggregateAISearchCard = 'stream_aggregate_ai_search_card';

    // 富文本
    case RichText = 'rich_text';

    // AI文生图卡片
    case AIImageCard = 'ai_image_card';

    // 录音纪要
    case RecordingSummary = 'recording_summary';

    // 图片转高清
    case ImageConvertHighCard = 'image_convert_high_card';

    // 通用 agent 消息
    case SuperAgentCard = 'general_agent_card';

    public function getName(): string
    {
        return $this->value;
    }
}
