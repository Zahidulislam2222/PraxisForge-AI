import uvicorn

from .settings import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run("praxis.api:app", host=settings.api_host, port=settings.api_port, proxy_headers=False, server_header=False)
