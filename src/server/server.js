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
app.get('/activate', (request, response) => {
  let phone = request.query.phone;
  if(!phone) return response.status(401).send('No phone or code sent in request'); 

  //TODO: sanitize phone number
  //Generate non-unique access token.This is ok because the phone number + access token will be used together to verify a user call
  let token = Math.random().toString().substr(2,4);
  db.storeAccessToken(phone, token);

  //TODO: send access token to client
  response.status(200).send();
});

/**
 * Step 2 of authentication: Check if token and phone number match that in DB
 */
app.get('/validate', (request, response) => {
  let phone = request.query.phone;
  let code = request.query.code;
  if(!phone || !code) return response.status(401).send('No phone or code sent in request'); 

  //TODO: refactor to use promise instead of callback
  db.validatePhoneAndAccessToken(phone, code)
  .then(isValid => isValid ? response.status(200).send() : response.status(401).send('Incorrect phone number or token')) 
});

/**
 * Populates funds bar
 */
app.get('/balance', (request, response) => {
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
});

/**
 * Checks phone and token. If valid (exists in db), then call phone number
 */
app.put('/call', (request, response) => {
  console.log("Succesfully called server with call request");
  const phone = request.headers['phone-number'];
  const token = request.headers['access-token'];

  db.validatePhoneAndAccessToken(phone, token)
  .then(isValid => {
    if (isValid) {
      const client = twilio(apiKey, apiSecret, { accountSid: accountId });
      // client.calls.create({
      //   url: 'http://demo.twilio.com/docs/voice.xml',
      //   to: phone,
      //   from: '+14088829909'
      // })
      // .then(call => {
      // //TODO sanitize inputs to prevent sql injection
        db.incrementCalls(phone);
        return response.status(200).send();
      // })
      // .catch(x => console.log(x));
    }
  })
  .catch(x => {
    console.log(x)
  });
});

/*
 * TODO: get rid of some of these generic methods
 */
app.get('/users', db.getAllUsersCallData)
app.get('/users/:phone', (request, response) => {
  const phone = request.headers['phone-number'];
  const token = request.headers['access-token'];

  db.validatePhoneAndAccessToken(phone, token)
  .then(isValid => {
    if (isValid) {
      db.getCallDataByPhone(phone)
      .then(x => response.status(200).json(x));
    }
  })
  .catch(x => {
    console.log(x)
  });

});

// app.put('/users/:phone', db.updateUser)
// app.delete('/users/:phone', db.deleteUser)


app.listen(port, () => {
  console.log('Server is up!');
});


