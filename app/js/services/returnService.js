'use strict';

/* Services */
Lantern.factory('ReturnService', ['ApiRest', 'Session', 'Return',
  function(ApiRest, Session, Return) {
    const service = {};
    service.getQueryBy = function(type, params, successCallback, errorCallback) {
      ApiRest.get('/requests/'+type, params, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    }


    service.getReturnsBy = function(params, successCallback, errorCallback) {
      ApiRest.get('/returns/returnsby', params, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getAllReturnsForAProduct = function(data, successCallback, errorCallback) {
      ApiRest.post('/returns/all', {}, data, function(response) {
       return successCallback(response)
      }, function(error) {
        return errorCallback(error)
      })
    }

    // calld from suiviProd
    service.getAllReturnsQCByRequests = function(data, successCallback, errorCallback) {
      ApiRest.post('/returns/qcinfos/productswithqc', {}, data, function(response) {
       return successCallback(response)
      }, function(error) {
        return errorCallback(error)
      })
    }

    service.postNewQcReturn = function(data, successCallback, errorCallback) {
      ApiRest.post('/returns/create/qc/', {}, data, function(response) {
       return successCallback(response)
      }, function(error) {
        return errorCallback(error)
      })
    }


    service.doNothing = function(returns, action_id) {
      angular.forEach(returns, function(aReturn) {
        aReturn.action_id = action_id
        if (aReturn.is_ignored == 0) {
          aReturn.is_ignored = false;
        }
        var newReturn = new Return();
        newReturn.is_ignored = !aReturn.is_ignored;
        newReturn.is_sent = 0;
        newReturn.to_mix = 0;
        newReturn.is_resolved = 0;
        newReturn.is_not_done = 0;
        newReturn.to_review = 0;
        newReturn.$update({
          value: {"id": aReturn.id, "action_id": aReturn.action_id}
        }, function(ret) {
          aReturn.is_ignored = !aReturn.is_ignored;
          aReturn.is_sent = 0;
          aReturn.to_mix = 0;
          aReturn.is_resolved = 0;
          aReturn.is_not_done = 0;
          aReturn.to_review = 0;
          aReturn.action_id = ret.action_id
        });
      });
    };

    service.doResolve = function(returns, action_id) {
      angular.forEach(returns, function(aReturn) {
        aReturn.action_id = action_id
        if (aReturn.is_resolved == 0) {
          aReturn.is_resolved = false;
        }
        var newReturn = new Return();
        newReturn.is_resolved = !aReturn.is_resolved;
        newReturn.is_ignored = 0;
        newReturn.to_mix = 0;
        newReturn.is_not_done = 0;
        newReturn.to_review = 0;
        newReturn.$update({
          value: {"id": aReturn.id, "action_id": aReturn.action_id}
        }, function(ret) {
          aReturn.is_resolved = !aReturn.is_resolved;
          aReturn.is_ignored = 0;
          aReturn.to_mix = 0;
          aReturn.is_not_done = 0;
          aReturn.to_review = 0;
          aReturn.action_id = ret.action_id
        });
      });
    };

    service.toMix = function(returns, action_id) {
      angular.forEach(returns, function(aReturn) {
        aReturn.action_id = action_id
        if (aReturn.to_mix == 0) {
          aReturn.to_mix = false;
        }
        let newReturn = new Return();
        newReturn.to_mix = !aReturn.to_mix;
        newReturn.is_ignored = 0;
        newReturn.is_resolved = 0;
        newReturn.is_not_done = 0;
        newReturn.to_review = 0;
        newReturn.$update({
          value: {"id": aReturn.id, "action_id": aReturn.action_id}
        }, function(ret) {
          aReturn.to_mix = !aReturn.to_mix;
          aReturn.is_ignored = 0;
          aReturn.is_resolved = 0;
          aReturn.is_not_done = 0;
          aReturn.to_review = 0;
          aReturn.action_id = ret.action_id
        });
      });
    };

    service.notDone = function(returns, action_id) {
      angular.forEach(returns, function(aReturn) {
        aReturn.action_id = action_id
        if (aReturn.is_not_done == 0) {
          aReturn.is_not_done = false;
        }
        let newReturn = new Return();
        newReturn.is_not_done = !aReturn.is_not_done;
        newReturn.is_ignored = 0;
        newReturn.is_resolved = 0;
        newReturn.to_mix = 0;
        newReturn.to_review = 0
        newReturn.$update({
          value: {"id": aReturn.id, "action_id": aReturn.action_id}
        }, function(ret) {
          aReturn.is_not_done = !aReturn.is_not_done;
          aReturn.is_ignored = 0;
          aReturn.is_resolved = 0;
          aReturn.to_mix = 0;
          aReturn.to_review = 0;
          aReturn.action_id = ret.action_id
        });
      });
    };

    service.toReview = function(returns, action_id) {
      angular.forEach(returns, function(aReturn) {
        aReturn.action_id = action_id
        if (aReturn.to_review == 0) {
          aReturn.to_review = false;
        }
        var newReturn = new Return();
        newReturn.to_review = !aReturn.to_review;
        newReturn.is_ignored = 0;
        newReturn.is_resolved = 0;
        newReturn.to_mix = 0;
        newReturn.is_not_done = 0;
        newReturn.$update({
          value: {"id": aReturn.id, "action_id": aReturn.action_id}
        }, function(ret) {
          aReturn.to_review = !aReturn.to_review;
          aReturn.is_ignored = 0;
          aReturn.is_resolved = 0;
          aReturn.to_mix = 0;
          aReturn.is_not_done = 0;
          aReturn.action_id = ret.action_id
        });
      });
    };


    // QC

    return service;
  }
]);
