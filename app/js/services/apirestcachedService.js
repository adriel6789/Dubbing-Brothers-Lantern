Lantern
  .service('ApiRestCached', ['ApiRest',
    function(ApiRest) {
      var requestsdemands = null;

      var service = {};

      service.getRequestsDemands = function(params, callbackSuccess, callbackError) {
        if (requestsdemands) {
          callbackSuccess(requestsdemands);
        } else {
          ApiRest.get('/requestdemands', params,
            function(response) {
              requestsdemands = response;
              callbackSuccess(requestsdemands);
            },
            function(fail) {
              callbackError(fail);
            });
        }
      };

      service.resetAccountInfos = function() {
        accountinfos = null;
      };

      service.resetCountriesGroup = function() {
        countriesGroup = null;
      };

      service.resetAccountInfos = function() {
        accountinfos = null;
      };

      service.resetAll = function() {
        this.resetAccountInfos();
      };

      return service;
    }
  ]);
