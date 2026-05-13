Lantern.controller('InternalRequestValidatedDialog', ['$rootScope', '$scope', '$location', '$filter', 'ngDialog', '$stateParams', 'Request', 'NotificationService', 'Comment', 'sharedServices',
    function ($rootScope, $scope, $location, $filter, ngDialog, $stateParams, Request, NotificationService, Comment, sharedServices)
    {

        if ($rootScope.canDisplay(25)) {

            $scope.actionToUpdateStatusInternal = function(is_done, is_in_progress, is_not_done) {
                    $scope.mainRequest.is_done = is_done;
                    $scope.mainRequest.is_in_progress = is_in_progress;
                    $scope.mainRequest.is_not_done = is_not_done;
            }

            $scope.takeRequest = function () {

                let requestsSelected = [];
                requestsSelected.push($scope.mainRequest);

                let count = requestsSelected.length;
                angular.forEach(requestsSelected, function (request) {
                    let newRequest = new Request();
                    newRequest.is_planned = true;
                    newRequest.is_validated_for_tech = true;
                    newRequest.date_send_tech = todaySQL;
                    newRequest.planification_date = todaySQL;
                    newRequest.tech_writer_id = $.cookie('user_id');
                    newRequest.date_start = null;
                    newRequest.date_end = null;
                    newRequest.date_start_time = null;
                    newRequest.date_end_time = null;
                    newRequest.$update({
                    requestId: request.id
                    }, function (newRequest) {
                        count--;
                        if (count == 0) {

                            let notifDesc = $rootScope._T['2lx4lzvm']
                            notifDesc += "<br/>" + $rootScope._T['ageoqhbl'] + " " + newRequest.tech_writer_user.person.firstname + " " + newRequest.tech_writer_user.person.lastname;

                            angular.forEach(requestsSelected, function (req) {
                                newActivityLogRequest(new Comment(), $.cookie('user_id'), req.id, $rootScope._T["aqychsu5"], newRequest.date_start, newRequest.date_end);
                                req.tech_writer_user = newRequest.tech_writer_user;
                                req.tech_writer_id = newRequest.tech_writer_id;
                            });
                            sendStandardNotif(
                                new NotificationService(),
                                requestsSelected,
                                "production",
                                $rootScope._T['nl4t04um'],
                                notifDesc,
                                $filter,
                                "planification",
                                $rootScope
                            );
                            $scope.validateInternalRequest();
                        }
                    });
                });
            }

            $scope.validateInternalRequest = function () {

                var updateRequest = new Request();
                if ($scope.mainRequest.is_done == 1) {
                    updateRequest.is_done = 1;
                }

                if ($scope.mainRequest.is_in_progress == 1) {
                    updateRequest.is_done = 1;
                    updateRequest.is_partial = 1;
                }

                if ($scope.mainRequest.is_not_done == 1) {
                    updateRequest.is_done = 0;
                    updateRequest.is_partial = 0;
                    updateRequest.is_not_done = 1;
                }else{
                    updateRequest.is_not_done = 0;
                }

                updateRequest.closing_date = todaySQL;

                //Si c'est une demande en volume, on fait le rendu aussi et on redirige vers une autre page
                if ($scope.validateVolume != null && $scope.validateVolume) {
                    var notif = new NotificationService();
                    var request = $scope.mainRequest;

                    notif.services = "planning,production";
                    notif.type = "home";
                    notif.request_id = request.id;
                    notif.product_desc = request.product.human_description;
                    notif.project_id = request.product.subproject.project.id;
                    notif.planning_id = request.planning_id;
                    notif.archived = 0;
                    notif.etape_action = request.action_type.etape_type.value + " - " + request.action_type.value;
                    notif.origin_user_id = $.cookie('user_id')

                    //On casse automatiquement le groupe
                    //updateRequest.in_group = 0;
                    updateRequest.is_sent_back = 1;
                    updateRequest.is_archived = 0;

                    if (request.is_partial == 1) {
                        // A replanifier
                        notif.replan = true;
                        updateRequest.is_not_done = 1;
                        updateRequest.is_done = 0;
                        updateRequest.is_in_progress = 0;
                        notif.description = $rootScope._T['kochluzl']
                    } else if (request.is_not_done == 1) {
                        // A replanifier
                        notif.replan = true;
                        notif.description = $rootScope._T['kochluzl']
                    } else if (request.is_done == 1) {
                        notif.is_done = true;
                        notif.description = $rootScope._T['ho2re2fn']
                    }

                    //Patch pour désactiver si la demande est avec retour, on ne l'a met pas en terminée
                    if (notif.has_return && notif.is_done) {
                        notif.is_done = null;
                    }

                    updateRequest.$update({requestId: request.id}, function () {
                        notif.$save();
                        newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["3c3s4epd"])
                        // case Request related to Package PDS delivery update fields EDD / Workability/ Status  on phelix side 
                        sharedServices.launchUpdatePhelixJoblinesFields(request, updateRequest) ;
                        swal($rootScope._T["70jumwe9"], $rootScope._T["gxtcdjdl"], "success");
                        ngDialog.close();
                        $location.path("/requestsAutoTech");
                    });
                } else {
                    updateRequest.$update({requestId: $scope.mainRequest.id}, function () {
                        $.cookie("returnDemand", "true", {path: '/', expires: 1});
                        swal($rootScope._T["70jumwe9"], $rootScope._T["f7z49044"], "success");
                        newActivityLogRequest(new Comment(), $.cookie('user_id'), $scope.mainRequest.id, $rootScope._T["3c3s4epd"])
                        ngDialog.close();
                        $location.path("/requestsValidated");
                    });
                }
            };
        }
    }
]);
