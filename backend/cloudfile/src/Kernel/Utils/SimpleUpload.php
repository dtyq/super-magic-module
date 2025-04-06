<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace Dtyq\CloudFile\Kernel\Utils;

use Dtyq\CloudFile\Kernel\Struct\AppendUploadFile;
use Dtyq\CloudFile\Kernel\Struct\UploadFile;
use Dtyq\SdkBase\SdkBase;

abstract class SimpleUpload
{
    protected SdkBase $sdkContainer;

    public function __construct(SdkBase $sdkContainer)
    {
        $this->sdkContainer = $sdkContainer;
    }

    abstract public function uploadObject(array $credential, UploadFile $uploadFile): void;

    abstract public function appendUploadObject(array $credential, AppendUploadFile $appendUploadFile): void;
}
