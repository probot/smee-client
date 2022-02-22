import validator = require('validator');
import EventSource = require('eventsource');
import superagent = require('superagent');
import url = require('url');
import querystring = require('querystring');

type Severity = 'info' | 'error'

function logdate(){
    return '[' + new Date().toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    + '] ';
}

interface Options {
  source: string
  target: string
  logger?: Pick<Console, Severity>
  idle_reconnect: number;
  health_interval: number;
}

class Client {
  source: string;
  target: string;
  logger: Pick<Console, Severity>;
  events!: EventSource;

  idle_reconnect: number; // millis - how long if there are no events to restart the connection. If negative, never restart
  last_event: number;  // the timestamp of the last event in millis

  constructor ({ source, target, logger = console, idle_reconnect = 1000*60*60*24, health_interval = 60*1000}: Options) {
    this.source = source;
    this.target = target;
    this.logger = logger!;
    this.idle_reconnect = idle_reconnect;
    this.last_event = 0;

    setInterval(this.oninterval.bind(this), health_interval);

    if (!validator.isURL(this.source)) {
      throw new Error('The provided URL is invalid.')
    }
  }

  static async createChannel () {
    return superagent.head('https://smee.io/new').redirects(0).catch((err) => {
      return err.response.headers.location
    })
  }

  onmessage (msg: any) {
    const data = JSON.parse(msg.data)

    const target = url.parse(this.target, true)
    const mergedQuery = Object.assign(target.query, data.query)
    target.search = querystring.stringify(mergedQuery)

    delete data.query

    const req = superagent.post(url.format(target)).send(data.body)

    const bodyLength = JSON.stringify(data.body).length

    delete data.body

    Object.keys(data).forEach(key => {
      if(['host'].indexOf(key.toLowerCase()) < 0) // do not re-set host header!!
        req.set(key, data[key])
    })

    req.set('content-length', `${bodyLength}`)

    req.end((err, res) => {
      this.last_event = Date.now();

      if (err) {
        this.logger.error(logdate(), `${this.source} => ${req.method} ${req.url} - `, err)
      } else {
        this.logger.info(logdate(), `${this.source} => ${req.method} ${req.url} - ${res.status}`)
      }
    })
  }

  onopen () {
    this.logger.info(logdate(), 'Connected', this.events.url)
  }

  onerror (err: any) {
    this.logger.error(logdate(), err)
  }

  // adding a method to ensure that the client is not closed
  oninterval(){
      let readyState = this.events ? this.events.readyState : -1;
      if(readyState < 0){
          this.logger.info(logdate(), `WARNING - EventSource.readyState=${readyState} is not connecting (did you call start()?)... for [${this.source} => ${this.target}]`);
      } if(readyState == 0){
          this.logger.error(logdate(), `WARNING - EventSource.readyState=${readyState} is Connecting... for [${this.source} => ${this.target}]`);
      } else if(readyState == 1
          && this.idle_reconnect > 0
          && Date.now() - this.last_event > this.idle_reconnect){
          this.logger.info(logdate(), `RESTARTING - Still connected (EventSource.readyState=${readyState}), ` +
            `but no events for ${this.idle_reconnect} ms. Restarting connection to [${this.source} => ${this.target}] just in case.`);
          this.start();
      } else if(readyState > 1){ // error is 2
          this.logger.error(logdate(), `RESTARTING - Invalid EventSource.readyState=${readyState} for [${this.source} => ${this.target}]`);
          this.start();
      }
  }

  start () {
    this.last_event = Date.now(); // clear flag
    const old_events = this.events; // store old events object
    const events = new EventSource(this.source);

    // Reconnect immediately
    (events as any).reconnectInterval = 0 // This isn't a valid property of EventSource

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    this.logger.info(logdate(), `Forwarding ${this.source} to ${this.target}`)
    this.events = events

    if(old_events){ // Close after open to ensure nothing is missed, extra is ok...
        this.logger.info(logdate(), `Closing previous connection [${this.source} => ${this.target}] (old EventSource was in readyState=${old_events.readyState})`);
        try{ old_events.close();}
        catch(err){ this.logger.error(logdate(), err); }
    }

    return events
  }
}

export = Client
