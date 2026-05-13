Lantern.controller('personEditDialogCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'RequestService',
function ($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, RequestService)
{
    // edit da, song_da and stage_manager
    $scope.farmer = $scope.ngDialogData.farmer
    $scope.is_song = $scope.ngDialogData.is_song
    const farmerDA2update = $scope.ngDialogData.farmerDA2update
    firstRequest = $scope.ngDialogData.firstRequest
    $scope.DAByPerson = $rootScope.directors
    $scope.artisticDirectors = $scope.ngDialogData.artisticDirectors
    const type = $scope.ngDialogData.type
    const requestList = $scope.ngDialogData.requestList
    $scope.canSave = true
    $scope.branchId = $rootScope.user_entity.person.branch_id
    $scope.mainLocationList = $rootScope.mainLocationList

    $scope.artistic_director_id = $scope.farmer.artistic_director_id
    $scope.song_director_id = $scope.farmer.song_director_id
    $scope.stage_manager_id = $scope.farmer.stage_manager_id

    let currentDa = null
    let currentManager = null
    $scope.setDirector = function (farmer, da, type) {
        $scope.canSave = false
        if (type == 'stage_manager_id') {
          currentManager = da
        } else {
          currentDa = da
        }
        
        if (type == 'artistic_director_id') {
            $scope.farmer.artistic_director_id = da.id
            $scope.farmer.artistic_director = da
        }
        if (type == 'song_director_id') {
            $scope.farmer.song_director_id = da.id
            $scope.farmer.song_director = da
        }
        if (type == 'stage_manager_id') {
          $scope.farmer.stage_manager_id = currentManager.id
          $scope.farmer.stage_manager = currentManager
      }
  
    }

    $scope.savePerson = function () {
        let id2send = null
        const listFarmers = []
        
        Object.keys(farmerDA2update).forEach((farmer_id) => {
          if (farmerDA2update[farmer_id].selected) {
            if (type == 'artistic_director_id' && currentDa) {
                farmerDA2update[farmer_id].artistic_director_id = currentDa.id
                farmerDA2update[farmer_id].artistic_director = currentDa
              }
              if (type == 'song_director_id' && currentDa ) {
                farmerDA2update[farmer_id].song_director_id = currentDa.id
                farmerDA2update[farmer_id].song_director = currentDa
              }
              if (type == 'stage_manager_id' && currentManager) {
                farmerDA2update[farmer_id].stage_manager_id = currentManager.id
                farmerDA2update[farmer_id].stage_manager = currentManager
              }
            listFarmers.push(farmerDA2update[farmer_id])
          }
        })
        RequestService.updateDAAndOther(type, id2send, listFarmers, requestList, 
          function (result) {
            let windowIDs = ngDialog.getOpenDialogs();
            ngDialog.close(windowIDs[1])
          }, 
          function (result) {
            let windowIDs = ngDialog.getOpenDialogs();
            ngDialog.close(windowIDs[1])
          })
      }

}])
