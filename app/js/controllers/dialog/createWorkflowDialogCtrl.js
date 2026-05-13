Lantern.controller('CreateWorkflowDialogCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 
'Valuelist', 'Workflow', 'TechnicalSpec', 'StepsList', 'Step', 'Client', 'ValueListService', 'ClientService', 'Session',
  function($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, 
    Valuelist, Workflow, TechnicalSpec, StepsList, Step, Client, ValueListService, ClientService, Session) {
    $scope.steps = [{
      step: 1,
      title: $rootScope._T["2f1m5jxo"],
    }, {
      step: 2,
      title: $rootScope._T["uu0098tx"]
    }];
    $scope.step = 1;
    $scope.nextStep = function() {
      $scope.step += 1;
    };
    $scope.previousStep = function() {
      $scope.step -= 1;
    };
    $scope.selectProduct = function(product) {
      if (product.selected) {
        product.selected = false
      } else {
        product.selected = true;
        $scope.disabledButtons = false
      }
    };

    $scope.selectWorkflowType = function(item) {
      $scope.workflow_model = {};
      $scope.workflow_model.prod_version = "Client";
      $scope.workflow_model.workflow_type = item;
      $scope.workflow_model.dub_place = $scope.dub_places[0] // "France";

      //Init DolbyE
      $scope.workflow_model.dolbye = false
      if ($scope.branch_id == 2) {
        $scope.workflow_model.main_location = { key: 1, value: $scope.mainLocationList[1] }
      }
    };

    if ($scope.subproject_workflow == null) {
      var subproject_workflow = $scope.subproject;
      $scope.subproject_workflow = subproject_workflow;
    }

    $scope.workflow_types = ValueListService.getWorkflowTypes()

    $scope.disabledButtons = false;
    $scope.branch_id = Session.branchId()

    /* Partie doublage */

    $scope.formatmixs = ValueListService.getFormatMix()
    $scope.normesmix = Valuelist.query({
      tableName: 'norme_mix'
    });
    $scope.exploitation_types =ValueListService.getExploitationTypes()
    
    $scope.speeds = Valuelist.query({
      tableName: 'speed'
    });
    $scope.doublage_types = ValueListService.getDoublageTypes()
    $scope.languages = Valuelist.query({
      tableName: 'languages'
    });
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



    /* Partie Servicing */
    $scope.servicing_types = Valuelist.query({
      tableName: 'servicing_types'
    });

    //Filtre pour récupérer le type diffuseur

    $scope.diffuseurs  = []

    const gotClients = function () {
      Object.keys($rootScope.broadcasters).forEach(function (id) {
        $scope.diffuseurs.push({ id: id, name: $rootScope.broadcasters[id].name})
      })
    }
    ClientService.getClientsByBroadcaster(gotClients)

    $scope.resolutions = Valuelist.query({
      tableName: 'resolution_types'
    });
    $scope.languages_labo = ValueListService.getLanguageLabo()
    $scope.layouts = Valuelist.query({
      tableName: 'layouts_types'
    });
    $scope.dynamic_processes = ValueListService.getDynamicProcesses()
    $scope.audio_processes = ValueListService.getAudioProcesses()
    $scope.subtitles = ValueListService.getTypesSubtitle()
    $scope.projector_aspects = ValueListService.getProjectorAspects()
    $scope.dcp_standards = ValueListService.getDCPStandards()
    $scope.nature_subtitle = ValueListService.getNatureSubtitle()


    $scope.workflow_model = {};
    $scope.workflow_model.prod_version = "Client"

    $scope.selectAll = function() {
      $scope.subproject_workflow.ownProduct.forEach(function(product) {
        product.selected = !$scope.masterCheckbox;
      });
    };

    $scope.selectWorkflowType = function(item) {
      $scope.workflow_model = {};
      $scope.workflow_model.prod_version = "Client";
      $scope.workflow_model.workflow_type = item;
      $scope.workflow_model.dub_place = $scope.dub_places[0] // "France";

      //Init DolbyE
      $scope.workflow_model.dolbye = false
      if ($scope.branch_id == 2) {
        $scope.workflow_model.main_location = { key: 1, value: $scope.mainLocationList[1] }
      }
    };

    $scope.servicing_type = null;
    $scope.selectServicingType = function(item) {
      $scope.servicing_type = item.name;
    };

    $scope.createNewWorkflows = function(products) {
      $scope.disabledButtons = true
      $scope.generationList = true
      var productSelected = $filter('filter')(products, {
        selected: true
      });
      var allProducts = [];
      if (productSelected.length != 0) {
        productSelected.forEach(function(product) {
          allProducts.push(product.id);
        });
        
        const newWorkflow = new Workflow();

        newWorkflow.workflow_type_id = $scope.workflow_model.workflow_type.id;
        newWorkflow.exploitation_id = $scope.workflow_model.exploitation_id;
        newWorkflow.format_mix_id = $scope.workflow_model.format_mix_id;
        newWorkflow.norme_mix_id = $scope.workflow_model.norme_mix_id;
        newWorkflow.language_id = $scope.workflow_model.language_id;
        newWorkflow.doublage_type_id = $scope.workflow_model.doublage_type_id;
        newWorkflow.prod_version = $scope.workflow_model.prod_version;
        newWorkflow.speed_id = $scope.workflow_model.speed_id;
        newWorkflow.servicing_type_id = $scope.workflow_model.servicing_type_id;
        newWorkflow.diffuseur_id = $scope.workflow_model.diffuseur_id;
        newWorkflow.resolution_id = $scope.workflow_model.resolution_id;
        newWorkflow.language_labo = $scope.workflow_model.language_labo;
        newWorkflow.layout_id = $scope.workflow_model.layout_id;
        newWorkflow.dolbye = $scope.workflow_model.dolbye;
        newWorkflow.dynamic_process = $scope.workflow_model.dynamic_process;
        newWorkflow.type_audio_process = $scope.workflow_model.type_audio_process;
        newWorkflow.subtitle = $scope.workflow_model.subtitle;
        newWorkflow.nature_subtitle = $scope.workflow_model.nature_subtitle;
        newWorkflow.projector_aspect = $scope.workflow_model.projector_aspect;
        newWorkflow.dcp_standard = $scope.workflow_model.dcp_standard;
        newWorkflow.dub_place = $scope.workflow_model.dub_place.value;
        newWorkflow.dub_place_value = $scope.workflow_model.dub_place.loc_value
        newWorkflow.main_location_id = null
        if ($scope.workflow_model.main_location) {
          newWorkflow.main_location_id = $scope.workflow_model.main_location.key
        }

        newWorkflow.products_ids = allProducts.join(",");

        newWorkflow.$save({}, function(workflow) {
          $scope.associateActionList(workflow, $scope.subproject_workflow); //

          //ngDialog.closeAll();
        });
      } else {
        swal($rootScope._T["mx7q7rbm"], $rootScope._T["ciej2nrw"], "error")
        $scope.disabledButtons = true;
        $scope.generationList = false
      }
    };

    $scope.generationList = false;

    $scope.associateActionList = function(workflow, subproject, useModel) {
      $scope.generationList = true;

      //Recherche des normes qui matchent
      var filtersSpec = [{
        "name": "client_id",
        "value": subproject.project.client_id
      }, {
        "name": "client_spec",
        "value": 1
      }];

      var validSpecs = [];

      TechnicalSpec.queryByFilters({
        filters: [filtersSpec]
      }, function(specs) {
        angular.forEach(specs, function(spec) {
          //On vérifie que l'étape / action est bien dans la liste prévue
          var actionInList = false;
          if (useModel) {
            angular.forEach(workflow.stepslist.ownStep, function(step) {
              countSteps++;
              if (spec.etape_type_id == step.etape_type_id) {
                actionInList = true;
              }
            });
          } else {
            actionInList = true;
          }

          if (actionInList) {
            var insertNorme = true; //TEMP
            if (spec.exploitation_id != null) {
              if (spec.exploitation_id != workflow.exploitation_id) {
                insertNorme = false;
              }
            }

            if (spec.language_id != null) {
              if (spec.language_id != workflow.language_id) {
                insertNorme = false;
              }
            }

            if (spec.doublage_type_id != null) {
              if (spec.doublage_type_id != workflow.doublage_type_id) {
                insertNorme = false;
              }
            }

            if (spec.spec_mix_id != null) {
              if (spec.spec_mix_id != workflow.spec_mix_id) {
                insertNorme = false;
              }
            }

            if (spec.format_mix_id != null) {
              if (spec.format_mix_id != workflow.format_mix_id) {
                insertNorme = false;
              }
            }

            if (spec.speed_id != null) {
              if (spec.speed_id != workflow.speed_id) {
                insertNorme = false;
              }
            }

            if (spec.version != null) {
              if (spec.version != workflow.version) {
                insertNorme = false;
              }
            }

            if (spec.subproject_nature_id != null) {
              if (spec.subproject_nature_id != subproject.nature.id) {
                insertNorme = false;
              }
            }

            if (insertNorme) {
              validSpecs.push(spec);
            }
          }
        });

        //Creation d'une nouvelle liste
        if (validSpecs.length != 0) {
          var listEtapes = new StepsList();
          listEtapes.workflow_id = workflow.id;

          var count = 0;

          listEtapes.$save({}, function(list) {
            angular.forEach(validSpecs, function(spec) {
              //Duplication des normes
              TechnicalSpec.copy({
                param2: spec.id
              }, function(newSpec) {
                //Association des normes et sauvegarde de l'étape
                var step = new Step();
                step.stepslist_id = list.id;
                step.etape_type_id = newSpec.etape_type_id;
                step.action_type_id = newSpec.action_type_id;
                step.techspec_id = newSpec.id;
                step.$save({}, function() {
                  count++;
                  if (count == validSpecs.length) {
                    $scope.generationList = false;
                    swal({
                      title: $rootScope._T["70jumwe9"],
                      text: $rootScope._T["exgvpmmc"],
                      type: "success",
                      confirmButtonText: $rootScope._T["settpdr0"]
                    });
                    $scope.disabledButtons = false
                    $scope.closeThisDialog()
                  }
                });
              });

            });
          });
        } else {
          swal($rootScope._T["rxbs2voi"], $rootScope._T["8e46w3t4"], "warning");
          $scope.disabledButtons = false
          $scope.closeThisDialog()
        }

      }, function() {
        swal({
          title: $rootScope._T["mx7q7rbm"],
          text: $rootScope._T["pocsxt46"],
          html: true,
          type: "warning"
        }, function() {
          $scope.disabledButtons = false
          $scope.closeThisDialog()
        })
      });

    };

  }
]);
