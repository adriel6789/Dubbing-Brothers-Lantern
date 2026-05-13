Lantern.controller('RequestsValidatedListCtrl', 
  ['$rootScope', '$scope', '$q', '$state', '$filter', 'ngDialog', 'Request', 'Farmer', 
    'RequestGroup', 'ngTableParams', 'NotificationService', 'Comment', '$location', 
    '$window', 'Session', 'FarmerService','dataSync', 'RoomService', 'ValueListService',
  function($rootScope, $scope, $q, $state, $filter, ngDialog, Request, Farmer, 
    RequestGroup, ngTableParams, NotificationService, Comment, $location, 
    $window, Session, FarmerService,dataSync, RoomService, ValueListService) {
      // page associée app/views/Technicien/requestsValidatedList.html
      // 20220512, affichage heure du laitier de 6 heures à 6 heures,

    $scope.mode = 'basic'  
    function waitForVariableDefined(callback) {
      if ($rootScope.user_entity && $rootScope.user_entity.person) {
        callback();
      } else {
        const unwatch = $rootScope.$watch('user_entity', function (newVal) {
          if (newVal) {
            unwatch(); // Stop watching once the variable is defined
            callback(newVal);
          }
        })
      }
    }

    function checkUserState () {
      waitForVariableDefined(function () {
        $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)  
        $scope.placeHolderDateFormat = getPlaceHolderFormatDate($rootScope.user_entity.person.branch_id)
        $scope.placeHolderDateFormat = getPlaceHolderFormatDateByMode($rootScope.user_entity.person.branch_id == 3 ? 'us' : 'basic')
        $scope.patternDateFormat = getPatternFormatDateByMode($rootScope.user_entity.person.branch_id == 3 ? 'us' : 'basic')
        $scope.mode = $rootScope.user_entity.person.branch_id == 3 ? 'us' : 'basic'
        RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
        ValueListService.getFormatMixFromDatabase(ValueListService.gotFormatMixFromDatabase,function () {})
      });
    }

    checkUserState()
    
    let subproject_id = null
    $scope.time = false
    $scope.dateFilter = jour

    $scope.patternFormatDate = '\d{2}:\d{2} [apm]{2}'
    $scope.farmers = {}

    let rangeDateValues_dateStart = moment(moment().subtract(180, 'days')).startOf("week").format("DD-MM-YYYY")
    let rangeDateValues_dateEnd = moment(moment(moment()).endOf("week")).add(1,'days').format("DD-MM-YYYY") // rajoute un jour pour avoir l'heure jusqu'au lendemain
    let rangeDates = { dateStart: rangeDateValues_dateStart, dateEnd: rangeDateValues_dateEnd}
    let rangeDateValues = { name: 'range_dates_farmer' , value: JSON.stringify(rangeDates) }
    
    // data to check while synchronizing
    let data2check = {
      'tech_writer_id' : "Nouveau technicien",
      'day'         : "Jour",
      'start_time'  : "Début de séance",
      'end_time'    : "Fin de séance",
      'audit'       : "Salle",
      'is_selected' : "Selectionné",
      'tech_reader_id'  : 'Tech reader',
      'tech_editor_id'  : 'editor',
      'artistic_director_id'  : 'artistic director',
      'is_wish'     : "Souhaité",
      'nb_returns'  : "Nombre de retours"
    }

    let role = Session.role();
    $scope.role = role

    $scope.indexInterne = 0;
    today = new Date();
    var dd = addZero(today.getDate());
    var mm = addZero(today.getMonth() + 1); //January is 0!
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    $scope.today = today;

    tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dd = addZero(tomorrow.getDate());
    mm = addZero(tomorrow.getMonth() + 1); //January is 0!
    yyyy = tomorrow.getFullYear();

    tomorrow = yyyy + '-' + mm + '-' + dd;
    $scope.tomorrow = tomorrow;

    function notSendBackFilter(request, index, array) {
      return (request.is_sent_back != 1);
    }

    var user_id = $.cookie('user_id');

    if ($rootScope.canDisplay(1)) {
      // vue admin, on limite pour éviter une saturation dus erveur :)
      const now = new Date()
      const date_creation = {
        'name': 'date_creation',
        'value': moment(now).format("YYYY-MM-DD")
      }
      const request_date_creation = {
        'name': 'request.date_creation',
        'value': moment(now).format("YYYY-MM-DD")
      }
      // vue admin
      var filtersFarmer = [{
        "name": "is_selected",
        "value": "1"
      }, 
      {
        "name": "is_finished",
        "value": "0"
      }, 
      {
        "name": "day",
        "value": "not null"
      }, date_creation];
      var filtersInternal = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, 
      {
        "name": "is_sent_back",
        "value": "0"
      }, 
      {
        "name": "in_group",
        "value": "0"
      },request_date_creation];
      var filtersGroup = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, {
        "name": "is_sent_back",
        "value": "0"
      },date_creation];
    } else {
      var filtersFarmer = [{
        "name": "is_selected",
        "value": "1"
      }, {
        "name": "is_finished",
        "value": "0"
      }, {
        "name": "tech_writer_id",
        "value": user_id
      }, {
        "name": "day",
        "value": "not null"
      }, rangeDateValues];
      var filtersFarmerRead = [{
        "name": "is_selected",
        "value": "1"
      }, {
        "name": "is_finished",
        "value": "0"
      }, {
        "name": "tech_reader_id",
        "value": user_id
      }, rangeDateValues];
      var filtersInternal = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, {
        "name": "is_sent_back",
        "value": "0"
      }, {
        "name": "tech_writer_id",
        "value": user_id
      }, rangeDateValues];
      var filtersInternalRead = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, {
        "name": "is_sent_back",
        "value": "0"
      }, {
        "name": "tech_reader_id",
        "value": user_id
      }, rangeDateValues];
      var filtersGroup = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, {
        "name": "is_sent_back",
        "value": "0"
      }, {
        "name": "tech_writer_id",
        "value": user_id
      }, rangeDateValues];
      var filtersGroupRead = [{
        "name": "is_validated_for_tech",
        "value": "1"
      }, {
        "name": "is_sent_back",
        "value": "0"
      }, {
        "name": "tech_reader_id",
        "value": user_id
      }, rangeDateValues];
    }



    doneTechFarmers =function (result) {
        //open a swal popup si un changement a eu lieu
        //En fin de popup si OK signale que le tech a vu le changement
        // si l'uid est passé à un autre faudra sans doute un autre changement et la date
        // date last vue par tech
        let has_changed = false;
        let data_changed = [];
        if (result && result.length > 0) {

          let already_seen = {};
            //farmerEntities[farmer.booking_id + farmer.day + farmer.start_time + farmer.request.action_type_id]
          result.forEach(
            function (booking) {
              if ($scope.farmers[booking.booking_id]) {
                if (!already_seen[booking.booking_id]) {
                  Object.keys(data2check).forEach(function (field) {
                      
                      if (booking[field] != $scope.farmers[booking.booking_id][field]) {
                        let value = data2check[field];
                        let message_tech = '';
                        if (field == 'tech_writer_id') {
                          message_tech = "\n" + $rootScope._T["5eyozlcv"]
                          let name = booking['tech_writer_user']['person'].firstname + " " + booking['tech_writer_user']['person'].lastname;
                          data_changed.push(value +" : " + name + " " + message_tech);
                        } else {
                          data_changed.push(value +" : "+ $scope.farmers[booking.booking_id][field] + " => " +booking[field]);
                        }
                        
                        has_changed = true;
                      }
                  })
                  already_seen[booking.booking_id] = true;
                }
              }
            }
          )
          
          if (has_changed) {
              let text = data_changed.join("\n");
              //width: '800px'
              swal({
                title: "Sesssion changed",
                text  : text,  
                type: "warning",
                closeOnConfirm: true,
                confirmButtonText: "Reload the page",
                showCancelButton: false,
                cancelButtonText: $rootScope._T["s7qwfdho"],
              }, function(isConfirm) {
                if (isConfirm) {
                    //stop synchro and reload
                    dataSync.stopSynchro(function () {});
                    $state.reload();
                }
              })              

          }

        }

    }

    syncTechFarmers = function  ($scope,apiService) {
      apiService(Object.keys($scope.farmers),function (result) {
        return doneTechFarmers(result);
      });
    }

    /**
     * Fonction permettant de récupérer les demandes dites "Farmers" et les demandes dites "Interne" ou "Volume"
     * TODO : Revoir le fonctionnement pour les demandes de groupes, adopter le comportement des demandes groupées par dates/workflow/Etape/Action + technicien
     */
    function getRequests(reader) {
      var deferred = $q.defer()

      if (reader && role != "all") {
        filtersFarmer = filtersFarmerRead
        filtersInternal = filtersInternalRead
        filtersGroup = filtersGroupRead
      }

      //TODO différencier admin des autres
      // Section demandes farmer
      // récupération des demandes farmers
      $scope.farmerEntitiesTemp = [];
      var farmers = Farmer.getFarmersBy({
        filters: [filtersFarmer]
      }, 
      function(farmers) {
        var groupDone = [];
        var farmerEntities = {};
        farmers.forEach(function(farmer) {
          if (farmer.request != null) {
            if (farmerEntities[farmer.booking_id + farmer.day + farmer.start_time + farmer.request.action_type_id] == null) {
              farmerEntities[farmer.booking_id + farmer.day + farmer.start_time + farmer.request.action_type_id] = [];
            }

            var hasReturns = false;

            if (farmer.request.ownReturn != null && farmer.request.ownReturn.length != 0) {
              hasReturns = true;
            }
            farmer.request.hasReturns = hasReturns;
            //Mise à jour de la date de consultation
            if (farmer.date_see_tech == null && user_id == farmer.tech_writer_id) {
              var updateFarmer = new Farmer();
              updateFarmer.date_see_tech = todaySQL;
              updateFarmer.$directUpdate({
                id: farmer.id
              });
            }
            
            let hourFound = null;
            if(farmer.start_time != null)
            hourFound = parseInt(farmer.start_time.split('h')[0])
            // heure du laitier, on retire un jour pour afficher ce qui commence après minuit au jour donné
            farmer.milkDay = farmer.day
            // juste le jour suivant
            if (hourFound < 6) {
              farmer.milkManDay = moment(farmer.day).subtract(1, "days").format("YYYY-MM-DD 00:00:00")
            }
            farmerEntities[farmer.booking_id + farmer.day + farmer.start_time + farmer.request.action_type_id].push(farmer);
            $scope.farmers[farmer.booking_id] = {
                        day: farmer.day,
                        start_time: farmer.start_time,
                        end_time: farmer.end_time,
                        audit: farmer.audit,
                        is_selected: farmer.is_selected,
                        tech_reader_id: farmer.tech_reader_id,
                        tech_writer_id: farmer.tech_writer_id,
                        tech_editor_id: farmer.tech_editor_id,
                        artistic_director_id: farmer.artistic_director_id,
                        is_wish: farmer.is_wish,
                        nb_returns  : farmer.request.hasReturns
            };
          }
        });
        $scope.a_tech_ids = [];
        $scope.a_Seance_note = [];
        angular.forEach(farmerEntities, function(farmerEntity) { 
          if(moment(farmerEntity[0].day).format("YYYY-MM-DD") == $scope.today && !$rootScope.canDisplay(8)){
            $scope.a_tech_ids.push(farmerEntity[0].tech_writer_id)
            $scope.a_Seance_note.push({"id_technician": farmerEntity[0].tech_writer_id, "id": farmerEntity[0].id})
          }    
          farmerEntity.globalState = $scope.globalStatusFarmer(farmerEntity);
          farmerEntity.start_day_farmer = farmerEntity[0].day
          farmerEntity.start_time_farmer = farmerEntity[0].start_time
          $scope.farmerEntitiesTemp.push(farmerEntity)
          // Notes pour technicien
          if(moment(farmerEntity[0].day).format("YYYY-MM-DD") == $scope.today && $rootScope.canDisplay(8)){
            var techDayNote = Farmer.getTechDayNote({
              date: moment($scope.today).format("YYYY/MM/DD"),
              id_technician: farmerEntity[0].tech_writer_id
            },function(techDayNote) {
              var tab = Object.keys(techDayNote).map(function(key) {
                return [techDayNote[key]]
              });
              var note = tab[0][0].note;
              $("#techNote").text(note);
              if($("#techNote").text() == ""){
                $("#techNote").text($rootScope._T['1gs1ik8l'])
              }
              $("#techNote").css("border", "solid 1px #e17035")
            });
          }   
        });
        // Notes pour autre que technicien
        if (!$rootScope.canDisplay(9)){
          var techDayNotes = Farmer.postTechDayNotes({
            date: moment($scope.today).format("YYYY-MM-DD"),
            ids_technicians: JSON.stringify($scope.a_tech_ids)
          },function(techDayNotes) {
            for(var i=0; i<techDayNotes.length; i++){
              for(var j=0; j<$scope.a_Seance_note.length; j++){
                if($scope.a_Seance_note[j].id_technician == techDayNotes[i].id_technician){
                  $scope.a_Seance_note[j].note=techDayNotes[i].note
                }
              }
            }
          });
        }
      });

      // Section demandes internes
      // Section demandes internes dont le type de planning des actions est non farmer, donc volume ou parallele
      // ce script n'est accessible que par le rôle technicien qui s'occupe que des planning de type farmer, et jamais volume
      // donc ce truc ne sert à rien
      $scope.requestsInternalTemp = []
        // Demandes solo
        /*
      var requestsSingle = Request.getRequestsBy({
        filters: [filtersInternal]
      }, function(requests) {
        var groups = []
        requests.forEach(function(request) {
         if(request.action_type != undefined && request.action_type.planning != "farmer") {
            request.display = 1
            if (request.in_group == 1) {
              request.display = 0
            }

            if (request.date_see_tech == null && request.tech_writer_user != null && user_id == request.tech_writer_user.id) {
              var updateRequest = new Request();
              updateRequest.date_see_tech = todaySQL;
              updateRequest.$update({
                requestId: request.id
              });
            }
            var hasReturns = false;
            if (requests != null) {
              if (request.ownReturn != null && request.ownReturn) {
                request.hasReturns = true
              }
            }
            $scope.requestsInternalTemp.push(request)
          }
        });
      });
      */

      // Demande groupe
      // TODO : À remplacer par les demandes groupées !
      /*
      var requestsGroup = RequestGroup.getAllRequestsBy({
        filters: [filtersGroup]
      }, function(groups) {
        groups.forEach(function(group) {
          var mainRequest = null
          var countRequest = 0
          group.requests.forEach(function(request) {
            if (request.action_type.planning != "farmer") {
              if (request.date_see_tech == null && request.tech_writer_user != null && user_id == request.tech_writer_user.id) {
                var updateRequest = new Request();
                updateRequest.date_see_tech = todaySQL;
                updateRequest.$update({
                  requestId: request.id
                });
              }
              if (mainRequest == null) {
                mainRequest = request
              } else {
                request.display = 0
                $scope.requestsInternalTemp.push(request)
              }
              countRequest++
            }
          });
          if (mainRequest != null) {
            mainRequest.from_group = group.id;
            mainRequest.number_request = countRequest;
            mainRequest.group = group;
            mainRequest.showGroup = false;
            mainRequest.display = 1;
            $scope.requestsInternalTemp.push(mainRequest);
          }
        });
      });
      */

      $q.all([
        farmers.$promise
        // requestsSingle.$promise,
        // requestsGroup.$promise
      ]).then(function() {
        deferred.resolve()
      })

      return deferred.promise
    }


    $scope.requestsFromFarmer = [];
    $scope.groupsRequestsFromFarmer = [];
    $scope.groupsFromFarmer = [];
    $scope.requests = [];

    var promise = getRequests(false);

    /**
     * On réalise deux chargements : les demandes en édition et les demandes en lecture
     */
    if (promise != null) {
      promise.then(function() {
        $scope.requestsInternal = $scope.requestsInternalTemp
        $scope.farmerEntities = $scope.farmerEntitiesTemp
        if (!$rootScope.canDisplay(1)) {
          var promise2 = getRequests(true);
          promise2.then(function() {
            $scope.requestsInternal = $scope.requestsInternal.concat($scope.requestsInternalTemp)
            $scope.farmerEntities = $scope.farmerEntities.concat($scope.farmerEntitiesTemp)
          })
        }
      })
      .then(function () {
        // when all is right, we can start synchronization
        if ($scope.farmerEntities && $scope.farmerEntities.length > 0) {
          subproject_id = $scope.farmerEntities[0][0].request.subproject;   
        
          //start datasync
          let synchronizeList = {
              'farmertech'  : syncTechFarmers
          }
          
          dataSync.stopSynchro(); // cargo cult command, ceinture, bretelle et bouée de sauvetage
          dataSync.addPage2watch($location.path());
          dataSync.setSubprojectDate("farmertech",subproject_id);
          dataSync.setCurrentSubprojectId(subproject_id)
          dataSync.startSync(0,$scope,synchronizeList )
        }
    });
    }

    function cleanWorkingHour (hour) {
      const ret = hour.match(/^(\d{2}):(\d{2})(?: ([ap]m))?$/)
      if (ret) {
        if (ret[3]) {
          // 12h am/pm, check that number doesn't exceed 12
          if (ret[3] === 'pm') {
            if (ret[1] == '12') {
              hour = '12:' + ret[2]
            } else {
              hour = (parseInt(ret[1]) + 12) + ':' + ret[2]
            }
          } else if (ret[3] === 'am') {
            if (ret[1] == '12') {
              hour = '00:' + ret[2]
            } else {
              hour = ret[1] + ':' + ret[2]
            }
          }
        }  
      } else {
        swal($rootScope._T["mx7q7rbm"], $rootScope._T["rq4jyhn6"], "error")
        return null
      }
      return hour
    }

    $scope.hours = {}
    $scope.insertTimeFarmerMultiple = function() {
      const reghhmm = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
      const regnum = /^[0-9]*$/
      
      // mise en forme
      if ($scope.hours.startWorkingTime && $scope.hours.endWorkingTime) {
        $scope.hours.startTime = cleanWorkingHour($scope.hours.startWorkingTime)
        $scope.hours.endTime = cleanWorkingHour($scope.hours.endWorkingTime)
      } else {
        swal($rootScope._T["mx7q7rbm"], $rootScope._T["rq4jyhn6"], "error");
      }

      if (reghhmm.test($scope.hours.startTime) && reghhmm.test($scope.hours.endTime) && ($scope.hours.breakTime == null || regnum.test($scope.hours.breakTime))) {

        var farmersSelected = $scope.getFarmersSelected();

        if (farmersSelected.length != 0) {
          var startMoment = moment($scope.hours.startTime, "HH:mm");
          var endMoment = moment($scope.hours.endTime, "HH:mm");
          var breakTime = 0;
          if ($scope.hours.breakTime != null) {
            breakTime = $scope.hours.breakTime;
          }
          if(!startMoment.isBefore(endMoment)){
            endMoment.add(1, 'days').toDate() // +1 day to endTimeF
          }


          var diffTime = parseInt(endMoment.diff(startMoment, 'minutes'));
          var size = farmersSelected.length;
          var splitBreakTime = Math.round(breakTime / size);
          var count = 0;
          farmersSelected.forEach(
            function(farmer, index) {
              var startCopy = angular.copy(startMoment);
              var endCopy = angular.copy(startMoment);
              var newStartTime = null;

              var calcSec = parseInt(index * Math.round(diffTime / size));
              if (calcSec != 0) {
                newStartTime = startCopy.add(calcSec, 'minutes').toDate();
              } else {
                newStartTime = startCopy;
              }
              var newEndTime = endCopy.add((index + 1) * Math.round(diffTime / size), 'minutes').toDate();

              var dayOfEndTime = $scope.today

              var newFarmer = new Farmer();
              newFarmer.break_time = splitBreakTime;
              newFarmer.working_time_start =  moment(newStartTime).format("YYYY-MM-DD HH:mm");
              newFarmer.working_time_end =  moment(newEndTime).format("YYYY-MM-DD HH:mm");
              newFarmer.$update({
                id: farmer.id
              }, function() {
                farmer.break_time = splitBreakTime;
                farmer.working_time_start = moment(newStartTime).format("YYYY-MM-DD HH:mm");
                farmer.working_time_end = moment(newEndTime).format("YYYY-MM-DD HH:mm");
                $scope.hours = {}
                $scope.unselectFarmers()
                $scope.click()
                $scope.time = false
                var farmerEntities = isRequestToReturn().farmerEntities
                if (farmerEntities.length > 0) {
                  swal({
                    title: $rootScope._T["n32ugb8r"],
                    type: "warning",
                    closeOnConfirm: true,
                    confirmButtonText: $rootScope._T["oc3hdqs9"],
                    showCancelButton: true,
                    cancelButtonText: $rootScope._T["s7qwfdho"],
                  }, function(isConfirm) {
                    if (isConfirm) {
                      angular.forEach(farmerEntities, function(farmerEntity) {
                        $scope.farmerFinishedEntity(farmerEntity)
                      })
                    }
                  })
                }
              });

            }
          );

        } else {
          alert($rootScope._T["xpwj4hx4"]);
        }


      } else {
        swal($rootScope._T["mx7q7rbm"], $rootScope._T["rq4jyhn6"], "error");
      }
    }

    if ($.cookie("returnDemand") != null && $.cookie("returnDemand") == "true") {
      $.cookie("returnDemand", "false", {
        path: '/',
        expires: 1
      });
      swal({
        title: $rootScope._T["n32ugb8r"],
        type: "warning",
        closeOnConfirm: true,
        confirmButtonText: $rootScope._T["oc3hdqs9"],
        showCancelButton: true,
        cancelButtonText: $rootScope._T["s7qwfdho"],
      }, function(isConfirm) {
        if (isConfirm) {
          //$scope.farmerEntities
          //var farmerEntities = isRequestToReturn().farmerEntities
          angular.forEach($scope.farmerEntities, function(farmerEntity) {
            $scope.farmerFinishedEntity(farmerEntity)
          })
        }
      })
    }

    $scope.calculBreakTimeFarmer = function(farmerEntity) {
      var break_time = 0
      angular.forEach(farmerEntity, function(farmer) {
        break_time += parseInt(farmer.break_time)
      })
      return break_time
    }

    $scope.count = function(collection) {
      var count = 0;
      if (collection != null) {
        angular.forEach(collection, function(item) {
          if (item != null) {
            count++;
          }
        });
      }
      return count;
    }

    $scope.globalStatusFarmer = function(farmerEntity) {
      var state = {}
      state.status = -1
      state.returns = 0
      angular.forEach(farmerEntity, function(farmer) {
        if (farmer.request != null && farmer.request.ownReturn != null) {
          state.returns += $scope.count(farmer.request.ownReturn)
        }
        if (farmer.is_done == 1 && farmer.is_partial != 1 && state.status == -1) //finie
        {
          state.status = 0
        } else if (farmer.is_done == 1 && farmer.is_partial == 1 && state.status <= 0) //non finie
        {
          state.status = 1
        } else if (farmer.is_not_done == 1 && state.status <= 1) // Non faite
        {
          state.status = 2
        } else if (farmer.is_not_done != 1 && farmer.is_done != 1 && state.status <= 2) // Non traitée
        {
          state.status = 3
        }

      });

      return state
    }

    $scope.globalStatusRequest = function(requests) {
      var state = {};
      state.status = -1;
      state.returns = 0;

      angular.forEach(requests, function(request) {
        if (request.ownReturn != null) {
          state.returns += $scope.count(request.ownReturn);
        }
        if (request.is_done == 1 && request.is_partial != 1 && state.status == -1) //finie
        {
          state.status = 0;
        } else if (request.is_done == 1 && request.is_partial == 1 && state.status <= 0) //non finie
        {
          state.status = 1;
        } else if (request.is_not_done == 1 && state.status <= 1) // Non faite
        {
          state.status = 2;
        } else if (request.is_not_done != 1 && request.is_done != 1 && state.status <= 2) // Non traitée
        {
          state.status = 3;
        }
      });
      return state;
    }

    $scope.selectFarmers = function(farmerEntity,isAll) {
      angular.forEach(farmerEntity, function(farmer) {
        farmer.selected = farmerEntity.selected
        if(isAll){
          $scope.changeInputUnit(farmer,'farmer') // activer les demandes farmer une à une dans le groupe
        }
      })
    }

    $scope.getFarmersSelected = function() {
      var farmersSelected = []
      angular.forEach($scope.farmerEntities, function(farmerEntity) {
        angular.forEach(farmerEntity, function(farmer) {
          if (farmer.selected) farmersSelected.push(farmer)
        })
      })
      return farmersSelected
    }

    $scope.changeInputGroup = function(requestInGroup, requestMain) {
      angular.forEach($scope.requestsInternal, function(request) {
        if (request.id == requestInGroup.id && request.display == 0) {
          request.selected = requestMain.selected
        }
      })
    }

  var SelectedFarmerRequest = [];
  var SelectedRequest = [];
  
    // Verifier si un element existe dans SelectedFarmerRequest ou SelectedRequest
  var checkIsFarmerEntityExist = function(farmerEntity,containerTable) {
      let container = (containerTable == 'farmer'? SelectedFarmerRequest : SelectedRequest);
      let elmentExist = false;
      if(container.length > 0){
          try {
              angular.forEach(container, function(farmer, index) {
                if(farmer.id == farmerEntity.id){
                      elmentExist = true;
                      throw elmentExist;
                }
              });
          } catch (e) {
            if (e)return e;
          }
      }
    return elmentExist;
  }

  var emptyContainerFarmerOrRequest = function(containerTable) {
    if(containerTable == 'farmer'){
      SelectedFarmerRequest = [];
    }
    if(containerTable == 'interne'){
      SelectedRequest = [];
    }
  }

    $scope.changeInputUnit = function(requestUnit,containerTable) {
      let elmentExist = false;
      let elmentIndex = null;
      let container = (containerTable == 'farmer'? SelectedFarmerRequest : SelectedRequest);

      if(container.length > 0){
        angular.forEach(container, function(request, index) {
        if(request.id == requestUnit.id){
              elmentExist = true; elmentIndex = index;
          }
        });

        if(elmentExist && elmentIndex != null && !requestUnit.selected ){
              container.splice(elmentIndex,1); // retirer l'element
        }
        if(!elmentExist && requestUnit.selected ){
              container.push(requestUnit); // ajoute l'element
        }
      }else if(container.length == 0  && requestUnit.selected){
        container.push(requestUnit); // ajoute l'element
      }
    }

    $scope.selectRequestsGroup = function(request,isAll) {
      angular.forEach(request.group.requests, function(requestGr) {
        requestGr.selected = request.all_selected
        $scope.changeInputGroup(requestGr, request)
        if(isAll){
          $scope.changeInputUnit(requestGr,'interne') // activer les demandes internes une à une dans le groupe
        }
      })

    }

    /**
     *                          is_done,  is_partial, is_not_done
     * actionToSelectionFarmer( 1,        0,          0) terminé,    pas déplaçable, mais duplicable
     * actionToSelectionFarmer( 1,        1,          0) en cours,   déplaçable et duplicable
     * actionToSelectionFarmer( 0,        0,          1) non faites, déplaçable
     */
    $scope.actionToSelectionFarmer = function(is_done, is_partial, is_not_done) {
      var farmersSelected = $scope.getFarmersSelected();
      var unTreatedFarmer = false;
      if (is_done == 1 && is_partial != 1) {
        for (let i = 0; i < farmersSelected.length; ++i){
          if (FarmerService.isMoreFarmersUntreatedInRequest(farmersSelected[i], farmersSelected[i].request)) {
            unTreatedFarmer = true;
            break;
          }
        }
      }

      var updateFarmers = function () {
        farmersSelected.forEach(function (farmer) {
          var updateFarmer = new Farmer()
          updateFarmer.is_done = is_done
          updateFarmer.is_partial = is_partial
          updateFarmer.is_not_done = is_not_done

          if (is_not_done == 1) {
            updateFarmer.working_time_start = null
            updateFarmer.working_time_end = null
            updateFarmer.break_time = null
          }

          updateFarmer.$directUpdate({
            id: farmer.id
          }, function() {
            farmer.is_done = is_done
            farmer.is_partial = is_partial
            farmer.is_not_done = is_not_done
            farmer.working_time_start = null
            farmer.working_time_end = null
            farmer.break_time = null

            if (is_not_done == 1) {
              farmer.selected = false
              $scope.unselectFarmers()
              $scope.time = false
            } else {
              $scope.time = true
            }
          })
        })
      }
      if (unTreatedFarmer) {
        swal({
          title: $rootScope._T["3fcctg13"],
          text: $rootScope._T["raeeid4w"],
          type: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: $rootScope._T["ouyrbtz3"],
          cancelButtonText: $rootScope._T["5erp771v"]
        }, function () {
          updateFarmers()
        });
      } else {
        updateFarmers();
      }
    }

    // Réccuperation de la demande parent  du group
    function getParentRequestGroup(group_id){
        let parentrequest = null;
        try {
            angular.forEach($scope.requestsInternal, function(request) {
                if(request.requestgroup_id == group_id && request.group != undefined ){
                    parentrequest = request;
                    throw parentrequest;
                }
            });
        } catch (e) {
          if (e != undefined && e.id == parentrequest.id)return e;
        }
      return parentrequest;
    }

    // Vérifier si toutes les demandes internes sont rendues
    function checkIsAllRequestsSentBack (parentrequest){
        let cptRequestNotSentBack = 0;
       if(parentrequest.group != undefined){
          angular.forEach(parentrequest.group.requests, function(req) {
              if(req.is_sent_back != 1){
                  cptRequestNotSentBack++;
              }
          });
        }
      return cptRequestNotSentBack;
    }

    // Vérifier si toutes les demandes farmer sont rendues
    function checkIsAllFarmerEntityFinished (farmerEntities){
        let cptFarmerEntityNotFinished = 0;
        let listIndexToRemove =[];
       if(farmerEntities.length > 0){
          angular.forEach(farmerEntities, function(farmer,index) {
              if(farmer.is_finished != 1){
                  cptFarmerEntityNotFinished++;
              }else{
                listIndexToRemove.push(index) // on garde l'index  pour supprimer les elements de farmerEntities par la suite
              }
          });
         listIndexToRemove.reverse().forEach(function(indexremove) {
              farmerEntities.splice(indexremove,1); // retirer l'element
         });
        }
      return cptFarmerEntityNotFinished;
    }

    $scope.actionToSelectionInternal = function(is_done, is_partial, is_not_done) {
      let is_AselectedResquest = false;
      let related_reqId;
      let parentRequest;
      if(SelectedRequest != undefined && SelectedRequest.length > 0 ){
            is_AselectedResquest = true;
      }
      var requestsSelected = $scope.getSelectedRequests()
      requestsSelected.forEach(function(request) {

        if(request.requestgroup_id != undefined && request.requestgroup_id != null){
          parentRequest = getParentRequestGroup(request.requestgroup_id); // Récupérer la request parent 
        }
        
        var updateRequest = new Request()
        updateRequest.is_not_done = is_not_done
        updateRequest.is_done = is_done
        updateRequest.is_partial = is_partial
        updateRequest.closing_date = todaySQL

        updateRequest.$update({
          requestId: request.id
        }, function() {
          request.is_not_done = is_not_done
          request.is_done = is_done
          request.is_partial = is_partial
          if (request.from_group != null && request.display == 1) {
            angular.forEach(request.group.requests, function(req) {
              let requestFound = checkIsFarmerEntityExist(req);
                  if(requestFound){
                    req.is_not_done = is_not_done
                    req.is_done = is_done
                    req.is_partial = is_partial
                  }
            })
          }
          var requestEntities = isRequestToReturn().requestEntities
          swal({
            title: $rootScope._T["4yhr47sm"],
            type: "warning",
            closeOnConfirm: true,
            confirmButtonText: $rootScope._T["oc3hdqs9"],
            showCancelButton: true,
            cancelButtonText: $rootScope._T["s7qwfdho"],
          }, function(isConfirm) {
            if (isConfirm) {
              angular.forEach(requestEntities, function(requestEntity) {
                let requestEntityFound = checkIsFarmerEntityExist(requestEntity);
                if(!requestEntityFound){
                    return false;
                }
                if (requestEntity.group != null) {
                  $scope.requestFinishedGroup(requestEntity.group,related_reqId,parentRequest)
                } else {
                  $scope.requestFinishedSingle(requestEntity,null,null,parentRequest)
                }
              })
            }
          })
          $scope.unselectRequestsInternal()
        })
      })
    }

    $scope.unselectFarmers = function() {
      angular.forEach($scope.farmerEntities, function(farmerEntity) {
        farmerEntity.selected = false
        angular.forEach(farmerEntity, function(farmer) {
          farmer.selected = false
        })
        farmerEntity.globalState = $scope.globalStatusFarmer(farmerEntity)
      })
    }

    $scope.click = function() {
      $scope.time = !$scope.time;
    }

    $scope.farmerNotDoneEntity = function(farmerEntity) {
      angular.forEach(farmerEntity, function(farmer) {
        $scope.farmerNotDoneSingle(farmer)
      })
      farmerEntity.globalState = $scope.globalStatusFarmer(farmerEntity)
    }

    $scope.farmerNotDoneSingle = function(farmer) {
      var updateFarmer = new Farmer()
      updateFarmer.is_not_done = 1
      updateFarmer.is_done = 0
      updateFarmer.is_partial = 0
      updateFarmer.working_time_start = null
      updateFarmer.working_time_end = null
      updateFarmer.break_time = null

      updateFarmer.$directUpdate({
        id: farmer.id
      }, function() {
        farmer.is_not_done = 1
        farmer.is_done = 0
        farmer.is_partial = 0
        farmer.working_time_start = null
        farmer.working_time_end = null
        farmer.break_time = null
          //swal("Okay !", "La séance a été marquée comme non faite", "success")
      });
    };

    $scope.farmerFinishedEntity = function(farmerEntities) {
      var farmerEntity = []
      var farmerRequests = []
      angular.forEach(farmerEntities, function(entity) {
          let farmerEntityFound = ((farmerEntities.length > 1 )?  checkIsFarmerEntityExist(entity,'farmer'): true);
        if (entity.id != null && farmerEntityFound) {
          farmerEntity.push(entity)
          farmerRequests.push(entity.request)
        }
      })
      var allNotifsFinished = [];
      var allNotifsInProgress = [];
      var allNotifsReplaned = [];

      var defer = $q.defer();
      var promises = [];

      angular.forEach(farmerEntity, function(farmer) {
        if (farmer.tech_writer_id == $.cookie('user_id') || $.cookie('role') == 'all') {
          if (farmer.is_done == 1 || farmer.is_not_done == 1 || farmer.is_partial == 1) {
            var promise = $scope.farmerFinishedSingle(farmer, true).then(function(notif) {
              if (notif != null) {
                if (notif.has_return) { //Notif avec un retour : elle est indépendante
                  notif.$save().then(function(){
                    notif.services = "technicien"
                    notif.type = "standard"
                    sendStandardNotif(
                      new NotificationService(),
                      [farmer.request],
                      notif.services,
                      notif.subject,
                      notif.description,
                      $filter,
                      notif.category,
                      $rootScope
                    );
                  });

                } else if (notif.replan) { //Notif à replanifier : on rassemble
                  allNotifsReplaned.push(notif);
                } else if (notif.in_progress) { //Notif en cours : on rassemble
                  allNotifsInProgress.push(notif);
                } else if (notif.is_done) { //Notif terminées : on rassemble
                  allNotifsFinished.push(notif);
                }
              }
              defer.resolve();
            });
            promises.push(promise);
          }
        } else {
          newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request.id, $rootScope._T["3tw2sfy9"])
          swal($rootScope._T["ew9vjuq9"], $rootScope._T["zmlqct2j"], "error");
        }
      })

      $q.all(promises).then(function() {
        var hideEntity = 1
        angular.forEach(farmerEntity, function(farmer) {
          if (farmer.is_finished != 1) {
            hideEntity = 0
          }
        })

        //cacher uniquement s'il ne reste aucune demande farmer du groupe 
        let cptFarmerNotFinised = checkIsAllFarmerEntityFinished(farmerEntities); // Verifier si toutes les farmer requests sont rendues 
        if(cptFarmerNotFinised == 0){
            farmerEntities.hide = 1
        }
        emptyContainerFarmerOrRequest('farmer') // vider le tableau SelectedFarmerRequest

        var allNotifs = [allNotifsFinished, allNotifsInProgress, allNotifsReplaned];
        allNotifs.forEach(function(aGroup) {
          if (aGroup.length > 0) {
            var newNotif = angular.copy(aGroup[0]);
            var ids = [];
            var descs = [];
            aGroup.forEach(function(notif) {
              ids.push(notif.request_id);
              descs.push(notif.product_desc);
            });

            var prefix = sharedStart(descs);
            newNotif.product_desc = aGroup[0].product_desc;
            var splitHumanDesc = aGroup[0].product_desc.split(" - ");
            for (var i = 1; i < aGroup.length; i++) {
              if (splitHumanDesc != null && splitHumanDesc.length == 3) {
                newNotif.product_desc += ", " + aGroup[i].product_desc.substr(aGroup[i].product_desc.length - splitHumanDesc[2].length);
              } else {
                newNotif.product_desc += " " + aGroup[i].product_desc.substr(prefix.length);
              }
            }

            if (aGroup.length == 1) {
              newNotif.group = false;
              newNotif.request_id = ids[0];
            } else {
              newNotif.group = true;
              newNotif.request_ids = ids.join(",");
              newNotif.request_id = null;
            }

            newNotif.$save().then(function(){
              newNotif.services = "technicien";
              newNotif.type = "standard";
              newNotif.subject = $rootScope._T["3fx1rq8a"]
              newNotif.category = "send_back";
              sendStandardNotif(
                new NotificationService(),
                farmerRequests,
                newNotif.services,
                newNotif.subject,
                newNotif.description,
                $filter,
                newNotif.category,
                $rootScope
              );
            });

          }
        });
      });

    }

    $scope.farmerFinishedSingle = function(farmer, returnNotif) {
      var deferred = $q.defer();

      if (farmer.is_done == 1 || farmer.is_not_done == 1 || farmer.is_partial == 1) {

        var updateFarmer = new Farmer();
        updateFarmer.is_finished = 1;
        updateFarmer.is_selected = 1;

        updateFarmer.$directUpdate({
          id: farmer.id
        }, function(farmerUpdated) {

          farmer.is_finished = 1;
          farmer.is_selected = 1;

          //On vérifie l'état de la demande associée et on met à jour la demande

          //Fonction de vérification s'il reste des séances non faites
          var allFinished = true;
          Farmer.querybyrequestid({
            request_id: farmer.request.id
          }, function(allFarmer) {
            allFarmer.forEach(function(oneFarmer) {
              // correction kcm 08/2020
              if (oneFarmer.booking_id != null) {
                if (oneFarmer.is_finished != 1) {
                  allFinished = false;
                }                
              }
            });

            //Préparation des variables
            var updateRequest = new Request()
            var notif = new NotificationService()

            //Préparation de la notification
            notif.services = "planning,production"
            notif.type = "home"
            notif.request_id = farmer.request.id
            notif.product_desc = farmer.request.product.human_description
            notif.project_id = farmer.request.product.subproject.project.id
            notif.subproject_id = farmer.request.product.subproject.id
            notif.subject = $rootScope._T["3fx1rq8a"]
            notif.planning_id = farmer.request.planning_id
            notif.archived = 0
            notif.etape_action = farmer.request.action_type.etape_type.value + " - " + farmer.request.action_type.value
            notif.category = "send_back"

            //On désactive par défaut l'archivage de la demande
            //TODO utilisé ? Je crois que non
            updateRequest.is_archived = 0

            //Variable pour indiquer ou non les mises à jour des demandes / envoi des notifs
            var updateStateRequest = true
            var sendNotif = true

            notif.description = $rootScope._T["xmq4mba0"]
            let tech_writer_name = '';
            if ($rootScope.lanternTechniciansById && $rootScope.lanternTechniciansById[farmer.tech_writer_id]) {
              tech_writer_name =  $rootScope.lanternTechniciansById[farmer.tech_writer_id].firstname + " " + $rootScope.lanternTechniciansById[farmer.tech_writer_id].lastname;
            } else {
              try {
                if(farmer.request.tech_writer != null && farmer.request.tech_writer.person != undefined ){
                  tech_writer_name =  farmer.request.tech_writer.person.firstname + " " + farmer.request.tech_writer.person.lastname;
                }else if(farmer.tech_writer != null && farmer.tech_writer.person != undefined ){
                  tech_writer_name =  farmer.tech_writer.person.firstname + " " + farmer.tech_writer.person.lastname;
                }
              } catch (error) {
                console.error(error);
              }
            }
            notif.description += $rootScope._T["ageoqhbl"] + ' ' + tech_writer_name + " <br/>";
            //Si la séance a déjà été notée précédemment comme terminée
            if (farmerUpdated && farmerUpdated.request && farmerUpdated.request.is_done == 1) {
              updateStateRequest = false
              sendNotif = false
            }
            //Si le travail est terminé
            // Mais à condition aussi qu'il ne reste plus aucune séance dans le futur
            if (farmerUpdated.is_done == 1 && farmerUpdated.is_partial != 1) {

              //La demande est terminé
              updateRequest.is_done = 1
              updateRequest.is_not_done = 0
              updateRequest.is_in_progress = 0
              updateRequest.is_sent_back = 1
              updateRequest.closing_date = todaySQL

              updateStateRequest = false

              notif.is_done = true
              notif.replan = false
              notif.description += $rootScope._T["5me8mcty"]

              //Fonction pour mettre toutes les autres séances en "non fait"
              allFarmer.forEach(function(oneFarmer) {
                if (oneFarmer.is_finished != 1 && oneFarmer.is_selected == 1 && oneFarmer.id != farmerUpdated.id) {
                  var upFarmer = new Farmer()
                  upFarmer.is_done = 0
                  upFarmer.is_partial = 0
                  upFarmer.is_not_done = 1
                  upFarmer.$directUpdate({
                    id: oneFarmer.id
                  })
                }
              });
            } else {
              if (allFinished) {
                //La demande doit être replanifié car le travail n'est pas terminé et il ne reste pas des séances
                if (updateStateRequest) {
                  updateRequest.is_not_done = 1
                  updateRequest.is_in_progress = 0
                  updateRequest.is_done = 0
                }

                notif.replan = true
                notif.description += $rootScope._T["6rypdonx"]
              } else {
                //La demande est en cours car il reste des séances à faire
                if (updateStateRequest) {
                  updateRequest.is_in_progress = 1
                  updateRequest.is_not_done = 0
                  updateRequest.is_done = 0
                }

                notif.in_progress = true
                notif.description += $rootScope._T["2dtjk03f"]
              }
            }
            var notifReturn = null
            if (Object.keys(farmer.request.ownReturn).length > 0) {
              notifReturn = new NotificationService()
              notifReturn = angular.copy(notif)
              notifReturn.has_return = true
              notif.has_return = true
            }

            if (Object.keys(farmer.request.ownObservation).length > 0) {
              notif.description += $rootScope._T["lccbwbpx"]
            } else {
              notif.description += $rootScope._T["ahwl5mah"]
            }

            if (notif.has_return) {
              notif.description += $rootScope._T["v4qd5380"]
            } else {
              notif.description += $rootScope._T["dciov1sc"]
            }

            if (Object.keys(farmer.request.sharedReturn).length > 0) {
              var hasReturnToCorrect = false;
              angular.forEach(farmer.request.sharedReturn, function(aReturn) {
                if (aReturn.is_not_done == 1 || aReturn.to_review == 1) {
                  hasReturnToCorrect = true;
                }
              })
              if (hasReturnToCorrect) {
                notif.description +=  $rootScope._T["s3o6hpl6"]
              }
            }

            //Patch pour désactiver si la demande est avec retour, on ne l'a met pas en terminée
            if (notif.has_return && notif.is_done) {
              notif.is_done = null
            }
            notif.origin_user_id = $.cookie('user_id')
            updateRequest.$update({
              requestId: farmer.request.id
            }, function() {
              if (!allFinished && updateStateRequest) {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request.id, $rootScope._T["xmybdj7h"])
              } else if (allFinished && updateStateRequest) {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request.id, $rootScope._T["39nfu0ix"])
              } else {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request.id, $rootScope._T["psaa8sbw"])
              }

              if (sendNotif && !returnNotif) {
                notif.$save().then(function(){
                  notif.services = "technicien"
                  notif.type = "standard"
                  sendStandardNotif(
                    new NotificationService(),
                    [farmer.request],
                    notif.services,
                    notif.subject,
                    notif.description,
                    $filter,
                    notif.category,
                    $rootScope
                  );
                });

                deferred.resolve();
              } else if (returnNotif) {
                deferred.resolve(notif);
              }

              //swal($rootScope._T["70jumwe9"], "La séance a bien été rendue !", "success", function() {
              //$state.reload();
              //})
              deferred.resolve();
            })
          })
        })
      }
      return deferred.promise;

    }

    $scope.getSelectedRequests = function() {
      var requestFiltered = $filter('filter')($scope.requestsInternal, {
        selected: true
      });
      return requestFiltered
    }

    $scope.unselectRequestsInternal = function() {
      angular.forEach($scope.requestsInternal, function(request) {
        request.selected = false
      })
    }

    $scope.requestFinishedGroup = function(group,related_reqId,parent_request) {
      var allNotifsFinished = [];

      var defer = $q.defer();
      var promises = [];

      angular.forEach(group.requests, function(request) {
        let requestFound = checkIsFarmerEntityExist(request);
        if(!requestFound){
            return false;
        }
        if (request.tech_writer_id == $.cookie('user_id') || $.cookie('role') == 'all') {
          var promise = $scope.requestFinishedSingle(request, true, group, parent_request).then(function(notif) {
            if (notif != null) {

              if (notif.has_return) { //Notif avec un retour : elle est indépendante
                notif.$save();
              } else if (notif.replan) { //Notif à replanifier : indépendante pour le moment
                notif.$save();
              } else if (notif.in_progress) { //Au cas ou : cas normalement impossible
                notif.$save();
              } else if (notif.is_done) { //Notif terminées : on rassemble
                allNotifsFinished.push(notif);
              }
            }
            defer.resolve();
          });
          promises.push(promise);
        } else {
          newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["3tw2sfy9"])
          swal($rootScope._T["ew9vjuq9"], $rootScope._T["m9slcg90"], "error");
        }
      });

      $q.all(promises).then(function() {
        var allNotifs = [allNotifsFinished];

        allNotifs.forEach(function(aGroup) {
          if (aGroup.length > 0) {
            var newNotif = angular.copy(aGroup[0]);
            var ids = [];
            var descs = [];
            aGroup.forEach(function(notif) {
              ids.push(notif.request_id);
              descs.push(notif.product_desc);
            });
            newNotif.request_ids = ids.join(",");
            newNotif.request_id = null;

            var prefix = sharedStart(descs);
            newNotif.product_desc = aGroup[0].product_desc;
            var splitHumanDesc = aGroup[0].product_desc.split(" - ");
            for (var i = 1; i < aGroup.length; i++) {
              if (splitHumanDesc != null && splitHumanDesc.length == 3) {
                newNotif.product_desc += ", " + aGroup[i].product_desc.substr(aGroup[i].product_desc.length - splitHumanDesc[2].length);
              } else {
                newNotif.product_desc += " " + aGroup[i].product_desc.substr(prefix.length);
              }
            }

            newNotif.group = true;
            newNotif.$save();
          }
        });
      });

    }

    $scope.requestFinishedSingle = function(request, returnNotif, groupRequest, parent_request ) {
      var deferred = $q.defer();
      if (request.tech_writer_id == $.cookie('user_id') || $.cookie('role') == 'all') {


        var updateRequest = new Request();
        var notif = new NotificationService();

        notif.services = "planning,production";
        notif.type = "home";
        notif.request_id = request.id;
        notif.product_desc = request.product.human_description;
        notif.project_id = request.product.subproject.project.id;
        notif.subproject_id = request.product.subproject.id
        notif.subject = $rootScope._T["3fx1rq8a"]
        notif.planning_id = request.planning_id;
        notif.archived = 0;
        notif.etape_action = request.action_type.etape_type.value + " - " + request.action_type.value;
        notif.description = $rootScope._T["xmq4mba0"]
        notif.description += $rootScope._T["ageoqhbl"] + ' ' + request.tech_writer_user.person.firstname + " " + request.tech_writer_user.person.lastname + " <br/>";

        updateRequest.is_sent_back = 1;
        updateRequest.is_archived = 0;

        var notifReturn = null;
        if ($scope.count(request.ownReturn) != 0) {
          notifReturn = new NotificationService();
          notifReturn = angular.copy(notif);
          notifReturn.has_return = true;
          notif.has_return = true;
        }

        if (request.is_partial == 1) {
          // A replanifier
          notif.replan = true;
          updateRequest.is_not_done = 1;
          updateRequest.is_done = 0;
          updateRequest.is_in_progress = 0;
          notif.description += $rootScope._T["6rypdonx"]
        } else if (request.is_not_done == 1) {
          // A replanifier
          notif.replan = true;
          notif.description += $rootScope._T["6rypdonx"]
        } else if (request.is_done == 1) {
          notif.is_done = true;
          notif.description += $rootScope._T["5me8mcty"]
        }

        if (request.ownObservation != null && request.ownObservation.length > 0) {
          notif.description += $rootScope._T["lccbwbpx"]
        } else {
          notif.description += $rootScope._T["ahwl5mah"]
        }

        if (notif.has_return) {
          notif.description += $rootScope._T["v4qd5380"]
        } else {
          notif.description += $rootScope._T["dciov1sc"]
        }

        //Patch pour désactiver si la demande est avec retour, on ne l'a met pas en terminée
        if (notif.has_return && notif.is_done) {
          notif.is_done = null;
        }
        updateRequest.$update({
          requestId: request.id
        }, function() {
          request.display = 0
          request.is_sent_back = 1;

          // affiche la demande non principale si les conditions sont satisfaites
          if(groupRequest != undefined){
            let isRequestDisplayed = false;
            groupRequest.requests.forEach(function(req) {
                if(!isRequestDisplayed && req.id !=request.id && req.is_sent_back != 1 ){
                  isRequestDisplayed = true; 
                  req.display = 1;
                  req.from_group = request.from_group;
                  req.group = request.group;
                }
            });
          }else{
            // si toutes les demandes sont rendues on cache la demainde parent aussi
            if( parent_request != undefined  && parent_request != null){
              let cptRequestNotSentBack = checkIsAllRequestsSentBack(parent_request); // Verifier si toutes des requests sont rendues 
              if(cptRequestNotSentBack == 0){
                 parent_request.display = 0;
              }
            }
          }

          emptyContainerFarmerOrRequest('interne') // vider le tableau des demandes internes SelectedRequest

          if (request.is_partial == 1 || request.is_not_done == 1) {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["5bfz980j"])
          } else {
            newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["6o7tjpu0"])
          }
          if (returnNotif) {
            deferred.resolve(notif);
          } else {
            notif.$save();
            //swal($rootScope._T["70jumwe9"], "La demande a bien été rendue !", "success");
            request.display = 0;
            deferred.resolve();
          }
          //$state.reload();
        });

      } else {
        newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["3tw2sfy9"])
        swal($rootScope._T["ew9vjuq9"], $rootScope._T["u9b2z1lv"], "error");
      }
      return deferred.promise;
    };

    $scope.isRequestsFarmersNotDone = function() {
      var results = {}
      results.found = false
      results.farmerEntities = []
      results.requestEntities = []
      if ($scope.farmerEntities != null && $scope.farmerEntities.length > 0) {
        angular.forEach($scope.farmerEntities, function(farmerEntity) {
          if ($scope.globalStatusFarmer(farmerEntity).status == 2) {
            results.farmerEntities.push(farmerEntity)
            results.found = true
          }
        })
      }

      if ($scope.requestsInternal != null && $scope.requestsInternal.length > 0) {
        angular.forEach($scope.requestsInternal, function(request) {
          if ((request.group != null && $scope.globalStatusRequest(request.group.request).status == 2) || request.is_not_done == 1) {
            results.requestEntities.push(request)
            results.found = true
          }
        })
      }

      return results
    }

    function isRequestToReturn() {
      var results = {}
      results.found = false
      results.farmerEntities = []
      results.requestEntities = []
      if ($scope.farmerEntities != null && $scope.farmerEntities.length > 0) {
        angular.forEach($scope.farmerEntities, function(farmerEntity) {
          if ($scope.globalStatusFarmer(farmerEntity).status <= 2) {
            results.found = true
            if (farmerEntity[0] != undefined && farmerEntity[0].working_time_start != null && farmerEntity[0].working_time_end != null) {
              results.farmerEntities.push(farmerEntity)
            }
          }
        })
      }

      if ($scope.requestsInternal != null && $scope.requestsInternal.length > 0) {
        angular.forEach($scope.requestsInternal, function(request) {
          if ((request.group != null && $scope.globalStatusRequest(request.group.request).status <= 2) || request.is_not_done == 1 || request.is_done == 1) {
            results.found = true
            results.requestEntities.push(request)
          }
        })
      }
      return results
    }

    $window.onbeforeunload = function(e) {
      if (isRequestToReturn().found) {
        swal({
          "title": $rootScope._T["bsgkg0a4"],
          "text": $rootScope._T["ya5vbqcu"],
          "html": true,
          "type": "warning"
        })
        if (e) {
          return e.returnValue =  $rootScope._T["ya5vbqcu"]
        } else {
          return $rootScope._T["ya5vbqcu"]
        }
      }
    }

    $scope.requestsFarmersFinished = function() {
      var objects = $scope.isRequestsFarmersNotDone()
      if (objects.farmerEntities.length > 0) {
        angular.forEach(objects.farmerEntities, function(farmerEntity) {
          $scope.farmerFinishedEntity(farmerEntity)
        })
      }

      if (objects.requestEntities.length > 0) {
        angular.forEach(objects.requestEntities, function(request) {
          if (request.group != null) {
            $scope.requestFinishedGroup(request.group)
          } else {
            $scope.requestFinishedSingle(request)
          }
        })
      }
    }

    $scope.days = []
    for (var i = 0; i < 3; i++) {
      $scope.days[i] = moment().add(i - 1, "days")

    }

    // check current page to manage synchronisation
    $scope.$on('$locationChangeStart', function( event ) {
      dataSync.addPage2watch($location.path());
    });     

    $scope.createTempRequest = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand dialogwidth80p',
        template: 'views/Technicien/createTempRequest.html',
        controller: 'CreateTempRequestCtrl',
        closeByDocument: false
      });
    }

  }
]);
