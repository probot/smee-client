#!/usr/bin/env bash

source .env
VERSION="$(npm dist-tag ls | cut -d ' ' -f 2)"
IMAGE="$DOCKERHUB_USER/smee-client:$VERSION"

echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin

docker build . --file Dockerfile --tag $IMAGE
docker push $IMAGE
