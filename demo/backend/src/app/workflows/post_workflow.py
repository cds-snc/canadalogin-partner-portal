from ..core.exceptions.http_exceptions import BadRequestException
from ..schemas.post import PostStatus


class PostWorkflow:
	transitions = {
		PostStatus.DRAFT: {
			"submit_for_review": PostStatus.IN_REVIEW,
		},
		PostStatus.IN_REVIEW: {
			"approve": PostStatus.APPROVED,
			"reject": PostStatus.REJECTED,
		},
		PostStatus.REJECTED: {
			"move_to_draft": PostStatus.DRAFT,
			"submit_for_review": PostStatus.IN_REVIEW,
		},
		PostStatus.APPROVED: {},
	}

	def get_next_status(self, current_status: PostStatus | str, action: str) -> PostStatus:
		normalized_status = PostStatus(current_status)
		next_status = self.transitions.get(normalized_status, {}).get(action)
		if next_status is None:
			raise BadRequestException(
				f"Action '{action}' is not allowed from status '{normalized_status.value}'"
			)
		return next_status

	def can_author_edit(self, current_status: PostStatus | str) -> bool:
		normalized_status = PostStatus(current_status)
		return normalized_status in {PostStatus.DRAFT, PostStatus.REJECTED}