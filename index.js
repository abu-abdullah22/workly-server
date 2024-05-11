const express = require('express') ;
const cors = require('cors') ;
require('dotenv').config() ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000 ;

const app = express() ;

app.use(
    cors({
      origin: [
        "http://localhost:5173",
      ],
      credentials: true,
    })
  );
app.use(express.json()) ;




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

    app.get('/jobs', async(req,res)=> {
      const result = await jobCollection.find().toArray() ;
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

    app.get('/jobs/:email', async(req,res)=> {
      const email = req.params.email ;
      const query = {email : email} ;
      const result = await jobCollection.find(query).toArray() ;
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