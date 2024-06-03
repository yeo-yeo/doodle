#!/usr/bin/env python3

from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='../client/public')

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# @app.route('/')
# def home():
#     return 'example endpoint'

if __name__ == '__main__':
    # default 5000 is already in use by Apple AirPlay
    app.run(port=3000,debug=True)