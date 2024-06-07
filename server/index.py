#!/usr/bin/env python3

import os
from pathlib import Path
from flask import Flask, send_from_directory, request
import time
import json
from flask_socketio import SocketIO, send
import threading

current_dir = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=current_dir.parent / "client" / "public")
socketio = SocketIO(app, cors_allowed_origins="*")


def cleanup():
    while True:
        # this was originally in it's own fn but calling it wasn't working?!
        try:
            for key in cursor_positions:
                if cursor_positions[key]["timestamp"] < int(time.time()) - 5:
                    del cursor_positions[key]
                    del cursor_colours[key]
        except:
            # error thrown if a new cursor is added while it's iterating - just ignore that
            # (not scalable)
            pass
        time.sleep(3)


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


cursor_colours = {}
cursor_positions = {}
canvas = {}


@app.route("/get-canvas")
def return_canvas():
    return json.dumps(canvas)


@app.route("/set-canvas", methods=["POST"])
def set_canvas():
    try:
        global canvas
        data = request.get_json()
        print(f"Setting canvas to {data}")
        # validation is for chumps
        canvas = data
        return "ok"
    except:
        return "error"


@app.route("/is-empty")
def is_empty():
    if not bool(canvas):
        return "true"
    else:
        return "false"


def clear_cursors():
    try:
        for key in cursor_positions:
            if cursor_positions[key]["timestamp"] < int(time.time()) - 10:
                del cursor_positions[key]
    except:
        # error thrown if a new cursor is added while it's iterating - just ignore that
        pass


def broadcast(message):
    send(json.dumps(message), json=True, broadcast=True)


@socketio.on("connect")
def connect():
    send(json.dumps({"payload": canvas, "type": "canvasState"}), json=True)


# @socketio.on("disconnect")
# def test_disconnect():
#     print("👋 Client disconnected")

CURSOR_COLOURS = [
    "ff6402",
    "dd0806",
    "0000d4",
    "1fb714",
    "808080",
    "000000",
]

cursor_colour_current_idx = 0


@socketio.on("json")
def handle_message(message):
    parsed = json.loads(message)
    if parsed["type"] == "hello":
        global cursor_colour_current_idx
        cursor_colours[parsed["payload"]["userID"]] = CURSOR_COLOURS[
            cursor_colour_current_idx
        ]
        cursor_colour_current_idx = (cursor_colour_current_idx + 1) % len(
            CURSOR_COLOURS
        )
        broadcast({"payload": cursor_colours, "type": "cursorColours"})
    elif parsed["type"] == "cursorPositions":
        cursor_positions[parsed["payload"]["userID"]] = {
            **parsed["payload"]["position"],
            "timestamp": int(time.time()),
        }
        broadcast({"payload": cursor_positions, "type": "cursorPositions"})
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


if __name__ == "__main__":
    thread = threading.Thread(target=cleanup)
    thread.start()
    # default 5000 is already in use by Apple AirPlay
    socketio.run(app, port=8080, host="0.0.0.0")
