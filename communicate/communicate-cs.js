console.log("communicate-cs");
console.log(document.readyState);

function handleMessages(message, sender, sendResponse) {
  // message, sender, sendResponse are all <unavailable>|
  console.log("cs handleMessages gets", message, sender, sendResponse);
  sendResponse({type: "response",
		sender: sender,
		original: message});
  // return true from the event listener to indicate you wish to
  // send a response asynchronously (this will keep the message
  // channel open to the other end until sendResponse is called).
  // See https://developer.chrome.com/extensions/runtime#event-onMessage
  return true;
}

chrome.runtime.onMessage.addListener(handleMessages);

document.addEventListener('readystatechange', function(event) {
  if (event.target.readyState == 'complete') {
    console.log(document.readyState);
    var div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "5%";
    div.style.left = "10%";
    div.style.opacity = 0.85;
    var divClose = document.createElement("div");
    var a = document.createElement("a");
    a.href = "CloseUI";
    a.innerHTML = "&times;";
    a.addEventListener("click", function (event) {
      event.preventDefault();
      div.parentElement.removeChild(div);
    });
    var h2 = document.createElement("h2");
    var name = document.createElement("span");
    var version = document.createElement("span");
    name.style.margin = version.style.padding = "1em";
    h2.appendChild(a);
    h2.appendChild(name);
    h2.appendChild(version);
    var radios;
    var sel = document.createElement("select");
    [
      "background",
      "browser",
      "id",
      "manifest",
      "my-page",
      "package",
      "platform",
      "tabs",
      "views",
      // "package",
      // "platform",
      // not implemented in Firefox
    ].forEach(function (type) {
      var opt = document.createElement("option");
      opt.textContent = type;
      opt.value = type;
      sel.appendChild(opt);
    });
    var pre = document.createElement("pre");
    sel.addEventListener('change', function (event) {
      chrome.runtime.sendMessage({
	"selection": window.getSelection().toString(),
	"type": event.target.value
      }, function(response) {
	console.log((new Error).stack.split(/\n/)[0] + " got response from bg");
	if ("manifest" in response) {
	  name.textContent = response.manifest.name;
	  version.textContent = response.manifest.version;
	}
	else if (!name.textContent.length && "id" in response) {
	  // encodeURIComponent is not available in content script:
	  // div.id = window.encodeURIComponent(response.id);
	  // div.id = window.btoa(response.id);
	  name.textContent = response.id;
	}
    let seen = []; 
    var replacer = function(key, value) {
      if (value != null && typeof value == "object") {
        if (seen.indexOf(value) >= 0) {
          return;
        }
        seen.push(value);
      }
      return value;
    };
	// pre.textContent = JSON.stringify(response, replacer, 2);
	pre.textContent = JSON.stringify(response, null, 2);
	// pre.textContent = response;
      });
    });
    pre.style.position = "fixed";
    pre.style.backgroundColor = "white";
    pre.style.maxWidth = "85%";
    pre.style.maxHeight = "75%";
    pre.style.overflow = "auto";
    // pre.textContent = JSON.stringify(response, null, 2);
    div.appendChild(h2);
    div.appendChild(sel);
    div.appendChild(pre);
    document.body.appendChild(div);
  }
});
