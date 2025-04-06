<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Util\Asr\ValueObject\Volcengine;

// TODO 版本稳定后可以采用此Header，增加Volcengine的可读性
class VolcengineHeader
{
    // 协议版本
    public const int PROTOCOL_VERSION = 0b0001;

    // 头部大小
    public const int HEADER_SIZE = 0b0001;

    // 消息类型
    public const int MESSAGE_TYPE_FULL_CLIENT_REQUEST = 0b0001;

    public const int MESSAGE_TYPE_AUDIO_ONLY_REQUEST = 0b0010;

    public const int MESSAGE_TYPE_FULL_SERVER_RESPONSE = 0b1001;

    public const int MESSAGE_TYPE_SERVER_ACK = 0b1011;

    public const int MESSAGE_TYPE_SERVER_ERROR = 0b1111;

    // 消息类型特定标志
    public const int MESSAGE_FLAG_DEFAULT = 0b0000;

    public const int MESSAGE_FLAG_LAST_AUDIO_PACKET = 0b0010;

    // 序列化方法
    public const int SERIALIZATION_NONE = 0b0000;

    public const int SERIALIZATION_JSON = 0b0001;

    // 压缩方法
    public const int COMPRESSION_NONE = 0b0000;

    public const int COMPRESSION_GZIP = 0b0001;

    // 字段描述
    public const string PROTOCOL_VERSION_DESC = '将来可能会决定使用不同的协议版本，因此此字段是为了使客户端和服务器在版本上达成共识。';

    public const string HEADER_SIZE_DESC = 'Header 大小。实际 header 大小（以字节为单位）是 header size value x 4 。';

    public const string MESSAGE_TYPE_DESC = '消息类型。';

    public const string MESSAGE_TYPE_SPECIFIC_FLAGS_DESC = 'Message type 的补充信息。';

    public const string MESSAGE_SERIALIZATION_METHOD_DESC = 'full client request 的 payload 序列化方法；服务器将使用与客户端相同的序列化方法。';

    public const string MESSAGE_COMPRESSION_DESC = '定义 payload 的压缩方法；服务端将使用客户端的压缩方法。';

    public const string RESERVED_DESC = '保留以供将来使用，还用作填充（使整个标头总计4个字节）。';

    /** 仅音频数据请求标志 */
    private const int AUDIO_ONLY_CLIENT_REQUEST = 0b0010;

    /** 最后一个音频包标志 */
    private const int LAST_PACKET_FLAG = 0b0010;

    /**
     * 生成头部.
     *
     * @param int $version 协议版本
     * @param int $messageType 消息类型
     * @param int $messageTypeSpecificFlags 消息类型特定标志
     * @param int $serializationMethod 序列化方法
     * @param int $compressionMethod 压缩方法
     * @param int $reserved 保留字段
     * @param string $extensionHeader 扩展头部
     * @return string 生成的头部字符串
     */
    public static function generateHeader(
        int $version = self::PROTOCOL_VERSION,
        int $messageType = self::MESSAGE_TYPE_FULL_CLIENT_REQUEST,
        int $messageTypeSpecificFlags = self::MESSAGE_FLAG_DEFAULT,
        int $serializationMethod = self::SERIALIZATION_JSON,
        int $compressionMethod = self::COMPRESSION_GZIP,
        int $reserved = 0x00,
        string $extensionHeader = ''
    ): string {
        $header = '';
        $headerSize = intdiv(strlen($extensionHeader), 4) + 1;
        $header .= chr(($version << 4) | $headerSize);
        $header .= chr(($messageType << 4) | $messageTypeSpecificFlags);
        $header .= chr(($serializationMethod << 4) | $compressionMethod);
        $header .= chr($reserved);
        $header .= $extensionHeader;
        return $header;
    }

    /**
     * 获取消息类型的字符串表示.
     *
     * @param int $messageType 消息类型
     * @return string 消息类型的字符串表示
     */
    public static function getMessageTypeString(int $messageType): string
    {
        return match ($messageType) {
            self::MESSAGE_TYPE_FULL_CLIENT_REQUEST => '完整客户端请求 (0b0001)',
            self::MESSAGE_TYPE_AUDIO_ONLY_REQUEST => '仅音频数据请求 (0b0010)',
            self::MESSAGE_TYPE_FULL_SERVER_RESPONSE => '完整服务器响应 (0b1001)',
            self::MESSAGE_TYPE_SERVER_ACK => '服务器确认 (0b1011)',
            self::MESSAGE_TYPE_SERVER_ERROR => '服务器错误响应 (0b1111)',
            default => '未知消息类型 (0b' . decbin($messageType) . ')',
        };
    }

    /**
     * 获取字段描述.
     *
     * @param string $field 字段名
     * @return string 字段描述
     */
    public static function getDescription(string $field): string
    {
        return match ($field) {
            'Protocol version' => self::PROTOCOL_VERSION_DESC,
            'Header' => self::HEADER_SIZE_DESC,
            'Message type' => self::MESSAGE_TYPE_DESC,
            'Message type specific flags' => self::MESSAGE_TYPE_SPECIFIC_FLAGS_DESC,
            'Message serialization method' => self::MESSAGE_SERIALIZATION_METHOD_DESC,
            'Message Compression' => self::MESSAGE_COMPRESSION_DESC,
            'Reserved' => self::RESERVED_DESC,
            default => '未知字段',
        };
    }

    /**
     * 获取字段值的描述.
     *
     * @param string $field 字段名
     * @param int $value 字段值
     * @return string 字段值的描述
     */
    public static function getValueDescription(string $field, int $value): string
    {
        return match ($field) {
            'Protocol version' => $value === self::PROTOCOL_VERSION ? 'version 1 (目前只有该版本)' : '未知版本',
            'Header' => $value === self::HEADER_SIZE ? 'header size = 4 (1 x 4)' : '未知大小',
            'Message type' => self::getMessageTypeString($value),
            'Message type specific flags' => match ($value) {
                self::MESSAGE_FLAG_DEFAULT => 'full client request 或包含非最后一包音频数据的 audio only request 中设置',
                self::MESSAGE_FLAG_LAST_AUDIO_PACKET => '包含最后一包音频数据的 audio only request 中设置',
                default => '未知标志',
            },
            'Message serialization method' => match ($value) {
                self::SERIALIZATION_NONE => '无序列化',
                self::SERIALIZATION_JSON => 'JSON 格式',
                default => '未知序列化方法',
            },
            'Message Compression' => match ($value) {
                self::COMPRESSION_NONE => 'no compression',
                self::COMPRESSION_GZIP => 'Gzip 压缩',
                default => '未知压缩方法',
            },
            default => '未知值',
        };
    }

    protected function generateFullDefaultHeader(): string
    {
        return $this->generateHeader();
    }

    protected function generateAudioDefaultHeader(): string
    {
        return $this->generateHeader(
            messageType: self::AUDIO_ONLY_CLIENT_REQUEST,
        );
    }

    protected function generateLastAudioEndHeader(): string
    {
        return $this->generateHeader(
            messageType: self::AUDIO_ONLY_CLIENT_REQUEST,
            messageTypeSpecificFlags: self::LAST_PACKET_FLAG,
        );
    }
}
