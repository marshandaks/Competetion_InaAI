import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const adminCount = await this.prisma.admin.count();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await this.prisma.admin.create({
        data: {
          email: 'admin@sentiview.com',
          password: hashedPassword,
          name: 'SentiView Admin',
        },
      });
      console.log('Default admin seeded: admin@sentiview.com / admin123');
    }
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.admin.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    };
  }
}
