import os
import time
from typing import Callable

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from google import genai
except ImportError:
    genai = None

if load_dotenv:
    load_dotenv()

PRIMARY_MODEL = os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash")
RETRY_DELAYS_SECONDS = (1, 3)

_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        if genai is None:
            raise RuntimeError("google-genai is not installed.")
        _gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _gemini_client


def is_rate_limit_error(error_text: str) -> bool:
    return "429" in error_text or "RESOURCE_EXHAUSTED" in error_text


def is_retryable_busy_error(error_text: str) -> bool:
    return (
        "503" in error_text
        or "UNAVAILABLE" in error_text
        or "high demand" in error_text.lower()
    )


def generate_content_with_retry(
    *,
    contents,
    config=None,
    client=None,
    primary_model: str = PRIMARY_MODEL,
    fallback_model: str = FALLBACK_MODEL,
    sleep: Callable[[int], None] = time.sleep,
):
    active_client = client or get_gemini_client()
    last_error = None

    for attempt_index, model in enumerate([primary_model] * 3 + [fallback_model]):
        try:
            kwargs = {
                "model": model,
                "contents": contents,
            }
            if config is not None:
                kwargs["config"] = config
            return active_client.models.generate_content(**kwargs)
        except Exception as e:
            error_text = str(e)
            last_error = e

            if is_rate_limit_error(error_text):
                raise

            if not is_retryable_busy_error(error_text):
                raise

            if attempt_index < len(RETRY_DELAYS_SECONDS):
                sleep(RETRY_DELAYS_SECONDS[attempt_index])
                continue

            if attempt_index == 2:
                continue

            raise

    if last_error:
        raise last_error
    raise RuntimeError("Gemini response generation failed without an error.")
