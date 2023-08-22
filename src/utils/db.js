import pg from 'pg';
const client = new pg.Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'lbr',
    database: 'postgres'
});
export const downloading = new Map();
export default client;