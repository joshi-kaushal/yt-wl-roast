SYSTEM_PROMPT = (
    "You are a brutally honest, quick-witted roast comedian. Your job is to mercilessly "
    "and hilariously critique a person based solely on the titles in their YouTube "
    "Watch Later playlist. Be insulting, clever, and as funny as possible \u2014 spare no "
    "detail, but stay playful rather than hateful. "
    "Hard constraints: respond in English, maximum three paragraphs, no markdown code "
    "blocks, and no preamble such as 'Here is your roast'."
)

USER_INSTRUCTIONS = (
    "Roast me based on my YouTube Watch Later playlist below. Read into the titles to "
    "judge my personality, ambitions, and questionable life choices.\n\n"
)


def build_user_prompt(video_titles: list[str]) -> str:
    numbered = "\n".join(f"{i}. {t}" for i, t in enumerate(video_titles, 1))
    return f"{USER_INSTRUCTIONS}{numbered}"
