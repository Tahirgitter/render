from flask import Flask, render_template, request, session, redirect, url_for, jsonify, send_file
from pathlib import Path
import json, os, zipfile, io

app = Flask(__name__)
app.secret_key = "arru_khayyum_secret_2025"

BASE_DIR = Path(__file__).parent
IMAGES_DIR = BASE_DIR / "static" / "images"

# Scenes/story data (each chapter links to a photo)
SCENES = [
    {"id": 1, "title": "May 4 — The First Meeting", "text": "We met during our first semester — and by the second, my heart had already decided.", "photo": "photo1.jpg"},
    {"id": 2, "title": "Aug 12 — The First Hand Hold", "text": "The first time I held your hand, the world made sense. I remember the warmth and the quiet promise.", "photo": "photo2.jpg"},
    {"id": 3, "title": "Oct 25 — The Car Ride & Cheek Kiss", "text": "My first long drive with you — I was nervous but all I wanted was to bring you home safely. I kissed your cheek that day.", "photo": "photo3.jpg"},
    {"id": 4, "title": "Dec 16 — Our First Kiss", "text": "The first time I kissed your lips, I had tears in my eyes. It felt like the beginning of everything.", "photo": "photo4.jpg"},
    {"id": 5, "title": "Dec 21 — The Hug & Lap", "text": "That hug when you sat on my lap — the world fell into place and I felt at home.", "photo": "photo5.jpg"},
    {"id": 6, "title": "Dec 23 — Scooty Ride", "text": "Our scooty ride to Mundargi — simple, joyful, exactly what I dreamed of.", "photo": "photo6.jpg"},
    {"id": 7, "title": "Aug 22 — Shoulder Sleep & Movie Date", "text": "You slept on my shoulder and I felt like I had the whole world beside me. This year, our first movie together made me miss you for a week after.", "photo": "photo7.jpg"}
]

@app.route('/')
def index():
    # reset the session progress
    session['state'] = {"chapter": 0, "love": 0, "unlocked": []}
    return render_template('index.html', name="Arru")

@app.route('/play')
def play():
    # pass scenes to the template
    return render_template('play.html', scenes=SCENES)

@app.route('/api/state', methods=['GET', 'POST'])
def api_state():
    if request.method == 'POST':
        data = request.get_json() or {}
        session['state'] = data
        return jsonify({"status":"ok","state":session['state']})
    else:
        return jsonify(session.get('state', {"chapter":0,"love":0,"unlocked":[] }))

@app.route('/treasure')
def treasure():
    # final gallery
    state = session.get('state', {"chapter":0,"love":0,"unlocked":[]})
    # map scene id to scene
    unlocked = [s for s in SCENES if s['id'] in state.get('unlocked', [])]
    return render_template('treasure.html', scenes=SCENES, unlocked=unlocked, name="Arru", your_name="Khayyum")

@app.route('/download_gallery')
def download_gallery():
    # create a zip of unlocked images for download
    state = session.get('state', {"unlocked":[]})
    unlocked = state.get('unlocked', [])
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        for s in SCENES:
            if s['id'] in unlocked:
                img_path = IMAGES_DIR / s['photo']
                if img_path.exists():
                    zf.write(str(img_path), arcname=s['photo'])
    memory_file.seek(0)
    if memory_file.getbuffer().nbytes == 0:
        return "No unlocked images yet.", 400
    return send_file(memory_file, attachment_filename="arru_gallery.zip", as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
