<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\ExternalAPI\Teamshare\Oauth2\MultiTable;

use App\Application\Authentication\Service\Oauth2AuthenticationAppService;
use App\Domain\Authentication\Entity\ValueObject\AuthenticationDataIsolation;
use App\Domain\Authentication\Entity\ValueObject\ThirdPartyPlatform;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\File\GetByIdParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\File\QueriesParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Knowledge\GetManageableParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Knowledge\StartVectorParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Record\AddRecordParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Record\DeleteRecordParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Record\GetRecordsParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Record\UpdateRecordParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\Api\Parameter\Sheet\GetSheetsByFileIdParameter;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\TeamshareApi;
use App\Infrastructure\ExternalAPI\Teamshare\Oauth2\Teamshare\TeamshareApiFactory;
use HyperfTest\Cases\BaseTest;

/**
 * @internal
 */
class MultiTableApiTest extends BaseTest
{
    public function testFileQueries()
    {
        $api = $this->createApi();
        $parameter = new QueriesParameter($this->getUserAccessToken());
        $parameter->setName('oauth');
        $result = $api->file->queries($parameter);
        $this->assertNotEmpty($result->getData());
    }

    public function testFileGet()
    {
        $api = $this->createApi();
        $parameter = new GetByIdParameter($this->getUserAccessToken());
        $parameter->setId('707616424235442176');
        $result = $api->file->getById($parameter);
        $this->assertNotEmpty($result->getData());
    }

    public function testGetSheetsByFileId()
    {
        $api = $this->createApi();
        $parameter = new GetSheetsByFileIdParameter($this->getUserAccessToken());
        $parameter->setFileId('707616424235442176');
        $result = $api->sheet->getSheetsByFileId($parameter);
        $this->assertNotEmpty($result->getSheets());
    }

    public function testAddRecord()
    {
        $api = $this->createApi();
        $parameter = new AddRecordParameter($this->getUserAccessToken());
        $parameter->setSheetId('508907118527590400');
        $parameter->setRecord([
            // 多行文本
            'wcQEEhBw' => '嘻嘻哈哈' . time(),
            // 成员
            '4LYzPzwA' => [
                'members' => [
                    [
                        'id' => '606446434040061952',
                    ],
                    [
                        'id' => '606488063299981312',
                    ],
                ],
            ],
            // 数值
            '8tNU7rpp' => '120.09',
            // 链接
            'kH62P8QN' => [
                'text' => 'https://www.baidu.com',
                'url' => 'https://www.baidu.com',
            ],
            // 日期
            'n2clDVas' => [
                'time' => time(),
            ],
            // 多选
            'ArFQvflb' => [
                'XAzMdy1729998437627',
                'Hyl7dJ1729998444066',
            ],
            // 单选
            'jykMlY44' => 't34kIx1729998464212',
            // 开关
            '0upYZ4vr' => true,
        ]);
        $result = $api->record->addRecord($parameter);
        $this->assertNotEmpty($result->getRowId());
    }

    public function testGetRecord()
    {
        $api = $this->createApi();
        $parameter = new GetRecordsParameter($this->getUserAccessToken());
        $parameter->setSheetId('508907118527590400');
        $parameter->setFilter([
            'id' => [
                '$eq' => 'I39Dn2DX',
            ],
        ]);
        $result = $api->record->getRecords($parameter);
        $this->assertNotEmpty($result);
    }

    public function testDeleteRecord()
    {
        $api = $this->createApi();
        $parameter = new DeleteRecordParameter($this->getUserAccessToken());
        $parameter->setSheetId('508907118527590400');
        $parameter->setFilter([
            'id' => [
                '$eq' => 'qDsYf8RJ',
            ],
        ]);
        $api->record->deleteRecord($parameter);
        $this->assertTrue(true);
    }

    public function testUpdateRecord()
    {
        $api = $this->createApi();
        $parameter = new UpdateRecordParameter($this->getUserAccessToken());
        $parameter->setSheetId('508907118527590400');
        $parameter->setFilter([
            'id' => [
                '$eq' => 'gFWmLnjr',
            ],
        ]);
        $parameter->setRecord([
            // 多行文本
            'wcQEEhBw' => '更改后' . time(),
        ]);
        $api->record->updateRecord($parameter);
        $this->assertTrue(true);
    }

    public function testKnowledgeGetManageable()
    {
        $api = $this->createApi();
        $parameter = new GetManageableParameter($this->getUserAccessToken());
        $result = $api->knowledge->getManageable($parameter);
        $this->assertNotEmpty($result->getKnowledgeList());
    }

    public function testStartVector()
    {
        $api = $this->createApi();
        $parameter = new StartVectorParameter($this->getUserAccessToken());
        $parameter->setKnowledgeId('710663199551291392');
        $result = $api->knowledge->startVector($parameter);
        $this->assertNotEmpty($result->getData());
    }

    private function createApi(): TeamshareApi
    {
        return make(TeamshareApiFactory::class)->create();
    }

    private function getUserAccessToken(): string
    {
        $uid = 'usi_a450dd07688be6273b5ef112ad50ba7e';
        $dataIsolation = AuthenticationDataIsolation::create('DT001', $uid);
        return make(Oauth2AuthenticationAppService::class)->getAccessToken($dataIsolation, $uid, ThirdPartyPlatform::TeamshareOpenPlatformPro);
    }
}
