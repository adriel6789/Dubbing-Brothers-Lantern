'use strict';

/* Services valeurs */
Lantern.factory('ValueListService', ['$rootScope','ApiRest', 'Session', '$q', 'HelperService', '$localstorage','localUpdates',
  function($rootScope, ApiRest, Session, $q, HelperService, $localstorage, localUpdates) {
    const service = {}

    service.getEtapeActionByWorkflow = function(params, successCallback, errorCallback) {
      ApiRest.get('/valuelists/ActionsByEtape', params, function(etapes_actions) {
        return successCallback(etapes_actions)
      }, function(error) {
        return errorCallback(error)
      })
    }

    service.getDubbingSteps = function(successCallback, errorCallback) {
      ApiRest.get('/valuelists/dubbing_steps', {} , function(steps) {
        return successCallback(steps)
      }, function(error) {
        return errorCallback(error)
      })
    }

    service.getProjectTypes = function(successCallback, errorCallback) {
      ApiRest.get('/valuelists/project_types/' + $rootScope.getBranchName() + '/', {} , function(steps) {
        return successCallback(steps)
      }, function(error) {
        return errorCallback(error)
      })
    }    

    service.getPresetTimes = function(successCallback, errorCallback) {
      if ($rootScope.presetTimes) {
        return successCallback()
      } else {
        ApiRest.get('/booking/preset/times/', {} , function(presetTimes) {
          $rootScope.presetTimes = presetTimes
          return successCallback()
        }, function(error) {
          return errorCallback(presetTimes)
        })
      }
    }      

    let languages = null
    let lastLanguagesUpdate = null
    $rootScope.languages = null
    $rootScope.languagesById = {}
    service.manageReceivedLanguages = function (done) {
      return function (response) {
        if (!languages) {
          lastLanguagesUpdate = new Date().getTime()
          $rootScope.languages = response
          languages = response
          response.forEach((item) => {
            $rootScope.languagesById[item.id] = item
           })
        }
        return done()
      }
    }

    const buildPlanningTypes = function (result) {
      $rootScope.planningsByMainLocationAndService = {}
      $rootScope.plannings = []
      result.forEach(function (type) {
        let data;
        if (type.main_location) {
          if (!$rootScope.planningsByMainLocationAndService[type.main_location]) {
            $rootScope.planningsByMainLocationAndService[type.main_location] = {}
          }
          $rootScope.planningsByMainLocationAndService[type.main_location][type.service] = type

          if ($rootScope.user_main_location == type.main_location) {
            data = {
              id: type.service,
              name: type.name,
              color: type.color,
              main_location: type.main_location,
              service: type.service,
              branch_id: type.branch_id
            }
            $rootScope.planningsByService[type.service] = data
            $rootScope.plannings.push(data)
          }
        } else {
          data = {
            id: type.service,
            name: type.name,
            color: type.color,
            main_location: type.main_location,
            service: type.service,
            branch_id: type.branch_id
          }
          $rootScope.planningsByService[type.service] = data
          $rootScope.plannings.push(data)
        }
      })
    }
    $rootScope.user_main_location = 0
    let planningTypes = null
    $rootScope.planningsByService = {}
    let lastPlanningUpdates = null
    service.getPlanningTypes = function () {
      const branchId = Session.branchId()
      $rootScope.user_main_location = $rootScope.user_entity.permissions[0].main_location
      const result = $localstorage.getObject('lantern_Planningtypes_' + branchId)
      if (result && !planningTypes) {
        buildPlanningTypes(result)
        return
      }
      if (result && lastPlanningUpdates && (lastPlanningUpdates + 3000000) < new Date().getTime()) {
        buildPlanningTypes(result)
        return
      }
      if (planningTypes) {
        $rootScope.plannings = planningTypes
      }
      ApiRest.get('/bookingPlanningtypes/', {}, function(result) {
        if (!result.error) {
          $rootScope.plannings = []
          const branchId = Session.branchId()
          $localstorage.setObject('lantern_Planningtypes_' + branchId, result)
          lastPlanningUpdates = new Date().getTime()
          buildPlanningTypes(result)
          planningTypes = $rootScope.plannings
        }
      })
    }

    service.getLanguages = function(successCallback, errorCallback) {
      if (!lastLanguagesUpdate || lastLanguagesUpdate + 1800000 < new Date().getTime()) {  // 30 minutes avant rechargement
        languages = null
        ApiRest.get('/valuelists/languages/' , {} , function(response) {
          return successCallback(response)
        }, function(error) {
          return errorCallback(error)
        })        
      } else {
        return successCallback(languages)
      }
    } 

    // $scope.normesmix = Valuelist.query({tableName: 'norme_mix'});
    let normesMix = null
    let lastNormesMixUpdate = null
    $rootScope.normesMix = null
    $rootScope.normesMixById = {}
    service.manageReceivedNormesMix = function (done) {
      return function (response) {
        if (!normesMix) {
          lastNormesMixUpdate = new Date().getTime()
          $rootScope.normesMix = response
          normesMix = response
          response.forEach((item) => {
            $rootScope.normesMixById[item.id] = item
           })
        }
        return done()
      }
    }

    service.getNormesMix = function(successCallback, errorCallback) {
      if (!lastNormesMixUpdate || lastNormesMixUpdate + 3600000 < new Date().getTime()) {  // 30 minutes avant rechargement
        normesMix = null
        ApiRest.get('/valuelists/norme_mix/' , {} , function(response) {
          return successCallback(response)
        }, function(error) {
          return errorCallback(error)
        })        
      } else {
        return successCallback(normesMix)
      }
    } 
    
    // $scope.resolutions = Valuelist.query({tableName: 'resolution_types'});
    let resolutions = null
    let lastResolutionsUpdate = null
    $rootScope.resolutions = null
    $rootScope.resolutionsById = {}
    service.manageReceivedResolutions = function (done) {
      return function (response) {
        if (!resolutions) {
          lastResolutionsUpdate = new Date().getTime()
          $rootScope.resolutions = response
          resolutions = response
          response.forEach((item) => {
            $rootScope.resolutionsById[item.id] = item
           })
        }
        return done()
      }
    }

    service.getResolutions = function(successCallback, errorCallback) {
      if (!lastResolutionsUpdate || lastResolutionsUpdate + 3600000 < new Date().getTime()) {  // 30 minutes avant rechargement
        resolutions = null
        ApiRest.get('/valuelists/resolution_types/' , {} , function(response) {
          return successCallback(response)
        }, function(error) {
          return errorCallback(error)
        })        
      } else {
        return successCallback(resolutions)
      }
    } 


    // transforme les preset times de la base en tableau utilisable (voir table values_times_preset)
    let presetArray = null
    service.orderPresetTimes = function (slots) {
      if (presetArray) {
        return presetArray
      }
      const presetOrdered = {}
      slots.forEach((element) => {
        if (!presetOrdered[element.position]) {
          presetOrdered[element.position] = {
            position: element.position,
            start: null,
            end: null,
            name: element[$rootScope.branchName],
            preset: element.preset
          }
        }
        presetOrdered[element.position][element.action] = (element.hour < 10 ? '0' + element.hour : element.hour) + ':' + (element.minute < 10 ? '0' + element.minute : element.minute)
        presetOrdered[element.position][element.action + 'DayTime'] = HelperService.fromHourToMinutes(presetOrdered[element.position][element.action])
      })
      presetArray = Object.values(presetOrdered)
      return presetArray
    }

    

      /**
       * Get etapes_actions and allows the use of deferred promise
       * @param id : workflow Id
       * @returns {*} : deferred promise
       */
      service.getEtapeActionByWorkflowDefer = function(id) {
          let params = {};
          params.workflow_type_id = id;
          let deferred = $q.defer();
          service.getEtapeActionByWorkflow(params, function(etapes_actions) {
              deferred.resolve(etapes_actions);
          }, function(error){
              deferred.reject(error);
          });
          return deferred.promise;
      };

      const formatMixCorrespondance = {
        1: 1, // stereo ou 2.0 ou 20
        2: 2, // 51 
        3: 4, // 71
        4: 8, //atmos
        5: 0,
        6: 16  // mono
      }
      service.getformatMixBitValue = function (formatMixId) {
        return formatMixCorrespondance[formatMixId]
      }

      // by branch id
      const elementsAudio = [
        { support: "OV + M&E", nature: "Audio" }, 
        { support: "OV", nature: "Audio" }, 
        { support: "M&E", nature: "Audio"}, 
        { support: "Dubbed Version", nature: "Audio"}
      ]

      const ElementVideoByLanguage = {
          1: [
            { support: "Erytmo", nature: "Video" }, 
            { support: "Screener", nature: "Video"}, 
            { support: "E-dub", nature: "Video"}, 
            { support: "Image doublage", nature: "Video" }
          ],
          2: [
            { support: "Erytmo", nature: "Video" }, 
            { support: "Screener", nature: "Video"}, 
            { support: "E-dub", nature: "Video"}, 
            { support: "Dubbing image", nature: "Video"}
          ],
          3: [
            { support: "Erytmo", nature: "Video" }, 
            { support: "Screener", nature: "Video"}, 
            { support: "E-dub", nature: "Video"}, 
            { support: "Dubbing image", nature: "Video"}
          ],
          4: [
            { support: "Erytmo", nature: "Video" }, 
            { support: "Screener", nature: "Video"}, 
            { support: "E-dub", nature: "Video"}, 
            { support: "Dubbing image", nature: "Video"}
          ]                        
        }   
    /**
     * Supports requis par digimedia pour la création d'éléments
     * prefiltre par rapport à la totalité des supports
     * liste complète dans app/js/js-functions.js getSupports
     */
    service.getDigiMediaVideoSupports = function () {
      return ElementVideoByLanguage[Session.branchId()]
    }

    service.getDigiMediaAudioSupports = function () {
      return elementsAudio
    }    

    // Liste complete des supports
    const suports = [
       { support: "Pyramix / Prod", nature: "Audio" }, 
       { support: "Protools / Prod", nature: "Audio" }, 
       { support: "Protools / Safety", nature: "Audio" }, 
       { support: "Audio / DCP", nature: "Audio" }, 
       { support: "Image doublage", nature: "Video" },
       { support: "FCP / Prod", nature: "Video" }, 
       { support: "FCP / Media Original Master", nature: "Video" }, 
       { support: "FCP / Media Master", nature: "Video" }, 
       { support: "Master BDIG", nature: "Video" }, 
       { support: "Master HDCAM", nature: "Video" }, 
       { support: "Master HDCAM SR", nature: "Video" }, 
       { support: "PAD Fichier", nature: "Video" }, 
       { support: "PAD Bande", nature: "Video" }, 
       { support: "MP3 / other", nature: "Audio" }, 
       { support: "BWF / other", nature: "Audio" }, 
       { support: "Erytmo", nature: "Video" }, 
       { support: "Screener", nature: "Video" }, 
       { support: "E-dub", nature: "Video" }, 
       { support: "OV + M&E", nature: "Audio" }, 
       { support: "OV", nature: "Audio" }, 
       { support: "M&E", nature: "Audio" }, 
       { support: "Dubbed Version", nature: "Audio"}
      ]
      // ValueListService.getDigiMediaSupports()
    service.getDigiMediaSupports = function () {
        return suports
      } 

    const speeds = [
      { id: "0", name: "23.98" },
      { id: "1", name: "24" },
      { id: "2", name: "25" },
      { id: "3", name: "30" },
      { id: "4", name: "29.97 DNF" },
      { id: "5", name: "29.97 DF" }
    ]
    $rootScope.speedsById = {}
    // ValueListService.getSpeeds()
    service.getSpeeds = function () {
      speeds.forEach((item) => {
        item.value = item.name
        $rootScope.speedsById[item.id] = item
      })
      return speeds
    }
    
    const varispeeds = [
      { value: 1, text: '23.98 -> 24 (+0.1%)' },
      { value: 2, text: '24 -> 25 (+4.17%)' }, 
      { value: 3, text: '23.98 -> 25 (+4.27%)' },
      { value: 4, text: '24 -> 23.98 (-0.1%)' }, 
      { value: 5, text: '25 -> 24 (-4%)' }, 
      { value: 6, text: '25 -> 23.98 (-4.1%)' }
    ]

    // ValueListService.getVarispeeds()
    service.getVarispeeds = function () {
      return varispeeds
    }

    const layouts = [
      { id: "0", name: "Mono" }, 
      { id: "1", name: "2.0" }, 
      { id: "2", name: "5.1" }, 
      { id: "3", name: "7.1" }, 
      { id: "4", name: "ATMOS" }
    ]
    // ValueListService.getLayouts()
    service.getLayouts = function () {
      return layouts
    }

    const languages_labo = {
      1: [
        { "value": "VF" }, 
        { "value": "VO" }, 
        { "value": "VF & VO" }, 
        { "value": "VF & AD" }
      ],
      2: [
        { "value": "VF" }, 
        { "value": "VO" }, 
        { "value": "VF & VO" }, 
        { "value": "VF & AD" }
      ],
      3: [
        { "value": "ENG" }, 
        { "value": "OV" }, 
        { "value": "ENG & OV" }, 
        { "value": "ENG & AD" }
      ],              
      4: [
        { "value": "VI" }, 
        { "value": "VO" }, 
        { "value": "VI & VO" }, 
        { "value": "VI & AD" }
      ]      
    }

    // ValueListService.getLanguageLabo()
    service.getLanguageLabo = function () {
      return languages_labo[Session.branchId()]
    }

    const nature_subtitle =  {
      1: [
        { "value": "VF" }, 
        { "value": "SME" }, 
        { "value": 'VF & SME' }
      ],
      2: [
        { "value": "VF" }, 
        { "value": "SME" }, 
        { "value": 'VF & SME' }
      ],
      3: [
        { "value": "ENG" }, 
        { "value": "SME" }, 
        { "value": 'ENG & SME' }
      ],
      4: [
        { "value": "VI" }, 
        { "value": "SME" }, 
        { "value": 'VI & SME' }
      ]                  
    }
    // ValueListService.getNatureSubtitle()
    service.getNatureSubtitle = function () {
      return nature_subtitle[Session.branchId()]
    }    

    const audio_processes =  [
      { "value": "KTools" }, 
      { "value": "Junger" }
    ]

    // ValueListService.getAudioProcesses()
    service.getAudioProcesses = function () {
      return audio_processes
    }    
    const dynamic_processes = {
      1: [
        { "value": 'Aucun' }, 
        { "value": 'Tous les flux' },     
        { "value": 'Flux VO'},
        { "value": 'Flux VF'}
      ],
      3: [
        { "value": 'None' }, 
        { "value": 'All flows' },     
        { "value": 'OV flow'},
        { "value": 'ENG flow'}
      ],
      2: [
        { "value": 'Keine' }, 
        { "value": 'Alle Bewegungen' },     
        { "value": 'VO-fluss'},
        { "value": 'DE-fluss'}
      ],
      4: [
        { "value": 'Nessuno' }, 
        { "value": 'Tutti i flussi' },     
        { "value": 'Flusso VO'},
        { "value": 'Flusso VI'}
      ]            
    }

    // ValueListService.getDynamicProcesses()
    service.getDynamicProcesses = function () {
        return dynamic_processes[Session.branchId()]
    }

    const types_subtitle = {
      1: [        
        { "value": 'Aucun' }, 
        { "value": 'Non-Incrusté' },     
        { "value": 'Incrusté' }
      ],
      2: [        
        { "value": 'Keine' }, 
        { "value": 'Nicht Eingelegt' },     
        { "value": 'Eingelegt' }
      ],
      3: [        
        { "value": 'None' }, 
        { "value": 'Non-Inlayed' },     
        { "value": 'Inlayed' }
      ],
      4: [        
        { "value": 'Nessuno' }, 
        { "value": 'Non-Intarsiato' },     
        { "value": 'Intarsiato' }
      ]
    }

    // ValueListService.getTypesSubtitle()
    service.getTypesSubtitle = function () {
      return types_subtitle[Session.branchId()]
    }

    const workflow_type1 = {
      1: { name: 'Doublage'},
      2: { name: 'Dubbing'},
      3: { name: 'Dubbing'},
      4: { name: 'Doppiaggio'}
    }
    service.getWorkflowType1Name = function () {
      return workflow_type1[Session.branchId()].name
    }

    // pb de traduction et tout changer est particulièrement difficile
    // Dans le mesure où ce truc ne changera jamais, on le met en dur
    const workflow_types = {
      1: [
        { 
          id: "1",
          name: 'doublage',
          value: 'Doublage'
        },
        { 
          id: "2",
          name: 'mastering',
          value: 'Mastering'
        },
        {
          id: "3",
          name: 'servicing',
          value: 'Servicing'
        }
      ],
      2: [
        { 
          id: "1",
          name: 'doublage',
          value: 'Dubbing'
        },
        { 
          id: "2",
          name: 'mastering',
          value: 'Mastering'
        },
        {
          id: "3",
          name: 'servicing',
          value: 'Servicing'
        }
      ],
      3: [
        { 
          id: "1",
          name: 'doublage',
          value: 'Dubbing'
        },
        { 
          id: "2",
          name: 'mastering',
          value: 'Mastering'
        },
        {
          id: "3",
          name: 'servicing',
          value: 'Servicing'
        }
      ],
      4: [
        { 
          id: "1",
          name: 'doublage',
          value: 'Doppiaggio'
        },
        { 
          id: "2",
          name: 'mastering',
          value: 'Mastering'
        },
        {
          id: "3",
          name: 'servicing',
          value: 'Servicing'
        }
      ]
    }
    // ValueListService.getWorkflowTypes()
    service.getWorkflowTypes = function () {
      return workflow_types[Session.branchId()]
    }
    // ValueListService.getWorkflowTypesById()
    // id in workflow doublage_type_id
    service.getWorkflowTypesById = function () {
      const byId = {}
      workflow_types[Session.branchId()].forEach((entry) => {
        byId[entry.id] = entry
      })
      return byId
    }

    // pb de traduction et tout changer est particulièrement difficile
    // Dans le mesure où ce truc ne changera jamais, on le met en dur
    const doublage_types = {
      1: [
        { 
          id: "1",
          name: 'synchro',
          value: 'Synchro'
        },
        { 
          id: "2",
          name: 'audio-description',
          value: 'Audio Description'
        },
        { 
          id: "3",
          name: 'voice-over',
          value: 'Voice Over'
        },    
        { 
          id: "4",
          name: 'Prelay',
          value: 'Prelay'
        }                  
      ],
      2: [
        { 
          id: "1",
          name: 'synchro',
          value: 'Lip Sync'
        },
        { 
          id: "2",
          name: 'audio-description',
          value: 'Audio Description'
        },
        { 
          id: "3",
          name: 'voice-over',
          value: 'Voice Over'
        },
        { 
          id: "4",
          name: 'Prelay',
          value: 'Prelay'
        }
      ],
      3: [
        { 
          id: "1",
          name: 'synchro',
          value: 'Lip Sync'
        },
        { 
          id: "2",
          name: 'audio-description',
          value: 'Audio Description'
        },
        { 
          id: "3",
          name: 'voice-over',
          value: 'Voice Over'
        },
        { 
          id: "4",
          name: 'Prelay',
          value: 'Prelay'
        }
      ],
      4: [
        { 
          id: "1",
          name: 'synchro',
          value: 'Lip sync'
        },
        { 
          id: "2",
          name: 'audio-description',
          value: 'Audio Description'
        },
        { 
          id: "3",
          name: 'voice-over',
          value: 'Voice Over'
        },
        { 
          id: "4",
          name: 'Prelay',
          value: 'Prelay'
        }
      ]
    }
    // ValueListService.getDoublageTypes()
    service.getDoublageTypes = function () {
      return doublage_types[Session.branchId()]
    }
        // ValueListService.getExploitationTypesById()
    // id in workflow exploitation_type_id
    service.getDoublageTypesById = function () {
      const byId = {}
      doublage_types[Session.branchId()].forEach((entry) => {
        byId[entry.id] = entry
      })
      return byId
    }

    // correspondance en bit
    const doublageTypeBitValue = {
      1: 1,   // Synchro
      2: 2,   // AD
      3: 4,   // Voice Over
      4: 8    // PreLay
    }
    service.getDubBitValueById = function (dubTypeId) {
      return doublageTypeBitValue[dubTypeId]
    }

    // en attendant de modifier la base pour internationaliser table values_exploitation_type
    const exploitation_types = {
      1: [
        { 
          id: "1",
          name: 'cinema',
          value: 'Cinéma'
        },
        { 
          id: "2",
          name: 'video',
          value: 'TV / Home vidéo'
        },
        { 
          id: "4",
          name: 'internet',
          value: 'Internet'
        }                
      ],
      2: [
        { 
          id: "1",
          name: 'cinema',
          value: 'Theatrical release'
        },
        { 
          id: "2",
          name: 'video',
          value: 'TV / Home video'
        },
        { 
          id: "4",
          name: 'internet',
          value: 'Internet'
        } 
      ],
      3: [
        { 
          id: "1",
          name: 'cinema',
          value: 'Theatrical release'
        },
        { 
          id: "2",
          name: 'video',
          value: 'TV / Home video'
        },
        { 
          id: "4",
          name: 'internet',
          value: 'Internet'
        }   
      ],
      4: [
        { 
          id: "1",
          name: 'cinema',
          value: 'Theatrical release'
        },
        { 
          id: "2",
          name: 'video',
          value: 'TV / Home video'
        },
        { 
          id: "4",
          name: 'internet',
          value: 'Internet'
        }   
      ]
    }
    // ValueListService.getExploitationTypes()
    service.getExploitationTypes = function () {
      return exploitation_types[Session.branchId()]
    }
    // ValueListService.getExploitationTypesById()
    // id in workflow exploitation_type_id
    service.getExploitationTypesById = function () {
      const byId = {}
      exploitation_types[Session.branchId()].forEach((entry) => {
        byId[entry.id] = entry
      })
      return byId
    }

    
    const format_mix = {
      1: [
        { 
          id: "1",
          name: 'stereo',
          value: 'Stéréo'
        },
        { 
          id: "2",
          name: '5_1',
          value: '5.1 / LtRt'
        },
        { 
          id: "3",
          name: '7_1',
          value: '7.1'
        },    
        { 
          id: "4",
          name: 'atmos',
          value: 'ATMOS'
        },
        { 
          id: "5",
          name: 'nomixe',
          value: 'pas de mixage'
        },
        { 
          id: "6",
          name: 'mono',
          value: 'Mono'
        },
        { 
          id: "7",
          name: 'imax',
          value: 'IMAX'
        }       
      ],
      2: [
        { 
          id: "1",
          name: 'stereo',
          value: 'Stereo'
        },
        { 
          id: "2",
          name: '5_1',
          value: '5.1 / LtRt'
        },
        { 
          id: "3",
          name: '7_1',
          value: '7.1'
        },    
        { 
          id: "4",
          name: 'atmos',
          value: 'ATMOS'
        },
        { 
          id: "5",
          name: 'nomixe',
          value: 'no mixing'
        },
        { 
          id: "6",
          name: 'mono',
          value: 'Mono'
        },
        { 
          id: "7",
          name: 'imax',
          value: 'IMAX'
        }
      ],
      3: [
        { 
          id: "1",
          name: 'stereo',
          value: 'Stereo'
        },
        { 
          id: "2",
          name: '5_1',
          value: '5.1 / LtRt'
        },
        { 
          id: "3",
          name: '7_1',
          value: '7.1'
        },    
        { 
          id: "4",
          name: 'atmos',
          value: 'ATMOS'
        },
        { 
          id: "5",
          name: 'nomixe',
          value: 'no mixing'
        },
        { 
          id: "6",
          name: 'mono',
          value: 'Mono'
        },
        { 
          id: "7",
          name: 'imax',
          value: 'IMAX'
        }
      ],
      4:[
        { 
          id: "1",
          name: 'stereo',
          value: 'Stereo'
        },
        { 
          id: "2",
          name: '5_1',
          value: '5.1 / LtRt'
        },
        { 
          id: "3",
          name: '7_1',
          value: '7.1'
        },    
        { 
          id: "4",
          name: 'atmos',
          value: 'ATMOS'
        },
        { 
          id: "5",
          name: 'nomixe',
          value: 'no mixing'
        },
        { 
          id: "6",
          name: 'mono',
          value: 'Mono'
        },
        { 
          id: "7",
          name: 'imax',
          value: 'IMAX'
        }
      ]
    }
    // ValueListService.getFormatMix()
    service.getFormatMix = function () {
      return format_mix[Session.branchId()]
    }

    // ValueListService.getFormatMixHashById()
    service.getFormatMixHashById = function () {
      const byId = {}
      format_mix[Session.branchId()].forEach((formatMix) => {
        byId[formatMix.id] = formatMix
      })
      return byId
    }
    

    service.gotFormatMixFromDatabase = function (response) {
      format_mix[1] = response
      format_mix[2] = response
      format_mix[3] = response
      format_mix[4] = response
    }

    // ValueListService.getFormatMixFromDatabase(ValueListService.gotFormatMixFromDatabase,function () {})
    service.getFormatMixFromDatabase = function(successCallback, errorCallback) {
      ApiRest.get('/valuelists/format_mix/' , {} , function(response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error)
      })
    } 

    // ValueListService.getWorkflowMixById() 
    service.getWorkflowMixById = function () {
      const byId = {}
      format_mix[Session.branchId()].forEach((entry) => {
        byId[entry.id] = entry
      })
      return byId
    }

    const projector_aspects = [
      { "value": "Scope" }, 
      { "value": "Flat" }
    ]

    // ValueListService.getProjectorAspects()
    service.getProjectorAspects = function () {
      return projector_aspects
    }

    const dcp_standards = [
      { "value": "Interop" }, 
      { "value": "SMPTE"}
    ]

    // ValueListService.getDCPStandards()
    service.getDCPStandards = function () {
      return dcp_standards
    }

    service.getDubPlaces_old = function () {
      // A remplacer par les donnees de la base à terme, table values_dub_places (note 20210318)
      let branchId = 1
      branchId = Session.branchId()
      const places = {
        1: [
          {"value": "France", loc_value: 1 }, 
          {"value": "Belgique",  loc_value: 2 }, 
          {"value": "Hybride"}],
        2: [

        ],  
        3: [{"value": "USA", loc_value: 1}],  
        4: [{"value": "Italia", loc_value: 1}]
      }   
      return places[branchId] 
    }
    let dubPlacesBase = null
    let dubPlacesByLocValue = null
    $rootScope.dubPlaces = null
    $rootScope.dubPlacesByLocValue = null
    $rootScope.mainLocationList = {}

    const returnManagedDubPlaces = function (places, done) {
      const branchId = Session.branchId()
      $localstorage.setObject('lantern_dubPlaces_' + branchId, places)
      const dubPlaces = places
      dubPlacesByLocValue = {}
      const mainLocationList  = {}
      let hybrid = null;
      Object.keys(places[branchId]).forEach((place) => {
        if (!dubPlacesByLocValue[branchId]) {
          dubPlacesByLocValue[branchId] = {}
        }
        if (!mainLocationList[branchId]) {
          mainLocationList[branchId] = {}
        }
        const detailPlace = places[branchId][place]
        mainLocationList[branchId][detailPlace.id] = detailPlace
        dubPlacesByLocValue[branchId][detailPlace.loc_value] = detailPlace

        if (!hybrid) {
          hybrid = {
            value: detailPlace.value,
            name: detailPlace.name,
            loc_value: detailPlace.loc_value
          }
        } else {
          hybrid.loc_value |= detailPlace.loc_value
          hybrid.name += '-' + detailPlace.name
          hybrid.value += ' - ' + detailPlace.value
        }
      })
      if (hybrid.loc_value > 1) {
        dubPlaces[branchId][hybrid.name] = hybrid
        dubPlacesByLocValue[branchId][hybrid.loc_value] = hybrid.loc_value
      }
      $rootScope.dubPlacesByLocValue = dubPlacesByLocValue
      $rootScope.dubPlaces = dubPlaces
      $rootScope.mainLocationList = mainLocationList[branchId]


      return done(dubPlaces[branchId])
    }

    service.manageDubPlacesReceived = function (done) {
      return function (places) {
        dubPlacesBase = JSON.parse(JSON.stringify(places))
        return returnManagedDubPlaces(places, done)
      }
    }

    service.manageErrorDubPlaceReceived = function (error) {
      return error
    }

    // table values_dub_places
    service.getDubPlaces = function(successCallback, errorCallback) {
      const branchId = Session.branchId()
      const toCheck = localUpdates.checkUpdates('dubPlaces', 300)
      const dubPlaces = $localstorage.getObject('lantern_dubPlaces_' + branchId)
      if (dubPlaces && !toCheck) {
        return successCallback(dubPlaces)
      }
      ApiRest.get('/valuelists/dub_places/', {} , function(places) {
        return successCallback(places)
      }, function(error) {
        return errorCallback(error)
      })
    }  

    let locationList = null
    $rootScope.locationsById = {}
    service.manageReceivedLocation = function (locations) {
      const branchId = Session.branchId()
      locationList = locations
      locations.forEach((location) => {
        if (location.branch_id == branchId) {
          $rootScope.locationsById[location.id] = location
        }
      })
    }

    service.getLocation = function (successCallback, errorCallback) {
      if (locationList) {
        return successCallback(locationList)
      }
      ApiRest.get('/valuelists/location/', {} , function(locations) {
        locationList = locations
        return successCallback(locations)
      }, function(error) {
        return errorCallback(error)
      })
    }

    $rootScope.etapes = {}
    $rootScope.allEtapes;
    service.initEtapesActions = function (etapesActionsResponse) {
      $rootScope.allEtapes = etapesActionsResponse
      if (!$rootScope.etapesActionsBase) {
        $rootScope.etapesActionsBase = {}
      }
      $rootScope.etapes = {}
      const etapesActions = []
      let workflow_type_id = etapesActionsResponse[0].workflow_type_id
      etapesActions[workflow_type_id] = []
      angular.forEach(etapesActionsResponse, function(etape) {
        $rootScope.etapes[etape.id] = etape
        angular.forEach(etape.actions, function (action) {
          $rootScope.actions[action.id] = action
          action.etape_value = etape.value
          action.etape = {}
          action.etape.id = etape.id
          action.etape.name = etape.name
          action.etape.value = etape.value
          action.etape.value_short = etape.value_short
          action.etape.loc_value = etape.loc_value
          action.etape.allow_request = etape.allow_request
          if (action.allow_request === 1) {
            etapesActions[workflow_type_id].push(action)
          }
        })
      })
      $rootScope.etapesActionsBase[workflow_type_id] = etapesActions[workflow_type_id]
    } 
    
    service.filterEtapes = function (workflow_type_id, etapes, workflow_managed, done) {
      // gestion de la Belgique, groumpf
      let illimited = true
      if (workflow_managed && workflow_managed.dub_place && (workflow_managed.dub_place == 'Hybride' || workflow_managed.dub_place == 'Belgique' || workflow_managed.dub_place.value == 'Hybride' || workflow_managed.dub_place.value == 'Belgique'  || parseInt(workflow_managed.dub_place_value) & 3)) {
        illimited = false
      }
      const etapes_actions = []
      angular.forEach(etapes, function(etape) {
        angular.forEach(etape.actions, function(action) {
          action.etape_value = etape.value
          action.etape = {}
          action.etape.id = etape.id
          action.etape.name = etape.name
          action.etape.value = etape.value
          action.etape.loc_value = etape.loc_value
          if (etape.loc_value && workflow_managed) {
            // les actions enregistrement ne peuvent être faites que si le workflow correspond à l'étape
            if (action.planning == 'farmer') {
              if (action.etape.name == 'enregistrement' || action.etape.name == 'montage') {
                if ((etape.loc_value & parseInt(workflow_managed.dub_place_value)) != 0) {
                 // if ( parseInt(workflow_managed.dub_place_value) == 3) {
                    action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                 //  }
                  etapes_actions.push(action)
                }
                
              } else {
                if (workflow_managed && $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].id == workflow_managed.main_location_id) {
                  action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                  etapes_actions.push(action)
                }
              }
              
            }
            // en fonction du site principal, on va afficher ou non certains éléments (volume principalement)
            // les planning de type volume et qui distinguent entre les sites, affiche en fonction du site principal du workflow
            if (action.planning == 'volume') {
              if (workflow_managed && $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].id == workflow_managed.main_location_id) {
                action.value += ' (' + $rootScope.dubPlacesByLocValue[Session.branchId()][etape.loc_value].value + ')'
                etapes_actions.push(action)
              }
            }

          } else {
            if (illimited) {
              if (action.service != 'belgique') {
                etapes_actions.push(action)
              }
            } else {
              if (workflow_managed) {
                if (action.etape.name === "enregistrement") {
                  if (!workflow_managed.dub_place_value) {
                    etapes_actions.push(action)
                  } else {
                    if (parseInt(workflow_managed.dub_place_value) == 3) {
                      etapes_actions.push(action)
                    } else if (parseInt(workflow_managed.dub_place_value) == 1) {
                      if (action.service != 'belgique') {
                        etapes_actions.push(action)
                      }
                    } else if (parseInt(workflow_managed.dub_place_value) == 2 ) {
                      if (action.service == 'belgique') {
                        etapes_actions.push(action)
                      }
                    }
                  }
                } else {
                  etapes_actions.push(action)
                }
              } else {
                etapes_actions.push(action)
              }
            }
          }
        })
      })
      return done(etapes_actions)
    }
    return service;
  }
]);
