const express = require('express');
const app = express();

app.get('/api',(req,res)=>{
    res.send("hi");
})

app.listen(3000,()=>{
    console.log("running");
});