Lantern.controller('CreateTempRequestCtrl', ['$scope', '$http', '$q', 'Project', '$cookies', '$state', '$stateParams', '$filter', 'ngDialog', 'Product', 
'Subproject', 'Request', 'Notification', '$location', 'User', 'Valuelist', 'Farmer', 'Comment', '$rootScope', 'WorkflowHelperService',
  function ($scope, $http, $q, Project, $cookies, $state, $stateParams, $filter, ngDialog, Product, 
    Subproject, Request, Notification, $location, User, Valuelist, Farmer, Comment, $rootScope, WorkflowHelperService)
{
  // DPERCATED, abandonné depuis 2021-03-05
  var role = $.cookie('role');
  if ($rootScope.canDisplay(9))
  {
    $scope.entity = new Request();
    $scope.user_id = $.cookie('user_id');
    User.getCurrentUserDetails({}, user => $scope.techUser = user);
    $scope.entity.products = [];
    $scope.action_type_main = false
    $scope.etapes_actions = []

    $scope.elementChecked = [];
    $scope.projects = [];
    $scope.showProducts = false;
    $scope.globalVar = {};

    $scope.global = [];
    function initForm(){
      $scope.entity = new Request();
      $scope.entity.user_id = $.cookie('user_id');
      $scope.elementChecked = [];
      $scope.projects = [];
      $scope.showProducts = false;
    }
    $scope.refreshProjects = function (select) {
      var query = select.search

      if (query != '')  {
        Project.search({q: query}, function (response) {
          response.forEach(function(project){
            if(project.code_name == null){
              project.code_name = "";
            }
            if(project.code_name_2 == null){
              project.code_name_2 = "";
            }
            if(project.code_name_3 == null){
              project.code_name_3 = "";
            }
            project.client = $rootScope.clients[project.client_id]
          })
          $scope.projects = response;
        });
      }
    };

    $scope.refreshProducts = function(select){
      if(select.items.length == 0 && select.search != ''){
        angular.forEach($scope.project.ownSubproject, function(subProject) {
          if(subProject.nature.name == "serie") {
            subProject.subproject_name = $rootScope._T['6vwtywcc'] + " " + subProject.season
          } else {
            subProject.subproject_name = subProject.nature.value
          }
        })
      }
    }

    $scope.showSelectedProduct = function (item) {
      $scope.subproject_id = item.subproject_id;
      $scope.project_name = $scope.project.name;
      Subproject.get({id:item.subproject_id}, function(subProject){
        $scope.subproject = subProject
      })
      $scope.selectedProduct = item;

      $scope.workflows = [];
      angular.forEach(item.sharedWorkflow, function (workflow) {
        workflow.color = colorizeWorkflow(workflow);
        workflow.description = WorkflowHelperService.describeWorkflow(workflow);
        $scope.workflows.push(workflow);
      });
    }

    $scope.showSelectedProject = function (item, model) {
      $scope.products = [];
      $scope.showProducts = false;
      $scope.entity.products = [];
      $scope.elementChecked = [];

      $scope.selectedProject = item;

      var filters = [{
        "name" : "project_id",
        "value" : item.id

      }];

      Project.queryFalse({projectId: item.id}, function (response) {
        $scope.project = response
        if(response.ownSubproject.length > 0){
          $scope.subprojects = response.ownSubproject;

          $scope.subprojects.forEach(function(subProject){

            if(subProject.ownProduct.length > 0){
              subProject.ownProduct.forEach(function(product){
                if(subProject.nature.name == "serie") {
                  product.subproject_name = $rootScope._T['6vwtywcc'] + " " + subProject.season
                } else {
                  product.subproject_name = subProject.nature.value
                }
                if(product.description_text != null && product.episode_number == null){
                  product.episode_number = product.description_text;
                }
                if(product.episode_number != null || product.description_text != null){
                  $scope.products.push(product);
                }
              });
            }
          });
          //console.log($scope.products);
          $scope.showProducts = true;
        }
      });
    };

    $scope.selectWorkflow = function (workflow) {
      $scope.selectedWorkflow = workflow;

      Valuelist.getEtapeActionByWorkflow({workflow_type_id:workflow.workflow_type_id}, function(etapes){
        $scope.etapes_actions = []
        $scope.action_type_main = true
        angular.forEach(etapes, function(etape) {
          angular.forEach(etape.actions, function(action) {
            action.etape_value = etape.value
            action.etape = {}
            action.etape.id = etape.id
            action.etape.name = etape.name
            action.etape.value = etape.value

            var insertAction = true;

            //On filtre les actions pour la belqique : on ne les fait pas apparaitre si la langue du workflow n'est pas hybride ou belgique
            if (action.service === "belgique") {
              if (!(workflow.dub_place === "Hybride" || workflow.dub_place === "Belgique")) {
                insertAction = false;
              }
            }

            if (insertAction) {
              $scope.etapes_actions.push(action)
            }
          })
        })
      })

    };

    $scope.selectAction = function(item) {
      $scope.selectedAction = item;
    }



    $scope.createTempRequest = function() {
      $scope.saving = true;
      var request = new Request();
      //Element de base de la requête
      request.action_type_id = $scope.selectedAction.id;
      request.etape_type_id = $scope.selectedAction.etape.id
      request.in_group = false;
      request.planning_id = $scope.selectedAction.service;
      request.user_id = $.cookie('user_id');
      request.product_id = $scope.selectedProduct.id;
      request.workflow_id = $scope.selectedWorkflow.id;
      request.info_for_tech = $rootScope._T["apmie4rk"] + " " + $scope.techUser.firstname + " " + $scope.techUser.lastname;
      request.project = $scope.entity.project;
      request.subproject = $scope.selectedProduct.subproject_id;

      //Surcharge pour mettre la demande en planifiée et envoyée au tech
      request.is_planned = 1;
      request.is_done = 0;
      request.is_not_done = 0;
      request.is_sent_back = 0;
      request.is_in_progress = 0;
      request.is_finished = 0;
      request.is_validated_for_tech = 1;

      request.$save({}, function (requestSaved) {
        //Création d'une activité
        newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["6jb6yjwu"]);
        $rootScope.$broadcast('createNewDemand', {
          action_id: request.action_type_id,
          workflow_id: request.workflow_id,
          tableausuivi_id: $scope.subproject.tableausuivi_id
        });

        //Création d'une séance Farmer avec le bon technicien + envoi automatique
        var farmer = new Farmer();
        farmer.request_id = requestSaved.id;
        farmer.is_selected = 1;
        farmer.booking_id = "pr_" + Math.random().toString(36).slice(2);
        farmer.tech_writer_id = $scope.techUser.id;
        farmer.ingenieur = $scope.techUser.farmer_name;
        farmer.day = moment().format("YYYY-MM-DD") + " 00:00:00";
        farmer.$save({}, function(farmerSaved) {
          //Redirection vers la demande avec le bon ID Farmer
          $location.path("/requestsTech/" + requestSaved.id).search({farmer: farmerSaved.id});
          ngDialog.closeAll();
        });

      });

    }


  }
  else
  {
    alert($rootScope._T["t5hjtmmv"]);
    $location.path( getPathRole(role) );
  }

}]);
