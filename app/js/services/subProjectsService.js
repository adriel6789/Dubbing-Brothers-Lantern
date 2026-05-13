'use strict';

/* Services */
Lantern.factory('SubProjectsService', ['ApiRest', 'Session',
  function(ApiRest, Session) {
    var service = {};
    service.getSubProjects = function(params, successCallback, errorCallback) {
      ApiRest.get('/subprojects/'+params.id, {}, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.getProducts = function(params, successCallback, errorCallback) {
      ApiRest.get('/subprojects/'+params.id+'/products', {}, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    }

    // subproject name
    // if serie only
    service.getName = function (subproject) {
      let nameFound = null
      if (subproject.name == 'serie') {
        nameFound = 'S ' + subproject.season
      }
      return nameFound
    }
    return service;
  }
]);
