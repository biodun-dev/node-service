import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Protecting the route to get all users
  @Get()
  @UseGuards(JwtAuthGuard)  // Protect this route with JWT guard
  @ApiOperation({ summary: 'Retrieve all users from Rails DB' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    return this.userService.getAllUsers();
  }

  // Protecting the route to get user by email
  @Get(':email')
  @UseGuards(JwtAuthGuard)  // Protect this route with JWT guard
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }
}
