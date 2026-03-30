import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';

interface CaptchaInfo {
  code: string;
  expireAt: number;
}

// 内存存储验证码（生产环境建议使用 Redis）
const captchaStore = new Map<string, CaptchaInfo>();

// 验证码有效期：5分钟
const CAPTCHA_EXPIRE_MS = 5 * 60 * 1000;

export class CaptchaService {
  /**
   * 生成验证码
   * @returns 验证码ID和SVG图片
   */
  generateCaptcha(): { captchaId: string; svg: string; code?: string } {
    // 清理过期的验证码
    this.cleanExpiredCaptchas();

    // 生成验证码
    const captcha = svgCaptcha.create({
      size: 4, // 4位验证码
      noise: 3, // 干扰线数量
      color: true, // 彩色
      background: '#f5f5f5', // 背景色
      width: 120,
      height: 40,
      fontSize: 40,
    });

    const captchaId = uuidv4();
    
    // 存储验证码（转小写存储，验证时不区分大小写）
    captchaStore.set(captchaId, {
      code: captcha.text.toLowerCase(),
      expireAt: Date.now() + CAPTCHA_EXPIRE_MS,
    });

    const result: { captchaId: string; svg: string; code?: string } = {
      captchaId,
      svg: captcha.data,
    };

    // 开发模式下返回验证码文本（方便测试）
    if (process.env.NODE_ENV === 'development') {
      result.code = captcha.text;
    }

    return result;
  }

  /**
   * 验证验证码
   * @param captchaId 验证码ID
   * @param code 用户输入的验证码
   * @returns 是否验证通过
   */
  verifyCaptcha(captchaId: string, code: string): boolean {
    if (!captchaId || !code) {
      return false;
    }

    const captchaInfo = captchaStore.get(captchaId);
    
    if (!captchaInfo) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > captchaInfo.expireAt) {
      captchaStore.delete(captchaId);
      return false;
    }

    // 验证验证码（不区分大小写）
    const isValid = captchaInfo.code === code.toLowerCase();

    // 验证成功后删除验证码（防止重复使用）
    if (isValid) {
      captchaStore.delete(captchaId);
    }

    return isValid;
  }

  /**
   * 删除验证码
   * @param captchaId 验证码ID
   */
  deleteCaptcha(captchaId: string): void {
    captchaStore.delete(captchaId);
  }

  /**
   * 清理过期的验证码
   */
  private cleanExpiredCaptchas(): void {
    const now = Date.now();
    for (const [id, info] of captchaStore.entries()) {
      if (now > info.expireAt) {
        captchaStore.delete(id);
      }
    }
  }
}

// 导出单例实例
export const captchaService = new CaptchaService();
