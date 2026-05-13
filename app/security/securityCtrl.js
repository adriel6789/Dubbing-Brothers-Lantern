Lantern.controller('SecurityCtrl',['$rootScope', '$filter', '$scope', 'ApiRest', '$q', '$interval','PersonsService', 'FarmerService', 
'Notification', 'Comment', '$stateParams', '$state', 'Request','RoomService', 'ClientService',
    function($rootScope, $filter, $scope, ApiRest, $q, $interval, PersonsService, FarmerService, Notification, 
        Comment, $stateParams, $state, Request, RoomService, ClientService) {
        /**
         * Variable declaration
         */
        let rooms = []
        let service = {};
        let stages = {}
        let artisticDirectors = [];
          

        /**
         * Fonctions appelant des évènements correspondant aux services
         */
        
        service.getArtisticDirectors = () => artisticDirectors;
        service.setArtisticDirector = (farmerToUpdate, artisticDirector) => {

            let requestData = { artistic_director_id: artisticDirector.id };
            FarmerService.updateFarmerbookingsDefer(farmerToUpdate.id, requestData).then(function (farmer) {
                farmerToUpdate.artistic_director = {};
                farmerToUpdate.artistic_director.firstname = artisticDirector.firstname;
                farmerToUpdate.artistic_director.lastname = artisticDirector.lastname;

                if(farmer.request != null)
                    newActivityLogRequest(new Comment(), $.cookie('user_id'), farmer.request.id, $rootScope._T["v8ovg3fq"]);
                service.setAlertMessage($rootScope._T["r9lhtu17"], false);
                service.setShowEditForm(farmerToUpdate, false);
            }, function (error) {
                service.setAlertMessage($rootScope._T["jhvhtkwu"], true);
                console.error(error);
            });
        };

        service.setAlertMessage = function(messageString, isError) {
            isError?Notification.error(messageString):Notification.success(messageString);
        };

        service.setShowEditForm = (object, value) => object.showEditForm = value;

        /**
         * Fonctions pour l'accès REST API
         */

        PersonsService.getArtisticDirectors(function(directors) {
            artisticDirectors = directors;
        });


        /**
         * Fonctions du scope
         */

        $scope.getStages = () => stages;
        $scope.isRecord = (farmer) => farmer.etape.split(' ')[0].toLowerCase() === 'enregistrement';
        $scope.getArtisticDirectors = () => service.getArtisticDirectors();
        $scope.setArtisticDirector = (farmer, artistic_director) => service.setArtisticDirector(farmer, artistic_director);

        $scope.getShowEditForm = (object) => object.showEditForm;
        $scope.setShowEditForm = (object, value) => service.setShowEditForm(object, value);

        /**
         * Fonctions locales au controleur
         */

        $interval(() => {
            if ($rootScope.user_entity.person.branch_id == 1) {
                $scope.today = moment().format("dddd DD MMMM YYYY à HH:mm:ss")
            } else if ($rootScope.user_entity.person.branch_id == 2) {
                $scope.today = moment().format("dddd DD MMMM YYYY  HH:mm:ss")
            } else if ($rootScope.user_entity.person.branch_id == 4) {
                $scope.today = moment().format("dddd DD MMMM YYYY  HH:mm:ss")
            } else if ($rootScope.user_entity.person.branch_id == 3) {
                $scope.today = moment().format("dddd DD MMMM YYYY  hh:mm:ss A")
            }
            // récupère les données à 0,15,30,45
            if (parseInt(moment().format("mm")) % 15 === 0 && parseInt(moment().format("ss")) === 0) {
                FarmerService.getAllFarmersByDay(gotFarmers, failedFarmerRequest)          
            }

        }, 1000);

        const gotFarmers = function (result) {
            const byAudit = {}
            result.forEach(function (farmer) {
                if (!byAudit[farmer.audit]) {
                    byAudit[farmer.audit] = []
                }
                farmer.client = $rootScope.clients[farmer.client_id]
                if (farmer.action_name == 'enr_chansons' || farmer.action_name == 'mixage_chansons' || farmer.action_name == 'enr_essais_chansons' || farmer.action_name == 'doublage_enr_belgique_chansons') {
                    if (farmer.sub_co_da_id && $rootScope.directors[farmer.sub_co_da_id]) {
                        farmer.da = $rootScope.directors[farmer.sub_co_da_id].firstname + ' ' +  $rootScope.directors[farmer.sub_co_da_id].lastname
                    }
                    if (farmer.song_director_id && $rootScope.directors[farmer.song_director_id]) {
                        farmer.da = $rootScope.directors[farmer.song_director_id].firstname + ' ' +  $rootScope.directors[farmer.song_director_id].lastname
                    }
                    if (!farmer.da && farmer.artistic_director_id && $rootScope.directors[farmer.artistic_director_id]) {
                        farmer.da = $rootScope.directors[farmer.artistic_director_id].firstname + ' ' +  $rootScope.directors[farmer.artistic_director_id].lastname
                    }
                } else {
                    if (farmer.artistic_director_id && $rootScope.directors[farmer.artistic_director_id]) {
                        farmer.da = $rootScope.directors[farmer.artistic_director_id].firstname + ' ' +  $rootScope.directors[farmer.artistic_director_id].lastname
                    }
                }
                byAudit[farmer.audit].push(farmer)
            })
            Object.keys(stages).forEach(function (place) {
                stages[place].forEach(function (room) {
                    if (byAudit[room.name]) {
                        room.farmers = byAudit[room.name]
                    } else if (byAudit[room.long_name]) {
                        room.farmers = byAudit[room.long_name]
                    }
                })
            })
        }

        const failedFarmerRequest = function (response) {
        }

        function setStages () {
            stages = RoomService.getStagesByBranch(rooms)
            FarmerService.getAllFarmersByDay(gotFarmers, failedFarmerRequest)
        }

        const getClientsSuccessful = function () {
            $scope.clients = $rootScope.clients
            setStages()
        }
        const getClientsFailed = function () {

        }

        const getRoomSuccessful = function (response) {
            rooms = response
            init();
        }

        RoomService.getRooms( 
            getRoomSuccessful,
            function () {
                Notification.error('unable to  get rooms, probably an error with the database')
            }
        )        

        // Récupère les clients
        // puis les salles
        // Avant de récupérer les farmers
        function init() {
            $scope.transformHourInI18nFormat = transformHourInI18nFormat($rootScope.user_entity.person.branch_id)
            ClientService.getAllClients(getClientsSuccessful,getClientsFailed)
        }
        
    }]
);
