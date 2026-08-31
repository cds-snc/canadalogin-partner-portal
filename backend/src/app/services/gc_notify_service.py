from typing import Any, cast

import httpx

from ..core.config import settings


class GCNotifyService:
    async def send_email(
        self,
        recipient_email: str,
        personalisation: dict[str, str],
        reference: str,
    ) -> dict[str, Any]:
        api_key = settings.GC_NOTIFY_API_KEY
        template_id = settings.GC_NOTIFY_RP_APPLICATION_INVITE_TEMPLATE_ID
        if api_key is None or template_id is None:
            raise RuntimeError("GC Notify is not configured")

        payload: dict[str, Any] = {
            "email_address": recipient_email,
            "template_id": template_id,
            "personalisation": personalisation,
            "reference": reference,
        }
        if settings.GC_NOTIFY_EMAIL_REPLY_TO_ID:
            payload["email_reply_to_id"] = settings.GC_NOTIFY_EMAIL_REPLY_TO_ID

        async with httpx.AsyncClient(base_url=settings.GC_NOTIFY_BASE_URL.rstrip("/"), timeout=10.0) as client:
            response = await client.post(
                "/v2/notifications/email",
                headers={
                    "Authorization": f"ApiKey-v1 {api_key.get_secret_value()}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        response.raise_for_status()
        response_data = response.json()
        if not isinstance(response_data, dict):
            raise RuntimeError("Unexpected GC Notify response payload")
        return cast(dict[str, Any], response_data)
