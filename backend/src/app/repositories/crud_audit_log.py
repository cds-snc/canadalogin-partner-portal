from fastcrud import FastCRUD

from ..models.audit_log import AuditLog
from ..schemas.audit_log import AuditLogCreateInternal, AuditLogDelete, AuditLogRead, AuditLogUpdate, AuditLogUpdateInternal

CRUDAuditLog = FastCRUD[AuditLog, AuditLogCreateInternal, AuditLogUpdate, AuditLogUpdateInternal, AuditLogDelete, AuditLogRead]
crud_audit_log = CRUDAuditLog(AuditLog)
