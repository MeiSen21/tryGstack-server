# AI Dashboard Builder - 后端 API

AI 驱动的数据可视化看板工具后端服务，提供用户认证和 Workspace 管理功能。

## 技术栈

- **Node.js 20** LTS
- **Express 4** - Web 框架
- **TypeScript 5** - 类型安全
- **PostgreSQL 16** - 数据库
- **Prisma ORM 5** - 数据库访问
- **JWT** - 认证
- **bcrypt** - 密码加密

## 项目结构

```
server/
├── src/
│   ├── config/           # 配置文件
│   │   └── database.ts   # 数据库连接
│   ├── controllers/      # 控制器
│   │   ├── authController.ts
│   │   └── workspaceController.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.ts       # JWT 认证
│   │   ├── cors.ts       # 跨域配置
│   │   └── errorHandler.ts
│   ├── routes/           # 路由
│   │   ├── auth.ts
│   │   └── workspaces.ts
│   ├── services/         # 业务逻辑
│   │   ├── authService.ts
│   │   └── workspaceService.ts
│   ├── prisma/
│   │   └── client.ts     # Prisma Client
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── utils/            # 工具函数
│   │   ├── errors.ts     # 错误类
│   │   ├── jwt.ts        # JWT 工具
│   │   └── password.ts   # 密码加密
│   └── index.ts          # 入口文件
├── prisma/
│   ├── schema.prisma     # 数据库模型
│   └── migrations/       # 迁移文件
├── .env                  # 环境变量
├── .env.example          # 环境变量示例
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接
```

### 3. 设置数据库

确保 PostgreSQL 已安装并运行，然后创建数据库：

```bash
# 使用 psql 创建数据库
psql -U postgres -c "CREATE DATABASE ai_dashboard;"
```

### 4. 运行数据库迁移

```bash
npx prisma migrate dev --name init
```

### 5. 生成 Prisma Client

```bash
npx prisma generate
```

### 6. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 可用脚本

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 生产模式
npm start

# 数据库迁移
npm run db:migrate

# 生成 Prisma Client
npm run db:generate

# 打开 Prisma Studio
npm run db:studio

# 类型检查
npm run typecheck
```

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token

### 认证接口

#### 注册用户
```http
POST /api/auth/register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2025-03-29T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 用户登录
```http
POST /api/auth/login
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Workspace 接口

所有 Workspace 接口都需要在请求头中包含 `Authorization: Bearer <token>`。

#### 获取所有 Workspace
```http
GET /api/workspaces
```

#### 获取单个 Workspace
```http
GET /api/workspaces/:id
```

#### 创建 Workspace
```http
POST /api/workspaces
```

**请求体:**
```json
{
  "name": "销售周报",
  "description": "每周销售数据分析",
  "config": {
    "charts": [],
    "layout": []
  },
  "isDefault": false
}
```

#### 更新 Workspace
```http
PUT /api/workspaces/:id
```

**请求体:**
```json
{
  "name": "销售周报（更新）",
  "config": {
    "charts": [...],
    "layout": [...]
  }
}
```

#### 删除 Workspace
```http
DELETE /api/workspaces/:id
```

#### 设置默认 Workspace
```http
PATCH /api/workspaces/:id/default
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 错误码

| HTTP 状态码 | 错误码 | 说明 |
|------------|--------|------|
| 400 | INVALID_REQUEST | 请求参数无效 |
| 401 | UNAUTHORIZED | 未授权，Token 无效或过期 |
| 403 | FORBIDDEN | 无权限访问该资源 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突（如邮箱已注册）|
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## API 测试

### 使用 curl

```bash
# 1. 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. 获取用户信息（替换 <token>）
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"

# 4. 创建 Workspace
curl -X POST http://localhost:3001/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"我的看板","description":"测试看板"}'

# 5. 获取所有 Workspace
curl -X GET http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer <token>"
```

### 使用 httpie

```bash
# 安装 httpie
pip install httpie

# 注册用户
http POST :3001/api/auth/register email="test@example.com" password="password123"

# 登录
http POST :3001/api/auth/login email="test@example.com" password="password123"

# 获取用户信息
http :3001/api/auth/me Authorization:"Bearer <token>"

# 创建 Workspace
http POST :3001/api/workspaces Authorization:"Bearer <token>" \
  name="我的看板" description="测试看板"
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 7d |
| `PORT` | 服务器端口 | 3001 |
| `NODE_ENV` | 运行环境 | development |
| `CLIENT_URL` | 前端域名（CORS）| http://localhost:5173 |

## 数据库模型

### User
- `id`: UUID (主键)
- `email`: String (唯一)
- `password`: String (哈希)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Workspace
- `id`: UUID (主键)
- `name`: String
- `description`: String?
- `config`: Json (图表配置)
- `isDefault`: Boolean
- `userId`: String (外键)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## 开发注意事项

1. **认证**: 除 `/api/auth/*` 接口外，其他接口都需要在请求头中提供 `Authorization: Bearer <token>`
2. **密码**: 密码使用 bcrypt 加密存储，永远不会以明文返回
3. **CORS**: 开发环境允许所有跨域请求，生产环境需要配置 `CLIENT_URL`
4. **错误处理**: 所有错误都会统一返回 `{ success: false, error: {...} }` 格式
