import 'dotenv/config';
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // el front (la app fiat) llama a esta API desde otro origen
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend de Fondo Comun escuchando en http://localhost:${port}`);
}
bootstrap();
