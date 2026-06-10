import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gemini_retry import (
    FALLBACK_MODEL,
    PRIMARY_MODEL,
    generate_content_with_retry,
    is_rate_limit_error,
    is_retryable_busy_error,
)


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModels:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return FakeResponse(outcome)


class FakeClient:
    def __init__(self, outcomes):
        self.models = FakeModels(outcomes)


class GeminiRetryTests(unittest.TestCase):
    def test_retries_primary_model_with_fixed_delays_before_success(self):
        client = FakeClient([
            RuntimeError("503 UNAVAILABLE high demand"),
            RuntimeError("503 UNAVAILABLE high demand"),
            "ok",
        ])
        sleeps = []

        response = generate_content_with_retry(
            client=client,
            contents="hello",
            sleep=sleeps.append,
        )

        self.assertEqual(response.text, "ok")
        self.assertEqual(
            [call["model"] for call in client.models.calls],
            [PRIMARY_MODEL, PRIMARY_MODEL, PRIMARY_MODEL],
        )
        self.assertEqual(sleeps, [1, 3])

    def test_uses_fallback_model_after_primary_retries_are_exhausted(self):
        client = FakeClient([
            RuntimeError("503 UNAVAILABLE high demand"),
            RuntimeError("503 UNAVAILABLE high demand"),
            RuntimeError("503 UNAVAILABLE high demand"),
            "fallback ok",
        ])
        sleeps = []

        response = generate_content_with_retry(
            client=client,
            contents="hello",
            sleep=sleeps.append,
        )

        self.assertEqual(response.text, "fallback ok")
        self.assertEqual(
            [call["model"] for call in client.models.calls],
            [PRIMARY_MODEL, PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL],
        )
        self.assertEqual(sleeps, [1, 3])

    def test_rate_limit_errors_are_not_retried(self):
        client = FakeClient([RuntimeError("429 RESOURCE_EXHAUSTED")])

        with self.assertRaisesRegex(RuntimeError, "RESOURCE_EXHAUSTED"):
            generate_content_with_retry(client=client, contents="hello")

        self.assertEqual(len(client.models.calls), 1)

    def test_error_classification_matches_gemini_busy_and_rate_limit_errors(self):
        self.assertTrue(is_retryable_busy_error("503 UNAVAILABLE high demand"))
        self.assertTrue(is_rate_limit_error("429 RESOURCE_EXHAUSTED"))


if __name__ == "__main__":
    unittest.main()
