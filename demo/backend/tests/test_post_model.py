from src.app.models.post import Post
from src.app.models.post_approval import PostApproval
from src.app.schemas.post_approval import PostApprovalRead


class TestPostModel:
    def test_status_column_uses_string_values_matching_migration(self) -> None:
        status_column = Post.__table__.c.status

        assert status_column.type.native_enum is False
        assert status_column.type.enums == ["draft", "in_review", "approved", "rejected"]


class TestPostApprovalModel:
    def test_post_approval_includes_standard_lifecycle_columns(self) -> None:
        required_columns = {"uuid", "created_at", "updated_at", "deleted_at", "is_deleted"}

        assert required_columns.issubset(PostApproval.__table__.columns.keys())

    def test_post_approval_read_exposes_standard_metadata_fields(self) -> None:
        required_fields = {"uuid", "created_at", "updated_at", "deleted_at", "is_deleted"}

        assert required_fields.issubset(PostApprovalRead.model_fields.keys())
        assert "id" not in PostApprovalRead.model_fields
