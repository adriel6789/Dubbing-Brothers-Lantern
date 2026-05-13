Lantern.controller('RequestGroupListCtrl',['$rootScope', '$filter', '$scope', 'ApiRest', '$timeout','RequestService', 
'FileUploader', 'Session', 'RequestDemandsService', '$stateParams', '$state', 'Request', 'RoomService','PersonsService',
    'ValueListService', '$document',
    function($rootScope, $filter, $scope, ApiRest, $timeout, RequestService, 
        FileUploader, Session, RequestDemandsService, $stateParams, $state, Request, RoomService, PersonsService, 
        ValueListService, $document) {
        /**
         * Variable declaration
         * page associée app/requestGroupList/requestGroupListPlanning.html
         * composant associé
         *  app/components/projectCard.js
         *  app/components/projectCard.html
         */
        let rest = {};
        let service = {};
        let dateFilter = {};
        let showOnlyMyRequests, hideOnHoldRequests, loading, activePlanning, hideSendRequests;
        let isPlanned = 0, countRequestPlannings = [];
        let currentPlanning = null
        $scope.branchId = Session.branchId()
        ValueListService.getPlanningTypes()
        RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
        PersonsService.getTechnicians(function (result) {
            PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
          }, PersonsService.manageTechniciansError)
        $scope.dub_places = []
        ValueListService.getDubPlaces(
        ValueListService.manageDubPlacesReceived(function (dubplaces) {
            const dubPlacesList = []
            Object.keys(dubplaces).forEach(function (name) {
            dubPlacesList.push({
                value: dubplaces[name].value,
                name: dubplaces[name].name,
                loc_value: dubplaces[name].loc_value
            })
            })
            $scope.dub_places = dubPlacesList
            $scope.mainLocationList =  $rootScope.mainLocationList
            $scope.dubPlacesByLocValue = $rootScope.dubPlacesByLocValue
        }), {})

        $scope.startDateDisplayed = ''
        $scope.endDateDisplayed = ''
        $scope.plannings = []
        const planningFilter = { [service] : true}
        $rootScope.user_main_location = $rootScope.user_entity.permissions[0].main_location
        $rootScope.plannings.forEach(function (element) {
            const data = {
              id: element.id,
              name: element.name,
              color: element.color,
              main_location: element.main_location,
              service: element.service,
              branch_id: element.branch_id
            }
            if (element.main_location) {
              if ($rootScope.user_main_location == element.main_location) {
                $scope.plannings.push(data)
              }
            } else {
              $scope.plannings.push(data)
            }
        })

        let requestAlleged = false
        const changeRequest2server = function (event) {
            if (event.altKey) {
                requestAlleged = true
            } else {
                requestAlleged = false
            }

        }
        $document.on('keydown', changeRequest2server)
        $document.on('keyup', changeRequest2server)


        /**
         * Fonctions appelant des évènements correspondant aux services
         */
          
        $rootScope.$on('seancesSendOrRemove', function(event, data) {
            var seancesSendOrRemove = data.content;
            if(seancesSendOrRemove == true && $('#hideRequests').prop("checked") == true){
                service.setHideOnHoldRequests(hideSendRequests, true);
            } 
        });

        service.getDateFilter = function(){
            return dateFilter;
        };
        service.setDateFilter = function(method, reload) {
            let startTemp, endTemp;
            service.setPlannedFilter(method);
            switch (method) {
                case "previous":
                    startTemp = moment().startOf('isoWeek').subtract(1, "weeks");
                    endTemp = moment().endOf('isoWeek').subtract(1, "weeks");
                    dateFilter = initDate(startTemp, endTemp, 4);
                    break;

                case "current":
                    startTemp = moment().startOf('isoWeek');
                    endTemp = moment().endOf('isoWeek');
                    dateFilter = initDate(startTemp, endTemp, 3);
                    break;

                case "next":
                    startTemp = moment().startOf('isoWeek').add(1, "weeks");
                    endTemp = moment().endOf('isoWeek').add(1, "weeks");
                    dateFilter = initDate(startTemp, endTemp, 5);
                    break;

                case "inThreeDays":
                    startTemp = moment().add(3, "days");
                    endTemp = moment().add(3, "days");
                    dateFilter = initDate(startTemp, endTemp, 2);
                    break;

                case "afterTomorrow":
                    startTemp = moment().add(2, "days");
                    endTemp = moment().add(2, "days");
                    dateFilter = initDate(startTemp, endTemp, 2);
                    break;

                case "tomorrow":
                    startTemp = moment().add(1, "days");
                    endTemp = moment().add(1, "days");
                    dateFilter = initDate(startTemp, endTemp, 2);
                    break;
                case "today":
                    startTemp = moment();
                    endTemp = moment();
                    dateFilter = initDate(startTemp, endTemp, 1);
                    break;
                case "yesterday":
                        startTemp = moment().add(-1, "days");
                        endTemp = moment().add(-1, "days");
                        dateFilter = initDate(startTemp, endTemp, 2);
                        break;
                case "rangeDate":
                    if ($scope.rangeDateFilter.dateStart && $scope.rangeDateFilter.dateEnd) {
                        startTemp = moment($scope.rangeDateFilter.dateStart, "DD-MM-YYYY");
                        endTemp = moment($scope.rangeDateFilter.dateEnd, "DD-MM-YYYY");
                    } else if (Session.planningRequestRangeDatesStored.dateStart && Session.planningRequestRangeDatesStored.dateEnd) {
                        startTemp = moment(Session.planningRequestRangeDatesStored.dateStart, "DD-MM-YYYY");
                        endTemp = moment(Session.planningRequestRangeDatesStored.dateEnd, "DD-MM-YYYY");
                        $scope.startDateDisplayed =  startTemp.format('YYYY-MM-DD');
                        $scope.endDateDisplayed = endTemp.format('YYYY-MM-DD')
                    } else {
                        startTemp = moment();
                        endTemp = moment();
                        $scope.startDateDisplayed =  startTemp.format('YYYY-MM-DD');
                        $scope.endDateDisplayed = endTemp.format('YYYY-MM-DD')
                    }
                    dateFilter = initDate(startTemp, endTemp, 'range');
                    break;

                default:
                    dateFilter.startDate = "";
                    dateFilter.endDate = "";
                    dateFilter.filterDate = 0;
                    break;
            }

            function initDate(startTemp, endTemp, filterDate){
                $scope.startDateDisplayed =  startTemp.format('YYYY-MM-DD');
                $scope.endDateDisplayed = endTemp.format('YYYY-MM-DD')
                let objectFilter = {};
                objectFilter.startDate = startTemp.format('YYYY-MM-DD 00:00:00');
                objectFilter.endDate = endTemp.format('YYYY-MM-DD 00:00:00');
                objectFilter.startDateFormatted = startTemp.format('DD/MM/YYYY');
                objectFilter.endDateFormatted = endTemp.format('DD/MM/YYYY');
                objectFilter.filterDate = filterDate;
                return objectFilter;
            }
            if(reload) rest.getRequestDemands();
        };

        service.getShowOnlyMyRequests = function(){
            return showOnlyMyRequests;
        };
        service.setShowOnlyMyRequests = function(showOnly, reload){
            $scope.showOnlyMyRequests = showOnly;
            showOnlyMyRequests = showOnly;
            if(reload) rest.getRequestDemands();
        };

        service.getHideOnHoldRequests = function(){
            return hideOnHoldRequests;
        };
        service.setHideOnHoldRequests = function(hideOnHold, reload){
            $scope.hideOnHoldRequests = hideOnHold;
            hideOnHoldRequests = hideOnHold;
            if(reload) rest.getRequestDemands();
        };
        service.setHideSendRequests = function(hideRequests, reload) {
            hideSendRequests = hideRequests;
            if (reload) rest.getRequestDemands();
        };
        service.getHideSendRequests = function() {
            return hideSendRequests;
        };

        service.setLoading = function(isLoading) {
            loading = isLoading;
        };
        service.isLoading = function () {
            return loading;
        };
        service.showPill = function (idPill) {
            let show = true;
            if ($rootScope.canDisplay(4) && $.cookie('planningHome') != null) {
                let cookie = $.cookie('planningHome');
                let tabId = cookie.split(',');
                if (cookie !== "") {
                    let index = tabId.indexOf(idPill);
                    if (index === -1) {
                        show = false;
                    }
                }
            }

            return show;
        };

        service.setIsPlanned = function(isPlan) {
            isPlanned = isPlan;
        };
        service.getIsPlanned = function() {
            return isPlanned;
        };

        service.getActivePlanning = function() {
            if (typeof activePlanning == 'string') {
                return activePlanning
            } else {
                return activePlanning.id
            }
        };
        service.setActivePlanning = function(planning) {
            activePlanning = planning;
            service.setCookiePills(planning);
        };
        service.setCookiePills = function (planning) {
            if (typeof planning == 'string') {
                $.cookie('pills', planning, {
                    path: '/',
                    expires: 1
                });
            } else {
                $.cookie('pills', planning.id, {
                    path: '/',
                    expires: 1
                });
                if (planning.main_location) {
                    service.setCookieLocPills(planning.main_location)
                }
            }
        };
        service.getCookiePills = function () {
            return $.cookie('pills');
        };

        service.setCookieLocPills = function (main_location) {
            $.cookie('locpills', main_location, {
                path: '/',
                expires: 1
            });
        };
        service.getCookieLocPills = function () {
            return $.cookie('locpills');
        };
        

        
        service.changePlanning = function(planning) {
            let id = 'auditorium'
            if (planning == null) {
                if($state.params.planning == null) {
                    if(service.getCookiePills() == null) {
                        service.setActivePlanning($.cookie('planningHome').split(',')[0]);
                    } else {
                        id = service.getCookiePills()
                        service.setActivePlanning(service.getCookiePills());
                    }
                } else {
                    service.setActivePlanning($stateParams.params.planning);
                }
                let main_location = service.getCookieLocPills()
                currentPlanning = {
                    id: id,
                    main_location: main_location
                }
            } else {
                currentPlanning = planning
                service.setActivePlanning(planning)
            }         
            
            rest.getRequestDemands()
            $scope.setListOfTechTypes()

        }

        service.setCountRequestPlanning = function(countRequestPlanningsToSet) {
            countRequestPlannings = countRequestPlanningsToSet;
        };
        service.getCountRequestPlanning = function(planningId) {
            return countRequestPlannings[planningId];
        };
        service.saveSearch = function(text) {
            let date = new Date();
            date.setTime(date.getTime() + (300 * 1000));
            $.cookie('requestSearch', text, {
                expires: date,
                path: '/'
            });
        };
        service.getSaveSearch = function() {
            return $.cookie('requestSearch') != null ? $.cookie('requestSearch'):null;
        };
        service.setPlannedFilter = function(text) {
            let date = new Date();
            date.setTime(date.getTime() + (300 * 1000));
            $.cookie('plannedfilter', text, {
                expires: date,
                path: '/'
            });
        };
        service.getPlannedFilter = function() {
            return $.cookie('plannedfilter')!= null ? $.cookie('plannedfilter'):null;
        };

        /**
         * Fonctions pour l'accès REST API
         */
        var requests_copy = null;
        rest.getRequestDemands = function () {
            if (!currentPlanning) {
                return
            }
            service.setLoading(true);
            let params = {};
            let url = '/requestdemands';
            if (isPlanning()) {
                // si ffs et pas présent, envoie rien, a
                if (service.getDateFilter().filterDate == 0 && requestAlleged) {
                    url += '/planningrequestbyfarmers';
                } else {
                    url += '/planningrequest';
                }
                params.is_plan = service.getIsPlanned();
                params.planning_id = currentPlanning.id
                params.main_location = currentPlanning.main_location
                if (currentPlanning.main_location && $rootScope.mainLocationList[currentPlanning.main_location]) {
                    params.loc_value = $rootScope.mainLocationList[currentPlanning.main_location].loc_value
                }
                params.hide_send_requests = service.getHideSendRequests();
            } else {
                if (service.getShowOnlyMyRequests()) {
                    params.id = Session.userId();
                }
                params.on_hold = service.getHideOnHoldRequests();
            }


            if (service.getDateFilter().startDate !== "" && service.getDateFilter().endDate !== ""){
                params.dateStart = service.getDateFilter().startDate;
                params.dateEnd = service.getDateFilter().endDate;
            }
            $scope.requests = null;

            ApiRest.get(url, params, function(responseRequests) {
                $scope.requests = RequestDemandsService.filterGroup(responseRequests, $rootScope.planningsByService[activePlanning]);

                requests_copy =  angular.copy($scope.requests); // needed to update filter result when removing element from the  $scope.requests object
                $scope.totalItems = RequestDemandsService.countObject($scope.requests);
                service.setLoading(false);
            }, function(error) {
                console.error(error);
            });
        };

        rest.countRequestPlanning = function () {
            let filters = service.getIsPlanned() ?
                [{ "name": "is_planned", "value": "1"},
                    {"name": "plannings", "value": $.cookie('planningHome')},
                    {"name": "on_hold", "value": "0"},
                    {"name": "is_done", "value": "0"},
                    {"name": "is_finished", "value": "0"}
                ]:
                [{"name": "is_planned", "value": "0"},
                    {"name": "plannings", "value": $.cookie('planningHome')},
                    {"name": "on_hold", "value": "0"},
                    {"name": "is_done", "value": "0"},
                    {"name": "is_finished", "value": "0"}
                ];
                if (Session.branchId() == 2 && $.cookie('locpills')) {
                    filters.push({ name: 'main_location', value: $.cookie('locpills')})
                }
            Request.countRequests({
                filters: [filters],
                planned: false
            }, function (response) {
                service.setCountRequestPlanning(response[0]);
            })
        };

        /**
         * Fonctions du scope
         */
        $scope.currentPage = $stateParams.pagination ? Number($stateParams.pagination) : 0;
        $scope.current = $scope.currentPage > 0 ? $scope.currentPage - 1 : 0;
        $scope.pageSize = 8;
        $scope.pageChanged = function (pageNo) {
            $scope.currentPage = pageNo - 1 ;
            $scope.current = $scope.currentPage;
            $state.go($state.current.name, {
                pagination: $scope.currentPage + 1
            })
        };

        
        $scope.listOfTechTypes = ['writer']

        $scope.seeTechTypeSelect = false
        $scope.setListOfTechTypes = function () {
            if ($state.current.name !== "app.requestGroupPlanned") {
                return
            }
            // $state.current.name === "app.requestGroupPlanned"
            $scope.listOfTechTypes = ['writer']
            Object.keys($rootScope.planningsByService).forEach((id) => {
                if (id == activePlanning || id == activePlanning.id) {
                    if (Session.branchId() == 2 && ($rootScope.planningsByService[id].id == 'auditorium' || $rootScope.planningsByService[id].id == 'mix')) {
                        // and for rec and mix only, so planning auditorium or mix
                        $scope.listOfTechTypes = ['writer', 'editor']
                    }
                }
            })
            
            $scope.seeTechTypeSelect = true
        }
        $rootScope.writerMIssing = false
        $rootScope.editorMissing = false
        $rootScope.farmersWithWriterMissing = {}
        $rootScope.farmersWithEditorMissing = {}
        $scope.lostTechType = ''
        $scope.lookingForLostTech = function (type) {
            $rootScope.writerMIssing = false
            $rootScope.editorMissing = false
            $rootScope.farmersWithWriterMissing = {}
            $rootScope.farmersWithEditorMissing = {}
            if (!type) {
                return
            }
            if ($scope.requests) {
                Object.keys($scope.requests).forEach((request_name) => {
                    $scope.requests[request_name].requests.forEach((request) => {
                        request.ownFarmerbookings.forEach((farmer) => {
                            if (type == 'writer' && !farmer.tech_writer_id) {
                                $rootScope.farmersWithWriterMissing[farmer.id] = true
                                $rootScope.writerMIssing = true
                            }
                            if (Session.branchId() == 2 && type == 'editor' && (request.action_type.etape_type.name == 'enregistrement' || request.action_type.etape_type.name == 'mixage') && !farmer.tech_editor_id) {
                                $rootScope.editorMissing = true
                                $rootScope.farmersWithEditorMissing[farmer.id] = true

                            }
                        })
                    })
                })
            }
            $scope.lostTechType = null
            
        }

        // ne semble pas utilisé, note phv 20210107
        // $scope.plannings = angular.copy($rootScope.plannings)

        $scope.getDateFilter = function () {
            return service.getDateFilter();
        };
        $scope.setDateFilter = function(method, reload) {
            $scope.clearRangeDateFilter(false);
            service.setDateFilter(method, reload);
        };
        $scope.getShowOnlyMyRequests = function(){
            return service.getShowOnlyMyRequests();
        };
        $scope.setShowOnlyMyRequests = function(showOnlyMyRequests, reload){
            service.setShowOnlyMyRequests(showOnlyMyRequests, reload);
        };
        $scope.getHideOnHoldRequests = function(){
            return service.getHideOnHoldRequests();
        };
        $scope.setHideOnHoldRequests = function(hideOnHoldRequests, reload){
            service.setHideOnHoldRequests(hideOnHoldRequests, reload);
        };
        $scope.isLoading = function () {
            return service.isLoading();
        };
        $scope.showPill = function(idPill) {
            return service.showPill(idPill);
        };
        $scope.getActivePlanning = function() {
            return service.getActivePlanning();
        };
        $scope.changePlanning = function(planning) {
            service.changePlanning(planning);
        };
        $scope.getCountRequestPlanning = function(planningId) {
            return service.getCountRequestPlanning(planningId);
        };
        $scope.setHideSendRequests = function(hideRequests, reload) {
            service.setHideSendRequests(hideRequests, reload);
        };
        $scope.saveSearch = function (text) {
            $scope.resetContentscopeRequest();
            service.saveSearch(text);
        };

        $scope.rangeDateFilter = {};
        $scope.rangeDateFilter.enable = false;
        $scope.clearRangeDateFilter = function(status){
            $scope.rangeDateFilter.enable = status;
            $scope.rangeDateFilter.dateStart = ''; 
            $scope.rangeDateFilter.dateEnd ='';
            if(status)service.getDateFilter().filterDate = 'range'; 
        }

        
        $scope.$watchCollection('rangeDateFilter', function() {
            if( $scope.rangeDateFilter.dateStart != undefined  && $scope.rangeDateFilter.dateStart != ''  &&  $scope.rangeDateFilter.dateEnd != undefined  && $scope.rangeDateFilter.dateEnd != ''){
                Session.planningRequestRangeDatesStored.dateStart = $scope.rangeDateFilter.dateStart
                Session.planningRequestRangeDatesStored.dateEnd = $scope.rangeDateFilter.dateEnd
                service.setDateFilter('rangeDate', true);
            }
        })

        $scope.enableFilterWorkflow = false;
        $scope.resetContentscopeRequest = function () {
             $scope.requests =  angular.copy(requests_copy);
        }

        // $scope.$watch('textFilter', function(oldvalue, newvalue) {
        //     if(oldvalue !== newvalue){
        //      $scope.requests =  angular.copy(requests_copy);
        //     }
        // })
        

        /**
         * Fonctions locales au controleur
         */

        function isPlanning(){
            if($state.current.name === "app.requestGroupNonePlan"){
                service.setIsPlanned(0);
                return true;
            } else if($state.current.name === "app.requestGroupPlanned"){
                service.setIsPlanned(1);
                return true;
            } else return false;
        }

        function init() {
            $scope.textFilter = service.getSaveSearch();
            service.setHideOnHoldRequests(false, false);
            service.setShowOnlyMyRequests(true, false);
            service.getPlannedFilter() != null ?
                service.setDateFilter(service.getPlannedFilter(), false):
                service.setDateFilter('current', false);
            service.changePlanning();
            $scope.setListOfTechTypes()
            rest.getRequestDemands();
            rest.countRequestPlanning();
        }
        init();
    }]
);