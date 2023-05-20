/*global chrome, Object, alert*/

var Bionomia = (function($, window, document) {

  "use strict";

  var _private = {

    vars: {
      gbifIdentifier: 0,
      recorded: "",
      identified: "",
      cited: "",
      people: "",
      timeout: 125,
    },

    setDefaults: function() {
      SVGInject.setOptions({
        useCache: true,
        beforeInject: function(img, svg) {
          var hasPeople = true
          $.each(svg.querySelectorAll('text'), function() {
            if (this.textContent === "404 not found") {
              hasPeople = false;
            }
          });
          if (hasPeople) {
            return svg;
          } else {
            return document.createElement("span");
          }
        }
      });
    },

    receiveMessages: function() {
      var self = this, checkExist;

      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

        switch(request.method) {

          case 'bn_flush':
            self.flushVars();
            self.setGBIFidentifier(self.getGBIFidentifier());
            self.createDatasetBadge();
            self.sendMessage();
          break;

          case 'bn_occurrence':
            $.each(request.params.data.recorded, function() {
              self.vars.recorded += "<p>";
              self.vars.recorded += self.makeName(this);
              self.vars.recorded += "</p>";
            });
            $.each(request.params.data.identified, function() {
              self.vars.identified += "<p>";
              self.vars.identified += self.makeName(this);
              self.vars.identified += "</p>";
            });
            $.each(request.params.data.associatedReferences, function() {
              self.vars.cited += self.makeCited(this);
            });
            self.createOccurrence();
          break;

        }
        sendResponse({});
        return true;
      });
    },

    flushVars: function() {
      this.vars.gbifIdentifier = 0;
      this.vars.recorded = "";
      this.vars.identified = "";
      this.vars.cited = "";
      this.vars.people = "";
    },

    getGBIFidentifier: function() {
      var path = window.location.pathname,
          identifier = /(?:dataset|occurrence)\/(.+?)(?:\/|$)/;

      try {
        return path.match(identifier)[1];
      } catch(err) {
        return;
      }
    },

    setGBIFidentifier: function(id) {
      this.vars.gbifIdentifier = id;
    },

    createDatasetBadge: function() {
      var self = this, uuid_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i, checkExist = "";

      if (this.vars.gbifIdentifier.match(uuid_pattern)) {
        checkExist = setInterval(function() {
          if ($('.bn-dataset').length === 0) {
            self.makeDatasetBadgeHTML();
          } else {
            clearInterval(checkExist);
          }
        }, this.vars.timeout);
      }
    },

    makeDatasetBadgeHTML: function() {
      var html = "<div class=\"bn-dataset\">" +
                  "<a href=\"https://bionomia.net/dataset/" + this.vars.gbifIdentifier + "\">" +
                    "<img src=\"https://api.bionomia.net/dataset/" + this.vars.gbifIdentifier + "/badge.svg\" class=\"bn-badge\" alt=\"Bionomia dataset badge\" width=\"210\" height=\"20\">" +
                  "</a>" +
                "</div>";
      $("header").append(html);
      if ($(".bn-badge").length > 0) {
        SVGInject($(".bn-badge")[0]);
      }
    },

    makeName: function(data) {
      var response = "";
      response += data.name;
      if (data["sameAs"].includes("Q")) {
        response += " <img src=\"" + chrome.runtime.getURL("images/wikidata_16x16.png") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      } else {
        response += " <img src=\"" + chrome.runtime.getURL("images/orcid_16x16.gif") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      }
      response += " <a href=\"" + data["sameAs"] + "\">" + data["sameAs"] + "</a><br>";
      return response;
    },

    makeCited: function(data) {
      var citation = data["description"] ? data["description"] : "";
      return "<p class=\"bionomia-citation\">" + citation + " <a href=\"" + data["@id"] + "\">" + data["@id"] + "</a></p>";
    },

    createOccurrence: function() {
      var self = this, checkExist = "";

      if ($.isNumeric(this.vars.gbifIdentifier)) {
        checkExist = setInterval(function() {
          if ($('.bn-attribution').length === 0) {
            self.makeOccurrenceHTML();
          } else {
            clearInterval(checkExist);
          }
        }, this.vars.timeout);
      }
    },

    makeOccurrenceHTML: function() {
      var title = "";
      if (this.vars.recorded) {
        title = chrome.i18n.getMessage("collected_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.recorded + "</div>");
      }
      if (this.vars.identified) {
        title = chrome.i18n.getMessage("identified_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.identified + "</div>");
      }
      if (this.vars.cited) {
        title = chrome.i18n.getMessage("cited_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.cited + "</div>");
      }
    },

    sendMessage: function() {
      var self = this,
          message = {};
      if (self.vars.gbifIdentifier !== 0 && $.isNumeric(self.vars.gbifIdentifier)) {
        message = { gbifID : self.vars.gbifIdentifier };
        chrome.runtime.sendMessage({ method : "bn_gbifID", params : message });
      }
    }

  };

  return {
    init: function() {
      var self = _private;
      _private.setDefaults();
      _private.receiveMessages();
      _private.setGBIFidentifier(_private.getGBIFidentifier());
      _private.createDatasetBadge();
      _private.sendMessage();
    }
  };

}(jQuery, window, document));

$(function() {
  Bionomia.init();
});
