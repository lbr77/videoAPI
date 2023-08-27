
import { Router } from "express";
import db from '../utils/db.js';
import logger from "../utils/logger.js";

const router = Router();

router.get("/",async (req,res)=>{
    await db.query(`
    SELECT distinct name,picture from vlists`)
    .then(qRes=>qRes.rows)
    .then(data=>{
        for(let d of data){
            if(d.picture==null){
                d.picture = "/placeholder.jpg"
            }
        }
        res.send(data);
    })
    .catch(err=>{
        logger.error(err);
        res.status(500).json({status: "Not ok!"});
    })
})
router.get("/:query",async(req,res)=>{
    const qMaMi = async(name) => {
        return await db.query(`SELECT max(episode) as max,min(episode) as min
        FROM (SELECT * from vlists where name = \$1) as subq`,[name])
        .then(qRes=>qRes.rows[0]);
    }
    const query = req.params.query;
    await db.query(
        `SELECT distinct name,picture from vlists where name ilike \$1`,
        [`%${query}%`]
    )
    .then(qRes=>qRes.rows)
    .then(async(data)=>{
        let ret = [];
        for(let d of data){
            let res = await qMaMi(d.name);
            console.log(Object.assign({},res,d));
            ret.push(Object.assign({},res,d));
        }
        res.send(ret);
    })
    .catch(err=>{
        logger.error(err);
        res.status(500).json({status: "Not ok!"})
    })
})
router.get("/:query/all",async(req,res)=>{
    const {query} = req.params;
    await db.query(
        `SELECT episode from vlists where name = \$1 order by episode`,
        [query]
    )
    .then(qRes=>qRes.rows)
    .then(data=>{
        let ret = [];
        for(let d of data){
            ret.push(d.episode);
        }
        res.json(ret);
    })  
    .catch(err=>{
        logger.error(err);
        res.status(500).json({status: "Not ok!"});
    })  
})
router.get("/:query/:ep",async(req,res)=>{
    const {query,ep} = req.params;
    await db.query(
        `SELECT * from vlists where name = \$1 and episode = \$2 `,
        [query,ep]
    ).then(qRes=>qRes.rows)
    .then(data=>res.json(data))
    .catch(err=>{
        logger.error(err);
        res.status(500).json({status: "Not ok!"});
    })
})
export default router;