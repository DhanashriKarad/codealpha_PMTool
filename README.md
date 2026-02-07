# codealpha_PMTool
# Project Management Tool

## Description
A full-stack project management application built with Node.js backend and React frontend. It allows users to create projects, assign tasks, manage team members, and receive real-time notifications. The backend uses Express and SQLite for data storage, while the frontend provides an interactive dashboard for managing projects and tasks.

## Features
- User authentication and authorization
- Project creation and management
- Task assignment and tracking
- Team member management
- Real-time notifications using Socket.io
- Responsive React frontend
- Secure API with JWT tokens
- SQLite database for data persistence

## Technologies Used
- **Backend:** Node.js, Express.js, SQLite, Socket.io, JWT, bcryptjs
- **Frontend:** React, React Router, Axios, Socket.io-client
- **Database:** SQLite
- **Authentication:** JSON Web Tokens (JWT)
- **Real-time Communication:** Socket.io

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd pm-tool/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

4. Start the backend server:
   ```
   npm start
   ```
   For development with auto-restart:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd pm-tool/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage
- Register a new account or login with existing credentials.
- Create projects and add team members.
- Assign tasks to team members and track progress.
- Receive real-time notifications for task updates.
- Manage your profile and view project dashboards.

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- And more...

## Database
The application uses SQLite. The database file will be created automatically when the backend server starts.

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the ISC License.
