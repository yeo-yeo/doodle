export AWS_PAGER=""
echo "Uploading lambda code"
aws lambda update-function-code --function-name doodle-save-canvas --zip-file fileb://dist/index.zip