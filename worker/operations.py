"""Pure functions implementing each supported task operation.

Kept isolated from queue/db plumbing so they're trivial to unit test and to
extend with new operations without touching the worker loop.
"""


def op_uppercase(text: str) -> str:
    return text.upper()


def op_lowercase(text: str) -> str:
    return text.lower()


def op_reverse_string(text: str) -> str:
    return text[::-1]


def op_word_count(text: str) -> str:
    words = text.split()
    return str(len(words))


OPERATIONS = {
    "uppercase": op_uppercase,
    "lowercase": op_lowercase,
    "reverse_string": op_reverse_string,
    "word_count": op_word_count,
}


def run_operation(operation: str, text: str) -> str:
    if operation not in OPERATIONS:
        raise ValueError(f"Unsupported operation: {operation}")
    return OPERATIONS[operation](text)
