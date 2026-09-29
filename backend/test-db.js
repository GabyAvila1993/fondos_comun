const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://neondb_owner:npg_zI5cvjLSbM3g@ep-plain-mud-b6hyd0f9-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  synchronize: false,
});
ds.initialize().then(async () => {
  const res = await ds.query('SELECT amount, "createdAt" FROM deposits LIMIT 2');
  console.log('DEPOSITS:', res);
  ds.destroy();
}).catch(console.error);
