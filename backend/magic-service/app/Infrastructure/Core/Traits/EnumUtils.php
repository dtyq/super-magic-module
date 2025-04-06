<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Infrastructure\Core\Traits;

use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Exception\ExceptionBuilder;

trait EnumUtils
{
    public static function make(null|int|string $input = null): ?self
    {
        return self::tryFrom($input ?? '');
    }

    public static function makeIfIfExists(null|int|string $input = null, ?string $error = null): self
    {
        if (is_null($input)) {
            $className = \Hyperf\Support\class_basename(self::class);
            $error = $error ?? "{$className} is required";
            ExceptionBuilder::throw(GenericErrorCode::InvalidEnumValue, $error);
        }
        $enum = self::make($input);
        if (! $enum) {
            $className = \Hyperf\Support\class_basename(self::class);
            $error = $error ?? "[{$className}]{$input} not found";
            ExceptionBuilder::throw(GenericErrorCode::InvalidEnumValue, $error);
        }
        return $enum;
    }

    public function getValue(): int|string
    {
        return $this->value;
    }
}
