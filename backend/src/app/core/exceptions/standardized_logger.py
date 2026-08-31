import hashlib
import json
import logging
from datetime import datetime
from urllib.parse import urlencode

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

PROJECT_NAME = "CanadaLogin"
APPLICATION_NAME = "PartnerPortal"
QUERY_STRING_BLACKLIST = [
    "secret",
    "token",
    "access_token",
    "id_token",
    "code",
    "claims",
]


class StandardizedLogger:
    def _hash_blacklisted_params(self, query_params) -> str:
        """
        Takes a dictionary of parameters, hashes blacklisted values,
        and returns a clean query string.
        """
        processed = {}

        for key, value in query_params.items():
            if key in QUERY_STRING_BLACKLIST and value:
                # Hash the value
                processed[key] = hashlib.sha256(str(value).encode("utf-8")).hexdigest()
            else:
                processed[key] = value

        return urlencode(processed)

    def _build_context(self, request, response):
        context = {
            "user": self._build_user(request),
            "request": self._build_request(request),
            "response": self._build_response(response),
            "endpoint": self._build_endpoint(request),
        }

        # Only include keys where the value is truthy
        return {k: v for k, v in context.items() if v}

    def _build_user(self, request):
        try:
            user_uuid = request.session.get("user_uuid")
            if not user_uuid:
                return None
            return {
                "id": hashlib.sha256(str(user_uuid).encode("utf-8")).hexdigest(),
            }
        except Exception:
            return None

    def _build_request(self, request):
        result = {
            "method": request.method,
            "path": request.url.path,
            "query_string": self._hash_blacklisted_params(request.query_params),
        }
        request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")
        if request_id:
            result["request_id"] = str(request_id)
        return result

    def _build_response(self, response):
        return {"status_code": response.status_code}

    def _build_endpoint(self, request):
        endpoint = request.scope.get("endpoint")
        if endpoint:
            return {
                "file_name": endpoint.__code__.co_filename,
                "line_number": endpoint.__code__.co_firstlineno,
                "module_name": endpoint.__module__,
                "function_name": endpoint.__name__,
            }
        return None

    def log(self, request: Request, response: JSONResponse) -> JSONResponse:
        if response.status_code < 400:
            return response

        if response.status_code >= 500:
            log_level = logging.ERROR
            level = "ERROR"
        else:
            log_level = logging.WARNING
            level = "WARNING"

        context = self._build_context(request, response)
        logger.log(
            log_level,
            json.dumps(
                {
                    "code": f"{PROJECT_NAME}.{APPLICATION_NAME}.{level}.{response.status_code}",
                    "level": level,
                    "context": context,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            ),
        )

        return response
