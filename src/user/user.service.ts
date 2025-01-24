import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }
  async findOne(userId: number) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
  }
  async findOneByName(usermane: string) {
    return await this.prisma.user.findUnique({
      where: {
        username: usermane
      }
    })
  }

  async updatePassword(userId: number, newPassword: string, changePasswordDto: ChangePasswordDto) {
    return await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        password: newPassword,
      }
    })
  }
  async create(createUserDto: CreateUserDto) {
    return await this.prisma.user.create({
      data: {
        ...createUserDto
      }
    })
  }

  async update(userId: number, updateUserDto: UpdateUserDto) {
    return await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...updateUserDto
      }
    })
  }

  async delete(userId: number) {
    return await this.prisma.user.delete({
      where: {
        id: userId
      }
    })
  }





}
