<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Domain\SuperAgent\Entity\ValueObject;

/**
 * Super Magic execution source passed to the Python runtime through dynamic_config.
 */
enum SuperMagicExecutionSource: string
{
    case HumanChat = 'human_chat';
    case OpenApi = 'open_api';
    case MessageSchedule = 'message_schedule';
    case Webhook = 'webhook';
    case ThirdPartyIm = 'third_party_im';
    case Cron = 'cron';
    case System = 'system';
    case Unknown = 'unknown';

    public const string DYNAMIC_PARAM_KEY = 'super_magic_execution_source';

    public static function fromRaw(mixed $value): self
    {
        if ($value instanceof self) {
            return $value;
        }

        if (! is_string($value)) {
            return self::Unknown;
        }

        $normalized = strtolower(trim($value));
        if ($normalized === '') {
            return self::Unknown;
        }

        foreach (self::cases() as $source) {
            if ($source->value === $normalized) {
                return $source;
            }
        }

        return self::Unknown;
    }

    public static function stampMessageContent(array $messageContent, self $source, bool $overwrite = true): array
    {
        if (! isset($messageContent['extra']) || ! is_array($messageContent['extra'])) {
            $messageContent['extra'] = [];
        }

        if (! isset($messageContent['extra']['super_agent']) || ! is_array($messageContent['extra']['super_agent'])) {
            $messageContent['extra']['super_agent'] = [];
        }

        $dynamicParams = $messageContent['extra']['super_agent']['dynamic_params'] ?? null;
        $messageContent['extra']['super_agent']['dynamic_params'] = self::stampDynamicParams(
            is_array($dynamicParams) ? $dynamicParams : null,
            $source,
            $overwrite
        );

        return $messageContent;
    }

    public static function ensureMessageContent(array $messageContent, self $defaultSource): array
    {
        return self::stampMessageContent($messageContent, $defaultSource, false);
    }

    public static function stampDynamicParams(?array $dynamicParams, self $source, bool $overwrite = true): array
    {
        $dynamicParams ??= [];

        if ($overwrite || ! self::hasExecutionSource($dynamicParams)) {
            $dynamicParams[self::DYNAMIC_PARAM_KEY] = $source->value;
        }

        return $dynamicParams;
    }

    public static function ensureDynamicParams(?array $dynamicParams, self $defaultSource): array
    {
        return self::stampDynamicParams($dynamicParams, $defaultSource, false);
    }

    private static function hasExecutionSource(array $dynamicParams): bool
    {
        if (! array_key_exists(self::DYNAMIC_PARAM_KEY, $dynamicParams)) {
            return false;
        }

        $value = $dynamicParams[self::DYNAMIC_PARAM_KEY];
        if (! is_scalar($value)) {
            return false;
        }

        return trim((string) $value) !== '';
    }
}
