FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY InsureEdge.sln ./

COPY src/InsureEdge.API/InsureEdge.API.csproj src/InsureEdge.API/
COPY src/InsureEdge.Application/InsureEdge.Application.csproj src/InsureEdge.Application/
COPY src/InsureEdge.Domain/InsureEdge.Domain.csproj src/InsureEdge.Domain/
COPY src/InsureEdge.Infrastructure/InsureEdge.Infrastructure.csproj src/InsureEdge.Infrastructure/
COPY tests/InsureEdge.UnitTests/InsureEdge.UnitTests.csproj tests/InsureEdge.UnitTests/

RUN dotnet restore InsureEdge.sln

COPY src/ src/
COPY tests/ tests/

RUN dotnet publish src/InsureEdge.API/InsureEdge.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000

COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["dotnet", "InsureEdge.API.dll"]