# AstraAI — Неоновый Пингвин 🐧

Локальный веб-интерфейс в неоновом стиле для работы с AI через **Ollama**.

## 📥 1. Скачивание модели

Перед запуском скачайте файл модели:
- 🔗 **[Скачать qwen.gguf (Google Drive)](https://drive.google.com/file/d/1Z8UURWHjAssmh76Euro9Jp_9F10lVccM/view?usp=sharing)**

Положите скачанный файл `qwen.gguf` в папку с проектом (рядом с `Modelfile`).

## 🛠️ 2. Установка и запуск

1. Создайте модель в Ollama:
   ```bash
   ollama create qwen3b -f Modelfile
