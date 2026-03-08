# Frontend Setup

## Prerequisites

- Docker Desktop running
- Backend container running (or start after frontend)

## Quick Start

```bash
# 1. Create shared network (one-time)
docker network create tdd-network

# 2. Start frontend (backend can be first or second - any order)
docker compose up
```

Access: http://localhost:5173

---

## Commands

```bash
docker compose up          # Start
docker compose down        # Stop
docker compose up --build  # Rebuild (after package.json changes)
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Network not found" | Run `docker network create tdd-network` first |
| "ENOTFOUND backend" | Check backend is running: `docker ps` |
| Port 5173 in use | Change to `5174:5173` in docker-compose.yml |
| Hot reload not working | `docker compose down && docker compose up` |
