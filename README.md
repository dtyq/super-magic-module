# 🎩 Magic - Next Generation Enterprise AI Application Innovation Engine

<div align="center">

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
<!-- [![Docker Pulls](https://img.shields.io/docker/pulls/dtyq/magic.svg)](https://hub.docker.com/r/dtyq/magic)
[![GitHub stars](https://img.shields.io/github/stars/dtyq/magic.svg?style=social&label=Star)](https://github.com/dtyq/magic) -->

**[English](README.md) | [中文简体](README_CN.md)**

</div>

Magic is a powerful enterprise-grade AI application innovation engine designed to help developers quickly build and deploy AI applications. It provides a complete development framework, rich toolchain, and best practices, making AI application development simple and efficient.

![flow](https://cdn.letsmagic.cn/static/img/showmagic.jpg)

## ✨ Features

- 🚀 **High-Performance Architecture**: Developed with PHP+Swow+hyperf, providing excellent performance and scalability
- 🧩 **Modular Design**: Flexible plugin system, supporting rapid extension and customization
- 🔌 **Multi-Model Support**: Seamless integration with mainstream AI models, including GPT, Claude, Gemini, etc.
- 🛠️ **Development Toolchain**: Complete development, testing, and deployment toolchain
- 🔒 **Enterprise-Grade Security**: Comprehensive security mechanisms, supporting organizational structure and permission management

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

###  Access Services
- API Service: http://localhost:9501
- Web Application: http://localhost:8080
  - Account `13800138001`：Password `123456`
  - Account `13900139001`：Password `123456`
- RabbitMQ Management Interface: http://localhost:15672
  - Username: admin
  - Password: magic123456
- OpenSearch: https://localhost:9200
  - Username: admin
  - Password: Qazwsxedc!@#123
- OpenSearch Dashboards: http://localhost:5601
  - Username: admin
  - Password: Qazwsxedc!@#123 
  



## 📚 Documentation

For detailed documentation, please visit [Magic Documentation Center](http://docs.letsmagic.cn/).

## 🤝 Contribution

We welcome contributions in various forms, including but not limited to:

- Submitting issues and suggestions
- Improving documentation
- Submitting code fixes
- Contributing new features

## 📄 License

Magic uses the [Apache License 2.0](LICENSE).

## 📞 Contact Us

- Email: bd@dtyq.com
- Website: https://www.letsmagic.cn

## 🙏 Acknowledgements

Thanks to all developers who have contributed to Magic!

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=dtyq/magic&type=Date)](https://star-history.com/#dtyq/magic&Date)

</div>
