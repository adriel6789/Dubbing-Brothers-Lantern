/**
 * Created by Marcel on 23/03/2015.
 * 
 * never used or almost
 * 
 * reused and reworked in 2023 :)
 * 
 */

Lantern.controller('DashboardCtrl', ['$rootScope',  '$scope', '$timeout', '$cookies', '$stateParams', '$state', '$location', '$q', 'ngDialog', 'RequestService', 
'FarmerService', 'PaoService', 'HelperService', 'ProjectsService', 'ValueListService', 'Request', 'PersonsService', 'Valuelist', 'RoomService',
  function($rootScope, $scope, $timeout, $cookies, $stateParams, $state, $location, $q, ngDialog, RequestService, 
    FarmerService, PaoService, HelperService, ProjectsService, ValueListService, Request, PersonsService, Valuelist, RoomService) {


      /**
       * correspondance des données, les champs sont renommées côté serveur pour limiter la quantité de données renvoyées
       {
        "id": "subproject id",
        "st": sub type,
        "sn": "sub nature",
        "pid": "project id",
        "ptid": projet.type_id 1 2 4
        "cid": client_id,
        "prid": product id
        "dur": "duration",
        "REEL": reel,
        "rid": "request_id",
        "act": "action",
        "step": "etape",
        "hash": "679f4d89cd2fe22f985f2471e8679305",
        "rcre": "requete date creation",
        "rd": "req done",
        "rnd": "req not done",
        "rp": "req planned",
        "rsb": "req send back",
        "rcc": "is_canceled",
        "exp": "exploitation",
        "lid": language id,
        "dub": "doublage type",
        "wtype": "workflow type",
        "mix": "format mix",
        "fid": "farmer id",
        "is_wish": null,
        "day": "2023-04-04 00:00:00",
        "start": "21h15",
        "end": "23h00",
        "wstart": working start,
        "wend": working end,
        "bt": vreaking time,
        "audit": "REPORT C",
        "fcre": "farmer creation date",
        "fd": "farmer done",
        "fnd": "farmer not done",
        "ff": "farmer finished",
        "wid": "writer id",
        "trid": "tech_reader_id"
        "bid": "bid" // booking_id
7      } 
       */
      // all data gotten
      const everything = []
      // data for a period
      let partial = []
      const everyNotes = []
      const everyRoomIndispo = []
      const everyTechIndispo = []
      let auditData = [];

      $scope.errors = {
        ressources: ''
      }

      let serieCount = 0
      let filmCount = 0
      let otherCount = 0
      let farmerCount = 0
      let internalCount = 0
      let volumeCount = 0
      let doublageCount = 0
      let masteringCount = 0
      let servicingCount = 0
      let datesDb = null
      let datesMa = null
      let datesSe = null
      let doublage = []
      let mastering = []
      let servicing = []
      let partialBuild = false

      const datesDayCancelled = {}
      const datesEveningCancelled = {}
      $scope.holidays = {}

      const projectsById = {}
      $scope.projects = []
      $scope.projectsBase = []
      $scope.projectsByPeriod = {}

      $scope.subprojectsByProjects = {}
      $scope.subprojectsByPeriod = {}
      $scope.audits = {}
      $scope.monthsList = []
      $scope.natureById = {}
      $scope.formatsmix = []
      $scope.formatMixHashById = {}
      $scope.formatsmixByPeriod = {}
      $scope.exploitationTypesList = []

      // trié, mais pas utilisé
      $scope.exploitationByPeriod = {}
      $scope.clientsFoundHash = {}
      $scope.clientsFoundHashBase = {}
      $scope.clientsList = []
      $scope.languagesFoundHash = {}
      $scope.languagesFound = []
      $scope.languagesByPeriod = {}
      $scope.projectsByClients = {}
      $scope.listOfClients = {} // used for checking

      $scope.waitingWhileRecomputingData = false

      // on compte 8h de travail pour une occupation
      // vu que le studio est occupé, même avec la
      $scope.WorkingDayDurationInMn = 570
      $scope.WorkingEveningDurationInMn = 480

      $scope.durationToBeFullTime = 420  // à partir de 7h, considéré comme occupé à 100%

      $scope.displayRooms = false

      const roomsComputed = 1 + 2 + 8 // rec mix and prepa_audio
      const roomsComputedOnlyRecAndMix = 1 + 2
      
      $scope.exportAuditData = function () {
        exportAuditData();
      }

      // errors found while analyzing data, displayed only for fix
      $scope.errorsInSession = {
      }

      // general
      $scope.warningsOverQuota = {
        rec: false,
        mix: false
      }
      // par jour
      $scope.warningsOverQuotaByDay = {
        rec: {},
        mix: {}
      }

      // overquota techs general
      $scope.warningsTechsOverQuota = {
        ingenieur: false,
        freelance: false
      }
      // overquota techs par jour
      $scope.warningsTechsOverQuotaByDay = {
        ingenieur: {},
        freelance: {}
      }

      $scope.loaded = false
      $scope.loading = false
      $scope.chosenMonth = null

      $scope.durationsByTypeOfRooms = {
        1: { day: 540},
        2: { day: 540, evening: 540},
        3: { day: 540, evening: 540}
      }
      
      $scope.workingHours = {
        dayTime: {
          start: {h : 9, mn : 30},
          end: {h : 18, mn : 30},
          duration: 9 * 60
        },
        eveningTime: {
          start: {h : 18, mn : 30},
          end: {h : 6, mn : 0},
          duration: 7 * 60
        }
      }

      $scope.colors = {
        rec: '#00f6ff',
        mix: '#0036ff',
        una: '#ff5300',
        lazy: '#ffce00',
        other: '#6300ff'
      }



      
      $scope.dubbingStepsByName = {}
      $scope.dubbingStepsList = []

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
          const canSeeErrors = {
            7975: true
          }
          $scope.displayOnlyForAdmin = ($rootScope.canDisplay(1) && canSeeErrors[$rootScope.user_entity.id])
          PersonsService.getTechnicians(function (result) {
            // PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
          }, PersonsService.manageTechniciansError)
          Valuelist.getEtapeActionByWorkflow({
            workflow_type_id: 1
          }, function(etapes) {
            ValueListService.initEtapesActions(JSON.parse(JSON.stringify(etapes)))
          })

          // a quoi il faut ajouter inoccupé, donc O
          PaoService.getDubbingSteps(function (dubbingSteps) {
            dubbingSteps.forEach((step) => {
              //  affiche rec mix editing et prepa_audio only
              if (parseInt(step.id) & 11) {
                // pour affichage dans la page html
                $scope.dubbingStepsList.push(step)
              }
              $scope.dubbingStepsByName[step.name] = step.id
            })
            // $scope.dubbingStepsList.push({ id: 0, name: 'unavailable', value: 'Indispo'})
            // $scope.dubbingStepsByName['unavailable'] = 0
          })
          RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
          ValueListService.getFormatMixFromDatabase( function (response) {
            ValueListService.gotFormatMixFromDatabase(response)
            $scope.formatMixHashById = ValueListService.getFormatMixHashById()
          },function () {}
          )
          
        });
      }
  
      $scope.displayOnlyForAdmin = false
      checkUserState()
      
      // 1 rec
      // 2 mix
      // 4 montage
      // 8 prepaAudio
      // 16 fabrication

      const bitsTable = [0, 1, 2, 4, 8]

      const coefHash = { 1: {}, 2: {} }
      // [ 1, 2 , 4, 8, 16].filter((a) => (a & b)  > 0)
      let mixCoefLevels = [] // [11, 26, 30, 45, 60, 75, 120, 150, 180] 
      PaoService.getRoomCoefficients(2, {}, function (response) {
        response.forEach((element) => {
          const exploitations = bitsTable.filter((a) => ((a & parseInt(element.exploitation))  > 0 || a === 0))
          const project_types = bitsTable.filter((a) => (a & parseInt(element.project_type))  > 0  || a == 0 )
          const dubbing_types = bitsTable.filter((a) => (a & parseInt(element.dubbing_type))  > 0  || a == 0 )
          const format_mixs = bitsTable.filter((a) => (a & parseInt(element.format_mix))  > 0  || a == 0 )
          exploitations.forEach((exploitationId) => {
            if (!coefHash[2][exploitationId]) {
              coefHash[2][exploitationId] = {}
            }

            let keyByExploit = 0
            if (exploitationId == 1) {
              keyByExploit = element.nb_reels
            } else {
              keyByExploit = element.duration_origin
            }
            if (!coefHash[2][exploitationId][keyByExploit]) {
              coefHash[2][exploitationId][keyByExploit] = {}
            }
            if (!coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id]) {
              coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id] = {}
            }
            
            project_types.forEach((projectTypeId) => {
              if (!coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId]) {
                coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId] = {}
              }
              dubbing_types.forEach((dubTypeId) => {
                if (!coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId]) {
                  coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId] = {}
                }
                format_mixs.forEach((format_mixId) => {
                  if (!coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId][format_mixId]) {
                    coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId][format_mixId] = {}
                  }
                  coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId][format_mixId] = parseInt(element.duration_max)
                })
              })
            })

          })

        })
        mixCoefLevels = Object.keys(coefHash[2][2]).map((a) => parseInt(a))
      })
      let recCoefLevels = [] 
      PaoService.getRoomCoefficients(1, {}, function (response) {
        let recCoefLevels = {}
        response.forEach((element) => {
          const exploitations = bitsTable.filter((a) => ((a & parseInt(element.exploitation))  > 0 || a === 0))
          const project_types = bitsTable.filter((a) => (a & parseInt(element.project_type))  > 0  || a == 0 )
          const dubbing_types = bitsTable.filter((a) => (a & parseInt(element.dubbing_type))  > 0  || a == 0 )
          const nb_products = element.nb_products ? element.nb_products : 0
          exploitations.forEach((exploitationId) => {
            if (!coefHash[1][exploitationId]) {
              coefHash[1][exploitationId] = {}
            }
            if (!coefHash[1][exploitationId][nb_products]) {
              coefHash[1][exploitationId][nb_products] = {}
            }
            // nb_products
            let keyByExploit = 0
            if (exploitationId == 1) {
              keyByExploit = element.nb_reels
            } else {
              keyByExploit = element.duration_origin
            }
            if (!coefHash[1][exploitationId][nb_products][keyByExploit]) {
              coefHash[1][exploitationId][nb_products][keyByExploit] = {}
            }
            if (!coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id]) {
              coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id] = {}
            }
            recCoefLevels[keyByExploit] = true
            project_types.forEach((projectTypeId) => {
              if (!coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id][projectTypeId]) {
                coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id][projectTypeId] = {}
              }
              dubbing_types.forEach((dubTypeId) => {
                if (!coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId]) {
                  coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId] = {}
                }
                coefHash[1][exploitationId][nb_products][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId]= parseInt(element.duration_base)
              })
            })
          })
        })
        recCoefLevels = Object.keys(recCoefLevels)
      })


      $scope.saturdayNightFeverOrNot = { 
          0: 'Not saturday',
          1: 'With saturday',
        }
      $scope.saturdayChoice = 0
      $scope.computeSaturdayOrNot = function () {
        if ($scope.saturdayChoice == 0) { 
          $scope.saturdayChoice = 1
        } else {
          $scope.saturdayChoice = 0
        }
      }

      $scope.mainMenu = [
        { name: 'activityShown', value: 'Activité' },
        { name: 'confidenceShown', value: 'Indices de confiance' },
        { name: 'occupationShown', value: 'Occupation des studios' },
        { name: 'resourcesShown', value: 'Occupation des ressources' },
        { name: 'roomsShown', value: 'Audits' }
      ]
      $scope.cumulative = false
      $scope.seeElement = function (element) {
        let status = $scope[element.name]
        if (!$scope.cumulative) {
          $scope.mainMenu.forEach((item) => {
            $scope[item.name] = false
          })
        }
        if (element) {
          $scope[element.name] = !status
        }
        
      }

      $scope.activityShown = false
      $scope.showActivity = function () {
        return $scope.activityShown
      }

      $scope.confidenceShown = false
      $scope.showConfidence = function () {
        return $scope.confidenceShown
      }

      $scope.occupationShown = false
      $scope.showOccupation = function () {
        return $scope.occupationShown
      }

      $scope.resourcesShown = false
      $scope.showResources = function () {
        return $scope.resourcesShown
      }

      
      $scope.roomsShown = false
      $scope.showRooms = function () {
        return $scope.roomsShown
      }
      // nmbre de jours dans le graphe délai entre demande et date souhaitée
      const nbDaysLineGraph = 14 
      let nbDaysMaxConfidenceCharts = 100

      $scope.timeUsedForAuditsRecAndMix = {
      }
      $scope.timeUsedForAuditsHybrid = {
      }    
      $scope.optionsConfidenceIndexRecChart = {
        "chart": {
          "type": "historicalBarChart",
          "height": 450,
          "margin": {
            "top": 20,
            "right": 20,
            "bottom": 65,
            "left": 50
          },
          x: function(d){ return d.days},
          y: function(d){return d.nb},
          "showValues": true,
          "duration": 100,
          "xAxis": {
            "axisLabel": "jours",
            "rotateLabels": 40,
            "axisLabelDistance": -20,
            "showMaxMin": true,
            tickFormat: function(d) {
              return 'A ' + d + ' jours'
            }
          },
          "yAxis": {
            "axisLabel": "nombre",
            "axisLabelDistance": 2
          },
          valueFormat: function (d) {
            return  d 
          },
          "tooltip": {
            keyFormatter: function (d) {
              return d + '  jours'
            },
            valueFormatter: function (d) {
              return d
            }
          }
        },
        title: {
          enable: true,
          text: 'REC Délai entre demande et souhaits'
        }
      }

      $scope.optionsConfidenceIndexRetakeChart = {
        "chart": {
          "type": "historicalBarChart",
          "height": 450,
          "margin": {
            "top": 20,
            "right": 20,
            "bottom": 65,
            "left": 50
          },
          x: function(d){ return d.days},
          y: function(d){return d.nb},
          "showValues": true,
          "duration": 100,
          "xAxis": {
            "axisLabel": "jours",
            "rotateLabels": 40,
            "axisLabelDistance": -20,
            "showMaxMin": true,
            tickFormat: function(d) {
              return 'A ' + d + ' jours'
            }
          },
          "yAxis": {
            "axisLabel": "nombre",
            "axisLabelDistance": 2
          },
          valueFormat: function (d) {
            return  d 
          },
          "tooltip": {
            keyFormatter: function (d) {
              return d + '  jours'
            },
            valueFormatter: function (d) {
              return d
            }
          }
        },
        title: {
          enable: true,
          text: 'RETAKE REC Délai entre demande et souhaits'
        }
      }

      $scope.optionsConfidenceIndexMixChart = {
        "chart": {
          "type": "historicalBarChart",
          "height": 450,
          "margin": {
            "top": 20,
            "right": 20,
            "bottom": 65,
            "left": 50
          },
          x: function(d){ return d.days},
          y: function(d){return d.nb},
          "showValues": true,
          "duration": 100,
          "xAxis": {
            "axisLabel": "jours",
            "rotateLabels": 40,
            "axisLabelDistance": -20,
            "showMaxMin": true,
            tickFormat: function(d) {
              return 'A ' + d + ' jours'
            }
          },
          "yAxis": {
            "axisLabel": "nombre",
            "axisLabelDistance": 2
          },
          valueFormat: function (d) {
            return  d 
          },
          "tooltip": {
            keyFormatter: function (d) {
              return d + '  jours'
            },
            valueFormatter: function (d) {
              return d
            }
          }
        },
        title: {
          enable: true,
          text: 'MIX Délai entre demande et souhaits'
        }
      }

      $scope.optionsConfidenceIndexMixRepassageChart = {
        "chart": {
          "type": "historicalBarChart",
          "height": 450,
          "margin": {
            "top": 20,
            "right": 20,
            "bottom": 65,
            "left": 50
          },
          x: function(d){ return d.days},
          y: function(d){return d.nb},
          "showValues": true,
          "duration": 100,
          "xAxis": {
            "axisLabel": "jours",
            "rotateLabels": 40,
            "axisLabelDistance": -20,
            "showMaxMin": true,
            tickFormat: function(d) {
              return 'A ' + d + ' jours'
            }
          },
          "yAxis": {
            "axisLabel": "nombre",
            "axisLabelDistance": 2
          },
          valueFormat: function (d) {
            return  d 
          },
          "tooltip": {
            keyFormatter: function (d) {
              return d + '  jours'
            },
            valueFormatter: function (d) {
              return d
            }
          }
        },
        title: {
          enable: true,
          text: 'MIX repassage et inserts Délai entre demande et souhaits'
        }
      }

      // était prévu, mais ifnalement pas utilisé, les résultats ne sont pas significatifs
      $scope.optionsReliabilityIndexChart = {
        "chart": {
          "type": "historicalBarChart",
          "height": 450,
          "margin": {
            "top": 20,
            "right": 20,
            "bottom": 65,
            "left": 50
          },
          x: function(d){ return d.days},
          y: function(d){return d.nb},
          "showValues": true,
          "duration": 100,
          "xAxis": {
            "axisLabel": "jours",
            "rotateLabels": 0,
            "axisLabelDistance": -10,
            "showMaxMin": true,
            tickFormat: function(d) {
              return 'A ' + d + ' jours'
            }
          },
          "yAxis": {
            "axisLabel": "nombre",
            "axisLabelDistance": -10
          },
          valueFormat: function (d) {
            return  d 
          },
          "tooltip": {
            keyFormatter: function (d) {
              return d + '  jours'
            },
            valueFormatter: function (d) {
              return d
            }
          }
        },
        title: {
          enable: true,
          text: 'Fiabilité des demandes'
        }
      }

      
      $scope.confidenceIndex = {}
      $scope.confidenceRecIndex = {}
      $scope.confidenceMixIndex = {}
      $scope.dataConfidenceChart = []
      let confidences = []

      // heures de mix et rec avec les techniciens utilisés
      $scope.techniciansOccupancy = {
        1: {},
        2: {}
      }

      // mixage inert et repassage
      // name 	
      // mixage_repassage (id 225 France)
      // mixage_inserts (id 11 France)
      $scope.corrections = {
      }
      $scope.totalMixInserts = 0
      $scope.totalMixRepassage = 0

      const roomsByDubStep = {
        1: {},
        2: {},
        3: {},
        8: {}
      }

      Object.keys($rootScope.allRoomsById).forEach((id) => {
        if ($rootScope.allRoomsById[id].dubbing_step) {
          if (!roomsByDubStep[$rootScope.allRoomsById[id].dubbing_step]) {
            roomsByDubStep[$rootScope.allRoomsById[id].dubbing_step] = {}
          }
          roomsByDubStep[$rootScope.allRoomsById[id].dubbing_step][id] = $rootScope.allRoomsById[id]
        }
      })

      const TechsByType = {
        ingenieur: {},
        freelance: {}
      }

      // $rootScope.allTechnicians[event.wid].app_role_id == 68
      Object.keys($rootScope.allTechnicians).forEach((techId) => {
        if ($rootScope.allTechnicians[techId].app_role_id == 65) {
          TechsByType.ingenieur[techId] = $rootScope.allTechnicians[techId]
        }
        if ($rootScope.allTechnicians[techId].app_role_id == 68) {
          TechsByType.freelance[techId] = $rootScope.allTechnicians[techId]
        }
      })

      $scope.getDay = function (date, action) {
        if (date) {
          console.log(date)
        }
      }

      // app_role_id
      // 65 ingénieur
      // 66 monteur
      // 67: recorder
      // 68: freelance
      // 70: technician

      // heures de début de travail pour la journée et la soirée
      // extrait de preset start D et E 
      // par branche: duree max jour et nuit

      const typeExploitation = {
        1: 'Recording',
        2: 'Mix',
        4: 'Montage',
        8: 'Prepa Audio'
      }
      $scope.chosenExploitType = null
      $scope.choseExploitType = function (type) {
        if (type.value == 0) {
          $scope.chosenExploitType = null
          return
        }
        $scope.chosenLocation = null
        $scope.displayRooms = true
        $scope.chosenExploitType = type
      } 

      $scope.chosenLocation = null
      $scope.choseLocation = function (location) {
        if (location == 'tout') {
          $scope.chosenLocation = null
          return
        }
        $scope.chosenExploitType = null
        $scope.displayRooms = true
        $scope.chosenLocation = location
      }
      $scope.displayByLocation = function (chosenLocation, location) {
        if (chosenLocation && chosenLocation == location) {
          return true
        }
        return false
      }

      $scope.displayARoom = function (chosenExploitType, dubStepRoomValue) {
        if (chosenExploitType && chosenExploitType.value && (chosenExploitType.value & dubStepRoomValue)) {
          return true
        }
        return false
      }
      $scope.typesExploitation = [
        { value: 0, name: 'Tout' },
        { value: 1, name: 'Recording' },
        { value: 2, name: 'Mix' },
        { value: 4, name: 'Montage' },
        { value: 8, name: 'Prepa Audio' }
      ]
      
          // filtre cumulatif 
    // remis à jour quand on change de période
    let filterData = {}
    $scope.roomsByLocation = []
    
    roomsByLocationHash = {}
    Object.keys($rootScope.allRoomsByName).forEach((name) => {
      if ($rootScope.allRoomsById[$rootScope.allRoomsByName[name]].location != 'indispo') {
        $scope.audits[name] = { hours: 0, minutes: 0 }
        $scope.audits[name].name = $rootScope.allRoomsById[$rootScope.allRoomsByName[name]].long_name ? $rootScope.allRoomsById[$rootScope.allRoomsByName[name]].long_name : name
        $scope.audits[name].dubStepRoomValue = parseInt($rootScope.allRoomsById[$rootScope.allRoomsByName[name]].dubbing_step)
        $scope.audits[name].location = $rootScope.allRoomsById[$rootScope.allRoomsByName[name]].location
        $scope.audits[name].id = $rootScope.allRoomsByName[name]
        roomsByLocationHash[$scope.audits[name].location] = true
      }
    })
    $scope.roomsByLocation = Object.keys(roomsByLocationHash)
    $scope.roomsByLocation.unshift('tout')

    $scope.roomExcluded = function (audit) {
      if (audit.location == 'Belgique') {
        return false
      }
      // uniquement rec et mix
      if (!(audit.dubStepRoomValue & 3)) {
        return false
      }
      return true
    }

    $scope.workingProjects = {}
    $scope.requestsCreatedDuringPeriod = 0
    $scope.workingProjectsTotal = 0
    $scope.totalHours = 0

    $scope.duration = 1
    
    $scope.loadData = function (duration) {
      if (!$scope.loaded) {
        $scope.duration = duration
        $scope.loading = true
        getNotes(function () {
          getDates(0)
        })
        getTechIndispo()
      }
    }

    
    const holiday = function(){
      var deferred = $q.defer();
      Request.getHolydays(
        function(result){
          deferred.resolve(result)
        }
      );
      return deferred.promise;
    }
    
    holiday().then(function (holydays) {
      holydays.forEach((day) => {
        $scope.holidays[day] = true
      })
    
    }, function (error) {
      console.error(error)
    })

    const hours2minutes = function (WorkingTime, splittedTime) {
      const end = new Date('2020-01-02 ' +  WorkingTime.end.h + ':' +  WorkingTime.end.mn )
      const start  = new Date('2020-01-02 ' +  splittedTime[0] +  ':' +   splittedTime[1])
      const difference = end.getTime() - start.getTime()
      return Math.round(difference / 60000)
    }

    const hours2minutesEvening = function (WorkingTime, splittedTime) {
      const start = new Date('2020-01-02 ' +  WorkingTime.start.h + ':' +  WorkingTime.start.mn )
      const end  = new Date('2020-01-02 ' +  splittedTime[0] +  ':' +   splittedTime[1])
      const difference = end.getTime() - start.getTime()
      return Math.round(difference / 60000)
    }

    $scope.waitingWhileRecomputingDataStyle = {
      backgroundColor: 'white',
      color: 'black',
      text: ''
    }
    const receptionAfterRecomputingData = function () {
      $scope.waitingWhileRecomputingDataStyle = {
        backgroundColor: 'white',
        color: 'green',
        text: 'computed'
      }
      $timeout(function () {
        $scope.waitingWhileRecomputingDataStyle = {
          backgroundColor: 'white',
          color: 'black',
          text: ''
        }
      }, 2000);
      $scope.waitingWhileRecomputingData = false
    }
    /**
     *  filtres de dates
     */
    $scope.dateStartDisplayed = null
    $scope.dateEndDisplayed = null
    $scope.filterDate = function(nbDays) {
      // table partial est un sous-ensemble de dates
      // remis à jour à chaque changement de période
      partialBuild = false
      filterData = {}
      partial = []
      if (nbDays >= 0) {
        $scope.dateStart = moment(moment().subtract(nbDays, "days")).format('YYYY-MM-DD')
        $scope.dateStartDisplayed = new Date($scope.dateStart).toLocaleDateString()
        $scope.dateEnd = moment(moment().subtract(0, "days")).format('YYYY-MM-DD')
        $scope.dateEndDisplayed = new Date($scope.dateEnd).toLocaleDateString()
        $scope.filter = nbDays
        // vide filtres
        if ($scope.clientSelection) $scope.clientSelection.selected = null
        if (projectSelection) projectSelection.selected = null
        if (subProjectSelection) subProjectSelection.selected = null
        if ($scope.displayExploitationSelection) $scope.displayExploitationSelection.selected = null
        if ($scope.displayLanguageSelection) $scope.displayLanguageSelection.selected = null
        if ($scope.displayFormatMixSelection) $scope.displayFormatMixSelection.selected = null
        if ($scope.displayDubStepSelection) $scope.displayDubStepSelection.selected = null
      } else if (nbDays < 0) {
        $scope.dateStart = moment(moment().subtract(0, "days")).format('YYYY-MM-DD')
        $scope.dateStartDisplayed = new Date($scope.dateStart).toLocaleDateString()
        $scope.dateEnd =  moment(moment().subtract(nbDays, "days")).format('YYYY-MM-DD')
        $scope.dateEndDisplayed = new Date($scope.dateEnd).toLocaleDateString()
        $scope.filter = nbDays
        // vide filtres
        if ($scope.clientSelection) $scope.clientSelection.selected = null
        if (projectSelection) projectSelection.selected = null
        if (subProjectSelection) subProjectSelection.selected = null
        if ($scope.displayExploitationSelection) $scope.displayExploitationSelection.selected = null
        if ($scope.displayLanguageSelection) $scope.displayLanguageSelection.selected = null
        if ($scope.displayFormatMixSelection) $scope.displayFormatMixSelection.selected = null
        if ($scope.displayDubStepSelection) $scope.displayDubStepSelection.selected = null
      }
      manageDataReceived(everything, filterData, receptionAfterRecomputingData)
    }

    $scope.selectedMonth = null
    $scope.displayMonth = function (selection) {
      $scope.selectedMonth = selection
      choice = selection.selected
      if (choice) {
        filterData = {}
        partialBuild = false
        $scope.dateStart = moment(choice.start).format('YYYY-MM-DD')
        $scope.dateStartDisplayed = new Date($scope.dateStart).toLocaleDateString()
        $scope.dateEnd = moment(choice.end).format('YYYY-MM-DD')
        $scope.dateEndDisplayed = new Date($scope.dateEnd).toLocaleDateString()
        $scope.filter = 0
        $scope.dashDateStart = null
        $scope.dashDateEnd = null
        // vide filtres
        if ($scope.clientSelection) $scope.clientSelection.selected = null
        if (projectSelection) projectSelection.selected = null
        if (subProjectSelection) subProjectSelection.selected = null
        if ($scope.displayExploitationSelection) $scope.displayExploitationSelection.selected = null
        if ($scope.displayLanguageSelection) $scope.displayLanguageSelection.selected = null
        if ($scope.displayFormatMixSelection) $scope.displayFormatMixSelection.selected = null
        if ($scope.displayDubStepSelection) $scope.displayDubStepSelection.selected = null
        manageDataReceived(everything, filterData, function () {
          selection.selected = null
          if ($scope.selectedMonth) {
            $scope.selectedMonth.selected = null
          }
          $scope.waitingWhileRecomputingData = false
          $scope.waitingWhileRecomputingDataStyle = {
            backgroundColor: 'white',
            color: 'black',
            text: ''
          }
        })
      }
    }

    $scope.computing = false
    $scope.$watch('dashDateStart', function() {
      if ($scope.dashDateStart && $scope.dashDateEnd &&  moment($scope.dashDateStart) <= moment($scope.dashDateEnd)) {
        filterData = {}
        partialBuild = false
        $scope.dateStart = moment($scope.dashDateStart) 
        $scope.dateEnd = moment($scope.dashDateEnd) 
        $scope.dateStartDisplayed = new Date($scope.dateStart).toLocaleDateString()
        $scope.dateEndDisplayed = new Date($scope.dateEnd).toLocaleDateString()
        $scope.dashDateStart = null
        $scope.dashDateEnd = null
        // vide filtres
        if ($scope.clientSelection) $scope.clientSelection.selected = null
        if (projectSelection) projectSelection.selected = null
        if (subProjectSelection) subProjectSelection.selected = null
        if ($scope.displayExploitationSelection) $scope.displayExploitationSelection.selected = null
        if ($scope.displayLanguageSelection) $scope.displayLanguageSelection.selected = null
        if ($scope.displayFormatMixSelection) $scope.displayFormatMixSelection.selected = null
        if ($scope.displayDubStepSelection) $scope.displayDubStepSelection.selected = null
        // $scope.chosenProjet = null
        manageDataReceived(everything, filterData, receptionAfterRecomputingData)
      }
    })

    $scope.$watch('dashDateEnd', function() {
      if ($scope.dashDateStart && $scope.dashDateEnd &&  moment($scope.dashDateStart) <= moment($scope.dashDateEnd)) {
        filterData = {}
        partialBuild = false
        $scope.dateStart = moment($scope.dashDateStart) 
        $scope.dateEnd = moment($scope.dashDateEnd)  
        $scope.dateStartDisplayed = new Date($scope.dateStart).toLocaleDateString()
        $scope.dateEndDisplayed = new Date($scope.dateEnd).toLocaleDateString()
        $scope.dashDateStart = null
        $scope.dashDateEnd = null
        // vide filtres
        if ($scope.clientSelection) $scope.clientSelection.selected = null
        if (projectSelection) projectSelection.selected = null
        if (subProjectSelection) subProjectSelection.selected = null
        if ($scope.displayExploitationSelection) $scope.displayExploitationSelection.selected = null
        if ($scope.displayLanguageSelection) $scope.displayLanguageSelection.selected = null
        if ($scope.displayFormatMixSelection) $scope.displayFormatMixSelection.selected = null
        if ($scope.displayDubStepSelection) $scope.displayDubStepSelection.selected = null
        // subProjectSelection
        manageDataReceived(everything, filterData, receptionAfterRecomputingData)
      }
    })

    // $scope.holidays
    /**
     *  Fin des filtres de dates
     */

    $scope.subProjectsList = null
    $scope.chosenProjet = null
    let projectSelection = null
    $scope.displayProjects = function (select) {
      if (subProjectSelection && subProjectSelection.selected) {
        subProjectSelection.selected = null
      }
      let projet = null
      if (select && select.selected) {
        projet = select.selected
        projectSelection = select
      }
      
      $scope.chosenSubProjet = ''
      $scope.subProjectsList = []
      if (projet) {
        $scope.clientsList = Object.values($scope.clientsFoundHash)
        // $scope.subprojectsByProjects
        $scope.chosenProjet = projet
        // n'afficher que les sous-projets en cours
        projet.sub.forEach((sub) => {
          if ($scope.subprojectsByProjects[projet.id][sub.id]) {
            if (sub.nid == 2) {
              sub.name = "season " + sub.season
            } else {
              sub.name = $scope.natureById[sub.nid].name
            }
            if ($scope.subprojectsByPeriod[sub.id]) {
              $scope.subProjectsList.push(sub)
            }
            
          }
        })
      } else {
        if (Object.values($scope.projectsByPeriod).length > 0) {
          $scope.projects = []
          Object.keys($scope.projectsByPeriod).forEach((projectId) => {
            $scope.projects.push(projectsById[projectId])
          })
        }
        filterData = {}
        $scope.subProjectsList = []
        $scope.clientsList = Object.values($scope.clientsFoundHash)
        $scope.chosenProjet = null
      }
    }

    $scope.displayProject = function (project) {
      if (subProjectSelection && subProjectSelection.selected) {
        subProjectSelection.selected = null
      }
      if (project) {
        filterData = {}
        $scope.clientsList = []
        $scope.chosenClient = null
        filterData.project = project
      } else {
        $scope.clientsList = Object.values($scope.clientsFoundHash)
        filterData = {}
      }
      manageDataReceived(partial, filterData, function () {
        if (client) {
          $scope.languagesFound = Object.values($scope.languagesByPeriod)
        } else {
          $scope.languagesFound = Object.values($scope.languagesFoundHash)
        } 
        receptionAfterRecomputingData()
      })
    }
    let subProjectSelection = null
    $scope.displaySubProject = function ($select) {
      subProjectSelection = $select
      const subproject = $select.selected
      if (subproject) {
        delete filterData.client
        $scope.chosenClient = null
        filterData.subproject = subproject
      } else {
        delete filterData.subproject
      }
      manageDataReceived(partial, filterData, function () {
        if (client) {
          $scope.languagesFound = Object.values($scope.languagesByPeriod)
        } else {
          $scope.languagesFound = Object.values($scope.languagesFoundHash)
        } 
        receptionAfterRecomputingData()
      })
    }

    $scope.chosenDubStep = null
    $scope.displayDubStepSelection = null
    $scope.displayDubStep = function (selection) {
      $scope.displayDubStepSelection = selection
      let dubStep = selection.selected
      if (dubStep) {
        filterData.dubStep = dubStep
      } else {
        delete filterData.dubStep
      }
      manageDataReceived(partial, filterData, receptionAfterRecomputingData)
    }

    $scope.chosenformatMix = null
    $scope.displayFormatMixSelection = null
    $scope.displayFormatMix = function (selection) {
      $scope.displayFormatMixSelection = selection
      let formatMix = selection.selected
      if (formatMix) {
        filterData.formatMix = formatMix
      } else {
        delete filterData.formatMix
      }
      manageDataReceived(partial, filterData, receptionAfterRecomputingData)
    }

    $scope.clientSelection = null
    $scope.chosenClient = null
    $scope.displayClient = function (selection) {
      client = selection.selected
      $scope.clientSelection = selection
      if (subProjectSelection && subProjectSelection.selected) {
        subProjectSelection.selected = null
      }      
      if (projectSelection && projectSelection.selected) {
        projectSelection.selected = null
      }
      if (client) {
        // affiche la liste des projets dépendant de Disney
        // si annule, remte la liste en cours
        // $scope.projectsByClients
        $scope.projects = []
        Object.keys($scope.projectsByClients[client.id]).forEach((pid) => {
          if ($scope.projectsByPeriod[pid]) {
            $scope.projects.push(projectsById[pid])
          }
        })
        // met à jour la liste des langues pour un client
        
        filterData = {}
        $scope.subProjectsList = null
        $scope.chosenProjet = null
        filterData.client = client
      } else {
        if (Object.values($scope.projectsByPeriod).length > 0) {
          $scope.projects = []
          Object.keys($scope.projectsByPeriod).forEach((projectId) => {
            if ($scope.projectsByPeriod[projectId]) {
              $scope.projects.push(projectsById[projectId])
            }
          })
        } else {
          $scope.projects = $scope.projectsBase
        }
        $scope.clientsList = Object.values($scope.clientsFoundHash)
        filterData = {}
      }
      manageDataReceived(partial, filterData, function () {
        if (client) {
          $scope.languagesFound = Object.values($scope.languagesByPeriod)
        } else {
          $scope.languagesFound = Object.values($scope.languagesFoundHash)
        } 
        
        receptionAfterRecomputingData()
      })
    }

    
    $scope.chosenExploitation = null
    $scope.displayExploitationSelection = null
    $scope.displayExploitation = function (selection) {
      $scope.displayExploitationSelection = selection
      let exploitation = selection.selected
      if (exploitation) {
        filterData.exploitation = exploitation
      } else {
        delete filterData.exploitation
      }
      manageDataReceived(partial, filterData, receptionAfterRecomputingData)
    }

    $scope.chosenLanguage = null
    $scope.displayLanguageSelection = null
    $scope.displayLanguage = function (selection) {
      $scope.displayLanguageSelection = selection
      let language = selection.selected
      if (language) {
        filterData.language = language
      } else {
        delete filterData.language
      }
      // languagesFound
      manageDataReceived(partial, filterData, receptionAfterRecomputingData)
    }

    function formalizeDate(date) {
      return moment(date, "DD-MM-YYYY").get('year') + "-" + (moment(date, "DD-MM-YYYY").get('month') + 1) + "-" + moment(date, "DD-MM-YYYY").get('date')
    }

    const filteringPlus = function (filterPlus, item) {
      let keepGoing = true
      if (Object.keys(filterPlus).length > 0) {
        if (filterPlus.project && filterPlus.project.id != item.pid) {
          keepGoing = false
        }
        if (filterPlus.subproject && filterPlus.subproject.id != item.id) {
          keepGoing = false
        }
        if (filterPlus.dubStep && item.dubStepId >= 0 && filterPlus.dubStep.id != item.dubStepId) {
          keepGoing = false
        }
        if (filterPlus.formatMix && filterPlus.formatMix.id != item.mix) {
          keepGoing = false
        }
        if (filterPlus.client && filterPlus.client.id != item.cid) {
          keepGoing = false
        }
        if (filterPlus.exploitation && filterPlus.exploitation.id != item.exp) {
          keepGoing = false
        }
        if (filterPlus.language && filterPlus.language.id != item.lid) {
          keepGoing = false
        }
      }    
      return   keepGoing
    }

    
    // fonction principale: ordonne les données pour une période
    const manageDataReceived = function (response, filterPlus, done) {
      $scope.listOfClients = {}
      $scope.waitingWhileRecomputingData = true
      $scope.waitingWhileRecomputingDataStyle = {
        backgroundColor: 'yellow',
        color: 'red',
        text: 'computing data'
      }
      /*
      if (!partialBuild) {
        $scope.clientsFoundHash = {}
        $scope.projectsByPeriod = {}
      }
      */
      $scope.clientsFoundHash = {}
      $scope.clientsFoundHashBase = {}
      $scope.projectsByPeriod = {}
      $scope.subprojectsByPeriod = {}
      $scope.errors = {
        ressources: ''
      }
      $scope.occupancyGlobal = {
        dayTime: {
          minutes: {
            total: 0,
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          },
          percents: {
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          }
        },
        eveningTime: {
          minutes: {
            total: 0,
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          },
          percents: {
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          }
        }
      }
      // ajoute les temps d'indisponibilité
      $scope.occupancyGlobalHybrid = {
        dayTime: {
          minutes: {
            total: 0,
            rec: 0,
            mix: 0,
            lazy: 0,
            una: 0,
            other: 0
          },
          percents: {
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          }
        },
        eveningTime: {
          minutes: {
            total: 0,
            rec: 0,
            mix: 0,
            lazy: 0,
            other: 0,
            una:0
          },
          percents: {
            rec: 0,
            mix: 0,
            una: 0,
            other: 0,
            lazy: 0
          }
        }        
      }
      const hashRegroupRequests = {}
      $scope.computing = true
      $scope.languagesFound = []
      $scope.clientsList = []
      $scope.workingProjects = {}
      $scope.requestsCreatedDuringPeriod = 0
      $scope.workingProjectsTotal = 0
      $scope.totalHours = 0
      serieCount = 0
      filmCount = 0
      farmerCount = 0
      internalCount = 0
      volumeCount = 0
      otherCount = 0
      doublage = []
      mastering = []
      servicing = []
      doublageCount = 0
      masteringCount = 0
      servicingCount = 0

      const alreadyRequestsTaken = {}
      // pour le prévisionnel, pour ne pas prendre 2 fois les mêmes donnes, cle: farmer.id
      const alreadyFarmersTaken = {}

      $scope.totalMixInserts = 0
      $scope.totalMixRepassage = 0
      $scope.timeUsedForAuditsRecAndMix = {
      }
      $scope.timeUsedForAuditsHybrid = {
      }


      $scope.techniciansOccupancy = {
        1: {},
        2: {},
        8: {}
      }

      $scope.corrections = {
      }

      $scope.confidenceIndex = {}
      $scope.confidenceRecIndex = {}
      $scope.confidenceRecRTKIndex = {} // action_name retake
      $scope.confidenceMixIndex = {}
      $scope.confidenceMixRepassageIndex = {} // action_name mixage_repassage
      $scope.dataConfidenceChart = []
      $scope.reliabilityIndex = {}

      let dateStartUnix =  moment($scope.dateStart).format('x')
      let DateEndUnix =  moment($scope.dateEnd).format('x')
      const ByBookings = {}
      const ByVolume = {} // set etapes names prepa_audio
      doublageCount = 0
      datesDb = setDateSince($scope.dateStart, $scope.dateEnd)
      datesMa = angular.copy(datesDb)
      datesSe = angular.copy(datesDb)
      // à voir, mais pas nécessaire
      let globalDaytime = 0
      let globalEveningtime = 0
      Object.keys($scope.globalHoursDetail).forEach((day) => {
        if ($scope.globalHoursDetail[day].daytime) {
          globalDaytime += $scope.globalHoursDetail[day].daytime
        }
        if ($scope.globalHoursDetail[day].eveningtime) {
          globalEveningtime += $scope.globalHoursDetail[day].eveningtime
        }
        Object.keys($scope.audits).forEach((auditName) => {
          const dayRoomKey = day + '-' + $scope.audits[auditName].id
          if ($scope.audits[auditName].dubStepRoomValue & roomsComputedOnlyRecAndMix && $scope.audits[auditName].location != 'Belgique') {
            // const dayRoomKey = day + '-' + $scope.audits[auditName].id
            if (!$scope.timeUsedForAuditsRecAndMix[dayRoomKey]) {
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey] = {
                0: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                1: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                2: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                3: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                8: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0}
              }
            }
          } else {
            if (!$scope.audits[auditName].dubStepRoomValue & roomsComputedOnlyRecAndMix && $scope.audits[auditName].location != 'Belgique') {
              if (!$scope.timeUsedForAuditsHybrid[dayRoomKey]) {
                $scope.timeUsedForAuditsHybrid[dayRoomKey] = {
                  0: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                  1: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                  2: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
                  8: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0}
                }
              }
            }
          }

        })
        
      })

      // fin du pas nécessaire, enfin presque :)

      // il faut aussi gérer les indispo et les notes
      // récupère les temps d'indisponibilité pour les rec et mix only
      // notes
      // $scope.NbDayTimeDaysAvailableForThePeriod nombre de jours pris en compte
      // $scope.NbEveningTimeDaysForThePeriod   nombre de jours pris en compte
      everyNotes.forEach((note) => {
        if (note.dubStepRoomValue & roomsComputed && note.roomLocation != 'Belgique' && !$scope.avoidDay(note.dayBrut)) {
          let unixFarmerDay = moment(moment(note.dayBrut).format('YYYY-MM-DD 00:00:00')).format('x')
          if (unixFarmerDay >= dateStartUnix && unixFarmerDay <= DateEndUnix) {
            if (filteringPlus(filterPlus, note)) {
              ByBookings[note.bid  + note.datetime_start_numeric + note.datetime_end_numeric] = note
            }
          }
        }
        if (note.dubStepRoomValue & 8) {

        }
      })
      // indispo
      everyRoomIndispo.forEach((event) => {
        if (event.dubStepRoomValue & roomsComputed && event.roomLocation != 'Belgique' && !$scope.avoidDay(event.dayBrut)) {
          let unixFarmerDay = moment(moment(event.dayBrut).format('YYYY-MM-DD 00:00:00')).format('x')
          if (unixFarmerDay >= dateStartUnix && unixFarmerDay <= DateEndUnix) {
            if (filteringPlus(filterPlus, event)) {
              ByBookings[event.bid  + event.datetime_start_numeric + event.datetime_end_numeric] = event
            }
          }
        }
      })
      response.forEach((item) => {
        // let requestActiveDt = moment(item.day).format('x')
        // demandes actives, donc ayant une entrée farmer
        if (item.requestActiveDt >= dateStartUnix && item.requestActiveDt <= DateEndUnix) {
          if (!partialBuild) {
            alreadyFarmersTaken[item.fid] = true
            alreadyRequestsTaken[item.rid] = true
            partial.push(item)
          }

          let keepGoing = true
          if (item.roomLocation == 'Belgique') {
            keepGoing = false
          }
          if (Object.keys(filterPlus).length > 0) {
            if (filterPlus.project && filterPlus.project.id != item.pid) {
              keepGoing = false
            }
            if (filterPlus.subproject && filterPlus.subproject.id != item.id) {
              keepGoing = false
            }
            if (filterPlus.dubStep && filterPlus.dubStep.id != item.dubStepId) {
              keepGoing = false
            }
            if (filterPlus.formatMix && filterPlus.formatMix.id != item.mix) {
              keepGoing = false
            }
            if (filterPlus.client && filterPlus.client.id != item.cid) {
              keepGoing = false
            }
            if (filterPlus.exploitation && filterPlus.exploitation.id != item.exp) {
              keepGoing = false
            }
            if (filterPlus.language && filterPlus.language.id != item.lid) {
              keepGoing = false
            }
          }
          if ($scope.avoidDay(item.dayBrut)) {
            keepGoing = false
          }
          if (keepGoing) {
            if (!item.lid) {
              // console.log('aucune langue associée ' + item.rid)
            }
            if (item.lid) {
              $scope.languagesFoundHash[item.lid] = $rootScope.languagesById[item.lid]
            }

            if ($rootScope.actions[item.act].planning == 'volume') {
              volumeCount++
              ByVolume[item.fid] = item
            }
            if ($rootScope.actions[item.act].planning == 'farmer') {
              if (item.bid) {
                // doit mettre booking_id  + current start et and
                ByBookings[item.bid  + item.datetime_start_numeric + item.datetime_end_numeric] = item
              }
            }
            $scope.workingProjects[item.pid] = projectsById[item.pid]
            if (item.sn == 1) {
              filmCount++
            } else if (item.sn == 2) {
              serieCount++
            } else {
              otherCount++
            }
          }
        }
        // concerne les dates de requete créées donc dans le passé
        let unixReqCreationDate = moment(moment(item.rcre).format('YYYY-MM-DD 00:00:00')).format('x')
        // demandes créées
        if (unixReqCreationDate >= dateStartUnix && unixReqCreationDate <= DateEndUnix) {
          if (!partialBuild) {
            if (!alreadyFarmersTaken[item.fid] && !alreadyRequestsTaken[item.rid]) {
              partial.push(item)
            }
            alreadyFarmersTaken[item.fid] = true
            alreadyRequestsTaken[item.rid] = true
          }

          let keepGoing = true
          if (item.roomLocation == 'Belgique') {
            keepGoing = false
          }
          if (Object.keys(filterPlus).length > 0) {
            if (filterPlus.project && filterPlus.project.id != item.pid) {
              keepGoing = false
            }
            if (filterPlus.subproject && filterPlus.subproject.id != item.id) {
              keepGoing = false
            }
            if (filterPlus.dubStep  && filterPlus.dubStep.id != item.dubStepId) {
              keepGoing = false
            }

            if (filterPlus.formatMix && filterPlus.formatMix.id != item.mix) {
              keepGoing = false
            }
            if (filterPlus.client && filterPlus.client.id != item.cid) {
              keepGoing = false
            }
            if (filterPlus.exploitation && filterPlus.exploitation.id != item.exp) {
              keepGoing = false
            }
            if (filterPlus.language && filterPlus.language.id != item.lid) {
              keepGoing = false
            }            
          }
          if ($scope.avoidDay(item.dayBrut)) {
            keepGoing = false
          }

          if (keepGoing) {
            if (item.lid) {
              $scope.languagesFoundHash[item.lid] = $rootScope.languagesById[item.lid]
            }
            $scope.requestsCreatedDuringPeriod++
            if (item.wtype == 1) {
              if (datesDb.hasOwnProperty(unixReqCreationDate)) {
                doublageCount++
                datesDb[unixReqCreationDate]++
              }
              
            }
            if (item.wtype == 2) {
              if (datesMa.hasOwnProperty(unixReqCreationDate)) {
                masteringCount++
                datesMa[unixReqCreationDate]++
              }
            }
            if (item.wtype == 3) {
              if (datdatesSeesMa.hasOwnProperty(unixReqCreationDate)) {
                servicingCount++
                datesSe[unixReqCreationDate]++
              }

            }
          }

        }
        // données dans le futur, doit prendre les dates posées de farmer qui ont toutes un jour
        
        let unixFarmerDay = moment(moment(item.day).format('YYYY-MM-DD 00:00:00')).format('x')
        if (unixFarmerDay >= dateStartUnix && unixFarmerDay <= DateEndUnix) {
          let keepGoing = true
          if (Object.keys(filterPlus).length > 0) {
            if (filterPlus.project && filterPlus.project.id != item.pid) {
              keepGoing = false
            }
            if (filterPlus.subproject && filterPlus.subproject.id != item.id) {
              keepGoing = false
            }
            if (filterPlus.dubStep && item.dubStepId >= 0 && filterPlus.dubStep.id != item.dubStepId) {
              keepGoing = false
            }
            if (filterPlus.formatMix && filterPlus.formatMix.id != item.mix) {
              keepGoing = false
            }
            if (filterPlus.client && filterPlus.client.id != item.cid) {
              keepGoing = false
            }
            if (filterPlus.exploitation && filterPlus.exploitation.id != item.exp) {
              keepGoing = false
            }
            if (filterPlus.language && filterPlus.language.id != item.lid) {
              keepGoing = false
            }
          }
          if (item.roomLocation == 'Belgique') {
            keepGoing = false
          }
          if ($scope.avoidDay(item.dayBrut)) {
            keepGoing = false
          }
          if (keepGoing) {
            if (!item.lid) {
              console.log('aucune langue associée ' + item.rid)
            }
            if (item.lid) {
              $scope.languagesFoundHash[item.lid] = $rootScope.languagesById[item.lid]
            }
            
            // if (!partialBuild) {

            // }

            if ($rootScope.actions[item.act].planning == 'volume') {
              volumeCount++
              ByVolume[item.fid] = item
            }
            if ($rootScope.actions[item.act].planning == 'farmer') {

              if (!hashRegroupRequests[item.hash]) {
                hashRegroupRequests[item.hash] = {}
              }
              hashRegroupRequests[item.hash][item.fid] = { day: item.dayBrut, rid: item.rid, start: item.tstart, end: item.tend }
              if (item.bid) {
                $scope.clientsFoundHash[item.cid] = $rootScope.clientsLight[item.cid]
                $scope.clientsFoundHashBase[item.cid] = $rootScope.clientsLight[item.cid]
                if (!partialBuild) {
                  $scope.projectsByPeriod[item.pid] = projectsById[item.pid]
                }
                // doit mettre booking_id  + current start et and
                ByBookings[item.bid + item.datetime_start_numeric + item.datetime_end_numeric] = item
              } else {
                // pas de réservation, on fait quoi ??
                // item.noSession = true
                // ByBookings['pseudo_' + item.fid] = item
              }
            }

            $scope.workingProjects[item.pid] = 1
            if (item.sn == 1) {
              filmCount++
            } else if (item.sn == 2) {
              serieCount++
            } else {
              otherCount++
            }

            if (item.dubStepId & 3) {
              const nbDaysConfidence = moment(item.day).diff(moment(item.rcre).format("YYYY-MM-DD"), 'days')
              
              if (nbDaysConfidence < 0) {
                // il existe des cas où le farmer est à une date avant la création de la request, nécessairement des erreurs
                // console.log(item)
              }
              const d14 = parseInt(nbDaysConfidence / nbDaysLineGraph)
              const plage = parseInt(d14 * nbDaysLineGraph)

              if (item.dubStepId & 1) {
                // disinguer les retake alias TTK alias 4
                if (!$scope.confidenceRecIndex[plage]) {
                  $scope.confidenceRecIndex[plage] = 0
                }
                if (item.is_wish == 1) {
                  $scope.confidenceRecIndex[plage] += 1
                }
                if (item.actName == 'enr_retake') {
                  if (!$scope.confidenceRecRTKIndex[plage]) {
                    $scope.confidenceRecRTKIndex[plage] = 0
                  }
                  if (item.is_wish == 1) {
                    $scope.confidenceRecRTKIndex[plage] += 1
                  }
                }
              }
              if (item.dubStepId & 2) {
                if (!$scope.confidenceMixIndex[plage]) {
                  $scope.confidenceMixIndex[plage] = 0
                }
                if (item.is_wish == 1) {
                  $scope.confidenceMixIndex[plage] += 1
                }
                if (item.actName == 'mixage_repassage' || item.actName == 'mixage_inserts') {
                  if (!$scope.confidenceMixRepassageIndex[plage]) {
                    $scope.confidenceMixRepassageIndex[plage] = 0
                  }
                  if (item.is_wish == 1) {
                    $scope.confidenceMixRepassageIndex[plage] += 1
                  }
                }
 
                
              }

            } 

          }

        }

      })

      if (!partialBuild &&  Object.values($scope.projectsByPeriod).length > 0) {
        $scope.projects = Object.values($scope.projectsByPeriod)
      }
      partialBuild = true

        $scope.dataPieTypeOfProjects = [{
            key: "Séries (" + d3.format('.01f')(serieCount / (serieCount + otherCount + filmCount) * 100) + "%)",
            y: serieCount
        }, {
            key: "Films (" + d3.format('.01f')(filmCount / (serieCount + otherCount + filmCount) * 100) + "%)",
            y: filmCount
        }, {
            key: "Autres (" + d3.format('.01f')(otherCount / (serieCount + otherCount + filmCount) * 100) + "%)",
            y: otherCount
        }]
        angular.forEach(datesDb, function(value, key) {
          doublage.push({
              x: key,
              y: value
          });

      });
      angular.forEach(datesMa, function(value, key) {
          mastering.push({
              x: key,
              y: value
          });

      });
      angular.forEach(datesSe, function(value, key) {
          servicing.push({
              x: key,
              y: value
          });

      });
      $scope.dataCumulativeChart = [{
          key: "Doublage",
          values: doublage
      }, {
          key: "Mastering",
          values: mastering
      }, {
          key: "Servicing",
          values: servicing
      }];
      $scope.workingProjectsTotal = Object.keys($scope.workingProjects).length

      $scope.dataPieTypeOfDemands = [
        {
          key: "Doublage (" + d3.format('.01f')(doublageCount / (doublageCount + masteringCount + servicingCount) * 100) + "%) " ,
          y: doublageCount
        }, 
        {
          key: "Mastering (" + d3.format('.01f')(masteringCount / (doublageCount + masteringCount + servicingCount) * 100) + "%)",
          y: masteringCount
        }, 
        {
          key: "Servicing (" + d3.format('.01f')(servicingCount / (doublageCount + masteringCount + servicingCount) * 100) + "%)",
          y: servicingCount
        }]

      const nonRendus = {
        enregistrement: 0,
        mixage: 0,
        prepa_audio: 0
      }
      const totalDemandes = {
        enregistrement: 0,
        mixage: 0,
        prepa_audio: 0
      }


      // gestion de tout ce qui est planifié
      // remplir scope.timeUsedForAuditsRecAndMix à vide par jour et salle

      // vider les heures peut-être!
      Object.keys($scope.audits).forEach((audit) => {
        $scope.audits[audit].hours = 0
        $scope.audits[audit].minutes = 0
      })
      auditData = [];
      // clef = booking_id  + current start et and
      Object.keys(ByBookings).forEach((bid) => {
        const item = ByBookings[bid]
        if ($rootScope.actions[item.act]) {
          if ($rootScope.actions[item.act].planning == 'farmer') {
            farmerCount++
            totalDemandes[item.occupation]++
            if (item.fnd == 1 && item.ff == 0) {
              nonRendus[item.occupation]++
            }
          }
        }
        if (item.dubStepRoomValue & roomsComputedOnlyRecAndMix) {
          concatenationOccupancyTime(item)
          concatenationOccupancyTechnicians(item)
          let techname = item.wid ? item.wid : ''
          if ($rootScope.lanternTechniciansById[item.wid]) {
            techname = $rootScope.lanternTechniciansById[item.wid].lastname
          }
          let lg = ''
          if (item.lid && $scope.languagesFoundHash[item.lid]) {
            lg = $scope.languagesFoundHash[item.lid].name
            $scope.languagesByPeriod[item.lid] = $scope.languagesFoundHash[item.lid]
          }
          const stepName = item.step ? $rootScope.etapes[item.step].name : ''
          const idPublished =  item.id ?  item.id :  item.bid
          const wstart =  item?.wstart || item.tstart;
          const wend =  item?.wend || item.tend;
          const request_id = item.rid ? item.rid : 'no request' 
          let dayTime = 0
          let eveningTime = 0
          if (item.dayTimeMinutes) {
            dayTime = item.dayTimeMinutes
          }
          if (item.eveningTimeMinutes) {
            eveningTime = item.eveningTimeMinutes
          }
          if (item.pid) {
            $scope.projectsByPeriod[item.pid] = true
          }
          $scope.subprojectsByPeriod[item.id] = true
          if (item.exp) {
            $scope.exploitationByPeriod[item.exp] = true
          }

          if (item.mix) {
            $scope.formatsmixByPeriod[item.mix] =  $scope.formatMixHashById[item.mix]
          }

          
          let clientName = (item.cid && $rootScope.clientsLight[item.cid] ? $rootScope.clientsLight[item.cid].name : '')
          $scope.listOfClients[clientName] = true
          console.log(';' + item.bid + ';' + item.audit + ';' + $rootScope.allRoomsById[$rootScope.allRoomsByName[item.audit]].dubbing_step + ';' + idPublished + ';' + request_id + ';' + stepName + ';' + item.dayBrut + ';' + item.tstart + ';' + item.tend + ';' 
          + wstart  + ';' + wend + ';' + item.diffMinutes + ';' + techname + ';' + lg + ';' + dayTime + ';' + eveningTime + ';' + clientName + ';');

          // Store data for export audit
          auditData.push({
            audit: item.audit,
            room: $rootScope.allRoomsById[$rootScope.allRoomsByName[item.audit]].dubbing_step,
            id: idPublished,
            rid: request_id,
            step: stepName,
            day: item.dayBrut,
            start: item.tstart,
            end: item.tend,
            wstart: wstart,
            wend: wend,
            diff: item.diffMinutes,
            tech: techname,
            language: lg,
            dayTime: dayTime,
            nightTime: eveningTime
          });
        }

        if (item.wstart) {
          const wstart = moment(item.wstart)
          const wend = moment(item.wend)
          const diff = wend.diff(wstart, 'hours')
          $scope.totalHours += diff
          if (item.audit && $scope.audits[item.audit]) {
            $scope.audits[item.audit].minutes += item.diffMinutes
          }
        } else {
          if (item.tstart && item.tend && item.is_wish != 0) {
            $scope.totalHours += item.diff
            if (item.audit && $scope.audits[item.audit]) {
              $scope.audits[item.audit].minutes += item.diffMinutes
            }
          }
        }
      })

      $scope.languagesFound = Object.values($scope.languagesFoundHash)
      $scope.clientsList = Object.values($scope.clientsFoundHash)

      computeTimeOccupancy()
      const inHoursRecOccupancyJour = parseInt($scope.occupancyGlobal.dayTime.minutes.rec / 60 ) + 'h' + $scope.occupancyGlobal.dayTime.minutes.rec % 60 + ''
      const inMnRecOccupancyJour = $scope.occupancyGlobal.dayTime.minutes.rec
      const inHoursMixOccupancyJour = parseInt($scope.occupancyGlobal.dayTime.minutes.mix / 60 ) + 'h' + $scope.occupancyGlobal.dayTime.minutes.mix % 60 + ''
      const inMnMixOccupancyJour = $scope.occupancyGlobal.dayTime.minutes.mix
      const inHoursOtherOccupancyJour = parseInt($scope.occupancyGlobal.dayTime.minutes.other / 60 ) + 'h' + $scope.occupancyGlobal.dayTime.minutes.other % 60 + ''
      const inMnOtherOccupancyJour = $scope.occupancyGlobal.dayTime.minutes.other
      const inHoursUnaOccupancyJour = parseInt($scope.occupancyGlobal.dayTime.minutes.una / 60 ) + 'h' + $scope.occupancyGlobal.dayTime.minutes.una % 60 + ''
      const inMnUnaOccupancyJour = $scope.occupancyGlobal.dayTime.minutes.una

      if ($scope.occupancyGlobal.dayTime.percents.una == 0 && $scope.occupancyGlobal.dayTime.minutes.una > 0) {
        $scope.occupancyGlobal.dayTime.percents.una = $scope.occupancyGlobal.dayTime.percents.una == 0 ? 1 : $scope.occupancyGlobal.dayTime.percents.una
      }
      if ($scope.occupancyGlobal.dayTime.percents.other == 0 && $scope.occupancyGlobal.dayTime.minutes.other > 0) {
        $scope.occupancyGlobal.dayTime.percents.other = $scope.occupancyGlobal.dayTime.percents.other == 0  ? 1 : $scope.occupancyGlobal.dayTime.percents.other
      }
    
      $scope.occupancyRatioJour = [ 
        {
        key: "rec  " + inHoursRecOccupancyJour + ' - ' + inMnRecOccupancyJour + ' mn ' + $scope.occupancyGlobal.dayTime.percents.rec + " % ",
        y: $scope.occupancyGlobal.dayTime.percents.rec,
        color: $scope.colors.rec
        },
        {
          key: "mix " + inHoursMixOccupancyJour + ' - ' + inMnMixOccupancyJour + ' mn ' +  $scope.occupancyGlobal.dayTime.percents.mix + " % " ,
          y: $scope.occupancyGlobal.dayTime.percents.mix,
          color: $scope.colors.mix
        },
        {
          key: "Autres " + inHoursOtherOccupancyJour + ' - ' + inMnOtherOccupancyJour + ' mn ' +  $scope.occupancyGlobal.dayTime.percents.other + " % " ,
          y: $scope.occupancyGlobal.dayTime.percents.other,
           color: $scope.colors.other
        },
        {
          key: "indispo  " + inHoursUnaOccupancyJour + ' - ' + inMnUnaOccupancyJour + ' mn ' +  $scope.occupancyGlobal.dayTime.percents.una + " % " ,
          y: $scope.occupancyGlobal.dayTime.percents.una,
          color: $scope.colors.una
        },
        {
          key: "inoccupé " + $scope.occupancyGlobal.dayTime.percents.lazy + ' % ',
          y: $scope.occupancyGlobal.dayTime.percents.lazy,
          color: $scope.colors.lazy
        }
      ]

      const inHoursRecOccupancyNuit = parseInt($scope.occupancyGlobal.eveningTime.minutes.rec / 60 ) + 'h' + $scope.occupancyGlobal.eveningTime.minutes.rec % 60
      const inMnRecOccupancyNuit = $scope.occupancyGlobal.eveningTime.minutes.rec
      const inHoursMixOccupancyNuit = parseInt($scope.occupancyGlobal.eveningTime.minutes.mix / 60 ) + 'h' + $scope.occupancyGlobal.eveningTime.minutes.mix % 60 + ''
      const inMnMixOccupancyNuit = $scope.occupancyGlobal.eveningTime.minutes.mix
      const inHoursOtherOccupancyNuit = parseInt($scope.occupancyGlobal.eveningTime.minutes.other / 60 ) + 'h' + $scope.occupancyGlobal.eveningTime.minutes.other % 60 + ''
      const inMnOtherOccupancyNuit = $scope.occupancyGlobal.eveningTime.minutes.other
      const inHoursUnaOccupancyNuit = parseInt($scope.occupancyGlobal.eveningTime.minutes.una / 60 ) + 'h' + $scope.occupancyGlobal.eveningTime.minutes.una % 60 + ''
      const inMnUnaOccupancyNuit = $scope.occupancyGlobal.eveningTime.minutes.una
      if ($scope.occupancyGlobal.eveningTime.percents.una == 0 && $scope.occupancyGlobal.eveningTime.minutes.una > 0) {
        $scope.occupancyGlobal.eveningTime.percents.una = $scope.occupancyGlobal.eveningTime.percents.una == 0 ? 1 : $scope.occupancyGlobal.eveningTime.percents.una
      }
      if ($scope.occupancyGlobal.eveningTime.percents.other == 0 && $scope.occupancyGlobal.eveningTime.minutes.other > 0) {
        $scope.occupancyGlobal.eveningTime.percents.other = $scope.occupancyGlobal.eveningTime.percents.other == 0 ? 1 : $scope.occupancyGlobal.eveningTime.percents.other 
      }
      $scope.occupancyRatioNuit = [ 
        {
          key: "rec " + inHoursRecOccupancyNuit  + ' - ' + inMnRecOccupancyNuit + ' mn ' + $scope.occupancyGlobal.eveningTime.percents.rec + '%',
          y: $scope.occupancyGlobal.eveningTime.percents.rec,
          color: $scope.colors.rec
        },
        {
          key: "mix " + inHoursMixOccupancyNuit  + ' - ' + inMnMixOccupancyNuit + ' mn ' + $scope.occupancyGlobal.eveningTime.percents.mix + '%',
          y: $scope.occupancyGlobal.eveningTime.percents.mix,
          color: $scope.colors.mix
        },
        {
          key: "Autres " + inHoursOtherOccupancyNuit  + ' - ' + inMnOtherOccupancyNuit + ' mn ' + $scope.occupancyGlobal.eveningTime.percents.other + '%',
          y: $scope.occupancyGlobal.eveningTime.percents.other,
          color: $scope.colors.other
        },
        {
          key: "indispo  " + inHoursUnaOccupancyNuit + ' - ' + inMnUnaOccupancyNuit + ' mn ' +  $scope.occupancyGlobal.eveningTime.percents.una + " % " ,
          y: $scope.occupancyGlobal.eveningTime.percents.una,
          color: $scope.colors.una
        },
        {
          key: "inoccupé " + $scope.occupancyGlobal.eveningTime.percents.lazy + '%',
          y: $scope.occupancyGlobal.eveningTime.percents.lazy,
          color: $scope.colors.lazy
        }
      ]

      const inHoursHybridRecOccupancyJour = parseInt($scope.occupancyGlobalHybrid.dayTime.minutes.rec / 60 ) + 'h' + $scope.occupancyGlobalHybrid.dayTime.minutes.rec % 60 + ''
      const inMnHybridRecOccupancyJour = $scope.occupancyGlobalHybrid.dayTime.minutes.rec
      const inHoursHybridMixOccupancyJour = parseInt($scope.occupancyGlobalHybrid.dayTime.minutes.mix / 60 ) + 'h' + $scope.occupancyGlobalHybrid.dayTime.minutes.mix % 60 + ''
      const inMnHybridMixOccupancyJour =  $scope.occupancyGlobalHybrid.dayTime.minutes.mix
      const inHoursHybridUnaOccupancyJour = parseInt($scope.occupancyGlobalHybrid.dayTime.minutes.una / 60 ) + 'h' + $scope.occupancyGlobalHybrid.dayTime.minutes.una % 60 + ''
      const inMnHybridUnaOccupancyJour = $scope.occupancyGlobalHybrid.dayTime.minutes.una
      const inHoursHybridOtherOccupancyJour = parseInt($scope.occupancyGlobalHybrid.dayTime.minutes.other / 60 ) + 'h' + $scope.occupancyGlobalHybrid.dayTime.minutes.other % 60 + ''
      const inMnHybridOtherOccupancyJour = $scope.occupancyGlobalHybrid.dayTime.minutes.other
      if ($scope.occupancyGlobalHybrid.dayTime.percents.una == 0 && $scope.occupancyGlobalHybrid.dayTime.minutes.una > 0) {
        $scope.occupancyGlobalHybrid.dayTime.percents.una = $scope.occupancyGlobalHybrid.dayTime.percents.una == 0 ? 1 : $scope.occupancyGlobalHybrid.dayTime.percents.una
      }
      if ($scope.occupancyGlobalHybrid.dayTime.percents.other == 0 && $scope.occupancyGlobalHybrid.dayTime.minutes.other > 0) {
        $scope.occupancyGlobalHybrid.dayTime.percents.other = $scope.occupancyGlobalHybrid.dayTime.percents.other == 0 ? 1 : $scope.occupancyGlobalHybrid.dayTime.percents.other
      }
      
      $scope.occupancyHybridRatioJour = [ 
        {
          key: "rec " + inHoursHybridRecOccupancyJour + ' - ' + inMnHybridRecOccupancyJour + ' mn ' + $scope.occupancyGlobalHybrid.dayTime.percents.rec + '%',
          y: $scope.occupancyGlobalHybrid.dayTime.percents.rec,
          color: $scope.colors.rec
        },
        {
          key: "mix " + inHoursHybridMixOccupancyJour + ' - ' + inMnHybridMixOccupancyJour + ' mn ' + $scope.occupancyGlobalHybrid.dayTime.percents.mix + '%',
          y: $scope.occupancyGlobalHybrid.dayTime.percents.mix,
          color: $scope.colors.mix
        },
        {
          key: "Autres " + inHoursHybridOtherOccupancyJour + ' - (' +  inMnHybridOtherOccupancyJour  + ' mn) ' + $scope.occupancyGlobalHybrid.dayTime.percents.other + '%',
          y: $scope.occupancyGlobalHybrid.dayTime.percents.other,
          color: $scope.colors.other
        },
        {
          key: "indispo " + inHoursHybridUnaOccupancyJour + ' - ' + inMnHybridUnaOccupancyJour + ' mn ' + $scope.occupancyGlobalHybrid.dayTime.percents.una + '%',
          y: $scope.occupancyGlobalHybrid.dayTime.percents.una,
          color: $scope.colors.una
        },
        {
          key: "inoccupé " + $scope.occupancyGlobalHybrid.dayTime.percents.lazy + '%',
          y: $scope.occupancyGlobalHybrid.dayTime.percents.lazy,
          color: $scope.colors.lazy
        }
      ]
      const inHoursHybridRecOccupancyNuit = parseInt($scope.occupancyGlobalHybrid.eveningTime.minutes.rec / 60 ) + 'h' + $scope.occupancyGlobalHybrid.eveningTime.minutes.rec % 60 + ''
      const inMnHybridRecOccupancyNuit = $scope.occupancyGlobalHybrid.eveningTime.minutes.rec
      const inHoursHybridMixOccupancyNuit = parseInt($scope.occupancyGlobalHybrid.eveningTime.minutes.mix / 60 ) + 'h ' + $scope.occupancyGlobalHybrid.eveningTime.minutes.mix % 60 + ''
      const inMnHybridMixOccupancyNuit = $scope.occupancyGlobalHybrid.eveningTime.minutes.mix
      const inHoursHybridUnaOccupancyNuit = parseInt($scope.occupancyGlobalHybrid.eveningTime.minutes.una / 60 ) + 'h' + $scope.occupancyGlobalHybrid.eveningTime.minutes.una % 60 + ''
      const inMnHybridUnaOccupancyNuit = $scope.occupancyGlobalHybrid.eveningTime.minutes.una
      $scope.occupancyHybridRatioNuit = [ 
        {
          key: "rec " + inHoursHybridRecOccupancyNuit + ' - ' + inMnHybridRecOccupancyNuit + 'mn' ,
          y: $scope.occupancyGlobalHybrid.eveningTime.percents.rec,
          color: $scope.colors.rec
        },
        {
          key: "mix " + inHoursHybridMixOccupancyNuit,
          y: $scope.occupancyGlobalHybrid.eveningTime.percents.mix,
          color: $scope.colors.mix
        },
        {
          key: "indispo " + inHoursHybridUnaOccupancyNuit,
          y: $scope.occupancyGlobalHybrid.eveningTime.percents.una,
          color: $scope.colors.una
        },
        {
          key: "inoccupé " + $scope.occupancyGlobalHybrid.eveningTime.percents.lazy + '%',
          y: $scope.occupancyGlobalHybrid.eveningTime.percents.lazy,
          color: $scope.colors.lazy
        }
      ]

      let numberMinutesRecording = 0
      let numberRecordingIngenieurs = 0
      let numberRecordingFreelances = 0
      let numberMinutesRecordingIngenieurs = 0
      let numberMinutesRecordingFreelances = 0
      let numberDays = 0
      Object.keys($scope.techniciansOccupancy[1]).forEach((day) => {
        numberDays += 1
        numberRecordingFreelances  += Object.keys($scope.techniciansOccupancy[1][day].freelances).length
        numberRecordingIngenieurs += Object.keys($scope.techniciansOccupancy[1][day].internes).length
        Object.keys($scope.techniciansOccupancy[1][day].freelances).forEach((techId) => {
          numberMinutesRecording += $scope.techniciansOccupancy[1][day].freelances[techId]
          numberMinutesRecordingFreelances += $scope.techniciansOccupancy[1][day].freelances[techId]
        })
        Object.keys($scope.techniciansOccupancy[1][day].internes).forEach((techId) => {
          numberMinutesRecording += $scope.techniciansOccupancy[1][day].internes[techId]
          numberMinutesRecordingIngenieurs += $scope.techniciansOccupancy[1][day].internes[techId]
        })
      })

      const ingRecordInHours = parseInt(numberMinutesRecordingIngenieurs / 60 ) + 'h' + numberMinutesRecordingIngenieurs % 60 + ''
      const ingRecordInMinutes = numberMinutesRecordingIngenieurs
      const freeRecordInHours = parseInt(numberMinutesRecordingFreelances / 60 ) + 'h' + numberMinutesRecordingFreelances % 60 + ''
      const freeRecordInMinutes = numberMinutesRecordingFreelances

      $scope.RecordingInternesVSFreelances = [ 
        {
          key: "Internes " + ' ' + Math.ceil(numberRecordingIngenieurs / numberDays) + ', ' + ingRecordInHours + ' - ' +  ingRecordInMinutes + ' mn',
          y: (numberMinutesRecordingIngenieurs / numberMinutesRecording) * 100
        },
        {
          key: "Freelances" + ' ' + (Math.ceil(numberRecordingFreelances / numberDays) > 1 ? Math.ceil(numberRecordingFreelances / numberDays) : 1 ) + ', ' + freeRecordInHours + ' - ' + freeRecordInMinutes + ' mn',
          y: (numberMinutesRecordingFreelances / numberMinutesRecording) * 100
        }
      ]

      let numberMinutesMix = 0
      let numberMixIngenieurs = 0
      let numberMixFreelances = 0
      let numberMinutesMixIngenieurs = 0
      let numberMinutesMixFreelances = 0
      let numberDaysMix = 0
      Object.keys($scope.techniciansOccupancy[2]).forEach((day) => {
        numberDaysMix += 1
        numberMixFreelances  += Object.keys($scope.techniciansOccupancy[2][day].freelances).length
        numberMixIngenieurs += Object.keys($scope.techniciansOccupancy[2][day].internes).length
        Object.keys($scope.techniciansOccupancy[2][day].freelances).forEach((techId) => {
          numberMinutesMix += $scope.techniciansOccupancy[2][day].freelances[techId]
          numberMinutesMixFreelances += $scope.techniciansOccupancy[2][day].freelances[techId]
        })
        Object.keys($scope.techniciansOccupancy[2][day].internes).forEach((techId) => {
          numberMinutesMix += $scope.techniciansOccupancy[2][day].internes[techId]
          numberMinutesMixIngenieurs += $scope.techniciansOccupancy[2][day].internes[techId]
        })
      })
      let NumberTotalOfMix = numberMinutesMixIngenieurs + numberMinutesMixFreelances
      const ingMixInHours = parseInt(numberMinutesMixIngenieurs / 60 ) + 'h' + numberMinutesMixIngenieurs % 60 + ''
      const ingMixInMinutes = numberMinutesMixIngenieurs
      const freeMixInHours = parseInt(numberMinutesMixFreelances / 60 ) + 'h' + numberMinutesMixFreelances % 60 + ''
      const freeMixInMinutes = numberMinutesMixFreelances
      if (numberMinutesMix == 0 ) {
        // console.log('we have a problem, Houston. numberMinutesMix == ' + numberMinutesMix)
        // console.log('So get out of this page and come back')
        numberMinutesMix = 1
        $scope.errors['ressources'] = 'Some data are not yet retrieved. So get out of this page, click on the Lantern, and come back!'
      }
      $scope.MixInternesVSFreelances = [ 
        {
          key: "Internes " + ' ' + Math.ceil(numberMixIngenieurs / numberDaysMix) + ', ' + ingMixInHours + ' - ' + ingMixInMinutes + ' mn',
          y: (numberMinutesMixIngenieurs / numberMinutesMix) * 100
        },
        {
          key: "Freelances" + ' ' + (Math.ceil(numberMixFreelances / numberDaysMix) == 0 ? 1 : Math.ceil(numberMixFreelances / numberDays)) + ', ' + freeMixInHours + ' - ' + freeMixInMinutes + ' mn',
          y: (numberMinutesMixFreelances / numberMinutesMix) * 100
        }
      ]

      // corrections et repassage

      $scope.correctionsByLang = [ 
      ]
      $scope.repassageByLang = [ 
      ]
      if ($scope.totalMixRepassage == 0) {
        // aucune donnée, mais diviser par 0, c'est mal
        $scope.totalMixRepassage = 1
      }
      if ($scope.totalMixInserts == 0) {
        // aucune donnée, mais diviser par 0, c'est mal
        $scope.totalMixInserts = 1
      }
      let repassageHasAtleastOneLangWithMorethanZero = false 
      let totalMinutesInserts = 0
      let totalMinutesRepassage = 0
      Object.keys($scope.corrections).forEach((lang) => {
        totalMinutesInserts += $scope.corrections[lang].mixage_inserts.minutes
        totalMinutesRepassage += $scope.corrections[lang].mixage_repassage.minutes
        const hour1 = parseInt($scope.corrections[lang].mixage_inserts.minutes / 60 ) + 'h' + $scope.corrections[lang].mixage_inserts.minutes % 60 + ''
        const dataInsert = {
          key: lang + ' ' + hour1,
          y: ($scope.corrections[lang].mixage_inserts.minutes / $scope.totalMixInserts) * 100
        }
        $scope.correctionsByLang.push(dataInsert)
        if ($scope.corrections[lang].mixage_repassage.minutes > 0) {
          repassageHasAtleastOneLangWithMorethanZero = true
        }
        const hour2 = parseInt($scope.corrections[lang].mixage_repassage.minutes / 60 ) + 'h' + $scope.corrections[lang].mixage_repassage.minutes % 60 + ''
        const dataRepassage = {
          key: lang + ' ' + hour2,
          y: ($scope.corrections[lang].mixage_repassage.minutes / $scope.totalMixRepassage) * 100
        }
        $scope.repassageByLang.push(dataRepassage)
      })
      if (!repassageHasAtleastOneLangWithMorethanZero) {
        const dataRepassage = {
          key: 'aucun',
          y: 100
        }
        $scope.repassageByLang.push(dataRepassage)
      }

      // NumberTotalOfMix
      $scope.repassageAndInsertVersusRestOfTheWorld = [
        {
          key: 'inserts et repassage',
          y: ((totalMinutesInserts + totalMinutesRepassage) / NumberTotalOfMix)  * 100
        },
        {
          key: 'Mix',
          y: ((NumberTotalOfMix - totalMinutesInserts - totalMinutesRepassage) / NumberTotalOfMix) * 100
        }
      ]


      const days = Object.keys(datesDb).length// moment($scope.dateEnd).diff(moment($scope.dateStart).format("YYYY-MM-DD"), 'days')
      angular.forEach($scope.audits, function(audit) {
        audit.resting = (audit.minutes / 60 / days).toFixed(2)
        audit.floatPart = (audit.resting + "").split(".")[1]
        audit.averageMn = parseInt(audit.floatPart * 60 / 100)
        audit.hoursDays = parseInt(audit.minutes / 60 / days) + '.' + audit.averageMn
        audit.percent = parseInt(audit.hoursDays / 8 * 100)
      })

      $scope.dataPieTypeOfPlanning = [ {
        key: "Farmer (" + d3.format('.01f')(farmerCount / (internalCount + volumeCount + farmerCount) * 100) + "%)",
        y: farmerCount
        }, {
            key: "Interne (" + d3.format('.01f')(internalCount / (internalCount + volumeCount + farmerCount) * 100) + "%)",
            y: internalCount
        }, {
            key: "Volume (" + d3.format('.01f')(volumeCount / (internalCount + volumeCount + farmerCount) * 100) + "%)",
            y: volumeCount
        }
      ]
      $scope.dataPieRendered = {}
      $scope.dataPieRendered.enregistrement = [ 
        {
          key: "non rendues (" + d3.format('.01f')(nonRendus.enregistrement / totalDemandes.enregistrement * 100) + "%)",
          y: nonRendus.enregistrement
        }, 
        {
          key: "rendues (" + d3.format('.01f')((totalDemandes.enregistrement - nonRendus.enregistrement) / totalDemandes.enregistrement * 100) + "%)",
          y: (totalDemandes.enregistrement - nonRendus.enregistrement)
        }
      ]

      $scope.dataPieRendered.mixage = [
        {
          key: "non rendues (" + d3.format('.01f')(nonRendus.mixage / totalDemandes.mixage * 100) + "%)",
          y: nonRendus.mixage
        }, 
        {
          key: "rendues (" + d3.format('.01f')((totalDemandes.mixage - nonRendus.mixage) / totalDemandes.mixage * 100) + "%)",
          y: (totalDemandes.mixage - nonRendus.mixage)
        }
      ]

      $scope.dataPieRendered.prepa_audio = [
        {
          key: "non rendues (" + d3.format('.01f')(nonRendus.prepa_audio / totalDemandes.prepa_audio * 100) + "%)",
          y: nonRendus.prepa_audio
        }, 
        {
          key: "rendues (" + d3.format('.01f')((totalDemandes.prepa_audio - nonRendus.prepa_audio) / totalDemandes.prepa_audio * 100) + "%)",
          y: (totalDemandes.prepa_audio - nonRendus.prepa_audio)
        }
      ]



      let confidencesRec = []

      let reliables = []

      Object.keys($scope.confidenceRecIndex).forEach((plage) => {
        if (plage < nbDaysMaxConfidenceCharts) {
          entry = {
            days: parseInt(plage),
            nb: $scope.confidenceRecIndex[plage]
          }
          confidencesRec.push(entry)
        }
      })
      $scope.dataConfidenceRecChart = [
        {
          key: 'nb',
          color: '#45B39D',
          area: true,
          values: confidencesRec
        }
      ]

      let confidencesRecRetake = []
      Object.keys($scope.confidenceRecRTKIndex).forEach((plage) => {
        if (plage < nbDaysMaxConfidenceCharts) {
          entry = {
            days: parseInt(plage),
            nb: $scope.confidenceRecRTKIndex[plage]
          }
          confidencesRecRetake.push(entry)
        }
      })

      $scope.dataConfidenceRetakeChart = [
        {
          key: 'nb',
          color: '#45B39D',
          area: true,
          values: confidencesRecRetake
        }
      ]

      let confidencesMix = []
      let confidencesMixRepassage = []

      Object.keys($scope.confidenceMixIndex).forEach((plage) => {
        if (plage < nbDaysMaxConfidenceCharts) {
          entry = {
            days: parseInt(plage),
            nb: $scope.confidenceMixIndex[plage]
          }
          confidencesMix.push(entry)
        }
      })

      $scope.dataConfidenceMixChart = [
        {
          key: 'nb',
          color: '#45B39D',
          area: true,
          values: confidencesMix
        }
      ]
      
      Object.keys($scope.confidenceMixRepassageIndex).forEach((plage) => {
        if (plage < nbDaysMaxConfidenceCharts) {
          entry = {
            days: parseInt(plage),
            nb: $scope.confidenceMixRepassageIndex[plage]
          }
          confidencesMixRepassage.push(entry)
        }
      })

      $scope.dataConfidenceMixRepassageChart = [
        {
          key: 'nb',
          color: '#45B39D',
          area: true,
          values: confidencesMixRepassage
        }
      ]

      $scope.computing = false 
      if (done) {
        return done()
      }
      // end :)
    }

    // Export audit data
    $scope.exportAuditData = function() {
      if (auditData.length == 0) {
        console.log("Audit data is empty. No data to export.");
        return;
      }
      PaoService.getAuditDataForDashboard(auditData, function() {}, function() {});
    }

    // gestion des temps pour les techs
    // $scope.techniciansOccupancy
    // $scope.corrections

    const concatenationOccupancyTechnicians = function (event) {
      const dayKey = event.dayBrut
      if (!event.wid) {
        return
      }
      if (event.dubStepId == 1) {
        // REC
        if (!$scope.techniciansOccupancy[1][dayKey]) {
          $scope.techniciansOccupancy[1][dayKey] = {
            internes: {},       // { tech_id: 0, minutes: 0 }
            freelances: {}      // { tech_id: 0, minutes: 0 }
          }
        }
        

        // normalment les demandes sont dans le passé et doivent avoir un technicien, mais bon!
        // ingénieur
        if ($rootScope.allTechnicians[event.wid] && ($rootScope.allTechnicians[event.wid].app_role_id == 65 || $rootScope.allTechnicians[event.wid].app_role_id == 67 || $rootScope.allTechnicians[event.wid].app_role_id == 68 )) {
          if ($rootScope.allTechnicians[event.wid] && ($rootScope.allTechnicians[event.wid].app_role_id == 65 || $rootScope.allTechnicians[event.wid].app_role_id == 67)) {
            if (!$scope.techniciansOccupancy[1][dayKey].internes[event.wid]) {
              $scope.techniciansOccupancy[1][dayKey].internes[event.wid] = 0
            }
            $scope.techniciansOccupancy[1][dayKey].internes[event.wid] += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
          }
          // freelance
          if ($rootScope.allTechnicians[event.wid] && $rootScope.allTechnicians[event.wid].app_role_id == 68) {
            if (!$scope.techniciansOccupancy[1][dayKey].freelances[event.wid]) {
              $scope.techniciansOccupancy[1][dayKey].freelances[event.wid] = 0
            }
            $scope.techniciansOccupancy[1][dayKey].freelances[event.wid] += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
          }
        } else {
          if ($rootScope.allTechnicians[event.rid]) {
            if ($rootScope.allTechnicians[event.rid] && ($rootScope.allTechnicians[event.rid].app_role_id == 65 || $rootScope.allTechnicians[event.rid].app_role_id == 67)) {
              if (!$scope.techniciansOccupancy[1][dayKey].internes[event.rid]) {
                $scope.techniciansOccupancy[1][dayKey].internes[event.rid] = 0
              }
              $scope.techniciansOccupancy[1][dayKey].internes[event.rid] += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
            }
            // freelance
            if ($rootScope.allTechnicians[event.rid] && $rootScope.allTechnicians[event.rid].app_role_id == 68) {
              if (!$scope.techniciansOccupancy[1][dayKey].freelances[event.rid]) {
                $scope.techniciansOccupancy[1][dayKey].freelances[event.rid] = 0
              }
              $scope.techniciansOccupancy[1][dayKey].freelances[event.rid] += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
            }
          }
        }


      }
      if (event.dubStepId == 2) {
        if (!$scope.techniciansOccupancy[2][dayKey]) {
          $scope.techniciansOccupancy[2][dayKey] = {
            internes: {},
            freelances: {}
          }
        }
        // normalement les demandes sont dans le passé et doivent avoir un technicien, mais bon!
        // ingénieur
        if ($rootScope.allTechnicians[event.wid] && ($rootScope.allTechnicians[event.wid].app_role_id == 65 || $rootScope.allTechnicians[event.wid].app_role_id == 67)) {
          if (!$scope.techniciansOccupancy[2][dayKey].internes[event.wid]) {
            $scope.techniciansOccupancy[2][dayKey].internes[event.wid] = 0
          }
          $scope.techniciansOccupancy[2][dayKey].internes[event.wid] +=  (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
        }
        // freelance
        if ($rootScope.allTechnicians[event.wid] && $rootScope.allTechnicians[event.wid].app_role_id == 68) {
          if (!$scope.techniciansOccupancy[2][dayKey].freelances[event.wid]) {
            $scope.techniciansOccupancy[2][dayKey].freelances[event.wid] = 0
          }
          $scope.techniciansOccupancy[2][dayKey].freelances[event.wid] += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
        }        
      }
      if (event.actName == 'mixage_repassage' || event.actName == 'mixage_inserts') {
        if (!$rootScope.languagesById[event.lid]) {
          console.log('pas de langue définie pour request ' + event.rid)
        } else {
          const lang = $rootScope.languagesById[event.lid].value
          if (!$scope.corrections[lang]) {
            $scope.corrections[lang] = {
              mixage_repassage: { minutes: 0 },
              mixage_inserts: { minutes: 0  }
            }
          }
          if (event.actName == 'mixage_repassage') {
            $scope.totalMixRepassage += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
          }
          if (event.actName == 'mixage_inserts') {
            $scope.totalMixInserts += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
          }
          $scope.corrections[lang][event.actName].minutes += (event.dayTimeMinutes ?  event.dayTimeMinutes : 0) + (event.eveningTimeMinutes ? event.eveningTimeMinutes: 0)
        }
      }
    }

    // calcule le temps d'ocupation pour un evenement
    // doit avoir une salle définie
    // temps passé en minutes, facile
    // pourcentage 
    // Si l'evenement est de jour ()
    // 100% si entre 7 et 10
    // - de 100% en dessous de 7heures
    // Si l'évenement est le soir
    // 100% à 7heures et plus
    // - de 100% en dessous de 7heures
    // event.dayBrut
    // Une fois tout concaténé peut faire les calculs 
    // ben non, faut calculer par jour et par salle, si on a la salle (dans le passé, j'ai la salle)
    // il est à noter que le calcul d'occupation pour le futur est compliqué par le fait qu'une demande de la prod ne peut pas être supprimée
    // ce qui signifie qu'il faut pour une demande donnée vérifier qu'il n'y a pas une réservation effective faite par le planning un autre jour.
    // avec la mise en place d'une date originale (en cours de test), le problème ne se posera plus.

    // pour le prévisionnel, CAD dans le futur demandes non planifiées:
    // REC: occuperont les studio en journée uniquement. Si les horaires des séances sont manquantes, on prendra par défaut 09h30-18h30
    // MIX: occuperont les studio en journée ou en soirée du lundi au vendredi. 
    //      Les demandes ne seront pas prioritairement planifiée de journée par rapport aux demandes de REC
    //    Ce qui signifie qu'il faut vérifier si le studio est déjà pris à l'heure proposée par du rec

    //   1: { daytime: 0, eveningtime: 0},
    //   2: { daytime: 0, eveningtime: 0}
    const concatenationOccupancyTime = function (event) {
      // il me les faut par jour, pour calculer les pourcentages d'occupation, si un rec et mix est coupé en 2 périodes de temps en jour ou en soir il faut les additionner
      // ce qui signifie que le calcul doit se faire en deux temps par salle et par jour, en plus de la séparation jour et soir
      
      // ***********
      // Pour les demandes  de MIX, si les horaires sont manquantes, on appliquera le calcul avec les coefficients

      const dayRoomKey = event.dayBrut + '-' + event.oi
      
      if (event.dubStepRoomValue & roomsComputedOnlyRecAndMix && !$scope.timeUsedForAuditsRecAndMix[dayRoomKey]) {
        $scope.timeUsedForAuditsRecAndMix[dayRoomKey] = {
          0: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          1: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          2: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          3: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          8: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0}
        }
      }
      if (event.dubStepRoomValue & roomsComputedOnlyRecAndMix &&  !$scope.timeUsedForAuditsHybrid[dayRoomKey]) {
        $scope.timeUsedForAuditsHybrid[dayRoomKey] = {
          0: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          1: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          2: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0},
          8: { daytime: 0, eveningtime: 0, daytimePercent: 0, eveningtimePercent: 0}
        }
      }
      // $scope.workingHours
      // $scope.timeUsedForAuditsRecAndMix
      // 1 ou 2 et type d'exploitation de l'action définie
      if (event.dubStepId && event.dubStepRoomValue & 3) {    // type de l'action rec ou mix

        if (event.workflowDubTypeBitValue) {
          if (event.dubStepId & 11) {

            // devrait être 600, mais le charge est de 900 à 1830
            if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
              // c'est du jour
              // la diff en minutes, c'est le temps jour jusqu'à la limite indiquée
              // si la fin est après 1830
              if (event.time_end_numeric > 1830) {
                // heures chevauchent
                // heures de journée
                const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
                $scope.timeUsedForAuditsRecAndMix[dayRoomKey][event.dubStepId].daytime += minutes
                event.dayTimeMinutes = minutes
                // et le reste est du soir
                const minutesForEvening =  hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
                $scope.timeUsedForAuditsRecAndMix[dayRoomKey][event.dubStepId].eveningtime += minutesForEvening
                event.eveningTimeMinutes = minutesForEvening
                // et si les heures sont avant 900, on prend tout  ??

              } else {
                $scope.timeUsedForAuditsRecAndMix[dayRoomKey][event.dubStepId].daytime += event.diffMinutes
                event.dayTimeMinutes = event.diffMinutes
              }
            }
            if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
              // le soir 
              // c'est de soir ou de nuit, jsuqu'à 6h du matin
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][event.dubStepId].eveningtime += event.diffMinutes
              event.eveningTimeMinutes = event.diffMinutes
            }
          }
        } else {
          // notes indispo
          if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
            // c'est du jour
            if (event.time_end_numeric > 1830) {
              // avec chevauchement

              const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += minutes
              const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += minutesForEvening
            } else {
              // sans chevauchement
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += event.diffMinutes
            }
          }
          if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
            // c'est de soir ou de nuit, jsuqu'à 6h du matin
            $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += event.diffMinutes
          }
        }
      } else {
        // pas d'action définie, indisponibilité et notes, donc autre
        // si pour une indisponibilité, la durée est supérieure à 10h, est-ce que le pourcentage est supérieur à 100 sachant que cela ne dit rien d'une activité de doublage ?
        // pour maintenance ou autre, si le studio est mixte, le type d'exploitation pris en compte sera rec par défaut
        if (event.dubStepRoomValue & 1) {
          if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
            // c'est du jour
            if (event.time_end_numeric > 1830) {
              // avec chevauchement
              const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += minutes
              const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += minutesForEvening
            } else {
              // sans chevauchement
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += event.diffMinutes
            }
          }
          if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
            // c'est de soir ou de nuit, jsuqu'à 6h du matin
            $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += event.diffMinutes
          }
        } else if (event.dubStepRoomValue & 2) {
          // et action de type mix, sinon ça on a trop
          if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
            // c'est du jour
            if (event.time_end_numeric > 1830) {
              const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += minutes
              const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += minutesForEvening
            } else {
              $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].daytime += event.diffMinutes
            }
          }
          if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
            // c'est de soir ou de nuit, jsuqu'à 6h du matin
            $scope.timeUsedForAuditsRecAndMix[dayRoomKey][0].eveningtime += event.diffMinutes
          }
        } else {
          // event ni mix ni rec
        }
        // pour les salles hybrides ? pris en rec par défaut

      }
      // et si c'est les deux, on regarde si l'action est 1 ou 2
      // si la salle utilisée est mixte autrement dit 1 ET 2, mais pas prepa
      if (event.dubStepRoomValue == 3) {
        // rec/mix/indisponibilités et inoccupé
        // salles hybrides, on regarde l'action utilisée
        if (event.dubStepId) {
          if (event.workflowDubTypeBitValue) {
            // action
            if (event.dubStepId & 11) {
              if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
                // c'est du jour
                if (event.time_end_numeric > 1830) {
                  // avec chevauchement
                  const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
                  $scope.timeUsedForAuditsHybrid[dayRoomKey][event.dubStepId].daytime += minutes
                  const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
                  $scope.timeUsedForAuditsHybrid[dayRoomKey][event.dubStepId].eveningtime += minutesForEvening
                } else {
                  $scope.timeUsedForAuditsHybrid[dayRoomKey][event.dubStepId].daytime += event.diffMinutes
                }
              }
              if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
                // c'est de soir ou de nuit, jsuqu'à 6h du matin
                $scope.timeUsedForAuditsHybrid[dayRoomKey][event.dubStepId].eveningtime += event.diffMinutes
              }
            } else {
              // rien ni rec ni mix ni prepa
            }
          } else {
            // indisponible notes
            if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
              // c'est du jour
              if (event.time_end_numeric > 1830) {
                  // avec chevauchement
                  const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
                  $scope.timeUsedForAuditsHybrid[dayRoomKey][0].daytime += minutes
                  const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
                  $scope.timeUsedForAuditsHybrid[dayRoomKey][0].eveningtime += minutesForEvening
              } else {
                $scope.timeUsedForAuditsHybrid[dayRoomKey][0].daytime += event.diffMinutes
              }
              
            }
            if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
              // c'est de soir ou de nuit, jsuqu'à 6h du matin
              $scope.timeUsedForAuditsHybrid[dayRoomKey][0].eveningtime += event.diffMinutes
            }
          }
        } else {
          // indisponible
          if (event.time_start_numeric >= 600 && event.time_start_numeric < 1830) {
            // c'est du jour
            if (event.time_end_numeric > 1830) {
                // avec chevauchement
                const minutes = hours2minutes($scope.workingHours.dayTime, event.real_time_start_splitted)
                $scope.timeUsedForAuditsHybrid[dayRoomKey][0].daytime += minutes
                const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, event.real_time_end_splitted)
                $scope.timeUsedForAuditsHybrid[dayRoomKey][0].eveningtime += minutesForEvening
            } else {
              $scope.timeUsedForAuditsHybrid[dayRoomKey][0].daytime += event.diffMinutes
            }
            
          }
          if (event.time_start_numeric >= 1830 || (event.time_start_numeric % 2400) < 600) {
            // c'est de soir ou de nuit, jsuqu'à 6h du matin
            $scope.timeUsedForAuditsHybrid[dayRoomKey][0].eveningtime += event.diffMinutes
          }
        }
      }
    }

    // first, see function above to get all informations from notes and bookings
    // then compute all
    // $scope.NbDayTimeDaysAvailableForThePeriod nombre de jours pris en compte
    // $scope.NbEveningTimeDaysForThePeriod   nombre de jours pris en compte
    // devrait ajouter les temps d'indisponibilité qui ne sont ni rec ni mix
    const computeTimeOccupancy = function () {
      
      Object.keys($scope.timeUsedForAuditsRecAndMix).forEach((timeRoomKey) => {
        let lazyDayTimePercent = 0
        let lazyEveningTimePercent = 0
        let occupiedDayTimePercent = 0
        let occupiedEveningTimePercent = 0
        // recording
        const item1 = $scope.timeUsedForAuditsRecAndMix[timeRoomKey][1]
        item1.daytimePercent = 0
        item1.eveningtimePercent = 0 
        if (item1.daytime > 0) {
          if (item1.daytime >= $scope.durationToBeFullTime) {
            item1.daytimePercent = 100
          } else {
            item1.daytimePercent = (item1.daytime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobal.dayTime.minutes.total += item1.daytime
          $scope.occupancyGlobal.dayTime.minutes.rec += item1.daytime
          $scope.occupancyGlobal.dayTime.percents.rec += item1.daytimePercent
          occupiedDayTimePercent += item1.daytimePercent
          lazyDayTimePercent += (100 - item1.daytimePercent)
        }
        if (item1.eveningtime > 0) {
          if (item1.eveningtime >= $scope.durationToBeFullTime) {
            item1.eveningtimePercent = 100
          } else {
            item1.eveningtimePercent = (item1.eveningtime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobal.eveningTime.minutes.total += item1.eveningtime
          $scope.occupancyGlobal.eveningTime.minutes.rec += item1.eveningtime
          $scope.occupancyGlobal.eveningTime.percents.rec += item1.eveningtimePercent
          occupiedEveningTimePercent += item1.eveningtimePercent
          lazyEveningTimePercent += (100 - item1.eveningtimePercent)
        }

        const item2 = $scope.timeUsedForAuditsRecAndMix[timeRoomKey][2]
        item2.daytimePercent = 0
        item2.eveningtimePercent = 0 
        if (item2.daytime > 0) {
          if (item2.daytime >= $scope.durationToBeFullTime) {
            item2.daytimePercent = 100
          } else {
            item2.daytimePercent = (item2.daytime / $scope.durationToBeFullTime * 100)
          }

          $scope.occupancyGlobal.dayTime.minutes.total += item2.daytime
          $scope.occupancyGlobal.dayTime.minutes.mix += item2.daytime
          $scope.occupancyGlobal.dayTime.percents.mix += item2.daytimePercent
          occupiedDayTimePercent += item2.daytimePercent
          lazyDayTimePercent += (100 - item2.daytimePercent)
        }
        if (item2.eveningtime > 0) {
          if (item2.eveningtime >= $scope.durationToBeFullTime) {
            item2.eveningtimePercent = 100
          } else {
            item2.eveningtimePercent = (item2.eveningtime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobal.eveningTime.minutes.total += item2.eveningtime
          $scope.occupancyGlobal.eveningTime.minutes.mix += item2.eveningtime
          $scope.occupancyGlobal.eveningTime.percents.mix += item2.eveningtimePercent
          occupiedEveningTimePercent += item2.eveningtimePercent
          lazyEveningTimePercent += (100 - item2.eveningtimePercent)
        }
        const item0 = $scope.timeUsedForAuditsRecAndMix[timeRoomKey][0]
        item0.daytimePercent = 0
        item0.eveningtimePercent = 0 
        if (item0.daytime > 0) {
          if (item0.daytime >= $scope.durationToBeFullTime) {
            item0.daytimePercent = 100
          } else {
            item0.daytimePercent = (item0.daytime / $scope.durationToBeFullTime * 100)
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobal.dayTime.minutes.total += item0.daytime
          $scope.occupancyGlobal.dayTime.minutes.una += item0.daytime
          $scope.occupancyGlobal.dayTime.percents.una += item0.daytimePercent
          occupiedDayTimePercent += item0.daytimePercent
          lazyDayTimePercent += (100 - item0.daytimePercent)
        }
        if (item0.eveningtime > 0) {
          if (item0.eveningtime >= $scope.durationToBeFullTime) {
            item0.eveningtimePercent = 100
          } else {
            item0.eveningtimePercent = (item0.eveningtime / $scope.durationToBeFullTime * 100)
            
          }
          $scope.occupancyGlobal.eveningTime.minutes.total += item0.eveningtime
          $scope.occupancyGlobal.eveningTime.minutes.una += item0.eveningtime
          $scope.occupancyGlobal.eveningTime.percents.una += item0.eveningtimePercent
          occupiedEveningTimePercent += item0.eveningtimePercent
          lazyEveningTimePercent += (100 - item0.eveningtimePercent)
        }
        // prepa audio
        const item8 = $scope.timeUsedForAuditsRecAndMix[timeRoomKey][8]
        item8.daytimePercent = 0
        item8.eveningtimePercent = 0 
        if (item8.daytime > 0) {
          if (item8.daytime >= $scope.durationToBeFullTime) {
            item8.daytimePercent = 100
          } else {
            item8.daytimePercent = (item8.daytime / $scope.durationToBeFullTime * 100)
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobal.dayTime.minutes.total += item8.daytime
          $scope.occupancyGlobal.dayTime.minutes.other += item8.daytime
          $scope.occupancyGlobal.dayTime.percents.other += item8.daytimePercent
          occupiedDayTimePercent += item8.daytimePercent
          lazyDayTimePercent += (100 - item8.daytimePercent)
        }
        if (item8.eveningtime > 0) {
          if (item8.eveningtime >= $scope.durationToBeFullTime) {
            item8.eveningtimePercent = 100
          } else {
            item8.eveningtimePercent = (item8.eveningtime / $scope.durationToBeFullTime * 100)
            
          }
          $scope.occupancyGlobal.eveningTime.minutes.total += item8.eveningtime
          $scope.occupancyGlobal.eveningTime.minutes.other += item8.eveningtime
          $scope.occupancyGlobal.eveningTime.percents.other += item8.eveningtimePercent
          occupiedEveningTimePercent += item8.eveningtimePercent
          lazyEveningTimePercent += (100 - item8.eveningtimePercent)
        }   
        

        if (occupiedEveningTimePercent == 0) {
          lazyEveningTimePercent = 100 - occupiedEveningTimePercent
        }
        if (occupiedDayTimePercent == 0) {
          lazyDayTimePercent = 100 - occupiedDayTimePercent
        }
      

        $scope.occupancyGlobal.dayTime.percents.lazy += lazyDayTimePercent
        $scope.occupancyGlobal.eveningTime.percents.lazy += lazyEveningTimePercent
      })

      $scope.occupancyGlobal.dayTime.percents.rec = parseInt($scope.occupancyGlobal.dayTime.percents.rec / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.dayTime.percents.mix = parseInt($scope.occupancyGlobal.dayTime.percents.mix / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.dayTime.percents.una = parseInt($scope.occupancyGlobal.dayTime.percents.una / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.dayTime.percents.other = parseInt($scope.occupancyGlobal.dayTime.percents.other / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.dayTime.percents.lazy = parseInt($scope.occupancyGlobal.dayTime.percents.lazy / Object.keys($scope.timeUsedForAuditsRecAndMix).length)

      $scope.occupancyGlobal.eveningTime.percents.rec = parseInt($scope.occupancyGlobal.eveningTime.percents.rec / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.eveningTime.percents.mix = parseInt($scope.occupancyGlobal.eveningTime.percents.mix / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.eveningTime.percents.una = parseInt($scope.occupancyGlobal.eveningTime.percents.una / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.eveningTime.percents.other = parseInt($scope.occupancyGlobal.eveningTime.percents.other / Object.keys($scope.timeUsedForAuditsRecAndMix).length)
      $scope.occupancyGlobal.eveningTime.percents.lazy = parseInt($scope.occupancyGlobal.eveningTime.percents.lazy / Object.keys($scope.timeUsedForAuditsRecAndMix).length)

      // occupancyRatioHybrideJour
      Object.keys($scope.timeUsedForAuditsHybrid).forEach((timeRoomKey) => {
        let lazyDayTimePercent = 0
        let lazyEveningTimePercent = 0
        let occupiedDayTimePercent = 0
        let occupiedEveningTimePercent = 0
        // ni rec, ni mix, donc indispos diverses
        const item0 = $scope.timeUsedForAuditsHybrid[timeRoomKey][0]
        if (item0.daytime > 0) {
          if (item0.daytime >= $scope.durationToBeFullTime) {
            item0.daytimePercent = 100
          } else {
            item0.daytimePercent = (item0.daytime / $scope.durationToBeFullTime * 100)
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobalHybrid.dayTime.minutes.total += item0.daytime
          $scope.occupancyGlobalHybrid.dayTime.minutes.una += item0.daytime
          $scope.occupancyGlobalHybrid.dayTime.percents.una += item0.daytimePercent
          occupiedDayTimePercent += item0.daytimePercent
          lazyDayTimePercent += (100 - item0.daytimePercent)
        }
        if (item0.eveningtime > 0) {
          if (item0.eveningtime >= $scope.durationToBeFullTime) {
            item0.eveningtimePercent = 100
          } else {
            item0.eveningtimePercent = (item0.eveningtime / $scope.durationToBeFullTime * 100)
            
          }
          $scope.occupancyGlobalHybrid.eveningTime.minutes.total += item0.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.minutes.una += item0.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.percents.una += item0.eveningtimePercent
          occupiedEveningTimePercent += item0.eveningtimePercent

          lazyEveningTimePercent += (100 - item0.eveningtimePercent)
        }

        const item1 = $scope.timeUsedForAuditsHybrid[timeRoomKey][1]
        if (item1.daytime > 0) {
          if (item1.daytime >= $scope.durationToBeFullTime) {
            item1.daytimePercent = (item1.daytime / $scope.durationToBeFullTime * 100)
          } else {
            item1.daytimePercent = 100
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobalHybrid.dayTime.minutes.total += item1.daytime
          $scope.occupancyGlobalHybrid.dayTime.minutes.rec += item1.daytime
          $scope.occupancyGlobalHybrid.dayTime.percents.rec += item1.daytimePercent
          occupiedDayTimePercent += item1.daytimePercent
          lazyDayTimePercent += (100 - item1.daytimePercent)
        }
        if (item1.eveningtime > 0) {
          if (item1.eveningtime >= $scope.durationToBeFullTime) {
            item1.eveningtimePercent = 100
          } else {
            item1.eveningtimePercent = (item1.eveningtime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobalHybrid.eveningTime.minutes.total += item1.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.minutes.rec += item1.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.percents.rec += item1.eveningtimePercent
          occupiedEveningTimePercent += item1.eveningtimePercent
          lazyEveningTimePercent += (100 - item1.eveningtimePercent)
        }

        const item2 = $scope.timeUsedForAuditsHybrid[timeRoomKey][2]
        if (item2.daytime > 0) {
          if (item2.daytime >= $scope.durationToBeFullTime) {
            item2.daytimePercent = 100
          } else {
            item2.daytimePercent = (item2.daytime / $scope.durationToBeFullTime * 100)
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobalHybrid.dayTime.minutes.total += item2.daytime
          $scope.occupancyGlobalHybrid.dayTime.minutes.mix += item2.daytime
          $scope.occupancyGlobalHybrid.dayTime.percents.mix += item2.daytimePercent
          occupiedDayTimePercent += item2.daytimePercent
          lazyDayTimePercent += (100 - item2.daytimePercent)
        }
        if (item2.eveningtime > 0) {
          if (item2.eveningtime >= $scope.durationToBeFullTime) {
            item2.eveningtimePercent = 100
          } else {
            item2.eveningtimePercent = (item2.eveningtime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobalHybrid.eveningTime.minutes.total += item2.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.minutes.mix += item2.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.percents.mix += item2.eveningtimePercent
          occupiedEveningTimePercent += item2.eveningtimePercent
          lazyEveningTimePercent += (100 - item2.eveningtimePercent)
        }

        const item8 = $scope.timeUsedForAuditsHybrid[timeRoomKey][8]
        // autre donc prepa_audio
        if (item8.daytime > 0) {
          if (item2.daytime >= $scope.durationToBeFullTime) {
            item8.daytimePercent = 100
          } else {
            item8.daytimePercent = (item8.daytime / $scope.durationToBeFullTime * 100)
          }
          // j'ai besoin de l'activité
          $scope.occupancyGlobalHybrid.dayTime.minutes.total += item8.daytime
          $scope.occupancyGlobalHybrid.dayTime.minutes.other += item8.daytime
          $scope.occupancyGlobalHybrid.dayTime.percents.other += item8.daytimePercent
          occupiedDayTimePercent += item8.daytimePercent
          lazyDayTimePercent += (100 - item8.daytimePercent)
        }
        if (item8.eveningtime > 0) {
          if (item8.eveningtime >= $scope.durationToBeFullTime) {
            item8.eveningtimePercent = 100
          } else {
            item8.eveningtimePercent = (item8.eveningtime / $scope.durationToBeFullTime * 100)
          }
          $scope.occupancyGlobalHybrid.eveningTime.minutes.total += item8.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.minutes.other += item8.eveningtime
          $scope.occupancyGlobalHybrid.eveningTime.percents.other += item8.eveningtimePercent
          occupiedEveningTimePercent += item8.eveningtimePercent
          lazyEveningTimePercent += (100 - item8.eveningtimePercent)
        }

        if (occupiedEveningTimePercent == 0) {
          lazyEveningTimePercent = 100 - occupiedEveningTimePercent
        }
        if (occupiedDayTimePercent == 0) {
          lazyDayTimePercent = 100 - occupiedDayTimePercent
        }
      

        $scope.occupancyGlobalHybrid.dayTime.percents.lazy += lazyDayTimePercent
        $scope.occupancyGlobalHybrid.eveningTime.percents.lazy += lazyEveningTimePercent

      })

      $scope.occupancyGlobalHybrid.dayTime.percents.una = parseInt($scope.occupancyGlobalHybrid.dayTime.percents.una / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.dayTime.percents.rec = parseInt($scope.occupancyGlobalHybrid.dayTime.percents.rec / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.dayTime.percents.mix = parseInt($scope.occupancyGlobalHybrid.dayTime.percents.mix / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.dayTime.percents.other = parseInt($scope.occupancyGlobalHybrid.dayTime.percents.other / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.dayTime.percents.lazy = parseInt($scope.occupancyGlobalHybrid.dayTime.percents.lazy / Object.keys($scope.timeUsedForAuditsHybrid).length)


      $scope.occupancyGlobalHybrid.eveningTime.percents.una = parseInt($scope.occupancyGlobalHybrid.eveningTime.percents.una / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.eveningTime.percents.rec = parseInt($scope.occupancyGlobalHybrid.eveningTime.percents.rec / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.eveningTime.percents.mix = parseInt($scope.occupancyGlobalHybrid.eveningTime.percents.mix / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.eveningTime.percents.other = parseInt($scope.occupancyGlobalHybrid.eveningTime.percents.other / Object.keys($scope.timeUsedForAuditsHybrid).length)
      $scope.occupancyGlobalHybrid.eveningTime.percents.lazy = parseInt($scope.occupancyGlobalHybrid.eveningTime.percents.lazy / Object.keys($scope.timeUsedForAuditsHybrid).length)
    } 
  


    function init() {
      $scope.totalHours = 0
      $scope.workingProjects = {}
      $scope.requestsCreatedDuringPeriod = 0
      $scope.totalHours = 0
      $scope.workingProjects = {}
      $scope.workingProjectsTotal = 0
      $scope.requestsCreatedDuringPeriod = 0
      const data = {
        date_start: moment($scope.dateStart).format('YYYY-MM-DD'),
        date_end: moment($scope.dateEnd).format('YYYY-MM-DD')
      }

    }

    /** 
     * Calcul les jours disponibles pour une période donnée
     * Permet d'avoir un tableau de dates comptes
     * $scope.holidays
     */
    // Temps global pour un studio
    // Utilisé uniquement pour rec et mix, pas prepa et pas montage



    $scope.globalHoursDetail = {}
    $scope.NbDayTimeDaysAvailableForThePeriod = 0
    $scope.NbEveningTimeDaysForThePeriod = 0
    function setDateSince(startDate, endDate) {
      // en minutes :)
      const globalHours = {}
      const dates = {}
      let start = parseInt(moment(startDate).format('x'))
      const end = parseInt(moment(endDate).format('x')) - 86400000
      if (endDate < startDate) {
        return dates
      }
      dates[start] = 0
      const day = moment(start).format('YYYY-MM-DD')
      if (!globalHours[day]) {
        globalHours[day] = {
          daytime: 0,
          eveningtime: 0
        } 
      }      
      if ($scope.holidays[day]) {
        datesDayCancelled[day] = true
        datesEveningCancelled[day] = true
      }
      const weekday = moment(start).isoWeekday()
      // exclude sunday
      if (weekday == 7) {
        datesDayCancelled[day] = true
        datesEveningCancelled[day] = true
      }
      // exclude saturday partially
      if (weekday == 6 ) {
        if ($scope.saturdayChoice == 1) {
          datesDayCancelled[day] = false
          datesEveningCancelled[day] = true
        } else if ($scope.saturdayChoice == 2) {
          datesDayCancelled[day] = false
          datesEveningCancelled[day] = false
        } else {
          datesDayCancelled[day] = true
          datesEveningCancelled[day] = true
        }
        
      }
      if (!datesDayCancelled[day]) {
        globalHours[day].daytime += $scope.WorkingDayDurationInMn // 9h00 en minutes pour les rec
        if (!datesEveningCancelled[day]) {
          globalHours[day].eveningtime += $scope.WorkingEveningDurationInMn // 7h en minutes
        }
      }
      // loop
      let nbDays = 1
      while (start <= end) {
        nbDays++
        start += 86400000
        const day = moment(start).format('YYYY-MM-DD')
        if (!globalHours[day]) {
          globalHours[day] = {
            daytime: 0,
            eveningtime: 0
          } 
        }  
        if ($scope.holidays[day]) {
          datesDayCancelled[day] = true
          datesEveningCancelled[day] = true
        }
        const weekday = moment(start).isoWeekday()

        if (weekday == 7) {
          datesDayCancelled[day] = true
          datesEveningCancelled[day] = true
        }
        if (weekday == 6) {
          datesEveningCancelled[day] = true
        }
        
        if (!datesDayCancelled[day]) {
          globalHours[day].daytime += $scope.WorkingDayDurationInMn // 9h30 en minutes
          if (!datesEveningCancelled[day]) {
            // on doit compte 8 heures, avec les pause, sinon on est faux
            globalHours[day].eveningtime += $scope.WorkingEveningDurationInMn // 7h en minutes
          }
        }
        dates[start] = 0
      }

      // hop, initialise pour la période
      // initialise le nombre de jours pris en compte
      $scope.NbDayTimeDaysAvailableForThePeriod = Object.keys(dates).length - Object.keys(datesDayCancelled).length
      $scope.NbEveningTimeDaysForThePeriod = Object.keys(dates).length - Object.keys(datesEveningCancelled).length

      $scope.globalHoursDetail = globalHours
      return dates
    }

    $scope.avoidDay = function (day) {
      if (new Date(day).getDay() == 0) {
        return true
      }
      if (new Date(day).getDay() == 6 && $scope.saturdayChoice == 0) {
        return true
      }
      return false
    }

    $scope.optionsCumulativeChart = {
      chart: {
        type: 'lineChart',
        height: 350,
        margin: {
          top: 20,
          right: 30,
          bottom: 30,
          left: 30
        },
        x: function(d) {
          return d.x;
        },
        y: function(d) {
          return d.y;
        },
        useInteractiveGuideline: true,
        xAxis: {
          tickFormat: function(d) {
            return d3.time.format('%d/%m/%y')(new Date(parseInt(d)))
          }
        },
        yAxis: {
          axisLabel: $rootScope._T['tim1tphm'],
          tickFormat: function(d) {
            return (d);
          },
          axisLabelDistance: 30
        }
      },
      title: {
        enable: true,
        text: $rootScope._T['tim1tphm']
      }
    };

    $scope.optionsPie = {
      chart: {
        type: 'pieChart',
        height: 350,
        donut: true,
        x: function(d) {
          return d.key;
        },
        y: function(d) {
          return d.y;
        },
        showLabels: true,
        labelsOutside: true,
        transitionDuration: 500,
        showLegend: false
      }
    }

    // demandes/farmer rendues/non rendues par type d'occupation : rec/mix/prepa audi
    $scope.optionsRendered = {
      chart: {
        type: 'pieChart',
        height: 350,
        donut: true,
        x: function(d) {
          return d.key;
        },
        y: function(d) {
          return d.y;
        },
        showLabels: true,
        labelsOutside: true,
        transitionDuration: 500,
        showLegend: false
      }
    }
    // affichage taux d'occupation globale par type d'exploitation
    $scope.nuitJour = {
      chart: {
        type: 'pieChart',
        height: 350,
        donut: true,
        x: function(d) {
          return d.key;
        },
        y: function(d) {
          return d.y;
        },
        showLabels: true,
        labelsOutside: true,
        transitionDuration: 500,
        showLegend: false
      }
    }

    $scope.mixByLang = {
      chart: {
        type: 'pieChart',
        height: 350,
        donut: true,
        x: function(d) {
          return d.key;
        },
        y: function(d) {
          return d.y;
        },
        showLabels: true,
        labelsOutside: true,
        transitionDuration: 500,
        showLegend: false
      }
    }


    $scope.value = 13;

    $scope.min = 0;
    $scope.max = 12;

    $scope.width = undefined;
    $scope.height = undefined;
    $scope.relativeGaugeSize = undefined;

    $scope.gaugeWidthScale = undefined;


    $scope.noGradient = false;

    $scope.label = 'Heures';

    $scope.startAnimationTime = 1000;
    $scope.refreshAnimationTime = undefined;
    $scope.refreshAnimationType = undefined;


    $scope.counter = true;
    $scope.decimals = 2;
    $scope.symbol = 'X';
    $scope.formatNumber = true;
    $scope.humanFriendly = true;
    $scope.humanFriendlyDecimal = true;

    $scope.textRenderer = function(value) {
      return value;
    };

    // même chose que pour les salles, mais attribuer des techs
    const fillForecastTechsWorkTime = function () {

      // premier passage en remplissant d'abord les salles rec
      // avec des ingénieurs
      Object.keys(recSessions).forEach((hashDayKey) => {
        const keys = Object.keys(recSessions[hashDayKey])
        const dayBrut = recSessions[hashDayKey][keys[0]].dayBrut
        const item = recSessions[hashDayKey][keys[0]]
        if (item.dubStepRoomValue == 1 && item.is_wish != 0 && !item.wid) {
          let found = false
          Object.keys(TechsByType.ingenieur).some((techId) => {
            if (TechOccupancy[dayBrut]) {
              if (TechOccupancy[dayBrut][techId] && TechOccupancy[dayBrut][techId] == 0) {
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else if (!TechOccupancy[dayBrut][techId]) {
                TechOccupancy[dayBrut] = {}
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else {
                if (TechOccupancy[dayBrut][techId] < 540 && (TechOccupancy[dayBrut][techId] + item.diffMinutes) < 540) {
                  TechOccupancy[dayBrut][techId] += item.diffMinutes
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].wid = techId
                  })
                  found = true
                }
              }

            } else {
              TechOccupancy[dayBrut] = {}
              TechOccupancy[dayBrut][techId] = item.diffMinutes
              Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                recSessions[hashDayKey][fid].wid = techId
              })
              found = true
            }
            return found
          })
        }
      })

      // deuxième passage en remplissant les salles hybrides
      Object.keys(recSessions).forEach((hashDayKey) => {
        const keys = Object.keys(recSessions[hashDayKey])
        const dayBrut = recSessions[hashDayKey][keys[0]].dayBrut
        const item = recSessions[hashDayKey][keys[0]]
        if (item.dubStepRoomValue & 3 && item.is_wish != 0 && !item.wid) {
          let found = false
          Object.keys(TechsByType.ingenieur).some((techId) => {
            if (TechOccupancy[dayBrut]) {
              if (TechOccupancy[dayBrut][techId] && TechOccupancy[dayBrut][techId] == 0) {
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else if (!TechOccupancy[dayBrut][techId]) {
                TechOccupancy[dayBrut] = {}
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else {
                if (TechOccupancy[dayBrut][techId] < 540 && (TechOccupancy[dayBrut][techId] + item.diffMinutes) < 540) {
                  TechOccupancy[dayBrut][techId] += item.diffMinutes
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].wid = techId
                  })
                  found = true
                }
              }

            } else {
              TechOccupancy[dayBrut] = {}
              TechOccupancy[dayBrut][techId] = item.diffMinutes
              Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                recSessions[hashDayKey][fid].wid = techId
              })
              found = true
            }
            return found
          })
        }
      })

      // check if there is a requested session without room
      // doit vérifier s'il reste des heures non placées, autrement dit recSessions sans booking_id
      Object.keys(recSessions).forEach((hashDayKey) => {
        Object.keys(recSessions[hashDayKey]).forEach((id) => {
          if (!recSessions[hashDayKey][id].wid) {
            if (recSessions[hashDayKey][id].is_wish == 1) {
              $scope.warningsTechsOverQuota.ingenieur = true
              $scope.warningsTechsOverQuotaByDay.ingenieur[recSessions[hashDayKey][id].dayBrut] = 'rec'
            }
          }
        })
      })

      // troisème passage en remplissant les salles mix
      Object.keys(mixSessions).forEach((hashDayKey) => {
        const keys = Object.keys(mixSessions[hashDayKey])
        const dayBrut = mixSessions[hashDayKey][keys[0]].dayBrut
        const item = mixSessions[hashDayKey][keys[0]]
        if (item.dubStepRoomValue & 2 && item.is_wish != 0 && !item.wid) {
          let found = false
          Object.keys(TechsByType.ingenieur).some((techId) => {
            if (TechOccupancy[dayBrut]) {
              if (TechOccupancy[dayBrut][techId] && TechOccupancy[dayBrut][techId] == 0) {
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                  mixSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else if (!TechOccupancy[dayBrut][techId]) {
                TechOccupancy[dayBrut] = {}
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                  mixSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else {
                if (TechOccupancy[dayBrut][techId] < 540 && (TechOccupancy[dayBrut][techId] + item.diffMinutes) < 540) {
                  TechOccupancy[dayBrut][techId] += item.diffMinutes
                  Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                    mixSessions[hashDayKey][fid].wid = techId
                  })
                  found = true
                }
              }

            } else {
              TechOccupancy[dayBrut] = {}
              TechOccupancy[dayBrut][techId] = item.diffMinutes
              Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                mixSessions[hashDayKey][fid].wid = techId
              })
              found = true
            }
            return found
          })
        }
      })

      // troisème passage en remplissant les salles hybrides
      Object.keys(mixSessions).forEach((hashDayKey) => {
        const keys = Object.keys(mixSessions[hashDayKey])
        const dayBrut = mixSessions[hashDayKey][keys[0]].dayBrut
        const item = mixSessions[hashDayKey][keys[0]]
        if (item.dubStepRoomValue & 3 && item.is_wish != 0 && !item.wid) {
          let found = false
          Object.keys(TechsByType.ingenieur).some((techId) => {
            if (TechOccupancy[dayBrut]) {
              if (TechOccupancy[dayBrut][techId] && TechOccupancy[dayBrut][techId] == 0) {
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                  mixSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else if (!TechOccupancy[dayBrut][techId]) {
                TechOccupancy[dayBrut] = {}
                TechOccupancy[dayBrut][techId] = item.diffMinutes
                Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                  mixSessions[hashDayKey][fid].wid = techId
                })
                found = true
              } else {
                if (TechOccupancy[dayBrut][techId] < 540 && (TechOccupancy[dayBrut][techId] + item.diffMinutes) < 540) {
                  TechOccupancy[dayBrut][techId] += item.diffMinutes
                  Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                    mixSessions[hashDayKey][fid].wid = techId
                  })
                  found = true
                }
              }

            } else {
              TechOccupancy[dayBrut] = {}
              TechOccupancy[dayBrut][techId] = item.diffMinutes
              Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                mixSessions[hashDayKey][fid].wid = techId
              })
              found = true
            }
            return found
          })
        }
      })


      Object.keys(mixSessions).forEach((hashDayKey) => {
        Object.keys(mixSessions[hashDayKey]).forEach((id) => {
          if (!mixSessions[hashDayKey][id].wid) {
            if (mixSessions[hashDayKey][id].is_wish == 1) {
              $scope.warningsTechsOverQuota.ingenieur = true
              $scope.warningsTechsOverQuotaByDay.ingenieur[recSessions[hashDayKey][id].dayBrut] = 'mix'
            }
          }
        })
      })

      // repasse pour gérer avec les freelances

    }

    const fillForecastSessions = function () {

      // ordre
      // 1. remplir les salles rec
      // 2. remplir les salles hybrides avec du rec
      // 3. remplir les salles mix
      // 4. remplir les salles hybrides avec du mix

      // Si tout est rempli et qu'il reste des séances, mais plus de salles, ajouter un warning
      // *** IMPORTANT*** il est à noter que la période d'occupation peut dépasser les 540 qen cas de maintenance des salles par exemple

        // fin du chargement brut des donnnées
        // remplir les séances dans le futur pour les estimations de remplissage
        // rec en premier, parce que prioritaire
        // mix ensuite, s'il reste de la place en soirée
        // abo audio est à part
        // doit donc passer deux fois rec, puis mix

        // pour savoir si une session a été placée, il faut ajouter un paramètre
        // item.planned = true
        // ensuite on recherche ceux qui n'ont pas été planifiés

        Object.keys(recSessions).forEach((hashDayKey) => {
          // On calcule s'il n'y a pas d'heures de travil et que ce n'est pas dans le futur
          const keys = Object.keys(recSessions[hashDayKey])
          const dayBrut = recSessions[hashDayKey][keys[0]].dayBrut
          const item = recSessions[hashDayKey][keys[0]]
          
          if (item.is_wish != 0) {
          
            let found = false
            // ordre 1 remplir les salles rec
            Object.keys(roomsByDubStep[1]).some((roomId) => {
              if (RoomOccupancy[dayBrut]) {
                if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime == 0) {
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                  
                  // pour chacune des entrées
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].oi = roomId
                    recSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                    recSessions[hashDayKey][fid].roomName = roomsByDubStep[1][roomId].name
                    recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[1][roomId].location
                    recSessions[hashDayKey][fid].audit = roomsByDubStep[1][roomId].name
                    recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                  })
                  found = true

                } else if (!RoomOccupancy[dayBrut][roomId]) {
                  RoomOccupancy[dayBrut][roomId] = {
                    dayTime: 0,
                    eveningTime: 0
                  }
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes

                  // pour chacune des entrées
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].oi = roomId
                    recSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                    recSessions[hashDayKey][fid].roomName = roomsByDubStep[1][roomId].name
                    recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[1][roomId].location
                    recSessions[hashDayKey][fid].audit = roomsByDubStep[1][roomId].name
                    recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                  })
                  found = true
                } else {
                  // si la durée prévue tient encore dedans
                  if (RoomOccupancy[dayBrut][roomId].dayTime < $scope.durationsByTypeOfRooms[1].day
                      && item.diffMinutes <  $scope.durationsByTypeOfRooms[1].day - RoomOccupancy[dayBrut][roomId].dayTime) {
                        RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes

                        // pour chacune des entrées
                        Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                          recSessions[hashDayKey][fid].oi = roomId
                          recSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                          recSessions[hashDayKey][fid].roomName = roomsByDubStep[1][roomId].name
                          recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[1][roomId].location
                          recSessions[hashDayKey][fid].audit = roomsByDubStep[1][roomId].name
                          recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                        })
                        found = true
                  }
                }
              } else {
                RoomOccupancy[dayBrut] = {}
                RoomOccupancy[dayBrut][roomId] = {
                  dayTime: 0,
                  eveningTime: 0
                }
                RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                // pour chacune des entrées
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].oi = roomId
                  recSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                  recSessions[hashDayKey][fid].roomName = roomsByDubStep[1][roomId].name
                  recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[1][roomId].location
                  recSessions[hashDayKey][fid].audit = roomsByDubStep[1][roomId].name
                  recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                })
                found = true

              }
              return found
            })

            // 2. remplir les salles hybrides avec du rec
            // remplit les hybrides, si pas trouvé de place dans les rec
            Object.keys(roomsByDubStep[3]).some((roomId) => {
              if (RoomOccupancy[dayBrut]) {
                if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime == 0) {
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                  // pour chacune des entrées
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].oi = roomId
                    recSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                    recSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                    recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                    recSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                    recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                  })
                  found = true
                } else if (!RoomOccupancy[dayBrut][roomId]) {
                  RoomOccupancy[dayBrut][roomId] = {
                    dayTime: 0,
                    eveningTime: 0
                  }
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                  // pour chacune des entrées
                  Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                    recSessions[hashDayKey][fid].oi = roomId
                    recSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                    recSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                    recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                    recSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                    recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                  })
                  found = true
                } else {
                  // si la durée prévue tient encore dedans
                  if (RoomOccupancy[dayBrut][roomId].dayTime < $scope.durationsByTypeOfRooms[1].day
                    && item.diffMinutes <  $scope.durationsByTypeOfRooms[1].day - RoomOccupancy[dayBrut][roomId].dayTime) {
                      RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes

                      // pour chacune des entrées
                      Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                        recSessions[hashDayKey][fid].oi = roomId
                        recSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                        recSessions[hashDayKey][fid].roomName = roomsByDubStep[1][roomId].name
                        recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[1][roomId].location
                        recSessions[hashDayKey][fid].audit = roomsByDubStep[1][roomId].name
                        recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                      })
                      found = true
                  }
                }
              } else {
                RoomOccupancy[dayBrut][roomId] = {
                  dayTime: 0,
                  eveningTime: 0
                }
                RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                // pour chacune des entrées
                Object.keys(recSessions[hashDayKey]).forEach((fid) => {
                  recSessions[hashDayKey][fid].oi = roomId
                  recSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                  recSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                  recSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                  recSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                  recSessions[hashDayKey][fid].bid = 'pseudo_' + recSessions[hashDayKey][fid].hash + recSessions[hashDayKey][fid].id
                })           
                found = true
              }
              return found
            })

          }


        })
        // check if there is a requested session without room
        let thereIsRecSessionWithoutRoom = false
        // doit vérifier s'il reste des heures non placées, autrement dit recSessions sans booking_id
        // on enregistre par jour et salle
        Object.keys(recSessions).forEach((hashDayKey) => {
          Object.keys(recSessions[hashDayKey]).forEach((id) => {
            if (!recSessions[hashDayKey][id].bid) {
              if (recSessions[hashDayKey][id].is_wish == null) {
                $scope.errorsInSession[recSessions[hashDayKey][id].rid + '-' + recSessions[hashDayKey][id].dayBrut] = {
                  info: 'is_wish est nul, la ligne ne devrait pas exister, vérifier et nettoyer request_id ' + recSessions[hashDayKey][id].rid,
                  details: 'farmerid : ' + recSessions[hashDayKey][id].fid + ' jour: ' +  recSessions[hashDayKey][id].dayBrut
                }
              }
              if (recSessions[hashDayKey][id].is_wish == 1) {
                thereIsRecSessionWithoutRoom = true
                $scope.warningsOverQuota.rec = true
                $scope.warningsOverQuotaByDay.rec[recSessions[hashDayKey][id].dayBrut] = true
              }

            }
          })
        })

          // et les mix
          // *** IMPORTANT*** il est à noter que la période d'occupation peut dépasser les 540 qen cas de maintenance des salles par exemple
          // 3. remplir les salles mix
          let placeInMixOnly = false
          // on prend la période, s'il la différence entre les heures requises sont en dessous d'une certaine durée
          // Sinon ça part au suivant ou en soirée
          // coefHash, durée mixCoefLevels
          // exploitationId + '/'+ keyByExploit + '/'+ element.subproject_nature_id + '/'+ projectTypeId + '/' + dubTypeId + '/' + format_mixId
          // keyByExploit reel pour 1, durée pour le reste
          Object.keys(mixSessions).forEach((hashDayKey) => {
            // On calcule s'il n'y a pas d'heures de travil et que ce n'est pas dans le futur
            
            const keys = Object.keys(mixSessions[hashDayKey])
            const dayBrut = mixSessions[hashDayKey][keys[0]].dayBrut
            const item = mixSessions[hashDayKey][keys[0]]
            if (item.is_wish != 0) {
              let level = 0
              item.dur = !item.dur ? 0 : item.dur
              let keyByExploit = 0
              if (item.exp == 1) {
                // met le nombre de reel,                 mais doit ressortir la liste des produits dans reel ni durée
                keyByExploit = item.reel ? item.reel : 5
              } else {
                if (item.sn == 8 || item.sn == 3 || item.sn == 22) {
                  level = 0
                } else {
                  level = mixCoefLevels.find((level) => item.dur <= level)
                  if (level == 0) {
                    //                                    et noter la chose
                    level = 45
                  }
                }
                keyByExploit = level
              }
              let subprojectNature = 0
              
              if (item.sn == 8 || item.sn == 3 || item.sn == 22) {
                subprojectNature = item.sn
              }
              let projectTypeId = 0
              if (item.exp == 1) {
                if (item.reel != 5 || item.reel != 6) {
                  projectTypeId = item.ptid
                }
              }

              // coefHash[2][exploitationId][keyByExploit][element.subproject_nature_id][projectTypeId][dubTypeId][format_mixId]
              // item.exp => exploitationId
              //    keyByExploit => 
              // item.sn => subproject_nature_id
              // item.ptid  => projectTypeId
              // item.workflowDubTypeBitValue    =>   dubTypeId
              // item.formatMixBitValue =>       format_mixId
              let timeSessionComputed = 0
              if (!coefHash[2][item.exp][keyByExploit]) {
                // trailer cinéma, aucune élément de coef, donc ne peut pas traiter.
                timeSessionComputed = 100
              } else if (!coefHash[2][item.exp][keyByExploit][subprojectNature]) {  
                timeSessionComputed = 100
              } else {
                timeSessionComputed = coefHash[2][item.exp][keyByExploit][subprojectNature][projectTypeId][item.workflowDubTypeBitValue][item.formatMixBitValue]
                if (timeSessionComputed >= 540) {
                  item.diffMinutes = 540
                } else {
                  item.diffMinutes = timeSessionComputed
                  // Dans ce cas, il faut recalculer l'heure ou on met tout en vrac à la même heure :)
                  // on met tout en vrac
                }
              }
            

              let found = false
              Object.keys(roomsByDubStep[2]).some((roomId) => {
                if (RoomOccupancy[dayBrut]) {

                  if (!RoomOccupancy[dayBrut][roomId]) {
                    RoomOccupancy[dayBrut][roomId] = {
                      dayTime: 0,
                      eveningTime: 0
                    }

                    RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes
                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[2][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime <= $scope.durationsByTypeOfRooms[2].day && timeSessionComputed < ($scope.durationsByTypeOfRooms[2].day - RoomOccupancy[dayBrut][roomId].dayTime)) {
                    RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes

                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[2][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })                      
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime == 0) {
                    RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes

                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue =$rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[2][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].eveningTime <= $scope.durationsByTypeOfRooms[2].evening && timeSessionComputed < ($scope.durationsByTypeOfRooms[2].evening - RoomOccupancy[dayBrut][roomId].eveningTime)) {
                    item.time_end_numeric = 2200
                    item.time_end_splitted = [ "22", "00" ]
                    item.time_start_numeric = 1830
                    item.time_start_splitted = [ "18", "30" ]
                    item.tstart = '18:30:00'
                    item.tend = '22:00:00'
                    item.time_start_numeric = parseInt(item.tstart.replace(':',''))
                    item.time_start_splitted = item.tstart.split(':')
                    item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
                    item.real_time_start_splitted = item.rStart.split(':')
              
                    item.time_end_numeric = parseInt(item.tend.replace(':',''))
                    item.time_end_splitted = item.tend.split(':')
                    item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
                    item.real_time_end_splitted = item.rEnd.split(':')

                    RoomOccupancy[dayBrut][roomId].eveningTime += item.diffMinutes
                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].time_end_numeric = 2200
                      mixSessions[hashDayKey][fid].time_end_splitted = [ "22", "00" ]
                      mixSessions[hashDayKey][fid].time_start_numeric = 1830
                      mixSessions[hashDayKey][fid].time_start_splitted = [ "18", "30" ]
                      mixSessions[hashDayKey][fid].tend = '22:00:00'
                      mixSessions[hashDayKey][fid].tstart = '18:30:00'
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[2][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[2][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  }

                } else {
                  RoomOccupancy[dayBrut] = {}
                  RoomOccupancy[dayBrut][roomId] = {
                    dayTime: 0,
                    eveningTime: 0
                  }
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                  Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                    mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                    mixSessions[hashDayKey][fid].oi = roomId
                    mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                    mixSessions[hashDayKey][fid].roomName = roomsByDubStep[2][roomId].name
                    mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[2][roomId].location
                    mixSessions[hashDayKey][fid].audit = roomsByDubStep[2][roomId].name
                    mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                  })   
                  placeInMixOnly = true
                  found = true
                }
                return found
                // fin 1
              })
              // fin 2

              // Faire la même chose avec les hybrides
              // 4. remplir les salles hybrides avec du mix
              found = false
              Object.keys(roomsByDubStep[3]).some((roomId) => {
                if (RoomOccupancy[dayBrut]) {

                  if (!RoomOccupancy[dayBrut][roomId]) {
                
                    RoomOccupancy[dayBrut][roomId] = {
                      dayTime: 0,
                      eveningTime: 0
                    }

                    RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes
                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime <= $scope.durationsByTypeOfRooms[3].day && timeSessionComputed < ($scope.durationsByTypeOfRooms[3].day - RoomOccupancy[dayBrut][roomId].dayTime)) {
                    RoomOccupancy[dayBrut][roomId].dayTime += item.diffMinutes

                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes += item.diffMinutes
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })                      
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].dayTime == 0) {
                    RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes

                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes += item.diffMinutes
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  } else if (RoomOccupancy[dayBrut][roomId] && RoomOccupancy[dayBrut][roomId].eveningTime <= $scope.durationsByTypeOfRooms[3].evening && timeSessionComputed < ($scope.durationsByTypeOfRooms[3].evening - RoomOccupancy[dayBrut][roomId].eveningTime)) {
                    item.time_end_numeric = 2200
                    item.time_end_splitted = [ "22", "00" ]
                    item.time_start_numeric = 1830
                    item.time_start_splitted = [ "18", "30" ]
                    item.tstart = '18:30:00'
                    item.tend = '22:00:00'
                    item.time_start_numeric = parseInt(item.tstart.replace(':',''))
                    item.time_start_splitted = item.tstart.split(':')
                    item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
                    item.real_time_start_splitted = item.rStart.split(':')
              
                    item.time_end_numeric = parseInt(item.tend.replace(':',''))
                    item.time_end_splitted = item.tend.split(':')
                    item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
                    item.real_time_end_splitted = item.rEnd.split(':')

                    RoomOccupancy[dayBrut][roomId].eveningTime += item.diffMinutes
                    Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                      mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                      mixSessions[hashDayKey][fid].time_end_numeric = 2200
                      mixSessions[hashDayKey][fid].time_end_splitted = [ "22", "00" ]
                      mixSessions[hashDayKey][fid].time_start_numeric = 1830
                      mixSessions[hashDayKey][fid].time_start_splitted = [ "18", "30" ]
                      mixSessions[hashDayKey][fid].tend = '22:00:00'
                      mixSessions[hashDayKey][fid].tstart = '18:30:00'
                      mixSessions[hashDayKey][fid].oi = roomId
                      mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                      mixSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                      mixSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                      mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                    })
                    found = true
                    placeInMixOnly = true
                  }

                } else {
                  RoomOccupancy[dayBrut] = {}
                  RoomOccupancy[dayBrut][roomId] = {
                    dayTime: 0,
                    eveningTime: 0
                  }
                  RoomOccupancy[dayBrut][roomId].dayTime = item.diffMinutes
                  Object.keys(mixSessions[hashDayKey]).forEach((fid) => {
                    mixSessions[hashDayKey][fid].diffMinutes = item.diffMinutes
                    mixSessions[hashDayKey][fid].oi = roomId
                    mixSessions[hashDayKey][fid].dubStepRoomValue = $rootScope.allRoomsById[roomId].dubbing_step 
                    mixSessions[hashDayKey][fid].roomName = roomsByDubStep[3][roomId].name
                    mixSessions[hashDayKey][fid].roomLocation = roomsByDubStep[3][roomId].location
                    mixSessions[hashDayKey][fid].audit = roomsByDubStep[3][roomId].name
                    mixSessions[hashDayKey][fid].bid = 'pseudo_' + mixSessions[hashDayKey][fid].hash + mixSessions[hashDayKey][fid].id
                  })   
                  placeInMixOnly = true
                  found = true
                }
                return found
              })

          }

          })

                  // check if there is a requested session without room
        let thereIsMixessionWithoutRoom = false
        // doit vérifier s'il reste des heures non placées, autrement dit recSessions sans booking_id
        Object.keys(mixSessions).forEach((hashDayKey) => {
          Object.keys(mixSessions[hashDayKey]).forEach((id) => {
            if (!mixSessions[hashDayKey][id].bid) {
              if (mixSessions[hashDayKey][id].is_wish == null) {
                $scope.errorsInSession[mixSessions[hashDayKey][id].rid + '-' + mixSessions[hashDayKey][id].dayBrut] = {
                  info: 'is_wish est nul, la ligne ne devrait pas exister, vérifier et nettoyer request_id ' + mixSessions[hashDayKey][id].rid,
                  details: 'farmerid : ' + mixSessions[hashDayKey][id].fid + ' jour: ' +  mixSessions[hashDayKey][id].dayBrut
                }
              }
              if (mixSessions[hashDayKey][id].is_wish == 1) {
                thereIsMixessionWithoutRoom = true
                $scope.warningsOverQuota.mix = true
                $scope.warningsOverQuotaByDay.mix[mixSessions[hashDayKey][id].dayBrut] = true
              }

            }
          })
        })
    }

    const dataDatesTables =
    { 2: 
      [
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 730))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 680))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 679))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 630))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 629))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 580))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 579))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 540))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 539))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 490))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 489))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 430))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 429))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 370))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 369))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 310))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 309))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 260))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 259))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 200))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 199))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 150))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 149))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 100))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 99))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 50))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 49))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 0))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() + (86400000 * 1))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() + (86400000 * 120))).format('YYYY-MM-DD')
        }
      ],
    1: [
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 365))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 310))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 309))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 260))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 259))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 200))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 199))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 150))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 149))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 100))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 99))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 50))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() - (86400000 * 49))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() - (86400000 * 0))).format('YYYY-MM-DD')
        },
        {
          date_start: moment(new Date(new Date().getTime() + (86400000 * 1))).format('YYYY-MM-DD'),
          date_end: moment(new Date(new Date().getTime() + (86400000 * 120))).format('YYYY-MM-DD')
        }
      ]
    }
    $scope.numberOfLoading = 0
    $scope.numberOfLoadingDone = 0

    const addMinutesInTimeSLot = function (entry) {
      let dayTime = 0
      let eveningTime = 0
      if (entry.time_start_numeric >= 900 && entry.time_start_numeric < 1830) {
        // c'est du jour
        // la diff en minutes, c'est le temps jour jusqu'à la limite indiquée
        // si la fin est après 1830
        if (entry.time_end_numeric > 1830) {
          // heures chevauchent
          // heures de journée
          const minutes = hours2minutes($scope.workingHours.dayTime, entry.real_time_start_splitted)
          dayTime += minutes
          // et le reste est du soir
          const minutesForEvening = hours2minutesEvening($scope.workingHours.eveningTime, entry.real_time_end_splitted) //  entry.diffMinutes - minutes
          eveningTime += minutesForEvening
          // et si les heures sont avant 900, on prend tout  ??
        } else {
          dayTime += entry.diffMinutes
        }
      }
      if (entry.time_start_numeric >= 1830 || (entry.time_start_numeric % 2400) < 600) {
        // le soir 
        // c'est de soir ou de nuit, jsuqu'à 6h du matin
        eveningTime += entry.diffMinutes
      }
      return { dayTime: dayTime, eveningTime: eveningTime }
    }    

    // 
    const alreadyComputedTimeForASession = {}
    const monthsList = {} // start and end
    const RoomOccupancy = {}
    const TechOccupancy = {
    }
    const recSessions = {}
    const mixSessions = {}
    const laboSessions = {}
    const getDates = function (index) {
      const dataDates = dataDatesTables[$scope.duration]
      $scope.numberOfLoading = Object.keys(dataDates).length
      const data = dataDates[index]
      if (data) {
        PaoService.getDeferredFarmersListForDashboard(data).then(
          function (response) {
            // response = results[0]
            // le reste est la liaison avec booking
            $scope.numberOfLoadingDone++
            response.forEach((item) => {
              item.dayBrut = moment(item.day).format('YYYY-MM-DD')

              const month = moment(item.day).format('YYYYMM')
              if (!monthsList[month]) {
                monthsList[month] = {
                  start: moment(item.day).startOf('month').format("YYYY-MM-DD"),
                  end: moment(item.day).endOf('month').format("YYYY-MM-DD"),
                  name: moment(item.day).format('MM/YYYY')
                }
              }

              projectsById[item.pid] = true
              item.requestActiveDt = moment(item.day).format('x')
              if (item.audit) {
                item.audit = item.audit.replace(/ *\(.+\)$/,'').replace(/ *\*$/,'')
              }
              item.actName = $rootScope.actions[item.act].name
              item.dubStepId = $scope.dubbingStepsByName[$rootScope.etapes[item.step].name]
              // type d'occupation de la salle, si la salle est définie
              if ($scope.audits[item.audit]) {
                item.dubStepRoomValue = $rootScope.allRoomsById[$scope.audits[item.audit].id].dubbing_step
                item.oi = $scope.audits[item.audit].id
                item.roomName = $scope.audits[item.audit].name
                item.roomLocation = $scope.audits[item.audit].location
              }

              item.occupation = $rootScope.etapes[item.step].name
              // workflowDubTypeBitValue item de l'action de doublage, si v
              item.workflowDubTypeBitValue = ValueListService.getDubBitValueById(item.dub) 
              item.formatMixBitValue = ValueListService.getformatMixBitValue(item.mix)
              if (!$scope.projectsByClients[item.cid]) {
                $scope.projectsByClients[item.cid] = {}
              }
              $scope.projectsByClients[item.cid][item.pid] = true
              if (!$scope.subprojectsByProjects[item.pid]) {
                $scope.subprojectsByProjects[item.pid] = {}
              }
              $scope.subprojectsByProjects[item.pid][item.id] = true

              
              // calcul dates et durées, comme ce sera fait
              item.diff = 0
              // duree par défaut sur une demande sans heures précisées, mais qui néanmoins seront utilisées, 7h30 de 
              item.diffMinutes = (9 * 60)
              //if (item.tstart && item.tend && item.is_wish != 0) {
              if (item.bid) {
                item.tstart = item.tstart.replace('h',':') + ':00'
                item.tend = item.tend.replace('h',':') + ':00'
                
                // r pour real
                item.rStart = item.tstart
                item.rEnd = item.tend
                if (item.wstart && item.wend) {
                  const s1 = item.wstart.split(' ')
                  item.rStart = s1[1]
                  const s2 = item.wend.split(' ')
                  item.rEnd = s2[1]
                }
                item.time_start_numeric = parseInt(item.tstart.replace(':',''))
                item.time_start_splitted = item.tstart.split(':')
                item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
                item.real_time_start_splitted = item.rStart.split(':')
          
                item.time_end_numeric = parseInt(item.tend.replace(':',''))
                item.time_end_splitted = item.tend.split(':')
                item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
                item.real_time_end_splitted = item.rEnd.split(':')


                let start = item.tstart
                let end = item.tend
                if (item.wstart && item.wend) {
                  let startTime = item.wstart.split(' ')
                  start = startTime[1]
                  let endTime = item.wend.split(' ')
                  end = endTime[1]
                }
                let wstart = moment(moment(item.day).format('YYYY-MM-DD') + ' ' + start)
                let wend = moment(moment(item.day).format('YYYY-MM-DD') + ' ' + end)
                if (HelperService.isNextDay(start, end)) {
                  const startDay = moment(item.day).format('YYYY-MM-DD')
                  const endDay = moment(item.day).add(1, "days").format('YYYY-MM-DD')
                  wstart = moment(moment(startDay).format('YYYY-MM-DD') + ' ' + start)
                  wend = moment(moment(endDay).format('YYYY-MM-DD') + ' ' + end)
                }
                item.dateStartFull = wstart
                item.dateEndFull = wend

                item.time_start_numeric = moment(item.dateStartFull).format('HHmm')
                item.time_end_numeric = moment(item.dateEndFull).format('HHmm')

                // utilisé pour différencier les produits ayant des heures de travail différentes dans les réservations
                // de base une réservation a des heures de travail identiques, comptées uen fois
                // après réalisation,  chaque produit aura une heure différente, comptée séparément
                item.datetime_start_numeric = moment(item.dateStartFull).format('YYYY-MM-DD-HHmm')
                item.datetime_end_numeric = moment(item.dateEndFull).format('YYYY-MM-DD-HHmm')

                item.diff = wend.diff(wstart, 'hours')
                item.diffMinutes = wend.diff(wstart, 'minutes')

                if (item.oi && (item.dubStepRoomValue & roomsComputedOnlyRecAndMix)) {
                  if (!RoomOccupancy[item.dayBrut]) {
                    RoomOccupancy[item.dayBrut] = {}
                  }
                  if (!RoomOccupancy[item.dayBrut][item.oi]) {
                    RoomOccupancy[item.dayBrut][item.oi] = {
                      dayTime: 0,
                      eveningTime: 0
                    }
                  }
                  if (!TechOccupancy[item.dayBrut]) {
                    TechOccupancy[item.dayBrut] = {}
                  }
                  if (!TechOccupancy[item.dayBrut][item.wid]) {
                    TechOccupancy[item.dayBrut][item.wid] = item.diffMinutes
                  } else {
                    TechOccupancy[item.dayBrut][item.wid] += item.diffMinutes
                  }
                  TechOccupancy[item.dayBrut][item.wid] += item.diffMinutes
                  if (item.trid) {
                    if (!TechOccupancy[item.dayBrut][item.trid]) {
                      TechOccupancy[item.dayBrut][item.trid] = item.diffMinutes
                    } else {
                      TechOccupancy[item.dayBrut][item.trid] += item.diffMinutes
                    }
    
                  }
                  const occupancyTime = addMinutesInTimeSLot(item)
                  // errare humanum est, s'il n'y pas d'heure de travail et n requests, on compte une seule fois

                  if (item.wstart && item.wend) {
                    RoomOccupancy[item.dayBrut][item.oi].dayTime += occupancyTime.dayTime
                    RoomOccupancy[item.dayBrut][item.oi].eveningTime += occupancyTime.eveningTime
                  } else {
                    if (!alreadyComputedTimeForASession[item.bid]) {
                      alreadyComputedTimeForASession[item.bid] = true
                      RoomOccupancy[item.dayBrut][item.oi].dayTime += occupancyTime.dayTime
                      RoomOccupancy[item.dayBrut][item.oi].eveningTime += occupancyTime.eveningTime
                    }
                  }

                }
              } else {
                // il existe des séances annulées travaillées et réservées
                // aucune session associée

                // item.tstart = item.tstart.replace('h',':') + ':00'
                // item.tend = item.tend.replace('h',':') + ':00'
                item.tstart = "09:30:00"
                item.tend = "18:30:00"
                
                item.rStart = item.tstart
                item.rEnd = item.tend

                item.time_start_numeric = parseInt(item.tstart.replace(':',''))
                item.time_start_splitted = item.tstart.split(':')
                item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
                item.real_time_start_splitted = item.rStart.split(':')
          
                item.time_end_numeric = parseInt(item.tend.replace(':',''))
                item.time_end_splitted = item.tend.split(':')
                item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
                item.real_time_end_splitted = item.rEnd.split(':')


                item.time_start_numeric = 930
                item.time_end_numeric = 1830


                // recSessions
                // par défaut si rien mis
                if (moment(item.day).format('x') > moment().format('x')) {
                  const indexFill = item.hash + '-' + item.dayBrut
                  if (item.occupation == 'enregistrement') {
                    if (!recSessions[indexFill]) {
                      recSessions[indexFill] = {}
                    }
                    recSessions[indexFill][item.fid] = item
                  }
                  if (item.occupation == 'mixage') {
                    if (!mixSessions[indexFill]) {
                      mixSessions[indexFill] = {}
                    }
                    mixSessions[indexFill][item.fid] = item
                  }
                }
              }
              if (item.is_wish != 0) {
                everything.push(item)
              }
            })
            getDates(index + 1)
          }
        )
      } else {
        $scope.formatsmix = ValueListService.getFormatMix()
        $scope.clientsList = Object.values($rootScope.clientsLight)
        $scope.exploitationTypesList = ValueListService.getExploitationTypes()
        $scope.monthsList = Object.values(monthsList)
        // gére les données
        $scope.loaded = true
        $scope.loading = false

        // et puis chargement des projets et sous-projets
        // everything
        ProjectsService.getProjectsById(Object.keys(projectsById), 
        function (projects) {
          projects.forEach((project) => {
            projectsById[project.id] = project
          })
          $scope.projects = projects
          $scope.projectsBase = projects
        },
        function () {}
        )
        $rootScope.subproject_natures.forEach((nature) => {
          $scope.natureById[nature.id] = {
            name: nature[$rootScope.getLang()],
            id: nature.id
          }
        })

        fillForecastSessions()
        fillForecastTechsWorkTime()
        $scope.filterDate(30)
      }
    }

    // pour calculer les taux d'occupation des salles, il faut les moments d'indisponibilité qui sont dans les notes de la table booking
    // texte
    // Alula réservé client 66
    // Mix réservé mixage
    // note réservé client_id ou step 2
    const getNotes = function (done) {
      const data = {
        date_start: moment(new Date(new Date().getTime() - (86400000 * 365 * $scope.duration))).format('YYYY-MM-DD'),
        date_end: moment(new Date(new Date().getTime() + (86400000 * 120))).format('YYYY-MM-DD')
      }
      PaoService.getNotesListForDashboard(data, function (response) {
        response.forEach((item) => {
          // prend les occupations pour les salles de rec et mix uniquement
          // note le dubStep
          if (!item.oi) {
            console.log(item)
          }
          let dateStartUnix =  moment(item.start).format('x')
          item.text = JSON.parse(item.text)
          item.dayBrut = moment(item.start).format('YYYY-MM-DD')
          // le step est lié à la salle 1 2 ou 3
          // doit aller dans autres, donc pas de stepId défini

          
          item.dubStepId = 0
          /*
          if ($rootScope.allRoomsById[item.oi].dubbing_step == 3) {
            
            item.dubStepId = 0
          } else {
            item.dubStepId = $rootScope.allRoomsById[item.oi].dubbing_step
          }
          */
          
          item.dubStepRoomValue = $rootScope.allRoomsById[item.oi].dubbing_step
          let startSplitted = item.start.split(' ')
          let endSplitted = item.end.split(' ')
          item.tstart =  startSplitted[1]
          item.tend = endSplitted[1]

          item.rStart = startSplitted[1]
          item.rEnd = endSplitted[1]

          item.time_start_numeric = moment(item.start).format('HHmm')
          item.time_start_splitted = [moment(item.start).format('HH'), moment(item.start).format('mm')]
          item.time_end_numeric = moment(item.end).format('HHmm')
          item.time_end_splitted = [moment(item.end).format('HH'), moment(item.end).format('mm')]
          item.unixtStart = moment(item.start).format('x')
          item.unixtEnd = moment(item.end).format('x')

          item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
          item.real_time_start_splitted = item.rStart.split(':')
          item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
          item.real_time_end_splitted = item.rEnd.split(':')

          item.datetime_start_numeric = moment(item.start).format('YYYY-MM-DD-HHmm')
          item.datetime_end_numeric = moment(item.end).format('YYYY-MM-DD-HHmm')

          item.audit = $rootScope.allRoomsById[item.oi].name
          item.roomName = $rootScope.allRoomsById[item.oi].name
          item.roomLocation = $rootScope.allRoomsById[item.oi].location
          let start = moment(item.start)
          let end = moment(item.end)
          item.diff = end.diff(start, 'hours')
          item.diffMinutes = end.diff(start, 'minutes')
          //  11 : 1 rec, 2 mix 8 labo audio
          if (item.oi && (item.dubStepRoomValue & 3)) {
            if (!RoomOccupancy[item.dayBrut]) {
              RoomOccupancy[item.dayBrut] = {}

            }
            if (!RoomOccupancy[item.dayBrut][item.oi]) {
              RoomOccupancy[item.dayBrut][item.oi] = {
                dayTime: 0,
                eveningTime: 0
              }
              if (item.text.text.match(/ALULA/i)) {
                RoomOccupancy[item.dayBrut][item.oi].reserved = {cid: 66}
              }
              if (item.text.text.match(/MIX/i)) {
                RoomOccupancy[item.dayBrut][item.oi].reserved = {dubStepId: 2}
              }
            }
            const occupancyTime = addMinutesInTimeSLot(item)
            RoomOccupancy[item.dayBrut][item.oi].dayTime += occupancyTime.dayTime
            RoomOccupancy[item.dayBrut][item.oi].eveningTime += occupancyTime.eveningTime
          }
          everyNotes.push(item)
        })

        PaoService.getUnavailableRoomsListForDashboard(data, function (response) {
          response.forEach((item) => {
            // prend les occupations pour les salles de rec et mix uniquement
            // note le dubStep
            item.dayBrut = moment(item.start).format('YYYY-MM-DD')
            item.dubStepId = 0
            item.dubStepRoomValue = $rootScope.allRoomsById[item.oi].dubbing_step
            let startSplitted = item.start.split(' ')
            let endSplitted = item.end.split(' ')
            item.tstart = startSplitted[1]
            item.tend = endSplitted[1]

            item.rStart = startSplitted[1]
            item.rEnd = endSplitted[1]

            item.real_time_start_numeric = parseInt(item.rStart.replace(':',''))
            item.real_time_start_splitted = item.rStart.split(':')
            item.real_time_end_numeric = parseInt(item.rEnd.replace(':',''))
            item.real_time_end_splitted = item.rEnd.split(':')

            item.datetime_start_numeric = moment(item.start).format('YYYY-MM-DD-HHmm')
            item.datetime_end_numeric = moment(item.end).format('YYYY-MM-DD-HHmm')

            item.time_start_numeric = moment(item.start).format('HHmm')
            item.time_start_splitted = [moment(item.start).format('HH'), moment(item.start).format('mm')]
            item.time_end_numeric = moment(item.end).format('HHmm')
            item.time_end_splitted = [moment(item.end).format('HH'), moment(item.end).format('mm')]
            item.unixtStart = moment(item.start).format('x')
            item.unixtEnd = moment(item.end).format('x')
            item.audit = $rootScope.allRoomsById[item.oi].name
            item.roomName = $rootScope.allRoomsById[item.oi].name
            item.roomLocation = $rootScope.allRoomsById[item.oi].location
            let start = moment(item.start)
            let end = moment(item.end)
            item.diff = end.diff(start, 'hours')
            item.diffMinutes = end.diff(start, 'minutes')
            if (item.oi) {
              if (item.oi) {
                if (!RoomOccupancy[item.dayBrut]) {
                  RoomOccupancy[item.dayBrut] = {}
  
                }
                if (!RoomOccupancy[item.dayBrut][item.oi]) {
                  RoomOccupancy[item.dayBrut][item.oi] = {
                    dayTime: 0,
                    eveningTime: 0
                  }
                }
                const occupancyTime = addMinutesInTimeSLot(item)
                RoomOccupancy[item.dayBrut][item.oi].dayTime += occupancyTime.dayTime
                RoomOccupancy[item.dayBrut][item.oi].eveningTime += occupancyTime.eveningTime
              }
            }
            everyRoomIndispo.push(item)
          })
          return done()
        })
        
      },
      function () {})
    }    

    const getTechIndispo = function () {
      const data = {
        date_start: moment(new Date(new Date().getTime() - (86400000 * 365 * $scope.duration))).format('YYYY-MM-DD'),
        date_end: moment(new Date(new Date().getTime() + (86400000 * 120))).format('YYYY-MM-DD')
      }
      PaoService.getIndispoListForDashboard(data, function (response) {
        response.forEach((item) => {
          /*
          item.dubStepRoomValue = $rootScope.allRoomsById[item.oi].dubbing_step
          item.time_start_numeric = moment(item.start).format('HHmm')
          item.time_end_numeric = moment(item.end).format('HHmm')
          */
          item.dayBrut = moment(item.start).format('YYYY-MM-DD')
          item.dubStepId = 0
          item.unixtStart = moment(item.start).format('x')
          item.unixtEnd = moment(item.end).format('x')
          let start = moment(item.start)
          let end = moment(item.end)
          item.diff = end.diff(start, 'hours')
          item.diffMinutes = end.diff(start, 'minutes')
          if (!TechOccupancy[item.dayBrut]) {
            TechOccupancy[item.dayBrut] = {}
          }
          if (!TechOccupancy[item.dayBrut][item.uid]) {
            TechOccupancy[item.dayBrut][item.uid] = item.diffMinutes
          } else {
            TechOccupancy[item.dayBrut][item.uid] += item.diffMinutes
          }
          everyTechIndispo.push(item)
        })
      }, function () {})
    }

  }
]);