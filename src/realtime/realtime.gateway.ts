import {
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RealtimeGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    this.logger.log(`Client ${client.id} joined room: ${data.roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.roomId);
    this.logger.log(`Client ${client.id} left room: ${data.roomId}`);
  }

  // Helper method to send updates to specific rooms (e.g., bookingId)
  emitBookingUpdate(bookingId: string, event: string, payload: any) {
    this.server.to(bookingId).emit(event, payload);
  }

  // Broad event for general updates (like a driver becoming available)
  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
