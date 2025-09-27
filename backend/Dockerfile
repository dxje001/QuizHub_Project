# Multi-stage Dockerfile for ASP.NET Core backend

# Development stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Copy solution and project files
COPY KvizHub.sln ./
COPY src/KvizHub.API/*.csproj ./src/KvizHub.API/
COPY src/KvizHub.Application/*.csproj ./src/KvizHub.Application/
COPY src/KvizHub.Domain/*.csproj ./src/KvizHub.Domain/
COPY src/KvizHub.Infrastructure/*.csproj ./src/KvizHub.Infrastructure/
COPY src/KvizHub.Shared/*.csproj ./src/KvizHub.Shared/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY . .

# Set the startup project
WORKDIR /app/src/KvizHub.API

# Install dotnet-ef tool
RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

# Development command (will be overridden by docker-compose)
CMD ["dotnet", "watch", "run", "--urls", "http://0.0.0.0:8080;https://0.0.0.0:8081"]

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files
COPY KvizHub.sln ./
COPY src/KvizHub.API/*.csproj ./src/KvizHub.API/
COPY src/KvizHub.Application/*.csproj ./src/KvizHub.Application/
COPY src/KvizHub.Domain/*.csproj ./src/KvizHub.Domain/
COPY src/KvizHub.Infrastructure/*.csproj ./src/KvizHub.Infrastructure/
COPY src/KvizHub.Shared/*.csproj ./src/KvizHub.Shared/

# Restore dependencies
RUN dotnet restore

# Copy source code and build
COPY . .
RUN dotnet build -c Release --no-restore

# Publish the application
RUN dotnet publish src/KvizHub.API/KvizHub.API.csproj -c Release -o /app/publish --no-restore

# Production stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=build /app/publish .

# Create non-root user
RUN groupadd -r kvizhub && useradd -r -g kvizhub kvizhub
RUN chown -R kvizhub:kvizhub /app
USER kvizhub

EXPOSE 8080
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "KvizHub.API.dll"]