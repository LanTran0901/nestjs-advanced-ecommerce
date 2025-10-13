import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { authModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { LanguageModule } from '../language/language.module';
import { PermissionModule } from '../permission/permission.module';
import { CategoryModule } from '../category/category.module';
import { RoleModule } from '../role/role.module';
import { BrandModule } from '../brand/brand.module';
import { ProductModule } from '../product/product.module';
import { CartModule } from '../cart/cart.module';
import { OrderModule } from '../order/order.module';
import { PaymentModule } from '../payment/payment.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';

@Module({
  imports: [authModule, UserModule, LanguageModule, PermissionModule, CategoryModule, RoleModule, BrandModule, ProductModule, CartModule, OrderModule, PaymentModule],
  controllers: [AppController],
  providers: [AppService,{
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },],
})
export class AppModule {}
