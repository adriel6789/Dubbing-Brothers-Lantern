'use strict';

/* Services */
Lantern.factory('ContextInfoService', ['ApiRest', 'Session',
  function(ApiRest, Session) {
    var service = {};
    service.getQueryBy = function(type, params, successCallback, errorCallback) {
      ApiRest.get('/contextualinfos/' + type, params, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    };

    return service;
  }
]);