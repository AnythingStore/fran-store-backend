import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';

import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './public';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SingingDto } from './dto/singing.dto copy';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { ChangeAllCredentialsDto } from './dto/change-all-crethentials.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ){}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('singing')
  signIn(@Request() req, @Body() signInDto: SingingDto) {
    const ip = req.ip;
    return this.authService.signIn(signInDto.username, signInDto.password, ip);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('singup')
  signUp(@Body() signInDto: SingingDto) {
    return this.authService.signUp(signInDto.username, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('singout')
  singout(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.signout(token);
  }

  @Post('change_all_credentials')
  changeAllcredentials(@Request() req, @Body() changeAllCredentialsDto:ChangeAllCredentialsDto){
    return this.authService.changeAllCrethentials(req.user.sub, changeAllCredentialsDto);
  }

  @Post('change_credentials')
  resetPassword(@Request() req, @Body() updateUserDto:UpdateUserDto){
    return this.authService.changeCrethentials(req.user.sub, updateUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change_password')
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto){
    return this.authService.changePassword(req.user.sub, changePasswordDto);
  }
  
  @HttpCode(HttpStatus.OK)
  @Post('verify_token')
  verifyToken(){
    return ;
  }
  

}