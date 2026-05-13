function SelectTechRequestPopup($rootScope, $scope, ApiRest, $filter, FarmerService, RequestService, $q, NotificationService, Comment, Notification, Session, PersonsService){
    // voir html select-tech-request-popup in app/requestGroup/requestGroup.html
    let ctrl = this;
    let rest = {};
    let service = {};
    let isFarmerSelected
    ctrl.allTechs = []

    ctrl.branchId = Session.branchId()

    ctrl.canDisplayEditor = function () {
        if (ctrl.branchId && ctrl.branchId == 2 && (ctrl.actionType.etape_type.name == 'enregistrement' || ctrl.actionType.etape_type.name == 'mixage')) {
            return true
        }

        return false
    }
    PersonsService.getTechnicians(function (result) {
        PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
      }, PersonsService.manageTechniciansError)

    ctrl.actionType = ctrl.requests[0].action_type
    let dubPlace = null
    // ffs allemagne: l'aspect local est limité à rec et montage, géré automatiquement: si loc_value est définie dans une étape
    if ($rootScope.dubPlacesByLocValue &&  $rootScope.dubPlacesByLocValue[Session.branchId()]) {
        dubPlace = $rootScope.dubPlacesByLocValue[Session.branchId()][ctrl.actionType.etape_type.loc_value]
    }

    // ffs prend les techs liés au lieu
    const getTechnicianName = function (techId) {
        const techName = {person: {}}
        ctrl.allTechs.forEach(function (tech) {
            if (techId == tech.id) {
                techName.person.firstname = tech.firstname
                techName.person.lastname = tech.lastname
            }
        })
        return techName
    }

    const getRoomInfo = function (roomName) {
        let roomFound = null
        $rootScope.allRooms.some(function (room) {
            if (room.name == roomName) {
                roomFound = room
                return true
            }
        })
        return roomFound
    }

    let checkingTech = false

    const isTechAvailable = function (date, technician, done) {
        checkingTech = true
        const start_time = date.start_time_h
        const end_time = date.end_time_h
        const chosenStartDate = new Date(date.day.replace('00:00:00', start_time)).getTime() / 1000
        let chosenEndDate   = new Date(date.day.replace('00:00:00', end_time)).getTime() / 1000
        if ( chosenEndDate < chosenStartDate) {
          chosenEndDate += 86400
        }
        const room = getRoomInfo(date.audit)
        const date2check = {}
        const params = {
          start: chosenStartDate,
          end: chosenEndDate,
          user_id: technician.id,
          audit: date.audit,
          roomId: room.id
        }
        ApiRest.post('/booking/unavailable/techs/', null, params, function(response) {
          checkingTech = false
          return done(response)
        }, function(error){
            checkingTech = false
            service.setErrorLoading(true);
            return done()
        })
      }   


    service.resetTech = function() {
        ctrl.selectedTechnicians = {};
        ctrl.selectedTechnicians.reader = null;
        ctrl.selectedTechnicians.writer = null;
        ctrl.selectedTechnicians.editor = null;
    };

    service.setIsFarmerSelected = function(isSelected) {
        isFarmerSelected = isSelected;
    };
    service.isFarmerSelected = function() {
        return isFarmerSelected;
    }

    // see in  app\components\farmerbookingsTablePopup.js
    $rootScope.$on('selectFarmer', function (event, items) {
        
        const farmer = items[0]
        const is_selected = items[1]
        if (is_selected) {
            if (ctrl.allTechs) {
                for (let i = 0; i < ctrl.allTechs.length; i++) {
                    if (farmer.tech_reader_id == ctrl.allTechs[i].id) {
                        ctrl.selectedTechnicians.reader = ctrl.allTechs[i]
                    }
                    if (farmer.tech_writer_id == ctrl.allTechs[i].id) {
                        ctrl.selectedTechnicians.writer = ctrl.allTechs[i]
                    }
                    if (farmer.tech_editor_id == ctrl.allTechs[i].id) {
                        ctrl.selectedTechnicians.editor = ctrl.allTechs[i]
                    }
                } 
            }
        } else {
            service.resetTech()
        }
        service.setIsFarmerSelected(is_selected);
    });

    service.getTechnicianFullname = function(technician) {
        return technician.firstname + " " + technician.lastname;
    };

    const findDates = function (technician) {
        let requests = ctrl.getSelectedRequests(ctrl.requests)
        const allDates = []
        requests.forEach(function (request) {
            request.ownFarmerbookings.forEach(function (farmer) {
                if ( farmer.selected && (farmer.booking_id !== undefined || farmer.booking_id !== null) && (farmer.tech_writer_id === undefined || farmer.tech_writer_id === null)) {    
                    const dates = {}
                    dates.audit = farmer.audit
                    dates.day = farmer.day
                    if (farmer.start_time) {
                        dates.start_time_h = farmer.start_time.replace('h',':') + ':00'
                        dates.end_time_h = farmer.end_time.replace('h',':') + ':00'
                    } else {
                        dates.start_time_h = null
                        dates.end_time_h = null
                    }
                    allDates.push(dates)
                }
            })
        })
        allDates.forEach(function (date) {
            if (date.audit !== undefined || date.audit !== null) {
                isTechAvailable(date, technician, function (result) {
                    const techName = technician.firstname + ' '  + technician.lastname
                    if (result[0] == 'ko') {
                        let dates_message = ''
                        result[1].forEach(function (entry) {
                          dates_message += entry.datetime_start + ' ' + entry.datetime_end + ' | '
                        })
                        ctrl.setAlertMessage({message: techName + ' ' + $rootScope._T["x9915faa"] + "\n" + dates_message, isError:true});
                    } else {
                        ctrl.setAlertMessage({message: techName + ' ' + $rootScope._T["3rktd0ac"] + " ", isError:false});
                    }
                })
            }

        })
    }

    service.setSelectedTechnicians = function(technician, type) {
        if (type == 'writer' ) {
            if (technician) {
                ctrl.selectedTechnicians.writer = technician
                findDates(technician)
            } else {
                ctrl.selectedTechnicians.writer = null
            }

        } else if (type == 'reader') {
            if (technician) {
                ctrl.selectedTechnicians.reader = technician
                findDates(technician)
            } else {
                ctrl.selectedTechnicians.reader = null
            }
        } else if (type == 'editor') {
            if (technician) {
                ctrl.selectedTechnicians.editor = technician
                findDates(technician)
            } else {
                ctrl.selectedTechnicians.editor = null
            }    
        }
    };

    service.getSelectedTechnicians = function() {
        return ctrl.selectedTechnicians;
    };

    service.getSelectedTechniciansIds = function() {
        const technicians = service.getSelectedTechnicians()
        return {
            tech_writer_id : technicians.writer != null ? technicians.writer.id:null,
            tech_reader_id : technicians.reader != null ? technicians.reader.id:null,
            tech_editor_id : technicians.editor != null ? technicians.editor.id:null
        }
    };

    const selectTech2display = function (techsById) {
        let request = ctrl.getSelectedRequests(ctrl.requests)[0];
        request.ownFarmerbookings.forEach(
            function (farmer) {
                if (techsById[farmer.tech_reader_id]) {
                    ctrl.selectedTechnicians.reader = techsById[farmer.tech_reader_id]
                }
                if (techsById[farmer.tech_writer_id]) {
                    ctrl.selectedTechnicians.writer = techsById[farmer.tech_writer_id]
                }
                if (techsById[farmer.tech_editor_id]) {
                    ctrl.selectedTechnicians.editor = techsById[farmer.tech_editor_id]
                }
            }
        )     
    }

    ctrl.setSelectedTechnicians = function(technician, isWriter) {
        service.setSelectedTechnicians(technician, isWriter);
    }
     ctrl.isSendingNotifAvailable = function () {
         if (!checkingTech 
                && ctrl.isFarmersAndTechnicianSelected() 
                && ctrl.getSelectedRequests(ctrl.requests).length > 0) {
            return false
         }
         return true
     } 


    /**
     * Modif ici pour notifier les techreader et techwriter
     * 
     * réécrire entiérement et déplacer dans VRequests
     */

    ctrl.sendBookings = function (requests) {
        // A réécrire entièrement
        // lister les séances par tech
        // puis associer les requetes ayant les mêmes techs
        // si tech est sur une seule requete on isole
        // notifier les techs 
        console.log('send bookings')
    }

    ctrl.sendBooking2Tech = function (selectedRequests) {
        const technicians = service.getSelectedTechniciansIds()
        const requests = []
        const data2send = {requests: {}, farmers: {}}
        // selectedFarmerbookings = []
        const farmers = {}
        selectedRequests.forEach(function (request) {
          data2send.requests[request.id] = request.product_id
          found = $filter('filter')(request.ownFarmerbookings,{'selected':true})
          found.forEach(function (aFarmer) {
            farmers[aFarmer.id] = aFarmer
          })
          requests.push(request)
        })
        const selectedFarmerbookings = Object.values(farmers)
        let sameTechs = true
        let lastWriterId = null
        let lastReaderId = null
        selectedFarmerbookings.forEach(function (farmer) {
            if (lastWriterId && farmer.tech_writer_id && lastWriterId != farmer.tech_writer_id) {
                sameTechs = false
            }
            lastWriterId = farmer.tech_writer_id
            if (lastReaderId &&  farmer.tech_reader_id && lastReaderId != farmer.tech_reader_id) {
                sameTechs = false
            }
            lastReaderId = farmer.tech_reader_id   

            data2send.farmers[farmer.id] = {
                tech_reader_id : technicians.tech_reader_id,
                tech_writer_id : technicians.tech_writer_id,
                tech_editor_id : technicians.tech_editor_id
            }
        }) 
        if (!sameTechs) {
            ctrl.setAlertMessage({message: $rootScope._T["gv4ufs3c"], isError:true })
        } else {
            ApiRest.post('/vrequests/save/notifications', null, data2send, 
              function(response) {
                if (response.error) {
                    // ctrl.setAlertMessage({message:  'Get the message in the console and contact the IT - error while saving notification  ' + response.error.message, isError:true });
                }
                sendStandardNotif(new NotificationService(), requests, "technicien", $rootScope._T["kxq3ttb9"] , $rootScope._T["rd1jt7ph"], $filter, "planification", $rootScope);
                ctrl.setAlertMessage({message: $rootScope._T["v555dcia"], isError:false });
                selectedRequests.forEach(function (request) {
                    newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["tkw8vvlv"] + " " + service.getTechnicianFullname(service.getSelectedTechnicians().writer));
                    request.ownFarmerbookings.forEach(function (farmer) {
                        if (farmers[farmer.id]) {
                            farmer.is_selected = 1
                            farmer.date_send_tech = todaySQL
                            farmer.tech_writer_id = data2send.farmers[farmer.id].tech_writer_id
                            farmer.tech_reader_id = data2send.farmers[farmer.id].tech_reader_id
                            farmer.tech_editor_id = data2send.farmers[farmer.id].tech_editor_id
                            farmer.tech_writer_user = getTechnicianName(data2send.farmers[farmer.id].tech_writer_id)
                        }
    
                    })
                })
                $scope.$emit("seancesSend", { content: true })
              }, function(error){
                ctrl.setAlertMessage({message: $rootScope._T["633k7su5"], isError:true });
                service.setErrorLoading(true);
              }) 
        }
    }



    ctrl.isFarmersAndTechnicianSelected = function() {
        return service.getSelectedTechniciansIds().tech_writer_id && service.isFarmerSelected()
    };

    function init() {
        service.resetTech()
        const techsById = {}
        Object.keys($rootScope.lanternTechniciansById).forEach((techId) => {
            const data = {
                firstname: $rootScope.lanternTechniciansById[techId].firstname,
                lastname: $rootScope.lanternTechniciansById[techId].lastname,
                fullname: $rootScope.lanternTechniciansById[techId].firstname + ' ' + $rootScope.lanternTechniciansById[techId].lastname,
                id: techId
            }
            if (dubPlace) {
                if (dubPlace.id == $rootScope.lanternTechniciansById[techId].main_location) {
                    ctrl.allTechs.push(data)
                    techsById[techId] = data
                }
            } else {
                ctrl.allTechs.push(data)
                techsById[techId] = data
            }
        })
        selectTech2display(techsById)
    }
    init();
}


Lantern.component('selectTechRequestPopup', {
    templateUrl: 'components/selectTechRequestPopup.html',
    controller: SelectTechRequestPopup,
    bindings: {
        requests: '<',
        setAlertMessage: '&',
        getSelectedRequests: '&'
    }
});
