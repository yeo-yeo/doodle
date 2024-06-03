#!/usr/bin/env python3

import os
from pprint import pprint
from flask import Flask, send_from_directory
from flask_sock import Sock
import time
import json

app = Flask(__name__, static_folder="/code/client/public")
sock = Sock(app)


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


connections = []

cursors = {}

canvas = {}


def clear_cursors():
    try:
        for key in cursors:
            if cursors[key]["timestamp"] < int(time.time()) - 5:
                del cursors[key]
    except:
        # error thrown if a new cursor is added while it's iterating - just ignore that
        # (not scalable)
        pass


def broadcast(message):
    for conn in connections:
        conn.send(json.dumps(message))


@sock.route("/ws")
def listen(ws):
    while True:
        if ws not in connections:
            print("HIT WS ENDPOINT")
            connections.append(ws)
            print("Registered new connection")

            # initial canvas paint
            ws.send(json.dumps({"payload": canvas, "type": "canvasState"}))

        data = ws.receive()
        pprint(data)
        # ws.send(data)

        try:
            if data:
                # try:

                parsed = json.loads(data)
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
                    print(f"Received unknown message {data}")
            # except:
            #     print(f'Received non-JSON message: {message}')

        # except ws.exceptions.ConnectionClosedError:
        # print("Client disconnected unexpectedly")

        finally:
            pass
        #    connections.remove(ws)


def create_server(port=8080):
    app.run(port=port, host="0.0.0.0")


if __name__ == "__main__":
    # default 5000 is already in use by Apple AirPlay
    create_server()
