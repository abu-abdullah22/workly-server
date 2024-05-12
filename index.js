const express = require('express') ;
const cors = require('cors') ;
require('dotenv').config() ;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000 ;

const app = express() ;

app.use(
    cors({
      origin: [
        "http://localhost:5173",
      ],
      credentials: true,
      optionsSuccessStatus: 200, 
    })
  );
app.use(express.json()) ;
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token ;
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  if(token){
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
      if(err){
        console.log(err);
        return res.status(401).send({message: 'unauthorized access'}) ;
      } 
      req.user = decoded ;
      next()
    })
  }
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvqow0e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
     const jobCollection = client.db('worklyDB').collection('jobs') ;
     const applyCollection = client.db('worklyDB').collection('applied') ;
    // await client.connect();

    // jwt
    app.post('/jwt', async(req, res)=> {
      const user = req.body ;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2d'})
      res.cookie('token', token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV=== 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({success : true})
    })

    app.get('/logout', (req, res)=> {
      res.clearCookie('token', {
        httpOnly: true, 
        secure: process.env.NODE_ENV=== 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 0,
      }).send({success : true})

    })


  app.get('/jobs', async(req,res)=> {
    const result = await jobCollection.find().toArray();
    res.send(result);
  })

    app.get('/jobs', async(req,res)=> {
      const search = req.query.search ;
      let query = {
        job_title : {$regex : "search", $options : 'i'}
      }
      const result = await jobCollection.find(query).toArray() ;
      res.send(result) ;
    })

    app.get('/job/:id', async(req,res) => {
      const id = req.params.id ;
      const query = {_id : new ObjectId(id)}
      const result = await jobCollection.findOne(query) ;
      res.send(result) ;
    })

    app.post('/applied', async(req,res)=> {
      const appliedData = req.body ;
      const result = await applyCollection.insertOne(appliedData) ;
      res.send(result) ;
    })

    app.post('/jobs', async(req,res)=> {
      const addData = req.body ;
      const result = await jobCollection.insertOne(addData) ;
      res.send(result) ;
    })

    app.get('/jobs/:email',verifyToken, async(req,res)=> {
      const tokenData = req?.user?.email ;
      const email = req.params.email ;
      if(tokenData !== email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = {email : email} ;
      const result = await jobCollection.find(query).toArray() ;
      res.send(result) ;
    })


    app.get('/apply/:email',verifyToken, async(req,res)=> {
      const tokenData = req?.user?.email ;
      const email = req.params.email ;
      if(tokenData !== email) {
        return res.status(403).send({message: 'forbidden access'})
      }
      const query = {applierEmail : email} ;
      const result = await applyCollection.find(query).toArray() ;
      res.send(result) ;
    })

    app.put('/job/:id', async(req, res)=> {
      const id = req.params.id ;
      const query = {_id : new ObjectId(id)} ;
      const jobData = req.body ;
      const options = {upsert : true} ;
      const updateDoc = {
        $set : {
          ...jobData, 
        }
      }
      const result = await jobCollection.updateOne(query, updateDoc, options);
      res.send(result) ;
   
    })

    app.delete('/job/:id', async(req, res)=> {
      const id = req.params.id ;
      const query = {_id : new ObjectId(id)}
      const result = await jobCollection.deleteOne(query) ;
      res.send(result) ;
    })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async(req, res)=> {
    res.send('workly is running');
})

app.listen(port, ()=>{
    console.log(`workly is running on port : ${port}`);
})