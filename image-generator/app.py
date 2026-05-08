from flask import Flask
import threading
import time
import os
from generator import run_forever

app = Flask(__name__)

# Start the generation bot in a separate thread
def start_bot():
    print("🤖 Starting Pinsora Bot Background Thread...")
    run_forever()

@app.route('/')
def home():
    return """
    <html>
        <head><title>Pinsora AI Bot</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🎨 Pinsora AI Bot is Running</h1>
            <p>This space is generating images and posting them to Pinsora platform.</p>
            <div style="margin-top: 20px; color: green;">● System Active</div>
        </body>
    </html>
    """

if __name__ == "__main__":
    # Start the bot thread
    bot_thread = threading.Thread(target=start_bot, daemon=True)
    bot_thread.start()

    # Run the web server (Hugging Face expects port 7860)
    port = int(os.environ.get("PORT", 7860))
    app.run(host='0.0.0.0', port=port)
