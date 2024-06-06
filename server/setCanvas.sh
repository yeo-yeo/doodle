#!/bin/sh

if [ "$1" == "prod" ]; then
    url="https://doodle.recurse.com"
elif [ "$1" == "dev" ]; then
    url="http://localhost:8080"
else
    echo 'Defaulting to prod url'
    url="https://doodle.recurse.com"
fi

read -p "Are you sure you want to overwite canvas at $url from your current clipboard? (y/n): " response

if [ "$response" = "y" ]; then
    # set canvas to clipboard's contents (hopefully obtained by running the getCanvas script)
    curl -X POST -H "Content-Type: application/json" $url/set-canvas -d "$(pbpaste)"

    echo '\nDone!'
else
    echo "Aborted"
fi
