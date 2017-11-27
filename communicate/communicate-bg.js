console.log(chrome.runtime.id + " bg");

function handleMessages(message, sender, sendResponse) {
  console.log(chrome.runtime.id + " bg handleMessages");
  console.log("bg handleMessages gets", message, sender, sendResponse);
  switch (message.type) {

  case "background":
    var bg = chrome.extension.getBackgroundPage();
    sendResponse({ selection: message.selection, href: bg && bg.location && bg.location.href });
    break;

  case "browser":
    chrome.runtime.getBrowserInfo(function (browser) {
      sendResponse({ selection: message.selection, browser: browser });
    });
    break;

  case "id":
    sendResponse({ selection: message.selection, id: chrome.runtime.id});
    break;

  case "manifest":
    sendResponse({ selection: message.selection, manifest: chrome.runtime.getManifest()});
    break;

  case "my-page":
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then(tabs => {
      console.log('query active in currentWidow', tabs);
      browser.tabs.create({
        // openerTabId is not supported on Android:
        // Error: Type error for parameter createProperties (Property "openerTabId" is unsupported by Firefox) for tabs.create.
        // Works fine on
        // "platform": {
        //   "os": "linux",
        //   "arch": "x86-64"
        // }
        // openerTabId: tabs[0].id,
        url: chrome.extension.getURL("my-page.html"),
      }).then(tabs => {
        console.log('browser.tabs.create', tabs);
      });
    })
    break;

  case "package":
    if ('getPackageDirectoryEntry' in chrome.runtime) {
      chrome.runtime.getPackageDirectoryEntry().then(function (dir) {
        sendResponse({ selection: message.selection, package: dir });
      });
    }
    else {
      sendResponse({ selection: message.selection, package: 'chrome.runtime.getPackageDirectoryEntry() not implemented yet' });
    }
    break;

  case "platform":
    chrome.runtime.getPlatformInfo(function (info) {
      sendResponse({ selection: message.selection, platform: info });
    });
    break;

  case "tabs":
    chrome.tabs.query({currentWindow: true}, function(tabs) {
      sendResponse({ selection: message.selection, tabs: tabs });
    });
    break;

  case "views": {
    let seen = []; 
    var replacer = function(key, value) {
      if (value != null && typeof value == "object") {
        if (seen.indexOf(value) >= 0) {
          return `${key} is a cyclic ${value.constructor.name} reference`;
        }
        seen.push(value);
      }
      if (value != null) {
        return value;
      }
    };
    let views = chrome.extension.getViews();
    // Remove cyclic references, then convert back to object since content script stringifies response again.
    sendResponse({ selection: message.selection, length: views.length, views: JSON.parse(JSON.stringify(views, replacer, 2))});
  }
    break;

  default:
    sendResponse({ selection: message.selection, type: "default"});
    break;
  }
  // return true from the event listener to indicate you wish to
  // send a response asynchronously (this will keep the message
  // channel open to the other end until sendResponse is called).
  // See https://developer.chrome.com/extensions/runtime#event-onMessage
  return true;
}

chrome.runtime.onMessage.addListener(handleMessages);

// Only for testing purposes. Disable/Enable Add-ons to initiate this
chrome.tabs.query({currentWindow: true/*, active: true*/}, function(tabs) {
  tabs.forEach(function (tab) {
    console.log("bg sends to tab.id " + tab.id);
    chrome.tabs.sendMessage(tab.id,
                            {"type": "ping-from-bg"}, function(response) {
                              console.log("response from cs in tab " + tab.id, response);
                            });
  });
});
