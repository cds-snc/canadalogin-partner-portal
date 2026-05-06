import re


def slugify(value: str) -> str:
    """Simple slugify utility: lowercase, replace non-alnum with '-', collapse dashes."""
    if not value:
        return ""
    value = value.lower()
    # replace non-alphanumeric characters with dash
    value = re.sub(r"[^a-z0-9]+", "-", value)
    # strip leading/trailing dashes
    value = value.strip("-")
    # collapse multiple dashes
    value = re.sub(r"-+", "-", value)
    return value
