<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Contact\Repository\Facade;

use App\Domain\Contact\Entity\AccountEntity;

interface MagicAccountRepositoryInterface
{
    // 查询账号信息
    public function getAccountInfoByMagicId(string $magicId): ?AccountEntity;

    /**
     * @return AccountEntity[]
     */
    public function getAccountByMagicIds(array $magicIds): array;

    // 创建账号
    public function createAccount(AccountEntity $accountDTO): AccountEntity;

    /**
     * @param AccountEntity[] $accountDTOs
     * @return AccountEntity[]
     */
    public function createAccounts(array $accountDTOs): array;

    /**
     * @return AccountEntity[]
     */
    public function getAccountInfoByMagicIds(array $magicIds): array;

    public function getAccountInfoByAiCode(string $aiCode): ?AccountEntity;

    /**
     * @return AccountEntity[]
     */
    public function searchUserByPhoneOrRealName(string $query): array;

    public function updateAccount(string $magicId, array $updateData): int;

    public function saveAccount(AccountEntity $accountDTO): AccountEntity;

    /**
     * @return AccountEntity[]
     */
    public function getAccountInfoByAiCodes(array $aiCodes): array;

    public function getByAiCode(string $aiCode): ?AccountEntity;
}
