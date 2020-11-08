import express from 'express'
import mongoose from 'mongoose'

import Message from './models/Message.js'
import Pusher from 'pusher'
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 9000;

//middleware
app.use(express.json());
app.use(cors())

// app.use((req,res,next)=>{
//     res.setHeader('Access-Control-Allow-Origin','*')
//     res.setHeader('Access-Control-Allow-Headers','*')
//     next();
// })

const pusher = new Pusher({
    appId: "...",
    key: "..",
    secret: "",
    cluster: "",
    useTLS: true
  });

mongoose.connect("",{
    //"mongodb://localhost/whatsapp",{
    useCreateIndex: true,
    useNewUrlParser: true,  //parses the url in new ways
    useUnifiedTopology: true
})


const db = mongoose.connection;

db.once('open', () =>{
    const messageCollection = db.collection('messages')
    const changeStream = messageCollection.watch()
    // console.log("changeStream:"+changeStream);

    changeStream.on("change", change => {
        if(change.operationType == 'insert'){
            const messageDetails = change.fullDocument;
            console.log(messageDetails.name+' message->'+messageDetails.message+' at '+messageDetails.timestamp)
            pusher.trigger('messages','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp
            })
        } else console.log("Error triggering Pusher")
    });
})

//mongodb password = vFwHqxTPPiiDEGSe

app.get("/messages/sync", (req,res) => { Message.find((err,data) => {
    if(err) res.status(500).send(err)
    
    res.status(200).send(data)
})})
app.post('/messages/new', (req,res) => {
    const message = req.body;
    Message.create(message, (err,data) => {
        if(err) res.status(500).send(err)
        
        res.status(201).send(data)
    })
})

app.listen(PORT, () => console.log('\x1b[36m%s\x1b[0m',`application started at ${PORT}`))