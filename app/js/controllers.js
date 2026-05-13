//'use strict';
/* Controllers */
// DEPRECATED, aucun appel nulle part (note phv 20210118)

Lantern.controller('RecordsValidatedDetailCtrl', ['$rootScope', '$scope', '$cookies', 'ngDialog', '$stateParams', 'Product', 'Record', 'Observation', 'Return',
    function ($rootScope, $scope, $cookies, ngDialog, $stateParams, Product, Record, Observation, Return)
    {
        $scope.obsCount = 0;
        $scope.obsRow = 0;
        $scope.retCount = 0;
        $scope.retRow = 0;
        var role = $.cookie('role');
        if (role == "all" || role == "technicien")
        {

            $('#updateRecord').hide();
            var product;
            $scope.record = Record.queryFalse({recordId: $stateParams.id});
            $scope.record.$promise.then(function (record) {
                if (record.is_validated_for_tech == "0" || record.state !== "0")
                {
                    window.location.href = "#/recordsValidated";
                }
                else
                {
                    product = Product.queryFalse({productId: record.product_id});
                    $scope.product = product;
                }
            });
            $('.disabled').click(function () {
                $('#updateRecord').show();
            });
            $scope.updateRecord = function () {

                var action = $('#action').val();
                var delai = $('#delai').val();
                var infoprod_produit = $('#infoprod_produit').val();
                var infoplanning_tehnician = $('#infoplanning_tehnician').val();
                var newRecord = new Record();
                newRecord = $scope.record;
                newRecord.action = action;
                newRecord.input_delai_souhaite = delai;
                newRecord.input_infoprod_produit = infoprod_produit;
                newRecord.input_infoplanning_tehnician = infoplanning_tehnician;
                newRecord.$update({recordId: $stateParams.id}, function () {
                    alert($rootScope._T["jvc1km3e"]);
                });
            };
            $scope.deleteRecord = function ()
            {
                var newRecord = new Record();
                newRecord = $scope.record;
                newRecord.$delete({recordId: $stateParams.id}, function () {
                    alert($rootScope._T["0b4cy4au"]);
                    window.location.href = "#/recordsDone";
                });
            }


            $scope.doneRecord = function () {

                ngDialog.open({
                    template: 'views/Dialog/DemandesValidees.html',
                    scope: $scope,
                    controller: 'DemandesValideesDialog'
                });
            };
            $scope.myObservations = Observation.querybyrequestid({request_id: $stateParams.id});
            $scope.addObservations = function () {

                var observ = new Observation();
                $scope.myObservations.push(observ);
            };
            $scope.emptyObs = function () {

                $scope.myObservations.forEach(function (aObs) {

                    if (aObs.id != null)
                    {
                        aObs.$delete({id: aObs.id});
                    }

                });
                $scope.myObservations = [];
            }

            $scope.publishObs = function () {

                $scope.myObservations.forEach(function (aObs) {
                    aObs.request_id = $stateParams.id;
                    aObs.$save({});
                });
            }


            $scope.deleteThisObs = function (indexObs) {

                var myObs = $scope.myObservations[indexObs];
                $scope.myObservations.splice(indexObs, 1);
                if (myObs.id != null)
                    myObs.$delete({id: myObs.id});
            }


            $scope.myReturns = Return.querybyrequestid({request_id: $stateParams.id});
            $scope.addRetours = function () {

                var ret = new Return();
                $scope.myReturns.push(ret);
            };
            $scope.emptyRet = function () {

                $scope.myReturns.forEach(function (aRet) {

                    if (aRet.id != null)
                    {
                        aRet.$delete({id: aRet.id});
                    }

                });
                $scope.myReturns = [];
            }

            $scope.deleteThisRet = function (indexRet) {

                var myRet = $scope.myReturns[indexRet];
                $scope.myReturns.splice(indexRet, 1);
                if (myRet.id != null)
                    myRet.$delete({id: myRet.id});
            }

            $scope.publishRet = function () {

                $scope.myReturns.forEach(function (aRet) {

                    aRet.request_id = $stateParams.id;
                    if (aRet.tc_global == 1)
                    {
                        aRet.tc_in = "";
                        aRet.tc_out = "";
                    }
                    aRet.$save({}, function () {
                        $scope.myReturns = Return.querybyrequestid({request_id: $stateParams.id});
                    });
                });
            }


        }
        else
        {
            alert($rootScope._T["t5hjtmmv"]);
            //history.go(-1);
        }

    }]);

Lantern.controller('RecordDetailCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', 'Product', 'Record',
    function ($rootScope, $scope, $cookies, $stateParams, Product, Record) {
        if ($rootScope.canDisplay(15)) {
            $('#updateRecord').hide();
            var product;
            $scope.record = Record.queryFalse({recordId: $stateParams.id});
            $scope.record.$promise.then(function (record) {
                product = Product.queryFalse({productId: record.product_id});
                $scope.product = product;
            });
            $('.disabled').click(function () {
                $('#updateRecord').show();
            });
            $scope.deleteRecord = function ()
            {
                var newRecord = new Record();
                newRecord = $scope.record;
                newRecord.$delete({recordId: $stateParams.id}, function () {
                    alert($rootScope._T["0b4cy4au"]);
                    window.location.href = "#/records";
                });
            }

            $scope.updateRecord = function () {

                var action = $('#action').val();
                var delai = $('#delai').val();
                var infoprod_produit = $('#infoprod_produit').val();
                var infoplanning_tehnician = $('#infoplanning_tehnician').val();
                var newRecord = new Record();
                newRecord = $scope.record;
                newRecord.action = action;
                newRecord.input_delai_souhaite = delai;
                newRecord.input_infoprod_produit = infoprod_produit;
                newRecord.input_infoplanning_tehnician = infoplanning_tehnician;
                delete newRecord.ownFarmerbookings;
                newRecord.$update({recordId: $stateParams.id}, function () {
                    alert($rootScope._T["jvc1km3e"]);
                });
            };
            $scope.planRecord = function () {

                var newRecord = new Record();
                newRecord = $scope.record;
                newRecord.isPlanned = 1;
                delete newRecord.ownFarmerbookings;
                newRecord.$update({recordId: $stateParams.id}, function () {
                    alert($rootScope._T["0tvd9ksw"]);
                    window.location.href = "#/records";
                });
            };
        }
        else
        {
            alert($rootScope._T["t5hjtmmv"]);
            //history.go(-1);
        }


    }]);
