#!/usr/bin/env node

const program = require('commander')
const { version } = require('../package.json')
const readfile = require('util').promisify(require('fs').readFile)

const Client = require('..')

program
  .version(version, '-v, --version')
  .usage('[options]')
  .option('-f, --file <file>', 'Configuration JSON file. One top-level key contains an array of {source, target}. Overrides all other settings')
  .option('-u, --url <url>', 'URL of the webhook proxy service. Default: https://smee.io/new')
  .option('-t, --target <target>', 'Full URL (including protocol and path) of the target service the events will forwarded to. Default: http://127.0.0.1:PORT/PATH')
  .option('-p, --port <n>', 'Local HTTP server port', process.env.PORT || 3000)
  .option('-P, --path <path>', 'URL path to post proxied requests to`', '/')
  .parse(process.argv)

let target
if (program.target) {
  target = program.target
} else {
  target = `http://127.0.0.1:${program.port}${program.path}`
}

async function setupFromFile(file){
    let data = await readfile(file);
    let config = JSON.parse(data);
    let forward = config.forward;
    if(!Array.isArray(forward)){
        if(!forward.source || !forward.target){
            console.log(config);
            throw new Error("config.forward must either be an array or an object with source and target");
        }
        forward = [forward];
    }
    let clients = [];
    for(var each of forward){
        if(!each.source || !each.target){
            console.log(config);
            throw new Error("config.forward[] each object must have source and target");
        }
        let {source, target} = each;
        console.log(`Configured forwarding from ${source} --> ${target}`);
        clients.push(new Client({source, target}));
    }
    return clients;
}

async function setup () {
  let file = program.file;

  if(file){
      let clients = await setupFromFile(file);
      clients.forEach(x => x.start());
  } else {
      let source = program.url

      if (!source) {
        source = await Client.createChannel()
      }

      const client = new Client({ source, target })
      client.start()
  }
}

setup()
