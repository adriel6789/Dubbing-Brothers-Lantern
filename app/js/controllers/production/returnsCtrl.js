Lantern.controller('ReturnsCtrl', ['$rootScope', '$scope', '$filter', '$cookies', '$stateParams', 'Record', 'Request', 'Product', 
'Return', 'Favorite', '$location', 'ContextualInfo', 'WorkflowHelperService', 'ClientService',
  function ($rootScope, $scope, $filter, $cookies, $stateParams, Record, Request, Product, 
    Return, Favorite, $location, ContextualInfo, WorkflowHelperService, ClientService) {

    $scope.subprojectsFavoriteWithReturns = [];

    $scope.currentPage = 1;
    $scope.pageSize = 8;
    
    ClientService.getClients({}, function() {
      $scope.clients = $rootScope.clientsLight
    }, ClientService.manageClientError)

    $rootScope.showLoading++;
    Return.subProjectsWithReturn({}, function(subprojects) {
      $rootScope.showLoading--;
      angular.forEach(subprojects, function(subproject, index) {
        var allCorrected = true;
        var uncorrected = 0;
        var allReturn = 0;
        var subprojectReturnClient = 0;
        var subprojectReturnInterne = 0;
        var subprojectReturnRefus = 0;
        subproject.due_date = null;
        angular.forEach(subproject.ownProduct, function(product, index2) {
          var productReturnClient = 0;
          var productReturnInterne = 0;
          var productReturnRefus = 0;
          angular.forEach(product.sharedWorkflow, function(workflow, index3) {
            var workflowReturnClient = 0;
            var workflowReturnInterne = 0;
            var workflowReturnRefus = 0;
            var filters = [{
              "name": "workflow_id",
              "value": workflow.id
            }, {
              "name": "product_id",
              "value": product.id
            }, {
              "name": "name",
              "value": "due_date"
            }];
            var due_date = ContextualInfo.getContextualInfosBy({
              filters: [filters]
            }, function() {
              if (due_date[0] != null) {
                workflow.due_date = moment(due_date[0].value, "DD/MM/YYYY").format("YYYY/MM/DD");
                workflow.due_date_tooltip = setTooltip(workflow.due_date);
                if(product.due_date == null) {
                  product.due_date = workflow.due_date;
                  product.due_date_tooltip = setTooltip(product.due_date);
                } else if(new Date(product.due_date) > new Date(workflow.due_date)) {
                  product.due_date = workflow.due_date;
                  product.due_date_tooltip = setTooltip(product.due_date);
                }
                if(subproject.due_date == null) {
                  subproject.due_date = workflow.due_date;
                  subproject.due_date_tooltip = setTooltip(subproject.due_date);
                } else if(new Date(subproject.due_date) > new Date(workflow.due_date)) {
                  subproject.due_date = workflow.due_date;
                  subproject.due_date_tooltip = setTooltip(subproject.due_date);
                }
              } else {
                workflow.due_date = null;
              }
            });
            angular.forEach(workflow.returns, function(aReturn, index4) {
              if (!(aReturn.is_ignored == 1 || aReturn.is_resolved == 1)) {
                allCorrected = false;
                uncorrected += 1;
              }
              if (aReturn.origin == "Client" || aReturn.origin == "Screener" || aReturn.origin == "Externe" || aReturn.origin == "Diffuseur" || aReturn.origin == "Distributeur") {
                productReturnClient += 1;
                subprojectReturnClient += 1;
                workflowReturnClient += 1;
              } else if (aReturn.origin == "Interne") {
                productReturnInterne += 1;
                subprojectReturnInterne += 1;
                workflowReturnInterne += 1;
              } else if (aReturn.origin == "Refus") {
                productReturnRefus += 1;
                subprojectReturnRefus += 1;
                workflowReturnRefus += 1;
              }
              allReturn += 1;
            });
            workflow.returnClient = workflowReturnClient;
            workflow.returnInterne = workflowReturnInterne;
            workflow.returnRefus = workflowReturnRefus;
            workflow.color = colorizeWorkflow(workflow);
            workflow.description = WorkflowHelperService.describeWorkflow(workflow);
          });
          product.returnClient = productReturnClient;
          product.returnInterne = productReturnInterne;
          product.returnRefus = productReturnRefus;
        });
        subproject.uncorrected = uncorrected;
        subproject.allReturn = allReturn;
        subproject.returnClient = subprojectReturnClient;
        subproject.returnInterne = subprojectReturnInterne;
        subproject.returnRefus = subprojectReturnRefus;
        if (!allCorrected) {
          $scope.subprojectsFavoriteWithReturns.push(subproject);
        }
      });
    });

    $scope.getSubprojectsWithReturn = function() {
      return $scope.subprojectsFavoriteWithReturns;
    }

    function setTooltip(date) {
      var momentDate = moment(Date.parse(date)).format("dddd Do MMMM YYYY");
      return 'Due date<br>' + momentDate + '<br>';
    }

    $scope.filterProjectWorkflow = function (method) {
      $scope.filterWorkflowChoosen = method;
      switch (method) {
        case "doublage":
          $scope.filterWorkflow = true;
          $scope.filterWorkflowDisplay = "Doublage";
          break;
        case "mastering":
          $scope.filterWorkflow = true;
          $scope.filterWorkflowDisplay = "Mastering";
          break;
        case "servicing":
          $scope.filterWorkflow = true;
          $scope.filterWorkflowDisplay = "Servicing";
          break;
        case "doublage_mastering":
          $scope.filterWorkflow = true;
          $scope.filterWorkflowDisplay = "Doublage + Mastering";
          break;
        default:
          $scope.filterWorkflow = false;
          break;
      }
    };

    $scope.filterDueDateReverse = false;
    $scope.filterDueDateValues = [$rootScope._T["3kehgvev"], $rootScope._T["bdjl7hal"]];
    $scope.filterDueDateChoosen = 0;
    $scope.filterProjectDueDate = function (method) {
      switch (method) {
        case "ascending":
          $scope.filterDueDateReverse = false;
          $scope.filterDueDateChoosen = 0;
          break;
        case "descending":
          $scope.filterDueDateReverse = true;
          $scope.filterDueDateChoosen = 1;
          break;
        default:
          $scope.filterDueDateReverse = false;
          $scope.filterDueDateChoosen = 0;
          break;
      }
    };

    if($stateParams.project != null) {
      $scope.textProjectFilter = $stateParams.project;
    }
    if($stateParams.workflow != null) {
      $scope.filterProjectWorkflow($stateParams.workflow);
    }

  }
]);
