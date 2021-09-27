/*global chrome, Object, alert */
var BionomiaBackground = (function($, window, document) {

  "use strict";

  var _private = {

    vars: {
      gbifID: 0
    },

    receiveMessages: function() {
      var self = this;

      chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.method) {

          case 'bn_gbifID':
            chrome.tabs.query({active : true, currentWindow : true}, function(tab) {
              tab = tab[0];
              $.ajax({
                type: "GET",
                url: "https://bionomia.net/occurrence/" + request.params.gbifID + ".jsonld",
                dataType: "json"
              }).done(function(data) {
                chrome.tabs.sendMessage(tab.id, { method : "bn_occurrence", params : { data: data } });
                sendResponse({});
                return true;
              })
              .fail(function(data) {
                chrome.tabs.sendMessage(tab.id, { method : "bn_occurrence", params : { data: { message: "error"} } });
                sendResponse({});
                return true;
              });
            });
          break;

          case 'bn_gbifDatasetKey':
            chrome.tabs.query({active : true, currentWindow : true}, function(tab) {
              tab = tab[0];
              $.ajax({
                type: "GET",
                url: "https://bionomia.net/dataset/" + request.params.gbifDatasetKey + ".json",
                dataType: "json"
              }).done(function(data) {
                chrome.tabs.sendMessage(tab.id, { method : "bn_dataset", params : { data: data } });
                sendResponse({});
                return true;
              })
              .fail(function(data) {
                chrome.tabs.sendMessage(tab.id, { method : "bn_dataset", params : { data: { message: "error"} } });
                sendResponse({});
                return true;
              });
            });
          break;

          default:
            sendResponse({});
            return true;
        }
        return true;
      });
    }

  };

  return {
    init: function() {
      _private.receiveMessages();
    }
  };

}(jQuery, window, document));

$(function() {
  BionomiaBackground.init();
  chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    chrome.tabs.sendMessage(details.tabId, { method : "bn_flush" });
  });
});
