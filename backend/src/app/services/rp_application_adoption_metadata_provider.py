from typing import Protocol

from ..core.exceptions.cache_exceptions import MissingClientError
from ..schemas.rp_application_adoption import RPApplicationAdoptionProviderMetadata


class RPApplicationAdoptionMetadataProvider(Protocol):
    """Safe projection boundary implemented by the IBM-interactions package."""

    async def get_registration_metadata(
        self,
        application_id: str,
    ) -> RPApplicationAdoptionProviderMetadata: ...


class UnavailableRPApplicationAdoptionMetadataProvider:
    """Fail-closed default used until the external provider package is wired."""

    async def get_registration_metadata(
        self,
        application_id: str,
    ) -> RPApplicationAdoptionProviderMetadata:
        del application_id
        raise MissingClientError("RP adoption metadata provider is not configured")


__all__ = [
    "RPApplicationAdoptionMetadataProvider",
    "UnavailableRPApplicationAdoptionMetadataProvider",
]
