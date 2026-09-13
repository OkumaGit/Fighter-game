# 🥊 Arena Clash

Arena Clash is a browser-based fighting game with a layered Express backend and a Vite-powered frontend. The project is designed to keep gameplay logic separate from UI rendering and to follow a clean full-stack structure.

---

## 🚀 Tech Stack

- **Frontend:** Vite, vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Architecture:** Routes → Middlewares → Services → Repositories → Models
- **Data flow:** Player selection → arena battle → winner modal / restart flow

---

## 📁 Project Structure

```text
fighter-game/
├── client/                     # Frontend app
│   ├── src/                   # App source code
│   ├── resources/             # Images, backgrounds, fighter assets
│   ├── package.json           # Frontend dependencies and scripts
│   └── vite.config.js         # Vite configuration
├── server/                    # Backend API
│   ├── routes/                # Endpoint definitions
│   ├── middlewares/           # Validation and request handling
│   ├── services/              # Business logic
│   ├── repositories/          # Data access layer
│   ├── models/                # Data models
│   ├── config/                # DB/config setup
│   └── package.json           # Backend dependencies and scripts
├── README.md                  # Project overview
└── package.json               # Workspace root config
```

---

## 🧩 Backend Architecture

The backend follows a layered structure to keep responsibilities clear:

- **routes/** — API endpoints for auth, fighters, fights, and users
- **middlewares/** — request validation, response shaping, and shared guards
- **services/** — core business logic
- **repositories/** — DB and persistence access
- **models/** — domain entities and schema definitions
- **config/** — database and environment configuration

This separation keeps the server easier to extend and easier to test.

---

## ⚙️ Getting Started

Make sure you have Node.js and npm installed.

### 1) Install backend dependencies

```bash
cd server
npm install
```

Create an environment file if required by your setup:

```bash
cp .env.example .env
```

Then start the server:

```bash
npm run dev
```

You can also use the provided startup script:

```bash
./build-start.sh
```

### 2) Install frontend dependencies

Open a new terminal and run:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Then open the URL shown in the terminal, usually something like:

- http://localhost:5173

---

## 🎮 Gameplay Overview

- Choose two fighters
- Start the arena match
- Use controls to attack, block, and move
- Trigger special critical sequences
- Finish the battle and restart the match

---

## �️ Controls

### Player 1

| Action     | Key   |
| ---------- | ----- |
| Move left  | A     |
| Move right | D     |
| Attack     | J     |
| Kick       | K     |
| Block      | S     |
| Jump       | Space |

### Player 2

| Action     | Key         |
| ---------- | ----------- |
| Move left  | Left Arrow  |
| Move right | Right Arrow |
| Attack     | Numpad 1    |
| Kick       | Numpad 2    |
| Block      | Down Arrow  |
| Jump       | Up Arrow    |

> Critical combinations are also available in the fight logic and can be triggered with the configured keys from the controls file.

---

## �📝 Notes

This project is structured around a separation of concerns:

- UI layer handles DOM rendering and visual state
- Game logic remains in the battle engine and domain logic
- Service layer remains focused on API/data access
- Styling remains separate from gameplay logic

This helps keep the project readable, maintainable, and closer to real-world frontend/backend architecture practice.

```

```
