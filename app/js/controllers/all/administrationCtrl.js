Lantern.controller('AdministrationCtrl', ['$rootScope', '$scope', '$state', '$location', '$q', 'User', 'Request', 'Farmer', 'RequestService', 'Project', 'ProjectsService', 'ImdbService', 'NgTableParams','$filter',
    function ($rootScope, $scope, $state, $location, $q, User, Request, Farmer, RequestService, Project, ProjectsService, ImdbService, NgTableParams, $filter)
    {
      var role = $.cookie('role');
        if($rootScope.user_Permission)
        {
          $scope.search = function () {
            if ($scope.searchType === 'request') {
              $scope.id_request = $scope.id_search;
              $scope.searchRequest();
            }
            if ($scope.searchType === 'project') {
              $scope.id_project = $scope.id_search;
              this.searchProject();
            }
          }

          $scope.searchRequest = function () {
            Request.get({requestId : $scope.id_request}, function(request){
              if(request.id == 0) {
                $scope.error = true
              }
              else {
                $scope.request = request
                $scope.error = false
              }
            })
          }

          $scope.searchProject = function () {
            Project.get({projectId : $scope.id_project}, function(project){
              if(project.id == 0) {
                $scope.error = true
              }
              else {
                $scope.project = project
                $scope.itemType = project.movie_id ? 'Film' : 'Serie'
                $scope.newProject = {};
                $scope.newProducts = [];
                $scope.switchErrors = [];
                $scope.error = false
                angular.forEach(project.ownSubproject, function (subProject) {
                  if (!subProject.season && !project.movie_id) {
                    $scope.switchErrors.push($rootScope._T["fvx8jh5m"] + subProject.id);
                  }
                })
              }
            })
          }

          $scope.changeRequestStatus = function(status) {

            RequestService.updateRequestStatus(status, $scope.request, function (request) {
              $scope.request.is_planned = request.is_planned
                $scope.request.is_done = request.is_done
                $scope.request.is_not_done = request.is_not_done
                $scope.request.is_sent_back = request.is_sent_back
                $scope.request.is_in_progress = request.is_in_progress
                $scope.request.is_finished = request.is_finished
                $scope.request.is_partial = request.is_partial
                $scope.request.is_validated_for_tech = request.is_validated_for_tech
            })
            var updateRequest = new Request()
            switch(status){
              case 'unplanned':
                updateRequest.is_planned = 0
                updateRequest.is_done = 0
                updateRequest.is_not_done = 0
                updateRequest.is_sent_back = 0
                updateRequest.is_in_progress = 0
                updateRequest.is_finished = 0
                updateRequest.is_partial = 0
                updateRequest.is_validated_for_tech = 0
                break;
              case 'planned':
                updateRequest.is_planned = 1
                updateRequest.is_done = 0
                updateRequest.is_not_done = 0
                updateRequest.is_sent_back = 0
                updateRequest.is_in_progress = 0
                updateRequest.is_finished = 0
                updateRequest.is_partial = 0
                updateRequest.is_validated_for_tech = 0
                break;
              case 'in_progress':
                updateRequest.is_planned = 1
                updateRequest.is_done = 0
                updateRequest.is_not_done = 0
                updateRequest.is_sent_back = 0
                updateRequest.is_in_progress = 1
                updateRequest.is_finished = 0
                updateRequest.is_partial = 0
                updateRequest.is_validated_for_tech = 1
                break;
              case 'replan':
                updateRequest.is_planned = 1
                updateRequest.is_done = 0
                updateRequest.is_not_done = 1
                updateRequest.is_sent_back = 0
                updateRequest.is_in_progress = 0
                updateRequest.is_finished = 0
                updateRequest.is_partial = 0
                updateRequest.is_validated_for_tech = 1
                break;
              case 'finished':
                updateRequest.is_planned = 1
                updateRequest.is_done = 1
                updateRequest.is_not_done = 0
                updateRequest.is_sent_back = 1
                updateRequest.is_in_progress = 0
                updateRequest.is_finished = 0
                updateRequest.is_partial = 0
                updateRequest.is_validated_for_tech = 1
                break;
            }
            // updateRequest.$update({requestId : $scope.request.id}, function(request){
            //   $scope.request.is_planned = request.is_planned
            //   $scope.request.is_done = request.is_done
            //   $scope.request.is_not_done = request.is_not_done
            //   $scope.request.is_sent_back = request.is_sent_back
            //   $scope.request.is_in_progress = request.is_in_progress
            //   $scope.request.is_finished = request.is_finished
            //   $scope.request.is_partial = request.is_partial
            //   $scope.request.is_validated_for_tech = request.is_validated_for_tech
            // })
          }

          $scope.deleteFarmer = function(farmer) {
            swal({
              title: $rootScope._T["5555r2as"],
              text: $rootScope._T["e9jdpd3k"],
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: $rootScope._T["0l6cucak"],
              closeOnConfirm: false
            },
              function(){
                Farmer.delete({id:farmer.id}, function(data){
                  farmer.remove = 1
                  swal({
                    title: $rootScope._T["a0sktoy6"],
                    text: $rootScope._T["utau3uxk"],
                    type: "success",
                    confirmButtonText: $rootScope._T["osiokh8r"]
                  });
                })
              });

          }

          $scope.updateFarmer = function(farmer) {
            upFarmer = new Farmer()
            upFarmer.working_time_start = farmer.working_time_start
            upFarmer.working_time_end = farmer.working_time_end
            upFarmer.break_time = farmer.break_time

            switch (farmer.status) {
              case 'finishedR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 1
                upFarmer.is_done = 1
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 0
                break;
              case 'finishedNR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 0
                upFarmer.is_done = 1
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 0
                break;
              case 'unfinishedR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 1
                upFarmer.is_done = 1
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 1
                break;
              case 'unfinishedNR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 0
                upFarmer.is_done = 1
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 1
                break;
              case 'notDoneR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 1
                upFarmer.is_done = 0
                upFarmer.is_not_done = 1
                upFarmer.is_partial = 0
                break;
              case 'notDoneNR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 0
                upFarmer.is_done = 0
                upFarmer.is_not_done = 1
                upFarmer.is_partial = 0
                break;
              case 'unTraiteR':
                upFarmer.is_selected = 1
                upFarmer.is_finished = 0
                upFarmer.is_done = 0
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 0
                break;
              case 'unTraiteNR':
                upFarmer.is_selected = 0
                upFarmer.is_finished = 0
                upFarmer.is_done = 0
                upFarmer.is_not_done = 0
                upFarmer.is_partial = 0
                break;
            }
            delete upFarmer.status

            upFarmer.$directUpdate({id:farmer.id}, function(data){
              farmer.is_selected = data.is_selected
              farmer.is_finished = data.is_finished
              farmer.is_done = data.is_done
              farmer.is_not_done = data.is_not_done
              farmer.is_partial = data.is_partial
            })
          }

          // IMDB Functions
          $scope.imdbCardOpen = false;
          $scope.imdbLoading = false;
          $scope.newProject = {};
          $scope.newProducts = [];
          $scope.switchErrors = [];
          $scope.seasonEpisodesList  = {};
          $scope.new_imdb = {
            selected: null
          };

          $scope.toggleImdbCard = function () {
            $scope.imdbCardOpen = !$scope.imdbCardOpen;
          }

          $scope.searchImdbId = function (search, type) {
            $scope.newProject = {};
            $scope.newProducts = [];
            $scope.imdbLoading = true;
            $scope.seasonEpisodesList = {};

            var imdbId = String(search).trim();
            var tmdb_id = null;

            // Search and set project infos
            ProjectsService.getTmdbFromImdbId({id: imdbId, type: type}).then(function(results){
              if(results.length > 0) {
                tmdb_id = results[0].id;
                $scope.newProject = results.map(function(item){
                  return {
                    id: $scope.project.id,
                    name : item.name || item.title,
                    title : item.name || item.title,
                    original_name : item.original_name || item.original_title,
                    languages : item.original_language,
                    overview : item.overview,
                    backdrop : item.backdrop_path,
                    poster : item.poster_path,
                    popularity : item.popularity,
                    vote_average : item.vote_average,
                    vote_count : item.vote_count,
                    tmdb_id : item.id,
                    imdb_id : imdbId
                  }
                })[0]
              } else {
                $scope.newProject = { imdb_id : imdbId }
              }
            })

            // search and set episodes info
            if(type === 'tv') {
              ImdbService.getEpisodesSaisonByIdDefer({ serie_id: imdbId }).then(function(result){
               $scope.seasonEpisodesList = result; // liste des episodes pour choisir manuellement l'imdb_id 
                $scope.episodesImdbIds = {};
                angular.forEach(result, function(item){
                  $scope.episodesImdbIds[item.seasonNumber+'_'+item.episodeNumber] = item.tconst;
                })

                angular.forEach($scope.project.ownSubproject, function (subProject) {
                  angular.forEach(subProject.ownProduct, function (product) {
                    var newProduct = angular.copy(product);
                    newProduct.imdb_id = $scope.episodesImdbIds[subProject.season + '_' + (product.ep_number_tmdb)]
                    $scope.newProducts.push(newProduct);
                  })
                })
                $scope.imdbLoading = false;
              })
            } else {
              $scope.imdbLoading = false;
            }
          }
          
          $scope.selectedProductIds =[];
          $scope.checkedAll =[];
          
          $scope.checkEnableApplySeasonButton = function(subProjectId) {
            $scope.selectedProductIds[subProjectId][0] = false;  // init to false 
            angular.forEach($scope.selectedProductIds[subProjectId], function (productIds,k) {
              if(k != 0 &&  productIds == true){
                $scope.selectedProductIds[subProjectId][0] = true;  // id 0 is used to disable the apply button
              }
            });
          }

          $scope.toggleSelectionAllEpisodes = function(checkAction,subProjectId) {
            angular.forEach($scope.newProducts, function (product) {
                    if(product.subproject_id == subProjectId  ){
                      if($scope.selectedProductIds[subProjectId] == undefined)$scope.selectedProductIds[subProjectId]=[];
                      $scope.selectedProductIds[subProjectId][product.id] = checkAction;
                      $scope.selectedProductIds[subProjectId][0] = checkAction;
                    }
              });
          }

          $scope.applyChangesSeasonEpisodes = function (subProjectId) {
            var selectedProduct = [];
            if($scope.selectedProductIds[subProjectId] != undefined && Object.keys($scope.selectedProductIds[subProjectId]).length >0 ){
              angular.forEach($scope.newProducts, function (product) {
                if(product.subproject_id == subProjectId && $scope.selectedProductIds[subProjectId][product.id] == true  ){
                  selectedProduct.push(product);
                }
              });

              $scope.imdbLoading = true;
              ProjectsService.switchProjectImdbId({
                project: $scope.newProject,
                products: selectedProduct,
                apply: true,
                subprojectId: subProjectId
              }).then(function(data){
                $scope.imdbCardOpen = false;
                $scope.searchProject();
                $scope.imdbLoading = true;
                $scope.selectedProductIds =[];
                $scope.checkedAll =[];
              })
            }else{
              console.log('Please select productIds to update !');
            }
          }

          $scope.applyChanges = function () {
            $scope.imdbLoading = true;
            ProjectsService.switchProjectImdbId({
              project: $scope.newProject,
              products: $scope.newProducts,
              apply: true
            }).then(function(data){
              $scope.imdbCardOpen = false;
              $scope.searchProject();
              $scope.imdbLoading = true;
            })
          }

          $scope.changeEpisodeImdbId = function () {
            angular.forEach($scope.newProducts, function (product) {
              if($scope.new_imdb != null && $scope.new_imdb[product.id] != undefined && $scope.new_imdb[product.id].selected.tconst != undefined){
                  product.imdb_id = $scope.new_imdb[product.id].selected.tconst;
                  product.ep_number_tmdb = $scope.new_imdb[product.id].selected.episodeNumber;   //sauvegader le numero episoe associé à imdb aussi
              }
            })
          }

          $scope.listRequestStatusToCheck = function (value) {
            $scope.contentRequest = []
            $scope.data = []
            $scope.columns = []
            Request.adminCheckRequestsStatus( {period_days:value},function (item) {
                        item.forEach(function (job,key) {
                          if(key ==0) $scope.columns = Object.keys(job);
                        $scope.contentRequest.push(job)
                        });
            $scope.tableParams = new NgTableParams(
                                                  {page: 1,count: 25},
                                                  { total:$scope.contentRequest.length, getData: function($defer, params) {
                                                              // use build-in angular filter
                                                              $scope.data = params.sorting() ? $filter('orderBy')($scope.contentRequest, params.orderBy()) : $scope.contentRequest;
                                                              $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
                                                              $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
                                                              $defer.resolve($scope.data);
                                                            }
                                                  }); 
            });
          };
        }
        else
        {
          alert($rootScope._T["o8fc1v6o"]);
          $location.path( getPathRole(role) );
        }
    }
]);
