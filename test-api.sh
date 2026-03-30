#!/bin/bash

# AI Dashboard Builder API 测试脚本
# 使用方法: ./test-api.sh

set -e

BASE_URL="http://localhost:3001/api"
CONTENT_TYPE="Content-Type: application/json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== AI Dashboard Builder API 测试 ===${NC}"
echo ""

# 检查服务器是否运行
echo "1. 检查服务器状态..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}✗ 服务器未运行，请先启动服务器: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 服务器运行正常${NC}"
echo ""

# 生成随机邮箱避免冲突
RANDOM_EMAIL="test$(date +%s)@example.com"
PASSWORD="password123"

echo "2. 注册用户: $RANDOM_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "$CONTENT_TYPE" \
    -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\"}")
echo "响应: $REGISTER_RESPONSE"
echo ""

# 提取 token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ 注册失败，尝试登录...${NC}"
    
    # 尝试登录
    echo "3. 用户登录..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "$CONTENT_TYPE" \
        -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\"}")
    echo "响应: $LOGIN_RESPONSE"
    echo ""
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${GREEN}✓ 注册成功${NC}"
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ 获取 Token 失败${NC}"
    exit 1
fi

echo "4. 获取当前用户信息..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
echo "响应: $ME_RESPONSE"
echo ""

echo "5. 创建 Workspace..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/workspaces" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "测试看板",
        "description": "API 测试用看板",
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
    }')
echo "响应: $CREATE_RESPONSE"
echo ""

WORKSPACE_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "6. 获取所有 Workspace..."
curl -s -X GET "$BASE_URL/workspaces" \
    -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "响应已接收"
echo ""

echo "7. 获取单个 Workspace..."
curl -s -X GET "$BASE_URL/workspaces/$WORKSPACE_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "响应已接收"
echo ""

echo "8. 更新 Workspace..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/workspaces/$WORKSPACE_ID" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"测试看板（已更新）","description":"更新后的描述"}')
echo "响应: $UPDATE_RESPONSE"
echo ""

echo "9. 获取默认 Workspace..."
curl -s -X GET "$BASE_URL/workspaces/default" \
    -H "Authorization: Bearer $TOKEN" | jq '.' 2>/dev/null || echo "响应已接收"
echo ""

echo "10. 测试错误：未授权访问..."
ERROR_RESPONSE=$(curl -s -X GET "$BASE_URL/workspaces")
echo "响应: $ERROR_RESPONSE"
echo ""

echo "11. 删除 Workspace..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/workspaces/$WORKSPACE_ID" \
    -H "Authorization: Bearer $TOKEN")
echo "响应: $DELETE_RESPONSE"
echo ""

echo -e "${GREEN}=== 测试完成 ===${NC}"
