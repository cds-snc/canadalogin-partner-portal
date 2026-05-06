import pytest

from src.app.core.exceptions.http_exceptions import BadRequestException
from src.app.schemas.post import PostStatus
from src.app.workflows.post_workflow import PostWorkflow


class TestPostWorkflow:
    def test_submit_for_review_allows_author_draft_transition(self) -> None:
        workflow = PostWorkflow()

        next_status = workflow.get_next_status(current_status=PostStatus.DRAFT, action="submit_for_review")

        assert next_status == PostStatus.IN_REVIEW

    def test_approve_requires_in_review_status(self) -> None:
        workflow = PostWorkflow()

        with pytest.raises(BadRequestException, match="Action 'approve' is not allowed from status 'draft'"):
            workflow.get_next_status(current_status=PostStatus.DRAFT, action="approve")

    def test_author_can_edit_only_draft_or_rejected_posts(self) -> None:
        workflow = PostWorkflow()

        assert workflow.can_author_edit(PostStatus.DRAFT) is True
        assert workflow.can_author_edit(PostStatus.REJECTED) is True
        assert workflow.can_author_edit(PostStatus.IN_REVIEW) is False
        assert workflow.can_author_edit(PostStatus.APPROVED) is False
