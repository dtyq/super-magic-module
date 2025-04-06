<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\Application\Flow\ExecuteManager\BuiltIn\ToolSet\AIImage\Tools;

use App\Application\Chat\Service\MagicChatImageConvertHighAppService;
use App\Application\Flow\ExecuteManager\BuiltIn\BuiltInToolSet;
use App\Application\Flow\ExecuteManager\BuiltIn\ToolSet\AbstractBuiltInTool;
use App\Application\Flow\ExecuteManager\ExecutionData\ExecutionData;
use App\Domain\Chat\DTO\ImageConvertHigh\Request\MagicChatImageConvertHighReqDTO;
use App\Domain\Chat\DTO\Message\ChatMessage\TextMessage;
use App\Domain\Contact\Entity\MagicUserEntity;
use App\Domain\Contact\Service\MagicUserDomainService;
use App\Domain\Flow\Entity\ValueObject\NodeInput;
use App\ErrorCode\GenericErrorCode;
use App\Infrastructure\Core\Collector\BuiltInToolSet\Annotation\BuiltInToolDefine;
use App\Infrastructure\Core\Exception\ExceptionBuilder;
use App\Infrastructure\Util\Context\RequestContext;
use App\Interfaces\Authorization\Web\MagicUserAuthorization;
use Closure;
use Dtyq\FlowExprEngine\ComponentFactory;
use Dtyq\FlowExprEngine\Structure\StructureType;

use function di;

#[BuiltInToolDefine]
class ImageConvertHighBuiltInTool extends AbstractBuiltInTool
{
    public function getToolSetCode(): string
    {
        return BuiltInToolSet::AIImage->getCode();
    }

    public function getName(): string
    {
        return 'image_convert_high';
    }

    public function getDescription(): string
    {
        return '图片转高清工具';
    }

    public function getCallback(): ?Closure
    {
        return function (ExecutionData $executionData) {
            if ($executionData->getExecutionType()->isDebug()) {
                // debug 模式
                return ['image_convert_high: current not support debug model'];
            }
            $args = $executionData->getTriggerData()->getParams();
            $searchKeyword = $args['user_prompt'] ?? '';
            $userInfoEntity = $executionData->getTriggerData()->getUserInfo()['user_entity'] ?? null;
            if (empty($userInfoEntity) || ! $userInfoEntity instanceof MagicUserEntity) {
                ExceptionBuilder::throw(GenericErrorCode::SystemError, 'sender_user_not_found');
            }
            $userId = $userInfoEntity->getUserId();
            $userInfoEntity = $this->getMagicUserDomainService()->getUserById($userId);
            $conversationId = $executionData->getOriginConversationId();
            $topicId = $executionData->getTopicId();
            $requestContext = new RequestContext();
            $userAuthorization = new MagicUserAuthorization();
            $userAuthorization->setId($userInfoEntity->getUserId());
            $userAuthorization->setOrganizationCode($userInfoEntity->getOrganizationCode());
            $userAuthorization->setUserType($userInfoEntity->getUserType());
            $requestContext->setUserAuthorization($userAuthorization);
            $textMessage = new TextMessage([]);
            $textMessage->setContent($searchKeyword);
            $reqDto = (new MagicChatImageConvertHighReqDTO())
                ->setTopicId($topicId ?? '')
                ->setConversationId($conversationId)
                ->setUserMessage($textMessage)
                ->setOriginImageUrl($executionData->getTriggerData()->getAttachments()[0]->getUrl())
                ->setOriginImageId($executionData->getTriggerData()->getAttachments()[0]->getChatFileId())
                ->setReferMessageId($executionData->getTriggerData()->getSeqEntity()->getSeqId());
            $this->getMagicChatImageConvertHighAppService()->handleUserMessage($requestContext, $reqDto);
            return [];
        };
    }

    public function getInput(): ?NodeInput
    {
        $input = new NodeInput();
        $input->setForm(ComponentFactory::generateTemplate(StructureType::Form, json_decode(
            <<<'JSON'
{
    "type": "object",
    "key": "root",
    "sort": 0,
    "title": "root节点",
    "description": "",
    "items": null,
    "value": null,
    "required": [
        "user_prompt",
        "attachments"
    ],
    "properties": {
        "user_prompt": {
            "type": "string",
            "key": "user_prompt",
            "title": "用户提示词",
            "description": "用户提示词",
            "required": null,
            "value": null,
            "encryption": false,
            "encryption_value": null,
            "items": null,
            "properties": null
        },
        "attachments": {
            "type": "array",
            "key": "attachments",
            "title": "附件数组",
            "description": "传入文件列表数组",
            "required": null,
            "value": null,
            "encryption": false,
            "encryption_value": null,
            "items": {
                "type": "object",
                "key": "files",
                "sort": 0,
                "title": "文件",
                "description": "",
                "required": [
                ],
                "value": null,
                "encryption": false,
                "encryption_value": null,
                "items": null,
                "properties": {
                    "file_name": {
                        "type": "string",
                        "key": "file_name",
                        "sort": 0,
                        "title": "文件名称",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": null,
                        "properties": null
                    },
                    "file_url": {
                        "type": "string",
                        "key": "file_url",
                        "sort": 1,
                        "title": "文件地址",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": null,
                        "properties": null
                    },
                    "file_ext": {
                        "type": "string",
                        "key": "file_ext",
                        "sort": 2,
                        "title": "文件后缀",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": null,
                        "properties": null
                    },
                    "file_size": {
                        "type": "number",
                        "key": "file_size",
                        "sort": 3,
                        "title": "文件大小",
                        "description": "",
                        "required": null,
                        "value": null,
                        "encryption": false,
                        "encryption_value": null,
                        "items": null,
                        "properties": null
                    }
                }
            },
            "properties": null
        }
    }
}
JSON
            ,
            true
        )));
        return $input;
    }

    private function getMagicChatImageConvertHighAppService(): MagicChatImageConvertHighAppService
    {
        return di(MagicChatImageConvertHighAppService::class);
    }

    private function getMagicUserDomainService(): MagicUserDomainService
    {
        return di(MagicUserDomainService::class);
    }
}
