function DateRequestPopup($filter, RequestService, Request, $q, NotificationService, $scope, $rootScope, Session) {
  // page html correspondante app/components/dateRequestPopup.html
  // page de requete, partie droite, ajout de dates à planifier, accés prod et planning
    let ctrl = this;
    ctrl.HourOptions = getHourOptions($rootScope.user_entity.person.branch_id)

    function init(mainRequest) {
      ctrl.selectedDates = [];
      ctrl.originalDates = [];
      ctrl.dateStartEnd = [];
      ctrl.showPanelDate = false;
      ctrl.allDates = {
        day: null,
        start_time_h: null,
        start_time_m: null,
        end_time_h: null,
        end_time_m: null
      };
      ctrl.isShowDatesDetails = true;

      var store_holydays = null;

      if(localStorage.getItem('holydays') === null){
        var holiday = function(){
          var deferred = $q.defer();
          Request.getHolydays(
            function(result){
              deferred.resolve(result)
            }
          );
          return deferred.promise;
        }
        
        $scope.holydays = holiday().then(function (holydays) {
            var str_holydays = JSON.stringify(holydays);
            localStorage.setItem('holydays', str_holydays);
             store_holydays = localStorage.getItem('holydays');
             holidays();
        }, function (error) {
          console.error(error)
        });
      }else{
        store_holydays = localStorage.getItem('holydays');
        holidays();
      }
  
      $scope.options = {
        //dateDisabled: disabled,
        'startingDay': 1,
        customClass: getDayClass
      };
  
      /* function disabled(data) {
        var date = data.date;
        var mode = data.mode;
        return mode === 'day' && (store_holydays.indexOf(moment(date).format("YYYY-MM-DD")) > -1);
      } */
      function holidays(){
        $scope.events = [];
        let store_holydays_parse = JSON.parse(store_holydays)
        for(var i=0; i < store_holydays_parse.length; i++){
          $scope.events.push({date: store_holydays_parse[i], status: 'ferie'})
        }
      }
  
      function getDayClass(data) {
        var date = data.date;
        var mode = data.mode;
        if (mode === 'day') {
          var dayToCheck = new Date(moment(date).format("YYYY-MM-DD")).setHours(0, 0, 0, 0);
          if ($scope.events != undefined) {
            for (var i = 0; i < $scope.events.length; i++) {
              var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);
              if (dayToCheck === currentDay) {
                return $scope.events[i].status;
              }
            }
          }
        }
        return '';
      }
      
      angular.forEach(mainRequest.ownFarmerbookings, function(farmer) {
        let date = {
          day: farmer.day,
          start_time: farmer.start_time,
          end_time: farmer.end_time,
          start_time_h: farmer.start_time ? parseInt(farmer.start_time.split('h')[0]) : null,
          start_time_m: farmer.start_time ? parseInt(farmer.start_time.split('h')[1]) : null,
          end_time_h: farmer.end_time ? parseInt(farmer.end_time.split('h')[0]) : null,
          end_time_m: farmer.end_time ? parseInt(farmer.end_time.split('h')[1]) : null,
          is_wish: farmer.is_wish ? parseInt(farmer.is_wish) : null,
          is_farmer: farmer.booking_id != null,
          vu: false
        }
        // liste des dates existantes
        ctrl.originalDates.push(date);

        if (farmer.is_wish == 1) {
          let timestamp = moment(farmer.day).format('x');
          ctrl.selectedDates.push(parseInt(timestamp));
          let data = {
            day: farmer.day,
            start_time_h: farmer.start_time ? parseInt(farmer.start_time.split('h')[0]) : null,
            start_time_m: farmer.start_time ? parseInt(farmer.start_time.split('h')[1]) : null,
            end_time_h: farmer.end_time ? parseInt(farmer.end_time.split('h')[0]) : null,
            end_time_m: farmer.end_time ? parseInt(farmer.end_time.split('h')[1]) : null,
            is_wish: true
          };
          ctrl.dateStartEnd.push(data);
        }
      });

      if(ctrl.selectedDates.length > 0) ctrl.dt = ctrl.selectedDates[0];

    }
    ctrl.getPresetTimes = presetTimeBase(Session.branchId())
    init(ctrl.requests[0]);

    ctrl.changeDay = function(dt) {
      ctrl.showPanelDate = true;
      let day = moment(dt).format("YYYY-MM-DD HH:mm:ss")
      let dates = $filter('filter')(ctrl.dateStartEnd, {
        'day': day
      }, true)
      if (dates.length > 0) {
        let index = ctrl.dateStartEnd.indexOf(dates[0]);
        ctrl.dateStartEnd.splice(index, 1);
      } else {
        let data = {
          day: day,
          start_time_h: ctrl.allDates.start_time_h,
          start_time_m: ctrl.allDates.start_time_m,
          end_time_h: ctrl.allDates.end_time_h,
          end_time_m: ctrl.allDates.end_time_m,
          is_wish: true
        };
        ctrl.dateStartEnd.push(data);
      }
    }

    ctrl.showDatesDetails = function() {
      ctrl.isShowDatesDetails = !ctrl.isShowDatesDetails;
    }

    ctrl.isDayPlanned = function(date) {
      let isPlanned = false;
      angular.forEach(ctrl.originalDates, function(originalDate) {
        if (originalDate.is_farmer && originalDate.day == date.day) {
          isPlanned = true;
          date.start_time_h = originalDate.start_time_h;
          date.start_time_m = originalDate.start_time_m;
          date.end_time_h = originalDate.end_time_h;
          date.end_time_m = originalDate.end_time_m;
        }
      });
      return isPlanned;
    }

    ctrl.isDifferentWeek = function(date, previousDate) {
      return moment(date).format("w") != moment(previousDate).format("w");
    }
    ctrl.setTime = function(date, preset) {
      if (!ctrl.isDayPlanned(date)) {
        setTimeDateWishByBranch(Session.branchId(), date, preset)
      }
      if (date.day == null) {
        ctrl.setAllTimes(0);
      }
    }     

    ctrl.setAllTimes = function(i) {
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (!ctrl.isDayPlanned(date)) {
          if (i == 1) {
            date.start_time_h = ctrl.allDates.start_time_h;
          } else if (i == 2) {
            date.start_time_m = ctrl.allDates.start_time_m;
          } else if (i == 3) {
            date.end_time_h = ctrl.allDates.end_time_h;
          } else if (i == 4) {
            date.end_time_m = ctrl.allDates.end_time_m;
          } else {
            date.start_time_h = ctrl.allDates.start_time_h;
            date.start_time_m = ctrl.allDates.start_time_m;
            date.end_time_h = ctrl.allDates.end_time_h;
            date.end_time_m = ctrl.allDates.end_time_m;
          }
        }
      });
    }

    ctrl.saveNewDesiredTime = function (requests) {

      // Crée un objet avec les nouvelles dates souhaitées par la prod
      let objectDates = RequestService.setNewDesiredDate(ctrl.dateStartEnd, ctrl.originalDates);

      if (objectDates.datesChanged) {
        let requestPromises = [];
        for(let i = 0; i < requests.length; i += 1){
          let request = requests[i];
          requestPromises.push(RequestService.updateRequestDefer(request.id, objectDates.requestData));
        }

        $q.all(requestPromises).then(function(requestPromises) {
          RequestService.regroupDefer(requests[0].id);

          let services = "planning";
          // Mise à jour des dates souhaitées
          sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["1e6d5sog"], objectDates.descNotif, $filter, "date_wishes", $rootScope);
          ctrl.setAlertMessage({message: $rootScope._T["1e6d5sog"], isError:false});
          angular.forEach(requestPromises, function (requestPromise) {
            let request = $filter('filter')(requests, {id : requestPromise.id}, true);
              if(request.length > 0) {
                request[0].ownFarmerbookings = requestPromise.ownFarmerbookings;

                // en enregistre les logs uniquement pour les planning auditorium
                if(request[0].planning_id == "auditorium"){
                  let ObjectParams = {
                                planning_service: request[0].planning_id, // "auditorium"
                                client_id: request[0].product.subproject.project.client_id,
                                request_id: request[0].id,
                                user_id: Session.userId(),
                                project_id: request[0].project,
                                subproject: request[0].subproject,
                                product_id: request[0].product_id,
                                etape_id: request[0].etape_type_id,
                                action_id: request[0].action_type_id,
                                date_added: null,
                                date_removed: null,
                                type_product: request[0].product.description_id,
                                type_operation: null
                            };
                  // Verifier et enregistrer les logs
                  RequestService.checkIsPlanningAlert(objectDates,ObjectParams);
                }
              }
            });
            $rootScope.$broadcast('date-wish-updated', {requests: requests});
            ctrl.initPopup();
          }, function (error) {
            ctrl.setAlertMessage({message: $rootScope._T["z2tc2l48"], isError:true});
        });
      }

    };

}


Lantern.component('dateRequestPopup', {
  templateUrl: 'components/dateRequestPopup.html',
  controller: DateRequestPopup,
  bindings: {
    requests: '<',
    setAlertMessage: '&',
    getSelectedRequests: '&',
    initPopup: '&'
  }
});
