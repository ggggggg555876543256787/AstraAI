import os
import json
import uuid
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

CHATS_FILE = 'chats.json'

def load_chats():
    if os.path.exists(CHATS_FILE):
        try:
            with open(CHATS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_chats(chats):
    with open(CHATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(chats, f, ensure_ascii=False, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chats', methods=['GET'])
def get_chats():
    chats = load_chats()
    return jsonify(chats)

@app.route('/api/chats', methods=['POST'])
def create_chat():
    chats = load_chats()
    chat_id = str(uuid.uuid4())
    chats[chat_id] = {
        "title": "Новый чат",
        "messages": []
    }
    save_chats(chats)
    return jsonify({"chat_id": chat_id, "chat": chats[chat_id]})

@app.route('/api/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    chats = load_chats()
    if chat_id in chats:
        del chats[chat_id]
        save_chats(chats)
        return jsonify({"status": "success"})
    return jsonify({"error": "Чат не найден"}), 404

@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    user_message = data.get('message')
    chat_id = data.get('chat_id')
    model_name = data.get('model', 'qwen3b:latest')

    if not user_message or not chat_id:
        return jsonify({'error': 'Missing message or chat_id'}), 400

    chats = load_chats()
    if chat_id not in chats:
        return jsonify({'error': 'Чат не найден'}), 404

    chats[chat_id]["messages"].append({"role": "user", "content": user_message})

    if chats[chat_id]["title"] == "Новый чат":
        chats[chat_id]["title"] = user_message[:25] + ("..." if len(user_message) > 25 else "")

    ollama_payload = {
        "model": model_name,
        "messages": chats[chat_id]["messages"],
        "stream": False
    }

    try:
        response = requests.post('http://localhost:11434/api/chat', json=ollama_payload)
        res_data = response.json()
        bot_message = res_data.get('message', {}).get('content', 'Ошибка: пустой ответ от модели.')
    except Exception as e:
        bot_message = f"Ошибка подключения к Ollama: {str(e)}"

    chats[chat_id]["messages"].append({"role": "assistant", "content": bot_message})
    save_chats(chats)

    return jsonify({'response': bot_message, 'title': chats[chat_id]["title"]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
