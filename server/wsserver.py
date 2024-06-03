#!/usr/bin/env python3

import asyncio
import threading
import time
import json
import websockets


# to test: run `python3 -m websockets ws://localhost:8765/` and send message in interactive terminal

connections = []

cursors = {}

canvas = {}
WS_PORT = 3001
SERVER_PORT = 3000


def clear_cursors():
    try:
        for key in cursors:
            if cursors[key]["timestamp"] < int(time.time()) - 5:
                del cursors[key]
    except:
        # error thrown if a new cursor is added while it's iterating - just ignore that
        # (not scalable)
        pass


async def broadcast(message):
    for conn in connections:
        await conn.send(json.dumps(message))


async def listen(websocket):
    connections.append(websocket)
    print("Registered new connection")

    # initial canvas paint
    await websocket.send(json.dumps({"payload": canvas, "type": "canvasState"}))

    try:
        async for message in websocket:
            # try:

            parsed = json.loads(message)
            if parsed["type"] == "cursorPositions":
                cursors[parsed["payload"]["userID"]] = {
                    **parsed["payload"]["position"],
                    "timestamp": int(time.time()),
                }
                await broadcast({"payload": cursors, "type": "cursorPositions"})
            # elif parsed["type"] == 'removeCursor':
            #     if cursors[parsed["payload"]["userID"]]:
            #         del cursors[parsed["payload"]["userID"]]
            #     await broadcast(parsed)
            elif parsed["type"] == "resetCanvas":
                canvas.clear()
                await broadcast(parsed)
            elif parsed["type"] == "pixelPainted":
                x, y, colour = parsed["payload"].values()
                key = f"{x},{y}"
                canvas[key] = colour
                await broadcast(parsed)
            else:
                print(f"Received unknown message {message}")
        # except:
        #     print(f'Received non-JSON message: {message}')

    except websockets.exceptions.ConnectionClosedError:
        print("Client disconnected unexpectedly")

    finally:
        connections.remove(websocket)


async def set_timeout(seconds, fn):
    while True:
        await asyncio.sleep(seconds)
        fn()


async def open_server():
    async with websockets.serve(listen, "localhost", WS_PORT):
        print(f"Websocket server listening on port {WS_PORT}")
        await asyncio.get_running_loop().create_future()


async def main():
    tasks = [
        asyncio.create_task(set_timeout(3, clear_cursors)),
        open_server(),
        # threading.Thread(create_server(SERVER_PORT)).start(),
    ]
    await asyncio.gather(*tasks)


asyncio.run(main())
