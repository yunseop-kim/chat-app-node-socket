import * as socketio from 'socket.io'
export interface IMySocket extends socketio.Socket {
    name: string;
    userid: string;
    room: string;
}