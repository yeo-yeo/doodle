FROM python:3.12.1

# docker will not re-pip install if requirements.txt doesn't change
WORKDIR /code
ADD ./server/requirements.txt /code/requirements.txt
RUN pip install -r requirements.txt

FROM node:latest
WORKDIR /code/client
RUN npm i
RUN npm run build

WORKDIR /code

ADD . /code

CMD ["python", "server/index.py"]