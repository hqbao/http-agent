const { Server } = require('socket.io');
const io = new Server({ /* options */ });

let gSocket = null;

io.on('connection', (socket) => {
  console.log('Connect from '+socket.id);
  gSocket = socket;
});

io.listen(8888);

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');

const TARGET_HOST = '192.168.1.46';
const TARGET_PORT = 8000;

app.set('port', 8000);
app.use(bodyParser.json());
app.use(function (req, res, next) {
  if (gSocket == null) {
    res.writeHead(500, {});
    res.write(JSON.stringify({
      msgCode: 10001,
      msgResp: 'Server not found'
    }));
    res.end();
    return;
  }

  // Ask client to make http request
  var headers = req.headers;
  delete headers.host;
  delete headers['content-length'];
  var req = {
    secure: false,
    host: TARGET_HOST,
    port: TARGET_PORT,
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body,
  };
  gSocket.emit('http-request', JSON.stringify(req));

  // Listen response from client
  gSocket.on('http-response', (msg) => {
    var resp = JSON.parse(msg);
    res.writeHead(resp.status, resp.headers);
    res.write(JSON.stringify(resp.body));
    res.end();

    gSocket.removeAllListeners();
  });
});

const httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function() {
  console.log('Listening on port ' + app.get('port'));
});
