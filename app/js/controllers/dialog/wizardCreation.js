Lantern.controller('WizardCreationCtrl', ['$rootScope', 'Session', '$scope', '$stateParams', '$filter', '$q', '$location', 'ngDialog', 'Project', 'Subproject', 'Product', 'Client', 
'Valuelist', 'Workflow', 'Favorite', 'User', '$state', 'ApiRest', 'stepForce', 'ProjectsService', 'PersonsService', 'ImdbService', 
'TableauSuivi','Notification','ClientService','ValueListService', 'PaoService',
  function ($rootScope,Session , $scope, $stateParams, $filter, $q, $location, ngDialog, Project, Subproject, Product, Client, Valuelist, 
    Workflow, Favorite, User, $state, ApiRest, stepForce, ProjectsService, PersonsService, ImdbService, 
    TableauSuivi, Notification, ClientService, ValueListService, PaoService) {
    // les variables publiques et privées
    var helper = {};

    const branchId = Session.branchId()
    $scope.global = {};
    $scope.global.referentPersons =[]
    $scope.global.startEpisode = null;
    $scope.global.endEpisode = null;
    $scope.global.descProduct = null;
    $scope.global.productTypeId = null;
    $scope.global.episodeCustom = false;
    $scope.global.trailers = [""];
    $scope.global.productType = 0;
    $scope.focus = {}
    $scope.creationFailed = false
    $scope.reasonFailure = null
    $scope.imdbSearchError = false;
    
    $scope.users_of_client =[];
    $scope.users_of_client_selected = [];
    
    $scope.step = stepForce ? 2 : 1;
    $scope.steps = [{
      step: 1,
      title: $rootScope._T["emtklvxq"]
    }, {
      step: 2,
        title: $rootScope._T["b3pkh06y"]
    }, {
      step: 3,
        title: $rootScope._T["0loef7ao"]
    }];

    $scope.display_names = [{
      'value': 'name',
      'name': $rootScope._T["qhjsf1e6"]
    }, {
      'value': 'code_name',
      'name': $rootScope._T["9lmoswec"]
    }, {
      'value': 'code_name_2',
      'name': $rootScope._T["9lmoswec"] + ' 2'
    }, {
      'value': 'code_name_3',
      'name': $rootScope._T["9lmoswec"] + ' 3'
    }];

    $scope.clients  = []
    const gotClients = function () {
      Object.keys($rootScope.distributors).forEach(function (id) {
        $scope.clients.push({ id: id, name: $rootScope.distributors[id].name})
      })
    }
    ClientService.getClientsByDistributor(gotClients)

    PersonsService.getStageManagers(function (stageManagers) {
      $scope.stageManagers = $rootScope.stageManagers
    }, PersonsService.manageStageManagersError)

    $scope.projectTypes = []
    PaoService.getProjectTypes(function (projectTypes) {
      $scope.projectTypes = projectTypes
    })
    
    client_id_watch = function(newV, oldV) {
      if(newV && newV!=oldV) {
        User.findMetricsClientUsers({
          clientId: newV
        }, function(obj) {
          $scope.users_of_client = obj;
          
          $scope.users_of_client.forEach(function(user) {
            if (user.person != null) {
              user.name = user.person.firstname + " " + user.person.lastname;
            } else {
              user.name = user.firstname + " " + user.lastname;
            }
          });
        });
      }
    };
    
    $scope.$watch('newProject.client_id', client_id_watch);
    
    if($scope.newProject) {
      client_id_watch($scope.newProject.client_id, null);
      
      User.findMetricsUsers({
        projectId: $scope.newProject.id
      }, function(obj) {
        $scope.users_of_client_selected = obj;
        
        $scope.users_of_client_selected.forEach(function(user) {
          if (user.person != null) {
            user.name = user.person.firstname + " " + user.person.lastname;
          } else {
            user.name = user.firstname + " " + user.lastname;
          }
        });
      });
    }

    $scope.setReferentProductManager = function (favoritePersons){
      $scope.global.referentPersons = favoritePersons;
    }
  
    $scope.users = User.findbypermission({
      app_code: 'bons-travaux-auto',
      level: 'charge_prod',
      branch_id: branchId
    }, function() {
      $scope.users.forEach(function(user) {
        if (user.person != null) {
          user.name = user.person.firstname + " " + user.person.lastname;
        } else {
          user.name = user.firstname + " " + user.lastname;
        }
      });
      if ($scope.isEditProject) {
        let filters = [{
          "name": "project_id",
          "value": $scope.newProject.id
        }];
        Favorite.queryByFilters({
          filters: [filters]
        }, function(users) {
          var tabRecipients = []
          angular.forEach(users, function(fav) {
            var isUserChargeProd = $filter('filter')($scope.users, {
              'id': fav.user_id
            }, true)
            if (isUserChargeProd.length == 1)
              tabRecipients.push(isUserChargeProd[0]);
          })
          $scope.global.favoritePersons = tabRecipients;
          $scope.global.favoritePersonsDiff = tabRecipients; // to compare with user_favorite removed
        })
      }
    });

    PersonsService.getArtisticDirectors(function(artisticDirectors) {
      $scope.artisticDirectors = artisticDirectors;
      if ($scope.artisticDirectors != null && $scope.artisticDirectors.length > 0 && $scope.subProjectLantern != null && $scope.subProjectLantern.length > 0) {
        let lastSubproject = $scope.subProjectLantern[$scope.subProjectLantern.length - 1];
        if (lastSubproject.artistic_director_id != null) {
          $scope.newSubproject.artistic_director_id = $filter('filter')($scope.artisticDirectors, {id: lastSubproject.artistic_director_id}, true)[0].id;
        }
        if (lastSubproject.song_director_id != null) {
          $scope.newSubproject.song_director_id = $filter('filter')($scope.artisticDirectors, {id: lastSubproject.song_director_id}, true)[0].id;
        }
        if (lastSubproject.co_artistic_director_id != null) {
          $scope.newSubproject.co_artistic_director_id = $filter('filter')($scope.artisticDirectors, {id: lastSubproject.co_artistic_director_id}, true)[0].id;
        }
      }
    });

    // En cas d'édition, on saute tout de suite au step 2
    if ($scope.project_id != null || $scope.subproject_id != null) {
      $scope.step = 2;
      $scope.restricted_edit = true;
    };

    $scope.restricted_edit = false;

    $scope.initSearch = function (type) {
      $scope.searchFilm = (type === 'film');
      $scope.searchSerie = (type === 'series');
      $scope.$broadcast('projectSearch');
    };

    // Methodes publiques
    $scope.previousStep = function() {
      if ($scope.step == 4) {
        $scope.step = 1;
      } else {
        $scope.step -= 1;
      }
    };
    $scope.loadingProject = 0;
    $scope.searchProjects = function(query, searchFilm, searchSerie) {
      if (query != "") {
        $scope.projectsList = [];
        function searchProjectsByFilm() {
          function queryTMDB () {
            // Query TMDB
            var deferred = $q.defer();
            $scope.loadingProject += 1;
            ProjectsService.searchProjects({ query: query, fetch: false }, false, function(success) {
                $scope.loadingProject -= 1;
                success.map(function(project) {
                  project.project_type = "Films";
                  project.release_date = project.release_date ? moment(project.release_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD")
                  project.source = 'tmdb';
                });
                deferred.resolve(success);
              }, function(error) {
                $scope.loadingProject -= 1;
                console.error(error);
                deferred.reject(error);
              });
            return deferred.promise;
          }

          function queryIMDB () {
            // Query imdb.local
            var deferred = $q.defer();
            $scope.loadingProject += 1;
            ImdbService.searchByTitle({ type: 'movie', q: query }, function (success) {
              $scope.loadingProject -= 1;
              success.map(function(project) {
                project.project_type = "Films";
                project.release_date = project.release_date ? moment(project.release_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD")
              });
              deferred.resolve(success);
            }, function(error) {
              $scope.loadingProject -= 1;
              console.error(error);
              deferred.reject(error);
            });
            return deferred.promise;
          }

          $q.all([queryTMDB(),queryIMDB()]).then(function(results){
            results.forEach(function (query) {
              query.forEach(function (item) {
                $scope.projectsList.push(item);
              });
            });
            ;
          })
        }

        function searchProjectsBySerie() {

          function queryTMDB () {
            // Query TMDB
            var deferred = $q.defer();
            $scope.loadingProject += 1;
            ProjectsService.searchProjects({query: query, fetch: false}, true, function (success) {
              $scope.loadingProject -= 1;
              if (success) {
                success.map(function (project) {
                  project.project_type = "Séries";
                  project.title = project.name;
                  project.original_title = project.original_name;
                  project.release_date = moment(project.first_air_date).format("YYYY-MM-DD");
                  project.source = 'tmdb';
                });
                deferred.resolve(success);
              }
            }, function (error) {
              $scope.loadingProject -= 1;
              console.error(error);
              deferred.reject(error);
            });
            return deferred.promise;
          }

          function queryIMDB () {
            // Query imdb.local
            var deferred = $q.defer();
            $scope.loadingProject += 1;
            ImdbService.searchByTitle({ type: 'tvSeries', q: query }, function (success) {
              $scope.loadingProject -= 1;
              success.map(function(project) {
                project.project_type = "Séries";
                project.release_date = moment(project.release_date).format("YYYY-MM-DD");
              });
              deferred.resolve(success);
            }, function(error) {
              $scope.loadingProject -= 1;
              console.error(error);
              deferred.reject(error);
            });
            return deferred.promise;
          }

          $q.all([queryTMDB(),queryIMDB()]).then(function(results){
            results.forEach(function (query) {
              query.forEach(function (item) {
                $scope.projectsList.push(item);
              });
            });
          })
        }

        if (searchFilm) {
          searchProjectsByFilm();
        } else if (searchSerie) {
          searchProjectsBySerie();
        } else {
          searchProjectsByFilm();
          searchProjectsBySerie();
        }
      }
    };

    $scope.$watch('selectedProject.selectedSeason', function (newV, oldV) {
        if (!newV || !$scope.selectedProject || !$scope.selectedProject.imdb_id) return;
        $scope.loadEpisodes = true;
        ImdbService.getEpisodesSaisonById({serie_id: $scope.selectedProject.imdb_id}, function (episodeIds) {
          if (!episodeIds) return;
          episodeIds = episodeIds
            .filter(function(item){
              return parseInt(item.seasonNumber) === parseInt($scope.selectedProject.selectedSeason.id)
            })
            .sort(function (a, b) {
              return (parseInt(a.seasonNumber) < parseInt(b.seasonNumber) && parseInt(a.episodeNumber) < parseInt(b.episodeNumber))
            });
          // Si on dispose d'une liste d'épisodes depuis tmdb, on complète avec les id_imdb
          if ($scope.selectedProject.selectedSeason.episodes) {
            $scope.selectedProject.selectedSeason.episodes.forEach(function (episode, idx) {
              var imdbId = episodeIds.find(function (item) {
                return (episode.episode_number === parseInt(item.episodeNumber) && episode.season_number === parseInt(item.seasonNumber))
              })
              episode.imdb_id = imdbId ? imdbId.tconst : null;
            })
          } else {
            // Si la liste des épisodes est vide, on vient alimenter au format attendu
            $scope.selectedProject.selectedSeason.episodes = episodeIds.map(function (item) {
              return {
                episode_number: parseInt(item.episodeNumber),
                season_number: parseInt(item.seasonNumber),
                imdb_id: item.tconst,
              }
            })
          }
          $scope.loadEpisodes = false;
        }, function (error) {
          console.log(error);
          $scope.loadEpisodes = false;
        })
      }
    );

    $scope.searchMovieByImdbId = function (){4
        $scope.projectsList = [];
        
        function queryIMDB () {
            var deferred = $q.defer();
            $scope.loadingProject += 1;
            ImdbService.getMovieByImdbId({ imdb_id: $scope.newProject.imdb_id }, function (response) {
                $scope.loadingProject -= 1;
                var projectType = 'movie';
                if ($scope.searchSerie)
                    projectType = 'serie';
                    
                $scope.newProject.project_type = projectType;
                $scope.newProject.release_date = response.release_date ? moment(response.release_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
                $scope.newProject.imdb_id = response.imdb_id;
                $scope.newProject.vote_count = response.vote_count;
                $scope.newProject.vote_average = response.vote_average;
                $scope.newProject.title = response.title;
                $scope.newProject.name = response.title;
                $scope.newProject.release_date = response.start_year + '-01-01';
                $scope.newProject.original_title = response.original_title;
                $scope.newProject.source = 'imdb';

                $scope.selectedProject = response;
                $scope.selectedProject.source = 'imdb';
                $scope.selectedProject.project_type = projectType; // do for serie too
                $scope.imdbSearchError = false;
                deferred.resolve(response);
            }, function(error) {
                $scope.loadingProject -= 1;
                $scope.imdbSearchError = true;
                deferred.reject(error);
            });
            
            return deferred.promise;
        }

        $q.all([queryIMDB()]).then(function(results){
            results.forEach(function (query) {
                $scope.projectsList.push(query);
            });
        })
    }

    $scope.addProjectName = function ($item, $model) {

      if ($item.source === 'imdb') {
        $scope.newProject.imdb_id = $item.imdb_id;
      } else {
        ImdbService.getIdFromTmdb({
          type: ($item.project_type === 'Films') ? 'movie' : 'tv',
          id: $item.id
        }, function (data) {
          $scope.newProject.imdb_id = data.imdb_id;
          $item.imdb_id = data.imdb_id;
        }, function (error) {
          console.error(error);
        });
      }

      // Handle project selection
      $scope.newProject.name = $item.title;
      $scope.newProject.title = $item.title;
      $scope.selectedProject = $item;

      // Fetch TV Show informations
      if ($item.project_type !== "Films") {
        ProjectsService.getProjectSerieDetail({ id: $item.id }, null, function (success) {
          if (!success.seasons) return;
          $scope.selectedProject.seasons = success.seasons;
          for (var i = 0; i < success.seasons.length; i += 1) {
            var seasonNb = success.seasons[i].season_number;
            var seasonFound = false;
            angular.forEach($scope.seasons, function(season) {
              if (season.id === seasonNb) {
                season.season = success.seasons[i];
                seasonFound = true;
              }
            })
            if (!seasonFound) {
              $scope.seasons.push({ id: seasonNb, key: 'season' + seasonNb, value: $rootScope._T["6vwtywcc"] + ' ' + seasonNb, season:success.seasons[i] });
            }
          }
        }, function(error) {
          console.log(error);
        })
      }
    }

    $scope.addSeason = function ($item, $model) {
      $scope.selectedProject = $scope.selectedProject || $scope.projectForSubProject; // Different entry points for create and edit...
      let = referentPersons= $scope.global.referentPersons;
      let = favoritePersons= $scope.global.favoritePersons;
      $scope.global = {};
      $scope.global.referentPersons = referentPersons;
      $scope.global.favoritePersons = favoritePersons;

      if ($item.season && $scope.selectedProject.id) {
        $scope.loadEpisodes = true;
        ProjectsService.getProjectSerieDetail({ id: $scope.selectedProject.id }, $item.season.season_number, function (success) {
          $scope.selectedProject.selectedSeason = $item;
          $scope.selectedProject.selectedSeason.episodes = success.episodes;
          $scope.loadEpisodes = false;
        }, function(error) {
          console.log(error);
          $scope.loadEpisodes = false;
        })
      }else{
        $scope.selectedProject = $scope.selectedProject || {};
        $scope.selectedProject.selectedSeason = $item;
      }
    }

    $scope.nextStep = function() {
      if ($scope.step == 1) {
        if (!stepForce) {
          helper.checkIfProjectNameAlreadyExists($scope.newProject, function (found) {
            if ($scope.voiceMatchProjects) {
              $scope.step = 4;
            } else if (!found) {
              $scope.step += 1;
            }

            $scope.restricted_edit = $scope.step > 1;
          })
        }
      } else if ($scope.step == 2) {
        if (!helper.isSubprojectExist()) {
          $scope.step += 1;
        }
      } else {
        $scope.step += 1;
      }

      $scope.restricted_edit = $scope.step > 1;
    };

    // Init avec step forcé :edition ou ajout de produit depuis suivi
    if (stepForce && $scope.$parent.project && $scope.$parent.project.id && !$scope.selectedProject) {
      if ($scope.$parent.subproject.nature.name === "serie") {
        $scope.loadEpisodes = true;
        ProjectsService.getProjectSerieDetail(
          { id: $scope.$parent.project.tmdb_id },
          $scope.$parent.subproject.season,
          function (success) {
            $scope.selectedProject = {
              imdb_id: $scope.$parent.project.imdb_id,
              selectedSeason: {
                id: $scope.$parent.subproject.season,
                episodes: success.episodes
              }
            };
            $scope.loadEpisodes = false;
          }, function(error) {
            console.log(error);
            $scope.loadEpisodes = false;
          }
        )
      }
    }
    if (stepForce && $scope.projectForSubProject != null) {
      if ($scope.projectForSubProject.ownSubproject.length > 0) {
        $scope.subProjectLantern = $filter('filter')($scope.projectForSubProject.ownSubproject, {
          'is_lantern': "1"
        }, true);
        $scope.subProjectVoiceMatch = $filter('filter')($scope.projectForSubProject.ownSubproject, {
          'is_lantern': "0"
        }, true);
      }

      if ($scope.projectForSubProject.tmdb_id != null) {
        ProjectsService.getProjectSerieDetail({ id: $scope.projectForSubProject.tmdb_id }, null, function (success) {
          $scope.addProjectName(success);
        }, function(error) {
          console.log(error);
        })
      }
    }

    /* Partie Projet */
    if (!$scope.isEditProject) {
      $scope.newProject = new Project();
      $scope.newProject.owner_id = $.cookie("user_id");
    } else {
      var existedSubproject = $scope.newProject.ownSubproject;//
      $scope.newProject.name = $scope.newProject.original_name;
      $scope.original_imdb_id = $scope.newProject.imdb_id;
      $scope.newProject.is_vip = $scope.newProject.is_vip == "1";
    }

    /* Partie Sous-projet et produit  */
    var newSubproject = new Subproject();
    $scope.newSubproject = newSubproject;
    if ($scope.subproject_id != null) {
      $scope.newSubproject.nature = $scope.subproject_nature;
      $scope.newSubproject.season = $scope.subproject_season;
    }

    $scope.saveEditProject = function() {
      helper.updateProject($scope.newProject.id)
        .then(function(){
          ngDialog.closeAll();
          $state.reload();
        });
    };

    $scope.calcEpisode = function(fullReturn) {
      var result = {};
      result.code = 2;
      result.message = $rootScope._T["yqofbuhb"];

      if ($scope.global.episodeAuto) {
        if($scope.global.startEpisode !== "1") $scope.global.startEpisode = "1";
        if($scope.global.endEpisode !== $scope.selectedProject.selectedSeason.episodes.length.toString()) $scope.global.endEpisode = $scope.selectedProject.selectedSeason.episodes.length.toString();
      }

      if ($scope.global.startEpisode != null && $scope.global.endEpisode != null || $scope.global.episodeAuto) {

        var regex = new RegExp("\\d+$");

        var resultStart = regex.exec($scope.global.startEpisode);
        var resultEnd = regex.exec($scope.global.endEpisode);

        if (resultStart != null && resultStart[0] != null && resultEnd != null && resultEnd[0] != null) {
          if ($scope.global.startEpisode.length == $scope.global.endEpisode.length || $scope.global.episodeAuto) {
            var calcul = parseInt(resultEnd[0]) - parseInt(resultStart[0]) + 1;
            if (fullReturn) {
              var start = parseInt(resultStart[0]);

              var fullArray = [];

              for (var i = 0; i < calcul; i++) {
                var start1 = start + i;

                var format = start1.toString();

                while (format.length < resultEnd[0].length) {
                  format = "0" + format;
                }

                if(!$scope.global.episodeAuto)
                  format = $scope.global.startEpisode.slice(0, $scope.global.startEpisode.lastIndexOf(resultStart[0])) + format;
                fullArray.push({
                  code: format,
                  number: start1
                });
              }

              return fullArray;
            } else {
              result.code = 0;
              result.message = $rootScope._T["k0wx0qgo"] + " " + calcul + " " + $rootScope._T["0n3vuajc"];
            }
          } else {
            result.code = 1;
            result.message = $rootScope._T["x9nqs9v1"];
          }
        } else {
          result.code = 2;
          result.message = $rootScope._T["2x3lpbjj"];
        }
      }
      return result;
    };


    $scope.addTrailer = function() {
      $scope.focus = {};
      var trailer = "";
      $scope.global.trailers.push(trailer);
      $scope.focus[$scope.global.trailers.length] = true;
    };

    $scope.editTrail = function(trailer, index) {
      $scope.global.trailers[index] = trailer;
    };

    $scope.removeTrail = function(index) {
      $scope.global.trailers.splice(index, 1);
    };

    Valuelist.query({tableName: 'subproject_nature'}, 
    function (response) {
        response.pop()
        $scope.subproject_natures = response
    });

    /* note phv 20200104, pas utilisé du tout
    $scope.genres = Valuelist.query({
      tableName: "genres"
    });
    */
    $scope.seasons = Valuelist.query({
      tableName: "seasons"
    });
    $scope.productDescriptions = Valuelist.query({
      tableName: "product_descriptions"
    });

    /* Partie Workflow */

    $scope.workflow_types = ValueListService.getWorkflowTypes()

    $scope.formatmixs = ValueListService.getFormatMix()
    $scope.normesmix = Valuelist.query({
      tableName: "norme_mix"
    });
    $scope.exploitation_types = ValueListService.getExploitationTypes()

    $scope.doublage_types = ValueListService.getDoublageTypes()
    
    $scope.speeds = Valuelist.query({
      tableName: "speed"
    });

    $scope.languages = Valuelist.query({
      tableName: "languages"
    });

    $scope.workflow_model = {};
    $scope.workflow_model.prod_version = "Client";

    // On surveille les champs pour voir si les regles sont respectées, les champs doivent tous etre uniques
    $scope.$watchGroup(
      [
        "newProject.name",
        "newProject.code_name",
        "newProject.code_name_2",
        "newProject.code_name_3"
      ],
      function(newV, oldV) {
        $scope.errorMessage = null;
        var message = $rootScope._T["c4wc1c1n"];
        if (
          $scope.newProject.name &&
            ($scope.newProject.name == $scope.newProject.code_name ||
              $scope.newProject.name == $scope.newProject.code_name_2 ||
              $scope.newProject.name == $scope.newProject.code_name_3)
        ) {
          $scope.errorMessage = message;
        }

        if (
          $scope.newProject.code_name &&
            ($scope.newProject.code_name == $scope.newProject.name ||
              $scope.newProject.code_name == $scope.newProject.code_name_2 ||
              $scope.newProject.code_name == $scope.newProject.code_name_3)
        ) {
          $scope.errorMessage = message;
        }

        if (
          $scope.newProject.code_name_2 &&
            ($scope.newProject.code_name_2 == $scope.newProject.name ||
              $scope.newProject.code_name_2 == $scope.newProject.code_name ||
              $scope.newProject.code_name_2 == $scope.newProject.code_name_3)
        ) {
          $scope.errorMessage = message;
        }

        if (
          $scope.newProject.code_name_3 &&
            ($scope.newProject.code_name_3 == $scope.newProject.name ||
              $scope.newProject.code_name_3 == $scope.newProject.code_name_2 ||
              $scope.newProject.code_name_3 == $scope.newProject.code_name)
        ) {
          $scope.errorMessage = message;
        }

        if ($scope.newProject){
            if ($scope.newProject.name && $scope.newProject.name.length > 0)
                $scope.newProject.name = $scope.newProject.name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');

            if ($scope.newProject && $scope.newProject.code_name && $scope.newProject.code_name.length > 0)
                $scope.newProject.code_name = $scope.newProject.code_name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');

            if ($scope.newProject && $scope.newProject.code_name_2 && $scope.newProject.code_name_2.length > 0)
                $scope.newProject.code_name_2 = $scope.newProject.code_name_2.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            
            if ($scope.newProject && $scope.newProject.code_name_3 && $scope.newProject.code_name_3.length > 0)
                $scope.newProject.code_name_3 = $scope.newProject.code_name_3.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
        }
      }
    );

    // Au changement de saison, on récupère les IDs IMDB des épisodes
    $scope.$watch('selectedProject.selectedSeason', function (newV, oldV) {
        if (!newV || !$scope.selectedProject || !$scope.selectedProject.imdb_id) return;
        $scope.loadEpisodes = true;
        ImdbService.getEpisodesSaisonById({serie_id: $scope.selectedProject.imdb_id}, function (episodeIds) {
          if (!episodeIds) return;
          episodeIds = episodeIds
            .filter(function(item){
              return parseInt(item.seasonNumber) === parseInt($scope.selectedProject.selectedSeason.id)
            })
            .sort(function (a, b) {
              return (parseInt(a.seasonNumber) < parseInt(b.seasonNumber) && parseInt(a.episodeNumber) < parseInt(b.episodeNumber))
            });
          // Si on dispose d'une liste d'épisodes depuis tmdb, on complète avec les id_imdb
          if ($scope.selectedProject.selectedSeason.episodes) {
            $scope.selectedProject.selectedSeason.episodes.forEach(function (episode, idx) {
              var imdbId = episodeIds.find(function (item) {
                return (episode.episode_number === parseInt(item.episodeNumber) && episode.season_number === parseInt(item.seasonNumber))
              })
              episode.imdb_id = imdbId ? imdbId.tconst : null;
            })
          } else {
            // Si la liste des épisodes est vide, on vient alimenter au format attendu
            $scope.selectedProject.selectedSeason.episodes = episodeIds.map(function (item) {
              return {
                episode_number: parseInt(item.episodeNumber),
                season_number: parseInt(item.seasonNumber),
                imdb_id: item.tconst,
              }
            })
          }
          $scope.loadEpisodes = false;
        }, function (error) {
          console.log(error);
          $scope.loadEpisodes = false;
        })
      }
    );

    $scope.$watchGroup(['global.startEpisode', 'global.endEpisode'], function(newV, oldV) {
      if(
        !$scope.global.startEpisode ||
        !$scope.global.endEpisode ||
        (($scope.global.startEpisode.length !== $scope.global.endEpisode.length) && !$scope.global.episodeAuto)
      ) return;
      $scope.multipleEpisodes = [];
      var result = $scope.calcEpisode(true);
      result.forEach(function(code) {
        var aProduct = new Product();
        aProduct.episode_number = code.code;
        aProduct.episode_number_int = code.number;
        aProduct.description_id = 6; //HARDCODED ! BAD !
        $scope.multipleEpisodes.push(aProduct);
      });

    });

    $scope.selectSubprojectImport = function (voiceMatchProject, subproject) {
      subproject.isSelected = !subproject.isSelected;
      voiceMatchProject.isSelected = true;
      angular.forEach($scope.voiceMatchProjects, function(project) {
        if (project.id != subproject.project_id) {
          project.isSelected = false;
          angular.forEach(project.ownSubproject, function(sp) {
            sp.isSelected = false;
          })
        }
      });
    }

    $scope.disableImportButton = function() {
      let disableButton = true;
      angular.forEach($scope.voiceMatchProjects, function(project) {
        angular.forEach(project.ownSubproject, function(subproject) {
          if (subproject.isSelected) {
            disableButton = false;
          }
        });
      });
      return disableButton;
    }

    $scope.importProject = function() {
      $scope.loading = true;
      let selectedProjectId = null;
      let selectedSubprojectId = null;
      angular.forEach($scope.voiceMatchProjects, function(project) {
        if (project.isSelected) {
          selectedProjectId = project.id;
          angular.forEach(project.ownSubproject, function(subproject) {
            if (subproject.isSelected) {
              selectedSubprojectId = subproject.id;
              ApiRest.get('/subprojects/importfromvoicematch/' + subproject.id, {}, function(data) {
                helper.createSuivi(selectedSubprojectId);
              });
            }
          });
        }
      });
      if (selectedProjectId != null) {
        helper.updateProject(selectedProjectId);
        ngDialog.closeAll();
        $scope.loading = false;
        if ($.cookie("role") != "digitalmedia") {
          $state.go("app.suiviProd", {
            id: selectedSubprojectId
          });
        }
      }
    }

    $scope.importProjectAndAddSubproject = function(project) {
      $scope.loading = true;
      helper.updateProject(project.id);
      $scope.loading = false;
      ProjectsService.createSubProject(project);
    }

    $scope.importSubproject = function(subproject) {
      swal({
        title: $rootScope._T["k9ttf0tv"],
        text: $rootScope._T["b935hc30"],
        type: "warning",
        showCancelButton: true,
        confirmButtonText: $rootScope._T["w7redrmn"],
        cancelButtonText: $rootScope._T["adoyhyi2"],
        closeOnConfirm: true
      }, function() {
        $scope.loading = true;
        ApiRest.get('/subprojects/importfromvoicematch/' + subproject.id, {}, function(data) {
          helper.createSuivi(subproject.id);
          if ($.cookie("role") != "digitalmedia") {
            $state.go("app.suiviProd", {
              id: subproject.id
            });
          }
          $scope.loading = false;
          ngDialog.closeAll();
        });
      });
    }

    $scope.unlinkImdb = function() {
      $scope.newProject.imdb_id = null;
      $scope.selectedProject.imdb_id = null;
      if($scope.selectedProject.selectedSeason && $scope.selectedProject.selectedSeason.episodes) {
        $scope.selectedProject.selectedSeason.episodes.forEach(function(item){
          item.imdb_id = null;
        })
      }
    }

    // les methodes privées propre à ce controller
    helper.checkIfProjectNameAlreadyExists = function(params, successCalback) {
      $scope.loading = true;
      $scope.errorMessage = ApiRest.errorMessage(null); // reset le message d'erreur
      ApiRest.get(
        "/projects/checkName",
        params,
        function(result) {
          if (result.isVoiceMatch) {
            $scope.loading = false;
            $scope.voiceMatchProjects = result.projects;
            return successCalback(result.response);
          } else if (result.error) {
            $scope.loading = false;
            $scope.errorMessage = ApiRest.errorMessage(
              result.error.code,
              params.name
            );
          } else {
            $scope.loading = false;
            return successCalback(result.response);
          }
        },
        function(result) {
          $scope.loading = false;
          $scope.errorMessage = ApiRest.errorMessage(
            result.error.code,
            params.name
          );
        }
      );
    };

    helper.isSubprojectExist = function() {
      if ($scope.projectForSubProject != null && $scope.projectForSubProject.ownSubproject != null) {
        $scope.newSubproject.ownSubproject = $scope.projectForSubProject.ownSubproject;
      }
      var found = false;
      if ($scope.newSubproject.nature != null && $scope.newSubproject.ownSubproject != null) {
        angular.forEach($scope.newSubproject.ownSubproject, function(subproject) {
          if (subproject.nature.name != "serie" && subproject.nature.name == $scope.newSubproject.nature.name) {
            found = true;
          } else if (subproject.nature.name == "serie" && subproject.season == $scope.newSubproject.season) {
            found = true;
          }
        });
        if (found) {
          swal(
            $rootScope._T["vnsuufbc"],
            $rootScope._T["kx9dz4cr"],
            "error"
          );
        }
        return found;
      }
    };

    $scope.validateCreation = function() {
      $scope.loading = true;
      if ($scope.project_id == null && $scope.subproject_id == null) {
        helper.createNewProject();
      } else if ($scope.project_id != null && $scope.subproject_id == null) {
        helper.createNewSubProject(null);
      } else if ($scope.project_id == null && $scope.subproject_id != null) {
        helper.createNewProducts(null);
      }
    };

    helper.createNewProject = function() {
        $scope.loading = true;

        function createProject() {
            $scope.newProject.$save(function(response) {
                helper.saveMetricsUsers(response.id);
                helper.addFavorites(response.id);
                // assign referent for the project
                helper.addReferentProject(response.id);
                helper.createNewSubProject(response);
            });
        }
        /** Ajout de clés manquantes en cas de création manuelle */
        $scope.newProject.title = $scope.newProject.title || $scope.newProject.name;
        $scope.newProject.original_name = $scope.newProject.title || $scope.newProject.name;

        /** Formatage de newProject en fonction de selectedProject */
        if ($scope.selectedProject != null) {
            $scope.newProject.original_name =
            $scope.selectedProject.original_name != null
                ? $scope.selectedProject.original_name
                : $scope.selectedProject.original_title;
            $scope.newProject.languages = $scope.selectedProject.original_language;
            $scope.newProject.overview = $scope.selectedProject.overview;
            $scope.newProject.backdrop = $scope.selectedProject.backdrop_path;
            $scope.newProject.poster = $scope.selectedProject.poster_path;
            $scope.newProject.popularity = $scope.selectedProject.popularity;
            $scope.newProject.vote_average = $scope.selectedProject.vote_average;
            $scope.newProject.vote_count = $scope.selectedProject.vote_count;
            $scope.newProject.tmdb_id = $scope.selectedProject.id;
            $scope.selectedProject.tmdbId = $scope.selectedProject.id;
            $scope.selectedProject.tmdbId = $scope.selectedProject.id;
        }
        /** Si film, on créé un movie
         * TODO: Sera à supprimer à terme lors de la fusion des films avec la table project
         * */
        if (($scope.selectedProject != null && $scope.selectedProject.project_type === "Films") ||
        $scope.newSubproject.nature.name === 'film') {
            
            if ($scope.selectedProject !== undefined){
                var project_clean = angular.copy($scope.selectedProject);
                project_clean.title = $scope.newProject.title;
                project_clean.original_title = $scope.newProject.original_name;
                delete project_clean.genre_ids;
                delete project_clean.$$hashKey;
            } else {
                var project_clean = {
                    title: $scope.newProject.title,
                    original_title: $scope.newProject.original_name
                }
            }
            
            ProjectsService.saveMovie(
                {},
                project_clean,
            function(movie) {
                $scope.newProject.movie_id = movie.id;
                createProject();
            },
                function(error) {
                console.error(error);
                createProject();
            })
            
        } else {
            if ($scope.selectedProject !== undefined){
                var project_clean = angular.copy($scope.selectedProject);
                project_clean.title = $scope.newProject.title;
                project_clean.original_title = $scope.newProject.original_nam
                delete project_clean.genre_ids;
                delete project_clean.$$hashKey;
            } else {
                var project_clean = {
                    title: $scope.newProject.title,
                    original_title: $scope.newProject.original_name
                }
            }

            ProjectsService.saveSerie({},
                project_clean,
                function(serie) {
                    createProject();
                },
                function(error) {
                    console.error(error);
                    createProject();
            })
        }
    };

    helper.createNewSubProject = function(project) {
        var idProject;
        if ($scope.project_id != null) {
            idProject = $scope.project_id;
        } else {
            idProject = project.id;
        }
        //$scope.project = Project.get({projectId: $scope.projectId});
        $scope.newSubproject.project_id = idProject;
        $scope.newSubproject.type_id = $scope.global.productTypeId;

        if ($scope.newSubproject.nature != null) {
            //TODO:Fix ?
            if ($scope.newSubproject.nature.name !== "serie") {
            delete $scope.newSubproject.season;
            }
            $scope.newSubproject.nature_id = $scope.newSubproject.nature.id;
            $scope.nature_name = $scope.newSubproject.nature.name;
            delete $scope.newSubproject.nature;
            delete $scope.newSubproject.ownSubproject;
        }

        if (
            $scope.selectedProject != null &&
            $scope.selectedProject.selectedSeason != null &&
            $scope.selectedProject.selectedSeason.season != null
        ) {
            $scope.newProject.overview = $scope.selectedProject.selectedSeason.season.overview ? $scope.selectedProject.selectedSeason.season.overview : null;
            $scope.newProject.poster = $scope.selectedProject.selectedSeason.season.poster_path ? $scope.selectedProject.selectedSeason.season.poster_path : null;
            $scope.newProject.episode_count = $scope.selectedProject.selectedSeason.season.episode_count ? $scope.selectedProject.selectedSeason.season.episode_count : null;
            $scope.newProject.tmdb_id = $scope.selectedProject.selectedSeason.season.id ? $scope.selectedProject.selectedSeason.season.id : null;
            $scope.newProject.air_date = $scope.selectedProject.selectedSeason.season.air_date ? $scope.selectedProject.selectedSeason.season.air_date : null;
        }

        $scope.newSubproject.$save(function(subProject) {
            helper.addReferentProject(subProject.id,'subproject'); //add referent for the subproject
            helper.createSuivi(subProject.id);
            helper.createNewProducts(subProject);
        });
    };

    helper.createNewProducts = function(subProject) {
      var idSubProject;
      var allProductsIds = [];

      if ($scope.subproject_id != null) {
        idSubProject = $scope.subproject_id;
      } else {
        idSubProject = subProject.id;
      }

      if ($scope.global.episodeCustom == true) {
        var aProduct = new Product();
        aProduct.subproject_id = idSubProject;
        aProduct.episode_number = $scope.global.customName;
        aProduct.type = $scope.global.productType;
        aProduct.$save({}, function() {
          if (
            ($scope.subproject_id == null ||
              ($scope.project_id != null && $scope.project_name != null)) &&
            $.cookie("role") != "digitalmedia"
          ) {
            $scope.loading = false;
            $state.go("app.suiviProd", {
              id: idSubProject,
            });
          } else {
            $scope.loading = false;
            ngDialog.closeAll();
          }
        }, function (error) {
              console.log(error);
        });
      } else if (
        $scope.global.startEpisode != null &&
        $scope.global.endEpisode != null
      ) {
        //S'il y a plusieurs élément à créer
        //Création des épisode multiples

        if ($scope.multipleEpisodes.length > 0) {
          var listEpisodes = (($scope.selectedProject != undefined && $scope.selectedProject.selectedSeason != undefined && $scope.selectedProject.selectedSeason.episodes != undefined )? $scope.selectedProject.selectedSeason.episodes: null)  ;
          $scope.multipleEpisodes.forEach(function(newEpisode, i) {
            var matchedEpisode = listEpisodes ? listEpisodes.find(function(item) {
              return (item.season_number === parseInt($scope.selectedProject.selectedSeason.id) && item.episode_number === newEpisode.episode_number_int)
            }) : null;
            if (matchedEpisode) {
              newEpisode.tmdb_id = matchedEpisode.id;
              newEpisode.imdb_id = matchedEpisode.imdb_id;
              newEpisode.air_date = matchedEpisode.air_date;
              newEpisode.still_path = matchedEpisode.still_path;
              newEpisode.overview = matchedEpisode.overview;
              newEpisode.title_vf = matchedEpisode.name;
              newEpisode.name = matchedEpisode.name;
            }
            newEpisode.type = $scope.global.productType;
            newEpisode.ep_number_tmdb = matchedEpisode ? matchedEpisode.episode_number : newEpisode.episode_number_int;
            newEpisode.subproject_id = idSubProject;
            delete newEpisode.episode_number_int;
            newEpisode.$save({}, function(aProduct) {
              if (
                ($scope.subproject_id == null ||
                  ($scope.project_id != null && $scope.project_name != null)) &&
                $.cookie("role") != "digitalmedia"
              ) {
                $state.go("app.suiviProd", {
                  id: newEpisode.subproject_id
                });
              }
              $scope.loading = false;
              ngDialog.closeAll();
            }, function (error) {
              console.log(error);
            });
          });
        } else {
          console.error("Error creating multiple episode");
        }
      } else if (
        $scope.nature_name == "film" ||
        ($scope.newSubproject.nature != null &&
          $scope.newSubproject.nature.name == "film")
      ) {
        //Si film
        var aProduct = new Product();
        aProduct.subproject_id = idSubProject;
        aProduct.description_id = $scope.global.descProduct;
        aProduct.imdb_id = $scope.selectedProject ? $scope.selectedProject.imdb_id : null;
        aProduct.title_vf = $scope.selectedProject ? $scope.selectedProject.title : null;
        aProduct.name = $scope.selectedProject ? $scope.selectedProject.original_title : null;
        aProduct.$save({}, function() {
          if (
            ($scope.subproject_id == null ||
              ($scope.project_id != null && $scope.project_name != null)) &&
            $.cookie("role") != "digitalmedia"
          ) {
            $state.go("app.suiviProd", {
              id: aProduct.subproject_id
            });
          }
          $scope.loading = false;
          ngDialog.closeAll();
        });
      } else if (
        $scope.global.trailers && $scope.global.trailers.length !== 0
      ) {
        //Si trailer
        var size = $scope.global.trailers ? $scope.global.trailers.length : 0;
        var count = 0;
        $scope.global.trailers.forEach(function(trailer) {
          if (trailer != "") {
            var aProduct = new Product();
            aProduct.description_text = trailer;
            aProduct.subproject_id = idSubProject;
            aProduct.$save({}, function() {
              count++;
              if (count == size) {
                if (
                  ($scope.subproject_id == null ||
                    ($scope.project_id != null &&
                      $scope.project_name != null)) &&
                  $.cookie("role") != "digitalmedia"
                ) {
                  $state.go("app.suiviProd", {
                    id: aProduct.subproject_id
                  });
                }
                $scope.loading = false;
                ngDialog.closeAll();
              }
            });
          } else {
            size--;
          }
        });
      }
    };

    helper.createWorkflow = function(allProducts) {
      if (allProducts.length != 0) {
        var newWorkflow = new Workflow();

        newWorkflow.workflow_type_id = $scope.workflow_model.workflow_type.id;
        newWorkflow.exploitation_id = $scope.workflow_model.exploitation_id;
        newWorkflow.format_mix_id = $scope.workflow_model.format_mix_id;
        newWorkflow.norme_mix_id = $scope.workflow_model.norme_mix_id;
        newWorkflow.language_id = $scope.workflow_model.language_id;
        newWorkflow.doublage_type_id = $scope.workflow_model.doublage_type_id;
        newWorkflow.prod_version = $scope.workflow_model.prod_version;
        newWorkflow.speed_id = $scope.workflow_model.speed_id;
        newWorkflow.products_ids = allProducts.join(",");

        newWorkflow.$save({}, function() {
          ngDialog.closeAll();
        });
      } else {
        ngDialog.closeAll();
      }
    };

    helper.updateProject = function(project_id) {
      var deferred = $q.defer();

      var upProject = new Project();
      upProject.name = $scope.newProject.name;
      upProject.code_name = $scope.newProject.code_name;
      upProject.code_name_2 = $scope.newProject.code_name_2;
      upProject.code_name_3 = $scope.newProject.code_name_3;
      upProject.client_id = $scope.newProject.client_id;
      upProject.display_name = $scope.newProject.display_name;
      upProject.title_phelix = ($scope.newProject.title_phelix != undefined ? $scope.newProject.title_phelix: null);
      upProject.record_job_id = ($scope.newProject.record_job_id != undefined ? $scope.newProject.record_job_id : null );
      upProject.is_vip = $scope.newProject.is_vip;
      upProject.type_id = $scope.global.productTypeId;

      upProject.$update({projectId: project_id}, function() {
        helper.addFavorites(project_id);
        helper.saveMetricsUsers(project_id);
        if ($scope.newProject.imdb_id && $scope.original_imdb_id && ($scope.newProject.imdb_id !== $scope.original_imdb_id)) {
          ProjectsService.clearProductsImdbId(project_id);
        }
        
        //remove old project referent
        if( $scope.global.referentPersons.length > 0){
          Favorite.removeReferentProjectOrSubproject(
              {idElement:project_id, type:'project' }
              ,function() {
                // update referent for the project
                helper.addReferentProject(project_id);
                // apdate referent for the subproject
                helper.updateAllReferentSubproject (project_id);
                delete $rootScope.chargeprod[project_id]; // clean cache chargeprod
              }
          );
        }

        deferred.resolve();
      });
      return deferred.promise;
    }

    helper.updateAllReferentSubproject = function(project_id) {
      if(existedSubproject != undefined && $scope.global.referentPersons.length > 0){
        angular.forEach(existedSubproject, function(subproject) {
          //remove old subproject referent
          Favorite.removeReferentProjectOrSubproject(
              {idElement:subproject.id, type:'subproject' }
              ,function() {
                helper.addReferentProject(subproject.id,'subproject'); //add referent for the subproject
              }
          );
        });
      }
    }

    helper.saveMetricsUsers = function(project_id) {
      var user_ids = [];
      $scope.users_of_client_selected.forEach(function(user) {
        user_ids = user_ids.concat([user.user_id]);
      });

      User.saveMetricsUsers({
        userIds: user_ids,
        projectId: project_id
      }, function(obj) {
      });
    }

    helper.addFavorites = function(project_id) {
      if ($.cookie("role") != "digitalmedia") {
        var newFav = new Favorite();
        newFav.user_id = $.cookie("user_id");
        newFav.project_id = project_id;
        newFav.$save();
      }

      angular.forEach($scope.global.favoritePersons, function(person) {
        var newFav = new Favorite();
        newFav.user_id = person;
        newFav.project_id = project_id;
        newFav.$save();
      });

      //Ajout de Benoit automatiquement en favoris
      var newFavBen = new Favorite();
      newFavBen.user_id = 28;
      newFavBen.project_id = project_id;
      newFavBen.$save();

      // Remove the user_favorite who are not selected
      helper.removeUserFavorites(project_id);
    }

    helper.removeUserFavorites = function(project_id) {
      try {
        if ($scope.global.favoritePersonsDiff != undefined && $scope.global.favoritePersons != undefined ) {
          angular.forEach($scope.global.favoritePersonsDiff, function (user) {
            let isUserInFavoritePersons = $scope.global.favoritePersons.some(function (favoritePerson) {
              return ((favoritePerson.id != undefined && favoritePerson.id == user.id) || (favoritePerson.id == undefined && favoritePerson == user.id) );
            });
            if (!isUserInFavoritePersons) {
              const params = { id: project_id, puser_id: user.id };
              Favorite.delete(params);
            }
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    helper.createSuivi = function(subprojectId) {
      let newTab = new TableauSuivi();
      newTab.subproject_id = subprojectId;
      newTab.$save({}, function() {
      });
    }

    helper.addReferentProject = function(elmentId, type) {
      angular.forEach($scope.global.referentPersons, function(person) {
        if(type == 'subproject'){
          var newFav = new Favorite();
          newFav.user_id = person;
          newFav.subproject_id = elmentId;
          newFav.is_referent = 1;
          newFav.$saveFavoriteSubproject();

        }else{ // project
          var newFav = new Favorite();
          newFav.user_id = person;
          newFav.project_id = elmentId;
          newFav.is_referent = 1;
          newFav.$save();
        }
      });
    }
  }
]);
