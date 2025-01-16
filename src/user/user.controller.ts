import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('access-token') // Apply Bearer Auth globally to this controller
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Route to get all users - protected with JWT guard
  @Get()
  @UseGuards(JwtAuthGuard)  // Protect this route with JWT guard
  @ApiOperation({ summary: 'Retrieve all users from Rails DB' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    return this.userService.getAllUsers();
  }

  // Route to get user by email - protected with JWT guard
  @Get(':email')
  @UseGuards(JwtAuthGuard)  // Protect this route with JWT guard
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }
}
