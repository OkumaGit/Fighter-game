Markdown

# JS Fighter (Full-Stack Application)

This repository contains the "JS Fighter" full-stack application. The project is structured into two main parts: the backend (located in the root directory) and the frontend client (located inside the `/client` folder).

## 🚀 Tech Stack

- **Backend:** Node.js, Express.js
- **Architecture Pattern:** Routes -> Middlewares -> Services -> Repositories -> Models
- **Frontend:** React, Vite (located in the `/client` directory)

---

## 🛠️ Backend Architecture

The backend follows a layered architecture to maintain a clean separation of concerns:

- `routes/` — Handles API endpoint routing (auth, fighters, fights, users).
- `middlewares/` — Manages incoming data validation and request/response processing.
- `services/` — Contains the core business logic of the application.
- `repositories/` — Handles direct data access and database operations.
- `models/` — Defines data schemas and object structures (Fighters, Users, etc.).
- `config/` — Holds configuration files and database connection setups.

---

## 💻 Getting Started

To clone and run this project locally, you will need **Node.js** and **npm** installed on your machine.

### 1. Running the Backend (Root Directory)

1. Navigate to the root directory of the project.
2. Install the backend dependencies:

```bash
   npm install
Create a .env file in the root directory based on your environment needs (if applicable) to specify your ports and database credentials.

Start the server in development mode:

Bash
   npm run dev
Alternatively, you can use the provided build script: bash build-start.sh

2. Running the Frontend (Client Directory)
Navigate to the client folder:

Bash
   cd client
Install the frontend dependencies:

Bash
   npm install
Start the local Vite development server:

Bash
   npm run dev

Open [http://localhost:3333](http://localhost:3333)
```
