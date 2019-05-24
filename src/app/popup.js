// let changeColor = document.getElementById('changeColor');

// chrome.storage.sync.get('color', function(data) {
//   changeColor.style.backgroundColor = data.color;
//   changeColor.setAttribute('value', data.color);
// });

// changeColor.onclick = function(element) {
//   let color = element.target.value;
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.executeScript(
//         tabs[0].id,
//         {code: 'document.body.style.backgroundColor = "' + color + '";'});
//   });
// };


let callButton = document.getElementById('nope');
let phoneElement = document.getElementById('phone');

callButton.onclick = function(element) {
  let phoneNumber = phoneElement.value;
  axios.get('http://localhost:8080/', {})
    .then(function() {
      console.log("call sent successfully");

      //TODO: update number of calls locally 
    });
}