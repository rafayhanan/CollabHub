import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { assignTaskSchema, createTaskSchema } from '../validators/task.validator';
import { assignTask, createTask } from '../controllers/task.controller';

const router = Router();

/**
 * @openapi
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Create a new task within a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the project to add the task to.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       '201':
 *         description: Task created successfully.
 *       '400':
 *         description: Bad Request (e.g., assignee is not a project member).
 *       '403':
 *         description: Forbidden (e.g., user is not a project member).
 *       '404':
 *         description: Project not found.
 */
router.post('/projects/:projectId/tasks', authenticateToken, validate(createTaskSchema), createTask);

/**
 * @openapi
 * /api/tasks/{taskId}/assign:
 *   post:
 *     summary: Assign users to a task or update assignment notes (owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignments]
 *             properties:
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [userId]
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     note:
 *                       type: string
 *                       description: Optional per-assignee note/description
 *     responses:
 *       '200':
 *         description: Task assignments updated.
 *       '400':
 *         description: Bad Request (e.g., non-member assignee).
 *       '403':
 *         description: Forbidden (only owners can assign).
 *       '404':
 *         description: Task not found.
 */
router.post('/tasks/:taskId/assign', authenticateToken, validate(assignTaskSchema), assignTask);

export default router;
