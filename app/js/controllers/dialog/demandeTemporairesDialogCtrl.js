
// DEPRECATED ?? semble inutilisé
// appelé dans le fichier index, mais utilisé nulle part (note phv 20210118)
// retiré de index 20230125

Lantern.controller('DemandesTemporairesDialog', ['$scope', '$location', '$filter', 'ngDialog', '$stateParams', 'Farmer', 'Request',
    function ($scope, $location, $filter, ngDialog, $stateParams, Farmer, Request)
    {

        var role = $.cookie('role');
        if (role == "all" || role == "technicien")
        {

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            var today = yyyy + '-' + mm + '-' + dd;

            if ($scope.is_group) {
                $scope.allRequests = $scope.requests;
            } else {
                $scope.allRequests = [$scope.mainRequest];
            }

            $scope.allRequests.forEach(function (request) {
                request.state = 'finished';

                if (request.farmerID == null) {
                    request.disabled = true;
                }
            });

            $scope.toogleRequest = function (request) {
                if (request.disabled != true) {
                    switch (request.state) {
                        case 'finished':
                            request.state = 'in_progress';
                            break;
                        case 'in_progress':
                            request.state = 'not_done';
                            break;
                        case 'not_done':
                            request.state = 'finished';
                            break;
                        default:
                            request.state = 'finished';
                            break;
                    }
                }
            };

            $scope.hasFinalisedRequests = function () {
                var hasOne = false;

                angular.forEach($scope.allRequests, function (object) {
                    if ((object.state == 'in_progress' || object.state == 'finished') && object.disabled != true) {
                        hasOne = true;
                    }
                });

                return hasOne;
            };

            $scope.working_time_start = null;
            $scope.working_time_end = null;


            $scope.validate = function () {

                var count = 0;
                var total = $filter('filter')($scope.allRequests, {disabled: "!true"}).length;

                //console.log($scope.working_time_start);
                var startMoment = moment($scope.working_time_start, "HH:mm");
                var endMoment = moment($scope.working_time_end, "HH:mm");

                var diffTime = parseInt(endMoment.diff(startMoment, 'minutes'));

                var requestsFinished = $filter('filter')($scope.allRequests, {state: 'finished', disabled: '!true'});
                var requestsInProgress = $filter('filter')($scope.allRequests, {state: 'in_progress', disabled: '!true'});

                var countTime = 0;
                var totalTime = requestsFinished.length + requestsInProgress.length;
                //console.log("Total Time : " + totalTime);
                //console.log("Diff Time : " + diffTime);

                $scope.allRequests.forEach(function (request) {
                    if (request.disabled != true) {
                        switch (request.state) {
                            case 'finished':
                                //Calcul des temps pour chaque demande
                                var startCopy = angular.copy(startMoment);
                                var endCopy = angular.copy(startMoment);
                                var newStartTime = null;

                                var calcSec = parseInt(countTime * Math.round(diffTime / totalTime));
                                if (calcSec != 0) {
                                    newStartTime = startCopy.add(calcSec, 'minutes');
                                } else {
                                    newStartTime = startCopy;
                                }
                                var newEndTime = endCopy.add((countTime + 1) * Math.round(diffTime / totalTime), 'minutes');
                                //console.log(newStartTime.format('HH:mm'));
                                //console.log(newEndTime.format('HH:mm'));

                                //Fin calcul
                                countTime++;
                                var newFarmer = new Farmer();
                                newFarmer.break_time = Math.round($scope.break_time / totalTime);
                                newFarmer.working_time_start = today + " " + newStartTime.format('HH:mm');
                                newFarmer.working_time_end = today + " " + newEndTime.format('HH:mm');
                                newFarmer.request_id = $stateParams.id;
                                if (request.farmerID != null) {
                                    newFarmer.$update({id: request.farmerID}, function () {
                                        var newRequest = new Request();
                                        newRequest.is_done = true;
                                        newRequest.is_not_done = false;
                                        newRequest.is_in_progress = false;

                                        newRequest.$update({requestId: request.id}, function () {
                                            count++;
                                            if (count == total) {
                                                ngDialog.close();
                                                $location.path("/recordsValidated");
                                            }
                                        });
                                    });
                                } else {
                                    console.log("No valid Farmer booking for request id " + request.id);
                                }

                                break;
                            case 'in_progress':
                                //Calcul des temps pour chaque demande
                                var startCopy = angular.copy(startMoment);
                                var endCopy = angular.copy(startMoment);
                                var newStartTime = null;

                                var calcSec = parseInt(countTime * Math.round(diffTime / totalTime));
                                if (calcSec != 0) {
                                    newStartTime = startCopy.add(calcSec, 'minutes');
                                } else {
                                    newStartTime = startCopy;
                                }
                                var newEndTime = endCopy.add((countTime + 1) * Math.round(diffTime / totalTime), 'minutes');
                                //Fin calcul
                                countTime++;

                                var newFarmer = new Farmer();
                                newFarmer.break_time = Math.round($scope.break_time / totalTime);
                                newFarmer.working_time_start = today + " " + newStartTime.format('HH:mm');
                                newFarmer.working_time_end = today + " " + newEndTime.format('HH:mm');
                                newFarmer.request_id = $stateParams.id;
                                if (request.farmerID != null) {
                                    newFarmer.$update({id: request.farmerID}, function () {
                                        var newRequest = new Request();
                                        newRequest.is_in_progress = true;
                                        newRequest.is_not_done = false;
                                        newRequest.is_done = false;
                                        newRequest.$update({requestId: request.id}, function () {
                                            count++;
                                            if (count == total) {
                                                ngDialog.close();
                                                $location.path("/recordsValidated");
                                            }
                                        });
                                    });
                                } else {
                                    console.log("No valid Farmer booking for request id " + request.id);
                                }

                                break;
                            case 'not_done':
                                var newRequest = new Request();
                                newRequest.is_not_done = true;
                                newRequest.is_done = false;
                                newRequest.is_in_progress = false;
                                newRequest.$update({requestId: request.id}, function () {
                                    count++;
                                    if (count == total) {
                                        ngDialog.close();
                                        $location.path("/recordsValidated");
                                    }
                                });
                                break;
                            default:
                                break;
                        }
                    }
                });
            };
        }

    }
]);