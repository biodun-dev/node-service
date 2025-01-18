
# Real-Time Sports Betting & Leaderboard System (Node.js)

## Overview

This repository contains the Node.js backend service for handling real-time updates in the sports betting and leaderboard system. The system utilizes WebSockets for real-time event broadcasting and Redis for efficient data handling.

## Features

- **Authentication:** JWT-based authentication for secure API access.
- **WebSockets:** Real-time event updates for betting odds, user bets, and leaderboard changes.
- **Event Handling:** Manages sports betting events dynamically.
- **Redis Caching:** Optimizes performance for frequently accessed data.
- **Middleware Logging:** Tracks API requests for debugging.
- **Modular Structure:** Organized using NestJS with feature-based modules.

## Tech Stack

- **Node.js** (Runtime)
- **NestJS** (Framework)
- **TypeScript** (Language)
- **WebSockets** (Real-time communication)
- **Redis** (Caching & Pub/Sub)
- **JWT** (Authentication)
- **Docker** (Containerization, if applicable)

## Project Structure

```
src
├── app.controller.ts        # Main application controller
├── app.module.ts            # Root module
├── auth                     # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── config                   # Configuration management
│   └── config.module.ts
├── events                   # Betting event management
│   ├── events.controller.ts
│   ├── events.module.ts
│   ├── events.service.ts
├── middlewares              # Middleware for request handling
│   ├── logging.middleware.ts
│   └── middlewares.module.ts
├── redis                    # Redis service for caching
│   ├── redis.module.ts
│   └── redis.service.ts
├── user                     # User module for profile management
│   ├── user.controller.ts
│   ├── user.module.ts
│   ├── user.service.ts
├── utils                    # Utility functions & logging
│   ├── logger.service.ts
│   └── utils.module.ts
└── websocket                # WebSockets for real-time updates
    ├── websocket.controller.ts
    ├── websocket.gateway.ts
    ├── websocket.module.ts
```

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd node-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env` file with the following variables:
   ```
   PORT=5000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   SECRET_KEY_BASE=your_secret_key_here
   JWT_SECRET=test_secret_key  # Ensure this matches the Rails dashboard
   DB_HOST=<rails_backend_db_host>
   DB_USERNAME=<rails_backend_db_username>
   DB_PASSWORD=<rails_backend_db_password>
   ```

4. Run the application:
   ```bash
   npm run start:dev
   ```

## API Endpoints


### Users

- `GET /user/profile` – Get user details (requires JWT)
- `PUT /user/update` – Update user details

### Events

- `GET /events` – Fetch all active sports events
- `POST /events/bet` – Place a bet on an event

### WebSockets

- `ws://localhost:5000/websockets` – Connect for real-time betting updates


- `http://localhost:5000/api-docs` – Connect to swagga docs

## Running with Docker

1. Create a `docker-compose.yml` file:
   ```yaml
   version: '3.8'
   services:
     node-service:
       build: .
       ports:
         - "3000:3000"
       env_file:
         - .env
       depends_on:
         - redis
     redis:
       image: "redis:alpine"
       ports:
         - "6379:6379"
   ```

2. Run:
   ```bash
   docker-compose up --build
   ```

## Testing

Run unit tests using:
```bash
npm run test
```

## Contributing

1. Fork the repo.
2. Create a new branch (`feature-xyz`).
3. Commit your changes.
4. Open a Pull Request.

## License

This project is licensed under the MIT License.
