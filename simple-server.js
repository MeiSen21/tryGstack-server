const express = require('express');
const cors = require('cors');
const svgCaptcha = require('svg-captcha');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
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
      code: text  // 开发模式返回验证码文本方便测试
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
      code: text
    }
  });
});

// 注册 - POST /api/auth/register
apiRouter.post('/auth/register', (req, res) => {
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
  
  users.set(email, { password, user });
  captchas.delete(captchaId);
  
  res.json({ success: true, data: { user } });
});

// 登录 - POST /api/auth/login
apiRouter.post('/auth/login', (req, res) => {
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
  if (!userData || userData.password !== password) {
    return res.status(400).json({ 
      success: false, 
      error: { message: '邮箱或密码错误' } 
    });
  }
  
  const token = 'mock-jwt-token-' + uuidv4();
  captchas.delete(captchaId);
  
  res.json({
    success: true,
    data: {
      user: userData.user,
      token
    }
  });
});

// 挂载 API 路由
app.use('/api', apiRouter);

app.listen(3001, () => {
  console.log('Test server running on http://localhost:3001');
  console.log('API base: http://localhost:3001/api');
});
