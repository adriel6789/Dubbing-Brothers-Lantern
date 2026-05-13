/**
 * Created by Marcel Tessier on 08/07/15.
 */
Lantern.controller('ProjectsDigiCtrl', ['$scope', '$rootScope', '$q', '$cookies', '$stateParams', 'ngDialog', 'Project', '$state', '$filter', '$location', 'API_CONFIG', 
'Session', 'ProjectsService', 'ResponseToastService', 'Notification', 'EVENTS', 'SubProjectsService', 'ApiRest', 'ClientService',
  function($scope, $rootScope, $q, $cookies, $stateParams, ngDialog, Project, $state, $filter, $location, API_CONFIG,
     Session, ProjectsService, ResponseToastService, Notification, EVENTS, SubProjectsService, ApiRest, ClientService) {
    // public variables

    // end public variables

    // privates variables
      let rest = {};
      let service = {};
      let loadingAllProjects;
      let selectedSubprojectId;
      // end privates variables

    // privates methods
    service.resetStep = function() {
      $scope.step = 1;
    };

    ClientService.getClients({}, function() {
      $scope.clients = $rootScope.clientsLight
    }, ClientService.manageClientError)

    // end privates methods


    // public methods

    $scope.createSubProject = function(project) {
      ProjectsService.createSubProject(project);
    };

    $scope.launchWizard = function(project) {
      if (project != null) {
        $scope.isEditProject = true;
        $scope.newProject = angular.copy(project);
      }
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-demand popup',
        template: 'views/Dialog/wizardCreation.html',
        scope: $scope,
        width: '80%',
        resolve: {
          stepForce: function() {
            return false;
          }
        },
        controller: 'WizardCreationCtrl',
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        service.resetStep();
        $scope.isEditProject = false;
        $scope.newProject = null;
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          $state.reload();
        }
      });
    };

    $scope.editSubproject = function(subproject) {
      $scope.subprojectToEdit = subproject;
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/subprojectEditDialog.html',
        scope: $scope,
        controller: 'EditSubprojectDialogCtrl',
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        $scope.subprojectToEdit = null;
        if (data.value != "$closeButton" && data.value != "$escape") {
          $state.reload();
        }
      });
    }

    $scope.createProduct = function(subproject, project) {
      $scope.subproject_id = subproject.id;
      $scope.subproject_nature = subproject.nature;
      $scope.subproject_season = subproject.season;
      $scope.project_name = project.name;

      let dialog = ngDialog.open({
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

      dialog.closePromise.then(function(data) {
        $scope.subproject_id = null;
        $scope.subproject_nature = null;
        $scope.subproject_season = null;
        $scope.project_name = null;
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          $state.reload();
        }
      });
    };

    $scope.editProduct = function(product) {
      $scope.product = product;

      let dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        template: 'views/Dialog/subprojectEditDialog.html',
        scope: $scope,
        controller: 'EditSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) {
        $scope.product = null;
        if (data.value != "$closeButton" && data.value != "$escape") {
          $state.reload();
        }
      });
    }

    $scope.createElementDialog = function (product, subproject, project) {
      $scope.subproject = subproject;
      $scope.project = project;
      $scope.products = [product];
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-demand dialogwidth80p',
        template: 'views/DigitalMedia/createDemandDigitalMedia.html',
        scope: $scope,
        controller: 'CreateDemandDigitalMediaCtrl',
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        $scope.product = null;
        $scope.project = null;
        if (data.value != "$closeButton" && data.value != "$escape") {
          $state.reload();
        }
      });
    };

    $scope.selectedProducts = {};
    $scope.createMultiElementDialog = function (subproject, project) {
      $scope.products = Object.keys($scope.selectedProducts)
        .filter(key => $scope.selectedProducts[key] === true)
        .map(productId => subproject.ownProduct.find(product => product.id == productId))
        .filter(product => product)
        .sort((a, b) => a.episode_number - b.episode_number);
      if ($scope.products.length === 0) {
        return;
      }
      
      $scope.subproject = subproject;
      $scope.project = project;
      let dialog = ngDialog.open({
        className: 'ngdialog-theme-demand dialogwidth80p',
        template: 'views/DigitalMedia/createDemandDigitalMedia.html',
        scope: $scope,
        controller: 'CreateDemandDigitalMediaCtrl',
        closeByDocument: false
      });
      dialog.closePromise.then(function(data) {
        $scope.product = null;
        $scope.project = null;
        if (data.value != "$closeButton" && data.value != "$escape") {
          $state.reload();
        }
      });
    };

    $scope.setCodeSecuriteSubproject = function(subproject) {
      $scope.subprojectToSetCodeSecurite = subproject;
      $scope.getSubprojectVideoElements(subproject.id);

      var dialog = ngDialog.open({
        className: 'ngdialog-theme-default',
        appendClassName: 'ngdialog-code-securite',
        width: '95%',
        template: 'views/Dialog/subprojectCodeSecuriteSetDialog.html',
        scope: $scope,
        controller: 'SetCodeSecuriteSubprojectDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function(data) { 
        $scope.subprojectToSetCodeSecurite = null;
        if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
          $state.reload();
        }
      });

    }

    // end public methods

      /**
       * Functions to call Service
       */


      /**
       * Function to call API
       */


      
      rest.getProjects = function() {
        ApiRest.get('/projects/all/lantern/', 
        null, 
        function (projectsResponse) {
          $scope.allProjects = projectsResponse
          $scope.allProjects.forEach(function (project) {
              project.client = $scope.clients[project.client_id]
          })
          setLoadingAllProjects(false)
        }, null, true)
      }

      rest.getSubprojectVideoElements = function (subproject_id,done) {
        ApiRest.get('/subprojects/videoelements/'+subproject_id,{},
          function (response) {
              return done(response);
          }
  
        )
      }
  
      /**
       * Scope functions
       */

      $scope.allProjects = [];
      $scope.pageSize = 10;
      $scope.currentFav = 1;
      $scope.currentPjt = 1;


      $scope.isLoadingAllProjects = function () {
        return getLoadingAllProjects();
      };

      $scope.saveSearch = function() {
        setSaveSearch();
      };

      $scope.selectSubProject = function(subproject) {
        selectSubProject(subproject);
      }

      $scope.getSelectedSubprojectId = function() {
        return getSelectedSubprojectId();
      }

      $scope.getSubprojectVideoElements = function(subproject_id) {
        rest.getSubprojectVideoElements(subproject_id, function(mediaitems) {
          $scope.subprojectVideoElements = mediaitems;
          $scope.subprojectVideoElements.forEach(function(item) {
            item.new_media_seal_security_code = '';
            item.new_media_seal_security_version = item.media_seal_security_version;
            item.selected = "0";
            item.media_seal_code_changed = false;
          })
        });
      }

      /**
       * Local functions
       */
      function getProjects() {
        rest.getProjects();
      }

      function getSaveText() {
        return $.cookie('projectSearch');
      }



      function setLoadingAllProjects(isLoading) {
        loadingAllProjects = isLoading;
      }

      function getLoadingAllProjects() {
        return loadingAllProjects;
      }

      function selectSubProject(subproject) {

        if (selectedSubprojectId == subproject.id) {
          selectedSubprojectId = null;
        } else {
          selectedSubprojectId = subproject.id;
        }

        if (!subproject.ownProduct) {
          SubProjectsService.getProducts({
            id: subproject.id
          }, function(products) {
            subproject.ownProduct = [];
            angular.forEach(products, function(product) {
              subproject.ownProduct.push(product);
            })
          });
        }

      }

      function getSelectedSubprojectId() {
        return selectedSubprojectId
      }

      function setSaveSearch(){
        let date = new Date();
        date.setTime(date.getTime() + (300 * 1000));
        $.cookie('projectSearch', $scope.textProjectFilter, {
          expires: date,
          path: '/'
        });
      }

      function init() {
        $scope.allProjects = [];
        $scope.textProjectFilter = getSaveText();
        setLoadingAllProjects(true);

        getProjects();

      }
      init();
  }
]);
