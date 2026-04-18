# Digital File Sharing System

A modern, fast, and secure web application for sharing files directly between devices using WebRTC (P2P) for local network transfers and a centralized server for persistent storage and link-based sharing.

## Overview

This project consists of two main components:
1.  **Frontend (`/dfs`)**: A React application built with Vite, Tailwind CSS, and Socket.IO client.
2.  **Backend (`/backend`)**: A Node.js/Express server providing REST APIs, WebSocket signaling (Socket.IO) for WebRTC, and file storage, backed by a PostgreSQL database using Sequelize ORM.

## Key Features

*   **P2P Local Network Transfer**: Share large files directly between devices on the same local network without consuming internet bandwidth, utilizing WebRTC data channels.
*   **Cloud Storage & Link Sharing**: Upload files to the server and generate shareable links for public or restricted access.
*   **User Authentication**: JWT-based login and registration system.
*   **Dashboard**: Manage your uploaded files, track file shares, and organize your data.
*   **Real-time Signaling**: Instant connection establishment for P2P transfers using Socket.IO.

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18+ recommended)
*   **PostgreSQL Server** running locally or remotely

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sargunesh25/Digital-File-Sharing-System.git
    cd Digital-File-Sharing-System
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../dfs
    npm install
    ```

### Configuration

1.  **Backend Environment (.env):**
    Create a `.env` file in the `backend/` directory with the following variables:
    ```env
    PORT=5000
    JWT_SECRET=your_super_secret_key
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_USER=your_pg_user
    DB_PASSWORD=your_pg_password
    DB_NAME=dfs
    DB_DIALECT=postgres
    ```

2.  **Database Setup:**
    The backend uses Sequelize to synchronize models and apply migrations. Ensure the target PostgreSQL database exists before starting the app.

3.  **Run Database Migrations:**
    ```bash
    npm run migrate
    ```

### Running the Application

To run the full stack locally:

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm start
    # or
    node server.js
    ```
    *The server will run on `http://localhost:5000` (or `http://0.0.0.0:5000` for LAN access).*

2.  **Start the Frontend Development Server:**
    Open a new terminal window:
    ```bash
    cd dfs
    npm run dev
    ```
    *The frontend will be accessible at `http://localhost:5173` (port may vary).*

---

## 🛠 GitHub Workflow & Contribution Guide

## Render Deployment (Backend + Frontend)

### Backend Render service environment variables

Set these values in your backend Render service:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secret_key
DB_HOST=dpg-d7hgchugvqtc738lu2bg-a.oregon-postgres.render.com
DB_PORT=5432
DB_USER=dfs_user
DB_PASSWORD=your_new_render_db_password
DB_NAME=dfs
DB_DIALECT=postgres
BACKEND_PUBLIC_URL=https://your-backend-service.onrender.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Render service environment variables

Set this value in your frontend Render static web service:

```env
VITE_BACKEND_URL=https://your-backend-service.onrender.com
```

### Deployment notes

1. Run backend migrations after setting environment variables.
2. Redeploy backend service.
3. Redeploy frontend service so it uses `VITE_BACKEND_URL`.
4. Verify `https://your-backend-service.onrender.com/` and `/api-docs` are reachable.

This project follows a standard Git workflow. Whether you are fixing a bug or developing a new feature, please follow these steps:

### 1. Branching Strategy

*   **`main`**: The primary branch containing production-ready code. Treat this branch as read-only. NEVER push directly to `main`.
*   **Feature Branches**: Create a new branch off `main` for any new development.
    *   Format: `feature/your-feature-name` (e.g., `feature/add-dark-mode`)
    *   Format: `fix/your-bug-fix` (e.g., `fix/login-crash`)

### 2. Development Workflow

1.  **Ensure you are up to date:**
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Create your feature branch:**
    ```bash
    git checkout -b feature/awesome-new-feature
    ```

3.  **Make your changes and commit frequently:**
    Write clear, descriptive commit messages.
    ```bash
    git add .
    git commit -m "feat: Add user avatar upload functionality"
    ```

### 3. Creating a Pull Request (PR)

1.  **Push your branch to GitHub:**
    ```bash
    git push origin feature/awesome-new-feature
    ```
2.  **Open a Pull Request:**
    Navigate to the repository on GitHub. You should see a prompt to compare and create a Pull Request for your recently pushed branch.
3.  **Describe your changes:**
    Provide a clear title and description in the PR template explaining *what* you changed and *why*.
4.  **Wait for Review:**
    A project maintainer will review your code. They may request changes or approve the PR.
5.  **Merge:**
    Once approved, the PR will be merged into `main`. You can then safely delete your feature branch.

### 4. Handling Merge Conflicts

If `main` has been updated while you were working on your feature branch, you may encounter merge conflicts when opening a PR.

1.  Update your local `main`: `git checkout main && git pull`
2.  Switch back to your branch: `git checkout feature/your-branch`
3.  Merge main into your branch: `git merge main`
4.  Resolve the conflicts manually in your code editor.
5.  Commit the resolved files and push again.

## Project Structure

```text
Digital-File-Sharing-System/
├── backend/                  # Node.js Express server
│   ├── config/               # Database configuration
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth and upload middleware
│   ├── migrations/           # Sequelize DB migrations
│   ├── models/               # Sequelize DB models
│   ├── routers/              # API and Socket routes
│   ├── seeders/              # DB seed data
│   ├── uploads/              # Local storage for uploaded files
│   └── server.js             # Entry point
│
├── dfs/                      # React Frontend (Vite)
│   ├── public/               # Static assets
│   ├── src/                  # React source code
│   │   ├── api/              # Axios API configurations
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Page components (Dashboard, Views)
│   │   └── services/         # WebRTC and Socket.io services
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite bundler configuration
│
└── README.md                 # This file
```
