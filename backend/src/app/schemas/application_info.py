
import uuid as uuid_pkg
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

from ..core.schemas import PersistentDeletion, UUIDSchema


class AuthenticationProtocol(str, Enum):
    OIDC = "OIDC"
    SAML = "SAML"
    BOTH_OIDC_AND_SAML = "BOTH_OIDC_AND_SAML"
    NONE = "NONE"


class IdentityProofingMethod(str, Enum):
    NONE = "NONE"
    EXTERNAL_ID_PROVIDER = "EXTERNAL_ID_PROVIDER"
    IN_PERSON_ID_PROVIDER = "IN_PERSON_ID_PROVIDER"
    OTHER = "OTHER"


class ConsolidatorUsed(str, Enum):
    NONE = "NONE"
    GCCF_GCKEY_INTERAC_SAML = "GCCF_GCKEY_INTERAC_SAML"
    GCCF_CONSOLIDATOR_OIDC = "GCCF_CONSOLIDATOR_OIDC"
    SIGNIN_CANADA = "SIGNIN_CANADA"
    ECAS = "ECAS"


class CurrentMfaOption(str, Enum):
    NONE = "NONE"
    MFAAS_1 = "MFAAS_1"
    MFAAS_2 = "MFAAS_2"
    MFAAS_3 = "MFAAS_3"
    CUSTOM_INTERNAL = "CUSTOM_INTERNAL"


class CurrentSignInOption(str, Enum):
    GC_KEY = "GC_KEY"
    INTERAC_SIGN_IN = "INTERAC_SIGN_IN"
    ALBERTA_CA_ACCOUNT = "ALBERTA_CA_ACCOUNT"
    BC_SERVICES_CARD = "BC_SERVICES_CARD"
    DEPARTMENT_CREDENTIAL = "DEPARTMENT_CREDENTIAL"
    OTHER = "OTHER"


class UserType(str, Enum):
    PUBLIC = "PUBLIC"
    ORGANIZATIONS_AND_BUSINESSES = "ORGANIZATIONS_AND_BUSINESSES"
    OFFICIAL_REPRESENTATIVES = "OFFICIAL_REPRESENTATIVES"


class PersonalInformationType(str, Enum):
    FIRST_NAME = "FIRST_NAME"
    LAST_NAME = "LAST_NAME"
    EMAIL_ADDRESS = "EMAIL_ADDRESS"
    DATE_OF_BIRTH = "DATE_OF_BIRTH"
    ADDRESS = "ADDRESS"


AUTHENTICATION_PROTOCOL_VALUES = {value.value for value in AuthenticationProtocol}
IDENTITY_PROOFING_METHOD_VALUES = {value.value for value in IdentityProofingMethod}
CONSOLIDATOR_VALUES = {value.value for value in ConsolidatorUsed}
CURRENT_MFA_OPTION_VALUES = {value.value for value in CurrentMfaOption}
CURRENT_SIGN_IN_OPTION_VALUES = {value.value for value in CurrentSignInOption}
USER_TYPE_VALUES = {value.value for value in UserType}
PERSONAL_INFORMATION_VALUES = {value.value for value in PersonalInformationType}


def _validate_allowed_value(value: str | None, allowed_values: set[str], field_name: str) -> str | None:
    if value is None:
        return None
    if value not in allowed_values:
        raise ValueError(f"Invalid {field_name}")
    return value


def _validate_allowed_list(values: list[str], allowed_values: set[str], field_name: str) -> list[str]:
    invalid_values = [value for value in values if value not in allowed_values]
    if invalid_values:
        raise ValueError(f"Invalid {field_name}")
    return values


class ApplicationInfoBase(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    application_name: str = Field(..., min_length=1, max_length=255)
    about_application: str = Field(..., min_length=1)
    program_line_of_business: str = Field(..., min_length=1, max_length=255)
    application_url: str = Field(..., min_length=1, max_length=500)
    application_description: str = Field(..., min_length=1)
    portal_name: str | None = None
    technology: str = Field(..., min_length=1, max_length=255)
    authentication_protocol: str = Field(..., min_length=1, max_length=100)
    planned_oidc_implementation_date: str | None = None
    tech_stack: str = Field(..., min_length=1)
    requests_profile_data_pushes: bool
    has_access_management_layer: bool
    rollback_strategy: str = Field(..., min_length=1)
    credential_assurance_level: str = Field(..., min_length=1, max_length=100)
    identity_assurance_level: str = Field(..., min_length=1, max_length=100)
    identity_proofing_method: str = Field(..., min_length=1, max_length=255)
    identity_proofing_method_other: str | None = None
    is_cbas: bool
    has_account_recovery: bool
    authority_to_collect_personal_information: str = Field(..., min_length=1)
    has_privacy_notice: bool
    user_types: list[str] = Field(default_factory=list)
    user_type_other: str | None = None
    monthly_active_users: int | None = Field(None, ge=0)
    peak_usage_periods: str | None = None
    personal_information_collected: list[str] = Field(default_factory=list)
    personal_information_other: str | None = None
    current_sign_in_options: list[str] = Field(default_factory=list)
    current_sign_in_options_other: str | None = None
    consolidator_used: str | None = None
    current_mfa_options: str | None = None
    uses_canadalogin_migration: bool
    migration_rationale: str | None = None
    schedule_blackout_periods: str | None = None
    transition_risks: str | None = None
    transition_mitigations: str | None = None

    @field_validator("authentication_protocol")
    @classmethod
    def validate_authentication_protocol(cls, value: str) -> str:
        return _validate_allowed_value(value, AUTHENTICATION_PROTOCOL_VALUES, "authentication protocol") or value

    @field_validator("identity_proofing_method")
    @classmethod
    def validate_identity_proofing_method(cls, value: str) -> str:
        return _validate_allowed_value(value, IDENTITY_PROOFING_METHOD_VALUES, "identity proofing method") or value

    @field_validator("consolidator_used")
    @classmethod
    def validate_consolidator_used(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, CONSOLIDATOR_VALUES, "consolidator used")

    @field_validator("current_mfa_options")
    @classmethod
    def validate_current_mfa_options(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, CURRENT_MFA_OPTION_VALUES, "current MFA option")

    @field_validator("current_sign_in_options")
    @classmethod
    def validate_current_sign_in_options(cls, values: list[str]) -> list[str]:
        return _validate_allowed_list(values, CURRENT_SIGN_IN_OPTION_VALUES, "current sign-in option")

    @field_validator("user_types")
    @classmethod
    def validate_user_types(cls, values: list[str]) -> list[str]:
        return _validate_allowed_list(values, USER_TYPE_VALUES, "user type")

    @field_validator("personal_information_collected")
    @classmethod
    def validate_personal_information_collected(cls, values: list[str]) -> list[str]:
        return _validate_allowed_list(values, PERSONAL_INFORMATION_VALUES, "personal information")

    @model_validator(mode="after")
    def validate_other_fields(self) -> "ApplicationInfoBase":
        if self.identity_proofing_method == IdentityProofingMethod.OTHER.value and not self.identity_proofing_method_other:
            raise ValueError("identity_proofing_method_other is required when identity_proofing_method is OTHER")
        return self


class ApplicationInfoCreate(ApplicationInfoBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)


class ApplicationInfoCreateInternal(ApplicationInfoBase):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    workspace_id: int
    created_by: int | None = None


class ApplicationInfoRead(ApplicationInfoBase, UUIDSchema, PersistentDeletion):
    id: int
    workspace_id: int
    rp_application_uuid: uuid_pkg.UUID | None = None
    created_by: int | None = None
    created_at: datetime


class ApplicationInfoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    application_name: str | None = Field(None, min_length=1, max_length=255)
    about_application: str | None = Field(None, min_length=1)
    program_line_of_business: str | None = Field(None, min_length=1, max_length=255)
    application_url: str | None = Field(None, min_length=1, max_length=500)
    application_description: str | None = Field(None, min_length=1)
    portal_name: str | None = None
    technology: str | None = Field(None, min_length=1, max_length=255)
    authentication_protocol: str | None = Field(None, min_length=1, max_length=100)
    planned_oidc_implementation_date: str | None = None
    tech_stack: str | None = Field(None, min_length=1)
    requests_profile_data_pushes: bool | None = None
    has_access_management_layer: bool | None = None
    rollback_strategy: str | None = Field(None, min_length=1)
    credential_assurance_level: str | None = Field(None, min_length=1, max_length=100)
    identity_assurance_level: str | None = Field(None, min_length=1, max_length=100)
    identity_proofing_method: str | None = Field(None, min_length=1, max_length=255)
    identity_proofing_method_other: str | None = None
    is_cbas: bool | None = None
    has_account_recovery: bool | None = None
    authority_to_collect_personal_information: str | None = Field(None, min_length=1)
    has_privacy_notice: bool | None = None
    user_types: list[str] | None = None
    user_type_other: str | None = None
    monthly_active_users: int | None = Field(None, ge=0)
    peak_usage_periods: str | None = None
    personal_information_collected: list[str] | None = None
    personal_information_other: str | None = None
    current_sign_in_options: list[str] | None = None
    current_sign_in_options_other: str | None = None
    consolidator_used: str | None = None
    current_mfa_options: str | None = None
    uses_canadalogin_migration: bool | None = None
    migration_rationale: str | None = None
    schedule_blackout_periods: str | None = None
    transition_risks: str | None = None
    transition_mitigations: str | None = None

    @field_validator("authentication_protocol")
    @classmethod
    def validate_authentication_protocol(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, AUTHENTICATION_PROTOCOL_VALUES, "authentication protocol")

    @field_validator("identity_proofing_method")
    @classmethod
    def validate_identity_proofing_method(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, IDENTITY_PROOFING_METHOD_VALUES, "identity proofing method")

    @field_validator("consolidator_used")
    @classmethod
    def validate_consolidator_used(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, CONSOLIDATOR_VALUES, "consolidator used")

    @field_validator("current_mfa_options")
    @classmethod
    def validate_current_mfa_options(cls, value: str | None) -> str | None:
        return _validate_allowed_value(value, CURRENT_MFA_OPTION_VALUES, "current MFA option")

    @field_validator("current_sign_in_options")
    @classmethod
    def validate_current_sign_in_options(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return _validate_allowed_list(values, CURRENT_SIGN_IN_OPTION_VALUES, "current sign-in option")

    @field_validator("user_types")
    @classmethod
    def validate_user_types(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return _validate_allowed_list(values, USER_TYPE_VALUES, "user type")

    @field_validator("personal_information_collected")
    @classmethod
    def validate_personal_information_collected(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        return _validate_allowed_list(values, PERSONAL_INFORMATION_VALUES, "personal information")

    @model_validator(mode="after")
    def validate_other_fields(self) -> "ApplicationInfoUpdate":
        if self.identity_proofing_method == IdentityProofingMethod.OTHER.value and not self.identity_proofing_method_other:
            raise ValueError("identity_proofing_method_other is required when identity_proofing_method is OTHER")
        return self


class ApplicationInfoUpdateInternal(ApplicationInfoUpdate):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    updated_at: datetime


class ApplicationInfoDelete(BaseModel):
    pass


class ApplicationContactBase(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    title_role: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    phone_number: str = Field(..., min_length=1, max_length=50)
    alternate_phone_number: str | None = None
    contact_type: str | None = None
    action: str | None = None
    contact_roles: list[str] = Field(default_factory=list)


class ApplicationContactCreate(ApplicationContactBase):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)


class ApplicationContactCreateInternal(ApplicationContactBase):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    application_info_id: int


class ApplicationContactRead(ApplicationContactBase, UUIDSchema, PersistentDeletion):
    id: int
    application_info_id: int
    created_at: datetime


class ApplicationContactUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    title_role: str | None = Field(None, min_length=1, max_length=255)
    email: str | None = Field(None, min_length=1, max_length=255)
    phone_number: str | None = Field(None, min_length=1, max_length=50)
    alternate_phone_number: str | None = None
    contact_type: str | None = None
    action: str | None = None
    contact_roles: list[str] | None = None


class ApplicationContactUpdateInternal(ApplicationContactUpdate):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    updated_at: datetime


class ApplicationContactDelete(BaseModel):
    pass
