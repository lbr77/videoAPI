// import db from "@/utils/db.js";
import { Router } from "express";
import * as OpenCC from 'opencc-js';
import axios from 'axios';
import db from '../utils/db.js';
import logger from '../utils/logger.js';
import Bottleneck from 'bottleneck';
const limiter = new Bottleneck({
    maxConcurrent:40,
    minTime: 10,
})
const router = Router();

const matcher1 = /\[(.*)\] (.*) - (.*) \[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\].(.*)/;
const matcher2 = /\[(.*)\] (.*) - (.*) \[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\].(.*)/;
const converter = OpenCC.Converter({from:'tw',to:'cn'})
router.post("/data/:month",async(req,res)=>{ // monthparams like : yyyy-m
    const month = req.params.month;
    const BASE_URL = "https://aniopen.an-i.workers.dev/"
    await axios.post(`${BASE_URL}${month}/`,{"password":"null"},{
        headers: {
            "Content-Type": 'application/json',
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",

        }
    })
        .then(res=>res.data)
        .then(async(data)=>{
            await data.files.map(async(e,idx)=>{
                const g = converter(e.name).match(matcher1).slice(2)
                let name = g[0].replace("（仅限港澳台地区）",""),episode = g[1],dpi = g[2],sublang = g[6];
                if(matcher2.test(e.name)){
                    // return;
                    sublang = converter(e.name).match(matcher2).slice(2)[6];
                    // console.log(sublang);
                }
                // console.log(name,episode,dpi,sublang);
                await db.query(`
                INSERT into vlists (name,episode,dpi,sublang,videoinfo) VALUES (\$1 , \$2 ,\$3, \$4 ,\$5)
                ON CONFLICT (videoinfo) DO NOTHING`,
                [name,episode,dpi,sublang,`${BASE_URL}${month}/${e.name}`])
            });
            res.json({"status": "ok"});
        }).catch(err=>{
            res.status(500).json({"status": "Not ok!"});
            logger.error(err);
        })
})
router.post("/pictures",async(req,res)=>{
    let data = await db.query("SELECT distinct name from vlists")
                .then(qRes=>qRes.rows);
    Promise.all(data.map((ele,idx)=>{
        return limiter.schedule(()=>{
            return axios.get("https://api.themoviedb.org/3/search/tv")
        })
    }))
})

export default router;