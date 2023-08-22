import express from "express";
import logger from "./utils/logger.js";
import cors from "cors";
import log4js from  "log4js";
import update from "./router/update.js";
import db from "./utils/db.js"
const app = express();
app.use(cors());
app.use(log4js.connectLogger(logger));

app.use("/update",update);

const port = process.env.PORT || 3000;
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
            videoinfo text unique
        )`).then(()=>{
            logger.info("Created");
        })
    });
    logger.info(`Server started at ${port}`)
})