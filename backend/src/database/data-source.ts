import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm-options';

// La CLI de TypeORM y los scripts cargan backend/.env (las variables ya definidas no se sobrescriben).
config({ quiet: true });

const AppDataSource = new DataSource(buildTypeOrmOptions());
export default AppDataSource;
