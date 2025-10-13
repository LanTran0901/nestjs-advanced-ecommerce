import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpStatus,
  HttpCode,
  ParseIntPipe
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/pipes/zod-custom.pipe';
import { User } from 'src/common/decorator/user.decorator';
import { CreateCartItemDto, UpdateCartItemDto, AddToCartDto, RemoveMultipleItemsDto } from './dto/cart.dto';
import { type JwtPayload } from 'src/types';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  async addToCart(
    @Body(ZodValidationPipe) addToCartDto: AddToCartDto,
    @User() user: JwtPayload
  ) {
    const cartItem = await this.cartService.addToCart(addToCartDto, user.id);
    return {
      message: 'Item added to cart successfully',
      data: cartItem
    };
  }

  @Get()
  async getCart(@User() user: JwtPayload) {
    const cart = await this.cartService.getCart(user.id);
    return {
      message: 'Cart retrieved successfully',
      data: cart
    };
  }

  @Patch(':skuId')
  async updateCartItem(
    @Param('skuId', ParseIntPipe) skuId: number,
    @Body(ZodValidationPipe) updateCartItemDto: UpdateCartItemDto,
    @User() user: JwtPayload
  ) {
    const cartItem = await this.cartService.updateCartItem(skuId, updateCartItemDto, user.id);
    return {
      message: 'Cart item updated successfully',
      data: cartItem
    };
  }

  @Delete(':skuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromCart(
    @Param('skuId', ParseIntPipe) skuId: number,
    @User() user: JwtPayload
  ) {
    await this.cartService.removeFromCart(skuId, user.id);
    return {
      message: 'Item removed from cart successfully'
    };
  }

  @Post('remove-multiple')
  @HttpCode(HttpStatus.OK)
  async removeMultipleItems(
    @Body(ZodValidationPipe) removeMultipleItemsDto: RemoveMultipleItemsDto,
    @User() user: JwtPayload
  ) {
     await this.cartService.removeMultipleItems(removeMultipleItemsDto, user.id);
    return {
      message: ` items removed from cart successfully`,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@User() user: JwtPayload) {
    await this.cartService.clearCart(user.id);
    return {
      message: 'Cart cleared successfully'
    };
  }
}