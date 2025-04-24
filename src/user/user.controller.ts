import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLES, RESOURCES } from '../common/constants';
import { Action } from '../common/decorators/action.decorator';
import { Resource } from '../common/decorators/resource.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('users')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(ROLES.ADMIN)
  @Action('create')
  @Resource(RESOURCES.USER)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(ROLES.ADMIN)
  @Action('read')
  @Resource(RESOURCES.USER)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('profile')
  @Action('read')
  @Resource(RESOURCES.USER)
  getProfile(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  @Get(':id')
  @Roles(ROLES.ADMIN)
  @Action('read')
  @Resource(RESOURCES.USER)
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @Action('update')
  @Resource(RESOURCES.USER)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser,
  ) {
    // Only admin can update other users
    if (id !== currentUser.id && currentUser.role !== ROLES.ADMIN) {
      return {
        message: 'You are not authorized to update this user',
      };
    }

    // Only admin can update roles
    if (updateUserDto.role && currentUser.role !== ROLES.ADMIN) {
      delete updateUserDto.role;
    }

    return this.userService.update(id, updateUserDto);
  }

  // @Delete(':id')
  // @Roles(ROLES.ADMIN)
  // @Action('delete')
  // @Resource(RESOURCES.USER)
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(id);
  // }
}
