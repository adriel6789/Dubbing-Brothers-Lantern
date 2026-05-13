'use strict';

/* Services */
Lantern.factory('AttachmentsService', ['ApiRest', 'Session',
  function(ApiRest, Session) {
    var service = {};
    service.getQueryBy = function(type, params, successCallback, errorCallback) {
      ApiRest.get('/attachments/' + type, params, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    };

    return service;
  }
]);