#!/usr/bin/env python3

import asyncio
import threading
import time
import json
from websockets.server import serve


# to test: run `python3 -m websockets ws://localhost:8765/` and send message in interactive terminal

connections = []

cursors = {}

canvas = {}

# this seems a bit cumbersome - better to have redis and ttl
def clear_cursors():
    try:
        for key in cursors:
            if cursors[key]["timestamp"] < int(time.time()) - 5:
                del cursors[key]
    except:
        # error thrown if a new cursor is added while it's iterating - just ignore that
        # (not scalable)
        pass

async def listen(websocket):
    connections.append(websocket)
    print('Registered new connection')

    # initial canvas paint
    await websocket.send(json.dumps({"payload": canvas, "type": "canvasState"}))
    print('sent initial canvas')
    try:
        async for message in websocket:
            try:
                parsed = json.loads(message)
                if parsed["type"] == 'cursorPositions':
                    cursors[parsed["payload"]["userID"]] = {**parsed["payload"]["position"], "timestamp": int(time.time())}
                    for conn in connections:
                        await conn.send(json.dumps({"payload": cursors, "type": "cursorPositions"}))
                if parsed["type"] == 'pixelPainted':
                    x, y, colour = parsed["payload"].values()
                    key = f"{x},{y}"
                    canvas[key] = colour
                    for conn in connections:
                        await conn.send(json.dumps(parsed))
            except:
                print(f'Received non-JSON message: {message}')

    finally:
        connections.remove(websocket) 

async def set_timeout(seconds, fn):
    while True:
        await asyncio.sleep(seconds)
        fn()

async def open_server():
    async with serve(listen, "localhost", 8765):
        print('Websocket server listening on port 8765')
        await asyncio.get_running_loop().create_future()

async def main():
    tasks = [asyncio.create_task(set_timeout(3, clear_cursors)), open_server()]
    await asyncio.gather(*tasks)

asyncio.run(main())