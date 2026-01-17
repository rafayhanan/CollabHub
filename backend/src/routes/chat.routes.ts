import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createChannelValidator,
  addChannelMemberValidator,
  sendMessageValidator,
  updateMessageValidator,
} from '../validators/chat.validator';
import {
  createChannel,
  getProjectChannels,
  getChannel,
  addChannelMember,
  sendMessage,
  getChannelMessages,
  updateMessage,
  deleteMessage,
} from '../controllers/chat.controller';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Channel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique channel ID
 *         name:
 *           type: string
 *           description: Channel name
 *         description:
 *           type: string
 *           description: Channel description
 *         type:
 *           type: string
 *           enum: [PROJECT_GENERAL, TASK_SPECIFIC, ANNOUNCEMENTS]
 *           description: Channel type
 *         projectId:
 *           type: string
 *           description: Associated project ID
 *         taskId:
 *           type: string
 *           description: Associated task ID (for task-specific channels)
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChannelMember'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ChannelMember:
 *       type: object
 *       properties:
 *         channelId:
 *           type: string
 *         userId:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, MEMBER]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/UserBasic'
 *     
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         channelId:
 *           type: string
 *         authorId:
 *           type: string
 *         author:
 *           $ref: '#/components/schemas/UserBasic'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     UserBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         avatarUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Channel name
 *               type:
 *                 type: string
 *                 enum: [PROJECT_GENERAL, TASK_SPECIFIC, ANNOUNCEMENTS]
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *                 description: Required for project channels
 *               taskId:
 *                 type: string
 *                 description: Required for task-specific channels
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of project member IDs to add
 *     responses:
 *       201:
 *         description: Channel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied to project
 *       404:
 *         description: Task not found in project
 */
router.post('/', authenticateToken, validate(createChannelValidator), createChannel);

/**
 * @swagger
 * /api/channels/project/{projectId}:
 *   get:
 *     summary: Get all channels for a project
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: List of project channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 *       403:
 *         description: Access denied to project
 */
router.get('/project/:projectId', authenticateToken, getProjectChannels);

/**
 * @swagger
 * /api/channels/{channelId}:
 *   get:
 *     summary: Get channel details
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Channel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 *       404:
 *         description: Channel not found or access denied
 */
router.get('/:channelId', authenticateToken, getChannel);

/**
 * @swagger
 * /api/channels/{channelId}/members:
 *   post:
 *     summary: Add member to channel
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to add
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MEMBER]
 *                 default: MEMBER
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChannelMember'
 *       403:
 *         description: Only admins can add members or user not in project
 */
router.post('/:channelId/members', authenticateToken, validate(addChannelMemberValidator), addChannelMember);

/**
 * @swagger
 * /api/channels/{channelId}/messages:
 *   post:
 *     summary: Send a message to channel
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not a member of this channel
 */
router.post('/:channelId/messages', authenticateToken, validate(sendMessageValidator), sendMessage);

/**
 * @swagger
 * /api/channels/{channelId}/messages:
 *   get:
 *     summary: Get messages from channel
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Channel ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to fetch
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not a member of this channel
 */
router.get('/:channelId/messages', authenticateToken, getChannelMessages);

/**
 * @swagger
 * /api/channels/messages/{messageId}:
 *   put:
 *     summary: Update a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated message content
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Message not found or access denied
 */
router.put('/messages/:messageId', authenticateToken, validate(updateMessageValidator), updateMessage);

/**
 * @swagger
 * /api/channels/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       204:
 *         description: Message deleted successfully
 *       403:
 *         description: Access denied (only author or channel admin)
 *       404:
 *         description: Message not found
 */
router.delete('/messages/:messageId', authenticateToken, deleteMessage);

export default router;
