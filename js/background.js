chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.method) {

    case 'bn_gbifID':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        fetch("https://api.bionomia.net/occurrence/" + request.params.gbifID + ".jsonld")
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            chrome.tabs.sendMessage(tabs[0].id, { method : "bn_occurrence", params : { data: data } });
            sendResponse();
          })
          .catch((error) => {
            chrome.tabs.sendMessage(tabs[0].id, { method : "bn_occurrence", params : { data: { message: "error"} } });
            sendResponse();
          });
      });
    break;

    default:
      sendResponse({});
  }
  return true;
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  chrome.tabs.sendMessage(details.tabId, { method : "bn_flush" });
});
