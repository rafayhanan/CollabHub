import { Router } from 'express';
import {
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    getInvitations,
    getProjectInvitations,
    resendInvitation,
} from '../controllers/invitation.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { sendInvitationSchema } from '../validators/invitation.validator';

const router = Router();

/**
 * @openapi
 * /api/invitations:
 *   get:
 *     summary: Get all pending invitations for the current user
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of pending invitations
 *       '401':
 *         description: Unauthorized
 */
router.get('/invitations', authenticateToken, getInvitations);


/**
 * @openapi
 * /api/projects/{projectId}/invitations:
 *   post:
 *     summary: Send an invitation to a user to join a project
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendInvitationInput'
 *     responses:
 *       '201':
 *         description: Invitation sent successfully
 *       '400':
 *         description: Invalid input
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Project not found
 *       '409':
 *         description: User is already a member of this project
 */
router.post('/projects/:projectId/invitations', authenticateToken, validate(sendInvitationSchema), sendInvitation);

/**
 * @openapi
 * /api/projects/{projectId}/invitations:
 *   get:
 *     summary: Get pending invitations for a project (owner only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A list of pending invitations for the project
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Project not found
 */
router.get('/projects/:projectId/invitations', authenticateToken, getProjectInvitations);

/**
 * @openapi
 * /api/projects/{projectId}/invitations/{invitationId}/resend:
 *   post:
 *     summary: Resend a pending invitation (owner only)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Invitation resent successfully
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Invitation not found
 */
router.post('/projects/:projectId/invitations/:invitationId/resend', authenticateToken, resendInvitation);

/**
 * @openapi
 * /api/invitations/{invitationId}/accept:
 *   post:
 *     summary: Accept an invitation to join a project
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Invitation accepted successfully
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Invitation not found
 */
router.post('/invitations/:invitationId/accept', authenticateToken, acceptInvitation);

/**
 * @openapi
 * /api/invitations/{invitationId}/decline:
 *   post:
 *     summary: Decline an invitation to join a project
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Invitation declined successfully
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Invitation not found
 */
router.post('/invitations/:invitationId/decline', authenticateToken, declineInvitation);

export default router;
