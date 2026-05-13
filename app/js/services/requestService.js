'use strict';

/* Services */
Lantern.factory('RequestService', ['$rootScope', 'ApiRest', 'Session', 'Comment', '$q', '$filter',
  function ($rootScope, ApiRest, Session, Comment, $q, $filter) {
    let service = {};
      service.getRequestsBy = function(url, params, successCallback, errorCallback) {
          ApiRest.get('/requests'+url, params, function(response) {
              return successCallback(response)
          }, function(error) {
              return errorCallback(error);
          });
      };

    /**
     * recherche des farmers non planifiés pour une liste de requetes
     *
     */
    service.getFarmersToPlan = function (data, successCallback, errorCallback) {

      ApiRest.post('/vrequests/toplan/', null, data, 
      function(response) {
        return successCallback(response)
      }, 
      function(error){
        return errorCallback(error)
      })            
    }

    /**
     * recherche des farmers planifiés pour une liste de requetes
     *
     */
         service.getFarmersPlanned = function (data, successCallback, errorCallback) {

          ApiRest.post('/vrequests/planned/', null, data, 
          function(response) {
            return successCallback(response)
          }, 
          function(error){
            return errorCallback(error)
          })            
        }

      /**
       * get related data to a request
       */
      service.getDataRelatedtoRequest = function (data, successCallback, errorCallback) {
        ApiRest.get('/requests/related/' + data.id, null, function(response) {
          return successCallback(response)
        }, function(error) {
            return errorCallback(error);
        });         
      }

      /**
       * smae as above, but all in once
       */
      service.getAllDataRelatedtoRequest = function (data, successCallback, errorCallback) {

        ApiRest.post('/requests/related/all/', null, data, 
        function(response) {
          return successCallback(response)
        }, 
        function(error){
          return errorCallback(error)
        })            
      }


      service.gotDataRelatedtoRequest = function (response) {

      }

    /**
     * Get requests and allows the use of deferred promise
     * @param filters : filters
     * @returns {*} : deferred promise
     */
    service.getRequestsByDefer = function(filters) {
        let deferred = $q.defer();
        let params = {};
        params.filters = [filters];
        service.getRequestsBy("/requestsby", params, function(requests) {
            deferred.resolve(requests);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    };

    service.updateRequest = function (requestId, params, successCallback, errorCallback) {
      ApiRest.put('/requests/' + requestId, {}, params, function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.regroup = function (request_id, successCallback, errorCallback) {
      ApiRest.post('/requests/regroup', {}, { request_id }, function(response) {
        return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    // Les changements de statuts sont des actions de la prod ou des techniciens
    // unplanned correspond à une relance avec farmer, avec Vega la planification se fait sur l'onglet prévu pour ça
    // replan a l'air de correspondre à une demande pour replanifier la réservation, mais pas la replanifier
    service.updateRequestStatus = function (status, request, successCallback, errorCallback) {
      let updateRequest = {};
      let statusString = "";
      switch(status){
        case 'unplanned':
          updateRequest.is_planned = 0;
          updateRequest.is_done = 0;
          updateRequest.is_not_done = 0;
          updateRequest.is_sent_back = 0;
          updateRequest.is_in_progress = 0;
          updateRequest.is_finished = 0;
          updateRequest.is_partial = 0;
          updateRequest.is_validated_for_tech = 0;
          updateRequest.is_canceled = 0;
          updateRequest.booking_status = 'torevalidate';
          statusString = $rootScope._T["gapuijwn"];
          break;
        case 'planned':
          updateRequest.is_planned = 1;
          updateRequest.is_done = 0;
          updateRequest.is_not_done = 0;
          updateRequest.is_sent_back = 0;
          updateRequest.is_in_progress = 0;
          updateRequest.is_finished = 0;
          updateRequest.is_partial = 0;
          updateRequest.is_validated_for_tech = 0;
          updateRequest.is_canceled = 0;
          statusString = $rootScope._T["vtlzhiia"];
          break;
        case 'in_progress':
          updateRequest.is_planned = 1;
          updateRequest.is_done = 0;
          updateRequest.is_not_done = 0;
          updateRequest.is_sent_back = 0;
          updateRequest.is_in_progress = 1;
          updateRequest.is_finished = 0;
          updateRequest.is_partial = 0;
          updateRequest.is_validated_for_tech = 1;
          updateRequest.is_canceled = 0;
          statusString = $rootScope._T["pgbjq62z"];
          break;
        case 'replan':
          updateRequest.is_planned = 1;
          updateRequest.is_done = 0;
          updateRequest.is_not_done = 1;
          updateRequest.is_sent_back = 0;
          updateRequest.is_in_progress = 0;
          updateRequest.is_finished = 0;
          updateRequest.is_partial = 0;
          updateRequest.is_validated_for_tech = 1;
          updateRequest.is_canceled = 0;
          updateRequest.on_hold = 0;
          statusString = $rootScope._T["ck45dk3q"];
          break;
        case 'finished':
          updateRequest.is_planned = 1;
          updateRequest.is_done = 1;
          updateRequest.is_not_done = 0;
          updateRequest.is_sent_back = 1;
          updateRequest.is_in_progress = 0;
          updateRequest.is_finished = 0;
          updateRequest.is_partial = 0;
          updateRequest.is_validated_for_tech = 1;
          updateRequest.is_canceled = 0;
          updateRequest.on_hold = 0;
          statusString = $rootScope._T["3a2e5k94"];
          break;
        case 'cancel':
          updateRequest.is_done = 1;
          updateRequest.is_not_done = 0;
          updateRequest.is_sent_back = 1;
          updateRequest.is_partial = 0;
          updateRequest.is_canceled = 1;
          updateRequest.on_hold = 0;
          updateRequest.booking_status = 'tocancel';
          statusString = $rootScope._T["yp9tp27g"];
          break;
        case 'on_hold':
          updateRequest.on_hold = 1;
          statusString = $rootScope._T["sz8lmvdd"];
          break;
        case 'not_on_hold':
          updateRequest.on_hold = 0;
          statusString = $rootScope._T["uutsizwg"];
          break;
        case 'important':
          updateRequest.important = 1;
          statusString = $rootScope._T["pcodebge"];
          break;
        case 'not_important':
          updateRequest.important = 0;
          statusString = $rootScope._T["is4aq9ar"];
          break;
      }

      ApiRest.put('/requests/' + request.id, {}, updateRequest, function (response) {
        newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, statusString);
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.linkRequests = function (params, successCallback, errorCallback) {
      ApiRest.post('/requests/link_requests', {}, params, function(response) {
        if(response.error) {
          return errorCallback(response);
        }
        return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getRequestStatus = function(request, successCallback, errorCallback) {
      var requestStatus = [];
      if (request.on_hold == 1) {
        requestStatus['status'] = {
          id: 7,
          class: "request_status_on_hold",
          message: $rootScope._T["my0fatew"]
        };
      } else if (request.is_canceled == 1) {
        requestStatus['status'] = {
          id: 8,
          class: "request_status_canceled",
          message: $rootScope._T["yp9tp27g"]
        };
      } else if (request.is_planned == 0) {
        requestStatus['status'] = {
          id: 1,
          class: "request_status_unplanned",
          message: $rootScope._T["xmzuxofk"]
        };
        if (checkErrorDate(request, "wish", "first")) {
          requestStatus['error'] = {
            id: 1,
            class: "request_status_error",
            message: $rootScope._T["xmzuxofk"]
          };
        }
      } else if (request.is_planned == 1 && request.is_validated_for_tech != 1) {
        requestStatus['status'] = {
          id: 2,
          class: "request_status_planned",
          message: $rootScope._T["moan71y1"]
        };
        if (checkErrorDate(request, "farmer", "first")) {
          requestStatus['error'] = {
            id: 2,
            class: "request_status_error",
            message: $rootScope._T["y6zlxn4p"]
          };
        } else if (checkErrorPlan(request)) {
          requestStatus['warning'] = {
            id: 1,
            class: "request_status_warning",
            message: $rootScope._T["q7mgxu53"]
          };
        }
      } else if (request.is_done == 0 && request.is_not_done == 0 && request.is_sent_back == 0 && request.is_in_progress == 0 && request.is_finished == 0 && request.is_validated_for_tech == 1) {
        requestStatus['status'] = {
          id: 3,
          class: "request_status_sent",
          message: $rootScope._T["wskw1rj4"]
        };
        if (checkErrorDate(request, "farmer", "last")) {
          requestStatus['error'] = {
            id: 3,
            class: "request_status_error",
            message: $rootScope._T["z9jj71a9"]
          };
        } else if (checkErrorPlan(request)) {
          requestStatus['warning'] = {
            id: 1,
            class: "request_status_warning",
            message: $rootScope._T["q7mgxu53"]
          };
        }
      } else if (request.is_in_progress == 1) {
        requestStatus['status'] = {
          id: 4,
          class: "request_status_in_progress",
          message: $rootScope._T["vvijhgr1"]
        };
        if (checkErrorDate(request, "farmer", "last")) {
          requestStatus['error'] = {
            id: 4,
            class: "request_status_error",
            message: $rootScope._T["pn87clhc"]
          };
        } else if (checkErrorPlan(request)) {
          requestStatus['warning'] = {
            id: 1,
            class: "request_status_warning",
            message: $rootScope._T["q7mgxu53"]
          };
        }
      } else if (request.is_done == 1 && request.is_sent_back == 1) {
        requestStatus['status'] = {
          id: 5,
          class: "request_status_finished",
          message: $rootScope._T["crmxsdxx"]
        };
        requestStatus['success'] = {
          id: 1,
          class: "request_status_success",
          message: $rootScope._T["crmxsdxx"]
        };
      } else if (request.is_not_done == 1) {
        requestStatus['status'] = {
          id: 6,
          class: "request_status_replan",
          message: $rootScope._T["6dkigy5e"]
        };
      }
      return successCallback(requestStatus);
    };

      /**
       * Saves a comment to requests passed in params.
       * @param requestId : an array of requests
       * @param comment : a string for the comment
       * @param showTech : a boolean for the technician's visibility
       */
    service.saveNewComment = function(requestId, comment, showTech) {
        let deferred = $q.defer();
        if(comment != null && comment.trim() !== "") {
            let newComment = new Comment();
            newComment.text = comment;
            newComment.user_id = $.cookie('user_id');
            newComment.show_tech = showTech;
            newComment.request_id = requestId;
            newComment.$save(function (commentSave) {
                deferred.resolve(commentSave);
            }, function(error){
                console.error("Comment couldn't be save. Error message : " + error);
                deferred.reject(error);
            });
        } else {
            deferred.reject("Comment null or empty");
        }
        return deferred.promise;
    };

      /**
       * Updates status of request and allows the use of deferred promise
       * @param status : string param for request's status
       * @param request : request object
       * @returns {*} : deferred promise
       */
    service.setStatusRequestDefer = function(status, request){
        let deferred = $q.defer();
        service.updateRequestStatus(status, request, function(request){
            deferred.resolve(request);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    };

    service.updateRequestDefer = function(id, data) {
        
        let deferred = $q.defer();
        service.updateRequest(id, data, function(request){
            deferred.resolve(request);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    };

    service.regroupDefer = function(requestId) {
        let deferred = $q.defer();
        service.regroup(requestId, function(request){
            deferred.resolve(request);
        }, function(error){
            deferred.reject(error);
        });
        return deferred.promise;
    };

      /**
       * Sets dates of request keeping in mind the old ones and the new ones.
       * @param dateStartEnd : array of selected dates with start and and time
       * @param originalDates : array of original dates with time and status
       */
    service.setNewDesiredDate = function(dateStartEnd, originalDates) {
      let addedDates = [];
      let updatedDates = [];
      let deletedDates = [];

      angular.forEach(dateStartEnd, function(date) {
        if (date.start_time_h && typeof date.start_time_h == 'object') {
          date.start_time_h = date.start_time_h.value
        }
        if (date.end_time_h && typeof date.end_time_h == 'object') {
          date.end_time_h = date.end_time_h.value
        }        
        let oDates = $filter('filter')(originalDates, {
          'day': date.day
        }, true);
        let day = moment(date.day).format("DD/MM/YYYY");
        if (oDates.length > 0) {
          let oDate = oDates[0];
          if (oDate.is_farmer && oDate.is_wish) {
            oDate.vu = true;
            // ne rien faire
          } else if (oDate.is_farmer && oDate.is_wish != 1) {
            oDate.vu = true;
            date.is_wish = 1;
            addedDates.push(day);
          } else if (oDate.is_wish == 0) {
            oDate.vu = true;
            date.is_wish = 1;
            addedDates.push(day);
          } else if (!hasSameTimes(date, oDate)) {
            oDate.vu = true;
            updatedDates.push(day);
          } else {
            oDate.vu = true;
            // ne rien faire
          }
        } else {
          addedDates.push(day);
        }
      });
      angular.forEach(originalDates, function(oDate) {
        if (!oDate.vu && oDate.is_wish) {
          let day = moment(oDate.day).format("DD/MM/YYYY");
          let date = {};
          date.day = oDate.day;
          if (oDate.is_farmer) {
            date.is_wish = 0;
            date.start_time_h = oDate.start_time_h;
            date.start_time_m = oDate.start_time_m;
            date.end_time_h = oDate.end_time_h;
            date.end_time_m = oDate.end_time_m;
          } else {
            date.is_wish = 0;
            date.start_time_h = null;
            date.start_time_m = null;
            date.end_time_h = null;
            date.end_time_m = null;
          }
          deletedDates.push(day);
          dateStartEnd.push(date);
        }
      });
      
      let datesChanged = false;
      let descNotif = "";
      if (deletedDates.length > 0) {
        datesChanged = true;
        descNotif += "<br/> <i class='fa fa-minus-square'></i> " + $rootScope._T["s9ka8e0t"] + " : " + deletedDates.sort().join(', ')
      }
      if (addedDates.length > 0) {
        datesChanged = true;
        descNotif += "<br/> <i class='fa fa-plus-square'></i> " + $rootScope._T["2r346aew"] + " : " + addedDates.sort().join(', ');
      }
      if (updatedDates.length > 0) {
        datesChanged = true;
        descNotif += "<br/> <i class='fa fa-pencil-square'></i> " + $rootScope._T["w5y9s26f"] + " : " + updatedDates.sort().join(', ');
      }

      let requestData = {};
      requestData.dateStartEnd = dateStartEnd;

      let returnObject = {};
      returnObject.deletedDates = deletedDates;
      returnObject.addedDates = addedDates;
      returnObject.requestData = requestData;
      returnObject.descNotif = descNotif;
      returnObject.datesChanged = datesChanged;

      return returnObject;

    }

    /**
     * [checkIsPlanningAlert description]
     * @param  {[type]} objectDates  [description]
     * @param  {[type]} ObjectParams [description]
     * @return {[type]}              [description]
     */
    service.checkIsPlanningAlert = function (objectDates,ObjectParams) {

      let start_date = moment().isoWeekday(-3); // Jeudi de la semaine précedente
      let end_date = moment().isoWeekday(-3).add(10, 'd'); // le dimanche de la semaine qui suit le jeudi précédent

      if(moment().isoWeekday() >= 4 ){
        end_date = end_date.add(1, 'w'); // le dimanche de la semaine qui suit le jeudi de la semaine en cours
      }

      let  date_added = null;
      let  date_deleted = null;
      let  isBlocked = false;

      if(objectDates.addedDates != undefined && objectDates.addedDates.length > 0 ){
          date_added = objectDates.addedDates.sort().join(', ');
          angular.forEach(objectDates.addedDates, function(date_wished_added) {
            // vérifier si l'ajout de la nouvelle date est dans la fenêtre des dates bloquées
            let isBlockedPeriode = moment(moment(date_wished_added, 'DD/MM/YYYY').format('YYYY-MM-DD')).isBetween(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'));
            if(isBlockedPeriode){
              isBlocked = true;
            }
          });
       }

       if( objectDates.deletedDates != undefined && objectDates.deletedDates.length > 0 ){
          date_deleted = objectDates.deletedDates.sort().join(', ');
          angular.forEach(objectDates.deletedDates, function(date_wished_deleted) {
            // vérifier si le retrait de la date est dans la fenêtre des dates bloquées
              let isBlockedPeriode = moment(moment(date_wished_deleted, 'DD/MM/YYYY').format('YYYY-MM-DD')).isBetween(start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD'));
              if(isBlockedPeriode){
                 isBlocked = true;
              }
          });
        }

      if(isBlocked){
        let paramsLog = ObjectParams;
            paramsLog.date_added = date_added;
            paramsLog.date_removed = date_deleted;
            paramsLog.type_operation = (paramsLog.type_operation == null)? 'Modification demande' : paramsLog.type_operation;  // Modification de dates (Ajout / retrait) ou  creation de demande
        // Enregistrer les logs
       service.saveLogPlanningAlert(paramsLog);
      }
    };

    /**
     * [saveLogPlanningAlert description]
     * @param  {[type]} params [description]
     * @return {[type]}        [description]
     */
    service.saveLogPlanningAlert = function(params) {
      service.postLogPlanningAlert({},params, function (response) {
      }, function (error) {
        console.warn('error',error);
      });
    };

    /**
     * [postLogPlanningAlert description]
     * @param  {[type]} params          [description]
     * @param  {[type]} data            [description]
     * @param  {[type]} successCallback [description]
     * @param  {[type]} errorCallback   [description]
     * @return {[type]}                 [description]
     */
    service.postLogPlanningAlert = function(params, data, successCallback, errorCallback) {
      ApiRest.post('/logplanning/logplanningalert', params, data, function(response) {
       return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    // update DA, song_da and stage manager (germany) in requets OR farmer
    service.updateDAAndOther = function (type, id, farmers, requests, successCallback, errorCallback) {
      const data = {
        requests: requests
      }
      data.farmers = []
      farmers.forEach((farmer) => {
        data.farmers.push(farmer.id)
      })
      if (farmers[0].artistic_director_id) {
        data.artistic_director_id = farmers[0].artistic_director_id
      }
      if (farmers[0].song_director_id) {
        data.song_director_id = farmers[0].song_director_id
      }
      if (farmers[0].stage_manager_id) {
        data.stage_manager_id = farmers[0].stage_manager_id
      }
      ApiRest.post('/requests/change/da/', null , data, function(response) {
        return successCallback(response);
       }, function(error) {
         return errorCallback(error);
       });
    }
    

      /**
       * Local functions
       */

    function checkErrorDate(request, type, index) {
      let dates = [];
      if (type == "farmer") {
        if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) {
          for (let i = 0; i < request.ownFarmerbookings.length; i += 1) {
            if (request.ownFarmerbookings[i].booking_id != null) {
              let momentDate = moment(request.ownFarmerbookings[i].day);
              if (momentDate.isValid()) {
                dates.push(momentDate);
              }
            }
          }
        }
      } else {
        if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) {
          for (let i = 0; i < request.ownFarmerbookings.length; i += 1) {
            if (request.ownFarmerbookings[i].is_wish == "1") {
              let momentDate = moment(request.ownFarmerbookings[i].day);
              if (momentDate.isValid()) {
                dates.push(momentDate);
              }
            }
          }
        }
      }

      if (dates.length == 0) {
        // pas d'erreur si pas de dates
        return false;
      }
      dates.sort(function(a, b){return a - b});
      let date;
      if (index == "first") {
        date = dates[0];
      } else {
        date = dates.pop();
      }

      if(date < moment().startOf('day')) {
        return true;
      }
      return false;

    }

    function checkErrorPlan(request) {
      let error = false;
      angular.forEach(request.ownFarmerbookings, function(farmerbooking) {
        if ((farmerbooking.is_wish == "1" && farmerbooking.booking_id == null) || (farmerbooking.booking_id != null && farmerbooking.is_wish != "1")) {
          error = true;
        }
      });
      return error;
    }

    function hasSameTimes(date, oDate) {
      return date.start_time_h == oDate.start_time_h && date.start_time_m == oDate.start_time_m && date.end_time_h == oDate.end_time_h && date.end_time_m == oDate.end_time_m;
    }

    return service;
  }
]);
