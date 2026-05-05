# Docker Setup

## Quick Start

```bash
# 1. Create shared network (one-time setup)
docker network create tdd-network

# 2. Start containers (backend or frontend first - any order)
docker compose up
```

Access: http://localhost:5173

---

## Backend Requirements

Backend container must have:
- `container_name: backend`
- `networks: tdd-network`
- Port `8000` exposed

Example backend `docker-compose.yml`:
```yaml
services:
  backend:
    container_name: backend
    networks:
      - tdd-network

networks:
  tdd-network:
    external: true
```

---

## Commands

| Command | Action |
|---------|--------|
| `docker compose up` | Start container |
| `docker compose down` | Stop container |
| `docker compose up --build` | Rebuild after package.json changes |
| `docker compose run --rm frontend npm run test -- --run` | Run tests |
| `docker compose run --rm frontend npm run lint` | Run linter |

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Network not found" | Run `docker network create tdd-network` first |
| "ENOTFOUND backend" | Ensure backend container is running |
| Port 5173 in use | Stop other process or change port mapping |
