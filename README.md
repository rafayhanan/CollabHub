# CollabHub

A comprehensive student project management and collaboration platform that combines the best of Trello's task management with Slack's real-time communication features. Built specifically for student teams to organize projects, track progress, and collaborate effectively.

## Features

### Project Management

- **Project Dashboard** - Overview of all projects with progress tracking and task statistics
- **Project Creation & Management** - Full CRUD operations for projects with member management
- **Role-based Access Control** - Project owners, members, and viewers with appropriate permissions


### Task Management

- **Kanban Board** - Drag-and-drop task management with customizable columns
- **Task Assignment** - Assign tasks to team members with due dates and priorities
- **Progress Tracking** - Visual progress indicators and completion statistics
- **Multiple Views** - Switch between board and list views for different workflows


### Real-time Communication

- **Multi-channel Chat** - Project general, task-specific, private DMs, and announcement channels
- **Live Messaging** - Real-time message delivery with typing indicators
- **Message Management** - Edit, delete, and organize conversations
- **Channel Management** - Create and manage different communication channels


### User Management

- **Team Invitations** - Invite users to projects via email with role assignment
- **Member Management** - Add, remove, and manage project team members
- **User Profiles** - Comprehensive user information and project associations


### Real-time Features

- **WebSocket Integration** - Live updates for messages, tasks, and project changes
- **Optimistic UI** - Instant feedback with automatic synchronization
- **Typing Indicators** - See when team members are typing in chat
- **Live Collaboration** - Real-time task updates across all connected clients

## Tech Stack

**Frontend:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- WebSocket for real-time features
- SWR for data fetching and caching

**Backend:**

- Express.js/Node.js
- TypeScript
- Supabase PostgreSQL with Prisma ORM
- JWT Authentication with automatic token refresh
- WebSocket for real-time features
- Jest/Supertest & GitHub Actions for testing pipeline.
- Argon2 for password hashing
