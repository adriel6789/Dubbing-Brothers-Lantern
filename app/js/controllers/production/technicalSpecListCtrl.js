/**
 * Created by Marcel Tessier on 07/08/15.
 * appelé dans la page des specs techniques d'un client
 */

Lantern.controller('TechnicalSpecListCtrl', ['$rootScope', '$scope', '$q', '$cookies', '$stateParams', '$location', 
'Valuelist', 'Client', 'TechnicalSpec', 'TechnicalSpecInput', 'TechnicalSpecOutput', 
'StepsList', 'Step', 'ApiRest', '$stateParams', 'ValueListService', 'ClientService',
  function($rootScope, $scope, $q, $cookies, $stateParams, $location, 
    Valuelist, Client, TechnicalSpec, TechnicalSpecInput, TechnicalSpecOutput, 
    StepsList, Step, ApiRest, $stateParams, ValueListService, ClientService) {
    var rest = {};

    rest.getClient = function() {
      ApiRest.get('/clients/' + $stateParams.idClient, {}, function(response) {
          $scope.client = response;
        },
        function(error) {

        });
    };

    rest.getLangagesfilter = function() {
      ApiRest.get('/valuelists/languages', {}, function(response) {
          $scope.language_filter = response;
        },
        function(error) {

        });
    };

    rest.getLangagesfilter = function() {
      ApiRest.get('/valuelists/workflow_types', {}, function(response) {
          $scope.workflow_types = response;
        },
        function(error) {

        });
    };

    rest.init = function() {
      rest.getClient();
      rest.getLangagesfilter();
    }();
    $scope.specs = [];
    // $scope.client = Client.queryById({
    //   clientId: $stateParams.idClient
    // });

    $scope.filter = {};
    $scope.etapef = {};

    $scope.workflow_filter = [{
      "value": ValueListService.getWorkflowType1Name()
    }, {
      "value": "Mastering"
    }, {
      "value": "Servicing"
    }];
    $scope.workflow = [];
    $scope.workflow[1] = ValueListService.getWorkflowType1Name()
    $scope.workflow[2] = "Mastering";
    $scope.workflow[3] = "Servicing";

    $scope.languages_labo = ValueListService.getLanguageLabo()

    $scope.dynamic_processes = ValueListService.getDynamicProcesses()
    $scope.audio_processes = ValueListService.getAudioProcesses()

    $scope.subtitles = ValueListService.getTypesSubtitle()
    $scope.projector_aspects = ValueListService.getProjectorAspects()
    $scope.dcp_standards = ValueListService.getDCPStandards()
    $scope.nature_subtitle = ValueListService.getNatureSubtitle()

    function init() {
      // a remplacer par une requete, le service existe déjà
      var deferred = $q.defer();
      var p2 = Valuelist.query({
        tableName: 'format_mix'
      }, function(response) {
        $scope.format_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.formatmixs = t;
      });
      var p3 = Valuelist.query({
        tableName: 'norme_mix'
      }, function(response) {
        $scope.norme_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.normesmix = t;
      });
      var p4 = Valuelist.query({
        tableName: 'exploitation_types'
      }, function(response) {
        $scope.exploitation_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.exploitation_types = t;
      });
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
      var p7 = Valuelist.query({
        tableName: 'speed'
      }, function(response) {
        $scope.speed_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.speeds = t;
      });
      /*
      var p8 = Valuelist.query({
        tableName: 'doublage_types'
      }, function(response) {
        $scope.doublage_type_filter = response;
        var t = [];
        response.forEach(function(elem) {
          console.log(elem)
          t[elem.id] = elem.value;
        });
        $scope.doublage_types = t;
  
      });
      */
   
      $scope.doublage_types = [null]
      ValueListService.getDoublageTypes().forEach(function (item) {
        $scope.doublage_types[item.id] = item.value
      })

      var p9 = Valuelist.query({
        tableName: 'subproject_nature'
      }, function(response) {
        $scope.subproject_natures_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.subproject_natures = t;
      });
      var p10 = Valuelist.query({
        tableName: 'resolution_types'
      }, function(response) {
        $scope.resolutions_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.resolutions = t;
      });

      $scope.diffuseurs  = []
      const gotClients = function () {
        Object.keys($rootScope.broadcasters).forEach(function (id) {
          $scope.diffuseurs.push({ id: id, name: $rootScope.broadcasters[id].name})
        })
      }
      ClientService.getClientsByBroadcaster(gotClients)

      var p12 = Valuelist.query({
        tableName: 'layouts_types'
      }, function(response) {
        $scope.layouts_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.layouts = t;
      });
      var p12 = Valuelist.query({
        tableName: 'servicing_types'
      }, function(response) {
        $scope.servicing_types_filter = response;
        var t = [];
        response.forEach(function(elem) {
          t[elem.id] = elem.value;
        });
        $scope.servicing_types = t;
      });

      $q.all([
        p2.$promise,
        p3.$promise,
        p4.$promise,
        p5.$promise,
        p6.$promise,
        p7.$promise,
        // p8.promise,
        p9.$promise,
        p10.$promise,
        p12.$promise
      ]).then(function() {

        deferred.resolve();
      });

      return deferred.promise;
    }

    var promise = init();

    promise.then(function() {
      var filtersSpec = [{
        "name": "client_id",
        "value": $stateParams.idClient
      }, {
        "name": "client_spec",
        "value": 1
      }];
      TechnicalSpec.queryByFilters({
        filters: [filtersSpec]
      }, function(specs) {
        specs.forEach(function(spec) {
          spec.workflow_type_name = ValueListService.getWorkflowType1Name()
          spec.etape_type_name = $scope.etapes_types[spec.etape_type_id];
          spec.action_type_name = $scope.action_types[spec.action_type_id];
          spec.exploitation_name = $scope.exploitation_types[spec.exploitation_id];
          spec.format_name = $scope.formatmixs[spec.format_mix_id];
          spec.norme_name = $scope.normesmix[spec.norme_mix_id];
          spec.speed_name = $scope.speeds[spec.speed_id];
          spec.doublage_type_name = $scope.doublage_types[spec.doublage_type_id];
          spec.subproject_nature_name = $scope.subproject_natures[spec.subproject_nature_id];

          spec.resolution_name = $scope.resolutions[spec.resolution_id]

          spec.layout_name = $scope.layouts[spec.layout_id]
          spec.diffuseur_name = $scope.diffuseurs[spec.diffuseur_id]
          spec.servicing_type_name = $scope.servicing_types[spec.servicing_type_id]

          //A changer après avec les bonnes langues
          spec.language_name = spec.language;

          $scope.specs.push(spec)
        })
      });
    });

    $scope.customFilter = function(item) {

      var validFilter = false;
      angular.forEach($scope.filter, function(aFilter, index) {
        if (typeof(aFilter) == "undefined") {
          delete $scope.filter[index];
        } else if (aFilter != null) {
          validFilter = true;
        }
      });

      if (validFilter) {
        var valid = true;
        angular.forEach($scope.filter, function(aFilter, index) {
          if (typeof(item[index]) != "undefined" && item[index] != null) {
            if (item[index] != aFilter) {
              valid = false;
            }
          }
        });
        return valid;
      } else {
        return true;

      }

      return false;

    };

    $scope.allSteps = [];
    $scope.list = {};
    $scope.list.workflow_type_id = null;
    $scope.list.title = '';
    $scope.position = 0;

    $scope.addList = function(spec) {
      var step = new Step();

      step.etape_type_name = spec.etape_type_name;
      step.etape_type_id = spec.etape_type_id;
      step.action_type_name = spec.action_type_name;
      step.action_type_id = spec.action_type_id;

      $scope.position++;
      step.position = $scope.position;

      $scope.allSteps.push(step);
    };

    $scope.removeFromList = function(index) {
      $scope.allSteps.splice(index, 1);
    };

    $scope.duplicateList = function(spec) {
      TechnicalSpec.queryBy({
        id: spec.id
      }, function(response) {
        var newSpec = angular.copy(response);
        delete newSpec.id;

        newSpec.$save({}, function(newSpecResponse) {
          var filter = [{
            "name": "techspec_id",
            "value": response.id
          }];

          TechnicalSpecInput.getSpecInputBy({
            filters: [filter]
          }, function(inputs) {
            inputs.forEach(function(input) {
              var newInput = angular.copy(input);
              newInput.techspec_id = newSpecResponse.id;
              delete newInput.id;
              newInput.$save();
            });
          });

          TechnicalSpecOutput.getSpecOutputBy({
            filters: [filter]
          }, function(outputs) {
            outputs.forEach(function(output) {
              var newOutput = angular.copy(output);
              newOutput.techspec_id = newSpecResponse.id;
              delete newOutput.id;
              newOutput.$save();
            });

            swal({
                title: $rootScope._T["u8t4kvmz"],
                text: $rootScope._T["6th5xc3a"],
                type: "success"
              },
              function() {
                window.location.href = "#/technicalSpecEdit/" + newSpecResponse.id;
              });
          });
        });
      });
    };

    $scope.createList = function() {

      var newStepList = new StepsList();
      newStepList.title = $scope.list.title;
      newStepList.client_id = $scope.client.id;
      newStepList.type_workflow = $scope.list.workflow_type_id;

      newStepList.$save({}, function(stepList) {
        $scope.allSteps.forEach(function(step) {
          delete step.etape_type_name;
          delete step.action_type_name;
          step.stepslist_id = stepList.id;
          step.$save();
        });
        swal({
            title: $rootScope._T["70jumwe9"],
            text: $rootScope._T["gp4nqhxw"],
            type: "success"
          },
          function() {
            window.location.reload();
          });
      });

      $scope.position = 0;
    };

  }
]);