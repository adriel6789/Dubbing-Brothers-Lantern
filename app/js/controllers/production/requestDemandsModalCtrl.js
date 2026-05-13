Lantern.controller('requestDemandsModalCtrl', ['$filter', '$rootScope', '$state', '$scope', '$stateParams', 'requestDemandsService', 'ngDialog', 'ResponseToastService', 'ApiRest', 'Notification', 
'$timeout', 'MediaItems', 'FileUploader', 'Attachments', '$window', 'Session',
  function($filter, $rootScope, $state, $scope, $stateParams, requestDemandsService, ngDialog, ResponseToastService, ApiRest, Notification, $timeout, 
    MediaItems, FileUploader, Attachments, $window, Session) {
      // DEPRECATED, demandé uniquement de requestDemandsDetailCtrl (20230330)
    $scope.elementSelected = $stateParams.key;
    var service = {};
    var rest = {};
    var newDemands = $stateParams.new ? $stateParams.new.split(',') : [];
    $scope.showMore = false;
    $scope.loading = true;

    // on ouvre la modal si on l'a trouvé dans le parent
    $scope.$watch('$parent.requests', function(newV, oldV) {
      if (newV) {
        for (var key in $scope.$parent.requests) {
          if ($scope.$parent.requests[key].id == $stateParams.id) {
            $scope.viewProduct(0, $scope.$parent.requests[key].sortedRequests[$stateParams.key]);
          };
        };
      };
    });

    $scope.changeState = function(request){
      request.show_more = !request.show_more;
      $scope.showMore = !$scope.showMore;
    };


    rest.getRequest = function(requestId, successCallback, errorCallback) {
      ApiRest.get('/requestdemands/' + requestId, {}, function(response) {
        return successCallback(response);
      }, function(error) {

      });
    }
    rest.updateInfo = function(id, data, successCallback, errorCallback) {
      ApiRest.put('/requests/' + id, {}, data, function(response) {
        $scope.success = "Remarque mise à jour";
        $timeout(function() {
          $scope.success = null;
        }, 3000);
        return successCallback();
      }, function(error) {
        $scope.error = (ResponseToastService.error.message);
        $timeout(function() {
          $scope.error = null;
        }, 3000);
        return errorCallback();
      })
    };

    service.overwrite = function(aGroupRequest, successCallback) {
      $scope.requestsSelected = [];
      var data = [];
      var count = 0;
      $scope.loading = true;
      var load = function() {
        var request = aGroupRequest.requests[count];
        request.selected = true;
        request.limitIndex = false;
        request.showElements = false;
        request.infoForTech = false;
        request.showDates = false;
        request.selectedDates = [];
        $scope.requestsSelected.push(request.id);
        request.showAttachment = false;
        request.showLink = false;
        request.newElement = newDemands.indexOf(request.id) > -1 ? true : false;
        rest.getRequest(request.id, function (response) {
          //on surcharge l'element request
          request.attachments = response.attachments;
          request.product = response.product;
          request.on_hold = response.on_hold;
          request.important = response.important;
          request.info_for_tech = response.info_for_tech;
          request.limitIndex = 1;
          request.ownCommentUser = response.ownComment;
          request.product.media_item.forEach(function(item) {
            if (request.media_items == null) request.media_items = [];
            item.selected = request.media_items.indexOf(item.id) > -1 ? true : false;
          });
          request.linked_requests = response.linked_requests;

          count += 1;
          data.push(request);
          if (count == aGroupRequest.requests.length) {
            aGroupRequest.requests = data;
            return successCallback(aGroupRequest);
          } else {
            load();
          }
        });
      }
      load();
    };

    $scope.setCheck = function(request) {
      var data = {};
      if (!request.selected) {
        var index = $scope.requestsSelected.indexOf(request.id)
        $scope.requestsSelected.splice(index, 1);
      } else {
        $scope.requestsSelected.push(request.id);
      }
    };

    $scope.showRequest = function(request) {
      $state.go('app.requestsDetail', {
        id: request.id
      });
    };

    $scope.save = function(action) {
      var count = 0;

      var load = function() {
        var id = $scope.requestsSelected[count];
        var data = {};
        if (action) {
          $scope.loading = true;
          if (action.comment) {
            data.info_for_tech = action.comment;
          };

          if (action.important != null) {
            data.important = action.important;
          };

          if (action.on_hold != null) {
            data.on_hold = action.on_hold;
          };

          rest.updateInfo(id, data, function() {
            count += 1
            if (count == $scope.requestsSelected.length) {
              service.overwrite($scope.aGroupRequest, function(response) {
                $scope.aGroupRequest = response;
                $scope.loading = false;
              });
            } else {
              load();
            }
          });
        }
      }
      load();
    };

    $scope.viewProduct = function(key, aGroupRequest) {
      $scope.uploader = [];
      angular.forEach(aGroupRequest.requests, function(request) {
        $scope.uploader[request.id] = new FileUploader();
        $scope.uploader[request.id].url = URL_API + "/attachments";
        $scope.uploader[request.id].headers = {
          'auth-token': $.cookie('token'),
          'app-code': Session.appCode(),
          'branch': $rootScope.user_entity.person.branch_id
        }
        $scope.uploader[request.id].autoUpload = true;
        $scope.uploader[request.id].onBeforeUploadItem = function(item) {
          item.formData.push({
            request_id: request.id
          });
        };
        $scope.uploader[request.id].onSuccessItem = function(item, response, status, headers) {
          item.formData[0] = {
            request_id: request.id,
            id: response.id,
            path: response.path
          };
        };
        $scope.selectedDates = [];
        $scope.allDates = [];
        if (aGroupRequest.requests[0].delai_souhaite != null) {
          var desired = aGroupRequest.requests[0].delai_souhaite.split(',');
          if (desired != null && desired.length > 0) {
            angular.forEach(desired, function(timestamp) {
              var parse = parseInt(timestamp);
              if (!isNaN(parse)) {
                $scope.selectedDates.push(parseInt(timestamp));
                var date = {}
                date.timestamp = parseInt(timestamp)
                date.old = false
                $scope.allDates.push(date)
              }
            });
          }
        }

        Attachments.byRequestId({
          request_id: request.id
        }, function(attachment) {
          request.pj = attachment.length;
          attachment.forEach(function(item) {
            var file = new FileUploader.FileItem($scope.uploader[request.id], {
              lastModifiedDate: new Date(),
              name: item.original_name,
              size: item.filesize
            });

            file.formData.push({
              id: item.id,
              path: item.path
            });
            file.progress = 100;
            file.isUploaded = true;
            file.isSuccess = true;

            $scope.uploader[request.id].queue.push(file);
          })
        });
      })

      $scope.requestImportant = 0;
      $scope.requestIsHold = 0;


      service.overwrite(aGroupRequest, function(response) {
        $scope.aGroupRequest = response;
        $scope.loading = false;
      });



      $scope.updateInfoTech = function(request) {
        rest.updateInfo(request.id, {
          info_for_tech: request.info_for_tech
        });
      };

      $scope.loadMediaItemsFromProduct = function(request) {
        request.mediaItems = MediaItems.findbyproduct({
          product_id: request.product.id
        }, function(items) {
          request.mediaItems.forEach(function(item) {
            item.description = ""
            if (item.layout != null) {
              item.description += "Layout : " + item.layout + '<br>'
            }
            if (item.speed_reception != null) {
              item.description += "Vitesse de réception : " + item.speed_reception + '<br>'
            }
            if (item.speed != null) {
              item.description += "Vitesse de travail : " + item.speed + '<br>'
            }
            if (item.origin != null) {
              item.description += "Origine : " + item.origin
            }
          });
        });

      };

      $scope.saveDesiredTime = function() {

        var desired = $scope.selectedDates.join(',');
        var sizeOfGroup = aGroupRequest.requests.length;
        var count = 0;
        if (desired)
          angular.forEach(aGroupRequest.requests, function(request) {
            var id = request.id;
            var oldDatesStr = request.delai_souhaite;
            var oldDatesArray = []
            var newDatesArray = []

            var oldDates = [];
            if (oldDatesStr != null && oldDatesStr != "") {
              oldDatesArray = oldDatesStr.split(',');
            }
            var unwished_dates = []
            if (request.unwished_dates != null) {
              unwished_dates = request.unwished_dates.split(',')
            }

            if (desired != oldDatesStr) {

              angular.forEach($scope.selectedDates, function(selectedDate) {
                var index = unwished_dates.indexOf(selectedDate.toString())
                if (index >= 0) {
                  unwished_dates.splice(index, 1)
                }

                index = oldDatesArray.indexOf(selectedDate.toString())
                if (index >= 0) {
                  oldDatesArray.splice(index, 1)
                } else {
                  newDatesArray.push(selectedDate)
                }
              })
              if (oldDatesArray.length > 0) {
                angular.forEach(oldDatesArray, function(oldDate) {
                  index = $scope.selectedDates.indexOf(oldDate.toString())
                  if (index < 0) {
                    oldDates.push(oldDate)
                  }
                })
              }
              if (unwished_dates != null) {
                angular.forEach(unwished_dates, function(oldDate) {
                  var index = oldDatesArray.indexOf(oldDate)
                  if (index < 0 && oldDate != null && oldDate != "") {
                    oldDatesArray.push(oldDate)
                    unwished_dates = oldDatesArray
                  }
                })
              }

              if (oldDatesArray != null) {
                unwished_dates = oldDatesArray
              }

              var data = {};
              data.delai_souhaite = $scope.selectedDates.join(',');
              if (unwished_dates.length > 0) {
                data.unwished_dates = unwished_dates.join(',');
              } else {
                data.unwished_dates = null
              }

              rest.updateInfo(id, data, function() {
                count += 1
                if (count == sizeOfGroup) {
                  request.delai_souhaite = data.delai_souhaite;

                  $state.go('app.requests.demandsDetail', {
                    id: $stateParams.id,
                    key: getHashRequest(request)
                  });
                  window.location.reload();
                }
              });

              //   //TODO Envoyer une notif de groupe                  

            }
          })
      }


      $scope.remove = function(item) {
        swal({
            title: $rootScope._T["9lpfa1ln"],
            text: $rootScope._T["8csqh78u"],
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: $rootScope._T["mnlbxblr"],
            closeOnConfirm: false
          },
          function() {
            Attachments.delete({
              id: item.formData[0].id
            });
            item.remove();

            swal({
              title: $rootScope._T["dt8uc6cm"],
              text: $rootScope._T["vla0lzco"],
              type: "success"
            });
          });
      };

      $scope.download = function(item) {
        $window.open(URL_API + "/attachments/download/" + item.formData[0].id + "?filesize=" + item.file.size + "&token=" + $.cookie('token'), '_blank');
      };

      $scope.setElement = function(request, item) {

        var index = request.media_items.indexOf(item.id);
        if (index > -1) {
          request.media_items.splice(index, 1);
        } else {
          request.media_items.push(item.id);
        }

        ApiRest.put('/requests/' + request.id, {}, {
          media_items: request.media_items.toString()
        }, function(response) {
          $scope.success = $rootScope._T['ou3576cr']
          $timeout(function() {
            $scope.success = null;
          }, 3000);
        }, function(error) {
          $scope.error = ResponseToastService.error.message;
          $timeout(function() {
            $scope.error = null;
          }, 3000);
        });
      }
    };

  }
]);
