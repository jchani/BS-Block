const express = require('express'); 
const twilio = require('twilio');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./queries')
require('dotenv').config();
const port = process.env.PORT || 8080;
const redirectUri = process.env.TWILIO_API_REDIRECT_URI || 'http://localhost:8080/callback';
const apiKey = process.env.TWILIO_API_SID;
const apiSecret = process.env.TWILIO_API_AUTH_TOKEN;
const accountId = process.env.TWILIO_API_ACCOUNT_SID;
const publicPath = path.join(__dirname, '..','..','public');

const app = express();
app.use(express.static(publicPath))
   .use(cors())
   .use(express.json()) 
   .use(cookieParser());

app.get('/', function(req, res) {
  //TODO: remove this testing call
  //const client = twilio(apiKey, apiSecret, { accountSid: accountId });
  const client = twilio("SK859307721dc36490d246539524016251", "42US8SVA3LLz0xatohuWbOOtjsfmDHuX", { accountSid: "AC140dd04274999511e8446f20848e6ac9" });
  //client.api.accounts.each(accounts => console.log(accounts.sid));
  // client.calls
  //     .create({
  //        url: 'http://demo.twilio.com/docs/voice.xml',
  //        to: '+19093446762',
  //        from: '+14088829909'
  //      })
  //     .then(call => {
  //       console.log(call.sid)
  //     });
  response.json({ info: 'Node.js, Express, and Postgres API' })

  //TODO: update number of calls in database


});

app.get('/users', db.getUsers)
app.get('/users/:id', db.getUserById)
app.post('/users', db.createUser)
app.put('/users/:id', db.updateUser)
app.delete('/users/:id', db.deleteUser)


app.listen(port, () => {
  console.log('Server is up!');
});
