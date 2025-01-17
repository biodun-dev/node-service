import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('WebSockets')
@Controller('websocket')
export class WebsocketController {

  @Get('docs')
  @ApiOperation({ summary: 'WebSocket API Documentation' })
  @ApiResponse({ status: 200, description: 'Provides WebSocket connection details' })
  getWebSocketDocs() {
    return {
      websocket_url: 'ws://localhost:5000',
      events: [
        { event: 'message', description: 'Send a message to a channel' },
        { event: 'leaderboard_updated', description: 'Receive real-time leaderboard updates' },
        { event: 'user_created', description: 'Receive a notification when a new user is created' },
        { event: 'user_updated', description: 'Receive a notification when a user is updated' },
        { event: 'user_deleted', description: 'Receive a notification when a user is deleted' },
        { event: 'event_created', description: 'Receive a notification when a new event is created' },
        { event: 'event_updated', description: 'Receive a notification when an event is updated' },
        { event: 'event_deleted', description: 'Receive a notification when an event is deleted' },
        { event: 'bet_created', description: 'Receive notification when a new bet is placed' },
        { event: 'bet_updated', description: 'Receive real-time updates on bet status or odds changes' },
        { event: 'bet_deleted', description: 'Receive notification when a bet is deleted' }
      ]
    };
  }
}
