FROM node:10
RUN npm install --global smee-client
ENTRYPOINT ["smee"]
CMD ["--help"]
