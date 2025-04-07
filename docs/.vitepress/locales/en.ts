export default {
  label: 'English',
  lang: 'en',
  link: '/',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tutorial', link: '/tutorial/magic-info/index' },
      { text: 'Development', link: '/development/quick-start/quick-introduction' }
    ],
    sidebar: {
      '/tutorial/': [
        {
          text: 'Magic Introduction',
          collapsed: false,
          items: [
            { text: 'What is Magic', link: '/tutorial/magic-info/index' },
            { text: 'Terminology', link: '/tutorial/magic-info/names' },
            { text: 'Core Features', link: '/tutorial/magic-info/core-function' },
            { text: 'Open Source and Enterprise Edition', link: '/tutorial/magic-info/opensource-enterprise' },
          ]
        },
        {
          text: 'Quick Start',
          collapsed: false,
          items: [
            {
              text: 'Create AI Assistant',
              collapsed: false,
              items: [
                { text: 'Key Concepts', link: '/tutorial/quick-start/build-a-bot/Key concepts.md' },
                { text: 'Build Your First AI Assistant', link: '/tutorial/quick-start/build-a-bot/quickly-build-an-agent' },
                { text: 'Quickly Build an AI Translation Assistant', link: '/tutorial/quick-start/build-a-bot/quick-build-AI-translation-assistant' },
               
                { text: 'Tools',
                  collapsed: false,
                  items: 
                  [
                    { text: 'Create Tools',  link: '/tutorial/quick-start/build-a-bot/tools/build-a-tool', },
                  ] },
              ]
            },
            {
              text: 'Model Management',
              collapsed: false,
              items: [
                { text: 'Large Language Model Management', link: '/tutorial/quick-start/manage-llm/llm' },
              ]
            },
           
          ]
        },
        
        {
          text: 'Basic Concepts',
          collapsed: false,
          items: [
            {
              text: 'Nodes',
              items: [
                {
                  text: 'Basic Nodes',
                  items: [
                    { text: 'Start Node', link: '/tutorial/basic/node/start-node' },
                    { text: 'Reply Node', link: '/tutorial/basic/node/reply-node' },
                    { text: 'Wait Node', link: '/tutorial/basic/node/wait-node' },
                    { text: 'End Node', link: '/tutorial/basic/node/end-node' },
                  ]
                },
                {
                  text: 'Large Models',
                  items: [
                    { text: 'Large Model Node', link: '/tutorial/basic/node/Large-model' },
                    { text: 'Intent Recognition Node', link: '/tutorial/basic/node/Intent-recognition' },
                  ]
                },
                {
                  text: 'Operations',
                  items: [
                    { text: 'Knowledge Retrieval Node', link: '/tutorial/basic/node/Knowledge-retrieval' },
                    { text: 'Create Group Chat Node', link: '/tutorial/basic/node/Create-group-chat' },
                    { text: 'Image Generation Node', link: '/tutorial/basic/node/Image-generation' },
                    { text: 'Personnel Retrieval Node', link: '/tutorial/basic/node/Personnel-retrieval' },
                    { text: 'HTTP Request Node', link: '/tutorial/basic/node/HTTP-request' },
                    { text: 'Subprocess Node', link: '/tutorial/basic/node/Subprocess' },
                    { text: 'Loop Node', link: '/tutorial/basic/node/Loop' },
                    { text: 'Selector Node', link: '/tutorial/basic/node/Selector' },
                    { text: 'Tool Node', link: '/tutorial/basic/node/Tool' },
                    { text: 'Code Execution Node', link: '/tutorial/basic/node/Code-execution' },
                    { text: 'Cloud Document Parsing Node', link: '/tutorial/basic/node/Cloud-document-parsing' },
                    { text: 'Document Parsing Node', link: '/tutorial/basic/node/Document-parsing' },
                    { text: 'Spreadsheet Parsing Node', link: '/tutorial/basic/node/Spreadsheet-parsing' },
                  ]
                },
                {
                  text: 'Data Processing',
                  items: [
                    { text: 'Data Storage Node', link: '/tutorial/basic/node/Data-storage' },
                    { text: 'Data Loading Node', link: '/tutorial/basic/node/Data-loading' },
                    { text: 'Historical Message Query Node', link: '/tutorial/basic/node/Historical-message-query' },
                    { text: 'Historical Message Storage Node', link: '/tutorial/basic/node/Historical-message-storage' },
                    { text: 'Variable Saving Node', link: '/tutorial/basic/node/Variable-saving' },
                    { text: 'Vector Deletion Node', link: '/tutorial/basic/node/Vector-deletion' },
                    { text: 'Vector Search Node', link: '/tutorial/basic/node/Vector-search' },
                    { text: 'Vector Storage Node', link: '/tutorial/basic/node/Vector-storage' },
                    { text: 'Vector Knowledge Base Matching Node', link: '/tutorial/basic/node/Vector-knowledge-base-matching' },
                    { text: 'Text Segmentation Node', link: '/tutorial/basic/node/Text-segmentation' },
                  ]
                },
              ]
            },
            {
              text: 'Flow',
              link: '/tutorial/basic/flow/what-is-flow',
              items: [
                { text: 'Build a Flow', link: '/tutorial/basic/flow/build-a-flow' },
              ]
            }
          ],
        },
      ],
      '/development/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Quick Introduction', link: '/development/quick-start/quick-introduction' },
          ]
        },
        {
          text: 'Quick Start',
          collapsed: false,
          items: [
            { text: 'Docker Installation', link: '/development/deploy/docker' },
          ]
        },
        {
          text: 'Configuration Guide',
          collapsed: false,
          items: [
            { text: 'Initialization Guide', link: '/development/advanced/init' },
            { text: 'Environment Variables', link: '/development/deploy/environment' },
            { text: 'Permission Configuration', link: '/development/advanced/permission' },
            { text: 'File Driver', link: '/development/deploy/file-driver' },
          ]
        }
      ]
    },
    footer: {
      message: 'Released under the MIT License',
      copyright: 'Copyright © 2024-present Magic Docs'
    }
  }
} 