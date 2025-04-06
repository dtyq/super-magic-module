# 🎩 Magic - Next-Generation Enterprise AI Application Innovation Engine

<div align="center">

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/dtyq/magic-service.svg)](https://hub.docker.com/r/dtyq/magic-service)
[![GitHub stars](https://img.shields.io/github/stars/dtyq/magic.svg?style=social&label=Star)](https://github.com/dtyq/magic)

</div>

Magic is a powerful enterprise-level AI application innovation engine designed to help developers quickly build and deploy AI applications. It provides a complete development framework, rich toolchain, and best practices to make AI application development simple and efficient.

## ✨ Features

- 🚀 **High-Performance Architecture**: Developed based on PHP language, providing excellent performance and scalability
- 🧩 **Modular Design**: Flexible plugin system supporting rapid expansion and customization
- 🔌 **Multi-Model Support**: Seamless integration with mainstream AI models including GPT, Claude, Gemini, etc.
- 🛠️ **Development Toolchain**: Complete development, testing, and deployment toolchain
- 🔒 **Enterprise-Grade Security**: Comprehensive security mechanisms supporting multi-tenancy and permission management

## 🚀 Quick Start

### System Requirements
- Docker 24.0+
- Docker Compose 2.0+

### Installation

```bash
# Clone repository
git clone https://github.com/dtyq/magic.git
cd magic

# Start service
./bin/magic.sh start
```

### Using Docker

```bash
# Start service in foreground
./bin/magic.sh start

# Start service in background
./bin/magic.sh daemon

# Check service status
./bin/magic.sh status

# View logs
./bin/magic.sh logs
```

## 📚 Documentation

For detailed documentation, please visit [Magic Documentation Center](http://docs.letsmagic.cn/).

## 🤝 Contributing

We welcome contributions in various forms, including but not limited to:

- Submitting issues and suggestions
- Improving documentation
- Submitting code fixes
- Contributing new features

## 📄 License

Magic is licensed under [Apache License 2.0](LICENSE).

## 📞 Contact Us

- Email: support@dtyq.com
- Website: https://www.dtyq.com

## 🙏 Acknowledgments

Thanks to all developers who have contributed to Magic!

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=dtyq/magic&type=Date)](https://star-history.com/#dtyq/magic&Date)

</div>

# Magic - AI Application Development Platform

Magic is an AI application development platform with core features including:

## 1. Real-time Chat

Magic's enterprise internal chat feature supports multiple users online simultaneously, with a clean and intuitive interface similar to WeChat, making it easy for employees to use. Whether it's one-on-one private communication or group discussions with multiple participants, conversations can be initiated instantly.

In terms of group management, it has powerful permission settings that allow administrators to flexibly assign different member permissions, such as:
- Setting certain members as administrators responsible for daily group management and maintenance
- Restricting some members' speaking permissions to ensure orderly group discussions

Through this instant messaging functionality, internal enterprise communication becomes faster and more efficient, information can be delivered promptly, and work efficiency is significantly improved.

![Real-time Chat Interface](/static/img/chat-interface.png)

## 2. AI Assistant Creation and Management

- **Enterprise Internal**: Allows publishing AI assistant lists within the enterprise
- **Assistant Management**: Version release, enable/disable status control, etc.

![AI Assistant Management Interface](/static/img/ai-assistant-1.png)

![AI Assistant List](/static/img/ai-assistant-2.png)

## 3. Workflow Orchestration

- **Process Orchestration**: Quickly build workflows through drag-and-drop, handling complex logic and high-stability task flows.
- **Node Combination**: Provides a large number of flexible and combinable nodes, including large language models, custom code, judgment logic, etc.
- **Template Support**: The platform provides workflow templates to lower the usage threshold.

![Workflow Orchestration Interface](/static/img/workflow-1.png)

### Process

![Process Interface](/static/img/workflow-process.png)

### Toolset

![Toolset Interface](/static/img/tools.png)

## 4. Memory Function

- **Long-term Memory**: Provides variable, database, file, and other memory functions, enabling bots to have long-term memory capabilities.
- **Database Memory**: Convenient database memory capability for AI interaction, able to persistently remember important parameters or content from user conversations.

![Memory Function Interface](/static/img/memory-1.png)

![Database Memory Interface](/static/img/memory-2.png)

## 5. Multimodal Interaction

- **Multiple Interaction Methods**: Supports text, voice, image, and other interaction methods, providing a richer user experience.
- **Creative Creation**: Users can use AI image generation, AI portrait, and other features for creative work.

![Multimodal Interaction Interface](/static/img/multimodal.png)

## 6. Application Publishing

- **Multi-platform Publishing**: Supports publishing developed AI applications to multiple platforms such as WeChat Work and DingTalk.

![Application Publishing Interface](/static/img/app-publishing.png)

## 7. Enterprise Edition and Commercialization Capabilities

- **Team Collaboration**: Supports team collaboration in developing agents through team spaces, as well as team management, permission control, and other collaboration management capabilities.
- **Professional Edition**: Provides paid SaaS solutions supporting more advanced features and services.
- **API/SDK Publishing**: Supports publishing agents as APIs or SDKs for secondary use by users. 