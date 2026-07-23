# AstraAI — Неоновый Пингвин 🐧

Локальный веб-интерфейс в неоновом стиле для работы с AI через **Ollama**.

## 💻 Минимальные системные требования

- **ОС:** Windows 10/11, Linux или macOS
- **Оперативная память (RAM):** от 8 ГБ (рекомендуется 16 ГБ)
- **Видеопамять (VRAM):** от 4 ГБ (рекомендуется для быстрой генерации на GPU; если нет, модель запустится на процессоре)
- **Свободное место на диске:** ~5–10 ГБ (для модели и зависимостей)

## 📥 1. Скачивание модели

Перед запуском скачайте файл модели:
- 🔗 **[Скачать qwen.gguf (Google Drive)](https://drive.google.com/file/d/1Z8UURWHjAssmh76Euro9Jp_9F10lVccM/view?usp=sharing)**

Положите скачанный файл `qwen.gguf` в папку с проектом (рядом с `Modelfile`).

## 🛠️ 2. Установка и запуск

Создайте модель в Ollama командой:

```bash
ollama create qwen3b -f Modelfile

```
### 🛠 Если проект не запускается или выходят ошибки с библиотеками:

Запустите команду в терминале (в папке проекта), чтобы установить все необходимые зависимости из файла `requirements.txt`:

#### 🐧 Linux / macOS

```bash
pip install -r requirements.txt

```

> *Если система выдает ошибку, используйте:*
> ```bash
> python3 -m pip install -r requirements.txt
> 
> ```
> 
> 

#### 🪟 Windows

```bash
pip install -r requirements.txt

```

> *Если команда `pip` не найдена, используйте:*
> ```bash
> python -m pip install -r requirements.txt
> 
> ```
> 
> 

## 🚀 3. Запуск проекта

#### 🐧 Linux / macOS

```bash
python3 app.py

```

#### 🪟 Windows

```bash
python app.py
