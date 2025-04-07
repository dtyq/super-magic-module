## Quick Start
Supports Mac OS and Linux operating systems. Windows systems can run through docker-compose.

### 1. Clone the Project
```bash
git clone [project address]
cd magic
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` and modify the configuration as needed:
```bash
cp .env.example .env
```

### 3. Start the Service

```bash
# Start the service in foreground
./bin/magic.sh start
```

### 4. Other Commands

```bash
# Display help information
./bin/magic.sh help

# Start the service in foreground
./bin/magic.sh start

# Start the service in background
./bin/magic.sh daemon

# Stop the service
./bin/magic.sh stop

# Restart the service
./bin/magic.sh restart

# Check service status
./bin/magic.sh status

# View service logs
./bin/magic.sh logs
```

### 4. Access Services
- API Service: http://localhost:9501
- Web Application: http://localhost:8080
  - Account `13800138001`：Password `123456`
  - Account `13800139001`：Password `123456`
- RabbitMQ Management Interface: http://localhost:15672
  - Username: admin
  - Password: magic123456
- OpenSearch: https://localhost:9200
  - Username: admin
  - Password: Qazwsxedc!@#123
- OpenSearch Dashboards: http://localhost:5601
  - Username: admin
  - Password: Qazwsxedc!@#123 