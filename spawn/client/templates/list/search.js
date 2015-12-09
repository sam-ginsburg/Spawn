// reactive data for search results and checkboxes
searchResults = {
    keys: {"results" : null,
          "hostFilter": true,
          "eventNameFilter": true,
          "descriptionFilter": true,
          "hostSort": false,
          "eventNameSort": false,
          "capacitySort": false,
          "timeUntilSort": true,
          "distanceSort": false,
          "direction": true},
    deps: {"results": new Deps.Dependency},
    get: function (key) {
      this.ensureDeps(key);
      this.deps[key].depend();
      return this.keys[key];
    },
    set: function (key, value) {
      this.ensureDeps(key);
      this.keys[key] = value;
      this.deps[key].changed();
    },
    ensureDeps: function (key) {
      if (!this.deps[key])
        this.deps[key] = new Deps.Dependency;
    }
};

// performs the search
var searching = function(text) {
    var f = [];
    var latLng = Geolocation.latLng();
        // populate search fields
        if(searchResults.get("hostFilter")) {
            f.push('host');
        } else {
            var i = f.indexOf('host');
            if(i > -1) f.splice(i, 1);
        }
        if(searchResults.get("eventNameFilter")) {
            f.push('name');
        } else {
            var i = f.indexOf('name');
            if(i > -1) f.splice(i, 1);
        }
        if(searchResults.get("descriptionFilter")) {
            f.push('description');
        } else {
            var i = f.indexOf('description');
            if(i > -1) f.splice(i, 1);
        }
        
        if(f.length==0) {
            f = ['host', 'name', 'description'];
        }
    
        // figure out how to sort
        var s = []
        if(searchResults.get("hostSort"))   s=['host'];
        if(searchResults.get("eventNameSort"))   s=['name'];
        if(searchResults.get("capacitySort"))   s=['numParticipants'];
        if(searchResults.get("timeUntilSort"))   s=['timeU'];
        if(searchResults.get("distanceSort"))   s=['locationLatLng'];
    
        // direction of sorting
        var d = 1;
        if(!searchResults.get("direction")) { 
            d = -1;
            s.push('desc');
        }
        
        // make new search index  
        if(s[0] != 'locationLatLng') {
            TasksIndex = new EasySearch.Index({
                collection: Tasks,
                fields: f,
                engine: new EasySearch.Minimongo({
                    sort: function() {
                        return [s]
                    }
                })
            });
        }
        else {
            TasksIndex = new EasySearch.Index({
                collection: Tasks,
                fields: f,
                engine: new EasySearch.Minimongo({
                    sort: function() {
                
                    }
                })
            });
        }
        
        // perform the search
        var searchTerm = text;
        if(searchTerm.trim().length == 0) {
            if(s[0] == 'host') 
                searchResults.set("results", Tasks.find({}, {sort: {host: d}}));
            if(s[0] == 'name') 
                searchResults.set("results", Tasks.find({}, {sort: {name: d}}));
            if(s[0] == 'numParticipants') 
                searchResults.set("results", Tasks.find({}, {sort: {numParticipants: d}}));
            if(s[0] == 'timeU') 
                searchResults.set("results", Tasks.find({}, {sort: {timeU: d}}));
            if(s[0] == 'locationLatLong') {
                console.log("here");
                var localTasks = new Mongo.Collection("localtasks");
                localTasks = Tasks;
                localTasks.forEach(function(ltask) {
                    console.log("oyoo");
                    var miles;
                    if (latLng && this.locationLatLng) {
                            var meters = google.maps.geometry.spherical.computeDistanceBetween(
                                new google.maps.LatLng(this.locationLatLng.lat, this.locationLatLng.lng),
                                new google.maps.LatLng(latLng.lat, latLng.lng));
                            miles = parseFloat(Math.round((meters * 0.000621371192) * 100) / 100).toFixed(1);
                        ltasks.update({}, {$set :
                                        {localDistance : miles}})
                    }
                })
                searchResults.set("results", localTasks.find({}, {sort: {localDistance: d}}));
            }
        }
        else {
            searchResults.set("results", TasksIndex.search(searchTerm).mongoCursor);
        }
}

Template.search.events({
    "keyup #searchTerm" : _.throttle(function(event) {
        searching(event.target.value);
    }),
    
    "click #hostFilter" : function(event) {
        if($(event.target).is(':checked')) {searchResults.set("hostFilter", true);}
        else {searchResults.set("hostFilter", false);}
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #eventNameFilter" : function(event) {
        if($(event.target).is(':checked')) searchResults.set("eventNameFilter", true);
        else searchResults.set("eventNameFilter", false);
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #descriptionFilter" : function(event) {
        if($(event.target).is(':checked')) searchResults.set("descriptionFilter", true);
        else searchResults.set("descriptionFilter", false);
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #hostRadio" : function(event) {
        searchResults.set("hostSort", true);
        searchResults.set("eventNameSort", false);
        searchResults.set("capacitySort", false);
        searchResults.set("timeUntilSort", false);
        searchResults.set("distanceSort", false);
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #eventNameRadio" : function(event) {
        searchResults.set("hostSort", false);
        searchResults.set("eventNameSort", true);
        searchResults.set("capacitySort", false);
        searchResults.set("timeUntilSort", false);
        searchResults.set("distanceSort", false);
        searching(document.getElementById("searchTerm").value);
    },
                       
    "click #capacityRadio" : function(event) {
        searchResults.set("hostSort", false);
        searchResults.set("eventNameSort", false);
        searchResults.set("capacitySort", true);
        searchResults.set("timeUntilSort", false);
        searchResults.set("distanceSort", false);
        searching(document.getElementById("searchTerm").value);
    },

    "click #timeUntilRadio" : function(event) {
        searchResults.set("hostSort", false);
        searchResults.set("eventNameSort", false);
        searchResults.set("capacitySort", false);
        searchResults.set("timeUntilSort", true);
        searchResults.set("distanceSort", false);
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #distanceRadio" : function(event) {
        searchResults.set("hostSort", false);
        searchResults.set("eventNameSort", false);
        searchResults.set("capacitySort", false);
        searchResults.set("timeUntilSort", false);
        searchResults.set("distanceSort", true);
        console.log("distance");
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #ascendingRadio" : function(event) {
        searchResults.set("direction", true);
        searching(document.getElementById("searchTerm").value);
    },
    
    "click #descendingRadio" : function(event) {
        searchResults.set("direction", false);
        searching(document.getElementById("searchTerm").value);
    }
});

Template.search.onRendered(function() {
        // update checkbox field values in reactive var
        if($(document.getElementById("hostFilter")).is(':checked')) searchResults.set("hostFilter", true);
        else searchResults.set("hostFilter", false);

        if($(document.getElementById("eventNameFilter")).is(':checked')) searchResults.set("eventNameFilter", true);
        else searchResults.set("eventNameFilter", false);

        if($(document.getElementById("descriptionFilter")).is(':checked')) searchResults.set("descriptionFilter", true);
        else searchResults.set("descriptionFilter", false);
    
        searchResults.set("hostSort", false);
        searchResults.set("eventNameSort", false);
        searchResults.set("capacitySort", false);
        searchResults.set("timeUntilSort", true);
        searchResults.set("distanceSort", false);
    
        searchResults.set("direction", true);
        searching(document.getElementById("searchTerm").value);       
});

Template.search.helpers({
    results: function() {
        /*if(searchResults.get("results") == null) {
            searchResults.set("results", Tasks.find({}, {sort: {timeU: 1}}));
        }*/
        return searchResults.get("results");
    },
    
    noResults: function() {
        return searchResults.get("results") == null;
    }
});