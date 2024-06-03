
FROM nikolaik/python-nodejs

WORKDIR /code
ADD . /code
WORKDIR /code/client
RUN npm i
RUN npm run build

# docker will not re-pip install if requirements.txt doesn't change
WORKDIR /code
RUN pip install -r server/requirements.txt --quiet

CMD ["python", "server/index.py"]