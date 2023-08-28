import express from "express";
import logger from "./utils/logger.js";
import cors from "cors";
import log4js from  "log4js";
import update from "./router/update.js";
import search from "./router/search.js";
import db from "./utils/db.js"
const app = express();
app.use(cors());
app.use(log4js.connectLogger(logger));

app.use("/search",search)
app.use("/update",update);

const port = process.env.PORT || 2999;
app.listen(port,async()=>{
    await db.connect().then(async() => {
        logger.info("Connected to PostgreSQL.");
        logger.info("Trying to create table....");
        await db.query(`CREATE TABLE IF NOT EXISTS vlists (
            id serial PRIMARY KEY,
            name text,
            episode text,
            dpi text,
            sublang text,
            videoinfo text unique,
            picture text,
            time bigint
        )`).then(()=>{
            logger.info("Created");
        })
    });
    logger.info(`Server started at ${port}`)
})