"""Central configuration for the AURA runtime."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root when present (never overrides existing env vars).
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_PROJECT_ROOT / ".env", override=False)

_DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
_DEFAULT_LOCAL_LLM_MODEL = "local-gguf"
_DEFAULT_LOCAL_STT_MODEL = "sphinx"


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_key(name: str, default: str = "") -> str:
    """Read an API key and strip accidental surrounding quotes/whitespace."""
    raw = os.getenv(name, default) or default
    return raw.strip().strip('"').strip("'")


@dataclass(frozen=True)
class AudioConfig:
    """Audio capture / playback settings."""

    sample_rate: int = field(default_factory=lambda: _env_int("AURA_SAMPLE_RATE", 16_000))
    channels: int = 1
    chunk_size: int = field(default_factory=lambda: _env_int("AURA_CHUNK_SIZE", 1024))
    tts_rate: int = 175  # Words per minute for pyttsx3
    tts_volume: float = 1.0
    # Voice Activity Detection (energy-based)
    vad_threshold: float = field(default_factory=lambda: _env_float("AURA_VAD_THRESHOLD", 0.02))
    silence_duration_ms: int = field(default_factory=lambda: _env_int("AURA_SILENCE_MS", 900))
    min_speech_ms: int = field(default_factory=lambda: _env_int("AURA_MIN_SPEECH_MS", 300))
    max_utterance_ms: int = field(default_factory=lambda: _env_int("AURA_MAX_UTTERANCE_MS", 15_000))
    pre_speech_ms: int = field(default_factory=lambda: _env_int("AURA_PRE_SPEECH_MS", 300))
    input_device: str | None = field(
        default_factory=lambda: os.getenv("AURA_INPUT_DEVICE") or None
    )


@dataclass(frozen=True)
class STTConfig:
    """Speech-to-text provider settings."""

    provider: str = field(default_factory=lambda: os.getenv("AURA_STT_PROVIDER", "local"))
    api_key: str = field(
        default_factory=lambda: _env_key("AURA_STT_API_KEY") or _env_key("AURA_LLM_API_KEY")
    )
    model: str = field(default_factory=lambda: os.getenv("AURA_STT_MODEL", _DEFAULT_LOCAL_STT_MODEL))
    base_url: str = field(
        default_factory=lambda: os.getenv("AURA_STT_BASE_URL")
        or os.getenv("AURA_LLM_BASE_URL", "")
    )
    language: str = field(default_factory=lambda: os.getenv("AURA_STT_LANGUAGE", ""))
    timeout_seconds: float = 45.0


@dataclass(frozen=True)
class LLMConfig:
    """LLM provider settings (populated from environment)."""

    provider: str = field(default_factory=lambda: os.getenv("AURA_LLM_PROVIDER", "local"))
    api_key: str = field(default_factory=lambda: _env_key("AURA_LLM_API_KEY"))
    model: str = field(
        default_factory=lambda: os.getenv("AURA_LLM_MODEL", _DEFAULT_LOCAL_LLM_MODEL)
    )
    # Absolute/relative path to a .gguf file (preferred for local provider).
    model_path: str = field(default_factory=lambda: os.getenv("AURA_LLM_MODEL_PATH", ""))
    base_url: str = field(default_factory=lambda: os.getenv("AURA_LLM_BASE_URL", ""))
    timeout_seconds: float = 120.0
    n_ctx: int = field(default_factory=lambda: _env_int("AURA_LLM_N_CTX", 2048))
    n_threads: int = field(default_factory=lambda: _env_int("AURA_LLM_N_THREADS", 0))
    n_gpu_layers: int = field(default_factory=lambda: _env_int("AURA_LLM_N_GPU_LAYERS", 0))
    n_batch: int = field(default_factory=lambda: _env_int("AURA_LLM_N_BATCH", 256))
    max_tokens: int = field(default_factory=lambda: _env_int("AURA_LLM_MAX_TOKENS", 256))
    temperature: float = field(default_factory=lambda: _env_float("AURA_LLM_TEMPERATURE", 0.2))
    system_prompt: str = field(
        default_factory=lambda: os.getenv(
            "AURA_SYSTEM_PROMPT",
            (
                "You are AURA, an Autonomous Universal Reasoning Assistant. "
                "Respond clearly and concisely in a terminal chat. "
                "Keep answers short unless the user asks for detail. "
                "Do not use markdown, bullet lists, or emoji."
            ),
        )
    )


@dataclass(frozen=True)
class BootConfig:
    """Boot sequence presentation settings."""

    check_delay_seconds: float = 0.35
    logo_color: bool = True
    greeting: str = "Aura online. Terminal chat ready. Type a message to begin."


@dataclass(frozen=True)
class AuraConfig:
    """Top-level configuration container."""

    audio: AudioConfig = field(default_factory=AudioConfig)
    stt: STTConfig = field(default_factory=STTConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)
    boot: BootConfig = field(default_factory=BootConfig)
    log_level: str = field(default_factory=lambda: os.getenv("AURA_LOG_LEVEL", "INFO"))


def load_config() -> AuraConfig:
    """Build and return the active configuration snapshot."""
    return AuraConfig()
