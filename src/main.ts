import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';

const app = express();
const server = http.createServer(app);
// http server를 socket.io server로 upgrade한다
const io = socketio(server);
interface IUserInfo {
  name: string;
  password: string;
  socketId: string;
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
  socket.join('rooms');

  socket.on('disconnect', (data: Object) => {
    console.log('disconnect', data);
    console.log(`disconnection from ${address}, ${socket.id}`);
    console.log(
      `Socket info1: ${socket.name}, ${socket.userid}, ${socket.room}`,
    );
    socket.disconnect();
  });

  socket.on('join', (data: IUserInfo) => {
    console.log('join', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.name = data.name;
    socket.room = data.room;
    console.log(
      `Socket info2: ${socket.name}, ${socket.userid}, ${socket.room}`,
    );
    socket.join(data.room);
    chat.to(`test/${data.room}`).emit('join', 'test');
    chat.to('rooms').emit('rooms', chat.adapter.rooms);
    chat.to(socket.id).emit(`you`, `${socket.id} 당신에게만 보냅니다.`);
  });

  socket.on('leave', (data: IUserInfo) => {
    console.log('leave', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.name = data.name;
    socket.room = data.room;
    console.log(
      `Socket info3: ${socket.name}, ${socket.userid}, ${socket.room}`,
    );
    chat.to(`test/${data.room}`).emit('leave', 'test');
    socket.leave(data.room);
    chat.to('rooms').emit('rooms', chat.adapter.rooms);
  });

  socket.on('chatMessage', (data: IUserInfo) => {
    console.log('data:', data);
    console.log(`from ${address}, ${socket.id}`);
    socket.name = data.name;
    const room = (socket.room = data.room);
    console.log(
      `Socket info4: ${socket.name}, ${socket.userid}, ${socket.room}`,
    );
    chat
      .to(`test/${room}`)
      .emit('chatMessage', { name: data.name, msg: data.msg });
  });

  socket.on('rooms', (data: Object) => {
    console.log('rooms action', data, chat.adapter.rooms);
    chat.to('rooms').emit('rooms', chat.adapter.rooms);
  });

  socket.on('kick', (data: IUserInfo) => {
    console.log('강퇴요청');
    const kicked: socketio.Socket = chat.sockets[data.socketId];
    console.log('강퇴요청 > kicked', kicked);
    chat
      .to(data.room)
      .emit('kicked', `${data.socketId} is kicked In ${data.room}`);
    chat.to(kicked.id).emit(`you`, `${kicked.id} 당신은 강퇴되었습니다.`);
    kicked.leave(data.room);
    console.log(`${data.socketId} is kicked In ${data.room}`);
  });
});

server.listen(3000, () => {
  // tslint:disable-next-line:no-console
  console.log('Socket IO server listening on port 3000');
});
