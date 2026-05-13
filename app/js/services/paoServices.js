/**
 * Services pour gérer l'aide à la planification
 * 
 * 
 */
Lantern.factory('PaoService', ['$rootScope', 'ApiRest', 'Session', 'Comment', '$q', '$filter', 'ValueListService', 'HelperService', 'FarmerService',
  function ($rootScope, ApiRest, Session, Comment, $q, $filter, ValueListService, HelperService, FarmerService) {
    const service = {}
    let dubbingSteps = null
    let projectTypes = null  

    $rootScope.bookingConditions = null

    const doublageTypeBitValue = {
        1: 1,
        2: 2,
        3: 4,
        4: 8
    }

    service.getDubbingSteps = function (done) {
        if (dubbingSteps) {
            return done(dubbingSteps)
        }
        ValueListService.getDubbingSteps(function (data) {
            dubbingSteps = data
            return done(dubbingSteps)
        },
        function (error) {})
    }
    service.getProjectTypes = function (done) {
        if (projectTypes) {
            return done(projectTypes)
        }
        ValueListService.getProjectTypes(function (data) {
            projectTypes = data
            return done(projectTypes)
        },
    function (error) {})
    }    
    service.getBookingConditions = function (successCallback, errorCallback) {
        if (!$rootScope.bookingConditions) {
            ApiRest.get('/booking/bookingConditions/', {} , function(result) {
                $rootScope.bookingConditions = result
                return successCallback()
                }, function(error) {
                return errorCallback(result)
                })
        } else {
            return successCallback()
        }

    }

    service.getRoomCoefficients = function (dubbingType, data, successCallback, errorCallback) {
        ApiRest.post('/vrequests/coefficients/' + dubbingType + '/' , null, data , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }

    service.getUsedTime = function (data, successCallback, errorCallback) {
        ApiRest.post('/vrequests/time/used/' , null, data , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }    

    service.getFarmersListForDashboard = function (parameters, successCallback, errorCallback) {
        ApiRest.post('/farmerbookings/dashboard/', null, parameters , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }

    service.getDeferredFarmersListForDashboard = function (parameters, ) {
        const deferred = $q.defer();
        ApiRest.post('/farmerbookings/dashboard/', null, parameters , 
            function(response) {
                deferred.resolve(response);
            }, 
            function(error) {
                deferred.resolve(response);
            })
        return deferred.promise
    }
    
    
    service.getNotesListForDashboard = function (parameters, successCallback, errorCallback) {
        ApiRest.post('/farmerbookings/dashboard/notes/', null, parameters , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }

    service.getUnavailableRoomsListForDashboard = function (parameters, successCallback, errorCallback) {
        ApiRest.post('/farmerbookings/dashboard/unavailable/', null, parameters , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }

    // list of tech unavailable (holidays, etc)
    service.getIndispoListForDashboard = function (parameters, successCallback, errorCallback) {
        ApiRest.post('/farmerbookings/dashboard/indispo/', null, parameters , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(result)
            })
    }

    service.getAuditDataForDashboard = function (parameters, successCallback, errorCallback) {
        ApiRest.processFile('/farmerbookings/audit/export', null, parameters , function(result) {
            return successCallback(result)
            }, function(error) {
            return errorCallback(error)
            });
    }

    // Note pour les valeurs de preset, déjà fait dans ValueListService à la réception
    // cette fonction est utilisé pour les réservations trouvées
    service.addMinutesSlots = function (sessions) {
      // HelperService
      sessions.forEach((session) => {
        session['datetime_start_DayTime'] = HelperService.fromHourToMinutes(session.datetime_start.match(/ (\d\d:\d\d)/)[1])
        session['datetime_end_DayTime'] = HelperService.fromHourToMinutes(session.datetime_end.match(/ (\d\d:\d\d)/)[1])
      })  
    }

    service.getDubbingStep = function (etapeTypeName) {
        let dubbingStep = 0
        if (etapeTypeName == 'enregistrement') {
            dubbingStep = 1
          } else if (etapeTypeName == 'mixage') {
            dubbingStep = 2
          } else if (etapeTypeName == 'montage') {
            dubbingStep = 4
          } else if (etapeTypeName == 'prepa_audio') {
            dubbingStep = 8
          } else if (etapeTypeName == 'fabrication') {
            dubbingStep = 16
          }
          return dubbingStep
    }

    // pour vérifier les durées maximales autorisées (régles clients), il faut que les produits disposent soit de la durée, soit du nombre de bobines
    // - mix et rex uniquement
    // -  exploitation cinéma (1) - doublage type synchro lipsync (1) nombre de bobines requis
    // - le reste durée requise
    service.isMissingData = function (dubbingStep, exploitation, duration, nbReels) {
        if (parseInt(dubbingStep) & 3) {
            if (parseInt(exploitation) & 1) {
                if (!nbReels) {
                    return [false, true]
                }
            } else {
                if (!duration) {
                    return [true, false]
                }
            }
        }
        return [false, false]
    }

    let dubPlace = null
    const gotTechniciansConditions = function (result, data, allTechsById, techniciansList, roleAllAllowed, done) {
        const AlreadyUsedTechnicians = result.used
        const compatibleTechnicians = result.compatible
        // ffs allemagne: l'aspect local est limité à rec et montage, géré automatiquement: si loc_value est définie dans une étape
        
        if ($rootScope.dubPlacesByLocValue &&  $rootScope.dubPlacesByLocValue[Session.branchId()]) {
            dubPlace = $rootScope.dubPlacesByLocValue[Session.branchId()][data.actionType.etape_type.loc_value]
        }
        // display in blue already used technician AND priority == 1
        Object.keys(AlreadyUsedTechnicians).forEach((techId) => {
            if ($rootScope.allTechnicians[techId]) {
                let gotIt = !dubPlace
                if (dubPlace && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                    gotIt = true
                }
                if (gotIt && $rootScope.allTechnicians[techId].app_role_id != 63 || $rootScope.allTechnicians[techId].app_role_id != 64) {
                    let statusOrder = 3             
                    let priority = ''
                    if (compatibleTechnicians[techId] && compatibleTechnicians[techId].priority == 1) {
                        priority = compatibleTechnicians[techId].priority
                        statusOrder = 1 // compatibleTechnicians[techId].priority == 1 ? 1 : compatibleTechnicians[techId].priority == 2 ? 2 : 3
                        const techData = {
                            fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                            firstname: $rootScope.allTechnicians[techId].firstname,
                            lastname:  $rootScope.allTechnicians[techId].lastname,
                            used: 'u',
                            id: techId,
                            statusClass: 'techStatus' + statusOrder,
                            order: 'a' + statusOrder,
                            priority: priority
                        } 
                        // prod et autres ne gèrent pas les freelances
                        if ($rootScope.canDisplay(roleAllAllowed)) {
                            techniciansList.push(techData)
                            delete allTechsById[techId]
                        } else {
                            if ($rootScope.allTechnicians[techId].app_role_id != 68) {
                                techniciansList.push(techData)
                                delete allTechsById[techId]
                            }
                        }
                    } else {
                        // priority différentes de 1, le tech sera compatible 
                        if (compatibleTechnicians[techId]) {
                            delete AlreadyUsedTechnicians[techId]
                        }
                    }
                }
                
            } else {
                console.log('technicien inconnu ' + techId)
            }
        })
        
        // ajoute les techs compatibles pas déjà servis ou déjà servis, mais statut priority == 2, autrement dit exceptionnel
        Object.keys(compatibleTechnicians).forEach((techId) => {
            let gotIt = !dubPlace
            if (dubPlace && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                gotIt = true
            }
            if (gotIt && !AlreadyUsedTechnicians[techId] && $rootScope.allTechnicians[techId]) {
                let statusClass = compatibleTechnicians[techId].priority == 1 ? 'techStatus2' : compatibleTechnicians[techId].priority == 2 ? 'techStatus3' : 'techStatus4'             
                const techData = {
                    fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                    firstname: $rootScope.allTechnicians[techId].firstname,
                    lastname:  $rootScope.allTechnicians[techId].lastname,
                    used: compatibleTechnicians[techId].priority.padStart(2, '0'),
                    id: techId,
                    statusClass: statusClass,
                    order: 'b' + compatibleTechnicians[techId].priority == '0' ? '10' : compatibleTechnicians[techId].priority.padStart(2, '0'),
                    priority: compatibleTechnicians[techId].priority
                } 
                // prod et autres ne gèrenet pas les freelances
                if ($rootScope.canDisplay(roleAllAllowed)) {
                    techniciansList.push(techData)
                } else {
                    if ($rootScope.allTechnicians[techId].app_role_id != 68) {
                        techniciansList.push(techData)
                    }
                }
                delete allTechsById[techId]
            }
        })
        const addedTech = {}
        // special FFS
        $rootScope.allEditors = {}
        // pour FFS, une liste spécial editor, utilisée pour rec et mix
        if (Session.branchId() == 2 &&  (data.dubbing_step & 3)) {
            Object.keys($rootScope.allTechnicians).forEach((techId) => {
                // rec is located, but not the mix, so we filter on location for recordings, but not for mix :)
                if (data.dubbing_step == 1) {
                    if (parseInt($rootScope.allTechnicians[techId].dubbing_step) & 4 && dubPlace && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                        $rootScope.allEditors[techId] = $rootScope.allTechnicians[techId]
                    }
                } else {
                    $rootScope.allEditors[techId] = $rootScope.allTechnicians[techId]
                }
            })
            console.log($rootScope.allEditors)
        }

        // not rec or mix, for case where tech has not been yet defined
        if (!(data.dubbing_step & 3)) {
            Object.keys($rootScope.allTechnicians).forEach((techId) => {
                let gotIt = !dubPlace
                if (dubPlace && $rootScope.allTechnicians[techId] && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                    gotIt = true
                }
                if (gotIt && !addedTech[techId] && parseInt($rootScope.allTechnicians[techId].dubbing_step) & parseInt(data.dubbing_step)) {
                    addedTech[techId] = true
                    const techData = {
                        fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                        firstname: $rootScope.allTechnicians[techId].firstname,
                        lastname:  $rootScope.allTechnicians[techId].lastname,
                        used: ' ',
                        order: 'c10',
                        statusClass: 'techStatus2',
                        id: techId,
                        priority: 0
                    }                
                    techniciansList.push(techData)                 
                }
            })
        }
        // et on ajoute pour le planning seulement, tous les techniciens possibles
        // pour le planning, on garde le reste des tech avec le dubbing_step correspondant, mais sans précision
        // retiré !$rootScope.allTechnicians[techId].dubbing_step ||  ou tout si le dubbing_step n'est pas défini ou à 0
        if ($rootScope.canDisplay(roleAllAllowed)) {
            let statusClass = 'techStatus4'
            if (!(data.dubbing_step & 3)) {
                // statusClass = 'techStatusBase'
            }
            if (Session.branchId() == 2 && data.dubbing_step & 3 ) {
                statusClass = 'techStatus2'
            }
            Object.keys(allTechsById).forEach((techId) => {
                let gotIt = !dubPlace
                if (dubPlace && $rootScope.allTechnicians[techId] && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                    gotIt = true
                }
                if (gotIt && !addedTech[techId] && $rootScope.allTechnicians[techId] && (parseInt($rootScope.allTechnicians[techId].dubbing_step) & parseInt(data.dubbing_step))) {
                    addedTech[techId] = true
                    const techData = {
                        fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                        firstname: $rootScope.allTechnicians[techId].firstname,
                        lastname:  $rootScope.allTechnicians[techId].lastname,
                        used: '',
                        order: 'c10',
                        statusClass: statusClass,
                        id: techId,
                        priority: compatibleTechnicians[techId] && compatibleTechnicians[techId].priority ? compatibleTechnicians[techId].priority : 0
                    }
                    techniciansList.push(techData)
                }
            })
        }

        if (techniciansList.length == 0) {
            Object.keys($rootScope.allTechnicians).forEach((techId) => {
                let gotIt = !dubPlace
                if (dubPlace && $rootScope.allTechnicians[techId] && dubPlace.id == $rootScope.allTechnicians[techId].main_location) {
                    gotIt = true
                }
                if (gotIt) {
                    if (!addedTech[techId] && (parseInt($rootScope.allTechnicians[techId].dubbing_step) & parseInt(data.dubbing_step))) {
                        const techData = {
                            fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                            firstname: $rootScope.allTechnicians[techId].firstname,
                            lastname:  $rootScope.allTechnicians[techId].lastname,
                            used: 'n/a',
                            order: 'c10',
                            statusClass: 'techStatusBase',
                            id: techId,
                            priority: 0
                        }                
                        techniciansList.push(techData)
                    }
                }
            })
        }
        service.setListeEditors()
        return done()
    }


    service.getQualifiedTechnicians = function (data, allTechsById, techniciansList, roleAllAllowed, done) {
        const techsParameters =  {
            subproject_id: data.subproject_id,
            project_id: data.project_id, 
            action_id: data.action_id, 
            dubbing_step: data.dubbing_step, 
            doublage_type_id: data.doublage_type_id, 
            exploitation_id: data.exploitation_id, 
            normal: 1, 
            format_mix_id: data.format_mix_id,
            project_type_id: data.project_type_id
          }
        FarmerService.getTechniciansConditions(techsParameters, 
                function (result) {
                    gotTechniciansConditions(result, data, allTechsById, techniciansList, roleAllAllowed, done) 
                }, 
                function () {}
        )        
    }

    service.setListeEditors = function () {
        $rootScope.listEditors = []
        Object.keys($rootScope.allEditors).forEach((techId) => {
            const techData = {
                fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                firstname: $rootScope.allTechnicians[techId].firstname,
                lastname:  $rootScope.allTechnicians[techId].lastname,
                used: '',
                order: 'c10',
                statusClass: 'techStatus2',
                id: techId,
                priority: 0
            }
            $rootScope.listEditors.push(techData)
        })

    }

    
    // traitement des données de salles
    // liste des salles selon leur usage passé et leurs qualifications
    // les données sont affichées dans le select du popup de programmation avancée app/requestDates/requestDatesCtrl.js
    const gotRoomsConditions = function (result, data, stageList, allRoomsByName, roleAllAllowed, done) {
        // branche allemande qui gère par location en plus du pays
        if ($rootScope.dubPlacesByLocValue &&  $rootScope.dubPlacesByLocValue[Session.branchId()]) {
            dubPlace = $rootScope.dubPlacesByLocValue[Session.branchId()][data.actionType.etape_type.loc_value]
        }
        const alreadyUsedRooms = result.used
        const compatibleRooms = result.compatible
        // rooms already used for the project AND normal == 1 (normal == 2 signifie excpetionnel et n'est donc pas mis en tête ni en couleur bleue)
        Object.keys(alreadyUsedRooms).forEach((name) => {
            let gotIt = !dubPlace
            if (dubPlace && $rootScope.allRoomsById[allRoomsByName[name]] && dubPlace.id == $rootScope.allRoomsById[allRoomsByName[name]].main_location) {
                gotIt = true
            }
            const dubbingTypeIdReceived = doublageTypeBitValue[alreadyUsedRooms[name][1]]
            const dubbingTypeIdRequest = doublageTypeBitValue[data.doublage_type_id]
            if (gotIt && parseInt(dubbingTypeIdReceived) & parseInt(dubbingTypeIdRequest)) {
                let statusOrder = 3
                if ((compatibleRooms[name] && compatibleRooms[name].normal == 1) || !(data.dubbing_step & 3)) {
                    statusOrder =  1 // compatibleRooms[name].normal == 1 ? 1 : compatibleRooms[name].normal == 2 ? 2 : 3
                    const roomData = {
                        name: name,
                        long_name: $rootScope.allRoomsById[allRoomsByName[name]].long_name,
                        id: allRoomsByName[name],
                        place: $rootScope.allRoomsById[allRoomsByName[name]].place,
                        used: ' u ',
                        statusClass: 'roomStatus' + statusOrder,
                        normal: compatibleRooms[name] ? compatibleRooms[name].normal : 0,
                        priority: compatibleRooms[name] && compatibleRooms[name].priority ? compatibleRooms[name].priority : 0,
                        orderRoom: 'a' + statusOrder + (compatibleRooms[name] && compatibleRooms[name].priority ? compatibleRooms[name].priority.padStart(2, '0') : '10'),
                        dubbing_step: $rootScope.allRoomsById[allRoomsByName[name]].dubbing_step
                    }
                    delete allRoomsByName[name]
                    delete alreadyUsedRooms[name]
                    stageList.push(roomData)                
                } else {
                    // room is compatible, but not normal == 1
                    if (compatibleRooms[name]) {
                        delete alreadyUsedRooms[name]
                    }
                }
            } else {
                // rooms are not compatible with the dubbing step
                delete alreadyUsedRooms[name]
            }

        })

        // compatible rooms for the type of action
        Object.keys(compatibleRooms).forEach((name) => {
            let gotIt = !dubPlace
            if (dubPlace && $rootScope.allRoomsById[allRoomsByName[name]] && dubPlace.id == $rootScope.allRoomsById[allRoomsByName[name]].main_location) {
                gotIt = true
            }
            if (gotIt && !alreadyUsedRooms[name] && allRoomsByName[name]) {
                let status = compatibleRooms[name].normal == 1 ? 'n' : compatibleRooms[name].normal == 2 ? 'e' : 'n/a'
                let statusOrder =  compatibleRooms[name].normal == 1 ? 1 : compatibleRooms[name].normal == 2 ? 2 : 3
                let statusClass = compatibleRooms[name].normal == 1 ? 'roomStatus2' : compatibleRooms[name].normal == 2 ? 'roomStatus3' : 'roomStatus4'
                // editing, all is normal et priority 1
                if (parseInt(data.dubbing_step) & 4) {
                    status = 'n'
                    statusOrder = 1
                    statusClass = 'roomStatus2'
                    compatibleRooms[name].normal = 1
                }
                const roomData = {
                    name: name,
                    long_name: $rootScope.allRoomsById[allRoomsByName[name]].long_name,
                    id: allRoomsByName[name],
                    place: $rootScope.allRoomsById[allRoomsByName[name]].place,
                    used: status,
                    statusClass: statusClass,
                    normal: compatibleRooms[name].normal,
                    priority: compatibleRooms[name].priority,
                    orderRoom: 'b' + statusOrder +  (compatibleRooms[name].priority ? compatibleRooms[name].priority.padStart(2, '0') : '10'),
                    dubbing_step: $rootScope.allRoomsById[$rootScope.allRoomsByName[name]].dubbing_step
                }
                delete allRoomsByName[name]
                stageList.push(roomData)
            }
        })
        // pour le planning, on garde le reste des salles avec le dubbing_step ou tout si  0
        if ($rootScope.canDisplay(roleAllAllowed)) {
            Object.keys(allRoomsByName).forEach((name) => {
                let gotIt = !dubPlace
                if (dubPlace && $rootScope.allRoomsById[allRoomsByName[name]] && dubPlace.id == $rootScope.allRoomsById[allRoomsByName[name]].main_location) {
                    gotIt = true
                }
                if (gotIt && $rootScope.allRoomsById[allRoomsByName[name]].dubbing_step & data.dubbing_step ) {
                    const roomData = {
                        name: name,
                        long_name: $rootScope.allRoomsById[allRoomsByName[name]].long_name,
                        id: allRoomsByName[name],
                        place: $rootScope.allRoomsById[allRoomsByName[name]].place,
                        used: 'n/a',
                        statusClass: 'roomStatus4',
                        normal: compatibleRooms[name] && compatibleRooms[name] ? compatibleRooms[name].normal : 0,
                        priority: 0,
                        orderRoom: 'c310',
                        dubbing_step: $rootScope.allRoomsById[allRoomsByName[name]].dubbing_step
                    }
                    stageList.push(roomData)                
                }
            })
        }
        // not rec or mix
        if (!(data.dubbing_step & 7)) {
            $rootScope.allRooms.forEach((room) => {
                let gotIt = !dubPlace
                if (dubPlace && $rootScope.allRoomsById[room.id] && dubPlace.id == $rootScope.allRoomsById[room.id].main_location) {
                    gotIt = true
                }
                if (gotIt & room.dubbing_step & data.dubbing_step && allRoomsByName[room.name]) {
                    const roomData = {
                        name: room.name,
                        long_name: room.long_name,
                        id: room.id,
                        place: room.place,
                        used: ' ',
                        statusClass: 'roomStatusBase',
                        normal: 0,
                        priority: 0,
                        orderRoom: 'c310',
                        dubbing_step: 0
                    }                
                    stageList.push(roomData)                     
                }
            })
        }
        // dans le cas où la liste est vide (aucune salle trouvée), on renvoie la lsite complète
        if (stageList.length == 0) {
            $rootScope.allRooms.forEach((room) => {
                let gotIt = !dubPlace
                if (dubPlace && dubPlace.id == $rootScope.allRoomsById[room.id].main_location) {
                    gotIt = true
                }
                if (gotIt) {
                    const data = {
                        name: room.name,
                        long_name: room.long_name,
                        id: room.id,
                        place: room.place,
                        used: 'n/a',
                        statusClass: 'roomStatusBase',
                        normal: 0,
                        priority: 0,
                        orderRoom: 'c310',
                        dubbing_step: 0
                    }                
                    stageList.push(data) 
                }

            })
        }
        return done() 
    } 

    // getting booking and techs data from the server
    service.getQualifiedRooms = function (data, days, stageList, allRoomsByName, roleAllAllowed, done) {
        const roomsParameters =  {
            subproject_id: data.subproject_id,
            project_id: data.project_id, 
            action_id: data.action_id, 
            dubbing_step: data.dubbing_step, 
            doublage_type_id: data.doublage_type_id, 
            exploitation_id: data.exploitation_id, 
            normal: 1, 
            format_mix_id: data.format_mix_id,
            project_type_id: data.project_type_id,
            dates: days
          }
          FarmerService.getRoomsConditions(roomsParameters, function (result) {
                gotRoomsConditions(result, data, stageList, allRoomsByName, roleAllAllowed, done)
            }, 
            function () {}
        )        
    }

    return service
  }


])