/**
 * Created by Marcel on 28/07/2015.
 */

Lantern.controller('CreateDemandDigitalMediaCtrl', ['$rootScope', '$scope', 'ApiRest', '$http', '$q', 'Project', '$cookies', '$state', '$stateParams', 
'$filter', 'ngDialog', 'Product', 'Subproject', 'Request', 'MediaItems', 'NotificationService', '$location', 'User', 'Favorite', 'Session', 
'ProductService', 'ClientService', 'ValueListService', 'Valuelist',
  function($rootScope, $scope, ApiRest ,$http, $q, Project, $cookies, $state, $stateParams, 
    $filter, ngDialog, Product, Subproject, Request, MediaItems, NotificationService, $location, User, Favorite, Session, 
    ProductService, ClientService, ValueListService, Valuelist) {
    const branchId = Session.branchId()
    $scope.entity = new Request();
    $scope.entity.user_id = $.cookie('user_id');
    $scope.entity.products = $scope.products;

    $scope.elementCheckedByProduct = {};
    $scope.products.forEach(function(product) {
      $scope.elementCheckedByProduct[product.id] = [];
    });
    $scope.elementVideos = [];
    $scope.elementAudios = [];
    $scope.globalVar = {};

    let role = Session.role();

    $scope.speeds = ValueListService.getSpeeds()

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

    $scope.$watch("globalVar.speed_reception", function() {
      if ($scope.globalVar.speed == null) {
        $scope.globalVar.speed = $scope.globalVar.speed_reception
      }
    })

    $scope.layouts = ValueListService.getLayouts()

    $scope.global = [];
    $scope.global.recipientGroupToNotify = null;  // group
    $scope.global.recipientUsersToNotify = null;  // users

    $rootScope.getMailRecipientsGroup( function () {
      $scope.recipientsGroup = $rootScope.recipientsGroup
    })

    $scope.recipientsUsers = User.findbypermission({
      app_code: 'bons-travaux-auto',
      level: 'charge_prod',
      branch_id: branchId
    }, function() {
      $scope.recipientsUsers.forEach(function(user) {
        if (user.person != null) {
          user.name = user.person.firstname + " " + user.person.lastname;
        } else {
          user.name = user.firstname + " " + user.lastname;
        }
      });
      let filters = [{
        "name": "project_id",
        "value": $scope.project.id
      }];
      Favorite.queryByFilters({
        filters: [filters]
      }, function(users) {
        $scope.global.recipientUsersToNotify = [];
        let tabRecipients = [];
        angular.forEach(users, function(fav) {
          let isUserChargeProd = $filter('filter')($scope.recipientsUsers, {
            'id': fav.user_id
          }, true);
          if (isUserChargeProd.length == 1)
            tabRecipients.push(isUserChargeProd[0].id);
        })
        $scope.global.recipientUsersToNotify = tabRecipients;
      })
    });

    $scope.checkElementVideo = function(element, isChecked) {
      for (const product of $scope.products) {
        const productId = product.id;
        const elementsChecked = $scope.elementCheckedByProduct[productId];
        const oldIndex = elementsChecked.findIndex(el => el.support == element.support && el.nature == element.nature);

        if (!isChecked) {
          oldIndex !== -1 && elementsChecked.splice(oldIndex, 1);
        } 
        if (isChecked && oldIndex === -1) {
          const [videoPath, , mp4VideoName] = extractElementsPath($scope.elementsPaths[productId]);
          const newElement = {...element};
          if (newElement.support == "Image doublage") {
            newElement.path = videoPath;
          } else if (newElement.support == "Screener") {
            newElement.path = mp4VideoName;
          } else {
            newElement.path = mp4VideoName;
          }
          elementsChecked.push(newElement);
        }
        elementsChecked.sort(function(a, b) {
          return $scope.elementVideos.findIndex(el => el.support == a.support) - $scope.elementVideos.findIndex(el => el.support == b.support);
        });
      }
    };

    $scope.addElementAudio = function(element) {
      for (const productId in $scope.elementCheckedByProduct) {
        $scope.elementCheckedByProduct[productId].push(angular.copy(element));
      }
    };

    $scope.removeElementAudio = function(index) {
      for (const productId in $scope.elementCheckedByProduct) {
        const elementsChecked = $scope.elementCheckedByProduct[productId];
        if (elementsChecked.length > index) {
          elementsChecked.splice(index, 1);
        }
      }
    };

    $scope.selectWorkflow = function(workflow_type) {
      $scope.elementCheckedByProduct = {};
      $scope.products.forEach(function(product) {
        $scope.elementCheckedByProduct[product.id] = [];
      });

      $scope.wf_sel = workflow_type;

      if (workflow_type == 1) {
        showRecord();
      } else if (workflow_type == 2) {
        showMastering();
      } else if (workflow_type == 3) {
        showServicing();
      }
    };

    $scope.elementVid = [false, false, false, false];
    $scope.checkFullMAD = function() {
      const LIST = ['Erytmo', 'Screener', 'Image doublage'];
      $scope.elementVid = $scope.elementVid.map(function(isElementChecked, index) {
        const element = $scope.elementVideos[index];
        const newCheckedValue = LIST.includes(element.support) ? true : isElementChecked;
        $scope.checkElementVideo(element, newCheckedValue);
        return newCheckedValue;
      });
    }


    $scope.hasElements = function() {
      return Object.values($scope.elementCheckedByProduct).some(elements => elements.length > 0);
    };

    $scope.createElements = function() {
      let createSuccessfull = true;
      let itemsCreatedByProduct = {};
      let totalElements = Object.values($scope.elementCheckedByProduct).reduce((sum, elements) => sum + elements.length, 0);
      let processedCount = 0;
      for (const productId in $scope.elementCheckedByProduct) {
        const elementChecked = $scope.elementCheckedByProduct[productId];
        elementChecked.forEach(function(element) {
          let item = new MediaItems();
          angular.copy(element, item);
          item.origin = "Client";
          if (element.nature != "Audio") {
            item.speed = $scope.globalVar.speed;
            item.speed_reception = $scope.globalVar.speed_reception;
          }
          if (element.nature == "Audio" && item.layout != undefined) {
            item.layout = item.layout.join("+");
          }
          item.workflow = $scope.type_workflow;
          item.product_id = productId;
          item.$save({}, function(item) {
            itemsCreatedByProduct[productId] = itemsCreatedByProduct[productId] || [];
            itemsCreatedByProduct[productId].push(item);
            processedCount++;
            if (totalElements == processedCount) {
              if (createSuccessfull) {
  
                //Envoi du mail de notif
                let usersToNotify = null;
                if ($scope.global.recipientUsersToNotify != null) {
                  usersToNotify = $scope.global.recipientUsersToNotify.join(",");
                }
                const notifPromises = [];
                for (const productId in itemsCreatedByProduct) {
                  const itemsCreated = itemsCreatedByProduct[productId];
                  const promise = NotificationService.distributeMailMiseDispo({
                    distriblist: $scope.global.recipientGroupToNotify,
                    users: usersToNotify,
                    items: [itemsCreated],
                    product_desc: $scope.products.find(product => product.id == productId)?.human_description,
                  });
                  notifPromises.push(promise);
                }
                Promise.all(notifPromises).then(function() {
                  swal($rootScope._T["70jumwe9"], $rootScope._T["3u5dyetw"], "success");
                  ngDialog.closeAll();
                }).catch(function() {
                  swal($rootScope._T["nvu0sors"], $rootScope._T["om0nb2lj"] + " 1", "error");
                });
              } else {
                swal($rootScope._T["nvu0sors"], $rootScope._T["om0nb2lj"] + " 2", "error");
              }
            }
          }, function() {
            processedCount++;
            if (totalElements == processedCount) {
              swal($rootScope._T["nvu0sors"], $rootScope._T["om0nb2lj"] + " 3", "error");
            }
            createSuccessfull = false;
          });
        });
      }
    };

    $scope.elementsPaths = {};
    $scope.elementsPathChange = function(elementsPath, productId) {
      const [videoPath, , mp4VideoName] = extractElementsPath(elementsPath);
      (productId ? $scope.elementCheckedByProduct[productId] : $scope.elementChecked).forEach(function(element) {
        if (element.nature == "Video") {
          if (element.support == "Image doublage") {
            element.path = videoPath;
          } else if (element.support == "Screener") {
            element.path = mp4VideoName;
          }  else {
            element.path = mp4VideoName;
          }
        }
      });
    }

    function extractElementsPath(elementsPath = '') {
      if (elementsPath.charAt(0) == '"')
        elementsPath = elementsPath.substr(1);
      if (elementsPath.charAt(elementsPath.length - 1) == '"')
        elementsPath = elementsPath.substr(0, elementsPath.length - 1);
      let videoPath = elementsPath;
      let elementsPathArray;
      if (elementsPath.indexOf("\\") != -1) {
        elementsPathArray = elementsPath.split("\\");
      } else {
        elementsPathArray = elementsPath.split("/");
      }
      let videoName = elementsPathArray[elementsPathArray.length-1];
      let mp4VideoName = videoName;
      if (mp4VideoName.indexOf(".mov") != -1) {
        mp4VideoName = mp4VideoName.substr(0, mp4VideoName.length - 3);
        mp4VideoName += "mp4";
      }

      return [videoPath, videoName, mp4VideoName];  
    }

    /**
     * Section Record/Doublage
     */

    function showRecord() {
      $scope.elementVideos = ValueListService.getDigiMediaVideoSupports()
      $scope.elementAudios = ValueListService.getDigiMediaAudioSupports()
      $scope.type_workflow = "Dubbing";
    }


    /**
     * Section Mastering
     */

    function showMastering() {
      $scope.elementVideos = [{
        support: "Original Master",
        nature: "Video"
      }];

      $scope.elementAudios = [];

      $scope.type_workflow = "Mastering";

    }



    /**
     * Section Servicing
     */
    function showServicing() {
      $scope.elementVideos = [{
        support: "Master",
        nature: "Video"
      }];

      $scope.elementAudios = [];

      $scope.type_workflow = "Servicing";

    }

    $scope.doneEditing = function(element, product){
      var data = {};
      data[element] = product[element];
      ProductService.updateProduct({
        id: product.id
      }, data, function(product) {}, function(error) {});
    };

  }
]);
