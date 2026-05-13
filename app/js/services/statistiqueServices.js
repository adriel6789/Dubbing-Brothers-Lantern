'use strict';

/* Services */
Lantern.factory('StatistiqueService', ['ApiRest', 'Session', 'Comment', '$q',
  function(ApiRest, Session, Comment, $q) {
    let service = {};

      /**
       * Get stats and allows the use of deferred promise
       * @returns {*} : deferred promise
       */
    service.getStats = function () {
      let branchId = 1
      branchId = Session.branchId()     
        let deferred = $q.defer();
        ApiRest.get('/requests/stats', null, function(response) {
            if(response.error) {
                deferred.reject(response.error);
            }
            deferred.resolve(response);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    // 20210420, pour mise en prod sans perturbation
    service.getStatsWithBranch = function () {
      let branchId = 1
      branchId = Session.branchId()     
        let deferred = $q.defer();
        ApiRest.get('/requests/stats/' + branchId, null, function(response) {
            if(response.error) {
                deferred.reject(response.error);
            }
            deferred.resolve(response);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }    

    return service;
  }
]);
