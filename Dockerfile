
# FROM nikolaik/python-nodejs

FROM node:latest as build

WORKDIR /code
ADD . /code
WORKDIR /code/client
RUN npm install
RUN npm run build

FROM python:3.12.1
WORKDIR /code
COPY --from=build /code /code
RUN pip install -r server/requirements.txt --quiet

WORKDIR /code/client/public
RUN dir
WORKDIR /code
RUN dir

CMD ["python", "server/index.py"]