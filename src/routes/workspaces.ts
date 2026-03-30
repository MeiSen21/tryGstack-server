import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有 Workspace 路由都需要认证
router.use(authMiddleware);

// GET /api/workspaces - 获取所有 Workspace
router.get('/', workspaceController.getAll.bind(workspaceController));

// GET /api/workspaces/default - 获取默认 Workspace
router.get('/default', workspaceController.getDefault.bind(workspaceController));

// GET /api/workspaces/:id - 获取单个 Workspace
router.get('/:id', workspaceController.getById.bind(workspaceController));

// POST /api/workspaces - 创建 Workspace
router.post('/', workspaceController.create.bind(workspaceController));

// PUT /api/workspaces/:id - 更新 Workspace
router.put('/:id', workspaceController.update.bind(workspaceController));

// PATCH /api/workspaces/:id/config - 更新 Workspace 配置
router.patch('/:id/config', workspaceController.updateConfig.bind(workspaceController));

// PATCH /api/workspaces/:id/default - 设置默认 Workspace
router.patch('/:id/default', workspaceController.setDefault.bind(workspaceController));

// DELETE /api/workspaces/:id - 删除 Workspace
router.delete('/:id', workspaceController.delete.bind(workspaceController));

export default router;
