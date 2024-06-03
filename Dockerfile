
# FROM nikolaik/python-nodejs

FROM node:latest as build

WORKDIR /code
ADD . /code
WORKDIR /code/client
RUN npm --verbose install
RUN npm run build

FROM python:3.12.1
COPY --from=build /code/client/public /code/client
ADD . /code
WORKDIR /code
RUN pip install -r server/requirements.txt --quiet

CMD ["python", "server/index.py"]