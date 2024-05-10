const express = require('express') ;
const cors = require('cors') ;
require('dotenv').config() ;
const app = express() ;
const port = process.env.PORT || 5000 ;

app.use(cors())
app.use(express.json())

app.post('/', async(req, res)=> {
    res.send('workly is running')
})

app.listen(port, ()=>{
    console.log(`workly is running on port : ${port}`);
})