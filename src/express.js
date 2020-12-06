const settings = require('electron-settings');
const express = require('express');

const app = express();
const port = 3000;
app.use(express.json());

const {EventEmitter} = require('events');
const myEvent = new EventEmitter();
exports.emitter = myEvent;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/data', (req, res) => {
  try {
    const temp = settings.getSync();
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
    settings.set(data);
    myEvent.emit('save-data', true);
    res.status(201).contentType('application/json').send({Message: 'Settings Updated'});
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
