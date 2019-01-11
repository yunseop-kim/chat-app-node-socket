// const app = require('express')();
import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as redis from 'socket.io-redis'

const app = express();
const server = http.createServer(app);
// http server를 socket.io server로 upgrade한다
const io = socketio(server);
io.adapter(redis({ host: 'localhost', port: 6379 }));
interface IUserInfo {
  name: string;
  userid: string;
  msg: string;
  room: string;
}

interface IMySocket extends socketio.Socket {
  name: string;
  userid: string;
  room: string;
}

// namespace /chat에 접속한다.
const chat = io.of('/chat').on('connection', (socket: IMySocket) => {
  socket.on('chatMessage', (data: IUserInfo) => {
    // tslint:disable-next-line:no-console
    console.log('data:', data);
    socket.name = data.name;
    const room = (socket.room = data.room);
    // room에 join한다
    socket.join(room);
    // room에 join되어 있는 클라이언트에게 메시지를 전송한다
    chat.to(room).emit('chatMessage', `${data.name}:${data.msg} - ${process.pid}`);
  });
});

server.listen(3000, () => {
  // tslint:disable-next-line:no-console
  console.log('Socket IO server listening on port 3000');
});
