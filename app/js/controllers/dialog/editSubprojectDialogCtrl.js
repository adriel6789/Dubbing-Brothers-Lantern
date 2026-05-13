Lantern.controller('EditSubprojectDialogCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Subproject', 'Valuelist', 'Product', 'ProductService', 'Notification', 'PersonsService', 'Favorite',
function ($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, Subproject, Valuelist, Product, ProductService, Notification, PersonsService, Favorite)
{
    $scope.branchId = $rootScope.user_entity.person.branch_id
    Valuelist.query({tableName: 'subproject_nature'}, 
        function (response) {
            response.pop()
            $scope.nature_types = response
        });
    $scope.referentPersons = [];
    $scope.dubPlacesByLocValue = $rootScope.dubPlacesByLocValue
    $scope.mainLocationList = $rootScope.mainLocationList
    PersonsService.getArtisticDirectors(function(artisticDirectors) {
      $scope.artisticDirectors = artisticDirectors;
    });
    PersonsService.getStageManagers(function (stageManagers) {
        $scope.stageManagers = $rootScope.stageManagers
      }, PersonsService.manageStageManagersError)

    $scope.updateSubproject = function() {
        updatedSubproject = new Subproject();
        var nature_id = $scope.subprojectToEdit.nature.id;

        if (nature_id != null) {
            updatedSubproject.nature_id = nature_id;

            if ($scope.subprojectToEdit.nature.name != 'serie') {
                updatedSubproject.season = null;
            } else {
                updatedSubproject.season = $scope.subprojectToEdit.season;
            }

            updatedSubproject.artistic_director_id = $scope.subprojectToEdit.artistic_director_id;
            updatedSubproject.co_artistic_director_id = $scope.subprojectToEdit.co_artistic_director_id;
            updatedSubproject.stage_manager_id = $scope.subprojectToEdit.stage_manager_id
            updatedSubproject.song_director_id = $scope.subprojectToEdit.song_director_id;
            updatedSubproject.$update({id: $scope.subprojectToEdit.id}, function (data) {
                $scope.updateReferentSubProject($scope.subprojectToEdit.id);  // updatereferent subproject
                ngDialog.closeAll();
            }, function (data) {
                return "Error " + data.status + " : " + data.statusText;
            });

        }

    };
    
    $scope.blShowPhelixCompo =true
    $scope.updatePhelixSeasonItem = function() {
        $scope.blShowPhelixCompo =false;
        updatedSubproject = new Subproject();
        updatedSubproject.title_phelix =  ($scope.subprojectToEdit.title_phelix != undefined ? $scope.subprojectToEdit.title_phelix: null);
        updatedSubproject.record_job_id = ($scope.subprojectToEdit.record_job_id != undefined ? $scope.subprojectToEdit.record_job_id: null);
        updatedSubproject.$update({id: $scope.subprojectToEdit.id}, function (data) {
            // reload phelix list episodes
                $scope.blShowPhelixCompo =true;
        }, function (data) {
            return "Error " + data.status + " : " + data.statusText;
        });

    };

    $scope.updateReferentPersons = function (favoritePersons){
        $scope.referentPersons = favoritePersons;
    }

    $scope.updateReferentSubProject = function(elementId) {
        Favorite.removeReferentProjectOrSubproject(
            {
                idElement:elementId ,
                type:'subproject' 
            }
            ,function() {
                angular.forEach($scope.referentPersons, function(person) {
                    var newFav = new Favorite();
                    newFav.user_id = person;
                    newFav.subproject_id = elementId;
                    newFav.is_referent = 1;
                    newFav.$saveFavoriteSubproject();
                });
                if(elementId != undefined  &&  $rootScope.chargeprod[elementId] != undefined){
                     delete $rootScope.chargeprod[elementId]
                }

            }
        );
    }

    $scope.updateProduct = function () {
        
        
        // var data = {};
        // data[element] = product[element];
        // ProductService.updateProduct({
        //     id: product.id
        // }, data, function(product) {
        //     Notification.success("Le produit a été mis à jour.")
        // }, function(error) {
        //     Notification.error("Une erreur est survenue, veuillez réessayer.")
        // });


        var productToUpdate = {}
        if($scope.product.episode_number != null){
            productToUpdate.episode_number = $scope.product.episode_number
        } else {
            productToUpdate.description_text = $scope.product.description_text
        }
        ProductService.updateProduct({ id: $scope.product.id }, productToUpdate, function () {
            Notification.success($rootScope._T["xidwkts7"])
            ngDialog.closeAll();
        }, function (error) {
            Notification.error($rootScope._T["zrlc1k8e"])
            console.error("Problème dans l'update :", error);
        })
    }


}
]);
