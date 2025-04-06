<?php

declare(strict_types=1);
/**
 * Copyright (c) The Magic , Distributed under the software license
 */

namespace HyperfTest\Cases\Domain\LLM\Service;

use App\Application\Chat\Service\MagicChatAISearchAppService;
use App\Domain\Chat\DTO\AISearch\Request\MagicChatAggregateSearchReqDTO;
use App\Domain\Chat\DTO\Message\ChatMessage\TextMessage;
use App\Domain\Chat\Entity\ValueObject\AggregateSearch\SearchDeepLevel;
use App\Domain\Chat\Entity\ValueObject\AISearchCommonQueryVo;
use App\Domain\Chat\Entity\ValueObject\SearchEngineType;
use App\Domain\Chat\Service\MagicLLMDomainService;
use Hyperf\Odin\Memory\MessageHistory;
use HyperfTest\Cases\BaseTest;

use function di;

/**
 * @internal
 */
class MagicLLMDomainServiceTest extends BaseTest
{
    public function testGeneratePPTFromMindMap()
    {
        $mindMap = <<<'MINDMAP'
        - KK集团概述
          - 创立与总部
            - 成立于2015年
            - 总部位于中国广东省深圳市福田区梅林街道梅都社区中康路136号深圳新一代产业园
          - 创始人
            - 吴悦宁
              - 连续创业者
              - 在中国潮流零售行业发挥重要作用
          - 主要业务
            - 潮流零售业务
            - 多品牌战略
              - KKV：综合性生活方式潮流零售品牌
              - THE COLORIST 调色师：大型美妆潮流零售品牌
              - X11：全球潮玩文化潮流零售品牌
              - KK 馆：迷你生活方式集合店
            - 产品类别
              - 美妆
              - 潮玩
              - 食品及饮品
              - 家居品
              - 文具
              - SKU超过2万种
          - 全球影响力
            - 全球化战略
            - 门店分布
              - 中国：31个省的190多个城市
              - 印度尼西亚：22个城市
              - 总计696家门店截至2023年7月24日
            - 新零售发展
              - 《2023年胡润全球独角兽榜》入选
            - 国际市场扩张
              - 东南亚市场布局
              - 展示扩展能力和影响力
        MINDMAP;
        $queryVo = (new AISearchCommonQueryVo())
            ->setConversationId('713077908042690561')
            ->setMessageHistory(new MessageHistory());
        $ppt = $this->getMagicLLMDomainService()->generatePPTFromMindMap($queryVo, $mindMap);
        var_dump($ppt);
        $this->assertTrue(true);
    }

    /**
     * 测试搜索结果.
     */
    public function testGetSearchResult()
    {
        $queryVo = (new AISearchCommonQueryVo())
            ->setConversationId('713077908042690561')
            ->setMessageHistory(new MessageHistory())
            ->setUserMessage('KK集团')
            ->setSearchEngine(SearchEngineType::Bing)
            ->setFilterSearchContexts(true)
            ->setGenerateSearchKeywords(true)
            ->setLanguage('zh_CN');
        $res = $this->getMagicLLMDomainService()->getSearchResults($queryVo, true);
        var_dump($res);
        $this->assertTrue(true);
    }

    public function testFilterSummarize()
    {
        $llmResponse = "# 吴悦宁的事迹\n\n## 教育背景和早期职业经历\n吴悦宁出生于1984年，毕业于东莞理工学院软件工程系[[citation:18]]。毕业后，他进入互联网行业，最初在亿聚网担任产品经理。他的职业生涯起步并不顺利，最初在求职时被拒绝，但凭借对公司的深入了解和提出的改进建议，他成功获取了职位[[citation:7]][[citation:18]]。他在亿聚网工作一年后，与两位大学同学创立了“叮客网”，尽管最终未能成功融资，但这次创业积累了宝贵的运营和市场经验[[citation:18]]。\n\n## 创业经历的关键节点\n1. **初次创业尝试**：在亿聚网积累了一年的经验后，吴悦宁辞职创立了专注于网络游戏体验的“叮客网”，注册会员一度达百万，但由于融资未果而关闭[[citation:18]]。\n   \n2. **KK集团的创立**：2014年，他创立了广东快客电子商务有限公司（KK集团），最初定位为进口商品集合店KK馆。这次创业经历了初期的失败，如社区便利店模式的失败，但通过转型到购物中心，最终找到了适合的经营模式[[citation:18]][[citation:7]]。\n\n3. **战略调整和品牌扩展**：KK馆在进入购物中心后，逐步发展成为综合休闲娱乐场所。随后，吴悦宁专注于销售进口商品，并形成了爆品策略，加强了海外供应链的建设[[citation:7]]。此后，他通过线上线下的双向发展，进一步扩大了市场覆盖[[citation:7]][[citation:17]]。\n\n## 创办的KK集团旗下品牌\nKK集团实施多品牌战略，旗下品牌包括：\n1. **KK馆**：最早创立的品牌，定位为进口品集合店[[citation:18]]。\n2. **KKV**：综合性生活方式潮流零售品牌[[citation:18]]。\n3. **THE COLORIST调色师**：大型美妆潮流零售品牌[[citation:18]]。\n4. **X11**：潮玩文化潮流零售品牌，涵盖手办、潮流文创等产品[[citation:18]]。\n\n## 零售行业内的创新理念\n吴悦宁的创新理念主要包括：\n1. **多品牌战略与渠道革命**：通过多个品牌满足年轻消费者的多样化需求[[citation:18]][[citation:16]]。\n2. **“人、货、场”的重塑**：在零售的“人、货、场”三个维度上进行重构，通过高颜值的空间设计和高性价比的选品吸引年轻消费者[[citation:17]]。\n3. **爆品策略和供应链管理**：通过强大的买手团队和严谨的筛选机制，确保产品质量和吸引力[[citation:18]]。\n4. **线上线下协同**：通过线上线下的协同效应增强用户体验，扩大市场覆盖[[citation:17]]。\n5. **以美学提升引流效率**：通过美学设计提升品牌的引流效率，迎合年轻一代对美学和个性的高要求[[citation:20]]。\n\n这些理念帮助KK集团在快速变化的市场中保持竞争力，尤其在针对年轻消费者的需求和消费行为方面。";
        $searchContexts = [
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '潮汕80后致富路：创业7年，打造估值200亿新物种 - 哔哩哔哩',
                'url' => 'https://www.bilibili.com/opus/594252031566371621',
                'datePublished' => '2021-11-18 08:00:00',
                'datePublishedDisplayText' => '2021-11-18 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.bilibili.com/opus/594252031566371621',
                'snippet' => '遭遇挫折后的吴悦宁并没有放弃自己的创业路，而是换了一种打法继续经营KK馆。 此前，KK馆主打社区，是一家进口商品小店。 升级后，主打购物中心，是一家集进口产品、餐饮、咖啡厅、书吧于一体的综合休闲娱乐空间。',
                'dateLastCrawled' => '2021-11-18 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4797521907567139&mkt=zh-CN&setlang=zh-CN&w=GEJCgmDjerCFqTs3avkPntsLGgjGuOK8',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 1,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.3',
                'name' => '又一独角兽奔赴IPO：KK来了，估值200亿 - 澎湃新闻',
                'url' => 'https://m.thepaper.cn/baijiahao_15242804',
                'datePublished' => '2021-11-11 08:00:00',
                'datePublishedDisplayText' => '2021-11-11 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://m.thepaper.cn/baijiahao_15242804',
                'snippet' => '成立于6年前的KK集团，背后是一位低调的潮汕80后——吴悦宁。2015年，从未接触过零售业的吴悦宁嗅到了进口商品的爆发性需求，在广东东莞创办了一家进口商品集合店KK馆。',
                'dateLastCrawled' => '2021-11-11 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4719714268362498&mkt=zh-CN&setlang=zh-CN&w=bsoAtDnIkExiRyNT_TBtMT3F7teeoyU3',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 2,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '潮汕80后致富路：创业7年，打造估值200亿新物种 - 哔哩哔哩',
                'url' => 'https://www.bilibili.com/opus/594252031566371621',
                'datePublished' => '2021-11-18 08:00:00',
                'datePublishedDisplayText' => '2021-11-18 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.bilibili.com/opus/594252031566371621',
                'snippet' => '遭遇挫折后的吴悦宁并没有放弃自己的创业路，而是换了一种打法继续经营KK馆。 此前，KK馆主打社区，是一家进口商品小店。 升级后，主打购物中心，是一家集进口产品、餐饮、咖啡厅、书吧于一体的综合休闲娱乐空间。',
                'dateLastCrawled' => '2021-11-18 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4797521907567139&mkt=zh-CN&setlang=zh-CN&w=GEJCgmDjerCFqTs3avkPntsLGgjGuOK8',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 3,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '潮汕80后致富路：创业7年，打造估值200亿新物种 - 哔哩哔哩',
                'url' => 'https://www.bilibili.com/opus/594252031566371621',
                'datePublished' => '2021-11-18 08:00:00',
                'datePublishedDisplayText' => '2021-11-18 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.bilibili.com/opus/594252031566371621',
                'snippet' => '遭遇挫折后的吴悦宁并没有放弃自己的创业路，而是换了一种打法继续经营KK馆。 此前，KK馆主打社区，是一家进口商品小店。 升级后，主打购物中心，是一家集进口产品、餐饮、咖啡厅、书吧于一体的综合休闲娱乐空间。',
                'dateLastCrawled' => '2021-11-18 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4797521907567139&mkt=zh-CN&setlang=zh-CN&w=GEJCgmDjerCFqTs3avkPntsLGgjGuOK8',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 4,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '潮汕80后致富路：创业7年，打造估值200亿新物种 - 哔哩哔哩',
                'url' => 'https://www.bilibili.com/opus/594252031566371621',
                'datePublished' => '2021-11-18 08:00:00',
                'datePublishedDisplayText' => '2021-11-18 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.bilibili.com/opus/594252031566371621',
                'snippet' => '遭遇挫折后的吴悦宁并没有放弃自己的创业路，而是换了一种打法继续经营KK馆。 此前，KK馆主打社区，是一家进口商品小店。 升级后，主打购物中心，是一家集进口产品、餐饮、咖啡厅、书吧于一体的综合休闲娱乐空间。',
                'dateLastCrawled' => '2021-11-18 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4797521907567139&mkt=zh-CN&setlang=zh-CN&w=GEJCgmDjerCFqTs3avkPntsLGgjGuOK8',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 5,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.0',
                'name' => '吴悦宁 - 百度百科',
                'url' => 'https://baike.baidu.com/item/%E5%90%B4%E6%82%A6%E5%AE%81/59011472',
                'datePublished' => null,
                'datePublishedDisplayText' => null,
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://baike.baidu.com/item/吴悦宁',
                'snippet' => '吴悦宁，KK集团创始人兼CEO，作为中国移动互联网大潮兴起时的首批产品经理，早期曾创立互联网企业，后投身于零售革新事业。 在他的带领下，迷你生活集合品牌「KK馆」、精致生活集合品牌「KKV」、大型美妆集合品牌「THE COLORIST调色师」、全球潮玩集合品牌「X11」等多个优质品牌均已成为潮流零售领域的强劲力量。',
                'dateLastCrawled' => null,
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86+%E5%85%B3%E9%94%AE%E8%8A%82%E7%82%B9&d=4909422985159741&mkt=zh-CN&setlang=zh-CN&w=EroKISyfA7q4jEFChNUwRVpyL_vdR8i9',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 6,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团的新渠道“革命” 不做活动，连续孵化爆款新品牌，这家 ...',
                'url' => 'https://xueqiu.com/7236209913/179742763',
                'datePublished' => '2021-05-13 08:00:00',
                'datePublishedDisplayText' => '2021-05-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://xueqiu.com/7236209913/179742763',
                'snippet' => '在创业早期，吴悦宁“交了三年学费追求本质”，经过不断的试错与迭代，终于探索出消费变革时期零售的底层逻辑和KK集团独特的实践方法论。 近5年来，KK集团增速高且稳健。',
                'dateLastCrawled' => '2021-05-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86+%E5%85%B3%E9%94%AE%E8%8A%82%E7%82%B9&d=4975539704645767&mkt=zh-CN&setlang=zh-CN&w=zrmiOyKHgBzWnVTVyjjjNrupsiCkghWe',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 7,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团的新渠道“革命” 不做活动，连续孵化爆款新品牌，这家 ...',
                'url' => 'https://xueqiu.com/7236209913/179742763',
                'datePublished' => '2021-05-13 08:00:00',
                'datePublishedDisplayText' => '2021-05-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://xueqiu.com/7236209913/179742763',
                'snippet' => '在创业早期，吴悦宁“交了三年学费追求本质”，经过不断的试错与迭代，终于探索出消费变革时期零售的底层逻辑和KK集团独特的实践方法论。 近5年来，KK集团增速高且稳健。',
                'dateLastCrawled' => '2021-05-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86+%E5%85%B3%E9%94%AE%E8%8A%82%E7%82%B9&d=4975539704645767&mkt=zh-CN&setlang=zh-CN&w=zrmiOyKHgBzWnVTVyjjjNrupsiCkghWe',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 8,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.3',
                'name' => '又一独角兽奔赴IPO：KK来了，估值200亿 - 澎湃新闻',
                'url' => 'https://m.thepaper.cn/baijiahao_15242804',
                'datePublished' => '2021-11-11 08:00:00',
                'datePublishedDisplayText' => '2021-11-11 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://m.thepaper.cn/baijiahao_15242804',
                'snippet' => '成立于6年前的KK集团，背后是一位低调的潮汕80后——吴悦宁。2015年，从未接触过零售业的吴悦宁嗅到了进口商品的爆发性需求，在广东东莞创办了一家进口商品集合店KK馆。',
                'dateLastCrawled' => '2021-11-11 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4719714268362498&mkt=zh-CN&setlang=zh-CN&w=bsoAtDnIkExiRyNT_TBtMT3F7teeoyU3',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 9,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '2021年《财富》中国40位40岁以下的商界精英 - 吴悦宁 ...',
                'url' => 'https://www.fortunechina.com/detail/people/4040/2021/8/wuyuening.htm',
                'datePublished' => '2022-04-16 23:07:36',
                'datePublishedDisplayText' => '2022-04-16 23:07:36',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.fortunechina.com/detail/people/4040/2021/8/...',
                'snippet' => '吴悦宁是一名连续创业者，他创立的KK集团是国内领先的新零售生态企业，旗下有KK馆、KKV、THE COLORIST调色师和X11等零售连锁品牌。 KK集团旗下品牌均以14岁至35岁的年轻群体切入，这一部分群体占其整体消费客群的近八成。',
                'dateLastCrawled' => '2022-04-16 23:07:36',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=4695722574940634&mkt=zh-CN&setlang=zh-CN&w=M-zxY5xnfXhXXgA5A3juiUkN2tslfy1h',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 10,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.0',
                'name' => '吴悦宁 - 百度百科',
                'url' => 'https://baike.baidu.com/item/%E5%90%B4%E6%82%A6%E5%AE%81/59011472',
                'datePublished' => null,
                'datePublishedDisplayText' => null,
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://baike.baidu.com/item/吴悦宁',
                'snippet' => '吴悦宁，KK集团创始人兼CEO，作为中国移动互联网大潮兴起时的首批产品经理，早期曾创立互联网企业，后投身于零售革新事业。 在他的带领下，迷你生活集合品牌「KK馆」、精致生活集合品牌「KKV」、大型美妆集合品牌「THE COLORIST调色师」、全球潮玩集合品牌「X11」等多个优质品牌均已成为潮流零售领域的强劲力量。',
                'dateLastCrawled' => null,
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86+%E5%85%B3%E9%94%AE%E8%8A%82%E7%82%B9&d=4909422985159741&mkt=zh-CN&setlang=zh-CN&w=EroKISyfA7q4jEFChNUwRVpyL_vdR8i9',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 11,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团：国内领先的潮流零售企业',
                'url' => 'https://www.dtyq.cn/news-detail/85',
                'datePublished' => '2022-01-13 08:00:00',
                'datePublishedDisplayText' => '2022-01-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.dtyq.cn/news-detail/85',
                'snippet' => '目前，KK 集团成功孵化四个零售品牌，即 KKV、THE COLORIST 调色师、X11 及 KK 馆，向消费者提供横跨 18 个主要品类中超过 20,000 个 SKU 的各种潮流产品，涵盖美妆、潮玩、食品及饮品、家居品、文具等主要核心生活用品类别，在中国 31 个省的 169 个城市以及印度尼西亚的一个城市建立具有 680 家门店的门店网络 [5]。 物中心最热门的主力店品牌之一。 在超 300 至 3500 平方的标志性超大空间里，集合了品质日用、精美食品、进口酒类、匠心文具、3C 小家电等 18 种关于精致生活方式的主题，兼具爆款进口品牌和潮流新国货品牌超过 20000 个 SKU，旨在为 Z 世代创造更精致的生活方式。',
                'dateLastCrawled' => '2022-01-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=5041647839437244&mkt=zh-CN&setlang=zh-CN&w=0uVxl5kOn4L0rSRv0JalKXIic73pHrqU',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 12,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团：国内领先的潮流零售企业',
                'url' => 'https://www.dtyq.cn/news-detail/85',
                'datePublished' => '2022-01-13 08:00:00',
                'datePublishedDisplayText' => '2022-01-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.dtyq.cn/news-detail/85',
                'snippet' => '目前，KK 集团成功孵化四个零售品牌，即 KKV、THE COLORIST 调色师、X11 及 KK 馆，向消费者提供横跨 18 个主要品类中超过 20,000 个 SKU 的各种潮流产品，涵盖美妆、潮玩、食品及饮品、家居品、文具等主要核心生活用品类别，在中国 31 个省的 169 个城市以及印度尼西亚的一个城市建立具有 680 家门店的门店网络 [5]。 物中心最热门的主力店品牌之一。 在超 300 至 3500 平方的标志性超大空间里，集合了品质日用、精美食品、进口酒类、匠心文具、3C 小家电等 18 种关于精致生活方式的主题，兼具爆款进口品牌和潮流新国货品牌超过 20000 个 SKU，旨在为 Z 世代创造更精致的生活方式。',
                'dateLastCrawled' => '2022-01-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=5041647839437244&mkt=zh-CN&setlang=zh-CN&w=0uVxl5kOn4L0rSRv0JalKXIic73pHrqU',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 13,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团：国内领先的潮流零售企业',
                'url' => 'https://www.dtyq.cn/news-detail/85',
                'datePublished' => '2022-01-13 08:00:00',
                'datePublishedDisplayText' => '2022-01-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.dtyq.cn/news-detail/85',
                'snippet' => '目前，KK 集团成功孵化四个零售品牌，即 KKV、THE COLORIST 调色师、X11 及 KK 馆，向消费者提供横跨 18 个主要品类中超过 20,000 个 SKU 的各种潮流产品，涵盖美妆、潮玩、食品及饮品、家居品、文具等主要核心生活用品类别，在中国 31 个省的 169 个城市以及印度尼西亚的一个城市建立具有 680 家门店的门店网络 [5]。 物中心最热门的主力店品牌之一。 在超 300 至 3500 平方的标志性超大空间里，集合了品质日用、精美食品、进口酒类、匠心文具、3C 小家电等 18 种关于精致生活方式的主题，兼具爆款进口品牌和潮流新国货品牌超过 20000 个 SKU，旨在为 Z 世代创造更精致的生活方式。',
                'dateLastCrawled' => '2022-01-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=5041647839437244&mkt=zh-CN&setlang=zh-CN&w=0uVxl5kOn4L0rSRv0JalKXIic73pHrqU',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 14,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.2',
                'name' => 'KK集团：国内领先的潮流零售企业',
                'url' => 'https://www.dtyq.cn/news-detail/85',
                'datePublished' => '2022-01-13 08:00:00',
                'datePublishedDisplayText' => '2022-01-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.dtyq.cn/news-detail/85',
                'snippet' => '目前，KK 集团成功孵化四个零售品牌，即 KKV、THE COLORIST 调色师、X11 及 KK 馆，向消费者提供横跨 18 个主要品类中超过 20,000 个 SKU 的各种潮流产品，涵盖美妆、潮玩、食品及饮品、家居品、文具等主要核心生活用品类别，在中国 31 个省的 169 个城市以及印度尼西亚的一个城市建立具有 680 家门店的门店网络 [5]。 物中心最热门的主力店品牌之一。 在超 300 至 3500 平方的标志性超大空间里，集合了品质日用、精美食品、进口酒类、匠心文具、3C 小家电等 18 种关于精致生活方式的主题，兼具爆款进口品牌和潮流新国货品牌超过 20000 个 SKU，旨在为 Z 世代创造更精致的生活方式。',
                'dateLastCrawled' => '2022-01-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=5041647839437244&mkt=zh-CN&setlang=zh-CN&w=0uVxl5kOn4L0rSRv0JalKXIic73pHrqU',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 15,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.7',
                'name' => '重构人、货、场，吴悦宁讲述KK集团零售业态 - 腾讯云开发 ...',
                'url' => 'https://cloud.tencent.com/developer/news/871067',
                'datePublished' => '2021-10-28 08:00:00',
                'datePublishedDisplayText' => '2021-10-28 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://cloud.tencent.com/developer/news/871067',
                'snippet' => '吴悦宁在对当下市场、零售行业、品牌、消费者、供应商等多个方面进行调查后，提出了通过“以美学提升引流效率、以科技提升转化效率”的潮流零售理念，在“人、货、场”细分基础上的优化和布局，致力于打造当下这个时代的“效率型零售企业”。 “人”是零售的起点，通过“场”与“货”产生联系。 每个消费者来到购物中心，背后是不同的背景、诉求和消费能力。 KK集团吴悦宁认为，一个好的购物中心的影响力可以超过十个普通购物中心的影响力——有了人气、流量都非常好的位置，就能有更多的背书，去抢占上游品牌方的供给。 因此，在店铺选址上，KK集团专门选择人流量大、位于市中心的购物中心。 “货”是零售的关键，KK集团吴悦宁非常清晰地表示，消费者更愿意为有品质的好货付费。',
                'dateLastCrawled' => '2021-10-28 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=4667929858935794&mkt=zh-CN&setlang=zh-CN&w=kLvLRf_AhbVKuqKUBuxE9iL4970rPv1N',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 16,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.1',
                'name' => 'KK馆吴悦宁 | 从亏损千万到融资6亿，拥抱新零售4年开店200家',
                'url' => 'https://www.sohu.com/a/317695424_120099817',
                'datePublished' => '2019-05-31 08:00:00',
                'datePublishedDisplayText' => '2019-05-31 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.sohu.com/a/317695424_120099817',
                'snippet' => '2007年，吴悦宁这位潮州小伙从东莞理工学院计算机专业毕业，8年来，他已经从一个校园创客蜕变为东莞互联网圈子里颇有名气的企业家。 而立之年，他又开始了二次创业打造跨境O2O平台既东莞保税体验店。 如今，该项目已经拿到巨额风投。 大学毕业后，吴悦宁参加了当时著名的互联网公司“亿聚网”的面试，但他的简历在一众名校毕业生中并未脱颖而出。 吴悦宁没有选择放弃，而是直接通过“霸面”的形式找到了公司负责人，当时他就拿了三张纸，并在上面写了他们公司有什么样的问题还可以改进。 最终，他凭借这份超人的勇气与扎实的专业基础在公司留了下来，成为一名产品经理。 当时的吴悦宁就想去最牛的公司，想着可以打开眼界，也可以学到更多不一样的东西。 然而在一年之后，他辞去了这份在旁人看来非常难得的工作，回到东莞创业。',
                'dateLastCrawled' => '2019-05-31 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4959815820205161&mkt=zh-CN&setlang=zh-CN&w=CgJJPNUmr1nPdsD-MWrv8p4tNFimMhD0',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 17,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '潮汕80后致富路：创业7年，打造估值200亿新物种 - 哔哩哔哩',
                'url' => 'https://www.bilibili.com/opus/594252031566371621',
                'datePublished' => '2021-11-18 08:00:00',
                'datePublishedDisplayText' => '2021-11-18 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.bilibili.com/opus/594252031566371621',
                'snippet' => '遭遇挫折后的吴悦宁并没有放弃自己的创业路，而是换了一种打法继续经营KK馆。 此前，KK馆主打社区，是一家进口商品小店。 升级后，主打购物中心，是一家集进口产品、餐饮、咖啡厅、书吧于一体的综合休闲娱乐空间。',
                'dateLastCrawled' => '2021-11-18 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+%E5%88%9B%E4%B8%9A%E7%BB%8F%E5%8E%86&d=4797521907567139&mkt=zh-CN&setlang=zh-CN&w=GEJCgmDjerCFqTs3avkPntsLGgjGuOK8',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 18,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.6',
                'name' => '2021年《财富》中国40位40岁以下的商界精英 - 吴悦宁 ...',
                'url' => 'https://www.fortunechina.com/detail/people/4040/2021/8/wuyuening.htm',
                'datePublished' => '2022-04-16 23:07:36',
                'datePublishedDisplayText' => '2022-04-16 23:07:36',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://www.fortunechina.com/detail/people/4040/2021/8/...',
                'snippet' => '吴悦宁是一名连续创业者，他创立的KK集团是国内领先的新零售生态企业，旗下有KK馆、KKV、THE COLORIST调色师和X11等零售连锁品牌。 KK集团旗下品牌均以14岁至35岁的年轻群体切入，这一部分群体占其整体消费客群的近八成。',
                'dateLastCrawled' => '2022-04-16 23:07:36',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=4695722574940634&mkt=zh-CN&setlang=zh-CN&w=M-zxY5xnfXhXXgA5A3juiUkN2tslfy1h',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 19,
            ],
            [
                'id' => 'https://api.bing.microsoft.com/api/v7/#WebPages.1',
                'name' => 'KK集团的新渠道“革命” 不做活动，连续孵化爆款新品牌，这家 ...',
                'url' => 'https://xueqiu.com/7236209913/179742763',
                'datePublished' => '2021-05-13 08:00:00',
                'datePublishedDisplayText' => '2021-05-13 08:00:00',
                'isFamilyFriendly' => true,
                'displayUrl' => 'https://xueqiu.com/7236209913/179742763',
                'snippet' => 'KK集团创始人兼CEO吴悦宁出身于IT行业，有着多年软件行业从业经验，可以说是 中国移动 互联网的初代产品经理，2014年开始投身零售行业，创办了当时定位进口品集合店的KK馆。 在创业早期，吴悦宁“交了三年学费追求本质”，经过不断的试错与迭代，终于探索出消费变革时期零售的底层逻辑和KK集团独特的实践方法论。 近5年来，KK集团增速高且稳健。 2019年，公司开始践行多品牌战略，企业也适时升级由KK馆更名为KK集团，并推出生活方式集合店品牌KKV和两个细分品类品牌：新生代一站式美妆零售品牌THE COLORIST调色师和全球潮玩集合品牌X11。 目前，KK集团的门店遍布海内外超100多个城市，并在持续扩张中。',
                'dateLastCrawled' => '2021-05-13 08:00:00',
                'cachedPageUrl' => 'http://cncc.bingj.com/cache.aspx?q=%E5%90%B4%E6%82%A6%E5%AE%81+KK%E9%9B%86%E5%9B%A2+%E5%93%81%E7%89%8C&d=4975539704645767&mkt=zh-CN&setlang=zh-CN&w=zrmiOyKHgBzWnVTVyjjjNrupsiCkghWe',
                'language' => 'en',
                'isNavigational' => false,
                'noCache' => false,
                'index' => 20,
            ],
        ];
        // 使用正则表达式匹配 [[citation:x]] 中的 x
        $matches = [];
        preg_match_all('/\[\[citation:(\d+)\]\]/', $llmResponse, $matches);
        $citations = array_values(array_unique($matches[1]));
        foreach ($citations as $index => $match) {
            $newIndex = $index + 1;
            $llmResponse = str_replace("[[citation:{$match}]]", "[[citation:{$newIndex}]]", $llmResponse);
        }
        // 使用正则表达式匹配 [[citation:x]] 中的 x
        $matches = [];
        preg_match_all('/\[\[citation:(\d+)\]\]/', $llmResponse, $matches);
        $citations = array_values(array_unique($matches[1]));
        // 根据总结筛选和重排搜索结果
        $existSearchContexts = [];
        $filteredSearchContexts = [];
        $curIndex = 0;
        foreach ($citations as $index => $match) {
            $currentUrl = $searchContexts[$match - 1]['url'];

            // 检查 URL 是否已存在，如果存在，使用已存在的索引
            if (! isset($existSearchContexts[$currentUrl])) {
                // 添加新的搜索上下文，并更新索引
                $filteredSearchContext = $searchContexts[$match - 1];
                $filteredSearchContext['index'] = ++$curIndex;
                $filteredSearchContexts[] = $filteredSearchContext;
                $existSearchContexts[$currentUrl] = $filteredSearchContext['index'];
            }
            // 获取更新后的索引
            $newIndex = $existSearchContexts[$currentUrl] ?? $index + 1;
            // 更新响应中的引用
            $llmResponse = str_replace("[[citation:{$match}]]", "[[citation:{$newIndex}]]", $llmResponse);
        }
        var_dump($filteredSearchContexts);
        $this->assertTrue(true);
    }

    // 中文
    public function testSearchWithBing1(): void
    {
        $userMessage = 'KK集团';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithBing($userMessage, false, 'zh_CN');
        var_dump($res);
        $this->markTestSkipped();
    }

    // 英文
    public function testSearchWithBing2(): void
    {
        $userMessage = 'what is Microsoft?';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithBing($userMessage, false, 'en_US');
        var_dump($res);
        $this->markTestSkipped();
    }

    // 马来语
    public function testSearchWithBing3(): void
    {
        $userMessage = 'syarikat';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithBing($userMessage, false, 'ms_MY');
        var_dump($res);
        $this->markTestSkipped();
    }

    // 印尼语
    public function testSearchWithBing4(): void
    {
        $userMessage = 'Bintang dan Laut';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithBing($userMessage, false, 'th_TH');
        var_dump($res);
        $this->markTestSkipped();
    }

    // 越南语
    public function testSearchWithBing5(): void
    {
        $userMessage = 'Ngôi sao và biển';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithBing($userMessage, false, 'vi_VN');
        var_dump($res);
        $this->markTestSkipped();
    }

    public function testSearchWithDuckDuckGo(): void
    {
        // 本地开发需要开启代理
        $this->markTestSkipped();
        $userMessage = 'KK集团';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithDuckDuckGo($userMessage);
        var_dump($res);
    }

    public function testSearchWithJina(): void
    {
        $userMessage = 'KK集团';
        $service = $this->getMagicLLMDomainService();
        $res = $service->searchWithJina($userMessage);
        var_dump($res);
        $this->markTestSkipped();
    }

    public function testAggregateSearch(): void
    {
        $conversationId = '735984192402382848'; // 会话id
        $topicId = '735984192469491712';
        $userMessage = '安井食品的基本信息和营收情况';
        $searchKeywordMessage = new TextMessage();
        $searchKeywordMessage->setContent($userMessage);
        $service = $this->getMagicChatAISearchAPPService();
        $dto = (new MagicChatAggregateSearchReqDTO())
            ->setTopicId($topicId)
            ->setConversationId($conversationId)
            ->setSearchDeepLevel(SearchDeepLevel::DEEP)
            ->setUserMessage($searchKeywordMessage);
        $service->aggregateSearch($dto);
        $this->markTestSkipped();
    }

    private function getMagicLLMDomainService(): MagicLLMDomainService
    {
        return di()->get(MagicLLMDomainService::class);
    }

    private function getMagicChatAISearchAPPService(): MagicChatAISearchAppService
    {
        return di()->get(MagicChatAISearchAppService::class);
    }
}
