chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTimerDisplay') {
      const displayElement = document.getElementById("display");
      if (displayElement) {
          displayElement.textContent = message.timerText;
      }
  } else if (message.action === 'updateWebsiteDisplay') {
      const websiteElement = document.getElementById("website");
      if (websiteElement) {
          websiteElement.textContent = message.websiteText;
      }
  }
});

//time to a format of hours, minutes, and seconds
function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  //minutes only if more than 0 hours or after the first 60 seconds
  if (hh > 0 || ss >= 60) {
      return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  } else {
      return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  }
}

//variables
let startTime;
let elapsedTime = 0;
let timerInterval;
let lastTabSwitchTime = Date.now();

//function to modify innerHTML
function print(txt) {
  chrome.runtime.sendMessage({ action: 'updateTimerDisplay', timerText: txt });
}

//"start" function
function start() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function () {
      elapsedTime = Date.now() - startTime;
      print(timeToString(elapsedTime));
      chrome.storage.local.set({ startTime: startTime, elapsedTime: elapsedTime });
  }, 10);
}

//"reset" function
function reset() {
  clearInterval(timerInterval);
  elapsedTime = 0;
  print("00:00:00");
  chrome.storage.local.remove(["startTime", "elapsedTime"]);
}

//timer state and start the timer
chrome.storage.local.get(["startTime", "elapsedTime"], result => {
  if (result.startTime && result.elapsedTime) {
      startTime = result.startTime;
      elapsedTime = result.elapsedTime;
      start();
  }
});

//tab switch event to reset the timer
chrome.tabs.onActivated.addListener(activeInfo => {
  const currentTime = Date.now();
  const elapsedTimeSinceLastSwitch = currentTime - lastTabSwitchTime;
  lastTabSwitchTime = currentTime;
  reset(); // Reset the timer
  elapsedTime = elapsedTimeSinceLastSwitch; // Start the timer from when the tab was switched
  start(); // Start the timer for the new tab
});

//web navigation completed event to reset the timer
chrome.webNavigation.onCompleted.addListener(details => {
  // Only reset the timer if the navigation occurs in the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length && tabs[0].id === details.tabId) {
          reset(); // Reset the timer
          start(); // Start the timer for the new website
      }
  });
});


chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  const currentTab = tabs[0];
  if (currentTab) {
    const { url } = currentTab;
    document.getElementById("website").textContent = `${url}`;
  }
});

//elapsed time to seconds and update badge text
function updateBadgeText() {
  const seconds = Math.floor(elapsedTime / 1000);
  chrome.action.setBadgeText({ text: seconds.toString() });
}

// Start the timer when the extension popup is opened
start();

// Update badge text every second
setInterval(updateBadgeText, 1000);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setTimeLimit') {
      setTimeout(() => {
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
              if (tabs.length > 0) {
                  chrome.tabs.remove(tabs[0].id);
              }
          });
      }, message.timeLimit);
  }
});

chrome.runtime.onInstalled.addListener(function () {
  // Initialize restricted sites list
  chrome.storage.local.set({ restrictedSites: [] });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'getRestrictedSites') {
      chrome.storage.local.get({ restrictedSites: [] }, function (result) {
          sendResponse({ restrictedSites: result.restrictedSites });
      });
      // Return true to indicate that sendResponse will be called asynchronously
      return true;
  }
});
