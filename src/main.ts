import { NestFactory, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filter/exception.filter';
import { AppModule } from './modules/app/app.module';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { PrismaService } from './db/prisma.service';
import { ResponseFormatInterceptor } from './common/interceptors/response.interceptor';
import { cleanupOpenApiDoc } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalGuards(new JwtAuthGuard(new Reflector(),new PrismaService()));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseFormatInterceptor());
 
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('The Ecommerce API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API key for authentication',
      },
      'API-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const cleaned = cleanupOpenApiDoc(document);
  SwaggerModule.setup('api', app, cleaned);
  
  await app.listen(process.env.PORT ?? 5000, '0.0.0.0');
  
}
bootstrap();
