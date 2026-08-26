"""Reviewed policy for copying reusable RP-configuration answers."""

from collections.abc import Mapping
from copy import deepcopy
from typing import Any

RP_CONFIGURATION_COPY_POLICY_VERSION = 1

# Keep this allowlist intentionally narrow. Environment identity, endpoints,
# URLs, provider identifiers, credentials, and key material must be supplied
# again for the new configuration.
RP_CONFIGURATION_COPY_REUSABLE_ANSWER_FIELDS = frozenset(
    {
        "client_auth_method",
        "client_type",
        "message_decryption_content_algorithms",
        "message_decryption_key_management_algorithms",
        "message_decryption_other_content_algorithm",
        "message_decryption_other_key_management_algorithm",
        "message_decryption_revisit_on",
        "message_decryption_roadmap",
        "message_decryption_supported",
        "message_decryption_targets",
        "pkce_algorithms",
        "pkce_other_algorithm",
        "pkce_supported",
        "request_encryption_content_algorithms",
        "request_encryption_key_management_algorithms",
        "request_encryption_other_content_algorithm",
        "request_encryption_other_key_management_algorithm",
        "request_encryption_revisit_on",
        "request_encryption_roadmap",
        "request_encryption_supported",
        "request_encryption_targets",
        "request_signing_algorithms",
        "request_signing_other_algorithm",
        "request_signing_revisit_on",
        "request_signing_roadmap",
        "request_signing_supported",
        "request_signing_targets",
        "requested_scopes",
        "shares_pairwise_identifiers",
        "signature_validation_algorithms",
        "signature_validation_other_algorithm",
        "signature_validation_revisit_on",
        "signature_validation_roadmap",
        "signature_validation_supported",
        "signature_validation_targets",
        "supports_authorization_code_flow",
    }
)


def copy_reusable_rp_configuration_answers(
    source_answers: Mapping[str, Any],
) -> dict[str, Any]:
    """Return an independent copy containing only reviewed reusable answers."""

    return {
        field_name: deepcopy(source_answers[field_name])
        for field_name in RP_CONFIGURATION_COPY_REUSABLE_ANSWER_FIELDS
        if field_name in source_answers and source_answers[field_name] is not None
    }
