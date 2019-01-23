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
  room: string;
}

interface IMySocket extends socketio.Socket {
  name: string;
  userid: string;
  room: string;
}

const chat = io.of('/chat').on('connection', (socket: IMySocket) => {
  const address = socket.handshake.address;
  console.log(`New connection from ${address}, ${socket.id}`);

  socket.on('disconnect', (data: Object) => {
    console.log('disconnect', data);
    console.log(`disconnection from ${address}, ${socket.id}`);
    socket.disconnect();
  });

  socket.on('join', (data: string) => {
    console.log('join', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.join(data);
  });

  socket.on('leave', (data: string) => {
    console.log('leave', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.leave(data);
  });

  socket.on('chatMessage', (data: IUserInfo) => {
    console.log('data:', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.name = data.name;
    const room = (socket.room = data.room);
    chat.to(`test/${room}`).emit('chatMessage', { name: data.name, msg: data.msg });
  });
});

server.listen(3000, () => {
  // tslint:disable-next-line:no-console
  console.log('Socket IO server listening on port 3000');
});
