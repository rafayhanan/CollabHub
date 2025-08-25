import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { assignTaskSchema, createTaskSchema, updateTaskSchema } from '../validators/task.validator';
import { 
    assignTask, 
    createTask, 
    getTasks, 
    getTaskById, 
    updateTask, 
    deleteTask, 
    getUserTasks, 
    unassignTask 
} from '../controllers/task.controller';

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

/**
 * @openapi
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: Get all tasks for a project
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
 *         description: The ID of the project to get tasks from.
 *     responses:
 *       '200':
 *         description: List of tasks retrieved successfully.
 *       '403':
 *         description: Forbidden (user is not a project member).
 *       '404':
 *         description: Project not found.
 */
router.get('/projects/:projectId/tasks', authenticateToken, getTasks);

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Get a specific task by ID
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
 *     responses:
 *       '200':
 *         description: Task retrieved successfully.
 *       '403':
 *         description: Forbidden (user is not a project member).
 *       '404':
 *         description: Task not found.
 */
router.get('/tasks/:taskId', authenticateToken, getTaskById);

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Update a task
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
 *             $ref: '#/components/schemas/UpdateTaskInput'
 *     responses:
 *       '200':
 *         description: Task updated successfully.
 *       '403':
 *         description: Forbidden (user is not a project member).
 *       '404':
 *         description: Task not found.
 */
router.put('/tasks/:taskId', authenticateToken, validate(updateTaskSchema), updateTask);

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task (owner only)
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
 *     responses:
 *       '204':
 *         description: Task deleted successfully.
 *       '403':
 *         description: Forbidden (only project owners can delete tasks).
 *       '404':
 *         description: Task not found.
 */
router.delete('/tasks/:taskId', authenticateToken, deleteTask);

/**
 * @openapi
 * /api/users/me/tasks:
 *   get:
 *     summary: Get all tasks assigned to the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of assigned tasks retrieved successfully.
 *       '401':
 *         description: Unauthorized.
 */
router.get('/users/me/tasks', authenticateToken, getUserTasks);

/**
 * @openapi
 * /api/tasks/{taskId}/assignments/{userId}:
 *   delete:
 *     summary: Unassign a user from a task (owner only)
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: User unassigned successfully.
 *       '403':
 *         description: Forbidden (only project owners can unassign users).
 *       '404':
 *         description: Task or assignment not found.
 */
router.delete('/tasks/:taskId/assignments/:userId', authenticateToken, unassignTask);

export default router;
