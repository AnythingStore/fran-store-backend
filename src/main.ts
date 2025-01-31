import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP Header Protection
  // app.use(helmet());
  
  //CSRF Protection
  // app.use(csurf());

  //origin
  const allowedOrigins = [
    'http://localhost:3000',
  ];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }

  app.enableCors(corsOptions);

  //global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    errorHttpStatusCode: 422,
  }));




  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
