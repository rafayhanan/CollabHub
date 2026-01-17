import { Router } from 'express';
import { createProject, getProjectById, getProjects, updateProject, deleteProject, updateProjectMemberRole } from '../controllers/project.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, updateProjectMemberRoleSchema } from '../validators/project.validator';

const router = Router();

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectInput'
 *     responses:
 *       '201':
 *         description: Project created successfully
 *       '400':
 *         description: Invalid input
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticateToken, validate(createProjectSchema), createProject);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Project found
 *       '404':
 *         description: Project not found
 *       '401':
 *         description: Unauthorized
 */
router.get('/:id', authenticateToken, getProjectById);

/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: Get all projects for the current user
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of projects
 *       '401':
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getProjects);

/**
 * @openapi
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectInput'
 *     responses:
 *       '200':
 *         description: Project updated successfully
 *       '400':
 *         description: Invalid input
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Project not found
 */
router.put('/:id', authenticateToken, validate(updateProjectSchema), updateProject);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Project deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Project not found
 */
router.delete('/:id', authenticateToken, deleteProject);

/**
 * @openapi
 * /api/projects/{projectId}/members/{userId}/role:
 *   put:
 *     summary: Update a project member role (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [MANAGER, MEMBER]
 *     responses:
 *       '200':
 *         description: Role updated successfully
 *       '400':
 *         description: Invalid input
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Member not found
 */
router.put('/:projectId/members/:userId/role', authenticateToken, validate(updateProjectMemberRoleSchema), updateProjectMemberRole);



export default router;
