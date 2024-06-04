#!/usr/bin/env python3

import os
from pathlib import Path
from flask import Flask, send_from_directory
import time
import json
from flask_socketio import SocketIO, send

current_dir = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=current_dir.parent / "client" / "public")
socketio = SocketIO(app, cors_allowed_origins="*")

# lol hiiiiiii


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


cursors = {}
canvas = {}


def clear_cursors():
    try:
        for key in cursors:
            if cursors[key]["timestamp"] < int(time.time()) - 10:
                del cursors[key]
    except:
        # error thrown if a new cursor is added while it's iterating - just ignore that
        pass


def broadcast(message):
    send(json.dumps(message), json=True, broadcast=True)


@socketio.on("connect")
def connect():
    print("😀 Connection added!")
    send(json.dumps({"payload": canvas, "type": "canvasState"}), json=True)


@socketio.on("disconnect")
def test_disconnect():
    print("👋 Client disconnected")


@socketio.on("json")
def handle_message(message):
    parsed = json.loads(message)
    if parsed["type"] == "cursorPositions":
        cursors[parsed["payload"]["userID"]] = {
            **parsed["payload"]["position"],
            "timestamp": int(time.time()),
        }
        broadcast({"payload": cursors, "type": "cursorPositions"})
    # elif parsed["type"] == 'removeCursor':
    #     if cursors[parsed["payload"]["userID"]]:
    #         del cursors[parsed["payload"]["userID"]]
    #     await broadcast(parsed)
    elif parsed["type"] == "resetCanvas":
        canvas.clear()
        broadcast(parsed)
    elif parsed["type"] == "pixelPainted":
        x, y, colour = parsed["payload"].values()
        key = f"{x},{y}"
        canvas[key] = colour
        broadcast(parsed)
    else:
        print(f"Received unknown message {message}")


# hiiiiii
# hii

if __name__ == "__main__":
    # default 5000 is already in use by Apple AirPlay
    socketio.run(app, port=8080, host="0.0.0.0")
