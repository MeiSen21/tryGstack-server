# API 测试示例

以下是一组完整的 API 测试命令，使用 curl 进行测试。

## 准备工作

```bash
# 1. 启动服务器
cd server
npm run dev

# 2. 在另一个终端窗口执行以下测试命令
```

---

## 1. 健康检查

```bash
curl -X GET http://localhost:3001/health
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-03-29T00:00:00.000Z",
    "environment": "development"
  }
}
```

---

## 2. 用户注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2025-03-29T00:00:00.000Z",
      "updatedAt": "2025-03-29T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 3. 用户登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2025-03-29T00:00:00.000Z",
      "updatedAt": "2025-03-29T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 4. 获取当前用户信息

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "createdAt": "2025-03-29T00:00:00.000Z",
    "updatedAt": "2025-03-29T00:00:00.000Z"
  }
}
```

---

## 5. 检查邮箱是否可用

```bash
curl -X GET "http://localhost:3001/api/auth/check-email?email=test@example.com"
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

## 6. 创建 Workspace

```bash
curl -X POST http://localhost:3001/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "销售周报",
    "description": "每周销售数据分析看板",
    "config": {
      "charts": [
        {
          "id": "chart-1",
          "type": "line",
          "title": "销售额趋势",
          "data": [],
          "config": {
            "type": "line",
            "title": "销售额趋势",
            "dimensions": ["date"],
            "metrics": [{"field": "amount", "name": "销售额"}],
            "timeRange": "7d"
          },
          "position": {"x": 0, "y": 0, "w": 6, "h": 4}
        }
      ],
      "layout": [{"i": "chart-1", "x": 0, "y": 0, "w": 6, "h": 4}]
    },
    "isDefault": true
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "销售周报",
    "description": "每周销售数据分析看板",
    "config": {
      "charts": [...],
      "layout": [...]
    },
    "isDefault": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-03-29T00:00:00.000Z",
    "updatedAt": "2025-03-29T00:00:00.000Z"
  }
}
```

---

## 7. 获取所有 Workspace

```bash
curl -X GET http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "销售周报",
      "description": "每周销售数据分析看板",
      "config": {...},
      "isDefault": true,
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-03-29T00:00:00.000Z",
      "updatedAt": "2025-03-29T00:00:00.000Z"
    }
  ]
}
```

---

## 8. 获取单个 Workspace

```bash
curl -X GET http://localhost:3001/api/workspaces/WORKSPACE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 9. 更新 Workspace

```bash
curl -X PUT http://localhost:3001/api/workspaces/WORKSPACE_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "销售周报（已更新）",
    "description": "更新后的描述"
  }'
```

---

## 10. 更新 Workspace 配置

```bash
curl -X PATCH http://localhost:3001/api/workspaces/WORKSPACE_ID_HERE/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "config": {
      "charts": [
        {
          "id": "chart-1",
          "type": "bar",
          "title": "各地区销售额对比",
          "data": [],
          "config": {
            "type": "bar",
            "title": "各地区销售额对比",
            "dimensions": ["region"],
            "metrics": [{"field": "amount", "name": "销售额"}],
            "timeRange": "30d"
          },
          "position": {"x": 0, "y": 0, "w": 6, "h": 4}
        }
      ],
      "layout": [{"i": "chart-1", "x": 0, "y": 0, "w": 6, "h": 4}]
    }
  }'
```

---

## 11. 设置默认 Workspace

```bash
curl -X PATCH http://localhost:3001/api/workspaces/WORKSPACE_ID_HERE/default \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 12. 删除 Workspace

```bash
curl -X DELETE http://localhost:3001/api/workspaces/WORKSPACE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "message": "Workspace 已删除"
  }
}
```

---

## 13. 获取默认 Workspace

```bash
curl -X GET http://localhost:3001/api/workspaces/default \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 错误响应示例

### 未授权
```bash
curl -X GET http://localhost:3001/api/workspaces
```

**预期响应:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未提供 Token"
  }
}
```

### 无效的请求数据
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```

**预期响应:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "邮箱格式不正确"
  }
}
```

### 邮箱已注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**预期响应:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "该邮箱已被注册"
  }
}
```

### 资源不存在
```bash
curl -X GET http://localhost:3001/api/workspaces/non-existent-id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期响应:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Workspace 不存在"
  }
}
```

---

## 批量测试脚本

使用提供的测试脚本一次性运行所有测试：

```bash
# 使脚本可执行
chmod +x test-api.sh

# 运行测试
./test-api.sh
```

或使用 httpie（更友好的输出）：

```bash
# 安装 httpie
pip install httpie

# 使用 VS Code REST Client 插件打开 api-test.http 文件
```
