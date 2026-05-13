bonsServices
  .service('HttpPendingRequestsService', [
    '$q',
    function($q) {
      var cancelPromises = [];
      var service = {};

      service.newTimeout = function() {
        var cancelPromise = $q.defer();
        cancelPromises.push(cancelPromise);
        return cancelPromise.promise;
      }

      service.cancelAll = function() {
        angular.forEach(cancelPromises, function(cancelPromise) {
          cancelPromise.promise.isGloballyCancelled = true;
          cancelPromise.resolve();
        });
        cancelPromises.length = 0;
      }

      return service;
    }
  ])
  .factory('HttpRequestTimeoutInterceptor', [
    '$q',
    'HttpPendingRequestsService',
    function($q, HttpPendingRequestsService) {
      return {
        request: function(config) {
          config = config || {};
          if (config.timeout == -1) {
            config.timeout = HttpPendingRequestsService.newTimeout();
          }
          return config;
        },
        responseError: function(response) {
          if (response.config.timeout && response.config.timeout.isGloballyCancelled) {
            return $q.defer().promise;
          }
          return $q.reject(response);
        }
      }
    }
  ])
  .config(['$httpProvider',
    function($httpProvider) {
      $httpProvider.interceptors.push('HttpRequestTimeoutInterceptor');
    }
  ])
  .factory('ApiRest', [
    '$http',
    '$timeout',
    '$state',
    '$window',
    'API_CONFIG',
    '$rootScope',
    'Session',
    function($http, $timeout, $state, $window, API_CONFIG, $rootScope, Session) {
      var service = {}
      var token = null
      var async_call = false

      function longPolling(url, iter, callbackSuccess, callbackError) {
        if (iter <= API_CONFIG.maxRetry) {
          $http({
            method: 'GET',
            params: {
              access_token: token
            },
            url: url
          }).then(function(response) {
            responseSuccess(response, iter, callbackSuccess, callbackError);
          }, function(response) {
            responseError(response, callbackSuccess, callbackError);
          });
        } else {
          callbackError();
        }
      }

      function responseSuccess(response, iter, callbackSuccess, callbackError) {
        var limits = {
          count: response.headers('X-RateLimit-Limit'),
          limit: response.headers('X-RateLimit-Remaining'),
          reset: response.headers('X-RateLimit-Reset')
        };
        //$rootScope.$broadcast(EVENTS.rateLimit, limits);

        if (response.status == 202) {
          $timeout(function() {
            iter++;
            longPolling(response.data.url, iter, callbackSuccess, callbackError);
          }, API_CONFIG.pollingInterval);
        } else {
          if (response.data && response.data.paging) {
            if (response.data.paging.next) {
              response.data.paging.next = response.data.paging.next.replace('/v2', '');
            }
            if (response.data.paging.previous) {
              response.data.paging.previous = response.data.paging.previous.replace('/v2', '');
            }
            if (response.data.paging.last) {
              response.data.paging.last = response.data.paging.last.replace('/v2', '');
            }
            if (response.data.paging.self) {
              response.data.paging.self = response.data.paging.self.replace('/v2', '');
            }
          }
          callbackSuccess(response.data);
        }
      }


      function responseError(response, callbackSuccess, callbackError) {
        // $rootScope.$broadcast(EVENTS.rateLimit, limits);
        if (response.status == 403 || response.status == 401) {
          $state.go('logout');
        } else {
          callbackError(response.data);
        }
      }

      function updateToken(key) {
        token = key;
        //$http.defaults.headers.common.Authorization = "Bearer "+key;
      }


      service.get = function(url, params, callbackSuccess, callbackError, loadingBar) {
        if (loadingBar == null) loadingBar = false;
        $http({
          method: 'GET',
          params: params,
          url: API_CONFIG.base + url,
          ignoreLoadingBar: loadingBar,
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId()
          },
            timeout: 0,
        }).then(function(response) {
          responseSuccess(response, 0, callbackSuccess, callbackError);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.getBlob = function(url, params, callbackSuccess, callbackError) {
        $http({
          method: 'GET',
          params: params,
          url: API_CONFIG.base + url,
          timeout: 0,
          responseType: 'blob',
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId()
          },
        }).then(function(response) {
          callbackSuccess(response);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.getExtern = function (url, params, callbackSuccess, callbackError, loadingBar) {
        delete $http.defaults.headers.common['auth-token'];
        specificallyHandleInProgress = true;
        if (loadingBar == null) loadingBar = false;
        $http({
          method: 'GET',
          params: params,
          url: url,
          ignoreLoadingBar: loadingBar,
          timeout: 0
        }).then(function (response) {
          specificallyHandleInProgress = false;
          $http.defaults.headers.common['auth-token'] = Session.token();
            responseSuccess(response, 0, callbackSuccess, callbackError);
          }, function (response) {
            specificallyHandleInProgress = false;
            $http.defaults.headers.common['auth-token'] = Session.token();
            responseError(response, callbackSuccess, callbackError);
        });
      }

      // transform a call with pagination into a get call with no page!
      service.getAllPages = function(url, params, callbackSuccess, callbackError) {
        var concatenedReply = {
          status: 200,
          data: []
        };

        function next(response) {
          if (response.paging) {
            if (response.paging.next) {
              response.paging.next = response.paging.next.replace('/v2', '');
              concatenedReply.data = concatenedReply.data.concat(response.data);
              service.get(response.paging.next, params, next, error);
            } else {
              callbackSuccess(concatenedReply);
            }
          }
        };

        function error(fail) {
          callbackError(fail);
        }
        service.get(url, params, next, error);
      }

      service.post = function(url, params, obj, callbackSuccess, callbackError) {
        $http({
          method: 'POST',
          params: params,
          url: API_CONFIG.base + url,
          data: obj,
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId()
          },
          timeout: -1,
        }).then(function(response) {
          responseSuccess(response, 0, callbackSuccess, callbackError);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.put = function(url, params, obj, callbackSuccess, callbackError) {
        $http({
          method: 'PUT',
          params: params,
          url: API_CONFIG.base + url,
          data: obj,
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId()
          },
          timeout: -1
        }).then(function(response) {
          responseSuccess(response, 0, callbackSuccess, callbackError);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.processFile = function(url, params, obj, callbackSuccess, callbackError) {
        $http({
          method: 'POST',
          params: params,
          url: API_CONFIG.base + url,
          data: {'data': obj},
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId(),
          },
          responseType: 'blob'
        }).then(function(response) {
          var blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          var formattedDate = new Date().toLocaleDateString('en-GB').split('/').join('-');
          link.download = `Audit-${formattedDate}.xlsx`;
          link.click();
          URL.revokeObjectURL(url);
          callbackSuccess(response.data);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.delete = function(url, params, callbackSuccess, callbackError) {
        $http({
          method: 'DELETE',
          params: params,
          headers: {
            'auth-token': Session.token(),
            'app-code': Session.appCode(),
            'branch': Session.branchId()
          },
          url: API_CONFIG.base + url,
          timeout: -1
        }).then(function(response) {
          responseSuccess(response, 0, callbackSuccess, callbackError);
        }, function(response) {
          responseError(response, callbackSuccess, callbackError);
        });
      }

      service.errorMessage = function(code, element) {
        var message = null;
        if (code) {
          switch (code) {
            case 409:
              message = '' + element + ' already exists';
              break;
          }
        };

        return message;
      }

      service.updateToken = function(key) {
        updateToken(key);
      }


      return service;

    }
  ]);
