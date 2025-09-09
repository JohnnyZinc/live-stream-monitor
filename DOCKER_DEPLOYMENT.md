# Docker 部署说明

## 快速开始

### 1. 安装 Docker
确保你的系统已经安装了 Docker 和 Docker Compose。

### 2. 构建并启动容器
```bash
# 构建镜像并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 访问应用
应用将在 `http://localhost:5000` 上运行。

## 环境变量配置

### 生产环境部署
在生产环境中，建议创建 `.env` 文件来配置环境变量：

```bash
# .env 文件示例
SECRET_KEY=your-secure-secret-key-here
FLASK_ENV=production
FLASK_APP=app.py
```

### 使用环境变量文件
```bash
# 使用 .env 文件启动
docker-compose --env-file .env up -d
```

## 数据持久化

### 数据目录
- `./data` - 存储应用数据（房间配置、分组信息等）
- `./logs` - 存储应用日志

### 备份重要数据
```bash
# 备份数据目录
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据
tar -xzf backup-20240101.tar.gz
```

## 维护操作

### 重启应用
```bash
docker-compose restart
```

### 停止应用
```bash
docker-compose down
```

### 更新应用
```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build
```

### 清理资源
```bash
# 清理未使用的镜像
docker image prune

# 清理所有未使用的资源
docker system prune -a
```

## 监控和日志

### 查看容器状态
```bash
docker-compose ps
```

### 查看实时日志
```bash
docker-compose logs -f live-collection
```

### 查看特定时间段的日志
```bash
# 查看最近100行日志
docker-compose logs --tail=100 live-collection

# 查看过去1小时的日志
docker-compose logs --since=1h live-collection
```

### 健康检查
容器配置了健康检查，可以通过以下命令查看：
```bash
docker inspect live-collection-app | grep -A 10 Health
```

## 故障排除

### 常见问题
1. **端口冲突**：确保5000端口未被占用
2. **权限问题**：确保数据目录有正确的权限
3. **内存不足**：调整Docker内存限制

### 进入容器调试
```bash
docker-compose exec live-collection bash
```

### 查看容器资源使用情况
```bash
docker stats live-collection-app
```

## 生产环境建议

### 安全配置
1. 使用强密码作为 `SECRET_KEY`
2. 考虑使用反向代理（如 Nginx）
3. 启用 HTTPS
4. 定期更新基础镜像

### 性能优化
1. 调整 Docker 内存限制
2. 使用多阶段构建减小镜像大小
3. 配置日志轮转

### 备份策略
1. 定期备份 `data` 目录
2. 使用 Docker 卷进行数据持久化
3. 考虑使用云存储进行远程备份