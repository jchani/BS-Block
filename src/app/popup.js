window.addEventListener("load", initial, false);
let isDevMode;
let phoneNum; 
chrome.management.getSelf(x => {if(x.installType == 'development') {isDevMode = true}});

let activateButton = document.getElementById('activate');
let validateButton = document.getElementById('validate');; // will instantiate in 2nd step
let callButton = document.getElementById('nope'); //will instantiate in 3rd step
let phoneElement = document.getElementById('phone');
let updateButton = document.getElementById('update');

function initial() {
  console.log(`initial is being reached`);
  chrome.storage.sync.get(["BsBlock_phone"], function(response1) {
    chrome.storage.sync.get(["BsBlock_token"], function(response2) {
      if(response1.BsBlock_phone && response2.BsBlock_token) { //check if phone number has been validated
        console.log(`auth passed`);
        document.getElementById('authenticate_popup').setAttribute('class', 'hidden');
        document.getElementById('main_popup').classList.remove('hidden');
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
  let code = document.getElementById('code').value;

  if(code) {
    axios.get(`http://localhost:8080/validate?code=${code}&phone=${phoneNum}`, {}).then(response => {
      //use chrome.storage to store phone number and access token
      chrome.storage.sync.set({["BsBlock_phone"]: phoneNum});  
      chrome.storage.sync.set({["BsBlock_token"]: code});
      document.getElementById('authenticate_popup').setAttribute('class', 'hidden');
      document.getElementById('main_popup').classList.remove('hidden');
      populateData();
    }).catch(response => {
      console.log(response);
    });


  }
}

// --- MAIN POPUP FUNCTIONALITY ---
callButton.onclick = function(element) {
  let phoneNumber = phoneElement.value;
  axios.get('http://localhost:8080/', {})
    .then(response => {
      console.log("call sent successfully");

      //TODO: update number of calls locally 
    });
}


callButton.onclick = function(element) {
  chrome.storage.sync.get(["BsBlock_phone"], function(response1) {
    chrome.storage.sync.get(["BsBlock_token"], function(response2) {
      if(response1.BsBlock_phone && response2.BsBlock_token) { 
        //Put phone number and access token in header 
        axios.get('http://localhost:8080/call', {})
        .then(response => {
          console.log("call sent successfully");
        });
      }
    });
  });
}

updateButton.onclick = function(element) {
  initial();
}


function populateData() {
  let phoneNumber = '9093446762';

  axios.get(`http://localhost:8080/balance/`, {})
  .then(response => {
    let numCallsElement = document.getElementById('numCalls');
    let funding_bar = document.getElementById('funding_bar');
    let numCalls = response.data;
    if(numCalls != undefined) {
      numCallsElement.innerText = numCalls + ` calls left until this runs out of funding.`;
      //1200 calls would fill the funding bar to 100%
      let widthPercentage = 1800;
      //let widthPercentage = (numCalls / 1200) * 100;
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
  });

  axios.get(`http://localhost:8080/users/${phoneNumber}`, {})
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
}