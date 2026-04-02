import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证 + 管理员权限
router.use(authMiddleware, requireAdmin);

// GET /api/admin/users - 获取用户列表（分页）
router.get('/users', adminController.getUsers.bind(adminController));

// PUT /api/admin/users/:id - 更新用户信息
router.put('/users/:id', adminController.updateUser.bind(adminController));

// DELETE /api/admin/users/:id - 删除用户
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

export default router;
