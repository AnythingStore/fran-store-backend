import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isDebug = process.env.NODE_ENV == 'development';
  console.log(`isDebug: ${isDebug}`);

  // HTTP Header Protection
  app.use(helmet());

  //CSRF Protection
  // app.use(csurf());

  //origin
  const allowedOrigins =[
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost/',
    'https://web-ten-kappa-98.vercel.app',
    'https://dmoda-boutique.vercel.app',
    'http://dmoda-boutique.vercel.app/',
  ];

  const corsOptions = {
    origin: isDebug ? "*": (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };



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
