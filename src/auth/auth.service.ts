import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { ChangeAllCredentialsDto } from './dto/change-all-crethentials.dto';
import { InvalidCredentialsException } from 'src/utils/exceptions/invalid-credentials.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache

  ) { }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findOne(userId);

    if (!user || !(await bcrypt.compare(changePasswordDto.oldPassword, user.password))) {
      throw new InvalidCredentialsException();
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    return await this.userService.updatePassword(userId, hashedPassword, changePasswordDto);
  }
  

  async changeAllCrethentials(userId: number, changeAllCrethentials: ChangeAllCredentialsDto) {
    const user = await this.userService.findOne(userId);
    if(!user){
      throw new InvalidCredentialsException();
    }
    if (!user || !(await bcrypt.compare(changeAllCrethentials.oldPassword, user.password))) {
      throw new InvalidCredentialsException();
    }
    const hashedPassword = await bcrypt.hash(changeAllCrethentials.newPassword, 10);

    return await this.userService.updateAllCrethentials(userId, hashedPassword, changeAllCrethentials);
}
  async changeCrethentials(userId: number, changeCredentials: UpdateUserDto) {
      const user = await this.userService.findOne(userId);
      if(!user){
        throw new NotFoundException('User not found');
      }
  
      return await this.userService.update(userId, changeCredentials);
  }
 
  async signout(token: string) {
    await this.cacheManager.set(`revoked_token_${token}`, true, 90000 );
    return { message: 'Signed out successfully' };
  }

  async signUp(username: string, pass: string): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new InvalidCredentialsException();
    }
    
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.userService.create({ username, password: hashedPassword });
    if(!user){
      throw new InvalidCredentialsException();
    }
  }
  async signIn(username: string, pass: string, ip:number): Promise<{ access_token: string }> {
    const user = await this.userService.findOneByName(username);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new InvalidCredentialsException();
    }
    const payload = { sub: user.id, username: username, ip: ip };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
 


}
