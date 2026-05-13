Lantern.controller('SetCodeSecuriteSubprojectDialogCtrl', ['$rootScope', '$scope', '$cookies', '$stateParams', '$filter', 'ngDialog', 'Subproject', 'Valuelist', 'Product', 'ProductService', 'ApiRest',
function ($rootScope, $scope, $cookies, $stateParams, $filter, ngDialog, Subproject, Valuelist, Product, ProductService, ApiRest)
{

    $scope.videoObjects = {
      videoMaster: false,
      multiMediaVersion: '',
      multiCodeSecurite: '',
      filteredCollection: $scope.subprojectVideoElements ? $scope.subprojectVideoElements : [],
      activeFilter: {
        thProductDesc: null,
        thTitleVo: null,
        thSupport: $scope.subprojectVideoElements && $scope.subprojectVideoElements.some(x => x.support == 'Image doublage') ? 'Image doublage' : null,
        thPath: null,
        thOrigin: null,
        thWorkflow: null,
        thVideoFileVersion: null
      },
      get nbModifiedElements() {
        if ($scope.subprojectVideoElements)
          return $scope.subprojectVideoElements.filter(x => x.media_seal_code_changed || x.new_media_seal_security_version != x.media_seal_security_version).length;
        else
          return 0;
      },
      get nbSelectedElements() {
        if ($scope.subprojectVideoElements)
          return $scope.subprojectVideoElements.filter(x => x.selected == "1").length;
        else
          return 0;
      },
      get nbCodeModificationsElements() {
        if ($scope.subprojectVideoElements)
          return $scope.subprojectVideoElements.filter(x => x.media_seal_code_changed).length;
        else
          return 0;
      },
      get nbVersionModificationsElements() {
        if ($scope.subprojectVideoElements)
          return $scope.subprojectVideoElements.filter(x => x.new_media_seal_security_version != x.media_seal_security_version).length;
        else
          return 0;
      }
    }

    $scope.media_seal_security_versions = null;
    Valuelist.query({
      tableName: 'media_seal_security_version'
    }, function(response) {
      var t = [{
        id: -1,
        name: null,
        value: ''
      }];
      i = 1;
      response.forEach(function(elem) {
        t[i] = {
          id: elem.id,
          name: elem.name,
          value: elem.value
        };
        i++;
      });
      $scope.media_seal_security_versions = t;
    });

    $scope.editMultiMediaVersion = function(multiMediaVersion) {

      $scope.videoObjects.filteredCollection.forEach(function(item) {

        if (item.selected == "1") {
          item.new_media_seal_security_version = multiMediaVersion;
          item.selected = "0";
        }
  
      });

      $scope.resetVideoActiveFilter();

    };

    $scope.editMediaCodeSecurite = function(item) {

      if (item.media_seal_security_code || item.new_media_seal_security_code)
        item.media_seal_code_changed = true;
      else
        item.media_seal_code_changed = false;
    
    }

    $scope.editMultiMediaCodeSecurite = function(multiCodeSecurite) {

        $scope.videoObjects.filteredCollection.forEach(function(item) {
  
          if (item.selected == "1") {
            
            item.new_media_seal_security_code = multiCodeSecurite;

            if (multiCodeSecurite || item.media_seal_security_code) {
              item.media_seal_code_changed = true;
            } else {
              item.media_seal_code_changed = false;
            }
          }

          item.selected = "0";

        });

      $scope.resetVideoActiveFilter();

    }

    $scope.saveMultiMediaSecuriteModification = function() {
      
        var modifiedCodes = [];
        var modifiedVersions = [];

        $scope.subprojectVideoElements.forEach(function(item) {
          
          if (item.media_seal_code_changed) {
            modifiedCodes.push({
              id: item.id,
              codeSecurite: item.new_media_seal_security_code
            })
          }

          if (item.new_media_seal_security_version != item.media_seal_security_version) {
            modifiedVersions.push({
              id: item.id,
              multiMediaVersion: item.new_media_seal_security_version
            })
          }

        });

        if (modifiedCodes.length > 0 || modifiedVersions.length > 0) {

          ApiRest.put('/mediaitems/multimediasealcodesecuriteandversion', {}, {
            modifiedCodes: modifiedCodes,
            modifiedVersions: modifiedVersions
          }, function(resp) {
              if (resp) 
                console.log('error:', resp);
          });

        }

        $scope.subprojectVideoElements.forEach(function(item) {
          item.new_media_seal_security_code = '';
          item.new_media_seal_security_version = item.media_seal_security_version;
          item.selected = "0";
          item.media_seal_code_changed = false;
        })
              
        $scope.resetVideoActiveFilter();

        ngDialog.closeAll();

    }

    $scope.closeMultiMediaSecurite = function() {
        $scope.subprojectVideoElements.forEach(function(item) {
          item.new_media_seal_security_code = '';
          item.new_media_seal_security_version = item.media_seal_security_version;
          item.selected = "0";
          item.media_seal_code_changed = false;
        })
              
        $scope.resetVideoActiveFilter();

        ngDialog.closeAll('cancelButton');
    };

    $scope.selectAllFilteredVideoProducts = function(filteredCollection, videoMaster) {
        $scope.subprojectVideoElements.forEach(function(subprojectVideoElement) {
            subprojectVideoElement.selected = "0";
        });
        filteredCollection.forEach(function(subprojectVideoElement) {
            subprojectVideoElement.selected = videoMaster ? "1" : "0";
        });
    };

    $scope.undoVideoElementCodeModifications = function(item) {
      itemIndex = $scope.subprojectVideoElements.findIndex(x => x.id === item.id);
      $scope.subprojectVideoElements[itemIndex].new_media_seal_security_code = '';
      $scope.subprojectVideoElements[itemIndex].media_seal_code_changed = false;

    };

    $scope.undoVideoElementVersionModifications = function(item) {
      itemIndex = $scope.subprojectVideoElements.findIndex(x => x.id === item.id);
      $scope.subprojectVideoElements[itemIndex].new_media_seal_security_version = item.media_seal_security_version;
    };

    $scope.undoAllVideoElementCodeModifications = function() {
      $scope.subprojectVideoElements.forEach(function(item) {
        if (item.media_seal_code_changed) {
          item.new_media_seal_security_code = '';
          item.media_seal_code_changed = false;
        }
      });
    };

    $scope.undoAllVideoElementVersionModifications = function() {
      $scope.subprojectVideoElements.forEach(function(item) {
        if (item.new_media_seal_security_version != item.media_seal_security_version) {
          item.new_media_seal_security_version = item.media_seal_security_version;
        }
      });
    };

    $scope.resetSelectedVideos = function() {
      $scope.subprojectVideoElements.forEach(function(subprojectVideoElement) {
          subprojectVideoElement.selected = "0";
          $scope.videoObjects.videoMaster = false;
          $scope.videoObjects.multiCodeSecurite = '';
          $scope.videoObjects.multiMediaVersion = '';
      });
    };

    $scope.resetVideoActiveFilter = function() {

      $scope.videoObjects.activeFilter.thProductDesc = null;
      $scope.videoObjects.activeFilter.thTitleVo = null;
      $scope.videoObjects.activeFilter.thSupport = null;
      $scope.videoObjects.activeFilter.thPath = null;
      $scope.videoObjects.activeFilter.thOrigin = null;
      $scope.videoObjects.activeFilter.thWorkflow = null;
      $scope.videoObjects.activeFilter.thVideoFileVersion = null
      
      $scope.videoObjects.videoMaster = false;
      $scope.videoObjects.multiCodeSecurite = '';
      $scope.videoObjects.multiMediaVersion = '';
      $scope.videoObjects.filteredCollection = $scope.subprojectVideoElements;

    }
  
}
]);
