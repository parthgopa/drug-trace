# Docker Commands Reference

## BUILD COMMANDS

### Build Backend Only
```
docker build -t drug-trace-backend:latest ./backend
```

### Build Admin Only
```
docker build -t drug-trace-admin:latest ./admin
```

### Build Both with Docker Compose
```
docker compose build
```

### Build Specific Service
```
docker compose build backend
docker compose build admin
```

### Rebuild Without Cache
```
docker compose build --no-cache
```

---

## START/RUN COMMANDS

### Start All Containers
```
docker compose up -d
```

### Start Backend Only
```
docker compose up -d backend
```

### Start Admin Only
```
docker compose up -d admin
```

---

## STOP COMMANDS

### Stop All Containers
```
docker compose down
```

### Stop Backend Only
```
docker compose stop backend
```

### Stop Admin Only
```
docker compose stop admin
```

---

## LOGS & STATUS

### View Running Containers
```
docker ps --filter "name=drug-trace"
```

### View All Containers (including stopped)
```
docker ps -a | grep drug-trace
```

### Backend Logs (Live)
```
docker logs -f drug-trace-backend
```

### Admin Logs (Live)
```
docker logs -f drug-trace-admin
```

### Last 50 Lines of Backend Logs
```
docker logs --tail 50 drug-trace-backend
```

### Last 50 Lines of Admin Logs
```
docker logs --tail 50 drug-trace-admin
```

---

## COMBINED COMMANDS

### Rebuild Backend & Restart
```
docker compose build backend && docker compose up -d backend
```

### Rebuild Admin & Restart
```
docker compose build admin && docker compose up -d admin
```

### Rebuild Everything & Restart
```
docker compose build && docker compose up -d
```

### Clean Restart (Remove & Start)
```
docker compose down && docker compose build && docker compose up -d
```

---

## CLEANUP COMMANDS

### Remove Stopped Containers
```
docker container prune
```

### Remove Unused Images
```
docker image prune
```

### Remove All Unused Resources
```
docker system prune
```

---

## ACCESS URLS

### Local Access
- Backend API: http://localhost:1500
- Admin Dashboard: http://localhost:1501

### Remote Access (VPS)
- Backend API: http://72.62.79.188:1500
- Admin Dashboard: http://72.62.79.188:1501

### Future Domain
- Backend API: https://trace.onewebmart.cloud/api/
- Admin Dashboard: https://trace.onewebmart.cloud/

---

## SERVICES INFO

| Service | Container Name | Port | Image |
|---------|----------------|------|-------|
| Backend | drug-trace-backend | 1500 | track-trace-backend:latest |
| Admin | drug-trace-admin | 1501 | track-trace-admin:latest |

---

## ENV FILE LOCATION
```
/projects/track-trace/backend/.env
```

---

## DOCKER COMPOSE FILE LOCATION
```
/projects/track-trace/docker-compose.yml
```
