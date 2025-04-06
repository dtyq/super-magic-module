<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Domain\Contact\Repository\Persistence;

use App\Domain\Contact\Entity\MagicDepartmentUserEntity;
use App\Domain\Contact\Entity\ValueObject\DataIsolation;
use App\Domain\Contact\Repository\Facade\MagicDepartmentUserRepositoryInterface;
use App\Domain\Contact\Repository\Persistence\Model\DepartmentUserModel;
use Hyperf\DbConnection\Db;

class MagicDepartmentUserRepository implements MagicDepartmentUserRepositoryInterface
{
    public function __construct(
        protected DepartmentUserModel $departmentUserModel,
    ) {
    }

    /**
     * @return MagicDepartmentUserEntity[]
     */
    public function getDepartmentUsersByUserIds(array $userIds, string $organizationCode): array
    {
        $query = $this->departmentUserModel->newQuery()
            ->whereIn('user_id', $userIds)
            ->where('organization_code', $organizationCode);
        $departmentUsers = Db::select($query->toSql(), $query->getBindings());
        return $this->getDepartmentUserEntities($departmentUsers);
    }

    /**
     * @return MagicDepartmentUserEntity[]
     */
    public function getDepartmentUsersByUserIdsInMagic(array $userIds): array
    {
        $query = $this->departmentUserModel->newQuery()->whereIn('user_id', $userIds);
        $departmentUsers = Db::select($query->toSql(), $query->getBindings());
        return $this->getDepartmentUserEntities($departmentUsers);
    }

    /**
     * @return MagicDepartmentUserEntity[]
     */
    public function getDepartmentUsersByDepartmentId(string $departmentId, string $organizationCode, int $limit, int $offset): array
    {
        $query = $this->departmentUserModel->newQuery()
            ->where('department_id', $departmentId)
            ->where('organization_code', $organizationCode)
            ->limit($limit)
            ->offset($offset);
        $departmentUsers = Db::select($query->toSql(), $query->getBindings());
        return $this->getDepartmentUserEntities($departmentUsers);
    }

    /**
     * @return MagicDepartmentUserEntity[]
     */
    public function getDepartmentUsersByDepartmentIds(array $departmentIds, string $organizationCode, int $limit, array $fields = ['*']): array
    {
        $query = $this->departmentUserModel->newQuery()
            ->select($fields)
            ->whereIn('department_id', $departmentIds)
            ->where('organization_code', $organizationCode)
            ->limit($limit);
        $departmentUsers = Db::select($query->toSql(), $query->getBindings());
        return $this->getDepartmentUserEntities($departmentUsers);
    }

    public function getDepartmentIdsByUserIds(DataIsolation $dataIsolation, array $userIds): array
    {
        $builder = DepartmentUserModel::query();
        $builder->whereIn('user_id', $userIds);
        $builder->where('organization_code', $dataIsolation->getCurrentOrganizationCode());
        $departmentUsers = Db::select($builder->toSql(), $builder->getBindings());
        $list = [];
        foreach ($departmentUsers as $departmentUser) {
            $list[$departmentUser['user_id']][] = $departmentUser['department_id'];
        }
        return $list;
    }

    public function createDepartmentUsers(array $createDepartmentUserDTOs): bool
    {
        return $this->departmentUserModel->newQuery()->insert($createDepartmentUserDTOs);
    }

    public function updateDepartmentUser(string $magicDepartmentUserPrimaryId, array $updateData): int
    {
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        return $this->departmentUserModel->newQuery()
            ->where('id', $magicDepartmentUserPrimaryId)
            ->update($updateData);
    }

    public function deleteDepartmentUsersByMagicIds(array $magicIds, string $departmentId, string $magicOrganizationCode): int
    {
        return (int) $this->departmentUserModel->newQuery()
            ->where('organization_code', $magicOrganizationCode)
            ->whereIn('magic_id', $magicIds)
            ->where('department_id', $departmentId)
            ->delete();
    }

    /**
     * @return MagicDepartmentUserEntity[]
     */
    public function searchDepartmentUsersByJobTitle(string $keyword, string $magicOrganizationCode): array
    {
        $res = $this->departmentUserModel::query()
            ->where('job_title', 'like', "%{$keyword}%")
            ->where('organization_code', $magicOrganizationCode)
            ->get()
            ->toArray();
        return array_map(fn ($item) => new MagicDepartmentUserEntity($item), $res);
    }

    private function getDepartmentUserEntities(array $departmentUsers): array
    {
        $departmentUserEntities = [];
        foreach ($departmentUsers as $departmentUser) {
            $departmentUserEntities[] = new MagicDepartmentUserEntity($departmentUser);
        }
        return $departmentUserEntities;
    }
}
