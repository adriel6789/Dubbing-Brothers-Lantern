/**
 * Created by Marcel Tessier on 07/08/15.
 */

Lantern.controller('StepListCtrl', ['$scope', '$q', '$cookies', '$stateParams', '$location', 'Valuelist', 'Client', 'StepsList',
  function($scope, $q, $cookies, $stateParams, $location, Valuelist, Client, StepsList) {

    $scope.steps = [];
    $scope.client = Client.queryById({
      clientId: $stateParams.idClient
    });

    $scope.filter = {};
    $scope.etapef = {};
    $scope.workflow_filter = [{
      "value": "Doublage"
    }, {
      "value": "Mastering"
    }, {
      "value": "Servicing"
    }];
    $scope.workflow = [];
    $scope.workflow[1] = "Doublage";
    $scope.workflow[2] = "Mastering";
    $scope.workflow[3] = "Servicing";

    function init() {
      var deferred = $q.defer();

      var p5 = Valuelist.getEtapeTypes(function(response) {
        $scope.etape_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.etapes_types = t;
      });
      var p6 = Valuelist.query({
        tableName: 'action_types'
      }, function(response) {
        $scope.action_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.action_types = t;
      });

      $q.all([
        p5.$promise,
        p6.$promise
      ]).then(function() {

        deferred.resolve();
      });

      return deferred.promise;
    }

    var promise = init();

    promise.then(function() {
      var filtersStep = [{
        "name": "client_id",
        "value": $stateParams.idClient
      }];
      StepsList.getStepsListBy({
        filters: [filtersStep]
      }, function(specs) {
        specs.forEach(function(spec) {
          spec.workflow_type_name = $scope.workflow[spec.type_workflow];

          $scope.steps.push(spec);
        });
      });
    });

  }
]);