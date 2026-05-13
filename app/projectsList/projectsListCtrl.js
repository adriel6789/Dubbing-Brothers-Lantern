/**
 * Created by Marcel Tessier on 08/07/15.
 */
Lantern.controller('ProjectsListCtrl', ['$scope', '$rootScope', '$q', '$cookies', '$stateParams', 'ngDialog', 
'Project', 'Favorite', '$state', '$filter', '$location', 'API_CONFIG', 'Session', 'ProjectsService', 
'ResponseToastService', 'Notification', 'EVENTS','ApiRest', 'ClientService',
  function($scope, $rootScope, $q, $cookies, $stateParams, ngDialog, 
    Project, Favorite, $state, $filter, $location, API_CONFIG, Session, ProjectsService, 
    ResponseToastService, Notification, EVENTS, ApiRest, ClientService) {
    // public variables


  $scope.role = Session.role();
  ClientService.getClients({}, function() {
    $scope.clients = $rootScope.clientsLight
  }, ClientService.manageClientError)

    // end public variables

    // privates variables
      let rest = {};
      let service = {};
      let loadingFavoriteProjects, loadingAllProjects;
      // end privates variables

    // privates methods
    service.resetStep = function() {
      $scope.step = 1;
    };


    // end privates methods


    // public methods


    $scope.createSubProject = function(project) {
      ProjectsService.createSubProject(project);
    } 

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
        if (data.value != 'cancelButton') {
          init();
          }
      });
    };

    // end public methods

      /**
       * Functions to call Service
       */


      /**
       * Function to call API
       */
      rest.getFavoritesProjects = function(done) {
        ApiRest.get('/favorites/all/lantern/', 
        null, 
        function (projectsResponse) {
          $scope.favoriteProjects = projectsResponse
          $scope.favoriteProjects.forEach(function (project) {
              project.client = $rootScope.clients[project.client_id]
          })
          setLoadingFavoriteProjects(false)
          return done()
        }, null, true)
      }

      rest.getProjects = function() {
          ApiRest.get('/projects/all/lantern/', 
          null, 
          function (projectsResponse) {
            $scope.allProjects = projectsResponse
            $scope.allProjects.forEach(function (project) {
                project.client = $rootScope.clients[project.client_id]
            })
            setLoadingAllProjects(false)
          }, null, true)
      }



      rest.deleteFavorites = function(favorite) {
          ProjectsService.deleteFavorites({
              id: favorite.id
          }, function() {
              $scope.favoriteProjects.splice($scope.favoriteProjects.indexOf(favorite), 1);
              Notification.success($rootScope._T["r82ct91x"] + ' ' + favorite.name + ' ' + $rootScope._T["qxblyj6l"]);
          }, function() {
              Notification.error(ResponseToastService.error.message);
          });
      };

      rest.postFavorites = function(project) {
          ProjectsService.postFavorites({}, {
              user_id: Session.userId(),
              project_id: project.id
          }, function(response) {
              $scope.allProjects.splice($scope.allProjects.indexOf(project), 1);
              $scope.favoriteProjects.push(project);
              Notification.success($rootScope._T["r82ct91x"] + ' ' + project.name + ' ' + $rootScope._T["a3cv6ndb"]);
          }, function() {
              Notification.error(ResponseToastService.error.message);
          });
      };

      /**
       * Scope functions
       */

      $scope.favoriteProjects = [];
      $scope.allProjects = [];
      $scope.pageSize = 10;
      $scope.currentFav = 1;
      $scope.currentPjt = 1;

      $scope.isLoadingFavoriteProjects = function () {
          return getLoadingFavoriteProjects();
      };
      $scope.isLoadingAllProjects = function () {
          return getLoadingAllProjects();
      };

      $scope.saveSearch = function() {
          setSaveSearch();
      };

      $scope.enableFavorite = function(project) {
          rest.postFavorites(project);
      };

      $scope.unableFavorite = function(favorite) {
          swal({
              title: $rootScope._T["g2lm6cmr"],
              text: $rootScope._T["chawq8lt"] + " " + (favorite.name_format ? favorite.name_format : favorite.name) + " " + $rootScope._T["4e7pzwcj"],
              type: "warning",
              showCancelButton: true,
              cancelButtonText: $rootScope._T["ficbz281"],
              confirmButtonColor: "#DD6B55",
              confirmButtonText: $rootScope._T["5ygcxbsu"],
              closeOnConfirm: true
          }, function() {
              rest.deleteFavorites(favorite);
          });
      };

      /**
       * Local functions
       */
      function getProjects() {
          if (!$rootScope.hasBase()) {
            $rootScope.getBase(function () {
                rest.getFavoritesProjects(function () {
                    rest.getProjects()
                  })                
            })
          } else {
            rest.getFavoritesProjects(function () {
                rest.getProjects()
              })
          }

      }

      function getSaveText() {
          return $.cookie('projectSearch');
      }

      function setLoadingFavoriteProjects(isLoading) {
          loadingFavoriteProjects = isLoading;
      }
      function getLoadingFavoriteProjects() {
          return loadingFavoriteProjects;
      }
      function setLoadingAllProjects(isLoading) {
          loadingAllProjects = isLoading;
      }
      function getLoadingAllProjects() {
          return loadingAllProjects;
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
        $scope.favoriteProjects = [];
        $scope.allProjects = [];
        $scope.textProjectFilter = getSaveText();
        setLoadingAllProjects(true);
        setLoadingFavoriteProjects(true);

        getProjects();

        if($stateParams.new){
            $scope.launchWizard();
        }

      }
      init();
  }
]);
