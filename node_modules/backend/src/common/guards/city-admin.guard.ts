import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class CityAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // This assumes the JWT payload includes role and home_city_id
    if (!user) {
      return false;
    }

    if (user.role === 'super_admin') {
      return true; // Super admin can access everything
    }

    if (user.role !== 'department_admin' && user.role !== 'moderator') {
      throw new ForbiddenException('User does not have admin privileges');
    }

    // City scoping logic: The requested resource (cityId) must match user's home_city_id
    const requestCityId = request.params.cityId || request.query.cityId || request.body.cityId;
    
    if (requestCityId && user.home_city_id !== requestCityId) {
      throw new ForbiddenException('User is not authorized for this city');
    }

    // NOTE: True IDOR protection requires repository layer filtering as well.
    return true;
  }
}
