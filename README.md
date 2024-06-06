# Doodle

## What
A collaborative pixel art app. Includes live curors and gallery of previous doodles.

## Stack

- The client is a React app
- It's served from a Flask server which also runs SocketIO...
- ...because the pixel drawing and live cursor stuff is communicated over websockets
- This is hosted on [disco](https://disco.recurse.com/)
- There's also some code for an AWS lambda which periodically saves the current canvas to an image on S3
- The AWS stuff was configured in the console, not in code
- And some scripts for stuff like copying the current state of the canvas and loading it back in to the server, e.g. if you want to persist across a redeploy
- And some Kubernetes/Tilt files which were just for practice and aren't used in the live deployment
