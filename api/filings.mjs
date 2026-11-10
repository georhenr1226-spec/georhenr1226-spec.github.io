import {collect} from '../lib/collect.mjs';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try {
    const data=await collect();
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch {
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({error:'The public source is unavailable. The dashboard will use its dated saved snapshot.'});
  }
}
