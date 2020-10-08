const PORT = process.env.PORT;
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const admin = require("firebase-admin");

const serviceAccount = require("./config/volunteer-networkk-firebase-adminsdk-qjb7v-7563bf69cc.json");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-networkk.firebaseio.com"
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.po85n.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const eventsCollection = client.db(process.env.DB_NAME).collection("eventRegistration");
  
  app.post('/registrationEvent', (req, res) => {
      const registrationEventInfo = req.body;
      console.log(registrationEventInfo);
      eventsCollection.insertOne(registrationEventInfo)
      .then(result => {
          res.send(result.insertedCount > 0);
          console.log(registrationEventInfo);
      })
  })

  app.get('/userPanel', (req, res) => {
      const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1];
          console.log({idToken});
          // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
            .then(function(decodedToken) {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            console.log(tokenEmail, queryEmail);
            if(tokenEmail === queryEmail){
                eventsCollection.find({email: req.query.email})
                .toArray((err, documents) => {
                    res.send(documents);
                })
            }else{
                res.status(401).send("unauthorized access");
            }
            }).catch(function(error) {
                res.status(401).send("unauthorized access");
            });
      }else{
        res.status(401).send("unauthorized access");
      }
  })

  app.get('/admin/getVolunteer', (req, res) => {
      eventsCollection.find({})
      .toArray((err, documents) => {
          res.send(documents)
      })
  })

  app.delete('/deleteEvent/:id', (req, res) => {
      console.log(req.params.id)
      eventsCollection.deleteOne({_id: ObjectId(req.params.id)})
      .then(result => {
          console.log(result);
          res.send(result.deletedCount > 0 )
      })
  })

  console.log("Database Connected Successfully")
  //client.close();
});



app.get('/', (req, res)=>{
    res.send("Hello World");
})

app.listen(PORT, ()=>console.log("Port is Listening 4000"));