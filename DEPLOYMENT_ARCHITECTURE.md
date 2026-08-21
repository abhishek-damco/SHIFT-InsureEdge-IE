# InsureEdge Deployment Architecture

**Complete Guide to Development, Staging, and Production Deployment**

---

## 1. Development Environment

### Local Setup

**Prerequisites:**
- .NET 8.0 SDK or later
- PostgreSQL 14+ (local or Docker)
- Node.js 18+ and npm
- Git
- Visual Studio Code or Visual Studio

### Database Setup

#### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb insureedge

# Create user
createuser -P insureedge_user  # Enter password when prompted

# Set user permissions
psql -c "ALTER ROLE insureedge_user WITH SUPERUSER;"

# Connection string
DefaultConnection=postgresql://insureedge_user:password@localhost:5432/insureedge
```

#### Option 2: Docker PostgreSQL

```dockerfile
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: insureedge
      POSTGRES_USER: insureedge_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

### Backend Setup

```bash
cd Backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://insureedge_user:password@localhost:5432/insureedge
ASPNETCORE_ENVIRONMENT=Development
PLUMSAIL_PROCESS_ID=REPLACE_WITH_ID
PLUMSAIL_USER_ID=REPLACE_WITH_ID
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@example.com
SMTP_PASSWORD=your_app_password
EOF

# Restore packages
dotnet restore

# Apply migrations
dotnet ef database update \
  --project src/InsureEdge.Infrastructure \
  --startup-project src/InsureEdge.API

# Run API server
dotnet run --project src/InsureEdge.API
```

**API runs on:** `http://localhost:5114`

### Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:5114/api
EOF

# Run dev server
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

### Testing Development Build

```bash
# Open browser
open http://localhost:3000

# Login with dev credentials
Email: admin@insureedge.com
Password: (set in dev_seed.sql)

# Test API directly
curl -X GET http://localhost:5114/api/claims
```

---

## 2. Docker Containerization

### Backend Dockerfile

```dockerfile
# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Backend/src/InsureEdge.API/InsureEdge.API.csproj", "InsureEdge.API/"]
COPY ["Backend/src/InsureEdge.Application/InsureEdge.Application.csproj", "InsureEdge.Application/"]
COPY ["Backend/src/InsureEdge.Domain/InsureEdge.Domain.csproj", "InsureEdge.Domain/"]
COPY ["Backend/src/InsureEdge.Infrastructure/InsureEdge.Infrastructure.csproj", "InsureEdge.Infrastructure/"]

RUN dotnet restore "InsureEdge.API/InsureEdge.API.csproj"

COPY Backend/src .
RUN dotnet publish "InsureEdge.API/InsureEdge.API.csproj" -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5114
EXPOSE 5114

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5114/health || exit 1

ENTRYPOINT ["dotnet", "InsureEdge.API.dll"]
```

### Frontend Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20 AS build
WORKDIR /app

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend .
ARG VITE_API_BASE_URL=http://api:5114/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:latest
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing: always serve index.html for non-static routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://api:5114/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: insureedge
      POSTGRES_USER: insureedge_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U insureedge_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://insureedge_user:password@postgres:5432/insureedge
      ASPNETCORE_ENVIRONMENT: Development
    ports:
      - "5114:5114"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5114/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Frontend/Dockerfile
      args:
        VITE_API_BASE_URL: http://api:5114/api
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

### Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f api
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

---

## 3. Production Deployment

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CDN / Load Balancer                       │
│                  (TLS Termination, DDoS)                     │
└─────────────────────────────────────────────────────────────┘
                    ↓                      ↓
        ┌──────────────────┐    ┌──────────────────┐
        │  Frontend 1      │    │  Frontend 2      │
        │  (React/Nginx)   │    │  (React/Nginx)   │
        │  Static Assets   │    │  Static Assets   │
        └──────────────────┘    └──────────────────┘
                    ↓                      ↓
        ┌──────────────────┐    ┌──────────────────┐
        │  API Server 1    │    │  API Server 2    │
        │  (ASP.NET Core)  │    │  (ASP.NET Core)  │
        │  Port 5114       │    │  Port 5114       │
        └──────────────────┘    └──────────────────┘
                    ↓                      ↓
        ┌──────────────────────────────────────────┐
        │     PostgreSQL Database Cluster          │
        │  ┌────────────┐      ┌────────────┐      │
        │  │  Primary   │      │  Replica   │      │
        │  │  (RW)      │──────│  (RO)      │      │
        │  └────────────┘      └────────────┘      │
        │        ↓                                  │
        │  ┌────────────────────────────────┐      │
        │  │  Automated Backups (S3/Blob)   │      │
        │  └────────────────────────────────┘      │
        └──────────────────────────────────────────┘
                    ↓                      ↓
        ┌──────────────────┐    ┌──────────────────┐
        │  Email Service   │    │  Plumsail API    │
        │  (SMTP)          │    │  (Document Gen)  │
        └──────────────────┘    └──────────────────┘
```

### Deployment Steps

#### Step 1: Prepare Infrastructure

```bash
# Create Azure/AWS resources
# - Kubernetes cluster (or App Service/ECS)
# - PostgreSQL managed database
# - Load balancer
# - CDN
# - S3/Blob storage for backups
```

#### Step 2: Build Images

```bash
# Build Docker images
docker build -t insureedge-api:v1.0.0 -f Backend/Dockerfile .
docker build -t insureedge-frontend:v1.0.0 -f Frontend/Dockerfile .

# Push to registry
docker tag insureedge-api:v1.0.0 myregistry.azurecr.io/insureedge-api:v1.0.0
docker tag insureedge-frontend:v1.0.0 myregistry.azurecr.io/insureedge-frontend:v1.0.0

docker push myregistry.azurecr.io/insureedge-api:v1.0.0
docker push myregistry.azurecr.io/insureedge-frontend:v1.0.0
```

#### Step 3: Configure Environment Variables

```bash
# Create production .env
export DATABASE_URL=postgresql://user:pass@prod-db.database.azure.com:5432/insureedge
export ASPNETCORE_ENVIRONMENT=Production
export PLUMSAIL_PROCESS_ID=<production-id>
export PLUMSAIL_USER_ID=<production-id>
export SMTP_HOST=smtp.office365.com
export SMTP_PORT=587
export SMTP_USERNAME=noreply@insureedge.com
export SMTP_PASSWORD=<secure-password>
export CORS_ORIGINS=https://app.insureedge.com
```

#### Step 4: Database Migration

```bash
# Create migration script
dotnet ef database update \
  --project Backend/src/InsureEdge.Infrastructure \
  --startup-project Backend/src/InsureEdge.API \
  --configuration Release
```

#### Step 5: Deploy to Kubernetes

```yaml
# kubernetes/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: insureedge-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: insureedge-api
  template:
    metadata:
      labels:
        app: insureedge-api
    spec:
      containers:
      - name: api
        image: myregistry.azurecr.io/insureedge-api:v1.0.0
        ports:
        - containerPort: 5114
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: insureedge-secrets
              key: database-url
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: PLUMSAIL_PROCESS_ID
          valueFrom:
            secretKeyRef:
              name: insureedge-secrets
              key: plumsail-process-id
        livenessProbe:
          httpGet:
            path: /health
            port: 5114
          initialDelaySeconds: 40
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 5114
          initialDelaySeconds: 10
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: insureedge-api
spec:
  selector:
    app: insureedge-api
  ports:
  - protocol: TCP
    port: 5114
    targetPort: 5114
  type: ClusterIP
```

```bash
# Deploy
kubectl apply -f kubernetes/api-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml

# Monitor rollout
kubectl rollout status deployment/insureedge-api
```

#### Step 6: Configure Ingress

```yaml
# kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: insureedge-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.insureedge.com
    secretName: insureedge-tls
  rules:
  - host: app.insureedge.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: insureedge-api
            port:
              number: 5114
      - path: /
        pathType: Prefix
        backend:
          service:
            name: insureedge-frontend
            port:
              number: 80
```

```bash
kubectl apply -f kubernetes/ingress.yaml
```

### Database Backup & Recovery

#### Automated Backups

```bash
# PostgreSQL automated backup (daily at 2 AM UTC)
30 2 * * * pg_basebackup -D /backups/daily_$(date +\%Y\%m\%d) -Ft -z

# Upload to cloud storage
aws s3 sync /backups s3://insureedge-backups/
```

#### Point-in-Time Recovery

```bash
# List available backups
aws s3 ls s3://insureedge-backups/

# Download backup
aws s3 cp s3://insureedge-backups/daily_20260731.tar.gz /restore/

# Restore to specific point
pg_basebackup -D /var/lib/postgresql/14/main -Ft -z
# Set recovery_target_time in postgresql.conf
recovery_target_time = '2026-07-31 14:30:00 UTC'
```

---

## 4. Monitoring & Logging

### Application Monitoring

```csharp
// Health check endpoints
app.MapGet("/health", () => "Healthy")
   .WithName("Health")
   .WithOpenApi();

app.MapGet("/ready", async (InsureEdgeDbContext db) =>
{
    try
    {
        await db.Database.ExecuteSqlAsync($"SELECT 1");
        return Results.Ok("Ready");
    }
    catch
    {
        return Results.StatusCode(503);
    }
})
.WithName("Readiness")
.WithOpenApi();
```

### Logging Configuration

```csharp
// appsettings.Production.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    },
    "Console": {
      "IncludeScopes": true
    }
  }
}
```

### Metrics & Alerts

**Azure Application Insights:**
```csharp
builder.Services.AddApplicationInsightsTelemetry();

// Log custom events
var telemetry = app.Services.GetRequiredService<TelemetryClient>();
telemetry.TrackEvent("PolicyCreated", new { policyId = 456 });
telemetry.TrackEvent("ClaimApproved", new { claimId = 123, amount = 50000 });
```

**Alerts:**
- 5xx error rate > 1%
- API response time > 2 seconds
- Database connection pool exhaustion
- Disk space < 10%

---

## 5. Scaling Considerations

### Horizontal Scaling

**API Servers:**
```
Load Balancer
  ├─ API Server 1 (CPU: 30%)
  ├─ API Server 2 (CPU: 35%)
  └─ API Server 3 (CPU: 40%) ← Scale up when > 80%
```

**Auto-Scaling Policy:**
- Scale up when CPU > 80% for 5 minutes
- Scale down when CPU < 30% for 10 minutes
- Min replicas: 2, Max replicas: 10

### Database Scaling

**Read Replicas:**
```
PostgreSQL Primary (Write)
  ├─ Replica 1 (Read)
  ├─ Replica 2 (Read)
  └─ Replica 3 (Read)

// Application reads from replica
var readDb = dbOptions.UseNpgsql(readReplicaConnectionString);
```

**Connection Pooling:**
- Min pool size: 5
- Max pool size: 30
- Connection lifetime: 30 minutes

---

## 6. Security in Production

### HTTPS/TLS

```
Certificate: Let's Encrypt (free, auto-renewing)
TLS Version: 1.2+
Cipher Suites: Only strong ciphers
HSTS: max-age=31536000 (force HTTPS for 1 year)
```

### Secret Management

```bash
# Use managed secrets (not in code)
export DATABASE_URL=$(kubectl get secret insureedge-secrets -o jsonpath='{.data.database-url}' | base64 -d)
export PLUMSAIL_USER_ID=$(kubectl get secret insureedge-secrets -o jsonpath='{.data.plumsail-user-id}' | base64 -d)
```

### Environment Variables (Production)

```
DATABASE_URL: secure-connection-string
ASPNETCORE_ENVIRONMENT: Production
ASPNETCORE_URLS: http://+:5114
PLUMSAIL_PROCESS_ID: actual-process-id
PLUMSAIL_USER_ID: actual-user-id
SMTP_HOST: smtp.office365.com
SMTP_PORT: 587
SMTP_USERNAME: production-email@insureedge.com
SMTP_PASSWORD: (from secrets)
CORS_ORIGINS: https://app.insureedge.com
```

---

## 7. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore dependencies
        run: dotnet restore Backend
      
      - name: Build
        run: dotnet build Backend --configuration Release --no-restore
      
      - name: Run tests
        run: dotnet test Backend --configuration Release --no-build --verbosity normal
      
      - name: Publish
        run: dotnet publish Backend/src/InsureEdge.API -c Release -o ./publish
      
      - name: Build Docker images
        run: |
          docker build -t insureedge-api:${{ github.sha }} -f Backend/Dockerfile .
          docker build -t insureedge-frontend:${{ github.sha }} -f Frontend/Dockerfile .
      
      - name: Push to registry
        run: |
          docker tag insureedge-api:${{ github.sha }} myregistry.azurecr.io/insureedge-api:latest
          docker push myregistry.azurecr.io/insureedge-api:latest
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/insureedge-api \
            insureedge-api=myregistry.azurecr.io/insureedge-api:latest
```

---

## Conclusion

InsureEdge deployment architecture provides:

✅ **Automated Setup** via Docker Compose for development  
✅ **Production Ready** with Kubernetes orchestration  
✅ **High Availability** with load balancing & replicas  
✅ **Secure Credentials** via secrets management  
✅ **Monitoring** with health checks & alerts  
✅ **Scalability** with auto-scaling policies  
✅ **Backup & Recovery** with automated backups  
✅ **CI/CD** with GitHub Actions  

