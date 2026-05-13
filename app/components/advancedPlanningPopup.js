function advancedPlanningPopup($rootScope, $scope, Farmer, $q, RequestService, Comment, NotificationService, 
    $filter, ProductService, Session, ApiRest, PaoService, ProjectsService, ngDialog, ValueListService, HelperService, RoomService, PersonsService, FarmerService) {
      // remplace plannOtFarmer
     // page html associée app/components/advancedPlanningPopup.html
    let ctrl = this;
    RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
    PersonsService.getTechnicians(function (result) {
      PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
    }, PersonsService.manageTechniciansError)
    let stages = []
    let globalStages = []
    const globalStagesHash = {}
    let RoomDayGlobalAvailability = {}
    ctrl.checkRoomsMessage = []
    ctrl.checkTechMessage = []
    ctrl.RoomAlreadyOccupied = null
    ctrl.projectTypes = {}
    ctrl.projectTypeSelected = null
    ctrl.actionType = ctrl.getSelectedRequests()[0].action_type
    ctrl.changeProjectType = function (value) {
      ProjectsService.updateProject(ctrl.project.id, { type_id: value.id } , function (result) {
        ctrl.project = result
      }, function (error) {})
    }

    ctrl.dateChoiceModalClicked = false

    const notYetPlannedFarmers = []
    const plannedFarmers = []

    ctrl.selectedDates = []
    ctrl.allNewDates = []
    const newDates =  {}
    ctrl.changeDay = function(dt) {
      let day = moment(dt).format("YYYY-MM-DD HH:mm:ss");
      if (newDates[day]) {
        delete newDates[day]
      } else {
        newDates[day] = true
      }
      ctrl.allNewDates = Object.keys(newDates)
    }

    ctrl.hasRequestToPlan = function () {
      if (ctrl.dateChoiceModalClicked) {
        return true
      }      
      if (notYetPlannedFarmers.length == 0) {
        return true
      }
      if (ctrl.actionType && ctrl.actionType.planning == 'volume') {
        return true
      }      
      return false
    }

    ctrl.hasSelectedRequestsToUpdate = function () {   
      if (ctrl.dateChoiceModalClicked) {
        return true
      }
      if (ctrl.actionType && ctrl.actionType.planning == 'volume') {
        return true
      }
      return false
    }

    const selectFarmers = {}

    $rootScope.$on('selectFarmer', function (event, dataSent) {
      const farmer = dataSent[0]
      if (farmer.booking_id) {
        const startHourI18nFormat = farmer.start_time ? farmer.start_time.replace('h',':') :  0
        const endHouri18nFormat = farmer.end_time ? farmer.end_time.replace('h',':') :  0
        let audit = null
        if (farmer.audit) {
          audit = farmer.audit.replace(/ *\(.+\)$/,'').replace(/ *\*$/,'')
        }
        const data = {
          id: farmer.id,
          booking_id: farmer.booking_id,
          farmer_id: farmer.id,
          request_id: farmer.request_id,
          day: farmer.day,
          original_date: farmer.original_date,
          start_time: startHourI18nFormat,
          end_time: endHouri18nFormat,
          audit: audit,
          booking_id: farmer.booking_id,
          room_id: farmer.room_id,
          requestedByProd: 0,
          artistic_director_id: parseInt(farmer.artistic_director_id),
          tech_writer_id: farmer.tech_writer_id ? parseInt(farmer.tech_writer_id) : null,
          tech_reader_id: farmer.tech_reader_id ? parseInt(farmer.tech_reader_id) : null,
          startDayTime: HelperService.fromHourToMinutes(startHourI18nFormat),
          endDayTime: HelperService.fromHourToMinutes(endHouri18nFormat),
          datetime_start: HelperService.buildDateTime(farmer.day, startHourI18nFormat),
          datetime_end: HelperService.buildDateTime(farmer.day, endHouri18nFormat),
          is_locked: false,
          selected: dataSent[1]
        }
        // les dates doivent être dans le futur ou le ême jour 
        if (moment(farmer.day).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD') || !moment(HelperService.buildDateTime(farmer.day, startHourI18nFormat)).isBefore(moment(Date.now()))) {
          selectFarmers[farmer.id] = data
        }          
        
      }
    })    

    let dubbingStep = 0
    let actionId = 0
    let actionType = null
    const products = []
    const workflows = []    
    const selectedRequests = {}
    let commentsFromSelectedRequests = {}
    ctrl.getDataForModal = function () {
      commentsFromSelectedRequests = {}
      ctrl.getSelectedRequests(ctrl.requests).forEach((request) => {
        products.push(request.product)
        selectedRequests[request.id] = request.product_id
        request.ownComment.forEach((comment) => {
          if (!comment.activity_log) {
            commentsFromSelectedRequests[comment.text] = true
          }
        })
        actionId = request.action_type_id
        actionType = request.action_type
        workflows.push(request.workflow)
        dubbingStep = PaoService.getDubbingStep(request.action_type.etape_type.name)
      })
    }


    ctrl.openDateChoiceModal = function (what) {
      ctrl.dateChoiceModalClicked = true
      const daysList = {}
      ctrl.getDataForModal()
      const roleAllAllowed = 5
      const dataSent2modal = { 
        requestCreation: false, // nouvelles requetes à créer
        planningForced: true,   // gestion pas le planning seulement
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
      if (what == 'update') {
        const original_dates = []
        let hasSelectValues = 0
        Object.keys(selectFarmers).forEach((id) => {
          const entry = selectFarmers[id]
          if (entry.selected) {
            hasSelectValues++
          }
        })
        if (hasSelectValues == 0 ) {
          plannedFarmers.forEach((farmer) => {
              original_dates.push(farmer)
              let datetime = moment(farmer.day).format("YYYY-MM-DD HH:mm:ss")
              daysList[datetime] = true    
          })         
        } else {
          Object.keys(selectFarmers).forEach((farmer) => {
            if (selectFarmers[farmer].selected) {
              original_dates.push(selectFarmers[farmer])
              let datetime = moment(farmer.day).format("YYYY-MM-DD HH:mm:ss")
              daysList[datetime] = true    
            }
          })
        }
        // peut supprimer une date et la remplacer par une autre ou changer un tech
        // comme il peut y avoir plusieurs demandes pour une journée
        // doit afficher les demandes dans le popup et préciser quelle tranche est à supprimer
        // Il faut donc avoir le booking_id
        dataSent2modal.original_dates = original_dates
      } else if (what == 'newDates') {
        dataSent2modal.original_dates = []
      } else {
        const original_dates = []
        notYetPlannedFarmers.forEach((farmer) => {
          original_dates.push(farmer)
          let datetime = moment(farmer.day).format("YYYY-MM-DD HH:mm:ss")
          daysList[datetime] = true    
      })
        dataSent2modal.original_dates = original_dates
      }
      PaoService.getQualifiedRooms(roomsParameters, Object.keys(daysList), allowedStageList, JSON.parse(JSON.stringify($rootScope.allRoomsByName)), roleAllAllowed, function () {   
        // liste des salles déjà, utilisées ou compatu=ibles etc
          dataSent2modal.allowedStageList = allowedStageList
          const techsParameters =  {
            subproject_id: products[0].subproject_id,
            project_id: products[0].subproject.project_id, 
            action_id: actionId, 
            dubbing_step: dubbingStep, 
            actionType: actionType,
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
                lastMonday= monday
            })
            if (lastMonday) {
              weeksToSearch[moment(lastMonday).add(7, 'days').format("YYYY-MM-DD")] = true
            }
            roomsParameters.dates = Object.keys(weeksToSearch)
            FarmerService.getRoomsAvailability(roomsParameters, function (bookings) {
              dataSent2modal.bookings = bookings
              dataSent2modal.stages = ctrl.getStages()
              const dialReturn = ngDialog.open({
                template: 'requestDates/requestDates.html',
                className: 'ngdialog-theme-demand popup',
                width: '90%',
                height: '90%',  
                scope: $scope,
                data: dataSent2modal,
                controller: 'requestDatesCtrl',
                closeByDocument: false
              })
              dialReturn.closePromise.then(function (data) {
                // ctrl.dateStartEnd = data.value.dateStartEnd
                ctrl.dateChoiceModalClicked = false
                if (data.value != 'close') {
                  ctrl.initPopup()
                }
              })  

            }, function () {})
          })
        }
      )











































    }     

    ctrl.HourOptions = getHourOptions($rootScope.user_entity.person.branch_id)
    ctrl.getI18nObjectFromHour = getI18nObjectFromHour($rootScope.user_entity.person.branch_id)

    ctrl.displayProductsCanBeAdded2booking = false
    ctrl.confirmRequest = false
    ctrl.saved  = false

    ctrl.manageSelection = function (request) {
      request.isSelected = !request.isSelected
    }

    ctrl.getFarmersToCopy = function () {
      const requests = ctrl.getSelectedRequests(ctrl.requests)
      let stringToCopy = "";
      angular.forEach(requests, function(request) {
          if(request.farmer_id != null) stringToCopy += request.farmer_id + "\n"
      })
      return stringToCopy
    }

    ctrl.setAlertCopy = function(isError) {
      if(isError)
          ctrl.setAlertMessage({message: $rootScope._T["oakgitt8"], isError:isError});
      else
          ctrl.setAlertMessage({message: $rootScope._T["7f9pjyhg"], isError:isError});
    };

    if ($rootScope.allRooms) {
      stages = JSON.parse(JSON.stringify($rootScope.allRooms)) 
      globalStages = JSON.parse(JSON.stringify($rootScope.allRooms))
      $rootScope.allRooms.forEach(function (room) {
        globalStagesHash[room.name] = JSON.parse(JSON.stringify(room))
      })
    }
    ctrl.getStages = function() {
      return stages;
    }

    ctrl.getGlobalStages = function() {
      return Object.values(globalStagesHash)
    }    

    // affichage de la liste du haut
    // si c'est homogène, affiche tout
    // Si ce n'est pas homogène, n'affiche pas les demandes non planifiées
    ctrl.displayARequest = function (request) {
      return true
    }

    const getBookingRoomOccupied = function(datelist) {
      // list of date to get from booking to check if a range of date is available
      const date2check = {}
      const params = {
          dates: datelist,
          type: 'room',
          branch_id: $rootScope.user_entity.person.branch_id
      }
      ApiRest.post('/booking/check/dates/action', null, params, function(response) {
          Object.keys(response).forEach(
              function (day) {
                  ctrl.rooms[day] = response[day]
              }
          )
      }, function(error){
          service.setErrorLoading(true);
      })
    }

    // ajoute une séance à un réservation existante
    const addSeance2other = function(hash, requests, done) {
      // list of date to get from booking to check if a range of date is available
      const date2check = {}
      const params = {
        requests: []
      }
      ApiRest.post('/vrequests/add/seance/' + hash, null, requests, function(response) {
        return done(null, response)
      }, function(error){
          service.setErrorLoading(true)
          return done()
      })
    }   
    
    const prepareDates = function (date) {
      const start_time = (date.start_time_h < 10 ? '0' + date.start_time_h : date.start_time_h)
                  + ':' +  (date.start_time_m < 10 ? '0' + date.start_time_m : date.start_time_m)
                  + ':00'
      const end_time = (date.end_time_h < 10 ? '0' + date.end_time_h : date.end_time_h)
                  + ':' + (date.end_time_m < 10 ? '0' + date.end_time_m : date.end_time_m)
                  + ':00'
      const chosenStartDate = new Date(date.day.replace('00:00:00', start_time)).getTime() / 1000
      let chosenEndDate   = new Date(date.day.replace('00:00:00', end_time)).getTime() / 1000
      if ( chosenEndDate < chosenStartDate) {
        chosenEndDate += 86400
      }
      return {startDate: chosenStartDate, endDate: chosenEndDate}
    }
    const prepareDates2 = function (date) {

    }

    const isTechAvailable = function (date, technician, done) {
      const start_time = (date.start_time_h.value < 10 ? '0' + date.start_time_h.value : date.start_time_h.value)
                  + ':' +  (date.start_time_m < 10 ? '0' + date.start_time_m : date.start_time_m)
                  + ':00'
      const end_time = (date.end_time_h.value < 10 ? '0' + date.end_time_h.value : date.end_time_h.value)
                  + ':' + (date.end_time_m < 10 ? '0' + date.end_time_m : date.end_time_m)
                  + ':00'
        
      const chosenStartDate = new Date(date.day.replace('00:00:00', start_time)).getTime() / 1000
      let chosenEndDate   = new Date(date.day.replace('00:00:00', end_time)).getTime() / 1000
      if ( chosenEndDate < chosenStartDate) {
        chosenEndDate += 86400
      }
      const date2check = {}
      const params = {
        start: chosenStartDate,
        end: chosenEndDate,
        user_id: technician.id,
        audit: date.audit.name,
        roomId: 0
      }
      ApiRest.post('/booking/unavailable/techs/', null, params, function(response) {
        return done(response)
      }, function(error){
          service.setErrorLoading(true);
          return done()
      })
    }

    const isRoomAvailable = function (date, room, done) {
      const start_time = (date.start_time_h.value < 10 ? '0' + date.start_time_h.value : date.start_time_h.value)
                  + ':' +  (date.start_time_m < 10 ? '0' + date.start_time_m : date.start_time_m)
                  + ':00'
      const end_time = (date.end_time_h.value < 10 ? '0' + date.end_time_h.value : date.end_time_h.value)
                  + ':' + (date.end_time_m < 10 ? '0' + date.end_time_m : date.end_time_m)
                  + ':00'
        
      const chosenStartDate = new Date(date.day.replace('00:00:00', start_time)).getTime() / 1000
      let chosenEndDate   = new Date(date.day.replace('00:00:00', end_time)).getTime() / 1000

      if ( chosenEndDate < chosenStartDate) {
        chosenEndDate += 86400
      }
      // start, end, ObjectId, room
      const date2check = {}
      const params = {
        start: chosenStartDate,
        end: chosenEndDate,
        object_id: room.id
      }
      ApiRest.post('/booking/room/availability', null, params, function(response) {
        return done(response)
      }, function(error){
        service.setErrorLoading(true)
        return done(error)
          
      })
    }
    
    ctrl.checkOccupied = function (name, day, date) {
      let start_time = null
      let end_time = null
      if (date.start_time_h && (date.start_time_m == 0 || date.start_time_m > 0)) {
        start_time = date.start_time_h.value + ':' + date.start_time_m
      }
      if (date.end_time_h && (date.end_time_m == 0 || date.end_time_m > 0)) {
        end_time = date.end_time_h.value + ':' + date.end_time_m
      }
      let chosen = null
      if (start_time && end_time) {
        chosen =  rebuildDateFromLanternPuzzle(date.day, start_time, end_time)
      }
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      // Verifie si les heures sont sélectionnées Sinon envoie message disant qu'il faut les heures
      // Quand fait le global doit avoir une fonctione
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false
      
      if (ctrl.rooms[day] && ctrl.rooms[day][name]) {
        // Si les heures existent, vérifie si l'heure correspond
        let isOccupied = false
        if (chosen) {
          ctrl.rooms[day][name].forEach(function (item) {
            const chunked = item.hour.split('-')
            const found = rebuildDateFromLanternPuzzle(day, chunked[0], chunked[1])
            if (found.start <= chosen.end && chosen.start <= found.end) {
              isOccupied = true
            }
          })
        } else {
          return name + ' *' 
        }
        if (isOccupied) {
          return name + ' *'                
        } else {
          return name + ' (free)'    
        }
      } else {
        return name
      }
    }

    const checkRoomAvailability = function (roomName, date) {
      const day = date.day
      let start_time = null
      let end_time = null
      if (date.start_time_h && (date.start_time_m == 0 || date.start_time_m > 0)) {
        start_time = date.start_time_h.value + ':' + date.start_time_m
      }
      if (date.end_time_h && (date.end_time_m == 0 || date.end_time_m > 0)) {
        end_time = date.end_time_h.value + ':' + date.end_time_m
      }
      let chosen = null
      if (start_time && end_time) {
        chosen =  rebuildDateFromLanternPuzzle(date.day, start_time, end_time)
      }
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      // Verifie si les heures sont sélectionnées Sinon envoie message disant qu'il faut les heures
      // Quand fait le global doit avoir une fonctione
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false
      
      if (chosen) {
        if (!RoomDayGlobalAvailability[roomName] || RoomDayGlobalAvailability[roomName] !== 'occupied') {
          globalStagesHash[roomName].name = roomName + ' (free)'
        }
        if (ctrl.rooms[day] && ctrl.rooms[day][roomName]) {
          ctrl.rooms[day][roomName].forEach(function (item) {
            const chunked = item.hour.split('-')
            const found = rebuildDateFromLanternPuzzle(day, chunked[0], chunked[1])
            if (found.start < chosen.end && chosen.start < found.end) {
              RoomDayGlobalAvailability[roomName] = 'occupied'
              globalStagesHash[roomName].name = roomName + ' *'
            }
          })
        }
      }
    }

    ctrl.checkGlobal = function (room) {
      // Si en a plusieurs récupère la liste
      let messages = []
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (date.is_checked) {
          isRoomAvailable(date, room, function (result) {
            if (result[0] == 'ko') {
              result[1].forEach(function (entry) {
                let roomName = null
                stages.forEach(function (room) {
                  if (!roomName && room.id == entry.object_id) {
                    roomName = room.name
                  }
                })
                ctrl.checkRoomsMessage.push({message: entry.datetime_start + ' ' + entry.datetime_end + ' ' + room.name +  ' ' + $rootScope._T["mh2245qa"], classMsg: 'label label-danger' })
              })
            } else {
              ctrl.checkRoomsMessage.push({message: moment(date.day).format("YYYY-MM-DD") + ' ' + room.name +  ' ' + $rootScope._T["u6jbzwjn"], classMsg: 'label label-success' })
            }
          })
        }
      })
    }

    ctrl.checkOneAudit = function (room, dateChosen) {
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (date.is_checked && date.day == dateChosen) {
          isRoomAvailable(date, room, function (result) {
            if (result[0] == 'ko') {
              result[1].forEach(function (entry) {
                let roomName = null
                stages.forEach(function (room) {
                  if (!roomName && room.id == entry.object_id) {
                    roomName = room.name
                  }
                })
                ctrl.checkRoomsMessage.push({message: entry.datetime_start + ' ' + entry.datetime_end + ' ' + room.name +  ' ' + $rootScope._T["mh2245qa"], classMsg: 'label label-danger' })
              })
            } else {
              ctrl.checkRoomsMessage.push({message: moment(date.day).format("YYYY-MM-DD") + ' ' + room.name +  ' ' + $rootScope._T["u6jbzwjn"], classMsg: 'label label-success' })
            }
          })
        }
      })
    }

    ctrl.isOccupied = function (name, day) {
      if (ctrl.rooms[day] && ctrl.rooms[day][name]) {
        return ctrl.rooms[day][name]
      } else {
        return false
      }
    }

    ctrl.checkGlobalTech = function (technician, type) {
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      angular.forEach(ctrl.dateStartEnd, function(date) {
          if (date.is_checked) {
            isTechAvailable(date, technician, function (result) {
              if (result[0] == 'ko') {
                let dates_message = ''
                result[1].forEach(function (entry) {
                  dates_message += entry.datetime_start + ' ' + entry.datetime_end + ' | '
                  let roomName = null
                  stages.forEach(function (room) {
                    if (!roomName && room.id == entry.object_id) {
                      roomName = room.name
                    }
                  })
                  ctrl.checkTechMessage.push({ message: 'tech occupé aux heures demandées ' + moment(date.day).format("YYYY-MM-DD") + ' -  ' + roomName, classMsg: 'label label-danger'})
                })
              }
            })
          }
        }
      )
    }


    // send booked dates
    const bookDates = function (data2send, done) {
      ctrl.saved  = true
      ApiRest.post('/vrequests/save/bookings', null, data2send, function(response) {
        return done(response)
      }, function(error){
          service.setErrorLoading(true);
          return done()
      })
    }

    const etapesActions = []
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
    // ng-show="request.is_planned == '0'"
    // Au moins une des demandes n'est pas planifiée

    ctrl.requestsWithoutRoom = null
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
        ValueListService.initEtapesActions(etapesActionsResponse)
      })

      PaoService.getDubbingSteps(function (dubbingSteps) {
        ctrl.dubbingSteps = dubbingSteps
      })
      PaoService.getProjectTypes(function (projectTypes) {
        ctrl.projectTypes = projectTypes
      })
      PaoService.getBookingConditions(gotBookingConditions, function () {})
      ValueListService.getPresetTimes(gotPresetTimes, function () {})   
      ctrl.requestsWithoutRoom = ctrl.getRequestsWithoutRoom()

      if (Array.isArray(ctrl.requestsWithoutRoom)) {
        ctrl.displayProductsCanBeAdded2booking = true
      }
      ctrl.project = mainRequest.product.subproject.project

      ctrl.artisticDirectors = ctrl.getArtisticDirectors() 
      ctrl.contributors = ctrl.getContributors()  
      ctrl.originalDates = []
      ctrl.dateStartEnd = []
      ctrl.showPanelDate = false
      ctrl.allDates = {
        day: null,
        start_time_h: null,
        start_time_m: 0,
        end_time_h: null,
        end_time_m: 0,
        audit: null,
        is_checked: true
      }
      ctrl.allDA = null
      ctrl.allWriter = null
      ctrl.allReader = null

      ctrl.isShowDatesDetails = true
      ctrl.newDate = null
      ctrl.idBooking = 0

      // attention pour le da, on utilise le person_id, pour le reader et le writer, c'est le user_id
      // Affiche une farmer par date quel que soit le nombre de produits intégrés
      // même si derrière on a plusieurs entrées farmers
      angular.forEach(mainRequest.ownFarmerbookings, function(farmer) {
        
        const timestamp = moment(farmer.day).format('x')
        ctrl.selectedDates.push(parseInt(timestamp))
        const startHourI18nFormat = farmer.start_time ? farmer.start_time.replace('h',':') :  0
        const endHouri18nFormat = farmer.end_time ? farmer.end_time.replace('h',':') :  0
        const datetime_timestamp = moment(HelperService.buildDateTime(farmer.day, startHourI18nFormat)).format('x')
        
        let audit = null
        if (farmer.audit) {
          audit = farmer.audit.replace(/ *\(.+\)$/,'').replace(/ *\*$/,'')
        }        
        let data = {
          id: farmer.id,
          booking_id: farmer.booking_id,
          farmer_id: farmer.id,
          request_id: farmer.request_id,
          day: farmer.day,
          original_date: farmer.original_date,
          start_time: startHourI18nFormat,
          end_time: endHouri18nFormat,
          audit: audit,
          room_id: farmer.room_id,
          is_wish: farmer.is_wish,
          is_done: farmer.is_done,
          is_not_done: farmer.is_not_done,
          is_selected: farmer.is_selected,
          is_partial: farmer.is_partial,
          is_finished: farmer.is_finished,
          date_see_tech: farmer.date_see_tech,          
          requestedByProd: 0,
          artistic_director_id: parseInt(farmer.artistic_director_id),
          tech_writer_id: parseInt(farmer.tech_writer_id),
          tech_reader_id: parseInt(farmer.tech_reader_id),
          startDayTime: HelperService.fromHourToMinutes(startHourI18nFormat),
          endDayTime: HelperService.fromHourToMinutes(endHouri18nFormat),
          datetime_start: HelperService.buildDateTime(farmer.day, startHourI18nFormat),
          datetime_end: HelperService.buildDateTime(farmer.day, endHouri18nFormat),
          is_locked: false
        }
        
        if (!farmer.booking_id && farmer.is_wish != 0  && (moment(farmer.day).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD') || datetime_timestamp >= Date.now())) {
          notYetPlannedFarmers.push(data)
        }
        if (datetime_timestamp >= Date.now() && farmer.booking_id) {
          plannedFarmers.push(data)
        }
      })
      if (ctrl.requests.length <= 1) {
        ctrl.displayProducts2display = false
      }
      let isRequest2add = false
      ctrl.requests.forEach(function (request) {
        if (request.is_planned == 0) {
          isRequest2add = true
        }
      })
      if (!isRequest2add) {
        ctrl.displayProducts2display = false
      }
    }

    ctrl.getPresetTimes = presetTimeBase(Session.branchId())
    init(ctrl.requests[0])

    ctrl.showDatesDetails = function() {
      ctrl.isShowDatesDetails = !ctrl.isShowDatesDetails;
    }

    ctrl.isDifferentWeek = function(date, previousDate) {
      return moment(date).format("w") != moment(previousDate).format("w");
    }

    ctrl.setTime = function(date, preset) {
      date.audit = null
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      if ($rootScope.allRooms) {
        stages = JSON.parse(JSON.stringify($rootScope.allRooms))
        globalStages = JSON.parse(JSON.stringify($rootScope.allRooms))
        $rootScope.allRooms.forEach(function (room) {
          globalStagesHash[room.name] = JSON.parse(JSON.stringify(room))
        })
      }
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false      
      setTimeDateWishByBranch(Session.branchId(), date, preset)
      if (date.start_time_h) {
        date.start_time = date.start_time_h.value + 'h' + date.start_time_m
      } else {
        date.start_time = null
      }
      if (date.end_time_h) {
        date.end_time = date.end_time_h.value + 'h' + date.end_time_m
      } else {
        date.end_time = null
      }
      
      if (date.day == null) {
        ctrl.setAllTimes(0)
        RoomDayGlobalAvailability = {}
        // les heures de chaque jour ont été mises à jour avec setAllTimes
        angular.forEach(ctrl.dateStartEnd, function(aDate) {
          if (aDate.is_checked) {
            globalStages.forEach(function (room) {
              if (!RoomDayGlobalAvailability[room.name]) {
                RoomDayGlobalAvailability[room.name] = null
              }
              checkRoomAvailability(room.name, aDate)
            })
          }
        })
        
      }
    } 

    ctrl.setAllTechWriter = function () {
        console.log('set tech writer sur tous')
    }
    ctrl.setAllTechReader = function () {
      console.log('set tech reader sur tous')
    }        

    ctrl.setAllTimes = function(periodOfTheDay) {
      // Vérifier les disponiblités toutes dates
      ctrl.allDates.audit = null
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      if ($rootScope.allRooms) {
        stages = JSON.parse(JSON.stringify($rootScope.allRooms))
        globalStages = JSON.parse(JSON.stringify($rootScope.allRooms)) 
      }
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false      
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (date.is_checked) {
          if (periodOfTheDay == 1) {
            date.start_time_h = ctrl.allDates.start_time_h;
          } else if (periodOfTheDay == 2) {
            date.start_time_m = ctrl.allDates.start_time_m;
          } else if (periodOfTheDay == 3) {
            date.end_time_h = ctrl.allDates.end_time_h;
          } else if (periodOfTheDay == 4) {
            date.end_time_m = ctrl.allDates.end_time_m;
          } else {
            date.start_time_h = ctrl.allDates.start_time_h;
            date.start_time_m = ctrl.allDates.start_time_m;
            date.end_time_h = ctrl.allDates.end_time_h;
            date.end_time_m = ctrl.allDates.end_time_m;
          }
          if (date.start_time_h) {
            date.start_time = date.start_time_h.value + 'h' + (date.start_time_m || '00')
          } else {
            date.start_time = null
          }
          if (date.end_time_h) {
            date.end_time = date.end_time_h.value + 'h' + (date.end_time_m || '00' )
          } else {
            date.end_time = null
          }
        }
      });
    }

    ctrl.setAllStages = function() {
      // vérifie toutes les dates ctrl.checkOccupied = function (name, day, date) {
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false      
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (date.is_checked) {
          date.audit = ctrl.allDates.audit;
        }
      });
    }

    ctrl.setAllDirectors = function() {
      // attention au 0!!!
      if (!(ctrl.allDates.start_time_h.value && ctrl.allDates.audit)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"]
          , isError:true});
          ctrl.allDA = null
      }
      angular.forEach(ctrl.dateStartEnd, function(date) {
        date.artistic_director_id = ctrl.allDA;
      });
    }    

    ctrl.checkDirector = function (director, date) {
      if (!(date.start_time_h.value && date.audit)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"]
          , isError:true});
          date.artistic_director_id = null
      }
    }

    ctrl.setAllWriters = function(technician) {
      if (!(ctrl.allDates.start_time_h.value && ctrl.allDates.audit)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"] + ' caw' 
          , isError:true});
          ctrl.writer_id = null
      }
      // compliqué et long, faut boucler sur angular et les tester 1 par 1
      // ctrl ne contient pas day, très naturellement
      angular.forEach(ctrl.dateStartEnd, function(date) {
        date.tech_writer_id = ctrl.writer_id;
      });
    }  

    ctrl.checkWriter = function (technician, date) {
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      if (!technician) return
      if (!(date.start_time_h && date.start_time_h.value && date.audit && date.end_time_h.value >= 0)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"] + ' cw' 
          , isError:true});
          date.tech_writer_id = null
      } else {
        isTechAvailable(date, technician, function (result) {
          if (result[0] == 'ko') {
            let dates_message = ''
            result[1].forEach(function (entry) {
              dates_message += entry.datetime_start + ' ' + entry.datetime_end + ' | '
            })
            ctrl.setAlertMessage({message: $rootScope._T["p9yte9e5"] + " \n" + dates_message, isError:true});
          }
        })
      }
    }
    
 
    ctrl.setAllReaders = function(technician) {
      if (!(ctrl.allDates.start_time_h.value && ctrl.allDates.audit)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"] + ' car' 
          , isError:true});
          ctrl.reader_id = null
      }

      angular.forEach(ctrl.dateStartEnd, function(date) {
        date.tech_reader_id = ctrl.reader_id
      });
    }    


    ctrl.checkReader = function (technician, date) {
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      if (!technician) return 
      if (!(date.start_time_h && date.start_time_h.value && date.audit && date.end_time_h.value >= 0)) {
        ctrl.setAlertMessage({message: 
          $rootScope._T["ygnhvvnd"] + ' cr'
          , isError:true});
          date.tech_reader_id = null        
          return
      }
      isTechAvailable(date, technician, function (result) {
        if (result[0] == 'ko') {
          let dates_message = ''
          result[1].forEach(function (entry) {
            dates_message += entry.datetime_start + ' ' + entry.datetime_end + ' | '
          })
          ctrl.setAlertMessage({message: $rootScope._T["p9yte9e5"] + " \n" + dates_message, isError:true});
        }
      })
    }     


    ctrl.addDate = function () {
      ctrl.checkRoomsMessage = []
      ctrl.checkTechMessage = []
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false      
      if (!ctrl.disableNewDate()) {
        const mainRequest = ctrl.requests[0]
        const data = {
          id: ctrl.idBooking++,
          farmers: null,
          day: $filter('date')(ctrl.newDate, "yyyy-MM-dd 00:00:00"),
          start_time: ctrl.allDates.start_time_h + "h" + ctrl.allDates.start_time_m,
          end_time: ctrl.allDates.end_time_h + "h" + ctrl.allDates.end_time_m,       
          start_time_h: ctrl.allDates.start_time_h !== null ? ctrl.allDates.start_time_h : null,
          start_time_m: ctrl.allDates.start_time_m !== null ? ctrl.allDates.start_time_m : 0,
          end_time_h: ctrl.allDates.end_time_h !== null ? ctrl.allDates.end_time_h : null,
          end_time_m: ctrl.allDates.end_time_m !== null ? ctrl.allDates.end_time_m : 0,
          audit: ctrl.allDates.audit ? ctrl.allDates.audit : null,
          action_id: mainRequest.action_type_id,     
          // is_planned: false,
          // old_start_time: null,
          // old_end_time: null,
          // old_audit: null,
          is_checked: true,
          requestedByProd: 0,
          artistic_director_id : null,
          tech_writer_id : null,
          tech_reader_id : null          
        }
        // dateStartEnd is the array used in the html
        ctrl.dateStartEnd.push(data)
        ctrl.newDate = null
        const date2check = {type: 'room', branch_id: $rootScope.user_entity.person.branch_id}
        date2check[data.day] = 1
        getBookingRoomOccupied(date2check)
      }
    }

    ctrl.disableNewDate = function () {
      return ctrl.newDate == null || !moment(ctrl.newDate).isValid();
    }

    function selectAudit(audit) {
      return $filter('filter')(stages, {name : audit}, true)[0];
    }

    ctrl.productName = function(request) {
        return ProductService.getProductNameFromRequest(request);
    };

    ctrl.getUserRole = function (){
        return Session.role();
    };

    ctrl.getTooltipPlanned = function() {
      return $rootScope._T["5lg4b51h"];
    }

    // check form to see if there is some initialized dates
    function isOkToPlan() {
      let okToPlan = true;
      let count = 0;
      angular.forEach(ctrl.dateStartEnd, function(date) {
        if (date.is_checked) {
          count++;
          if (date.start_time_h === null || date.end_time_h === null || date.audit === null || date.start_time_h.value === "" || date.end_time_h.value === "" || date.audit === "") {
            okToPlan = false;
          }
        }
      });
      return okToPlan && count > 0;
    }

    ctrl.getRequests2add = (requests) => $filter('filter')(requests, {isSelected : true}, 1)

    const getOldHash = function () {
      let oldhash = null
      ctrl.requests.forEach(function (request) {
        oldhash = request.hash
      })
      return oldhash
    }

     ctrl.addRequestsToAPlanifiedBooking = function (requests) {
       // prend le hash des requetes originales
       
        let hash = getOldHash()
        const data = []
        // boucle sur les requests existantes
        requests.forEach(
          function (request) {
            const newRequest = {}
            newRequest.id = request.id
            // hash = request.hash
            data.push(newRequest)
          }
        )
        // hash += "-" + getOldHash()
        addSeance2other(hash, data, function () {
          // reload le popup, c'est le plus simple
          ctrl.initPopup()
        })
     }

    // check if hour asked is already occupied
    // il me faut le request_id action
    // doit aussi vérifier le statut, si la salle est en maintenance
    // Verifie l'action, si identique, ce n'est pas bloquant
    const checkHour = function (rangeFound, date, OccupiedRooms) {
      let roomOccupied = false
      let roomOccupiedSameRange = false
      let roomOccupiedInside = false      
      let roomCanBeShared = false
      const chosenStartDate = new Date(date.day.replace('00:00:00', date.start_time.replace('h',':') + ':00') ).getTime()
      const chosenEndDate = new Date( date.day.replace('00:00:00', date.end_time.replace('h',':') + ':00') ).getTime()
      rangeFound.forEach(
        function (range) {
          // add day
          let [start, end] = range.hour.split('-')
          let startH = start + ':00'
          let endH = end + ':00'
          let startDate = new Date( date.day.replace('00:00:00',startH) ).getTime()
          let endDate = new Date( date.day.replace('00:00:00',endH) ).getTime()
          if (chosenStartDate == startDate && chosenEndDate == endDate) {
            roomOccupied = true
            roomOccupiedSameRange = true
          }
          if (
            ( startDate < chosenEndDate  && chosenStartDate < endDate )
          ) {
            roomOccupied = true
            roomOccupiedInside = true
          }
          if (date.action_id == range.action_id) {
            // id action is same, room can be shared
            roomCanBeShared = true
            roomOccupied = false
          }
        }
      )
      OccupiedRooms[date.audit.name] = rangeFound     
      return { roomOccupied: roomOccupied, roomOccupiedSameRange: roomOccupiedSameRange, roomOccupiedInside, roomOccupiedInside, roomCanBeShared: roomCanBeShared } 
    }

    const sendNotificationMessage = function (dataSent) {
      const requests = []
      // get objects not id :)
      ctrl.requests.forEach(function (request) {
        if (dataSent.requests[request.id]) {
          requests.push(request)
        }
      })
      let descriptionNotif = "Demande(s) planifiée(s) dans Vega <br />"
      Object.keys(dataSent.dates).forEach(function (date) {
        let descriptionNotifDetail =  ''
        if (dataSent.dates[date].toSave) {
          let momentDate = moment(dataSent.dates[date].day, "YYYY-MM-DD HH:mm:ss");
          const day = {
            day : momentDate.format("DD/MM/YYYY"),
            audit : dataSent.dates[date].audit.name,
            hours : dataSent.dates[date].start_time.value + "-" + dataSent.dates[date].end_time.value,
            writer: 'Non renseigné',
            reader: 'Non renseigné'
          }
          if (dataSent.dates[date].tech_reader_id) {
            day.reader = dataSent.dates[date].tech_reader_id.fullname
          }
          if (dataSent.dates[date].tech_writer_id) {
            day.writer = dataSent.dates[date].tech_writer_id.fullname
          }
          descriptionNotifDetail += 
            " " + day.day +
            " | Room : " + day.audit +
            " | Hour : " + day.hours +
            " | Writer : " + day.writer +
            " | Reader : " + day.reader +
            (dataSent.dates[date].requestedByProd ? ' (' + $rootScope._T["5y1rkhsx"] + ')' : ' (' + $rootScope._T["3us97j06"] + ')') + '<br />'
          descriptionNotif += descriptionNotifDetail

        }
      })
      sendStandardNotif(new NotificationService(), requests, "production", $rootScope._T["kxq3ttb9"] , descriptionNotif, $filter, "planification", $rootScope);
    }

    ctrl.planRequests = function(selectedRequests, confirm) {
      ctrl.saved  = false
      ctrl.RoomAlreadyOccupied = null
      ctrl.confirmRequest = false
      let roomOccupied = false
      let roomOccupiedSameRange = false
      let roomOccupiedInside = false
      let ready2plan = false
      let roomCanBeShared = false
      const data2send = {requests: {}, dates: {}}
      selectedRequests.forEach(function (aRequest) {
        data2send.requests[aRequest.id] = aRequest.product_id
      })
      const OccupiedRooms  = {}
      if (isOkToPlan()) {
        angular.forEach(ctrl.dateStartEnd, function(date) {
          data2send.dates[date.day] = date
          data2send.dates[date.day].audit.name = data2send.dates[date.day].audit.name.replace(/ *\(.+\)$/,'').replace(/ *\*$/,'')
          data2send.dates[date.day].toSave = date.is_checked ? 1 : 0
          if (date.is_checked) {
            data2send.dates[date.day].start_time =  date.start_time_h  + "h" + date.start_time_m
            data2send.dates[date.day].end_time =  date.end_time_h  + "h" + date.end_time_m
            ready2plan = true
            const rangeFound = ctrl.isOccupied(date.audit.name,date.day)
            if (rangeFound) {
               const result = checkHour(rangeFound, date, OccupiedRooms)
               // const { roomOccupied, roomOccupiedSameRange, roomOccupiedInside }
              roomOccupied = result.roomOccupied
              roomOccupiedSameRange = result.roomOccupiedSameRange
              roomOccupiedInside = result.roomOccupiedInside
              roomCanBeShared = result.roomCanBeShared
            }
          }     
        })
        if (roomOccupied) {
          if (roomOccupiedSameRange) {
            const listString = Object.keys(OccupiedRooms).join(',')
            Object.keys(OccupiedRooms).forEach(
              function (room) {
                ctrl.RoomAlreadyOccupied = $rootScope._T["obpxf1x2"] + " [" + listString + "] "
                ctrl.setAlertMessage({message: 
                  $rootScope._T["obpxf1x2"] +  " [" + listString + "] "
                  , isError:true});
              }
            )
          }
          const listString = Object.keys(OccupiedRooms).join(',')
          if (!roomOccupiedSameRange && roomOccupiedInside) {
            Object.keys(OccupiedRooms).forEach(
              function (room) {
                let horaires = ''
                let horairesHTML = ''
                OccupiedRooms[room].forEach(function (element) {
                  horaires += ' ' + element.hour
                  horairesHTML += '<br />' + element.hour
                })
                ctrl.RoomAlreadyOccupied = $rootScope._T["obpxf1x2"] +  ": <br /> " + $rootScope._T["45kez1q0"] + " [" + listString + "] " + "<br />" + $rootScope._T["p9fano1s"] + " : " + horairesHTML
                ctrl.setAlertMessage({message: 
                  $rootScope._T["obpxf1x2"] + ", " + $rootScope._T["45kez1q0"] + " [" + listString + "] " + $rootScope._T["p9fano1s"] + " : " + horaires
                  , isError:true});
              }
            )
          }          
        }
        if (roomCanBeShared) {
          console.log('can be shared, same action')
        }
        if (ready2plan) {
          if (confirm) {
            bookDates(data2send, function (response) {
              // if problème
              // ctrl.setAlertMessage({message: $rootScope._T["h7qibv7v"] , isError:false});
              sendNotificationMessage(data2send)
              ctrl.initPopup()
            })            
          } else {
            if (roomOccupied) {
              ctrl.confirmRequest = true
            } else {
              bookDates(data2send, function (response) {
                // if problème
                // ctrl.setAlertMessage({message: $rootScope._T["h7qibv7v"] , isError:false});
                selectedRequests.forEach(function (request) {
                  request.ownFarmerbookings.forEach(function (farmer) {
                    if (data2send.dates[farmer.day]) {
                      farmer.start_time = data2send.dates[farmer.day].start_time
                      farmer.end_time = data2send.dates[farmer.day].end_time
                      farmer.audit = data2send.dates[farmer.day].audit.name
                      farmer.is_not_farmer = 1
                      farmer.booking_id = 'temporary_id'
                    }
                  })

                })
                
                Object.keys(data2send.requests).forEach( requestId => {
                  let datesAdded = ''
                  Object.keys(data2send.dates).forEach( date => {
                    datesAdded += date + ' '
                  })
                  let textLog = $rootScope._T["2r346aew"] + " " + datesAdded;
                  newActivityLogRequest(new Comment(), $.cookie('user_id'), requestId , $rootScope._T["moan71y1"] + ' ' + textLog);
                })
                $rootScope.$broadcast('date-wish-updated', {requests: selectedRequests});
                sendNotificationMessage(data2send)
                ctrl.initPopup()
              })
            }
          }
        }
      } else {
        ctrl.setAlertMessage({message: $rootScope._T["1bfhbtvj"], isError:true});
      }
    }   

}


// getAllContributors is a hash of all contributors

Lantern.component('advancedPlanningPopup', {
    templateUrl: 'components/advancedPlanningPopup.html',
    controller: advancedPlanningPopup,
    bindings: {
        getRequestsWithoutRoom: '&',
        requests: '<',
        setAlertMessage: '&',
        getSelectedRequests: '&',
        getArtisticDirectors: '&',
        isAllRequestPlanned: '&',
        initPopup: '&',
        getBookingRoomOccupied: '&',
        rooms: '<',
        getContributors: '&',
        getAllContributors: '&'
    }
});
