'use strict';

/* Services */
Lantern.factory('UsersService', ['ApiRest', 'Session', '$q',
  function(ApiRest, Session, $q) {
    let service = {};
    service.searchUser = function(params, successCallback, errorCallback) {
      ApiRest.get('/users/search2', params, function(products) {
        return successCallback(products)
      }, function(error) {
        return errorCallback(error);
      });
    };
    
    service.updateParameter = function(params, successCallback, errorCallback) {
      ApiRest.put('/users/update', {}, params, function(products) {
        return successCallback(products)
      }, function(error) {
        return errorCallback(error)
      })
    }
      
    return service;
  }
]);
