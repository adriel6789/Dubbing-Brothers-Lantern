Lantern.controller('ServiceAttributionDialogCtrl', ['$rootScope', '$scope', '$filter', 'ngDialog', 'Request', 'Product', 'User', 'Group',
    function ($rootScope, $scope, $filter, ngDialog, Request, Product, User, Group)
    {
        if ($rootScope.canDisplay(7))
        {
            $scope.allTechs = [];
            Group.query({groupId:$scope.requestsToSend[0].service_id}, function (group) {

                group.sharedUser.forEach(function (tech) {
                    tech.name = tech.firstname + " " + tech.lastname;
                    $scope.allTechs.push(tech);
                });
            });

            $scope.sendRequests = function () {

                var count = 0;
                var size = $scope.requestsToSend.length;
                $scope.requestsToSend.forEach(function (request, index) {
                    var newRequest = new Request();
                    if ($scope.tech_writer != null) {
                        newRequest.technician_id = $scope.tech_writer.id;
                    } else {
                        newRequest.technician_id = null;
                    }
                    newRequest.$update({requestId: request.id}, function () {
                        count++;
                        if (count == size) {
                            ngDialog.close();
                        }
                    });
                });
            };

        }
        else
        {
            alert($rootScope._T["t5hjtmmv"]);
            //history.go(-1);
        }


    }]);
