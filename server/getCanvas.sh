#!/bin/sh

if [ "$1" == "prod" ]; then
    url="https://doodle.recurse.com"
elif [ "$1" == "dev" ]; then
    url="http://localhost:8080"
else
    echo 'Defaulting to prod url'
    url="https://doodle.recurse.com"
fi

# gets current canvas state and copies to clipboard 
curl $url/get-canvas | pbcopy

echo 'Done!'