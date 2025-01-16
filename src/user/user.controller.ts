import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users') // Group API under 'users'
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all users from Rails DB' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':email')
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }
}
