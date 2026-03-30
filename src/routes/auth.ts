import { Router } from 'express';
import { authController } from '../controllers/authController';
import { captchaController } from '../controllers/captchaController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/auth/captcha - 获取验证码
router.get('/captcha', captchaController.getCaptcha.bind(captchaController));

// GET /api/auth/captcha/refresh - 刷新验证码
router.get('/captcha/refresh', captchaController.refreshCaptcha.bind(captchaController));

// POST /api/auth/register - 用户注册
router.post('/register', authController.register.bind(authController));

// POST /api/auth/login - 用户登录
router.post('/login', authController.login.bind(authController));

// GET /api/auth/me - 获取当前用户（需要认证）
router.get('/me', authMiddleware, authController.getMe.bind(authController));

// GET /api/auth/check-email - 检查邮箱是否可用
router.get('/check-email', authController.checkEmail.bind(authController));

export default router;
