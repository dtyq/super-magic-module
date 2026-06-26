<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\SuperMagic\Tests\Unit\Interfaces\SuperAgent\DTO\Response;

use Dtyq\SuperMagic\Interfaces\SuperAgent\DTO\Response\FileInfoResponseDTO;
use PHPUnit\Framework\TestCase;

/**
 * @internal
 */
class FileInfoResponseDTOTest extends TestCase
{
    public function testToArrayIncludesRelativeFilePathForDestructiveOperationVerification(): void
    {
        $dto = new FileInfoResponseDTO(
            'index.html',
            3,
            'DTYQ',
            '/app/index.html'
        );

        $this->assertSame('/app/index.html', $dto->toArray()['relative_file_path']);
    }
}
