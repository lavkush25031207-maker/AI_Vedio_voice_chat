import os
from dataclasses import dataclass
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)


@dataclass
class AIProviderResult:
    content: str
    provider: str


def _messages(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> List[Dict[str, str]]:
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-8:])
    messages.append({"role": "user", "content": user_content})
    return messages


def _post_openai_compatible(
    *,
    provider: str,
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    history: List[Dict[str, str]],
    user_content: str,
    extra_headers: Optional[Dict[str, str]] = None,
) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    response = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        headers=headers,
        json={
            "model": model,
            "messages": _messages(system_prompt, history, user_content),
            "temperature": 0.4,
            "max_tokens": 220,
        },
        timeout=25,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_gemini(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return ""

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()
    model = genai.GenerativeModel(model_name, system_instruction=system_prompt)
    gemini_history = []
    for message in history[-8:]:
        role = "model" if message["role"] == "assistant" else "user"
        gemini_history.append({"role": role, "parts": [message["content"]]})
    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(user_content)
    return (response.text or "").strip()


def _call_openrouter(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    model = os.getenv("OPENROUTER_MODEL", "").strip()
    if not api_key or not model:
        return ""

    return _post_openai_compatible(
        provider="openrouter",
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        model=model,
        system_prompt=system_prompt,
        history=history,
        user_content=user_content,
        extra_headers={
            "HTTP-Referer": os.getenv("APP_PUBLIC_URL", "http://localhost:5173"),
            "X-Title": "TalkFlow AI",
        },
    )


def _call_groq(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "").strip()
    if not api_key or not model:
        return ""

    return _post_openai_compatible(
        provider="groq",
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key,
        model=model,
        system_prompt=system_prompt,
        history=history,
        user_content=user_content,
    )


def _call_huggingface(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    api_key = os.getenv("HF_API_KEY", "").strip()
    model = os.getenv("HF_MODEL", "").strip()
    if not api_key or not model:
        return ""

    prompt = f"{system_prompt}\n\n"
    for message in history[-6:]:
        prompt += f"{message['role'].title()}: {message['content']}\n"
    prompt += f"User: {user_content}\nAssistant:"

    response = httpx.post(
        f"https://api-inference.huggingface.co/models/{model}",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 180,
                "temperature": 0.4,
                "return_full_text": False,
            },
        },
        timeout=35,
    )
    response.raise_for_status()
    data = response.json()
    if isinstance(data, list) and data:
        return data[0].get("generated_text", "").strip()
    if isinstance(data, dict):
        return data.get("generated_text", "").strip()
    return ""


def _call_custom_openai(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    api_key = os.getenv("AI_API_KEY", "").strip()
    model = os.getenv("AI_MODEL", "").strip()
    base_url = os.getenv("AI_BASE_URL", "").strip()
    if not api_key or not model or not base_url:
        return ""

    return _post_openai_compatible(
        provider="openai_compatible",
        base_url=base_url,
        api_key=api_key,
        model=model,
        system_prompt=system_prompt,
        history=history,
        user_content=user_content,
    )


def _call_pollinations_raw(system_prompt: str, history: List[Dict[str, str]], user_content: str, model: str) -> str:
    try:
        response = httpx.post(
            "https://text.pollinations.ai/",
            json={
                "messages": _messages(system_prompt, history, user_content),
                "model": model,
            },
            timeout=25,
        )
        response.raise_for_status()
        return response.text.strip()
    except Exception as e:
        print(f"[Pollinations model {model} failed]: {e}")
        return ""


def _call_pollinations_openai(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    return _call_pollinations_raw(system_prompt, history, user_content, "openai")


def _call_pollinations_mistral(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    return _call_pollinations_raw(system_prompt, history, user_content, "mistral-large")


def _call_pollinations_llama(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    return _call_pollinations_raw(system_prompt, history, user_content, "llama")


def _call_pollinations_deepseek(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> str:
    return _call_pollinations_raw(system_prompt, history, user_content, "deepseek")


PROVIDERS = {
    "pollinations_openai": _call_pollinations_openai,
    "pollinations_mistral": _call_pollinations_mistral,
    "pollinations_llama": _call_pollinations_llama,
    "pollinations_deepseek": _call_pollinations_deepseek,
    "gemini": _call_gemini,
    "openrouter": _call_openrouter,
    "groq": _call_groq,
    "huggingface": _call_huggingface,
    "openai_compatible": _call_custom_openai,
}


def generate_ai_response(system_prompt: str, history: List[Dict[str, str]], user_content: str) -> Optional[AIProviderResult]:
    order = os.getenv(
        "AI_PROVIDER_ORDER",
        "pollinations_openai,pollinations_mistral,pollinations_llama,pollinations_deepseek,gemini,openrouter,groq,huggingface,openai_compatible",
    )

    for provider_name in [name.strip() for name in order.split(",") if name.strip()]:
        provider = PROVIDERS.get(provider_name)
        if not provider:
            continue
        try:
            content = provider(system_prompt, history, user_content)
            if content:
                return AIProviderResult(content=content, provider=provider_name)
        except Exception as error:
            print(f"[AI provider skipped] {provider_name}: {error}")

    return None
