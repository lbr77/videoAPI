import pg from 'pg';
const client = new pg.Client({
    host: process.env.DB,
    port: 5432,
    user: 'postgres',
    password: process.env.PASSWORD,
    database: 'postgres'
});
export const downloading = new Map();
export default client;