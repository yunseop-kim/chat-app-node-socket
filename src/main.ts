import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';
import { IMySocket } from './interface/IMySocket';
import { IUserInfo } from './interface/IUserInfo';

const app: express.Express = express();
const server: http.Server = http.createServer(app);
// http server를 socket.io server로 upgrade한다
const io: socketio.Server = socketio(server);
interface IWhisperInfo {
  to: string;
  // tslint:disable-next-line:no-reserved-keywords
  from: string;
  room: string;
  msg: string;
}
const chat = io.of('/chat').on(
  'connection',
  // tslint:disable-next-line:max-func-body-length
  (socket: IMySocket): void => {
    const address: string = socket.handshake.address;
    console.log(`New connection from ${address}, ${socket.id}`);
    socket.join('rooms');

    socket.on(
      'disconnect',
      (data: Object): void => {
        console.log('disconnect', data);
        console.log(`disconnection from ${address}, ${socket.id}`);
        console.log(
          `Socket info1: ${socket.name}, ${socket.userid}, ${socket.room}`,
        );
        socket.disconnect();
      },
    );

    socket.on(
      'join',
      (data: IUserInfo): void => {
        console.log('join', data);
        console.log(`from ${address}, ${socket.id}`);
        socket.name = data.name;
        socket.room = data.room;
        console.log(
          `Socket info2: ${socket.name}, ${socket.userid}, ${socket.room}`,
        );
        socket.join(data.room);
        chat.to(`test/${data.room}`).emit('join', 'test');
        chat.to('rooms').emit('rooms', parseRoom(chat.adapter.rooms));
        chat.to(socket.id).emit(`whisper`, `${socket.id} 당신에게만 보냅니다.`);
      },
    );

    socket.on(
      'leave',
      (data: IUserInfo): void => {
        console.log('leave', data);
        console.log(`from ${address}, ${socket.id}`);
        socket.name = data.name;
        socket.room = data.room;
        console.log(
          `Socket info3: ${socket.name}, ${socket.userid}, ${socket.room}`,
        );
        chat.to(`test/${data.room}`).emit('leave', 'test');
        socket.leave(data.room);
        chat.to('rooms').emit('rooms', parseRoom(chat.adapter.rooms));
      },
    );

    socket.on(
      'chatMessage',
      (data: IUserInfo): void => {
        console.log('data:', data);
        console.log(`from ${address}, ${socket.id}`);
        socket.name = data.name;
        const room: string = (socket.room = data.room);
        console.log(
          `Socket info4: ${socket.name}, ${socket.id}, ${socket.room}`,
        );
        chat.to(`test/${room}`).emit('chatMessage', {
          name: data.name,
          msg: data.msg,
          socketId: socket.id,
        });
      },
    );

    socket.on(
      'rooms',
      (data: Object): void => {
        const rooms: string[] = parseRoom(chat.adapter.rooms);
        console.log('rooms action', data, rooms);
        chat.to('rooms').emit('rooms', rooms);
      },
    );

    socket.on(
      'kick',
      (data: IUserInfo): void => {
        console.log('강퇴요청', data);
        const kicked: socketio.Socket = chat.sockets[data.socketId];
        console.log('강퇴요청 > kicked');
        chat
          .to(`test/${data.room}`)
          .emit('kicked', `${data.socketId} is kicked In ${data.room}`);
        chat.to(data.socketId).emit(`whisper`, {
          type: `kick`,
          msg: `${data.socketId} 당신은 강퇴되었습니다.`,
        });
        kicked.leave(data.room);
        console.log(`${data.socketId} is kicked In ${data.room}`);
      },
    );

    socket.on(
      'whisper',
      (data: IWhisperInfo): void => {
        console.log('귓속말:', data);
        // socket.join(data.room)
        chat
          .to(data.to)
          .emit(`whisper`, {
            type: 'whisper',
            name: data.from,
            msg: data.msg,
            socketId: socket.id,
          });
      },
    );
  },
);

server.listen(
  3000,
  (): void => {
    // tslint:disable-next-line:no-console
    console.log('Socket IO server listening on port 3000');
  },
);

const parseRoom: Function = (rooms: socketio.Rooms): string[] =>
  Object.keys(rooms)
    .filter((item: string) => item.startsWith('test'))
    .map((item: string) => item.split('test/')[1]);
