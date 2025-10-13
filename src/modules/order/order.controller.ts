import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Put
} from '@nestjs/common';
import { OrderService } from './order.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, OrderStatus } from './dto/order.dto';
import { type JwtPayload } from 'src/types';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ZodValidationPipe) body:{data: CreateOrderDto},
    @User() user: JwtPayload
  ) {
    return this.orderService.create(body.data, user.id);
  }

  @Get()
  async findAll(
    @Query(ZodValidationPipe) queryOrderDto: QueryOrderDto,
    @User() user: JwtPayload
  ) {
    return this.orderService.findAll(queryOrderDto, user.id);
  }

  @Get('my-orders')
  async findMyOrders(
    @Query(ZodValidationPipe) queryOrderDto: QueryOrderDto,
    @User() user: JwtPayload
  ) {
    return this.orderService.findMyOrders(queryOrderDto, user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    return this.orderService.findOne(id, user.id);
  }

 
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
    @User() user: JwtPayload
  ) {
    return this.orderService.updateStatus(id, status, user.id);
  }

 

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtPayload
  ) {
    return this.orderService.cancel(id, user.id);
  }

 
}