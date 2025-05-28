# Build stage
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /source

# Copy csproj and restore dependencies
COPY *.csproj .
RUN dotnet restore

# Copy everything else and build
COPY . .
RUN dotnet publish -c Release -o /app

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app .

# Create directory for uploaded files
RUN mkdir -p /app/wwwroot/uploads/videos
RUN mkdir -p /app/wwwroot/uploads/thumbnails
RUN mkdir -p /app/wwwroot/uploads/pdfs

# Set proper permissions
RUN chmod 777 -R /app/wwwroot/uploads

EXPOSE 5121

ENTRYPOINT ["dotnet", "EduSyncAPI.dll"] 