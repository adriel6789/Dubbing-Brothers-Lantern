
function DateRequestPopupNew($filter, RequestService, Request, $q, NotificationService, $scope, 
  $rootScope, Session, ngDialog, PaoService, ProjectsService, ValueListService, HelperService, RoomService, PersonsService, FarmerService) {
  // remplace DateRequestPopup
  // page html correspondante app/components/dateRequestPopup.html
  // page de requete, partie droite, ajout de dates à planifier ou modification de dates planifiées, accés prod et planning
    let ctrl = this;
    RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
    PersonsService.getTechnicians(function (result) {
      PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
    }, PersonsService.manageTechniciansError)
    
    ctrl.HourOptions = getHourOptions($rootScope.user_entity.person.branch_id)

    ctrl.UpdateToSave = false
    const previouslySelectedDates = {}
    const dates2Delete = {}
    const newSelectedDates = {}
    ctrl.projectType = {}
    ctrl.projectTypeSelected = null
    ctrl.previouslySelectedDates = []
    ctrl.actionType = ctrl.getSelectedRequests()[0].action_type
    const etapesActions = []
    ctrl.changeProjectType = function (value) {
      ProjectsService.updateProject(ctrl.project.id, { type_id: value.id } , function (result) {
        ctrl.project = result
      }, function (error) {})
    }
    if (!$rootScope.etapesActionsBase) {
      $rootScope.etapesActionsBase = {}
    }
    const gotBookingConditions = function () {
      $scope.bookingConditions = $rootScope.bookingConditions
     }

     let presetArray = null
     const gotPresetTimes = function () {
      $scope.presetTimes = $rootScope.presetTimes
      presetArray = ValueListService.orderPresetTimes($scope.presetTimes)
     }    

    function init(mainRequest) {
      let etapesActionsPromises = [];
      for (let i = 1; i <= 3; i++) {
          if ($rootScope.etapesActionsBase[i]) {
            etapesActions[i] =  $rootScope.etapesActionsBase[i]
          } else {
              etapesActionsPromises.push(ValueListService.getEtapeActionByWorkflowDefer(i));
          }
      }
      $q.all(etapesActionsPromises).then(function(etapesActionsResponse) {
        // ValueListService.initEtapesActions(etapesActionsResponse)
      })

      PaoService.getDubbingSteps(function (dubbingSteps) {
        ctrl.dubbingSteps = dubbingSteps
      })
      PaoService.getProjectTypes(function (projectTypes) {
        ctrl.projectTypes = projectTypes
      })
      PaoService.getBookingConditions(gotBookingConditions, function () {})
      ValueListService.getPresetTimes(gotPresetTimes, function () {})      
      ctrl.project = mainRequest.product.subproject.project
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
        customClass: getDayClass
      };
  
      /* function disabled(data) {
        var date = data.date;
        var mode = data.mode;
        return mode === 'day' && (store_holydays.indexOf(moment(date).format("YYYY-MM-DD")) > -1);
      } */
      function holidays(){
        $scope.events = [];
        var store_holydays_parse = JSON.parse(store_holydays);
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
      
      // pour les mises à jour
      $scope.farmersByDay = []
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
        if (!$scope.farmersByDay[farmer.day])  { 
          $scope.farmersByDay[farmer.day] = { farmers: {} }
        }
        $scope.farmersByDay[farmer.day].farmers[farmer.id] = farmer
        // liste des dates existantes
        ctrl.originalDates.push(date);
        const timestamp = moment(farmer.day).format('x')
        if (farmer.is_wish == 1 && timestamp > Date.now()) {
        // if (farmer.is_wish == 1) {
          previouslySelectedDates[parseInt(timestamp)] = { status: 'booked', farmer_id: farmer.id, day: farmer.day }
          ctrl.previouslySelectedDates.push(parseInt(timestamp));
          ctrl.selectedDates.push(parseInt(timestamp));
          let data = {
            day: farmer.day,
            start_time_h: farmer.start_time ? parseInt(farmer.start_time.split('h')[0]) : null,
            start_time_m: farmer.start_time ? parseInt(farmer.start_time.split('h')[1]) : null,
            end_time_h: farmer.end_time ? parseInt(farmer.end_time.split('h')[0]) : null,
            end_time_m: farmer.end_time ? parseInt(farmer.end_time.split('h')[1]) : null,
            is_wish: true
          };
          // ctrl.dateStartEnd.push(data);
        }
      });

      if(ctrl.selectedDates.length > 0) ctrl.dt = ctrl.selectedDates[0];

    }
    ctrl.getPresetTimes = presetTimeBase(Session.branchId())
    init(ctrl.requests[0]);

    ctrl.allNewDates = []
    const newDates = {}    
    ctrl.changeDay2 = function(dt) {
      ctrl.showPanelDate = true;
      let day = moment(dt).format("YYYY-MM-DD HH:mm:ss")
      const timestamp = moment(day).format('x')
      if (previouslySelectedDates[timestamp]) {
        if (previouslySelectedDates[timestamp].status == 'booked') {
          previouslySelectedDates[timestamp].status = 'todelete'
          ctrl.UpdateToSave = true
        } else {
          previouslySelectedDates[timestamp].status = 'booked'
        } 
      } else {
        if (newSelectedDates[timestamp]) {
          delete newSelectedDates[timestamp]
        } else {
          newSelectedDates[timestamp] = day
        }
      }
      
      if (newDates[day]) {
        delete newDates[day]
      } else {
        newDates[day] = true
      }
      $scope.allNewDates = Object.keys(newDates).sort()
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

    let dubbingStep = 0
    let actionId = 0
    let actionType = null
    const products = []
    const workflows = []
    let action_type = null
    const selectedRequests = {}
    let commentsFromSelectedRequests = {}

    ctrl.getDataForModal = function () {
      commentsFromSelectedRequests = []
      ctrl.getSelectedRequests().forEach((request) => {
        request.ownComment.forEach((comment) => {
          if (!comment.activity_log) {
            commentsFromSelectedRequests[comment.text] = true
          }
        })
        selectedRequests[request.id] = request.product_id
        products.push(request.product)
        actionId = request.action_type_id
        actionType = request.action_type
        workflows.push(request.workflow)
        action_type = request.action_type
        dubbingStep = PaoService.getDubbingStep(request.action_type.etape_type.name)
      })

      
    }


    ctrl.hasSelectedRequestsToUpdate = function () {
      if (ctrl.dateChoiceModalClicked) {
        return true
      }
      if (ctrl.actionType && ctrl.actionType.planning == 'volume') {
        return true
      }
      // $ctrl.getSelectedRequests($ctrl.requests) < 1
      return false
    }    

    ctrl.dateChoiceModalClicked = false
    // acces prod et planning
    // prod uniquement les dates marquées 1
    // planning, les dates marquées 1 et null

    ctrl.openDateChoiceModal = function () {
      ctrl.dateChoiceModalClicked = true
      const original_dates = []
      const daysList = {}
      ctrl.requests[0].ownFarmerbookings.forEach((farmer) => {
        // ne prend pas les demandes qui sont dans le passé
        let canUpdate = false
        // acces planning et admin
        if ($rootScope.canDisplay(5)) {
          if (farmer.is_wish != 0) {
            canUpdate = true
          }
        }

        // acces chargeprod
        if ($rootScope.canDisplay(2)) {
          if (farmer.is_wish == 1 ||  farmer.is_wish == 0) {
            canUpdate = true
          }
        }        

        const startHourI18nFormat = farmer.start_time ? farmer.start_time.replace('h',':') :  0
        const endHouri18nFormat = farmer.end_time ? farmer.end_time.replace('h',':') :  0
        let audit = null
        if (farmer.audit) {
          audit = farmer.audit.replace(/ *\(.+\)$/,'').replace(/ *\*$/,'')
        }          
        const data = {
          id: farmer.id,
          farmer_id: farmer.id,
          action_id: actionId,
          request_id: farmer.request_id,
          day: farmer.day,
          original_date: farmer.original_date,
          start_time: startHourI18nFormat,
          end_time: endHouri18nFormat,
          audit: audit,
          booking_id: farmer.booking_id,
          room_id: farmer.room_id,
          requestedByProd: $rootScope.canDisplay(2) ? 1 : 0,
          is_wish: farmer.is_wish,
          is_done: farmer.is_done,
          is_not_done: farmer.is_not_done,
          is_selected: farmer.is_selected,
          is_partial: farmer.is_partial,
          is_finished: farmer.is_finished,
          date_see_tech: farmer.date_see_tech,
          artistic_director_id: parseInt(farmer.artistic_director_id),
          tech_writer_id: farmer.tech_writer_id ? parseInt(farmer.tech_writer_id) : null,
          tech_reader_id: farmer.tech_reader_id ? parseInt(farmer.tech_reader_id) : null,
          startDayTime: HelperService.fromHourToMinutes(startHourI18nFormat),
          endDayTime: HelperService.fromHourToMinutes(endHouri18nFormat),
          datetime_start: HelperService.buildDateTime(farmer.day, startHourI18nFormat),
          datetime_end: HelperService.buildDateTime(farmer.day, endHouri18nFormat)
        }
        // date dans le futur ou le même jour
        if (canUpdate) {
          if (moment(farmer.day).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD') || !moment(new Date(HelperService.buildDateTime(farmer.day, startHourI18nFormat))).isBefore(moment(new Date()))) {
            original_dates.push(data)
            let datetime = moment(farmer.day).format("YYYY-MM-DD HH:mm:ss")
            daysList[datetime] = true      
          }
        }
      })

      ctrl.getDataForModal()
      let dialReturn = null
      const roleAllAllowed = 5
      const dataSent2modal = { 
                requestCreation: false, // nouvelles requetes à créer
                original_dates: original_dates, 
                products: products, 
                action_id: actionId,
                actionType: actionType,
                dubbingStep: dubbingStep, 
                workflows : workflows, 
                presetTimes: presetArray,
                requests: selectedRequests,
                allRequests: ctrl.requests,
                comments: Object.keys(commentsFromSelectedRequests).reverse()
                }
        const roomsParameters =  {
                  subproject_id: products[0].subproject_id,
                  project_id: products[0].subproject.project_id, 
                  action_id: actionId, 
                  actionType: actionType,
                  dubbing_step: dubbingStep, 
                  doublage_type_id: workflows[0].doublage_type_id, 
                  exploitation_id: workflows[0].exploitation_id, 
                  normal: 1, 
                  format_mix_id: ValueListService.getformatMixBitValue(workflows[0].format_mix_id),
                  project_type_id: products[0].subproject.project.type_id
          }
      const allowedStageList = []
      const allowedTechniciansList = []
        PaoService.getQualifiedRooms(roomsParameters, Object.keys(daysList), allowedStageList, JSON.parse(JSON.stringify($rootScope.allRoomsByName)), roleAllAllowed, function () {   
          // liste des salles déjà, utilisées ou compatu=ibles etc
            dataSent2modal.allowedStageList = allowedStageList
            const techsParameters =  {
              subproject_id: products[0].subproject_id,
              project_id: products[0].subproject.project_id, 
              action_id: actionId, 
              actionType: actionType,
              dubbing_step: dubbingStep, 
              doublage_type_id: workflows[0].doublage_type_id, 
              exploitation_id: workflows[0].exploitation_id, 
              normal: 1, 
              format_mix_id: ValueListService.getformatMixBitValue(workflows[0].format_mix_id),
              project_type_id: products[0].subproject.project.type_id
            }
            PaoService.getQualifiedTechnicians(techsParameters, JSON.parse(JSON.stringify($rootScope.allTechnicians)), allowedTechniciansList, roleAllAllowed, function () {
              dataSent2modal.allowedTechniciansList = allowedTechniciansList
              const weeksToSearch = {}
              let lastMonday = null
              Object.keys(daysList).forEach((day) => {
                  const monday = HelperService.formatInternalDate(HelperService.getMonday(day))
                  if (!weeksToSearch[monday]) {
                    weeksToSearch[monday] = true
                  }
                  weeksToSearch[monday] = true
                  lastMonday = monday
              })
              if (lastMonday) {
                  weeksToSearch[moment(lastMonday).add(7, 'days').format("YYYY-MM-DD")] = true
              }
              roomsParameters.dates = Object.keys(weeksToSearch)
              FarmerService.getRoomsAvailability(roomsParameters, function (bookings) {
                dataSent2modal.bookings = bookings
                  dialReturn = ngDialog.open({
                    template: 'requestDates/requestDates.html',
                    // className: 'ngdialog-theme-default dialogwidth80p',
                    className: 'ngdialog-theme-demand popup',
                    width: '90%',
                    height: '90%',        
                    scope: $scope,
                    data: dataSent2modal,
                    controller: 'requestDatesCtrl',
                    closeByDocument: false,
                  })
                  dialReturn.closePromise.then(function (data) {
                    ctrl.UpdateToSave = true
                    ctrl.dateChoiceModalClicked = false
                    // sendStandardNotif(new NotificationService(), requests, services, $rootScope._T["1e6d5sog"], objectDates.descNotif, $filter, "date_wishes", $rootScope);
                    // et le broadcast
                    //  $rootScope.$broadcast('date-wish-updated', {requests: requests});
                    // et message pour dire que c'est OK
                    if (data.value != 'close') {
                      ctrl.initPopup()
                    }
                    
                  })
              }, function () {})
            })
          }
        )

    }  

    ctrl.saveNewDesiredTime = function (requests) {
      
      const toDelete = []
      Object.keys(previouslySelectedDates).forEach((timestamp) => {
        const newDay = moment(parseInt(timestamp)).format("YYYY-MM-DD HH:mm:ss")
        if (previouslySelectedDates[timestamp].status == 'todelete') {
          toDelete.push(previouslySelectedDates[timestamp])
        }
      })

      const modifications = {
        addedDates: ctrl.datesToUpdate,
        datesChanged: true,
        deletedDates: toDelete,
        requestData: {
          dateStartEnd: ctrl.dateStartEnd
        }
      }

      if (modifications.datesChanged) {
        /*
        let requestPromises = [];
        for(let i = 0; i < requests.length; i += 1){
          let request = requests[i];
          requestPromises.push(RequestService.updateRequestDefer(request.id, modifications.requestData));
        }
        */

        /*
        $q.all(requestPromises).then(function(requestPromises) {
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
        */
      }

    };

}


Lantern.component('dateRequestPopupNew', {
  templateUrl: 'components/dateRequestPopupNew.html',
  controller: DateRequestPopupNew,
  bindings: {
    requests: '<',
    setAlertMessage: '&',
    getSelectedRequests: '&',
    initPopup: '&'
  }
});
