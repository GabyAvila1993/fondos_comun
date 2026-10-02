import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrivyService } from "./privy.service";

/**
 * Guard que se pone en cada endpoint protegido. Lee el token de Privy del
 * header Authorization, lo verifica, y cuelga request.privyUserId para que
 * el controller sepa quien esta llamando sin volver a pedir nada.
 */
@Injectable()
export class PrivyAuthGuard implements CanActivate {
  constructor(private privy: PrivyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Falta el token de Privy");
    }
    const token = authHeader.slice("Bearer ".length);
    try {
      const claims = await this.privy.verifyToken(token);
      req.privyUserId = claims.userId;
      return true;
    } catch {
      throw new UnauthorizedException("Token de Privy invalido o expirado");
    }
  }
}
