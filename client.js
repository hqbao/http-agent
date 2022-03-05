const { io } = require('socket.io-client');
const socket = io('ws://127.0.0.1:8888');

socket.on('connect', () => {
  console.log('Connected with server');
});

socket.on('http-request', async (msg) => {
  try {
    let httpReq = JSON.parse(msg);
    var bdy = await sendReq(
      httpReq.host,
      httpReq.port,
      httpReq.path,
      httpReq.method,
      httpReq.secure,
      httpReq.headers,
      httpReq.body);
    socket.emit('http-response', JSON.stringify({status: 200, headers: {}, body: bdy}));
  }
  catch (e) {
    socket.emit('http-response', JSON.stringify({status: 400, headers: {}, body: {error: 'Unknown'}}));
  }
});

const http = require('http');
const https = require('https');
function sendReq(host, port, path, method, secure, headers, body) {
  return new Promise(async function(succeed, fail) {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: headers
    };

    const request = http.request(options, response => {
      var data = '';
      response.on('data', chunk => {
        data += chunk;
      });

      response.on('end', () => {
        var body = null;
        try {
          body = JSON.parse(data);
        } catch (err) {}

        if (body == null) {
          fail(data);
          return;
        }

        if (~~(response.statusCode / 100) == 2) {
          succeed(body);
        } else {
          fail(body);
        }
      });
    });

    request.on('error', err => {
      fail(err);
    });

    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}