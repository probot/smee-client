FROM node:10-slim
RUN npm install --global smee-client
ENTRYPOINT ["smee"]
CMD ["--help"]
