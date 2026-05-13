/**
 *  Le planning n'a aucun contrôle
 * 
 *  contrôles pour la prod
 *  La planification étendue n'est pas possible le week-end et les jours fériés
 *  Si un des jours est le samedi ou le dimanche
 *      signale que la planification étendue n'est pas possible et qu'ils doivent modifier les jours proposés
 * 
 * 
 */
Lantern.controller('requestDatesCtrl',
['$rootScope', '$filter', '$scope',  'Session',  'HelperService','FarmerService', 
    'PaoService', 'ValueListService', 'NotificationService', 'WorkflowHelperService', 'Comment',
function($rootScope, $filter, $scope,   Session, HelperService, FarmerService, 
    PaoService, ValueListService, NotificationService, WorkflowHelperService, Comment) {

    $scope.errorMessageFlag = false
    $scope.errorMessage = null
    let downloadingBookings = false
    $scope.roleAllAllowed = 5  // pour les tests, ça evite de changer à n endroits  
    $scope.options = {
        'startingDay': 1,
        'initDate': new Date()
    }

    $scope.canDisplay = $rootScope.canDisplay
    // allowing scheduling or not
    $scope.scheduling = false
    $scope.extendedSchedulingAllowed = false
    // la prod ne peut planifier qu'un certain nombres de semaines après la semaine courante
    $scope.tooShortTimeafterCurrentDate = false
    // la planification étendue est toujours autorisée pour le planning
    if ($rootScope.canDisplay($scope.roleAllAllowed)) {
        $scope.extendedSchedulingAllowed = true
    }

    const store_holydays = JSON.parse(localStorage.getItem('holydays'))
    $scope.requests = $scope.ngDialogData.allRequests
    $scope.selectedDates = []
    // tout ce qui est en cours de réservation
    $scope.bookingsByDay = {}
    $scope.stageList = $scope.ngDialogData.allowedStageList
    $scope.stageListBase = $scope.stageList
    $scope.techniciansList = $scope.ngDialogData.allowedTechniciansList
    $scope.globalOccupationByDay
    const weeksSearched = {}
    const newDates = {}
    $scope.comments = $scope.ngDialogData.comments
    $scope.firstRequest = $scope.ngDialogData.allRequests[0]
    $scope.workflowHumanDisplay = WorkflowHelperService.describeWorkflow($scope.firstRequest.workflow)

    $scope.actionType = $scope.ngDialogData.actionType
    $scope.etape_type_id = $scope.ngDialogData.actionType.etape_type_id
    $scope.nbProducts = $scope.ngDialogData.products.length
    $scope.exploitation = $scope.ngDialogData.workflows[0].exploitation_id
    $scope.dubbing_type = $scope.ngDialogData.workflows[0].doublage_type_id
    $scope.subproject_nature_id = $scope.ngDialogData.products[0].subproject.nature_id
    $scope.project_type_id = $scope.ngDialogData.products[0].subproject.project.type_id
    $scope.project_id = $scope.ngDialogData.products[0].subproject.project_id
    $scope.duration = $scope.ngDialogData.products[0].duration
    $scope.number_reel = $scope.ngDialogData.products[0].number_reel
    $scope.format_mix_id = ValueListService.getformatMixBitValue($scope.ngDialogData.workflows[0].format_mix_id)
    $scope.dubbing_step = $scope.ngDialogData.dubbingStep
    $scope.productsIdList = []
    const isProductDataMissing = PaoService.isMissingData($scope.dubbing_step, $scope.exploitation, $scope.duration, $scope.number_reel)
    if (isProductDataMissing[0]) {
        // HelperService.setPopupMessage($scope, 'il serait bien de renseigner la durée du produit concerné' , 8000)
    }
    if (isProductDataMissing[1]) {
        // HelperService.setPopupMessage($scope, 'il serait bien de renseigner le nombre de bobines pour le produit concerné' , 8000)
    }    
    $scope.ngDialogData.products.forEach((product) => {
        $scope.productsIdList.push(product.id)
    })

    // hash des salles trouvées par id
    const currentRoomsById = {}
    $scope.stageList.forEach((room) => {
        currentRoomsById[room.id] = room
    })    
    const currentTechsById = {}
    $scope.techniciansList.forEach((tech) => {
        currentTechsById[tech.id] = tech
    })

    $scope.globalChoicePossible = false
    $scope.currentGlobalTechs = []
    $scope.managerReferent = 0
    $scope.plannings = {}
    // le user doit être le même ou le réferent du sousprojet
    $scope.userDifferent = false

    // stocke au fur et à mesure de réception des données de réservation
    // les salles libres pour une tranche donnée
    // quand ajoute une tranche particulière, ajoute la liste des salles libres
    // cette liste est affichée ensuite dans le select correspondant, uniquement les salles libres
    $scope.occupationByRooms = {}
    $scope.occupationByTechs = {}

    $scope.currentWeekNumber = 0

    // a date deleted from calendar change sattus is_wish in database, id is_wish was different from null
    const deletedDatesFromCalendar = {}

    // editor is displayed for ffs germany only and for step rec and mix, so 
    $scope.canDisplayEditor = false
    $rootScope.etapesActionsBase[1].forEach((element) => {
        if ($rootScope.user_entity.person.branch_id == 2 && $scope.etape_type_id == element.etape.id && (element.etape.name == 'enregistrement' || element.etape.name == 'mixage' )) {
            $scope.canDisplayEditor = true
        }
        if (element.id == $scope.ngDialogData.action_id) {
            if (element.extended_scheduling == 1) {
                $scope.extendedSchedulingAllowed = true
                $scope.scheduling = true
            } else {
                if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                    $scope.extendedSchedulingAllowed = false
                    $scope.scheduling = false
                }
            }
        }
    })
    const originalRoomsOccupation = {}
    // doit vérifier sur les dates envoyées si la planification étendue est autorisée
    // Si une date pose problème, on ne gère pas du tout
    $scope.ngDialogData.original_dates.forEach((entry) => {
        const diffBetweenWeeks = HelperService.weeksBetween(new Date(), new Date(entry.day))
        if (diffBetweenWeeks  < $rootScope.bookingConditions.nb_weeks) {
            if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                $scope.extendedSchedulingAllowed = false
                $scope.tooShortTimeafterCurrentDate = true
                $scope.scheduling = false
            }
        }
        const day = entry.day
        store_holydays.forEach((holiday) => {
            if (holiday === HelperService.formatInternalDate(day)) {
                if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                    $scope.extendedSchedulingAllowed = false
                    HelperService.setPopupMessage($scope, 'Planification non autorisée les jours fériés' , 5000)
                    $scope.cantScheduleAtAll = true
                }
            }
        })
        if (new Date(day).getDay() == 0 || new Date(day).getDay() == 6) {
            if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                $scope.extendedSchedulingAllowed = false
                HelperService.setPopupMessage($scope, 'Planification non autorisée les weekend' , 5000)
                $scope.cantScheduleAtAll = true
            }
        }        
    })

    $scope.action_id = $scope.ngDialogData.action_id

    $scope.idBooking = 0
    $scope.isShowDatesDetails = true
    $scope.getDay = HelperService.getDay()
    $scope.getMonth = HelperService.getMonth()
    $scope.getMonthShortName = HelperService.getMonthShortName()
    $scope.getYear = HelperService.getYear()
    $scope.fullDateDisplay = HelperService.fullDateDisplay()
    $scope.i18nHourDisplay = HelperService.i18nHourDisplay()

    $scope.selectedGlobalTime = { start: null, end: null }
    $scope.selectedGlobal = { stage: null, writer: null, reader: null, editor: null }
    
    // vérification globale des salles
    $scope.currentGlobalData = { rooms: null }

    $scope.checkedRoomsByDayAndSlot = {}

    $scope.currentRoomsByDayAndSlot = {}
    $scope.currentTechsByDayAndSlot = {}

    // Liste des salles occupées globalement sur n jours
    $scope.occupiedRooms = {}
    
    $scope.presetArraySelected = []

    // copie originale pour permettre un reset par l'utilisateur
    $scope.dateStartEndOriginal = $scope.ngDialogData.original_dates // JSON.parse($scope.dateStartEnd)    

    // Données internes
    // réservations des salles et tech dans la page
    // utilisé pour vérifier qu'une salle n'est pas utilisée deux fois au même moment
    // nettoyé à chaque reset ou retrait de tranche horaire
    $scope.InternalDateStartEndAuditObject = {}  // index unique des entrées par day + start + end + audit

    // tableau des entrées, la base est le datetime_start qui contient un datetime et pas seulement le jour
    // si les heures sont cohérentes affiche les selecttimeslots possibles
    // une même demande peut avoir n tranches horaires identiques dans une journée

    // données du serveur
    $scope.dateStartEndAuditObject = {}  // index unique des entrées par day + start + end + audit
    // construction du tableau
    $scope.dateStartEndObject = {}  // faciliter la mise à jour des entrées
    $scope.dateStartEnd = JSON.parse(JSON.stringify($scope.dateStartEndOriginal))

    let globalTimeSlotId = 0

    const getDatasForADay = function (days) {
        downloadingBookings = true   
        const roomsParameters =  {
            subproject_id: $scope.ngDialogData.products[0].subproject_id,
            project_id: $scope.ngDialogData.products[0].subproject.project_id, 
            action_id: $scope.ngDialogData.action_id, 
            dubbing_step: $scope.ngDialogData.dubbingStep, 
            doublage_type_id: $scope.ngDialogData.workflows[0].doublage_type_id, 
            exploitation_id: $scope.ngDialogData.workflows[0].exploitation_id, 
            format_mix_id: ValueListService.getformatMixBitValue($scope.ngDialogData.workflows[0].format_mix_id),
            project_type_id: $scope.ngDialogData.products[0].subproject.project.type_id,
            dates: days
          }
        FarmerService.getRoomsAvailability(roomsParameters,gotRoomsAvailability, function () {})
    }

    const gotRoomsAvailability = function (result) {
        if (result[0]) {
            if (result[2]) {
                $scope.managerReferent = result[2].user_id
            }
            $scope.plannings = result[3]

            // ajouter par qui la réservation a été créée, vu que pour les chargés de prod, ils ne peuvent modifier que si la séance a été créée par le chargé de prod ou un un chargé de prod du projet
            const byExternalBookingId = {}
            Object.keys(result[0]).forEach((bookingId) => {
                byExternalBookingId[result[0][bookingId].booking.external_booking_id] = result[0][bookingId].booking
                const day = HelperService.formatInternalDate(result[0][bookingId].booking.start)
                if (result[0][bookingId].booking.status != 'cancelled') {
                    if (!$scope.bookingsByDay[day]) {
                        $scope.bookingsByDay[day] = []
                    }
                    $scope.bookingsByDay[day].push(result[0][bookingId])
                }
            })
            Object.keys($scope.bookingsByDay).forEach((day) =>{
                $scope.bookingsByDay[day].forEach((booking) => {
                    if (currentRoomsById[booking.booking.object_id]) {
                        if (!$scope.occupationByRooms[booking.booking.object_id]) {
                            $scope.occupationByRooms[booking.booking.object_id] = []
                        }
                        $scope.occupationByRooms[booking.booking.object_id].push([day + ' 00:00:00', booking.booking.start, booking.booking.end])                   
                    }
                    if (booking.persons.writer && currentTechsById[booking.persons.writer]) {
                        if (!$scope.occupationByTechs[booking.persons.writer]) {
                            $scope.occupationByTechs[booking.persons.writer] = []
                        }
                        $scope.occupationByTechs[booking.persons.writer].push([day + ' 00:00:00', booking.booking.start, booking.booking.end])
                    }
                    if (booking.persons.reader && currentTechsById[booking.persons.reader]) {
                        if (!$scope.occupationByTechs[booking.persons.reader]) {
                            $scope.occupationByTechs[booking.persons.reader] = []
                        }
                        $scope.occupationByTechs[booking.persons.reader].push([day + ' 00:00:00', booking.booking.start, booking.booking.end])
                    }
                    if (booking.persons.editor && currentTechsById[booking.persons.editor]) {
                        if (!$scope.occupationByTechs[booking.persons.editor]) {
                            $scope.occupationByTechs[booking.persons.editor] = []
                        }
                        $scope.occupationByTechs[booking.persons.editor].push([day + ' 00:00:00', booking.booking.start, booking.booking.end])
                    }   
                }) 
            })
            $scope.dateStartEndOriginal.forEach((entry) => {
                if (byExternalBookingId[entry.booking_id]) {
                    entry.created_by = byExternalBookingId[entry.booking_id].created_by
                    if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                        if (entry.created_by == 0) {
                            $scope.userDifferent = true
                        } else if ($scope.plannings[entry.created_by]) {
                            $scope.userDifferent = true
                        } else if (entry.created_by != Session.userId() && $scope.managerReferent != Session.userId()) {
                            $scope.userDifferent = true
                        }
                    }
                }
            })
            $scope.dateStartEnd.forEach((entry) => {
                if (byExternalBookingId[entry.booking_id]) {
                    entry.created_by = byExternalBookingId[entry.booking_id].created_by
                    if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                        if (entry.created_by == 0) {
                            $scope.userDifferent = true
                        } else if ($scope.plannings[entry.created_by]) {
                            $scope.userDifferent = true
                        } else if (entry.created_by != Session.userId() && $scope.managerReferent != Session.userId()) {
                            $scope.userDifferent = true
                        }
                    }
                }
            })        
            if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.userDifferent) {
                $scope.extendedSchedulingAllowed = false
            }
        }
        downloadingBookings = false
    }    


    // revient aux dates d'origines
    // utilisé au démarrage et pour une demande de reset
    // firstdate dans le calendrier       $scope.options.initDate = 
    $scope.slotsReference = {}
    $scope.slotsReferenceByWeek = {}
    $scope.handleResetDates = function () {
        $scope.presetArraySelected = []
        $scope.slotsReference = {}
        $scope.slotsReferenceByWeek = {}
        let firstDate = null
        $scope.dateStartEnd = JSON.parse(JSON.stringify($scope.dateStartEndOriginal))
        $scope.dateStartEndObject = {} 
        // n demandes le même jour
        const days = {}
        $scope.dateStartEnd.forEach((entry) => {
            if (!firstDate && entry.is_wish != 0) {
                firstDate = entry.day
                $scope.options.initDate = new Date(entry.day)
            }
            entry.weekNumber = moment(entry.day).startOf('isoWeek').format("w")

            if (!days[entry.day]) {
                days[entry.day] = 0
            }
            days[entry.day]++
            entry.inDay = days[entry.day]
            entry.timestamp = parseInt(moment(entry.day).format('x'))
            const fullKey = entry.day + entry.start_time + entry.end_time + entry.audit
            $scope.dateStartEndObject[entry.id] = entry
            $scope.dateStartEndAuditObject[fullKey] = entry
            let timestamp = moment(entry.day).format('x')
            $scope.selectedDates.push(parseInt(timestamp))
            let datetime = moment(entry.day).format("YYYY-MM-DD HH:mm:ss")
            newDates[datetime] = true        
            const end  = HelperService.fromHourToMinutes(entry.end_time)
            const start = HelperService.fromHourToMinutes(entry.start_time)
            const newSlot = {
                name: entry.start_time + ' ' +  entry.end_time,
                position: start,
                preset: entry.start_time + ' ' +  entry.end_time,
                end: entry.end_time,
                start: entry.start_time,
                endDayTime: end,
                startDayTime: start,
                weekNumber: entry.weekNumber,
                inDay: days[entry.day]
            }
            if (!$scope.currentWeekNumber) {
                $scope.currentWeekNumber = entry.weekNumber
                $scope.presetArraySelected.push(newSlot)
            }
            newSlot.timestamp = moment(entry.day).format('x')
            const slotKey = entry.start_time + ' ' +  entry.end_time + ' ' + entry.weekNumber

            if (!$scope.slotsReference[slotKey]) {
                $scope.slotsReference[slotKey] = {}
            }
            if (!$scope.slotsReferenceByWeek[entry.weekNumber]) {
                $scope.slotsReferenceByWeek[entry.weekNumber] = {}
            }
            if (!$scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]]) {
                $scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]] = {}
            }
            $scope.slotsReference[slotKey][days[entry.day]] = newSlot
            $scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]][slotKey] = newSlot
            
            if (entry.audit) {
                entry.room = $rootScope.allRoomsById[$rootScope.allRoomsByName[entry.audit]]
            } else {
                entry.room = null
            }
            
            entry.writer = null
            const startDate = HelperService.buildDateTime(datetime,  entry.start_time)
            const endDate = HelperService.buildDateTime(datetime,  entry.end_time)
            const datetimeSlot = startDate + '-' + endDate
            if (!originalRoomsOccupation[datetimeSlot]) {
                originalRoomsOccupation[datetimeSlot] = {}
            }
            if (entry.audit) {
                originalRoomsOccupation[datetimeSlot][entry.room.id] = true
            }
            // et si le tech est freelance avec un user chargé de prod, le freelance n'apparait pas
            if (entry.tech_writer_id) {
                const techId = entry.tech_writer_id
                // contrôle, mais cas qui ne devrait pas arriver, parce que certains techniciens deviennent planning
                // la liste $rootScope.allTechnicians contient donc aussi les rôles planning
                if ($rootScope.allTechnicians[techId]) {
                    const data = {
                        fullname: $rootScope.allTechnicians[techId].firstname + ' ' + $rootScope.allTechnicians[techId].lastname,
                        firstname: $rootScope.allTechnicians[techId].firstname,
                        lastname:  $rootScope.allTechnicians[techId].lastname,
                        used: ' ',
                        id: techId,
                        priority: 0
                    }       
                    entry.writer = data
                }
            }
            entry.reader = null
            if (entry.tech_reader_id) {
                const readerId = entry.tech_reader_id
                if ($rootScope.allTechnicians[readerId]) {
                    const readerData = {
                        fullname: $rootScope.allTechnicians[readerId].firstname + ' ' + $rootScope.allTechnicians[readerId].lastname,
                        firstname: $rootScope.allTechnicians[readerId].firstname,
                        lastname:  $rootScope.allTechnicians[readerId].lastname,
                        used: ' ',
                        id: readerId,
                        priority: 0
                    }        
                    entry.reader = readerData
                }
            }
            entry.editor = null
            if (entry.tech_editor_id) {
                const editorId = entry.tech_editor_id
                if ($rootScope.allTechnicians[editorId]) {
                    const editorData = {
                        fullname: $rootScope.allTechnicians[editorId].firstname + ' ' + $rootScope.allTechnicians[editorId].lastname,
                        firstname: $rootScope.allTechnicians[editorId].firstname,
                        lastname:  $rootScope.allTechnicians[editorId].lastname,
                        used: ' ',
                        id: editorId,
                        priority: 0
                    }        
                    entry.editor = editorData
                }
            }
        })
        
        
    }

    $scope.handleResetDates()
    gotRoomsAvailability($scope.ngDialogData.bookings)

    $scope.buildSlotsReference = function () {
        const transformator = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
        const days = {}
        $scope.slotsReference = {}
        $scope.slotsReferenceByWeek = {}
        $scope.dateStartEnd.forEach((entry) => {
            if (!days[entry.day]) {
                days[entry.day] = 0
            }
            days[entry.day]++
            entry.inDay = days[entry.day]
            entry.weekNumber = moment(entry.day).startOf('isoWeek').format("w")
            const slotKey = entry.start_time + ' ' +  entry.end_time + ' ' + entry.weekNumber
            const end  = HelperService.fromHourToMinutes(entry.end_time)
            const start = HelperService.fromHourToMinutes(entry.start_time)
            const newSlot = {
                name: transformator(entry.start_time) + ' ' +  transformator(entry.end_time),
                position: start,
                preset: entry.start_time + ' ' +  entry.end_time,
                end: entry.end_time,
                start: entry.start_time,
                endDayTime: end,
                startDayTime: start,
                weekNumber: entry.weekNumber,
                inDay: days[entry.day]
            }
            newSlot.timestamp = moment(entry.day).format('x')
            if (!$scope.slotsReference[slotKey]) {
                $scope.slotsReference[slotKey] = {}
            }
            if (!$scope.slotsReferenceByWeek[entry.weekNumber]) {
                $scope.slotsReferenceByWeek[entry.weekNumber] = {}
            }
            if (!$scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]]) {
                $scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]] = {}
            }
            $scope.slotsReference[slotKey][days[entry.day]] = newSlot
            // $scope.slotsReferenceByWeek[entry.weekNumber] = slotKey
            $scope.slotsReferenceByWeek[entry.weekNumber][days[entry.day]][slotKey] = newSlot
        })
    }

    $scope.presetArray = ValueListService.orderPresetTimes($rootScope.presetTimes)


    const dataCoef = {
        subproject_nature_id : $scope.subproject_nature_id,
        nb_products: $scope.nbProducts,
        duration: $scope.duration,
        nb_reels : $scope.number_reel, 
        exploitation: $scope.exploitation , 
        dubbing_type : $scope.dubbing_type, 
        project_type : $scope.project_type_id,
        format_mix: $scope.format_mix_id
    }

    $scope.messageDurationMaxAllowed = ''
    $scope.selectedCoefficient = null
    $scope.currentUsedTime = null
    $scope.outsideTotalTimeUsed = 0  // temps utilisé pour des requêtes non gérées à ce moment
    $scope.insideTotalTimeUsed = 0 // temps global pour cette demande, recalculé en fonction des demandes
    $scope.totalTimeUsed = 0
    // il faut distinguer ce qui est dans la requête et ce qui ne l'est pas
    const gotUsedTime = function (results) {
        $scope.totalTimeUsed = 0
        $scope.currentUsedTime = results
        // see getUsedTimeForProducts in public\central-api\services\VRequestsService.php
        Object.keys(results).forEach((fullkey) => {
            const entry = results[fullkey]
            if (entry.start_time) {
                // si le travail a été fait, il faut prendre en compte ce temps avec working_time_start
                const currentStartMinutes = HelperService.fromHourToMinutes(entry.start_time.replace('h',':'))
                const currentEndMinutes = HelperService.fromHourToMinutes(entry.end_time.replace('h',':'))
                if ($scope.dateStartEndAuditObject[fullkey]) {
                    if (entry.working_time_start && entry.working_time_end) {
                        const duration = moment.duration(moment(entry.working_time_end).diff(moment(entry.working_time_start))).asMinutes()
                        $scope.insideTotalTimeUsed += duration
                    } else {
                        $scope.insideTotalTimeUsed += (currentEndMinutes - currentStartMinutes)
                    }
                } else {
                    if (entry.working_time_start && entry.working_time_end) {
                        const duration = moment.duration(moment(entry.working_time_end).diff(moment(entry.working_time_start))).asMinutes()
                        $scope.outsideTotalTimeUsed += duration
                    } else {
                        $scope.outsideTotalTimeUsed += (currentEndMinutes - currentStartMinutes)
                    }
                }
            }
        })
        // computeRemainingTime(0)
    }

    
    
    // A partir des heures possibles renvoyées, peut calculer et informer l'utilisateur
    // s'il a dépassé ou non les quotas et combien d'heures il peut ajouter
    const gotCoefficients = function (response) {
        $scope.selectedCoefficient = response[0]
        // cherche pour les produits indiqués le nombre d'heures déjà utilisées
        // $scope.productsIdList
        const parameters = {
            products: $scope.productsIdList,
            dubbing_type: $scope.dubbing_type,
            etape_type: $scope.etape_type_id
        }
        PaoService.getUsedTime(parameters, gotUsedTime)
    }

    // uniquement pour la synchro et le mixage
    // start downloading
    PaoService.getRoomCoefficients($scope.dubbing_step, dataCoef , gotCoefficients)

    $scope.hasDateToUpdate = function () {
        if ($scope.dateStartEndOriginal.length > 0) {
            return true
        }
        return false
    }

    // gere uniquement la liste par entrée individuelle
    $scope.stagesIndividualList = function (date) {
        let allRooms = []
        if (date.start_time) {
            const key = HelperService.formatInternalDate(date.day) + '-' + date.start_time + '-' + date.end_time
            if ($scope.checkedRoomsByDayAndSlot[key]) {
                if (!$scope.currentRoomsByDayAndSlot[key] || Object.keys($scope.currentRoomsByDayAndSlot[key]).length == 0) {
                    allRooms = $scope.stageList
                } else {
                    $scope.stageList.forEach((room) => {
                        if (!$scope.currentRoomsByDayAndSlot[key][room.id]) {
                            allRooms.push(room)
                        }
                    })
                }
                date.disabled = false
                return allRooms
            } else {
                allRooms = $scope.stageList
                date.disabled = true
                return allRooms
            }
        } else {
            allRooms = $scope.stageList
            date.disabled = true
            return allRooms
        }
    }

    // liste des salles dispo sur un ensemble de jours
    $scope.globalStagesList = function () {
        return $scope.stageList.filter((stage) => {
            if (!$scope.occupiedRooms[stage.id])  return stage    
        })
    }

    // liste des techniciens, remise à jour en fonction de leur occupation
    // mise à jour globale, vérifie tous les jours concernés
    // remodifié quand une tranche horaire est définie
    $scope.getTechnicians = function () {
        let techs = []
        if ($scope.currentGlobalTechs.length > 0) {
            techs = $scope.currentGlobalTechs
        }
        return techs
    }

    $scope.getEditors = function () {
        let techs = []
        if ($scope.currentGlobalTechs.length > 0) {
            $scope.currentGlobalTechs.forEach((tech) => {
                if ($rootScope.allEditors[tech.id] && parseInt($rootScope.allEditors[tech.id].dubbing_step) & 4) {
                    techs.push(tech)
                }
            })
        }
        return techs
    }

    $scope.getIndividualTechnicians = function (date) {
        let techs = []
        if (date.start_time) {
            const key = HelperService.formatInternalDate(date.day) + '-' + date.start_time + '-' + date.end_time
            if ($scope.checkedRoomsByDayAndSlot[key]) {
                if (!$scope.currentTechsByDayAndSlot[key] || Object.keys($scope.currentTechsByDayAndSlot[key]).length == 0) {
                    techs = $scope.techniciansList
                } else {
                    $scope.techniciansList.forEach((tech) => {
                        if (!$scope.currentTechsByDayAndSlot[key][tech.id]) {
                            techs.push(tech)
                        }
                    })
                }   
                date.disabled = false
                return techs
            } else {
                techs = $scope.techniciansList
                date.disabled = true
                return techs
            }
        } else {
            techs = $scope.techniciansList
            date.disabled = true
        }
        return techs
    }
    

    $scope.getIndividualEditors = function (date) {
        let techs = []
        if (date.start_time) {
            const key = HelperService.formatInternalDate(date.day) + '-' + date.start_time + '-' + date.end_time
            if ($scope.checkedRoomsByDayAndSlot[key]) {
                if (!$scope.currentTechsByDayAndSlot[key] || Object.keys($scope.currentTechsByDayAndSlot[key]).length == 0) {
                    $rootScope.listEditors.forEach((tech) => {
                        if ($rootScope.allEditors[tech.id] && $rootScope.allEditors[tech.id].dubbing_step & 4) {
                            techs.push(tech)
                        }
                    })
                } else {
                    $rootScope.listEditors.forEach((tech) => {
                        if (!$scope.currentTechsByDayAndSlot[key][tech.id]) {
                            if ($rootScope.allEditors[tech.id] && $rootScope.allEditors[tech.id].dubbing_step & 4) {
                                techs.push(tech)
                            }
                        }
                    })
                }   
                date.disabled = false
                return techs
            } else {
                techs = $rootScope.listEditors
                date.disabled = true
                return techs
            }
        } else {
            $rootScope.listEditors.forEach((tech) => {
                if ($rootScope.allEditors[tech.id] && $rootScope.allEditors[tech.id].dubbing_step & 4) {
                    techs.push(tech)
                }
            })
            date.disabled = true
        }
        return techs
    }







    // les heures individuelles ne sont pas modifiables par la prod
    $scope.canUpdateTime = function () {
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed) {
            return true
        }        
        return false
    }

    // ne peut choisir une salle que si les horaires ont été définis et vérifiés
    $scope.canUpdateIndividualAudit = function (date) {
        if (downloadingBookings) {
            return true
        }        
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed && $scope.dateStartEnd.length > 1) {
            // pas de selection individuelle pour la prod quand il y a plusiers entrées
            return true
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            // pas de selection individuelle pour la prod quand la planification étendue n'est pas autorisée
            return true
        }        
        if (date.start_time) {
            const individualKey = HelperService.formatInternalDate(date.day) + '-' + date.start_time + '-' + date.end_time
            if ($scope.checkedRoomsByDayAndSlot[individualKey]) {
                return  false
            } else {
                return true
            }
            
        } else {
            return true
        }
    }

    // ne peut choisir un tech que si les horaires ont été définis et vérifiés
    $scope.canUpdateTech = function (date) {
        if (downloadingBookings) {
            return true
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed && $scope.dateStartEnd.length > 1) {
            // pas de selection individuelle pour la prod quand il y a plusiers entrées
            return true
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            // pas de selection individuelle pour la prod quand la planification étendue n'est pas autorisée
            return true
        }  
        if (date.start_time) {
            const individualKey = HelperService.formatInternalDate(date.day) + '-' + date.start_time + '-' + date.end_time            
            if ($scope.checkedRoomsByDayAndSlot[individualKey]) {
                return  false
            } else {
                return true
            }
            
        } else {
            return true
        }
    }

    // toutes dates
    // ne peut modifier que si une tranche horaire a été choisie
    $scope.canUpdateGlobalStage = function () {
        if (downloadingBookings) {
            return true
        }        
        // aucun acces global pour la prod si la planification étendue n'est pas autorisée
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed) {
            return true
        }
        if (!$scope.currentGlobalTimeSlot) {
            return true
        } else {
            if ($scope.currentGlobalData.rooms.length > 0) {
                return false
            }
        }
      
        return false
    }

    // ne peut modifier que si une tranche horaire a été choisie
    $scope.canUpdateGlobalTech = function () {
        if (downloadingBookings) {
            return true
        }        
        // la prod ne peut pas gérer de tech  si la planification étendue n'est pas autorisée
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed) {
            return true
        }         
        if (!$scope.currentGlobalTimeSlot) {
            return true
        } else {
            if ($scope.currentGlobalTechs.length > 0) {
                return false
            }  
        }
        
        return false
    }
    
    $scope.canUpdateGlobalTime = function () {
        if (downloadingBookings) {
            return true
        }        
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed) {
            return true
        }
        return false
    }

    // recalcule le temps géré en interne sur la totalité des demandes
    // ajoute au temps déjà utilisé hors demande courante
    // ce qui permet de savoir si le temps limite accordé est dépassé ou pas
    const computeInsideTotalTimeFromListOfEntries = function () {
        $scope.insideTotalTimeUsed = 0
        $scope.dateStartEnd.forEach((entry) => {
            const diff = entry.endDayTime - entry.startDayTime
            $scope.insideTotalTimeUsed += diff
        })
        // computeRemainingTime(0)
    }

    const computeRemainingTime = function (added) {
        // pas de coefficient, pas de message du tout et pas de réservation avancées
        if ($scope.selectedCoefficient) {
            const totalBase = $scope.outsideTotalTimeUsed + $scope.insideTotalTimeUsed
            const totalTimeUsed = totalBase + added
            if ($scope.selectedCoefficient.duration_max >= totalTimeUsed) {
                const remainingTime = parseInt((($scope.selectedCoefficient.duration_max - totalTimeUsed)  / 60))
                if (!$scope.roleAllAllowed) {
                    $scope.messageDurationMaxAllowed = 'Temps libre restant:  ' + remainingTime + ' heures' + ' (' + $scope.selectedCoefficient.duration_max + ' == '  + totalTimeUsed + ')'
                }
                
            } else {
                if (!$scope.roleAllAllowed) {
                    $scope.messageDurationMaxAllowed = 'Le temps maximum possible pour ce travail a été dépassé ' + ' (' + $scope.selectedCoefficient.duration_max + ' == '  + totalTimeUsed + ')'
                }
            }
        }
    }


    // la prod peut gérer en planification étendue
    // les rec en journée seulement de 9h à 18h pour les studios rec et mixtes rec/mix
    // les mix en journée et soirée, jusqu'à minuit seulement pour les studio mix simple
    // dans les preset soir correspond à E
    const limitTimeSlotChoice = function (timeSlot) {
        // les rec ne peuvent être pris que le jour
        // les mix jour et soir
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed) {
            if ($scope.ngDialogData.dubbingStep & 1) {
                if (timeSlot.preset == 'E') {
                    return false
                } else {
                    return false
                }
            } else if ($scope.ngDialogData.dubbingStep & 2) {
                return true
            } else {
                return false
            }
        } else {
            return true
        }
    }    

    // fin des fonctions de contrôles
    
    $scope.getWeekNumbers = function () {
        const list = {}
        $scope.dateStartEnd.forEach((entry) => {
            list[entry.weekNumber] = true
        })
        return Object.keys(list)
    }
    
    $scope.handleWeekNumber = function (WeekNumber) {

        $scope.currentTimeSlotIndex = null
        $scope.selectedGlobal.stage = null
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null
        $scope.dateStartEnd.forEach((entry) => {
            entry.highlighted = ''
        })
        $scope.currentWeekNumber = WeekNumber
        $scope.presetArraySelected = []
        if (WeekNumber) {
            Object.keys($scope.slotsReference).forEach((slotKey) => {
                Object.keys($scope.slotsReference[slotKey]).forEach((key) => {
                    if ($scope.slotsReference[slotKey][key].weekNumber == WeekNumber && $scope.slotsReference[slotKey][key].name != '0 0') {
                        $scope.presetArraySelected.push($scope.slotsReference[slotKey][key])
                    }
                })
            })
        } else {
            // il faut afficher toutes les heures
            Object.keys($scope.slotsReference).forEach((slotKey) => {
                Object.keys($scope.slotsReference[slotKey]).forEach((key) => {
                    if ($scope.slotsReference[slotKey][key].name != '0 0') {
                        $scope.presetArraySelected.push($scope.slotsReference[slotKey][key])
                    }
                })
            })
        }
    }

    // la liste globale des salles affiche seulement les salles disponibles globalement sur toutes les dates et heures sélectionnées
    // si les dates et heures ne sont pas sélectionnées, le truc est disabled pour tous
    // et les heures doivent toutes être identiques
    // vérifie que la salle n'est pas déjà utilisée 
    $scope.handleNewGlobalStage = function (value) {
        if (!value) {
            $scope.dateStartEnd.forEach((entry) => {
                if ($scope.currentGlobalTimeSlot.start == entry.start_time && $scope.currentGlobalTimeSlot.end == entry.end_time) {
                    if ($scope.currentWeekNumber) {
                        if ($scope.currentWeekNumber == entry.weekNumber) {
                            entry.room = null
                        }
                    } else {
                        entry.room = null
                    }
                    
                }
            })
            return
        }

        $scope.InternalDateStartEndAuditObject = {}
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            HelperService.setPopupMessage($scope, 'choix de salle pas autorisé' , 5000)
            return 
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed && value.dubbing_step & 1 && $scope.currentGlobalTimeSlot.preset == 'E') {
            HelperService.setPopupMessage($scope, 'Pas de réservation le soir pour cette salle' , 5000)
            return
        }
        const done = {}
        let overlapFound = false
        $scope.dateStartEnd.forEach((entry) => {
            if (entry.room && entry.room.id == value.id) {
                if (entry.startDayTime && entry.startDayTime < $scope.currentGlobalTimeSlot.endDayTime && $scope.currentGlobalTimeSlot.startDayTime < entry.endDayTime 
                    && $scope.currentWeekNumber == entry.weekNumber) {
                    overlapFound = true
                    HelperService.setPopupMessage($scope, $rootScope._T["pxkkrnx7"] , 5000)
                }
            }
            if (entry.start_time == $scope.currentGlobalTimeSlot.start 
                    && entry.end_time == $scope.currentGlobalTimeSlot.end
                    && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)
                    ) {
                if (!done[entry.day + entry.start_time + entry.end_time]) {
                    const roomKey = entry.day + entry.start_time + entry.end_time + value.id
                    if ($scope.InternalDateStartEndAuditObject[roomKey]) {
                        HelperService.setPopupMessage($scope, $rootScope._T["pxkkrnx7"] , 3000)
                    } else {
                        if (!overlapFound) {
                            entry.room = value
                            entry.audit = currentRoomsById[value.id].name
                            $scope.InternalDateStartEndAuditObject[roomKey] = true
                        }

                    }
                }
                done[entry.day + entry.start_time + entry.end_time] = true
            }
        })
    }

    $scope.handleNewGlobalWriter = function (tech) {
        if (!tech) {
            // si on a deux fois la même tranche, on enlève un seul tech
            $scope.dateStartEnd.forEach((entry) => {
                if ($scope.currentGlobalTimeSlot.start == entry.start_time && $scope.currentGlobalTimeSlot.end == entry.end_time 
                        && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                    entry.writer = null
                }
            })
            return
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            HelperService.setPopupMessage($scope, 'Le choix de tech pas autorisé' , 5000)
            return 
        }           
        $scope.selectedGlobal.writer = tech
        // tech_max_hours
        const dayOccupation = {}
        const done = {}
        let overlapFound = false
        $scope.dateStartEnd.forEach((entry) => {
            if (entry.writer && entry.writer.id == tech.id) {
                if (entry.startDayTime && entry.startDayTime < $scope.currentGlobalTimeSlot.endDayTime && $scope.currentGlobalTimeSlot.startDayTime < entry.endDayTime 
                    && $scope.currentWeekNumber == entry.weekNumber) {
                    overlapFound = true
                    HelperService.setPopupMessage($scope, $rootScope._T["jy66dhf6"] , 5000)
                }
            }            
            if (entry.start_time == $scope.currentGlobalTimeSlot.start 
                && entry.end_time == $scope.currentGlobalTimeSlot.end
                && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                if (!done[entry.day + entry.start_time + entry.end_time]) {
                    if (!overlapFound) {
                        entry.writer = tech
                        done[entry.day + entry.start_time + entry.end_time] = true
                    }
                }
                
            }
            if (entry.start_time && entry.writer && entry.writer.id == tech.id) {
                if (! dayOccupation[entry.day]) {
                    dayOccupation[entry.day] = 0
                }
                dayOccupation[entry.day] += entry.endDayTime - entry.startDayTime
            }
        })
        let techGlobalOverBooking = false
        Object.keys(dayOccupation).forEach((day) => {
            if (dayOccupation[day] > $rootScope.bookingConditions.tech_max_hours) {
                techGlobalOverBooking = true
            }
        })
        if (techGlobalOverBooking) {
            HelperService.setPopupMessage($scope, 'Temps de travail journalier dépassé pour ' + tech.firstname + ' ' + tech.lastname , 7000)
        }
    }

    $scope.handleNewGlobalReader = function (tech) {
        if (!tech) {
            $scope.dateStartEnd.forEach((entry) => {
                if ($scope.currentGlobalTimeSlot.start == entry.start_time && $scope.currentGlobalTimeSlot.end == entry.end_time 
                    && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                    entry.reader = null
                }
            })         
            return
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            HelperService.setPopupMessage($scope, 'choix de tech pas autorisé' , 5000)
            return 
        }         
        $scope.selectedGlobal.reader = tech
        const done = {}
        $scope.dateStartEnd.forEach((entry) => {
            if (entry.start_time == $scope.currentGlobalTimeSlot.start 
                && entry.end_time == $scope.currentGlobalTimeSlot.end
                && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                if (!done[entry.day + entry.start_time + entry.end_time]) {
                    entry.reader = tech
                }
                done[entry.day + entry.start_time + entry.end_time] = true
            }
        })
    }

    $scope.handleNewGlobalEditor = function (tech) {
        if (!tech) {
            $scope.dateStartEnd.forEach((entry) => {
                if ($scope.currentGlobalTimeSlot.start == entry.start_time && $scope.currentGlobalTimeSlot.end == entry.end_time 
                    && entry.presetTimeId == $scope.currentGlobalTimeSlot.presetTimeId 
                    && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                    entry.editor = null
                }
            })         
            return
        }
        if (!$rootScope.canDisplay($scope.roleAllAllowed) && !$scope.extendedSchedulingAllowed && $scope.userDifferent) {
            HelperService.setPopupMessage($scope, 'choix de tech pas autorisé' , 5000)
            return 
        }         
        $scope.selectedGlobal.editor = tech
        const done = {}
        $scope.dateStartEnd.forEach((entry) => {
            if (entry.start_time == $scope.currentGlobalTimeSlot.start 
                && entry.end_time == $scope.currentGlobalTimeSlot.end
                && entry.presetTimeId == $scope.currentGlobalPresetTimeId
                && ($scope.currentWeekNumber == entry.weekNumber || $scope.currentWeekNumber == 0)) {
                if (!done[entry.day + entry.start_time + entry.end_time]) {
                    entry.editor = tech
                }
                done[entry.day + entry.start_time + entry.end_time] = true
            }
        })
    }


    // vérifie si le tech ne dépasse pas le nombre d'heure max dans une journée
    // également utilisé pour l'éditor
    $scope.checkWriter = function (tech, date, currentIndex) {
        if (!tech) {
            return
        }
        const day = HelperService.formatInternalDate(date.day)
        let currentDuration = 0
        if ($scope.bookingsByDay[day]) {
            $scope.bookingsByDay[day].forEach((booking) => {
                if ((booking.status != 'cancelled' || booking.status != 'note' ) && booking.persons.writer) {
                    if (tech.id == booking.persons.writer) {
                        currentDuration += HelperService.getDurationInMinutes(booking.booking.start, booking.booking.end)
                    }
                }
            })
        }
        // et ensuite dans les demandes du jour
        $scope.dateStartEnd.forEach((entry, index) => {
            if (currentIndex != index) {
                if (date.day == entry.day) {
                    currentDuration += HelperService.getDurationInMinutes(entry.datetime_start, entry.datetime_end)
                }
            }
           
        })
        currentDuration += date.endDayTime - date.startDayTime
        if (currentDuration > $rootScope.bookingConditions.tech_max_hours) {
            HelperService.setPopupMessage($scope, 'Temps de travail journalier dépassé pour ' + tech.firstname + ' '  + tech.lastname , 7000)
        }
    }   

    const checkHolidays = function (day) {
        let holidaysNotAllowed = false
        store_holydays.forEach((holiday) => {
            if (holiday == day) {
                if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                    holidaysNotAllowed = true
                }

            }
        })
        return holidaysNotAllowed
    }
    const checkWeekEnd = function (day) {
        let notAllowed = false
        if (new Date(day).getDay() == 0 || new Date(day).getDay() == 6) {
            if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                notAllowed = true
            }
        } 
        return notAllowed
    }

    // data for selecting hours, start and end
    $scope.selectHoursArray =  HelperService.buildMinutesArray()

    $scope.changeDay = function(dt) {
        // $scope.presetArraySelected = []
        let datetime = moment(dt).format("YYYY-MM-DD HH:mm:ss")
        const day = moment(dt).format("YYYY-MM-DD")
        deletedDatesFromCalendar[moment(dt).format("YYYY-MM-DD 00:00:00")] = true
        if (checkHolidays(day)) {
            HelperService.setPopupMessage($scope, 'holiday, not allowed' , 5000)
            return
        }
        if (checkWeekEnd(day)) {
            HelperService.setPopupMessage($scope, 'Planification non autorisée les weekend' , 5000)
            return
        }
        if (moment(day).diff( moment(), 'days') < 0 ) {
            HelperService.setPopupMessage($scope, $rootScope._T["2ayor8v2"] , 5000)
            return
        }

        let deleted = false
        if (newDates[datetime]) {
            delete newDates[datetime]
            deleted  = true
            $scope.dateStartEnd.forEach((entry, index) => {
                if (moment(entry.day).format("YYYY-MM-DD") == moment(datetime).format("YYYY-MM-DD")) {
                    $scope.dateStartEnd.splice(index, 1)
                    delete $scope.dateStartEndObject[entry.id]
                }
            })

        } else {
          newDates[datetime] = true
          const data = $scope.addDate(datetime)
          $scope.dateStartEndObject[data.id] = data
          data.timestamp = moment(data.day).format('x')
          const monday = HelperService.formatInternalDate(HelperService.getMonday(day))
          // yearweek is from sunday to saturday
          const nextMonday = moment(monday).add(7, 'days').format("YYYY-MM-DD")
          const days = []
          if (!weeksSearched[monday]) {
              days.push(monday)
              weeksSearched[monday] = true
          }
          if (!weeksSearched[nextMonday]) {
            days.push(nextMonday)
            weeksSearched[nextMonday] = true
          }          
          if (days.length > 0) {
            getDatasForADay(days)
          }
          $scope.dateStartEnd.push(data)
        }
        
        
        // Vérifie si la date demandée permet la planification étendue
        Object.keys(newDates).forEach((aDate) => {
            const diffBetweenWeeks = HelperService.weeksBetween(new Date(), new Date(aDate))
            if (diffBetweenWeeks < $rootScope.bookingConditions.nb_weeks) {
                if (!$rootScope.canDisplay($scope.roleAllAllowed)) {
                    $scope.extendedSchedulingAllowed = false
                    $scope.tooShortTimeafterCurrentDate = true
                    $scope.scheduling = false
                }
            }
        })
    }

    // contrôle de chevauchement
    // contrôles de droits
    // prod a des droits limités
    // on peut avoir la même tranche horaire plusieurs fois
    // 
    $scope.presetImpossibleMsg = ''

    $scope.handleGlobalTimeSlot = function (value) {
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null
        $scope.selectedGlobal.editor = null
        $scope.selectedGlobal.stage = null
        const timeSlot = JSON.parse(JSON.stringify(value))
        $scope.presetArraySelected.push(timeSlot)
        $scope.dateStartEndObject = {}
        const entriesByDay = {}
        $scope.dateStartEnd.forEach((entry) => {
            $scope.dateStartEndObject[entry.id] = entry
            if (!entriesByDay[entry.day] ) {
                entriesByDay[entry.day] = []
            }
            entriesByDay[entry.day].push(entry)
        })
        // A déjà une plage, on ajoute une seconde, même heure ou pas
        let added2oldEntry = false
        const listOfDays2fill = []
        Object.keys(newDates).forEach((day) => {
            const weekNumber = moment(day).startOf('isoWeek').format("w")
            if ($scope.currentWeekNumber == 0 || $scope.currentWeekNumber == weekNumber) {
                listOfDays2fill.push(day)
                if (entriesByDay[day]) {
                    entriesByDay[day].forEach((entry) => {
                        if (!entry.start_time && !entry.end_time) {
                            entry.startDayTime = timeSlot.startDayTime
                            entry.endDayTime = timeSlot.endDayTime
                            addedTime = timeSlot.endDayTime - timeSlot.startDayTime
                            entry.start_time = timeSlot.start
                            entry.end_time = timeSlot.end
                            const splitted = day.split(' ')
                            entry.datetime_start = splitted[0] + ' ' + timeSlot.start + ':00'
                            entry.datetime_end =  splitted[0] + ' ' + timeSlot.end + ':00'
                            entry.timestamp = parseInt(moment(entry.day).format('x'))
                            added2oldEntry = true
                        }
                    })

                }
            }
        })
        if (!added2oldEntry) {
            listOfDays2fill.forEach((day) => {
                const data = $scope.addDate(day)
                data.startDayTime = timeSlot.startDayTime
                data.endDayTime = timeSlot.endDayTime
                addedTime = timeSlot.endDayTime - timeSlot.startDayTime
                data.start_time = timeSlot.start
                data.end_time = timeSlot.end
                const splitted = day.split(' ')
                data.datetime_start = splitted[0] + ' ' + timeSlot.start + ':00'
                data.datetime_end =  splitted[0] + ' ' + timeSlot.end + ':00'
                data.timestamp = parseInt(moment(data.day).format('x'))
                $scope.dateStartEndObject[data.id] = data
            })
        }
        $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
        // refait le hash des entrées
        // computeInsideTotalTimeFromListOfEntries()
        // Vérifie les dispo des sallles et des techs
    }

    $scope.getClasses = function (date) {
        const dateClass = FarmerService.getDateClass(date, true)
        return dateClass        
    }

    // choix des heures global hors tranches horaires prédéfinies
    // verifie que le end est apres le start :)
    // appliqué à tous les jours en écrasant ce qui existe
    $scope.handleGlobalTime = function (period, selectedHour) {
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null
        $scope.selectedGlobal.editor = null
        $scope.selectedGlobal.stage = null        
        if (!selectedHour) return
        if (period == 'start') {
            $scope.selectedGlobalTime.start  = selectedHour
        } else {
            $scope.selectedGlobalTime.end = selectedHour
            if ($scope.selectedGlobalTime.start.id >= selectedHour.id ) {
                HelperService.setPopupMessage($scope, $rootScope._T["imkt3hka"] , 3000)
                return 
            }
            $scope.timeEnd = selectedHour     
            const timeSlot = {
                endDayTime: selectedHour.id,
                name: $scope.selectedGlobalTime.start.name + ' ' +  selectedHour.name,
                position: $scope.selectedGlobalTime.start.id,
                preset: $scope.selectedGlobalTime.start.name + ' ' +  selectedHour.name,
                end: selectedHour.name,
                start: $scope.selectedGlobalTime.start.name,
                startDayTime: $scope.selectedGlobalTime.start.id,
                weekNumber: $scope.currentWeekNumber
            }
            $scope.presetArraySelected.push(timeSlot)
            $scope.dateStartEndObject = {}
            const entriesByDay = {}
            $scope.dateStartEnd.forEach((entry) => {
                $scope.dateStartEndObject[entry.id] = entry
                if (!entriesByDay[entry.day] ) {
                    entriesByDay[entry.day] = []
                }
                entriesByDay[entry.day].push(entry)
                    
            })
            // A déjà une plage, on ajoute une seconde, même heure ou pas
            let added2oldEntry = false
            const listOfDays2fill = []
            Object.keys(newDates).forEach((day) => {
                const weekNumber = moment(day).startOf('isoWeek').format("w")
                if ($scope.currentWeekNumber == 0 || $scope.currentWeekNumber == weekNumber) {
                    listOfDays2fill.push(day)
                    if (entriesByDay[day]) {
                        entriesByDay[day].forEach((entry) => {
                            if (!entry.start_time && !entry.end_time) {
                                entry.startDayTime = timeSlot.startDayTime
                                entry.endDayTime = timeSlot.endDayTime
                                addedTime = timeSlot.endDayTime - timeSlot.startDayTime
                                entry.start_time = timeSlot.start
                                entry.end_time = timeSlot.end
                                const splitted = day.split(' ')
                                entry.datetime_start = splitted[0] + ' ' + timeSlot.start + ':00'
                                entry.datetime_end =  splitted[0] + ' ' + timeSlot.end + ':00'
                                entry.timestamp = parseInt(moment(entry.day).format('x'))
                                added2oldEntry = true
                            }
                        })
    
                    }
                }
            })
            if (!added2oldEntry) {
                listOfDays2fill.forEach((day) => {
                    const data = $scope.addDate(day)
                    data.startDayTime = timeSlot.startDayTime
                    data.endDayTime = timeSlot.endDayTime
                    addedTime = timeSlot.endDayTime - timeSlot.startDayTime
                    data.start_time = timeSlot.start
                    data.end_time = timeSlot.end
                    const splitted = day.split(' ')
                    data.datetime_start = splitted[0] + ' ' + timeSlot.start + ':00'
                    data.datetime_end =  splitted[0] + ' ' + timeSlot.end + ':00'
                    data.timestamp = parseInt(moment(data.day).format('x'))
                    $scope.dateStartEndObject[data.id] = data
                })
            }
            $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
            $scope.buildSlotsReference()
            $scope.handleWeekNumber($scope.currentWeekNumber)
        }
    }

    $scope.uniqueStartHour = null
    $scope.uniqueEndHour = null
    $scope.handleUniqueTime = function (period, date, selectedHour) {    
        if (period == 'start') {
            $scope.uniqueStartHour  = selectedHour
            // si déjà une heure signale un chevauchement
        } else {
            console.log($scope.uniqueStartHour)
            const value = {}
            const added_duration = selectedHour.id - $scope.uniqueStartHour.id
            // computeRemainingTime(added_duration)
            $scope.uniqueEndHour = selectedHour
            value.end = selectedHour.i18nHour
            value.start = $scope.uniqueStartHour.i18nHour
            value.endDayTime = selectedHour.id
            value.startDayTime = $scope.uniqueStartHour.id
            value.position = 0
            if (date.start_time) {
                if (date.endDayTime == $scope.uniqueStartHour || selectedHour == date.startDayTime) {
                    $scope.idBooking++
                    delete date.temporaryEndHour
                    delete date.temporaryStartHour
                    const newDate = JSON.parse(JSON.stringify(date))
                    newDate.tech_writer_id = null
                    newDate.tech_reader_id = null
                    newDate.tech_editor_id = null
                    newDate.audit = null
                    newDate.room = null
                    newDate.id = 'tmp-' + $scope.idBooking
                    newDate.farmer_id = 'tmp-' + $scope.idBooking
                    newDate.booking_id = null
                    newDate.startDayTime = $scope.uniqueStartHour.id
                    newDate.endDayTime = selectedHour.id
                    newDate.start_time = $rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour
                    newDate.end_time =  $rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour
                    const splitted = date.day.split(' ')
                    newDate.datetime_start = splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour) + ':00'
                    newDate.datetime_end =  splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour) + ':00'
                    newDate.weekNumber = moment(date.day).startOf('isoWeek').format("w")
                
                    $scope.dateStartEndObject[newDate.id] = newDate
                    $scope.dateStartEnd = Object.values($scope.dateStartEndObject)    
                } else {
                    const currentStartMinutes = HelperService.fromHourToMinutes(date.start_time)
                    const currentEndMinutes = HelperService.fromHourToMinutes(date.end_time)
                    if (currentStartMinutes <= selectedHour.id && $scope.uniqueStartHour.id <= currentEndMinutes) {
                        delete date.temporaryEndHour
                        delete date.temporaryStartHour
                        date.tech_writer_id = null
                        date.tech_reader_id = null
                        date.tech_editor_id = null
                        date.audit = null
                        date.room = null
                        date.startDayTime = $scope.uniqueStartHour.id
                        date.endDayTime = selectedHour.id
                        date.start_time = $rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour
                        date.end_time = $rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour
                        date.weekNumber = moment(date.day).startOf('isoWeek').format("w")
                        const splitted = date.day.split(' ')
                        date.datetime_start = splitted[0] + ' ' +  ($rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour) + ':00'
                        date.datetime_end =  splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour) + ':00'
                        return
                    }
                    if (currentStartMinutes == selectedHour.id) {
                        // même début
                        return
                    }
                    $scope.idBooking++
                    delete date.temporaryEndHour
                    delete date.temporaryStartHour
                    const newDate = JSON.parse(JSON.stringify(date))
                    newDate.tech_writer_id = null
                    newDate.tech_reader_id = null
                    newDate.tech_editor_id = null
                    newDate.audit = null
                    newDate.room = null
                    newDate.id = 'tmp-' + $scope.idBooking
                    newDate.farmer_id = 'tmp-' + $scope.idBooking
                    newDate.booking_id = null
                    newDate.startDayTime = $scope.uniqueStartHour.id
                    newDate.endDayTime = selectedHour.id
                    newDate.start_time = $rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour
                    newDate.end_time = $rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour
                    newDate.weekNumber = moment(date.day).startOf('isoWeek').format("w")
                    const splitted = date.day.split(' ')
                    newDate.datetime_start = splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour) + ':00'
                    newDate.datetime_end =  splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour) + ':00'
                
                    $scope.dateStartEndObject[newDate.id] = newDate
                    $scope.dateStartEnd = Object.values($scope.dateStartEndObject)    
                }
                           
            } else {
                delete date.temporaryEndHour
                delete date.temporaryStartHour
                date.startDayTime = $scope.uniqueStartHour.id
                date.endDayTime = selectedHour.id
                date.start_time = $rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour
                date.end_time = $rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour
                const splitted = date.day.split(' ')
                date.datetime_start = splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? $scope.uniqueStartHour.name : $scope.uniqueStartHour.i18nHour) + ':00'
                date.datetime_end =  splitted[0] + ' ' + ($rootScope.user_entity.person.branch_id == 3 ? selectedHour.name : selectedHour.i18nHour) + ':00'
            }
            const dates = {}
            dates[date.day] = date
            checkAvailability(value, dates)
            $scope.buildSlotsReference()
            $scope.handleWeekNumber($scope.currentWeekNumber)
            // computeInsideTotalTimeFromListOfEntries()
        }
        
    }

    // sélectionne une date unique
    // vérifie si salles et techs sont dispo
    $scope.handleSelectUniquePresetTime = function (date) {
        const value = {}
        value.end = date.end_time
        value.start = date.start_time
        value.endDayTime = HelperService.fromHourToMinutes(date.end_time)
        value.startDayTime = HelperService.fromHourToMinutes(date.start_time)
        value.position = 0        
        const dates = {}
        dates[date.day] = date
        checkAvailability(value, dates)
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
    }   


    // ajoute 
    // effacer revient aux heures originales si existent
    // si la salle est déjà défini et que seules les heures sont changées, il faut vérifier les heures
    $scope.handleUniquePresetTime = function (date, value) {

        if (!$rootScope.canDisplay($scope.roleAllAllowed) && $scope.extendedSchedulingAllowed && $scope.dateStartEnd.length > 1) {
            // pas de selection indviduelle en mode prod quand il y a plusieurs dates
            return 
        }
        // Prod ne peut pas modifier une tranche horaire d'une séance planifiée qui n'appartient pas au chargé de prod ET qui est en dessous de la période autorisée
        // Et s'il existe déjà une entrée, crée une autre entrée
        if (value) {
            if (date.start_time && date.end_time) {
                $scope.idBooking++
                delete date.temporaryEndHour
                delete date.temporaryStartHour
                const newDate = JSON.parse(JSON.stringify(date))
                newDate.tech_writer_id = null
                newDate.tech_reader_id = null
                newDate.tech_editor_id = null
                newDate.audit = null
                newDate.room = null
                newDate.id = 'tmp-' + $scope.idBooking
                newDate.farmer_id = 'tmp-' + $scope.idBooking
                newDate.booking_id = null
                newDate.startDayTime = value.startDayTime
                newDate.endDayTime = value.endDayTime
                newDate.start_time = value.start
                newDate.end_time = value.end
                newDate.writer = null
                newDate.weekNumber = moment(date.day).startOf('isoWeek').format("w")
                const splitted = date.day.split(' ')
                newDate.datetime_start = splitted[0] + ' ' + value.start + ':00'
                newDate.datetime_end =  splitted[0] + ' ' + value.end + ':00'
            
                

                $scope.dateStartEndObject[newDate.id] = newDate
                $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
            } else {
                delete date.temporaryEndHour
                delete date.temporaryStartHour
                date.startDayTime = value.startDayTime
                date.endDayTime = value.endDayTime
                date.start_time = value.start
                date.end_time = value.end
                date.weekNumber = moment(date.day).startOf('isoWeek').format("w")
                const splitted = date.day.split(' ')
                date.datetime_start = splitted[0] + ' ' + value.start + ':00'
                date.datetime_end =  splitted[0] + ' ' + value.end + ':00'     
                                 
            }
            const splitted = date.datetime_start.split(' ')
            date.datetime_start = splitted[0] + ' ' + date.start_time + ':00'
            date.datetime_end = splitted[0] + ' ' + date.end_time + ':00'    
            
            const dates = {}
            dates[date.day] = date
            checkAvailability(value, dates)
            if (date.room && $scope.occupiedRooms[date.room.id]) {
                HelperService.setPopupMessage($scope, 'la salle est occupée, veuillez choisir un autre horaire!' , 5000)
                date.start_time = null
                date.end_time = null
                const splitted = date.datetime_start.split(' ')
                date.datetime_start = splitted[0] + ' ' + '00:00:00'
                date.datetime_end = splitted[0] + ' ' + '00:00:00'     
                date.startDayTime = 0
                date.endDayTime = 0               
            }
        } else {
            date.start_time = null
            date.end_time = null
            const splitted = date.datetime_start.split(' ')
            date.datetime_start = splitted[0] + ' ' + '00:00:00'
            date.datetime_end = splitted[0] + ' ' + '00:00:00'    
            date.startDayTime = 0
            date.endDayTime = 0
        }
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
        // computeInsideTotalTimeFromListOfEntries()
    }

    $scope.handleRemoveUniqueDate = function (date) {
        delete $scope.dateStartEndObject[date.id]
        $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
        let remainsADayinCalendar = false
        $scope.dateStartEnd.forEach((entry) => {
            if (date.day == entry.day) {
                remainsADayinCalendar = true
            }
        })
        if (!remainsADayinCalendar) {
            delete newDates[date.day]
            $scope.selectedDates = Object.keys(newDates).map((datetime) => { return parseInt(moment(datetime).format('x'))})
        }
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
        // computeInsideTotalTimeFromListOfEntries()
    }

    $scope.showDatesDetails = function () {
        $scope.isShowDatesDetails = !$scope.isShowDatesDetails
    }

    $scope.addDate = function (newDate) {
        $scope.idBooking++
        const data = {
        id: 'tmp-' + $scope.idBooking,
        farmer_id: 'tmp-' + $scope.idBooking,    // s'il existe
        booking_id: null,
        day: $filter('date')(newDate, "yyyy-MM-dd 00:00:00"),
        datetime_start: $filter('date')(newDate, "yyyy-MM-dd 00:00:00"),
        datetime_end: null,
        start_time: null,   // start hour
        end_time: null,     // end hour
        i18nStartHour: null,
        i18nEndHour: null,
        audit: null,
        room: null,
        action_id: $scope.actionType.id,   // A définir au début     
        is_checked: true,
        requestedByProd: 0, // selon que le user est prod ou autre
        artistic_director_id : null,
        tech_writer_id : null,
        tech_reader_id : null,
        tech_editor_id : null,
        startDayTime: 0,
        endDayTime: 0,
        weekNumber: moment(newDate).startOf('isoWeek').format("w")
        }
        return data
    } 

    const checkAvailability = function (value, datesList) {
        $scope.currentGlobalData.rooms = []
        $scope.currentGlobalTechs = []
        let aRoomIsOccupied = false
        const occupiedRooms = {}
        const occupiedTechs = {}
        let atechIsOccupied = false

        Object.keys(datesList).forEach((datetime) => {
            const day = moment(datetime).format("YYYY-MM-DD")
            // attention au lendemain, si l'heure est au lendemain ou à minuit
            // fonction dans Helper qui renvoie les bonnes heures
            // helperService.buildDateTime
            const chosenStartDate = new Date(HelperService.buildDateTime(day + ' 00:00:00',  value.start)).getTime()
            const chosenEndDate = new Date(HelperService.buildDateTime(day + ' 00:00:00',  value.end)).getTime()
            const individualKey = day + '-' + value.start + '-' + value.end
            $scope.checkedRoomsByDayAndSlot[individualKey] = true
            if ($scope.bookingsByDay[day]) {
                if (!$scope.currentRoomsByDayAndSlot[individualKey]) {
                    $scope.currentRoomsByDayAndSlot[individualKey] = {}
                }
                if (!$scope.currentTechsByDayAndSlot[individualKey]) {
                    $scope.currentTechsByDayAndSlot[individualKey] = {}
                }                
                $scope.bookingsByDay[day].forEach((booking) => {
                    const originalStart = new Date(booking.booking.start).getTime()
                    const originalEnd = new Date(booking.booking.end).getTime()
                    const datetimeSlot = booking.booking.start + '-' + booking.booking.end
                    // et la verifie tech et salles :)
                    if (originalRoomsOccupation[datetimeSlot]) {
                        if (!originalRoomsOccupation[datetimeSlot][booking.booking.object_id]) {
                            if (currentRoomsById[booking.booking.object_id]) {
                                if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                    if (booking.booking.status != 'note' ||
                                        (
                                            booking.booking.status == 'note' &&
                                            (booking.booking.typenote ==  'prebooking'
                                            || booking.booking.typenote ==  'currentTech'
                                            || booking.booking.typenote ==  'comment'
                                            || booking.booking.typenote ==  'unavailable'
                                            || booking.booking.typenote ==  'prebooking_mix'
                                            || booking.booking.typenote ==  'prebooking_rec')
                                        )
                                    ) {
                                        occupiedRooms[booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                        $scope.occupiedRooms[booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                        $scope.currentRoomsByDayAndSlot[individualKey][booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                    }
                                }
                            }    
                            if (booking.persons.writer && currentTechsById[booking.persons.writer]) {
                                if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                    if (booking.booking.status != 'note' ||
                                        (
                                            booking.booking.status == 'note' &&
                                            (booking.booking.typenote ==  'prebooking'
                                            || booking.booking.typenote ==  'currentTech'
                                            || booking.booking.typenote ==  'comment'
                                            || booking.booking.typenote ==  'unavailable'
                                            || booking.booking.typenote ==  'prebooking_mix'
                                            || booking.booking.typenote ==  'prebooking_rec')
                                        )
                                    ) {
                                        atechIsOccupied = true
                                        occupiedTechs[booking.persons.writer] = true
                                        $scope.currentTechsByDayAndSlot[individualKey][booking.persons.writer] = true
                                    }

                                }
                            }
                            if (booking.persons.reader && currentTechsById[booking.persons.reader]) {
                                if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                    atechIsOccupied = true
                                    occupiedTechs[booking.persons.reader] = true
                                    $scope.currentTechsByDayAndSlot[individualKey][booking.persons.reader] = true
                                }
                            }
                            if (booking.persons.editor && currentTechsById[booking.persons.editor]) {
                                if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                    atechIsOccupied = true
                                    occupiedTechs[booking.persons.editor] = true
                                    $scope.currentTechsByDayAndSlot[individualKey][booking.persons.editor] = true
                                }
                            }
                            if (booking.persons.indispo) {
                                // et les autres
                                Object.keys(booking.persons).forEach((techIndispoId) => {
                                    if (booking.persons[techIndispoId] == 'indispo' && currentTechsById[techIndispoId]) {
                                        if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                            atechIsOccupied = true
                                            occupiedTechs[techIndispoId] = true
                                            $scope.currentTechsByDayAndSlot[individualKey][techIndispoId] = true
                                        }
                                    }
                                })
                            }
                        }
                    } else {
                        if (currentRoomsById[booking.booking.object_id]) {
                            if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                if (booking.booking.status != 'note' ||
                                    (
                                        booking.booking.status == 'note' &&
                                        (booking.booking.typenote ==  'prebooking'
                                        || booking.booking.typenote ==  'currentTech'
                                        || booking.booking.typenote ==  'comment'
                                        || booking.booking.typenote ==  'unavailable'
                                        || booking.booking.typenote ==  'prebooking_mix'
                                        || booking.booking.typenote ==  'prebooking_rec')
                                    )
                                ) {
                                    occupiedRooms[booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                    $scope.occupiedRooms[booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                    $scope.currentRoomsByDayAndSlot[individualKey][booking.booking.object_id] = currentRoomsById[booking.booking.object_id]
                                }

                            }
                        }
                        if (booking.persons.indispo) {
                            // et les autres
                            Object.keys(booking.persons).forEach((techIndispoId) => {
                                // && currentTechsById[techIndispoId]
                                if (booking.persons[techIndispoId] == 'indispo' ) {
                                    if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                        atechIsOccupied = true
                                        occupiedTechs[techIndispoId] = true
                                        $scope.currentTechsByDayAndSlot[individualKey][techIndispoId] = true
                                    }
                                }
                            })
                        }
                        if (booking.persons.writer && (currentTechsById[booking.persons.writer])) {
                            if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                if (booking.booking.status != 'note' ||
                                        (
                                            booking.booking.status == 'note' &&
                                            (booking.booking.typenote ==  'prebooking'
                                            || booking.booking.typenote ==  'currentTech'
                                            || booking.booking.typenote ==  'comment'
                                            || booking.booking.typenote ==  'unavailable'
                                            || booking.booking.typenote ==  'prebooking_mix'
                                            || booking.booking.typenote ==  'prebooking_rec')
                                        )
                                    ) {
                                        atechIsOccupied = true
                                        occupiedTechs[booking.persons.writer] = true
                                        $scope.currentTechsByDayAndSlot[individualKey][booking.persons.writer] = true
                                }

                            }
                        }
                        if (booking.persons.reader && currentTechsById[booking.persons.reader]) {
                            if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                atechIsOccupied = true
                                occupiedTechs[booking.persons.reader] = true
                                $scope.currentTechsByDayAndSlot[individualKey][booking.persons.reader] = true
                            }
                        } 
                        if (booking.persons.editor && currentTechsById[booking.persons.editor]) {
                            if (originalStart < chosenEndDate && chosenStartDate < originalEnd) {
                                atechIsOccupied = true
                                occupiedTechs[booking.persons.editor] = true
                                $scope.currentTechsByDayAndSlot[individualKey][booking.persons.editor] = true
                            }
                        }
                    }
               
                })
            }

        })
        $scope.stageList.forEach((room) => {
            if (!occupiedRooms[room.id]) {
                $scope.currentGlobalData.rooms.push(room)
            }
        })
        $scope.occupiedRooms = occupiedRooms

        $scope.techniciansList.forEach((tech) => {
            if (!occupiedTechs[tech.id]) {
                $scope.currentGlobalTechs.push(tech)
            }
        })
        if (aRoomIsOccupied) {
            $scope.globalChoicePossible = false
        } else {
            $scope.globalChoicePossible = true
        }
        if (atechIsOccupied) {

        } else {

        }        
    }

    // sélectionne un slot global pour afficher et choisir les heures et tech globaux
    // pas de salle globale, pas de technicien global
    // currentTimeSlotIndex == $index ? 'tsbingo' : 'tsbingo'
    $scope.changeClassPresetGlobalTime = function (index) {
        return $scope.currentTimeSlotIndex == index ?  true : false
    }


    $scope.currentGlobalTimeSlot = null
    $scope.currentTimeSlotIndex = null
    $scope.handleSelectGlobalSlot = function (value, index) {
        $scope.currentTimeSlotIndex = index
        $scope.selectedGlobal.stage = null
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null

        const dates2check = {}
        $scope.dateStartEnd.forEach((entry) => {
            entry.highlighted = ''
        })
        const slotKey = value.start + ' ' +  value.end + ' ' + value.weekNumber
        $scope.dateStartEnd.forEach((entry) => {
            // const slotKeyFound = entry.start_time + ' ' +  entry.end_time + ' ' + entry.weekNumber
            const slotFound = $scope.slotsReferenceByWeek[entry.weekNumber][value.inDay]
            if (slotFound && slotFound[slotKey] && slotFound[slotKey].inDay == entry.inDay) {
                entry.highlighted = 'tsbingo'
                $scope.selectedGlobal.stage = entry.room
                $scope.selectedGlobal.writer = entry.writer
                $scope.selectedGlobal.reader = entry.reader
                dates2check[entry.day] = true
            }

        })

        $scope.occupiedRooms = {}
        $scope.currentGlobalTimeSlot = value
        // vérifier uniquement les dates du groupe
        if (Object.keys(dates2check).length == 0) {
            checkAvailability(value, newDates)
        } else {
            checkAvailability(value, dates2check)
        }
    }
   
    // note: on peut avoir deux fois la même tranche horaire avec deux techs différents, il faut retirer un seul tech, oups :)
    $scope.handleRemoveGlobalSlot = function (currentTimeSlot, index) {
        $scope.dateStartEnd.forEach((entry) => {
            entry.highlighted = ''
        })
        $scope.selectedGlobal.stage = null
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null
        $scope.selectedGlobal.editor = null
        $scope.presetArraySelected.splice(index,1)
        $scope.selectedGlobalTime = { start: null, end: null }


        Object.keys($scope.dateStartEndObject).forEach((id) => {
            const entryBase = $scope.dateStartEndObject[id]
            const slotKey = entryBase.start_time + ' ' +  entryBase.end_time + ' ' + entryBase.weekNumber
            const slotFound = $scope.slotsReferenceByWeek[entryBase.weekNumber][currentTimeSlot.inDay]
            if ($scope.currentWeekNumber == entryBase.weekNumber) {
                if (slotFound && slotFound[slotKey] && slotFound[slotKey].inDay == entryBase.inDay) {
                    /*
                    entryBase.room = null
                    entryBase.audit = null
                    entryBase.writer = null
                    entryBase.reader = null
                    */
                    entryBase.startDayTime = 0
                    entryBase.endDayTime = 0
                    entryBase.start_time = 0
                    entryBase.end_time = 0
                    const splitted = entryBase.day.split(' ')
                    entryBase.weekNumber = moment(entryBase.day).startOf('isoWeek').format("w")
                    entryBase.datetime_start = splitted[0] + ' 00:00:00'
                    entryBase.datetime_end =  splitted[0] + ' 00:00:00'
                    entryBase.highlighted = 'tsbingo'
                    $scope.dateStartEndObject[id] = entryBase
                }
            }
            if ($scope.currentWeekNumber == 0) {
                if (slotFound && slotFound[slotKey] && slotFound[slotKey].inDay == entryBase.inDay) {
                    /*
                    entryBase.room = null
                    entryBase.audit = null
                    entryBase.writer = null
                    entryBase.reader = null
                    */
                    entryBase.startDayTime = 0
                    entryBase.endDayTime = 0
                    entryBase.start_time = 0
                    entryBase.end_time = 0
                    const splitted = entryBase.day.split(' ')
                    entryBase.weekNumber = moment(entryBase.day).startOf('isoWeek').format("w")
                    entryBase.datetime_start = splitted[0] + ' 00:00:00'
                    entryBase.datetime_end =  splitted[0] + ' 00:00:00'
                    entryBase.highlighted = 'tsbingo'
                    $scope.dateStartEndObject[id] = entryBase
                }
            }

        })

        $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
        // computeInsideTotalTimeFromListOfEntries()
    }

    $scope.handleRemoveAllTimeSlot = function () {
        // par semaine ou tout
        $scope.selectedGlobal.writer = null
        $scope.selectedGlobal.reader = null
        $scope.selectedGlobal.editor = null
        $scope.selectedGlobal.stage = null 
        // computeRemainingTime(added_duration)
        $scope.presetArraySelected = []        
        $scope.dateStartEndObject = {}
        $scope.insideTotalTimeUsed = 0
        // computeRemainingTime(0)
        Object.keys(newDates).forEach((day) => {
            const data = $scope.addDate(day)
            data.startDayTime = 0
            data.endDayTime = 0
            data.start_time = 0
            data.end_time = 0
            const splitted = day.split(' ')
            data.datetime_start = splitted[0] + ' 00:00:00'
            data.datetime_end =  splitted[0] + ' 00:00:00'
            $scope.dateStartEndObject[data.id] = data                
        })
        $scope.dateStartEnd = Object.values($scope.dateStartEndObject)
        $scope.buildSlotsReference()
        $scope.handleWeekNumber($scope.currentWeekNumber)
        // computeInsideTotalTimeFromListOfEntries()
    }

    $scope.canManageEditor = function () {
        // uniquement pour les allemands de FFS et uniquement pour rec et mix
        // action_id
        if ($rootScope.user_entity.person.branch_id == 2) {
            return true
        }
        return false
    }

    // Vérifie s'il existe un chevauchement sur l'ensemble des dates, sauf la date choisie
    const checkAllEntries = function (currentId, day, startTime, EndTime) {
        let hasOverlap = false
        $scope.dateStartEnd.forEach((entry) => {
            if (entry.id != currentId && day == entry.day) {
                const currentStartMinutes = HelperService.fromHourToMinutes(startTime)
                const currentEndMinutes = HelperService.fromHourToMinutes(EndTime)
                const foundStartMinutes = HelperService.fromHourToMinutes(entry.start_time)
                const foundEndMinutes = HelperService.fromHourToMinutes(entry.end_time)
                if (foundStartMinutes > 0 && foundEndMinutes > 0 && foundStartMinutes < currentEndMinutes && currentStartMinutes < foundEndMinutes) {
                    hasOverlap = true
                }
            }
        })
        return hasOverlap
    }

    $scope.manageSelection = function (request) {
        if ($scope.requests.length == 1) {
            return
        }
        request.isSelected = !request.isSelected
    } 

    $scope.isDifferentWeek = function(date, previousDate) {
        return moment(date).startOf('isoWeek').format("w") != moment(previousDate).startOf('isoWeek').format("w");
    }

    const sendNotificationMessage = function (dataSent) {
        const transformator = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
        const requests = $scope.ngDialogData.allRequests
        // si elle sont été planifiées, demande souhaitée créées
        dataSent.farmers.forEach(function (entry) {
          let descriptionNotifDetail =  ''
          let descriptionNotif = ''
          let keepGoing = false
          if (entry.cancel) {
            descriptionNotif = $rootScope._T["p8tmmghz"] + "<br />"
            keepGoing = true
          } else if ((entry.audit && (!entry.booking_id || entry.booking_id.match(/tmp-/))) || entry.room && !entry.booking_id) {
            descriptionNotif = $rootScope._T["ypgtvu3j"] + "<br />"
            keepGoing = true
          }
          if (keepGoing) {
            let momentDate = moment(entry.day, "YYYY-MM-DD HH:mm:ss");
            const day = {
              day : momentDate.format("DD/MM/YYYY"),
              audit : entry.room ? entry.room.name : entry.audit,
              hours : transformator(entry.start_time) + "-" + transformator(entry.end_time),
              writer: $rootScope._T["fj98qsz4"],
              reader: $rootScope._T["fj98qsz4"]
            }
            if (entry.reader) {
              day.reader = entry.reader.fullname
            }
            if (entry.writer) {
              day.writer = entry.writer.fullname
            }
            descriptionNotifDetail += 
              " " + day.day +
              " | Room : " + day.audit +
              " | Hour : " + day.hours +
              " | Writer : " + day.writer +
              " | Reader : " + day.reader
            descriptionNotif += descriptionNotifDetail
            sendStandardNotif(new NotificationService(), requests, "production", $rootScope._T["kxq3ttb9"] , descriptionNotif, $filter, "planification", $rootScope)
            requests.forEach((request) => {
                newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["kxq3ttb9"] + ' ' + day.day + ' ' + day.audit)
            })
            
          }
        })
      }    


    const bookingsReceived = function (result) {
        $scope.ngDialogData.retours = {}
        sendNotificationMessage(result)
        $scope.closeThisDialog(result)
    }
    // non, ne sert à rien
    $scope.hasEntrySelected = function ()  {
        let disabled = true
        if ($scope.dateStartEnd.length > 0) {
            disabled = false
        }
        if ($scope.requests.length > 1) {
            let requestNb = $scope.requests.length
            $scope.requests.forEach((request) => {
                if (request.hasOwnProperty('isSelected') && !request.isSelected) {
                    requestNb--
                }
            })
            if (requestNb < 1) {
                disabled = true
                HelperService.setPopupMessage($scope, $rootScope._T["pheq2ozg"] , 5000)
            }
        }
        return disabled
    }

    // rapprochement des données
    // pour les création renvoie au composant parent
    // pour le reste enregistrement direct
    // tout est dans $scope.dateStartEnd
    // les données d'origine sont dans $scope.dateStartEndOriginal
    $scope.saveBookedDates = function () {
        const byDayStartEnd = {}
        const byBookingId = {}
        const newList = []
        // doit vérifier que toutes les entrées avec une salle on une heure valide
        let allEntriesWithRoomHaveAnhour = true
        let allEntriesWithTechHaveAnhour = true
        $scope.dateStartEnd.forEach((entry) => {
            if (!byDayStartEnd[entry.day + entry.start_time + entry.end_time]) {
                byDayStartEnd[entry.day + entry.start_time + entry.end_time] = []
            }
            byDayStartEnd[entry.day + entry.start_time + entry.end_time].push(entry)
            if (entry.booking_id) {
                byBookingId[entry.booking_id] = entry
            }
            if (entry.room && !entry.start_time) {
                allEntriesWithRoomHaveAnhour= false
            }
            if ((entry.writer || entry.reader) && !entry.start_time) {
                allEntriesWithTechHaveAnhour= false
            }
        })
        if (!allEntriesWithRoomHaveAnhour) {
            HelperService.setPopupMessage($scope, $rootScope._T["12bnbcto"] , 5000)
            return
        }
        if (!allEntriesWithTechHaveAnhour) {
            HelperService.setPopupMessage($scope, $rootScope._T["12bnbcto"] , 5000)
            return
        }
        // en mode planning extended not allowed, les salles et tech ne sont pas transmis sur les nouvelles séances
        const originalEntryUsed = {}
        $scope.dateStartEndOriginal.forEach((entry) => {
            if (entry.start_time && entry.end_time) {
                if (byDayStartEnd[entry.day + entry.start_time + entry.end_time]) {
                    byDayStartEnd[entry.day + entry.start_time + entry.end_time].forEach((entry2) => {
                        // entrée existe, mais modifiée, vérifie si l'entrée existe avec le même id 
                        if (!entry2.alreadyUsed) {
                            if (!originalEntryUsed[entry.booking_id]) {
                                // updated entry with hour
                                entry.day = entry2.day
                                entry.start_time = entry2.start_time
                                entry.end_time = entry2.end_time
                                entry.room = entry2.room
                                entry.audit = entry2.room ? entry2.room.name : null
                                entry.tech_writer_id = entry2.writer ? entry2.writer.id : null
                                entry.tech_reader_id = entry2.reader ? entry2.reader.id : null
                                entry.tech_editor_id = entry2.editor ? entry2.editor.id : null
                                entry.writer = entry2.writer
                                entry.reader = entry2.reader
                                entry.editor = entry2.editor
                                entry.datetime_start = entry2.datetime_start
                                entry.datetime_end = entry2.datetime_end
                                entry2.alreadyUsed = true
                                newList.push(entry)
                                originalEntryUsed[entry.booking_id] = true
                            }
                        }
                    })
                } else {
                    if (!byBookingId[entry.booking_id]) {
                        // entry with hour to cancel
                        entry.cancel = true
                        newList.push(entry)
                    } else {
                        Object.keys(byDayStartEnd).forEach((id) => {
                            const entry3 = byDayStartEnd[id]
                            entry3.forEach((entry2) => {
                                if (entry2.farmer_id && entry2.day == entry.day && !entry2.alreadyUsed && !entry.alreadyUsed) {
                                    if (!originalEntryUsed[entry2.farmer_id]) {
                                        entry2.alreadyUsed = true
                                        entry.day = entry2.day
                                        entry.start_time = entry2.start_time
                                        entry.end_time = entry2.end_time
                                        entry.room = entry2.room
                                        entry.booking_id = entry2.booking_id
                                        entry.audit = entry2.room ? entry2.room.name : null
                                        entry.tech_writer_id = entry2.writer ? entry2.writer.id : null
                                        entry.tech_reader_id = entry2.reader ? entry2.reader.id : null
                                        entry.tech_editor_id = entry2.reader ? entry2.editor.id : null
                                        entry.writer = entry2.writer
                                        entry.reader = entry2.reader
                                        entry.editor = entry2.editor
                                        entry.datetime_start = entry2.datetime_start
                                        entry.datetime_end = entry2.datetime_end
                                        entry2.alreadyUsed = true
                                        entry.alreadyUsed = true
                                        newList.push(entry)
                                        foundEntry = true
                                        originalEntryUsed[entry2.farmer_id] = true
                                        byDayStartEnd[id].alreadyUsed = true
                                    }
                                }
                            })
                        })
                    }

                }
            } else {
                let foundEntry = false
                Object.keys(byDayStartEnd).forEach((id) => {
                    const entry3 = byDayStartEnd[id]
                    entry3.forEach((entry2) => {
                        if (entry2.day == entry.day && !entry2.alreadyUsed && !entry.alreadyUsed) {
                            if (!originalEntryUsed[entry2.farmer_id]) {
                                // updated entry without hour
                                entry2.alreadyUsed = true
                                entry.day = entry2.day
                                entry.start_time = entry2.start_time
                                entry.end_time = entry2.end_time
                                entry.room = entry2.room
                                entry.audit = entry2.room ? entry2.room.name : null
                                entry.tech_writer_id = entry2.writer ? entry2.writer.id : null
                                entry.tech_reader_id = entry2.reader ? entry2.reader.id : null
                                entry.tech_editor_id = entry2.editor ? entry2.editor.id : null
                                entry.writer = entry2.writer
                                entry.reader = entry2.reader
                                entry.editor = entry2.editor
                                entry.datetime_start = entry2.datetime_start
                                entry.datetime_end = entry2.datetime_end
                                entry2.alreadyUsed = true
                                entry.alreadyUsed = true
                                newList.push(entry)
                                foundEntry = true
                                originalEntryUsed[entry2.farmer_id] = true
                                byDayStartEnd[id].alreadyUsed = true
                            }

                        }
                    })
                })
                if (!foundEntry) {
                    // delete entry without hour
                    entry.cancel = true
                    newList.push(entry)
                }            
            }
            
        })
        // on rajoute ce qui reste dans byDayStartEnd, absent de l'original donc création totale
        Object.keys(byDayStartEnd).forEach((id) => {
            const entry = byDayStartEnd[id]
            entry.forEach((entry2) => {
                if (!entry2.alreadyUsed) {
                    entry2.booking_id = null
                    entry2.created_by = null
                    entry2.is_wish = null
                    // create entry ex-nihilo
                    entry2.tech_writer_id = entry2.writer ? entry2.writer.id : null
                    entry2.tech_reader_id = entry2.reader ? entry2.reader.id : null
                    entry2.tech_editor_id = entry2.editor ? entry2.editor.id : null
                    newList.push(entry2)
                }
            })
        })
        newList.forEach((entry) => {
            if (entry.start_time && entry.end_time) {
                if (HelperService.isNextDay(entry.start_time, entry.end_time)) {
                    const startDay = moment(entry.day).format('YYYY-MM-DD')
                    const endDay = moment(entry.day).add(1, "days").format('YYYY-MM-DD')
                    entry.datetime_start = startDay + ' ' +  entry.start_time
                    entry.datetime_end = endDay + ' ' +  entry.end_time
                }                
                entry.start_time = entry.start_time.replace(':','h')
                entry.end_time = entry.end_time.replace(':','h')
            }
        })

        console.log(newList)
        const requests2update = {}
        $scope.requests.forEach((request) => {
            if (request.hasOwnProperty('isSelected')) {
                if (request.isSelected) {
                    requests2update[request.id] = request.product_id
                }
            } else  {
                requests2update[request.id] = request.product_id
            }
        })
        FarmerService.updateBooks({ requests : requests2update , farmers: newList, action_id: $scope.ngDialogData.action_id, deletedCalendarDates: deletedDatesFromCalendar }, bookingsReceived)
    }
}]
)