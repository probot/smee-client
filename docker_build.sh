#/usr/bin/env bash

VERSION="$(npm dist-tag ls | cut -d ' ' -f 2)";
docker build . -t "theshadow27/smee-client:$VERSION"
