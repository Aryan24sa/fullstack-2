const express=require('express');const cors=require('cors');const app=express();app.use(cors());app.use(express.json());let posts=[{id:1,title:'Hello'}];
app.get('/posts',(req,res)=>res.json(posts));
app.post('/posts',(req,res)=>{const p={id:Date.now(),title:req.body.title};posts.push(p);res.json(p);});
app.listen(5000,()=>console.log('Server 5000'));