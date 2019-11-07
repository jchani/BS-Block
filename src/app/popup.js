window.addEventListener("load", initial, false);
let showUpdateButton = false;

//For development to check if values are updated properly
if(showUpdateButton) {
  let mainPopupElement = document.getElementById('main_popup');
  let updateButton = document.createElement('button');
  updateButton.innerText = "Update";
  mainPopupElement.appendChild(updateButton);
  updateButton.onclick = function(element) {
    initial();
  }
}

let phoneNum; 
let accessToken;
let activateButton = document.getElementById('activate'); //visible in 1st step
let validateButton = document.getElementById('validate');; // will be visible in 2nd step
let callButton = document.getElementById('header'); //will be visible in 3rd step
let phoneElement = document.getElementById('phone');

function initial() {
  console.log(`initial is being reached`);
  chrome.storage.sync.get(["BsBlock_phone"], function(response1) {
    chrome.storage.sync.get(["BsBlock_token"], function(response2) {
      phoneNum = response1.BsBlock_phone;
      accessToken = response2.BsBlock_token;
      if(phoneNum && accessToken) { //check if user has gone through validation process
        console.log(`auth passed`);
        document.getElementById('authenticate_popup').setAttribute('class', 'hidden');
        document.getElementById('main_popup').classList.remove('hidden');
        setHeaders()
        populateData();
      } else {
        document.getElementById('enter_code').setAttribute('class', 'hidden');
        document.getElementById('enter_phone').classList.remove('hidden');
        console.log(`auth not completed yet`);
      }
    });
  });
}

// --- AUTHENTICATION ---
activateButton.onclick = function(element) {
  phoneNum = document.getElementById('phone').value;

  if(phoneNum) {
    axios.get(`http://localhost:8080/activate?phone=${phoneNum}`, {}).then(response => {
      document.getElementById('enter_phone').setAttribute('class', 'hidden');
      document.getElementById('enter_code').classList.remove('hidden');
    }).catch(response => {
      console.log(response);
    });
  }
}

validateButton.onclick = function(element) {
  accessToken = document.getElementById('code').value;

  if(accessToken) {
    axios.get(`http://localhost:8080/validate?code=${accessToken}&phone=${phoneNum}`, {}).then(response => {
      //use chrome.storage to store phone number and access token
      chrome.storage.sync.set({["BsBlock_phone"]: phoneNum});  
      chrome.storage.sync.set({["BsBlock_token"]: accessToken});
      document.getElementById('authenticate_popup').setAttribute('class', 'hidden');
      document.getElementById('main_popup').classList.remove('hidden');
      document.getElementById('hint').classList.remove('hidden');

      populateData();
    }).catch(response => {
      console.log(response);
    });
  }
}

updateButton.onclick = function(element) {
  initial();
}

// --- MAIN POPUP FUNCTIONALITY ---
callButton.onclick = function(element) {
  axios.put('http://localhost:8080/call', {})
    .then(response => {
      console.log("call sent successfully");
      //skip DB hits and just get it from DOM
      let numCallsStr = document.getElementById('numCalls').innerText; 
      populateFundingUI(Number.parseInt(numCallsStr) - 1);

      let numCallsElement = document.getElementById('numPersonalCalls');
      let numEveryoneCallsElement = document.getElementById('numEveryonesCalls');
      numCallsElement.innerText = Number.parseInt(numCallsElement.innerText) + 1;
      numEveryoneCallsElement.innerText = Number.parseInt(numEveryoneCallsElement.innerText) + 1;
  }).catch(response => { 
    //can't find row with phone number + token, so invalidate values in chrome storage
    chrome.storage.sync.clear();
  });
}

function setHeaders() {
  //Set default headers so that every request will have phone and access code
  axios.defaults.headers.common['phone-number'] = phoneNum;
  axios.defaults.headers.common['access-token'] = accessToken;
}

function populateData(phoneNum, accessToken) {
  axios.get(`http://localhost:8080/balance/`, {})
  .then(response => {
    populateFundingUI(response.data);
  });

  //TODO: refactor these 2 requests into one? This is the only place either of these endpoints are hit
  axios.get(`http://localhost:8080/users/${phoneNum}`, {})
  .then(response => {
    let personalCallsCount = document.getElementById('numPersonalCalls');
    let callData = response.data;
    if(callData != undefined && callData[0] != undefined && callData[0].calls != undefined) {
      personalCallsCount.innerText = callData[0].calls
    } else {
      personalCallsCount.innerText = '0';
    }
  });

  axios.get(`http://localhost:8080/users/`, {})
  .then(response => {
    let everyoneCallsCount = document.getElementById('numEveryonesCalls');
    let callData = response.data;
    if(callData != undefined && callData[0] != undefined && callData[0].calls != undefined) {
      everyoneCallsCount.innerText = callData[0].calls;
    } else {
      everyoneCallsCount.innerText = '0';
    }
  });

  //Alternate phrases 
  let phrases = ['Uncomfortable conversations avoided: ', 'Annoying coworkers averted: ', 'Unnecessary interruptions dodged: '];
  let phraseElement = document.getElementById('phrase');
  let randomIndex = Math.floor(Math.random() * 3); //random number between 0 and 2
  phraseElement.innerText = phrases[randomIndex];
}

function populateFundingUI(numCalls) {
  let numCallsElement = document.getElementById('numCalls');
  let funding_bar = document.getElementById('funding_bar');
  if(numCalls != undefined) {
    numCallsElement.innerText = numCalls;
    //1200 calls would fill the funding bar to 100%
    // let widthPercentage = 1800;
    let widthPercentage = (numCalls / 1200) * 100;
    funding_bar.setAttribute('style', `width: ${widthPercentage}%`);
    if(widthPercentage > 100) {
      funding_bar.setAttribute('style', `width: ${100}%`);
    }

    if(widthPercentage > 50) {
      funding_bar.setAttribute('class', 'high_funding');
    } else if(widthPercentage > 30) {
      funding_bar.setAttribute('class', 'medium_funding');
    } else {
      funding_bar.setAttribute('class', 'low_funding');
    }
  } else {
    numCallsElement.innerText = '0';
    funding_bar.setAttribute('style', `width: ${1}%`);
    funding_bar.setAttribute('style', `background-color: red`)
  }
}
