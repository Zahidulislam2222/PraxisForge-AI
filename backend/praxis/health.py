import http.client

from .settings import get_settings

if __name__ == "__main__":
    settings = get_settings()
    connection = http.client.HTTPConnection("127.0.0.1", settings.api_port, timeout=settings.http_timeout_seconds)
    try:
        connection.request("GET", settings.api_prefix + "/health")
        response = connection.getresponse()
        if response.status != 200:
            raise RuntimeError("API health check failed")
    finally:
        connection.close()
