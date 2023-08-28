import pg from 'pg';
import config from "../config.js";

const client = new pg.Client({
    host: config.DB,
    port: 5432,
    user: 'postgres',
    password: config.PASSWORD,
    database: 'postgres'
});
export const downloading = new Map();
export default client;