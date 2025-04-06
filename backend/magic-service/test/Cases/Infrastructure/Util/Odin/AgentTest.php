<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Infrastructure\Util\Odin;

use App\Domain\Flow\Entity\ValueObject\FlowDataIsolation;
use App\Domain\Flow\Service\MagicFlowAIModelDomainService;
use App\Infrastructure\Util\Odin\Agent;
use App\Infrastructure\Util\Odin\AgentOption;
use App\Infrastructure\Util\Odin\AgentPrompt;
use Hyperf\Odin\Api\OpenAI\Response\ChatCompletionResponse;
use Hyperf\Odin\Message\AssistantMessage;
use Hyperf\Odin\Model\ModelInterface;
use Hyperf\Odin\Tool\AbstractTool;
use HyperfTest\Cases\BaseTest;
use RuntimeException;

/**
 * @internal
 */
class AgentTest extends BaseTest
{
    public function testSimpleChat()
    {
        $options = new AgentOption(
            $this->getModel('gpt-4o-mini-global'),
            '123'
        );
        $options->setBusinessParams([
            'organization_id' => 'UNIT',
            'user_id' => 'unit_user',
            'business_id' => '123456',
        ]);
        $agent = new Agent($options);
        $response = $agent->chat('hello');
        $this->assertNotEmpty((string) $response);
    }

    public function testToolChat()
    {
        $conversationId = uniqid();
        $prompt = new AgentPrompt('你是一个旅行专家，专门负责随机旅游体验，当用户提到要去旅游时，你需要先使用get_rand_city获取到一个随机城市，然后根据城市名称同时调用get_foods_by_city，get_place_by_city。最终生成一个旅游方案');
        $options = new AgentOption(
            model: $this->getModel('gpt-4o-global'),
            conversationId: $conversationId,
            prompt: $prompt
        );
        $options->setBusinessParams([
            'organization_id' => 'UNIT',
            'user_id' => 'unit_user',
            'business_id' => '123456',
        ]);
        $tools = [
            new class extends AbstractTool {
                public string $name = 'get_rand_city';

                public string $description = '获取随机城市名';

                public array $formatParameters = [];

                public function invoke(...$args): array
                {
                    return [
                        'city_name' => '广州',
                    ];
                }
            },
            new class extends AbstractTool {
                public string $name = 'get_foods_by_city';

                public string $description = '通过城市名称获取食美食介绍';

                public array $formatParameters = [
                    'type' => 'object',
                    'required' => [
                        'city_name',
                    ],
                    'properties' => [
                        'city_name' => [
                            'type' => 'string',
                            'description' => '城市名称',
                        ],
                    ],
                ];

                public function invoke(...$args): array
                {
                    return [
                        'foods' => '虾饺、烧卖、叉烧包、凤爪、糯米鸡、奶黄包、流沙包、肠粉、艇仔粥、及第粥、白切鸡、烤乳猪、清平鸡、豉油鸡、盐焗鸡、太爷鸡、菠萝咕咾肉、糖醋咕噜肉、白灼虾、豉汁蒸排骨、梅菜扣肉、酿豆腐、酿苦瓜、冬瓜盅、龙虎斗、红烧乳鸽、蜜汁叉烧、蒜香骨、泮塘马蹄糕、伦教糕、双皮奶、姜撞奶、炒河粉、干炒牛河、湿炒牛河、云吞面、牛杂、萝卜牛杂、煲仔饭、豉汁蒸凤爪、潮州卤水拼盘、花雕鸡、椰子鸡、猪肚鸡、啫啫煲、南乳花生焖猪手、客家酿三宝、避风塘炒蟹、上汤焗龙虾、清蒸石斑鱼、麻婆豆腐、回锅肉、水煮鱼、酸菜鱼。',
                    ];
                }
            },
            new class extends AbstractTool {
                public string $name = 'get_place_by_city';

                public string $description = '通过城市名获取地标';

                public array $formatParameters = [
                    'type' => 'object',
                    'required' => [
                        'city_name',
                    ],
                    'properties' => [
                        'city_name' => [
                            'type' => 'string',
                            'description' => '城市名称',
                        ],
                    ],
                ];

                public function invoke(...$args): array
                {
                    return [
                        'place' => '广州塔、小蛮腰',
                    ];
                }
            },
        ];
        $options->setTools($tools);
        $agent = new Agent($options);
        $response = $agent->chat('我想出去玩 1 天，帮我随机规划一个随机城市旅游吧');
        $this->assertNotEmpty((string) $response);
    }

    public function testComplexTool()
    {
        $conversationId = uniqid();
        $prompt = new AgentPrompt('当用户想要搜索新闻的时候，调用 search_news 获取新闻信息(可以同时调用)，如果工具调用失败，请输出详细报错内容。其他内容就你自己决定输出。当前时间为 ' . date('Y-m-d H:i:s'));
        $options = new AgentOption(
            model: $this->getModel('gpt-4o-global'),
            conversationId: $conversationId,
            prompt: $prompt
        );
        $options->setBusinessParams([
            'organization_id' => 'UNIT',
            'user_id' => 'unit_user',
            'business_id' => '123456',
        ]);
        $tools = [
            new class extends AbstractTool {
                public string $name = 'search_news';

                public string $description = '搜索新闻';

                public array $formatParameters = [
                    'type' => 'object',
                    'required' => [
                        'limit',
                        'rang_time',
                        'keywords',
                    ],
                    'properties' => [
                        'limit' => [
                            'type' => 'integer',
                            'description' => '返回新闻数量',
                        ],
                        'rang_time' => [
                            'type' => 'object',
                            'description' => '时间范围',
                            'required' => [
                                'start',
                                'end',
                            ],
                            'properties' => [
                                'start' => [
                                    'type' => 'string',
                                    'description' => '开始时间。格式:Y-m-d H:i:s',
                                ],
                                'end' => [
                                    'type' => 'string',
                                    'description' => '结束时间。格式:Y-m-d H:i:s',
                                ],
                            ],
                        ],
                        'keywords' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                            'description' => '搜索关键字',
                        ],
                    ],
                ];

                public function invoke(...$args): ?array
                {
                    return [
                        '央视网消息：正在建设的北京城市副中心站综合交通枢纽是亚洲最大的地下综合交通枢纽，也是链接轨道上的京津冀的重要节点。记者从施工方了解到，目前工程的地面主体部分已经基本建设完成，预计明年将能够投入使用',
                        '央视网消息：中国物流与采购联合会12月4日公布11月份中国公路物流运价指数。在市场需求持续恢复的带动下，公路运力供给同步增长，运价指数同比继续保持小幅增长。 ',
                    ];
                }
            },
        ];
        $options->setTools($tools);
        $agent = new Agent($options);
        $response = $agent->chat('帮我查看一下昨天的央视网相关新闻，我想要 10 条');
        $this->assertNotEmpty((string) $response);
        $this->assertSame(1, count($agent->getUsedTools()));
    }

    public function testComplexCO()
    {
        $conversationId = uniqid();
        $prompt = new AgentPrompt('你可以为用户生成随机字符串，调用 get_rand_string 工具来完成');
        $options = new AgentOption(
            model: $this->getModel('gpt-4o-global'),
            conversationId: $conversationId,
            prompt: $prompt
        );
        $options->setBusinessParams([
            'organization_id' => 'UNIT',
            'user_id' => 'unit_user',
            'business_id' => '123456',
        ]);
        $tools = [
            new class extends AbstractTool {
                public string $name = 'get_rand_string';

                public string $description = '生成随机字符串';

                public array $formatParameters = [
                    'type' => 'object',
                    'required' => [],
                    'properties' => [
                        'slat' => [
                            'type' => 'string',
                            'description' => '盐值',
                        ],
                    ],
                ];

                public function invoke(...$args): ?array
                {
                    $slat = $args[0]['slat'] ?? '';
                    if ($slat === 'test') {
                        throw new RuntimeException('生成失败');
                    }
                    return [
                        uniqid(),
                    ];
                }
            },
        ];
        $options->setTools($tools);
        $agent = new Agent($options);
        $response = $agent->chat('帮我生成 5 个随机字符串，其中第二个的 slat 是 test，其他的不需要 slat');
        $this->assertNotEmpty((string) $response);
        $this->assertSame(3, count($agent->getUsedTools()));
    }

    public function testChatAndNotAutoExecuteTools()
    {
        $conversationId = uniqid();
        $prompt = new AgentPrompt('当用户想要搜索新闻的时候，调用 search_news 获取新闻信息(可以同时调用)，如果工具调用失败，请输出详细报错内容。其他内容就你自己决定输出。当前时间为 ' . date('Y-m-d H:i:s'));
        $options = new AgentOption(
            model: $this->getModel('gpt-4o-global'),
            conversationId: $conversationId,
            prompt: $prompt
        );

        $tools = [
            new class extends AbstractTool {
                public string $name = 'search_news';

                public string $description = '搜索新闻';

                public array $formatParameters = [
                    'type' => 'object',
                    'required' => [
                        'limit',
                        'rang_time',
                        'keywords',
                    ],
                    'properties' => [
                        'limit' => [
                            'type' => 'integer',
                            'description' => '返回新闻数量',
                        ],
                        'rang_time' => [
                            'type' => 'object',
                            'description' => '时间范围',
                            'required' => [
                                'start',
                                'end',
                            ],
                            'properties' => [
                                'start' => [
                                    'type' => 'string',
                                    'description' => '开始时间。格式:Y-m-d H:i:s',
                                ],
                                'end' => [
                                    'type' => 'string',
                                    'description' => '结束时间。格式:Y-m-d H:i:s',
                                ],
                            ],
                        ],
                        'keywords' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                            'description' => '搜索关键字',
                        ],
                    ],
                ];

                public function invoke(...$args): ?array
                {
                    return [
                        '央视网消息：正在建设的北京城市副中心站综合交通枢纽是亚洲最大的地下综合交通枢纽，也是链接轨道上的京津冀的重要节点。记者从施工方了解到，目前工程的地面主体部分已经基本建设完成，预计明年将能够投入使用',
                        '央视网消息：中国物流与采购联合会12月4日公布11月份中国公路物流运价指数。在市场需求持续恢复的带动下，公路运力供给同步增长，运价指数同比继续保持小幅增长。 ',
                    ];
                }
            },
        ];
        $options->setTools($tools);
        $agent = new Agent($options);
        $gen = $agent->call('帮我查看一下昨天的央视网相关新闻，我想要 10 条');
        $response = null;
        while ($gen->valid()) {
            /** @var ChatCompletionResponse $response */
            $response = $gen->current();
            if ($response->getFirstChoice()->isFinishedByToolCall()) {
                break;
            }
            $gen->next();
        }
        /** @var AssistantMessage $message */
        $message = $response->getFirstChoice()->getMessage();
        $this->assertInstanceOf(AssistantMessage::class, $message);
        $this->assertSame(1, count($message->getToolCalls()));
    }

    private function getModel(string $name): ModelInterface
    {
        return di(MagicFlowAIModelDomainService::class)->getByName(FlowDataIsolation::create()->setEnabled(false), $name)->createModel();
    }
}
