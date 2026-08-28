from openai import OpenAI
from openai import (
    APIConnectionError,
    InternalServerError,
    NotFoundError,
    RateLimitError,
)

from app.config import settings
from app.prompts import SYSTEM_PROMPT, build_user_prompt

_client = OpenAI(api_key=settings.OPENROUTER_API_KEY, base_url=settings.OPENROUTER_BASE_URL)

FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "z-ai/glm-5.2:free",
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-4-26b-a4b-it:free",
]

_RETRYABLE = (RateLimitError, APIConnectionError, InternalServerError, NotFoundError)


def _models_to_try() -> list[str]:
    return [settings.MODEL, *(m for m in FALLBACK_MODELS if m != settings.MODEL)]


def roast_user_list(video_titles: list[str]) -> str:
    last_error: Exception | None = None

    for model in _models_to_try():
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_user_prompt(video_titles)},
                ],
                extra_headers={
                    "HTTP-Referer": "https://github.com/joshi-kaushal/yt-wl-roast",
                    "X-Title": "YT Watch Later Roast",
                },
            )
            return response.choices[0].message.content or ""
        except _RETRYABLE as err:
            last_error = err
            continue

    raise last_error or RuntimeError("All OpenRouter free models failed")
