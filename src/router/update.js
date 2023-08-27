// import db from "@/utils/db.js";
import { Router } from "express";
import * as OpenCC from 'opencc-js';
import axios from 'axios';
import db from '../utils/db.js';
import logger from '../utils/logger.js';
import Bottleneck from 'bottleneck';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const limiter = new Bottleneck({
    maxConcurrent:2,
    minTime: 1,
})
const router = Router();
const apiKey = "fa83dc8b69fa8e021e8717e25150462e";
const matcher1 = /\[(.*)\] (.*) - (.*) \[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\].(.*)/;
const matcher2 = /\[(.*)\] (.*) - (.*) \[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\]\[(.*)\].(.*)/;
const title_matcher = /(.*)(第.*季|Season \d+)/
const converter = OpenCC.Converter({from:'tw',to:'cn'})
router.get("/picture",async(req,res)=>{
    await db.query(`
    SELECT distinct name from vlists where picture is null`)
    .then(qRes=>qRes.rows)
    .then(async(data)=>{
        logger.info("Fetching images from tmdb...")
        Promise.all(data.map((e,i)=>{
            return limiter.schedule(()=>{
                
                let name = e.name;
                if(title_matcher.test(e.name)){
                    name = e.name.match(title_matcher)[1].trim();
                }
                logger.info(name);
                return axios.get(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${name.replace("~"," ").replace("-"," ")}`)
                .then(res=>{
                    return res.data.results[0];
                })
                .then(async(data)=>{
                    await db.query(`UPDATE vlists
                    SET picture = \$1
                    WHERE NAME = \$2
                    `,[`https://image.tmdb.org/t/p/w300_and_h450_bestv2${data.poster_path}`,e.name])
                })
                .then(()=>{
                    logger.info(`Finished ${e.name}`)
                })
                .catch((err)=>{
                    logger.info(`Failed ${e.name}`);
                })
            })
        }))
        .then(()=>{
            res.json({"status": "ok"})
        })
        .catch(err=>{
            res.status(500).json({"status": "Not ok"})
            logger.error(err);
        })
    })
    .catch(err=>{
        res.status(500).json({"status": "Not ok"});
    })
});
router.get("/data/picture/:name/:id",async(req,res)=>{
    const {name,id} = req.params;
    await db.query(`UPDATE vlists
    SET picture = \$1
    WHERE name = \$2`,[`https://image.tmdb.org/t/p/w300_and_h450_bestv2/${id}.jpg`,name])
    .then(()=>{
        res.json({"status":"ok"})
    })
    .catch((err)=>{
        res.status(500).json({"status": "Not ok"})
        logger.error(err);
    })
})
router.post("/data/:year/:month",async(req,res)=>{ // monthparams like : yyyy-m
    const {month,year} = req.params;
    const BASE_URL = "https://aniopen.an-i.workers.dev/"
    await axios.post(`${BASE_URL}${year}-${month}/`,{"password":"null"},{
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
                [name,episode,dpi,sublang,`${BASE_URL}${year}-${month}/${e.name}`])
            });
            res.json({"status": "ok"});
        }).catch(err=>{
            res.status(500).json({"status": "Not ok!"});
            logger.error(err);
        })
})

export default router;