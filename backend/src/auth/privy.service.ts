import { Injectable } from "@nestjs/common";
import { PrivyClient } from "@privy-io/server-auth";

/**
 * PrivyService
 * -------------
 * Privy es quien resuelve "login con Google -> wallet creada sola".
 * El FRONTEND usa el SDK de Privy (@privy-io/react-auth) para mostrar el
 * boton "Continuar con Google" y crear la wallet embebida del usuario.
 * Este backend solo necesita, en cada request, VERIFICAR el token que
 * manda el frontend y sacar la direccion de wallet asociada a ese usuario.
 */
@Injectable()
export class PrivyService {
  private client: PrivyClient;

  constructor() {
    this.client = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);
  }

  /** Verifica el JWT que manda el frontend (header Authorization: Bearer <token>). */
  async verifyToken(token: string) {
    return this.client.verifyAuthToken(token);
  }

  /**
   * Trae los datos del usuario en Privy, incluida su wallet embebida
   * (la que Privy creo automaticamente al loguearse con Google/Apple).
   */
  async getUser(privyUserId: string) {
    const user = await this.client.getUser(privyUserId);
    const embeddedWallet = user.linkedAccounts.find(
      (acc: any) => acc.type === "wallet" && acc.walletClientType === "privy",
    ) as any;
    return {
      privyUserId: user.id,
      email: user.email?.address,
      walletAddress: embeddedWallet?.address as string | undefined,
    };
  }
}
