# CollabHub: Backend MVP Feature Set

## Project Overview

CollabHub is a backend service designed to power a modern student collaboration platform. Its primary goal is to provide a robust, reliable, and scalable engine for managing the entire lifecycle of a student project. This document outlines the core backend capabilities required for the Minimum Viable Product (MVP).

The following features represent the services and logic the backend will expose. A frontend client will consume these capabilities later to create the user interface.

---

### Module 1: Project & Workspace Management

This module handles the top-level containers for all collaboration.

* **Project Creation & Persistence:** The system will allow an authenticated user to create a new project entity. Each project will have a unique ID, title, description, and a record of its creation date.
* **Project Data Retrieval:** The backend must provide logic to fetch a specific project's data by its ID, as well as logic to retrieve a list of all projects a given user is a member of.
* **Project Update & Deletion:** The system will support updating a project's core attributes (title, description). It must also include secure logic for project deletion, restricted only to the project owner.

### Module 2: Team & Membership Management

This module governs how users are associated with projects and what they can do.

* **User Invitation System:** The backend will manage an invitation flow. It will create and track invitations linked to a project and a user's email, including statuses like 'pending' and 'accepted'.
* **Role-Based Access Control (RBAC):** The system will associate users with projects through a membership entity. This entity will define a user's role (e.g., `OWNER`, `MEMBER`). All other backend services must use this role to authorize or deny actions (e.g., only an `OWNER` can delete the project).
* **Team Member Enumeration:** Provide the capability to list all users associated with a specific project.

### Module 3: Task Lifecycle Management

This is the core engine for project execution, which will power a future Kanban board.

* **Task Entity Management:** The backend must support the creation, updating, and deletion of task entities. Each task must be associated with a parent project.
* **Task Status Tracking:** Each task entity will have a `status` attribute (e.g., `TODO`, `IN_PROGRESS`, `DONE`). The system must handle updates to this status.
* **Task Assignment Logic:** The backend will allow a task to be assigned to a specific user who is a member of the project. It must handle both assigning and un-assigning a user.
* **Attribute Management:** Support for other key task attributes like a title, a detailed description, and an optional due date.

### Module 4: Contextual Communication System

This module provides organized communication channels, a major improvement over generic chat.

* **Task-Scoped Commenting:** The backend will support the creation of comment entities. Crucially, each comment must be directly and exclusively linked to a single task entity.
* **Thread Retrieval:** The system must provide a mechanism to retrieve an entire chronologically ordered comment thread for any given task ID.

### Module 5: Project Planning & Resources

This module handles essential assets and deadlines associated with a project.

* **Milestone Tracking:** The system will support creating and managing time-based `Milestone` entities (e.g., "First Draft Due"). Each milestone is linked to a parent project and has a title and a due date.
* **Resource Linking:** The backend will allow users to associate external URLs (e.g., to Google Docs, research articles, Figma files) as `Resource` entities within a project.
* **File Storage Interface:** The backend must provide a mechanism to handle file uploads (e.g., PDFs, images). This includes processing file data and interfacing with a storage solution (e.g., local disk for development, a cloud bucket for production). Each stored file will be represented as a `Resource` entity linked to its project.