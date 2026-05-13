'use strict';

/* Services */
Lantern.factory('FarmerService', ['ApiRest', '$q', 'Session', '$rootScope', 'HelperService',
  function(ApiRest, $q, Session, $rootScope, HelperService) {
    const branchId = Session.branchId()
    const service = {}
    const i18nHourDisplay = HelperService.i18nHourDisplay()

    // define class used in date
    //                                        blanc                               1 non planifié 
    // strikethrough                           barré gris                          0 non planifié    (date non souhaité par la prod est supprimée si plus planifiée)
    // date_is_plan_not_farmer                 vert souhaité planifié              1
    // date_is_plan_not_farmer_not_wish        mauve pas souhaité planifié         null
    // date_is_plan_not_farmer_not_wish        mauve plus souhaité planifié        0
    // 
    service.getDateClass = function (farmer, small) {
      const classes = {}
      if (small) {
        classes.mini = 1
      }      
      if (!farmer) {
        return Object.keys(classes).join(' ')
      }
      if (farmer.is_wish == 0) {
        classes.strikethrough = 1
      }
      if (farmer.booking_id) {
        const values = {
          1: 'date_is_plan_not_farmer',
          0: 'date_is_plan_not_farmer_not_wish',
          null: 'date_is_plan_not_farmer_not_wish'
        }
        classes[values[farmer.is_wish]] = 1
        if (farmer.is_wish == 1) {
          classes.date_is_plan_not_farmer = 1
        }
        if ($rootScope.writerMIssing && $rootScope.farmersWithWriterMissing[farmer.farmer_id]) {
          classes.date_tech_missing = 1
        }
        if ($rootScope.editorMissing &&  $rootScope.farmersWithEditorMissing[farmer.farmer_id]) {
          classes.date_tech_missing = 1
        }
      }
      return Object.keys(classes).join(' ')
    }

    // verifier le tech id et l'existence de la table des users
    // mettre l'heure au format international
    service.setTooltip = function setTooltip(date, farmer) {
      const momentDate = moment(date.timestamp).format("dddd Do MMMM YYYY")
      let tooltip = $rootScope._T["z0t6p7pd"] + ' ' + momentDate + '<br>'
      if (farmer != null && farmer.booking_id == null) {
        if (farmer.start_time && farmer.end_time) {
          tooltip += i18nHourDisplay(farmer.start_time) + " - " + i18nHourDisplay(farmer.end_time)
        }
      } else if (farmer != null && farmer.booking_id != null) {
        const day = {
          "audit": farmer.audit ? farmer.audit : "<i>" + $rootScope._T["6hwpign7"] + "</i>",
          "ingenieur": "<i>" + $rootScope._T["po8f4gf6"] + "</i>",
          "hours": farmer.start_time ? i18nHourDisplay(farmer.start_time) + "-" + i18nHourDisplay(farmer.end_time) : $rootScope._T["mjfmw3ik"],
          "reader": ''
        }
        if (farmer.tech_writer_id) {
          if ($rootScope.allTechnicians && $rootScope.allTechnicians[farmer.tech_writer_id]) {
            day.ingenieur = $rootScope.allTechnicians[farmer.tech_writer_id].firstname + " " + $rootScope.allTechnicians[farmer.tech_writer_id].lastname
          }
        }
        if (farmer.tech_reader_id) {
          if ($rootScope.allTechnicians && $rootScope.allTechnicians[farmer.tech_reader_id]) {
            day.reader += "<br>" + $rootScope.allTechnicians[farmer.tech_reader_id].firstname + " " + $rootScope.allTechnicians[farmer.tech_reader_id].lastname
          }
        }        
        tooltip += day.audit + " [" + day.hours + "]<br>" + day.ingenieur  + day.reader
        if (farmer.is_selected != 1) {
            tooltip += "<br> <i>" + $rootScope._T["4pjn4hf2"] + "</i> "
        } else {
          if (farmer.is_finished != 1) {
            tooltip += "<br> <i>" + $rootScope._T["4hnv5y11"] + "</i> "
          } else if (farmer.is_finished == 1) {
            tooltip += "<br> <i>" + $rootScope._T["k7su5zvx"] + "</i> "
          }
          if (farmer.date_see_tech == null) {
            tooltip += "- <i>" + $rootScope._T["vlz2cm9v"] + "</i>"
          } else if (farmer.date_see_tech != null) {
            tooltip += "- <i>" + $rootScope._T["5q9ze7sc"] + "</i>"
          }
        }
      }
      return tooltip
    }

    service.isMoreFarmersUntreatedInRequest = function (farmer, request) {      
      let isUntreatedFound = false;
      if (farmer != null && request != null && request.ownFarmerbookings != null) {
        angular.forEach(request.ownFarmerbookings, function (aFarmerbooking) {
          if (farmer.id !== aFarmerbooking.id) {
            if (aFarmerbooking.is_finished !== 1 && aFarmerbooking.is_done !== 1 && aFarmerbooking.is_not_done !== 1 && aFarmerbooking.is_partial !== 1)
            {
              isUntreatedFound = true;
            }  
          }
        })
      } else {
        console.error("Farmer, request or ownFarmerbookings are null");
      }
      return isUntreatedFound
    };

      service.updateFarmerbooking = function (farmerId, params, successCallback, errorCallback) {
          ApiRest.put('/farmerbookings/' + farmerId, {}, params, function(response) {
              return successCallback(response)
          }, function(error) {
              return errorCallback(error);
          });
      };

      service.updateFarmerbookingsDefer = function(id, data) {
          let deferred = $q.defer();
          service.updateFarmerbooking(id, data, function(farmerbooking){
              if(farmerbooking.error !== undefined) deferred.reject(farmerbooking.error);
              else deferred.resolve(farmerbooking);
          }, function(error){
              deferred.reject(error);
          });
          return deferred.promise;
      };

      /**
       * Get farmers and allows the use of deferred promise
       * @param params : filters
       * @returns {*} : deferred promise
       */
      service.getCountFarmersForDashboardDefer = function(params) {
          let deferred = $q.defer();
          ApiRest.get('/farmerbookings/countfarmersfordashboard', params, function(response) {
              deferred.resolve(response);
          }, function(error) {
              deferred.reject(error);
          });
          return deferred.promise;
      };

    service.getAllFarmersByDay = function (successCallback, errorCallback) {
      const day = moment(new Date).format("YYYY-MM-DD")
      ApiRest.get('/farmerbookings/audit/day/' + day + '/' + branchId + '/', {}, 
        function(response) {
          return successCallback(response)
        }, 
        function(error) {
          return errorCallback(error)
        }
      )
    }

    
    service.getRoomsAvailability = function (parameters, successCallback, errorCallback) {
      ApiRest.post('/vrequests/availability/', {},
      parameters,
        function(response) {
          return successCallback(response)
        }, 
        function(error) {
          return errorCallback(error)
        }
      )
    }

    service.getRoomsConditions = function (parameters, successCallback, errorCallback) {
      ApiRest.post('/vrequests/rooms/conditions/', {},
      parameters,
        function(response) {
          return successCallback(response)
        }, 
        function(error) {
          return errorCallback(error)
        }
      )
    }

    service.getTechniciansConditions = function (parameters, successCallback, errorCallback) {
      ApiRest.post('/vrequests/technicians/conditions/', {},
      parameters,
        function(response) {
          return successCallback(response)
        }, 
        function(error) {
          return errorCallback(error)
        }
      )
    } 

    /**
     * Entry
​     * endHour: "18:30"
​     * startHour: "14:30"
     * 
     * return 
      "day": "2022-09-20 00:00:00",
      "start_time_h": 14,
      "start_time_m": 30,
      "end_time_h": 18,
      "end_time_m": 30
     */

    service.buildEntryaddRequest = function (data, entry) {
      data.start_time_h = null
      data.start_time_m = null      
      if (entry.startHour) {
        const [startH, startM] = entry.startHour.split(':')
        data.start_time_h = startH
        data.start_time_m = startM
      }
      data.end_time_h = null
      data.end_time_m = null      
      if (entry.endHour) {
        const [endH, endM] = entry.endHour.split(':')
        data.end_time_h = endH
        data.end_time_m = endM
      }     
    }
    // remplace à terme bookDates
    service.updateBooks = function (data2send, done) {
      ApiRest.post('/vrequests/update/bookings', null, data2send, function(response) {
        return done(response)
      }, function(error){
          service.setErrorLoading(true);
          return done()
      })
    }

    return service;
  }
]);





angular.module('Lantern').directive('dateWishReviewed', function ($filter, Request, RequestService, $rootScope, FarmerService, HelperService) {
  return {
    templateUrl: 'partials/template/date-wishes.html',
    scope: {
      requests: "=",
      farmers: "=",
      hide: "=",
      small: "="
    },
    link: function (scope) {
      const farmersDisplayed = {}
       const i18nHourDisplay = HelperService.i18nHourDisplay()
       scope.$on('sync-update-date-wish-reviewed', function(event, updatedFarmers) {
          if (Object.keys(updatedFarmers).length == 0 || scope.allDates.length == 0) {
            return
          }
          scope.allDates.forEach((date) => {
            if (updatedFarmers[date.farmer_id]) {
              const farmer = updatedFarmers[date.farmer_id]
              const timestamped_date = parseInt(moment(farmer.day).format('x'))
              date.is_wish = farmer.is_wish
              date.timestamp = timestamped_date
              date.booking_id = farmer.booking_id
              date.is_farmer = farmer.booking_id != null;
              date.is_selected = farmer.is_selected
              date.farmer_id = farmer.id
              if (scope.hide && farmer.is_wish == 0 && !farmer.booking_id) {
                // on n'affiche pas la date
              } else {
                date.tooltip =  FarmerService.setTooltip(date, farmer)
              }
            }
          })
       })
      scope.role = $.cookie('role');
      function init () {
        scope.allDates = []
        if (scope.requests && scope.requests.length > 0) {
          scope.allFarmerDatesAreDone = true
          scope.oneOrMoreDateAreFarmer = false
          scope.nextDate = null
          scope.requests.forEach((farmer_id) => {
            const farmer = scope.farmers[farmer_id]
            if (farmer.day != null) {
              const timestamped_date = parseInt(moment(farmer.day).format('x'))
              const date = {}
              date.is_wish = farmer.is_wish
              date.timestamp = timestamped_date
              date.booking_id = farmer.booking_id
              date.is_farmer = farmer.booking_id != null;
              date.is_selected = farmer.is_selected
              date.farmer_id = farmer.id
              if (scope.hide && farmer.is_wish == 0 && !farmer.booking_id) {
                // on n'affiche pas la date
              } else {
                if (date.booking_id) {
                  scope.oneOrMoreDateAreFarmer = true
                }
                date.tooltip =  FarmerService.setTooltip(date, farmer)
                scope.allDates.push(date)
                if (date.is_farmer && farmer.is_selected != 1) {
                  scope.allFarmerDatesAreDone = false
                }
                if (!scope.nextDate) {
                  var momentDate = moment(timestamped_date)
                  scope.nextDate = {
                    day: momentDate.format("DD"),
                    month: momentDate.format('MMM')
                  }
                }
              }
            }
          })
        }

        scope.noDate = scope.allDates.length == 0
      }
      init();

      // called in html template
      scope.getClasses = function (date, small) {
        const dateClass = FarmerService.getDateClass(date, small)
        return dateClass
      }
    }
  }
})    