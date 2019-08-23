const express = require('express'); 
const twilio = require('twilio');
const axios = require('axios');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./queries');
const bodyParser = require('body-parser');

require('dotenv').config();

const port = process.env.PORT || 8080;
const redirectUri = process.env.TWILIO_API_REDIRECT_URI || 'http://localhost:8080/callback';
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const accountId = process.env.TWILIO_API_ACCOUNT_SID;
const accessToken = process.env.TWILIO_API_ACCESS_TOKEN;
const publicPath = path.join(__dirname, '..','..','public');
const client = twilio(apiKey, apiSecret, { accountSid: accountId });

const app = express();
app.use(express.static(publicPath))
   .use(cors())
   .use(express.json()) 
   .use(cookieParser())
   .use(bodyParser.json())
   .use( bodyParser.urlencoded({ extended: true,}));

/**
 * Step 1 of authentication. Generate token, send to phone.
 */
app.get('/activate', function(request, response) {
  let phone = request.query.phone;
  if(!phone) return response.status(401).send('No phone or code sent in request'); 

  //TODO: sanitize phone number
  //Generate non-unique access token.This is ok because the phone number + access token will be used together to verify a user call
  let token = Math.random().toString().substr(2,4);
  db.storeAccessToken(request, response, phone, token);

  //TODO: send access token to client
  response.status(200).send();
});

/**
 * Step 2 of authentication: Check if token and phone number match that in DB
 */
app.get('/validate', function(request, response) {
  let phone = request.query.phone;
  let code = request.query.code;
  if(!phone || !code) return response.status(401).send('No phone or code sent in request'); 

  //TODO: refactor to use promise instead of callback
  return db.validateAccessToken(request, response, phone, code, x => x ? response.status(200).send() : response.status(401).send('Incorrect phone number or token')) 
});

/**
 * Populates funds bar
 */
app.get('/balance', function(request, response) {
  const config = {
    auth: {
      'username': accountId,
      'password': accessToken
    }
  };
  axios.get(`https://api.twilio.com/2010-04-01/Accounts/${accountId}/Balance.json`, config)
  .then(apiResponse => {
    /* it doesn't make sense to display the $ amount of funding left because the user doesn't know
     * (or maybe even care) what this actually means. So, instead display a heuristic for number of calls left, assuming:
     * - each user will use the extension 3 times so for every 3 calls, one is a verification text
     * - 1 call is 1.3 cents and 1 text is 0.75 cents. So assume each call is 1.3+0.25 = 1.55 cents
    */
    let accountVal = apiResponse.data.balance;
    let numCallsLeft = ((accountVal * 100) / 1.55).toFixed(0)
    response.json(numCallsLeft);
  })
  .catch( error => {
    //TODO: implement graceful error handling
    console.log(error);}
  );

});

/**
 * Checks phone and token. If valid (exists in db), then call phone number
 */
app.put('/call', function(request, response) {
  //TODO: remove this testing call
  //const client = twilio(apiKey, apiSecret, { accountSid: accountId });

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
  console.log("Succesfully called server");
  response.json({ info: 'Node.js, Express, and Postgres API' })

  //TODO: update number of calls in database
});

app.get('/users', db.getAllUsersCallData)
app.get('/users/:phone', db.getCallDataById)
app.post('/users', db.createUser)
app.put('/users/:phone', db.updateUser)
app.delete('/users/:phone', db.deleteUser)


app.listen(port, () => {
  console.log('Server is up!');
});
