import { Request, Response, NextFunction } from 'express';
import { captchaService } from '../services/captchaService';

export class CaptchaController {
  /**
   * 获取验证码
   * GET /api/auth/captcha
   */
  getCaptcha(req: Request, res: Response, next: NextFunction): void {
    try {
      const { captchaId, svg, code } = captchaService.generateCaptcha();
      
      const data: any = {
        captchaId,
        svg,
      };

      // 开发模式下返回验证码文本（方便测试）
      if (process.env.NODE_ENV === 'development' && code) {
        data.code = code;
      }
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新验证码
   * GET /api/auth/captcha/refresh
   */
  refreshCaptcha(req: Request, res: Response, next: NextFunction): void {
    try {
      // 如果有旧验证码ID，先删除
      const { captchaId: oldCaptchaId } = req.query;
      if (oldCaptchaId) {
        captchaService.deleteCaptcha(oldCaptchaId as string);
      }

      const { captchaId, svg, code } = captchaService.generateCaptcha();
      
      const data: any = {
        captchaId,
        svg,
      };

      // 开发模式下返回验证码文本（方便测试）
      if (process.env.NODE_ENV === 'development' && code) {
        data.code = code;
      }
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const captchaController = new CaptchaController();
