<div align="center">

# 🤖 AURA
### Autonomous Universal Reasoning Assistant

**AURA**, tamamen yerel (local) donanımınız üzerinde çalışan, gizlilik odaklı, yüksek performanslı ve modern bir yapay zeka asistanı arayüzüdür.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[Özellikler](#-özellikler) • [Teknolojiler](#%EF%B8%8F-teknolojiler) • [Kurulum](#-kurulum-ve-kurulum-adımları) • [Kullanım](#-başlatma)

</div>

---

## ✨ Özellikler

* **🧠 Multi-Turn Context Memory:** Gelişmiş sohbet dizisi takibi sayesinde geçmiş konuşmaları ve bağlamı unutmayan akıllı hafıza yapısı.
* **💾 LocalStorage Persistence:** Tüm sohbet oturumlarınız, mesaj geçmişiniz ve aktif sekmeleriniz doğrudan tarayıcınızda güvenle saklanır.
* **📊 Live Storage Meter:** Tarayıcı depolama alanını (KB/MB) canlı olarak hesaplayan ve doluluk oranına göre renk değiştiren dinamik gösterge paneli.
* **🔌 Drop-in Dynamic Model Switcher:** `models/` klasörüne eklenen her `.gguf` uzantılı açık kaynak LLM modelini (Qwen, Llama, DeepSeek vb.) otomatik algılar ve anında arayüzde seçilebilir yapar.
* **🎨 Apple/Linear Inspired UI:** Dark mode obsidian kartlar, ultra ince emerald detaylar, glassmorphism bileşenler ve özel tipografi (Geist / Plus Jakarta Sans) ile tasarlanmış modern arayüz.

---

## 🛠️ Teknolojiler

### Frontend
* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Dil:** TypeScript
* **Stil:** Tailwind CSS, PostCSS
* **İkonlar & Bileşenler:** Custom Glassmorphic UI Components

### Backend & AI Engine
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) & Uvicorn
* **Inference Engine:** `llama-cpp-python` (GGUF Quantized Models)
* **Veri Doğrulama:** Pydantic V2

---

## 📂 Proje Yapısı

```text
AURA/
├── aura/                  # Core Python paket mimarisi
├── models/                # .gguf uzantılı yerel LLM modellerinin klasörü
├── frontend/              # Next.js 15 Tailwind arayüz projesi
│   ├── src/
│   │   ├── app/          # Main workspace & layout
│   │   ├── components/   # Chat, sidebar ve model selector bileşenleri
│   │   ├── hooks/        # Chat state & LocalStorage hook'ları
│   │   └── lib/          # API istemcisi ve depolama yardımcıları
├── server.py              # FastAPI backend sunucusu
├── requirements.txt       # Python bağımlılıkları
└── README.md
