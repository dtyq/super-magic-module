<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Chat\Entity\Items;

use App\Domain\Chat\Entity\AbstractEntity;

class SeqExtra extends AbstractEntity
{
    /**
     * 序列号所属会话 id.
     */
    protected string $topicId = '';

    /**
     * 用户发这条消息时，他所登录的环境 id.（比如在 saas 生产填了 kk 预发布的私有化部署码）
     * 用于请求指定私有化部署的测试/预发布/生产环境.
     */
    protected ?int $magicEnvId = null;

    public function getMagicEnvId(): ?int
    {
        return $this->magicEnvId;
    }

    public function setMagicEnvId(?int $magicEnvId): self
    {
        $this->magicEnvId = $magicEnvId;
        return $this;
    }

    public function getTopicId(): string
    {
        return $this->topicId;
    }

    public function setTopicId(string $topicId): self
    {
        $this->topicId = $topicId;
        return $this;
    }
}
