// const app = require('express')();
import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';

const app = express();
const server = http.createServer(app);
// http server를 socket.io server로 upgrade한다
const io = socketio(server);
interface IUserInfo {
  name: string;
  userid: string;
  msg: string;
}

interface IMySocket extends socketio.Socket {
  name: string;
  userid: string;
}

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', (req: express.Request, res: express.Response) => {
  // tslint:disable-next-line:no-console
  console.log(req.method)
  res.sendFile(`${__dirname}/index.html`);
});

// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다
io.on('connection', (socket: IMySocket) => {
  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', (data: IUserInfo) => {
    // tslint:disable-next-line:no-console
    console.log(`Client logged-in:
name: ${data.name}
userid: ${data.userid}`);

    // socket에 클라이언트 정보를 저장한다
    socket.name = data.name;
    socket.userid = data.userid;

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    io.emit('login', data.name);
  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', (data: IUserInfo) => {
    // tslint:disable-next-line:no-console
    console.log('Message from %s: %s', socket.name, data.msg);

    const msg = {
      from: { name: socket.name, userid: socket.userid },
      msg: data.msg,
    };

    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
    // socket.broadcast.emit('chat', msg);
    
    io.emit('chat', msg);

    // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
    // socket.emit('s2c chat', msg);

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    // io.emit('s2c chat', msg);

    // 특정 클라이언트에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);
  });

  // force client disconnect from server
  socket.on('forceDisconnect', () => {
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    // tslint:disable-next-line:no-console
    console.log(`user disconnected: ${socket.name}`);
  });
});

server.listen(3000, () => {
  // tslint:disable-next-line:no-console
  console.log('Socket IO server listening on port 3000');
});
