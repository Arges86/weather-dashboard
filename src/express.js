import { getSync, set } from 'electron-settings';
import express, { json } from 'express';
import { EventEmitter } from 'events';

const app = express();
const port = 3000;
const myEvent = new EventEmitter();
export const emitter = myEvent;

app.use(json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/data', (req, res) => {
  try {
    const temp = getSync();
    res.send(temp);
  } catch (error) {
    res.status(500).contentType('application/json').send({Message: 'Error getting data'});
  }
});

app.post('/data', (req, res) => {
  const data = req.body;
  if (data.weatherKey == '' || data.tempUnits == '' || data.bingMarkets == '' ||
      data.latitude == '' || data.longitude == '' || data.newsKey == '' || data.cyle == '') {
    res.status(500).contentType('application/json').send({Message: 'All values must be filled out'});
  } else {
    set(data);
    myEvent.emit('save-data', true);
    res.status(201).contentType('application/json').send({Message: 'Settings Updated'});
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
