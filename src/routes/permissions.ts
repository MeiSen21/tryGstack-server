import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth';
import permissionController from '../controllers/permissionController';

const router = Router();

/**
 * 权限管理路由
 * 所有接口都需要管理员权限
 */

// 应用认证中间件到所有路由
router.use(authMiddleware);

// 获取权限配置 Schema
router.get('/schema', requireAdmin, permissionController.getPermissionsSchema.bind(permissionController));

// 获取用户权限配置
router.get('/:userId', requireAdmin, permissionController.getUserPermissions.bind(permissionController));

// 更新用户权限配置
router.put('/:userId', requireAdmin, permissionController.updateUserPermissions.bind(permissionController));

// 重置用户权限为默认值
router.post('/:userId/reset', requireAdmin, permissionController.resetUserPermissions.bind(permissionController));

export default router;
