<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */
return [
    'general_error' => 'Image generation service error',
    'response_format_error' => 'Invalid response format from image generation service',
    'missing_image_data' => 'Generated image data is invalid',
    'no_valid_image_generated' => 'No valid image was generated',
    'input_image_audit_failed' => 'Input image failed content review',
    'output_image_audit_failed' => 'Generated image failed content review',
    'input_text_audit_failed' => 'Input text failed content review',
    'output_text_audit_failed' => 'Generated text failed content review',
    'text_blocked' => 'Input text contains sensitive content and has been blocked',
    'invalid_prompt' => 'Invalid prompt content',
    'prompt_check_failed' => 'Prompt validation failed',
    'polling_failed' => 'Failed to poll task result',
    'task_timeout' => 'Task execution timed out',
    'invalid_request_type' => 'Invalid request type',
    'missing_job_id' => 'Missing task ID',
    'task_failed' => 'Task execution failed',
    'polling_response_format_error' => 'Invalid polling response format',
    'missing_image_url' => 'Image URL not found',
    'prompt_check_response_error' => 'Invalid prompt validation response format',
    'api_request_failed' => 'Failed to call image generation API',
    'image_to_image_missing_source' => 'Image-to-image generation missing source: image or base64',
    'output_image_audit_failed_with_reason' => 'Unable to generate image, please try different prompts',
    'task_timeout_with_reason' => 'Image generation task not found or has expired',
    'not_found_error_code' => 'Unknown error code',
    'invalid_aspect_ratio' => 'The difference in size ratio of Tucson diagram is too large, and can only be 3 times different',
    'image_url_is_empty' => 'Image url is empty',
];
