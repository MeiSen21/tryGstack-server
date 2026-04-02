const express = require('express');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 简单的内存速率限制器
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟
const RATE_LIMIT_MAX = 5; // 最大请求次数

function checkRateLimit(key) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // 清理过期的记录
  for (const [k, v] of rateLimiter.entries()) {
    if (v.timestamp < windowStart) {
      rateLimiter.delete(k);
    }
  }
  
  const record = rateLimiter.get(key);
  if (!record) {
    rateLimiter.set(key, { count: 1, timestamp: now });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((record.timestamp + RATE_LIMIT_WINDOW - now) / 1000)
    };
  }
  
  record.count++;
  return { allowed: true };
}

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const app = express();

// CORS 配置 - 限制允许的源
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// 存储验证码
const captchas = new Map();
const users = new Map();

// 配置常量
const CONFIG = {
  MAX_USERS: 1000,        // 最大用户数限制
  CAPTCHA_EXPIRY: 5 * 60 * 1000,  // 验证码过期时间：5分钟
};

// 生成验证码
function generateCaptchaData() {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f0f0f0'
  });
  return {
    text: captcha.text,
    svg: captcha.data
  };
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// ============ API 路由 ============
const apiRouter = express.Router();

// 获取验证码 - GET /api/auth/captcha
apiRouter.get('/auth/captcha', (req, res) => {
  const { text, svg } = generateCaptchaData();
  const captchaId = uuidv4();
  captchas.set(captchaId, text.toLowerCase());
  
  // 5分钟后过期
  setTimeout(() => captchas.delete(captchaId), CONFIG.CAPTCHA_EXPIRY);
  
  res.json({
    success: true,
    data: {
      captchaId,
      svg,
      // 只在开发环境返回验证码文本，方便测试
      ...(process.env.NODE_ENV === 'development' && { code: text })
    }
  });
});

// 刷新验证码 - GET /api/auth/captcha/refresh
apiRouter.get('/auth/captcha/refresh', (req, res) => {
  const { captchaId: oldCaptchaId } = req.query;
  if (oldCaptchaId) {
    captchas.delete(oldCaptchaId);
  }
  
  const { text, svg } = generateCaptchaData();
  const captchaId = uuidv4();
  captchas.set(captchaId, text.toLowerCase());
  
  setTimeout(() => captchas.delete(captchaId), CONFIG.CAPTCHA_EXPIRY);
  
  res.json({
    success: true,
    data: {
      captchaId,
      svg,
      // 只在开发环境返回验证码文本
      ...(process.env.NODE_ENV === 'development' && { code: text })
    }
  });
});

// 注册 - POST /api/auth/register
apiRouter.post('/auth/register', async (req, res) => {
  // 速率限制检查
  const clientIp = req.ip || req.connection.remoteAddress;
  const limitKey = `register:${clientIp}`;
  const rateLimit = checkRateLimit(limitKey);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: { message: `请求过于频繁，请 ${rateLimit.retryAfter} 秒后重试` }
    });
  }
  const { email, password, captchaId, captchaCode } = req.body;
  
  // 验证验证码
  const storedCaptcha = captchas.get(captchaId);
  if (!storedCaptcha || storedCaptcha !== captchaCode.toLowerCase()) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '验证码错误或已过期' } 
    });
  }
  
  if (users.has(email)) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '该邮箱已注册' } 
    });
  }
  
  // 检查用户数限制，防止内存泄漏
  if (users.size >= CONFIG.MAX_USERS) {
    return res.status(503).json({
      success: false,
      error: { message: '系统用户数量已达上限，请联系管理员' }
    });
  }
  
  const user = {
    id: uuidv4(),
    email,
    createdAt: new Date().toISOString()
  };
  
  // 使用 bcrypt 哈希密码（salt rounds = 10）
  const hashedPassword = await bcrypt.hash(password, 10);
  users.set(email, { password: hashedPassword, user });
  captchas.delete(captchaId);
  
  res.json({ success: true, data: { user } });
});

// 登录 - POST /api/auth/login
apiRouter.post('/auth/login', async (req, res) => {
  // 速率限制检查
  const clientIp = req.ip || req.connection.remoteAddress;
  const limitKey = `login:${clientIp}`;
  const rateLimit = checkRateLimit(limitKey);
  
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: { message: `请求过于频繁，请 ${rateLimit.retryAfter} 秒后重试` }
    });
  }
  const { email, password, captchaId, captchaCode } = req.body;
  
  // 验证验证码
  const storedCaptcha = captchas.get(captchaId);
  if (!storedCaptcha || storedCaptcha !== captchaCode.toLowerCase()) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '验证码错误或已过期' } 
    });
  }
  
  const userData = users.get(email);
  if (!userData) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '邮箱或密码错误' } 
    });
  }
  
  // 使用 bcrypt 验证密码
  const validPassword = await bcrypt.compare(password, userData.password);
  if (!validPassword) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '邮箱或密码错误' } 
    });
  }
  
  // 生成真正的 JWT Token
  const token = jwt.sign(
    { userId: userData.user.id, email: userData.user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  captchas.delete(captchaId);
  
  res.json({
    success: true,
    data: {
      user: userData.user,
      token
    }
  });
});

// JWT 验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: '未提供认证令牌' }
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { message: '令牌无效或已过期' }
      });
    }
    req.user = user;
    next();
  });
}

// 需要保护的示例路由
apiRouter.get('/protected/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// 挂载 API 路由
app.use('/api', apiRouter);

app.listen(3001, () => {
  console.log('Test server running on http://localhost:3001');
  console.log('API base: http://localhost:3001/api');
});
