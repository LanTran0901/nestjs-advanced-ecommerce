import { NestFactory } from '@nestjs/core';
import { HTTPMethod, PrismaClient } from 'generated/prisma';
import { AppModule } from 'src/modules/app/app.module';
import { RoleService } from 'src/common/services/role.service';
import { UserRole } from 'src/types';

const prisma = new PrismaClient();

interface routeType {
  path: string;
  method: HTTPMethod;
}


function getRoleIdsForRoute(
  path: string, 
  method: HTTPMethod, 
  adminRoleId: number, 
  sellerRoleId: number, 
  clientRoleId: number
): number[] {
  const upperMethod = method.toUpperCase() as HTTPMethod;
  
  // Admin-only paths - full system management
  const adminOnlyPaths = ['/permission', '/role', '/language'];
  const adminOnlyUserMethods = ['DELETE', 'PUT', 'PATCH'];
  
  // Seller paths - product and inventory management
  const sellerPaths = [
    '/product', 
    '/product-translation',
    '/brand', 
    '/brand-translation',
    '/category'
  ];
  const sellerOrderMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  // Client paths - customer-facing operations
  const clientPaths = ['/cart', '/auth'];
  
  // Public read paths - accessible to all authenticated users
  const publicReadPaths = [
    '/product', 
    '/product-translation',
    '/category', 
    '/brand', 
    '/brand-translation',
    '/order',
    '/language'
  ];
  
  // Root path - accessible to all (usually health check or basic info)
  if (path === '/') {
    return [adminRoleId, sellerRoleId, clientRoleId];
  }
  
  // Admin routes - system administration
  if (adminOnlyPaths.some(adminPath => path.includes(adminPath)) ||
      (path.includes('/user') && adminOnlyUserMethods.includes(upperMethod))) {
    return [adminRoleId]; 
  }
  
  // Seller routes - business operations
  if (sellerPaths.some(sellerPath => path.includes(sellerPath)) ||
      (path.includes('/order') && sellerOrderMethods.includes(upperMethod))) {
    return [adminRoleId, sellerRoleId]; 
  }
  
  // Client routes and public reads
  if (clientPaths.some(clientPath => path.includes(clientPath)) ||
      (publicReadPaths.some(readPath => path.includes(readPath)) && upperMethod === 'GET') ||
      (path.includes('/user') && upperMethod === 'GET') ||
      path.includes('/payment')) {
    return [adminRoleId, sellerRoleId, clientRoleId]; 
  }
  
  // Default: admin only for unspecified routes
  return [adminRoleId];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4000);
  const server = app.getHttpAdapter().getInstance();
  const router = server.router;

  const roleService = app.get(RoleService);

  const [adminRoleId, sellerRoleId, clientRoleId] = await Promise.all([
  roleService.getRoleIdByName(UserRole.ADMIN),
  roleService.getRoleIdByName(UserRole.SELLER),
  roleService.getRoleIdByName(UserRole.CLIENT),
]);

  
  if (!adminRoleId || !sellerRoleId || !clientRoleId) {
    throw new Error('Required roles not found in database');
  }

  const availableRoutes: routeType[] = router.stack
    .map((layer) => {
      if (layer.route) {
        return {
          path: layer.route?.path,
          method: layer.route?.stack[0].method as HTTPMethod,
        };
      }
    })
    .filter((item) => item !== undefined);

  await Promise.all(
    availableRoutes.map(async (route) => {
      const roleIds = getRoleIdsForRoute(route.path, route.method, adminRoleId, sellerRoleId, clientRoleId);
      
      await prisma.permission.upsert({
        where: {
          path_method: {
            path: route.path,
            method: route.method.toUpperCase() as HTTPMethod,
          },
        },
        update: {},
        create: {
          path: route.path,
          method: route.method.toUpperCase() as HTTPMethod,
          name: route.path,
          roles: {
            connect: roleIds.map(id => ({ id })),
          },
        },
      });
    }),
  );
  
  console.log('✅ Permissions updated successfully');
  await app.close(); // Close the app
  await prisma.$disconnect(); // Close the database connection
  process.exit(0); // Exit the process
}
bootstrap();
