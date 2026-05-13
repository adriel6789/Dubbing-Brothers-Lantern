'use strict';

/* Services */
Lantern.factory('ProjectsService', ['$http','$q', 'ApiRest', 'Session', '$rootScope', 'ngDialog', '$state',
  function($http, $q, ApiRest, Session, $rootScope, ngDialog, $state) {
    var service = {};
    service.getProjects = function(params, successCallback, errorCallback) {
      ApiRest.get('/projects', params, function(projects) {
        return successCallback(projects)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.getProject = function(params, successCallback, errorCallback) {
      ApiRest.get('/projects/'+params.id, params, function(projects) {
        return successCallback(projects)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.updateProject = function (id, data, successCallback, errorCallback) {
      ApiRest.put('/projects/' + id + '/',  {}, data, function (project) {
        return successCallback(project)
      }, function(error) {
        return errorCallback(error);
      });
    }    

    service.getFavoritesProjects = function(params, successCallback, errorCallback) {
      ApiRest.get('/favorites', params, function(favoritesProjects) {
        return successCallback(favoritesProjects);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.postFavorites = function(params, data, successCallback, errorCallback) {
      ApiRest.post('/favorites', params, data, function(response) {
       return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.deleteFavorites = function(params, successCallback, errorCallback) {
      ApiRest.delete('/favorites/'+params.id, {}, function(response) {
        if(response.error != null) {
            return errorCallback(response.error);
        }
        return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.searchProjects = function (params, isSerie, successCallback, errorCallback) {
      var url = isSerie ? "search/tv" : "search/movie";

      params.url = url;
      ApiRest.get('/projects/searchFromTmdb/', params, function (response) {
        return successCallback(response.results)
      }, function(error) {
        return errorCallback(error);
      });
    }

    function getCurrentSubprojectId() {
      const ids = $rootScope.subprojects ? Object.keys($rootScope.subprojects) : [];

      return ids.length ? ids[0] : null;
    } 

    service.getProjectsById = function (data, successCallback, errorCallback) {
        ApiRest.post('/projects/bylistid/', 
          null, 
          data,
          function (response) {
            return successCallback(response)
          },
          function (error) {
            return errorCallback(error)
          }
        )
    }



    service.getProjectSerieDetail = function (params, season_number, successCallback, errorCallback) {
      if(!params.id) return errorCallback();
      var url = "tv/" + params.id;
      delete params.id;
      params.api_key = TMDB_API_KEY;
      params.no_header = true;
      params.language = 'fr';
      params.subproject_id = getCurrentSubprojectId();

      // Full season information query
      if (season_number != null && parseInt(season_number)) {
        url += "/season/" + season_number;
      }

      params.url = url;
      ApiRest.get('/projects/searchFromTmdb/', params, function (response) {
        return successCallback(response)
      }, function (error) {
        return errorCallback(error);
      });
    }

    service.saveMovie = function (params, data, successCallback, errorCallback) {
      ApiRest.post('/movies', params, data, function (movie) {
        if (movie === undefined) {
          return errorCallback(movie);
        }
        return successCallback(movie)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.saveSerie = function (params, data, successCallback, errorCallback) {
        ApiRest.post('/projects/saveserie', params, data, function (serie) {
            if (serie === undefined) {
                return errorCallback(serie);
            }
            return successCallback(serie)
        }, function(error) {
            return errorCallback(error);
        });
    }

    service.createSubProject = function(project) {
      $rootScope.project_id = project.id;
      $rootScope.project_name = project.name_format;
      service.getProject({id: project.id}, function(p) {
        $rootScope.projectForSubProject = p;
        let dialog = ngDialog.open({
          className: 'ngdialog-theme-demand popup',
          template: 'views/Dialog/wizardCreation.html',
          scope: $rootScope,
          width: '80%',
          controller: 'WizardCreationCtrl',
          closeByDocument: false,
          resolve: {
            stepForce: function() {
              return true;
            }
          }
        });
        dialog.closePromise.then(function(data) {
          $rootScope.isEditProject = false;
          $rootScope.newProject = null;
          $rootScope.project_id = null;
          $rootScope.project_name = null;
          $rootScope.projectForSubProject = null;
          if (data.value != "$closeButton" && data.value != "$escape" && data.value != "cancelButton") {
            $state.reload();
          }
        });
      });
    }

    service.clearProductsImdbId = function (project_id) {
      ApiRest.get('/projects/clearProductsImdbId/', {project_id: project_id}, function (response) {
        return successCallback(response.results)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getTmdbFromImdbId = function (params) {
      var deferred = $q.defer();
      ApiRest.get('/projects/getTmdbFromImdbId/', params, function (response) {
        deferred.resolve(response);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

    service.switchProjectImdbId = function (data) {
      var deferred = $q.defer();
      ApiRest.post('/projects/switchProjectImdbId', null, data, function (response) {
        deferred.resolve(response);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

    service.getName = function (project) {
      let nameFound = project.name
      if (project.display_name) {
        nameFound = project[project.display_name]
      }
      return nameFound
    }


    return service;
  }
]);
