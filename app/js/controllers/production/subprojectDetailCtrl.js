Lantern.controller('SubprojetDetailCtrl', ['$rootScope', '$scope', '$q', '$cookies', '$state', '$stateParams', '$filter', 'ngDialog', 'Project', 
'Subproject', 'Workflow', 'Request', 'Return', 'VisDataSet', '$location', 'WorkflowHelperService',
  function ($rootScope, $scope, $q, $cookies, $state, $stateParams, $filter, ngDialog, Project, 
    Subproject, Workflow, Request, Return, VisDataSet, $location, WorkflowHelperService) {

    $scope.defaults = {
      orientation: ['top', 'bottom'],
      autoResize: [true, false],
      showCurrentTime: [true, false],
      showCustomTime: [true, false],
      showMajorLabels: [true, false],
      showMinorLabels: [true, false],
      align: ['left', 'center', 'right'],
      stack: [true, false],

      moveable: [true, false],
      zoomable: [true, false],
      selectable: [true, false],
      editable: [true, false]
    };

    $scope.options = {
      align: 'center',
      autoResize: true,
      editable: false,
      selectable: false,
      start: moment().add(-5, 'weeks'),
      end: moment().add(1, 'weeks'),
      orientation: 'bottom',
      showCurrentTime: true,
      showMajorLabels: true,
      showMinorLabels: true,
      zoomable: false,
      locale: 'fr'
    };

    $scope.subproject = Subproject.get({
      id: $stateParams.id
    }, function(subproject) {

      var allWorkflows = [];
      angular.forEach(subproject.ownProduct, function(product) {
        product.hasRequests = false;
        product.isSelected = false;
        angular.forEach(product.sharedWorkflow, function(workflow) {

          workflow.color = colorizeWorkflow(workflow);


          workflow.isSelected = false;

          workflow.description = WorkflowHelperService.describeWorkflow(workflow);

          var filtersRequest = [{
            "name": "workflow_id",
            "value": workflow.id
          }, {
            "name": "product_id",
            "value": product.id
          }];
          workflow.ownRequests = Request.getRequestsBy({
            filters: [filtersRequest]
          }, function(requests) {
            var data = [];
            workflow.requestsNotDone = 0;

            var content_part1 = "<i>(" + $rootScope._T['q2ow94j2'] + ")</i>";
            if (workflow.format_mix != null) {
              content_part1 = workflow.format_mix.value;
            } else if (workflow.type_servicing) {
              content_part1 = workflow.type_servicing.value;
            }
            var content_part2 = "<i>(" + $rootScope._T['q2ow94j2'] + ")</i>";
            if (workflow.norme_mix != null) {
              content_part2 = workflow.norme_mix.value;
            } else if (workflow.diffuseur != null) {
              content_part2 = workflow.diffuseur.value;
            }
            workflow.content = "<label style='color: black'>" + content_part1 + " - " + content_part2 + "</label><br>";

            requests.forEach(function(request) {

              var item = {};
              var contentReturn = "";

              product.hasRequests = true;

              var colorFlag = "black"; // non planifiée
              var tooltipFlag = $rootScope._T["5j1nv2tu"]
              if (request.is_done == 1 && request.is_not_done == 0 && request.is_sent_back == 1) {
                colorFlag = "green"; // terminée
                tooltipFlag = $rootScope._T["46z910du"]
              } else if (request.is_not_done == 1) {
                colorFlag = "darkorange" // replanifiée
                tooltipFlag = $rootScope._T["9d3vvwuk"]
              } else if ((request.is_planned == 1 || request.is_in_progress == 1) && !(request.is_done == 1 || request.is_not_done == 1)) {
                colorFlag = "deepskyblue" // planifiée
                tooltipFlag = $rootScope._T["5dd4lerz"]
              }

              if (request.ownReturn.length != 0) {
                tooltipFlag += " - " + $rootScope._T["g3740ab1"];
                contentReturn = '<i class="glyphicon glyphicon-flag" style="color: red" title="' + tooltipFlag + '"></i> ';
              }

              request.tooltipFlag = tooltipFlag;

              var content = "";
              if ($rootScope.canDisplay(4)) {
                content = contentReturn +
                  '<i class="glyphicon glyphicon-record" style="color: ' + colorFlag + '" title="' + tooltipFlag + '"></i> ' +
                  '<a href="#/requests/detail/' + request.id + '">' +
                  request.action_type.etape_type.value + " - " + request.action_type.value +
                  '</a>';
              } else {
                content = contentReturn +
                  '<i class="glyphicon glyphicon-record" style="color: ' + colorFlag + '" title="' + tooltipFlag + '"></i> ' +
                  '<a href="#/requests/detail/' + request.id + '">' +
                  request.action_type.etape_type.value + " - " + request.action_type.value +
                  '</a>';
              }

              if (request.is_done != 1) {
                workflow.content += content + "<br>";
                workflow.requestsNotDone += 1;
              }

              var start = request.date_creation;
              if (request.closing_date != null) {
                start = request.closing_date;
              } else if (request.ownFarmerbookings != null) {
                request.ownFarmerbookings = objectInArray(request.ownFarmerbookings)
                if (request.ownFarmerbookings.length > 0) {
                  var date = request.ownFarmerbookings[0].day.split(' ')[0]
                  var time = request.ownFarmerbookings[0].start_time.replace('h', ':') + ':00'
                  start = date + ' ' + time
                }
              } else if (request.planification_date != null) {
                start = request.planification_date;
              }

              item = {
                content: content,
                start: start
              };

              data.push(item);
            });

            workflow.data = {
              items: VisDataSet(data)
            };

          });

          //Check exist
          var exist = false;
          allWorkflows.forEach(function(wf) {
            if (wf.id == workflow.id) {
              exist = true;
            }
          });

          if (!exist) {
            allWorkflows.push(workflow);
          }

        });
      });
      $scope.subproject_workflows = allWorkflows;

      $scope.projet = subproject.project;
    });

    $scope.createProduct = function() {
      $scope.subproject_id = $scope.subproject.id;
      $scope.subproject_nature = $scope.subproject.nature;
      $scope.subproject_season = $scope.subproject.season;
      $scope.project_name = $scope.projet.name;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/wizardCreation.html',
        width: '80%',
        scope: $scope,
        resolve: {
          stepForce: function() {
            return true;
          }
        },
        controller: 'WizardCreationCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };

    $scope.createSubProject = function() {
      $scope.project_id = $scope.projet.id;
      $scope.project_name = $scope.projet.name;

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/wizardCreation.html',
        scope: $scope,
        width: '80%',
        resolve: {
          stepForce: function() {
            return true;
          }
        },
        controller: 'WizardCreationCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        //$state.reload();
      });
    };

    $scope.createWorkflow = function() {
      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/createWorkflow.html',
        scope: $scope,
        width:'80%',
        controller: 'CreateWorkflowDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };

    $scope.editWorkflow = function(workflow) {
      $scope.workflowToEdit = workflow;
      $scope.workflowProducts = $filter('workflowFilter')($scope.subproject.ownProduct, workflow);

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-demand dialogwidth80p',
        template: 'views/Dialog/editWorkflow.html',
        scope: $scope,
        controller: 'EditWorkflowDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function() {
        $state.reload();
      });
    };


    $scope.getProjectWorkflow = function(product, workflow) {
      if (product.ownWorkflow != null && workflow != null) {
        var theReturn = null;
        product.ownWorkflow.forEach(function(product_workflow) {
          if (
            product_workflow.workflow_type_id == workflow.workflow_type_id &&
            product_workflow.norme_mix_id == workflow.norme_mix_id &&
            product_workflow.format_mix_id == workflow.format_mix_id &&
            product_workflow.language_id == workflow.language_id &&
            product_workflow.version == workflow.version
          ) {

            theReturn = product_workflow;
          }
        });
        return theReturn;
      }
    };


    $scope.allWorkflowsSelected = true;
    $scope.workflowSelected = function(workflowSelect) {
      $scope.allWorkflowsSelected = true;
      workflowSelect.isSelected = !workflowSelect.isSelected;

      $scope.subproject_workflows.forEach(function(wf) {
        if (wf.isSelected) {
          $scope.allWorkflowsSelected = false;
        }
      });

      if ($scope.allWorkflowsSelected) {
        $scope.selectAllProducts();
      }

      if ($scope.subproject.ownProduct != null) {
        $scope.subproject.ownProduct.forEach(function(product) {
          product.sharedWorkflow.forEach(function(workflow) {
            if ((workflow.id == workflowSelect.id) && workflowSelect.isSelected) {
              product.isProductSelected = true;
              $scope.allProductsSelected = false;
            }
          });
        });

      }
    };

    $scope.isWorkflowSelected = function(workflow) {
      var show = false;
      $scope.subproject_workflows.forEach(function(wf) {
        if (wf.id == workflow.id) {
          workflow.isSelected = wf.isSelected;
          if (wf.isSelected) {
            show = true;

          }
        }
      });
      return show;
    };


    $scope.allProductsSelected = true;
    $scope.selectProduct = function(product) {
      $scope.allProductsSelected = true;
      product.isProductSelected = !product.isProductSelected;

      if ($scope.subproject.ownProduct != null) {
        $scope.subproject.ownProduct.forEach(function(product) {
          if (product.isProductSelected) {
            $scope.allProductsSelected = false;
          }
        });
      }
    };

    $scope.selectAllProducts = function() {
      $scope.allProductsSelected = true;
      if ($scope.subproject.ownProduct != null) {
        $scope.subproject.ownProduct.forEach(function(product) {
          product.isProductSelected = false;

        });
      }
    }

  }
]);
