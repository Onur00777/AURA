# Local GGUF models for AURA (llama-cpp-python)
#
# Drop any chat-tuned *.gguf file into this folder, then set in .env:
#   AURA_LLM_PROVIDER=local
#   AURA_LLM_MODEL_PATH=models/YOUR_FILE.gguf
#
# Suggested small starter (CPU-friendly on older Macs):
#   TinyLlama 1.1B Chat Q4_K_M
#   https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF
#
# Example download (from the AURA project root):
#   curl -L -o models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf \
#     "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
#
# Then in .env:
#   AURA_LLM_MODEL_PATH=models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf
#
# If AURA_LLM_MODEL_PATH is empty, AURA auto-picks the first *.gguf in this folder.
