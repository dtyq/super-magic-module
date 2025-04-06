<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Interfaces\Chat\Assembler;

use App\Domain\Contact\Entity\AccountEntity;
use App\Domain\Contact\Entity\MagicDepartmentEntity;
use App\Domain\Contact\Entity\MagicUserEntity;
use App\Domain\Contact\Entity\ValueObject\DepartmentOption;
use App\Domain\Contact\Entity\ValueObject\EmployeeType;
use App\Interfaces\Chat\DTO\UserDepartmentDetailDTO;
use App\Interfaces\Chat\DTO\UserDetailDTO;
use Hyperf\Logger\LoggerFactory;

class UserAssembler
{
    public function __construct()
    {
    }

    /**
     * @param AccountEntity[] $accounts
     */
    public static function getAgentList(array $agents, array $accounts): array
    {
        /** @var AccountEntity[] $accounts */
        $accounts = array_column($accounts, null, 'magic_id');
        $agentList = [];
        foreach ($agents as $agent) {
            $agentAccount = $accounts[$agent['magic_id']] ?? null;
            if ($agentAccount instanceof AccountEntity) {
                $agentAccount = $agentAccount->toArray();
            } else {
                $agentAccount = [];
            }
            $label = explode(',', $agentAccount['extra']['label'] ?? '');
            $label = empty($label[0]) ? [] : $label;
            $agentList[] = [
                'id' => $agent['user_id'],
                'label' => $label,
                'like_num' => $agentAccount['extra']['like_num'] ?? 0,
                'friend_num' => $agentAccount['extra']['friend_num'] ?? 0,
                'nickname' => $agent['nickname'],
                'description' => $agent['description'],
                'avatar_url' => $agent['avatar_url'],
            ];
        }
        return $agentList;
    }

    public static function getUserInfos(array $userInfos): array
    {
        // 强转用户 id 类型为 string
        foreach ($userInfos as &$user) {
            // 不返回 magic_id 和 id
            unset($user['magic_id'], $user['id']);
        }
        return $userInfos;
    }

    public static function getUserEntity(array $user): MagicUserEntity
    {
        return new MagicUserEntity($user);
    }

    public static function getUserEntities(array $users): array
    {
        $userEntities = [];
        foreach ($users as $user) {
            $userEntities[] = self::getUserEntity($user);
        }
        return $userEntities;
    }

    public static function getAccountEntity(array $account): AccountEntity
    {
        return new AccountEntity($account);
    }

    public static function getAccountEntities(array $accounts): array
    {
        $accountEntities = [];
        foreach ($accounts as $account) {
            $accountEntities[] = self::getAccountEntity($account);
        }
        return $accountEntities;
    }

    /**
     * @param AccountEntity[] $accounts
     * @param MagicUserEntity[] $users
     * @return array<UserDetailDTO>
     */
    public static function getUsersDetail(array $users, array $accounts): array
    {
        $logger = di(LoggerFactory::class)->get('UserAssembler');
        /** @var array<AccountEntity> $accounts */
        $accounts = array_column($accounts, null, 'magic_id');
        $userDetailDTOList = [];
        foreach ($users as $user) {
            $account = $accounts[$user['magic_id']] ?? null;
            if (empty($account)) {
                $logger->warning("用户[magic_id: {$user['magic_id']} ]不存在, 跳过！");
                continue;
            }
            // 如果存在手机号，将手机号的中间四位替换为*
            $phone = $account->getPhone();
            if (! empty($phone)) {
                $phone = substr_replace($phone, '****', 3, 4);
            }
            $userDetailAdd = [
                'country_code' => $account->getCountryCode(),
                'phone' => $phone,
                'email' => $account->getEmail(),
                'real_name' => $account->getRealName(),
                'account_type' => $account->getType()->value,
                'ai_code' => $account->getAiCode(),
            ];
            $userDetailAdd = array_merge($user->toArray(), $userDetailAdd);
            $userDetailDTOList[] = new UserDetailDTO($userDetailAdd);
        }
        return $userDetailDTOList;
    }

    /**
     * 一个用户可能存在于多个部门.
     * @param UserDetailDTO[] $usersDetail
     * @param MagicDepartmentEntity[][] $departmentsInfo
     * @return array<UserDepartmentDetailDTO>
     */
    public static function getUserDepartmentDetailDTOList(array $departmentUsers, array $usersDetail, array $departmentsInfo, bool $withDepartmentFullPath = false, ?array $matchedQueryDepartmentIds = null): array
    {
        $matchedQueryDepartmentIds = array_flip($matchedQueryDepartmentIds ?? []);
        /** @var array<UserDepartmentDetailDTO> $usersDepartmentDetailDTOList */
        $usersDepartmentDetailDTOList = [];
        $tempDepartmentUsers = $departmentUsers;
        $departmentUsers = [];

        // 处理用户部门关系,优先保留匹配查询部门的数据
        foreach ($tempDepartmentUsers as $tempDepartmentUser) {
            $userId = $tempDepartmentUser['user_id'];

            // 如果该用户还未被处理过,直接添加
            if (! isset($departmentUsers[$userId])) {
                $departmentUsers[$userId] = $tempDepartmentUser;
                continue;
            }

            // 检查用户是否在匹配的查询部门中
            $userDepartmentId = $tempDepartmentUser['department_id'] ?? '';
            $userDepartments = $departmentsInfo[$userDepartmentId] ?? [];
            foreach ($userDepartments as $userDepartment) {
                if (isset($matchedQueryDepartmentIds[$userDepartment->getDepartmentId()])) {
                    $departmentUsers[$userId] = $tempDepartmentUser;
                    break;
                }
            }
        }

        foreach ($usersDetail as $userInfo) {
            // ai 或者 私人版用户,没有部门信息
            $userId = $userInfo->getUserId();
            $departmentUser = $departmentUsers[$userId] ?? [];
            $userDepartmentId = $departmentUser['department_id'] ?? '';
            /** @var MagicDepartmentEntity[] $departments */
            $departments = $departmentsInfo[$userDepartmentId] ?? [];
            $pathNodes = [];
            if ($withDepartmentFullPath) {
                $pathNodes = array_map(fn (MagicDepartmentEntity $department) => self::assemblePathNodeByDepartmentInfo($department), $departments);
            } else {
                ! empty($departments) && $pathNodes[] = self::assemblePathNodeByDepartmentInfo(end($departments));
            }

            if (! empty($usersDepartmentDetailDTOList[$userId])) {
                // 用户存在于多个部门
                $userDepartmentDetailDTO = $usersDepartmentDetailDTOList[$userId];
                if (! empty($departments) && ! empty($pathNodes)) {
                    $userDepartmentDetailDTO->setPathNodes($pathNodes);
                }
            } else {
                $userDepartmentDetail = [
                    // 可能是个人版用户,或者是ai
                    'employee_type' => $departmentUser['employee_type'] ?? EmployeeType::Unknown->value,
                    'employee_no' => $departmentUser['employee_no'] ?? '',
                    'job_title' => $departmentUser['job_title'] ?? '',
                    'is_leader' => (bool) ($departmentUser['is_leader'] ?? false),
                    'path_nodes' => $pathNodes,
                ];
                $userDepartmentDetail = array_merge($userDepartmentDetail, $userInfo->toArray());
                $userDepartmentDetailDTO = new UserDepartmentDetailDTO($userDepartmentDetail);
            }
            $usersDepartmentDetailDTOList[$userId] = $userDepartmentDetailDTO;
        }
        return array_values($usersDepartmentDetailDTOList);
    }

    private static function assemblePathNodeByDepartmentInfo(MagicDepartmentEntity $departmentInfo): array
    {
        return [
            // 部门名称
            'department_name' => $departmentInfo->getName(),
            // 部门id
            'department_id' => $departmentInfo->getDepartmentId(),
            'parent_department_id' => $departmentInfo->getParentDepartmentId(),
            // 部门路径
            'path' => $departmentInfo->getPath(),
            // 可见性
            'visible' => ! ($departmentInfo->getOption() === DepartmentOption::Hidden),
            'option' => $departmentInfo->getOption(),
        ];
    }
}
