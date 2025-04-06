<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace App\ErrorCode;

use App\Infrastructure\Core\Exception\Annotation\ErrorMessage;

enum FlowErrorCode: int
{
    #[ErrorMessage(message: 'flow.error.common')]
    case Error = 31000;

    #[ErrorMessage(message: 'flow.error.common_validate_failed')]
    case ValidateFailed = 31001;

    #[ErrorMessage(message: 'flow.error.common_business_exception')]
    case BusinessException = 31002;

    #[ErrorMessage(message: 'flow.error.flow_node_validate_failed')]
    case FlowNodeValidateFailed = 31003;

    #[ErrorMessage(message: 'flow.error.message_error')]
    case MessageError = 31004;

    #[ErrorMessage(message: 'flow.error.execute_failed')]
    case ExecuteFailed = 31005;

    #[ErrorMessage(message: 'flow.error.execute_validate_failed')]
    case ExecuteValidateFailed = 31006;

    #[ErrorMessage(message: 'flow.error.knowledge_validate_failed')]
    case KnowledgeValidateFailed = 31007;

    #[ErrorMessage(message: 'flow.error.access_denied')]
    case AccessDenied = 31008;
}
