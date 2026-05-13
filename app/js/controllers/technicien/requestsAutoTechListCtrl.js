Lantern.controller('RequestsAutoTechListCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$filter', 'Request', 'RequestGroup', 'User', 'ngTableParams', 'ngDialog',
 'MediaItems', 'FileUploader', 'Attachments', 'Comment', 'NotificationService', '$location', 'Session', 'Notification', 'ClientService','PhelixAlula', 'ValueListService', 'sharedServices',
  function($rootScope, $scope, $state, $stateParams, $filter, Request, RequestGroup, User, ngTableParams, ngDialog, 
     MediaItems, FileUploader, Attachments, Comment, NotificationService, $location, Session, Notification, ClientService,PhelixAlula, ValueListService, sharedServices) {
      if (!$rootScope.user_entity || !$rootScope.user_entity.permissions) {
        $location.path('/')
      }
      // service par défaut digital-media
      let service = 'digital-media'
      if ($stateParams.service) {
        service = $stateParams.service
      } else {
        if ($rootScope.canDisplay(16)) {
          service = 'digital-media'
        } else if ($rootScope.canDisplay(256)) {
          service = 'qc'
        } else if ($rootScope.canDisplay(512)) {
          service = 'prepa'
        }
      }
  // accés aux techniciens digitalmedia uniquement
    ClientService.getClients({}, function() {
      $scope.clients = $rootScope.clientsLight
    }, ClientService.manageClientError)
    $scope.dub_places = []
    ValueListService.getDubPlaces(
      ValueListService.manageDubPlacesReceived(function (dubplaces) {
        const dubPlacesList = []
        Object.keys(dubplaces).forEach(function (name) {
          dubPlacesList.push({
            value: dubplaces[name].value,
            name: dubplaces[name].name,
            loc_value: dubplaces[name].loc_value
          })
        })
        $scope.dub_places = dubPlacesList
        $scope.mainLocationList =  $rootScope.mainLocationList
        $scope.numberLocations = Object.keys($scope.mainLocationList).length
        $scope.dubPlacesByLocValue = $rootScope.dubPlacesByLocValue
      }), {})
    $scope.planningChoosen = '';
    $scope.uploader = [];
    

    $scope.user_id = $.cookie('user_id');
    $scope.role = Session.role();
    $rootScope.showLoading++;
    User.getCurrentUserDetails({}, function(user) {
      $scope.user = user;
      $rootScope.showLoading--;
      $scope.plannings.forEach(function(planning) {
        if (planning.id == user.planning_id) {
          $scope.planningChoosen = planning;
        }
      });

      //init(user.planning_id);
    });
    ValueListService.getLanguages(ValueListService.manageReceivedLanguages(
      function () {}
    ), function () {})
    ValueListService.getSpeeds()
    $scope.doublageTypes = ValueListService.getDoublageTypesById()
    $scope.formatMixageByid = ValueListService.getWorkflowMixById()
    var months = [];
    months['Janvier'] = 0;
    months['Février'] = 1;
    months['Mars'] = 2;
    months['Avril'] = 3;
    months['Mai'] = 4;
    months['Juin'] = 5;
    months['Juillet'] = 6;
    months['Août'] = 7;
    months['Septembre'] = 8;
    months['Octobre'] = 9;
    months['Novembre'] = 10;
    months['Décembre'] = 11;

    $scope.planningsCopy = null;
    $scope.startDate = [];
    $scope.endDate = [];

    function startAndEndOfWeek(date) {
      var now = date ? new Date(date) : new Date();
      now.setHours(0, 0, 0, 0);

      var monday = new Date(now);
      monday.setDate(monday.getDate() - monday.getDay() + 1);

      var sunday = new Date(now);
      sunday.setDate(sunday.getDate() - sunday.getDay() + 7);

      return [monday, sunday];
    }

    var data = new Array();

    $scope.changePlanning = function(id) {
      init(id);
    };

    function convertStringsTimestampToStringsDate(timestampString) {
      var timestampArray = timestampString.split(',');
      var date = "";
      var months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
      angular.forEach(timestampArray, function(timestamp) {
        var dt = new Date(parseInt(timestamp));
        date += dt.getDate() + " " + months[dt.getMonth()] + " " + dt.getFullYear() + " - ";
      });

      return date;
    }

    function init(planning_id) {
      var returnRequest = [];

      var filters = [{
        "name": "is_sent_back",
        "value": "0"
      }, {
        "name": "planning_id",
        "value": planning_id
      }];

      $rootScope.showLoading++;
      Request.getRequestsBy({
        filters: [filters]
      }, function(requests) {
        $rootScope.user_main_location = $rootScope.user_entity.permissions[0].main_location
        $rootScope.showLoading--;

        requests.forEach(function(request) {
          request.display = 1
          if (request.in_group == 1) {
            request.display = 0
          }
          if (request.ownComment != null) {
            request.ownComment = objectInArray(request.ownComment)
            var commentFilters = $filter('filter')(request.ownComment, {
              'activity_log': null
            }, true)
            request.totalComment = commentFilters.length
            request.totalCommentGlobal = commentFilters.length
            if (commentFilters.length > 0) {
              var lastComment = commentFilters[commentFilters.length - 1]
              if (lastComment.user != null && lastComment.user.person != null) {
                request.lastCommentGlobal = "Dernier message de " + lastComment.user.person.firstname + " : <br/>" + lastComment.text
                request.lastComment = "Dernier message de " + lastComment.user.person.firstname + " : <br/>" + lastComment.text
              }
            }
          }

          let date = null;
          if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) {
            angular.forEach(request.ownFarmerbookings, function(farmer) {
              if (farmer.is_wish) {
                let farmerDay = moment(farmer.day).format('x');
                if (date == null || farmerDay < date) {
                  date = farmerDay;
                }
              }
            });
          }
          request.firstSelectedDate = date != null ? date:"0";
          if ($rootScope.user_main_location && request.workflow.main_location_id) {
            if (parseInt($rootScope.user_main_location) == request.workflow.main_location_id) {
              returnRequest.push(request)
            }
          } else {
            returnRequest.push(request)
          }
          
        });
      });

      var filtersGroup = [{
        "name": "is_done",
        "value": "0"
      }, {
        "name": "planning_id",
        "value": planning_id
      }, {
        "name": "is_sent_back",
        "value": "0"
      }];
      RequestGroup.getAllRequestsBy({
        filters: [filtersGroup]
      }, function(groups) {
        groups.forEach(function(group) {
          var products_names = [];
          var oneRequest = null;
          var countRequest = 0;
          group.requests.forEach(function(request) {
            if (oneRequest == null) {
              oneRequest = request;
            }
            if (request.product != null) {
              products_names.push(request.product.human_description);
            }
            if (request.is_sent_back != 1) {
              countRequest++;
            }
          });

          //var oneRequest = group.requests[0];
          if (oneRequest != null) {
            let date = null;
            if (oneRequest.ownFarmerbookings != null && oneRequest.ownFarmerbookings.length > 0) {
              angular.forEach(oneRequest.ownFarmerbookings, function(farmer) {
                if (farmer.is_wish) {
                  let farmerDay = moment(farmer.day).format('x');
                  if (date == null || farmerDay < date) {
                    date = farmerDay;
                  }
                }
              });
            }
            oneRequest.firstSelectedDate = date != null ? date:"0";
            oneRequest.from_group = group.id;
            oneRequest.products_names = products_names;
            oneRequest.number_request = countRequest;
            oneRequest.group = group;
            oneRequest.showGroup = false;
            oneRequest.display = 1;
            returnRequest.push(oneRequest);
          }

        });
      });
      
      return returnRequest;
    }

    $scope.countRequestPlanning = function(requests) {
      var requestFiltered = $filter('filter')(requests, {
        display: 1
      });
      if (requestFiltered.length > 0) {
        let requestsNotInProgress = 0;
        let filteredDateRequests = $filter('filterRequestTechByDate')(requestFiltered, $scope.startTimestamp, $scope.endTimestamp)
        let lastFilteredRequests = ($scope.textFilter == '' || $scope.textFilter == null) ? filteredDateRequests : $filter('magicFilterRequest')(filteredDateRequests, $scope.textFilter)
        if (lastFilteredRequests !== undefined) {
          lastFilteredRequests.map((filteredRequest) => {
            if(filteredRequest.is_finished === '0' && filteredRequest.display == 1 && filteredRequest.is_sent_back != 1) {
              if (filteredRequest.from_group == null) {
                requestsNotInProgress++;
              }
              if (filteredRequest.group !== undefined && filteredRequest.group.requests.length > 0) {
                requestsNotInProgress = requestsNotInProgress + filteredRequest.group.requests.length
              }
            } 
          })
        }
        $scope.requestsNotInProgress = requestsNotInProgress.toString();
      }
      if (requestFiltered != null)
        return requestFiltered.length
      return 0;
    };

    // never called, so never used
    $scope.massUpdatePopup = function(object) {
      var requestsSelected = $scope.getSelectedRequests();
      if (requestsSelected.length > 0) {
        $scope.massRequestsToUpdate = requestsSelected;
        var templateURL = '';
        switch (object) {
          case 'take_requests':
            requestsSelected.forEach(function(request) {
              var itemsElements = [];
              if (request.media_items != null) {
                var itemsArray = request.media_items.split(",");
                itemsArray.forEach(function(item) {
                  var newItem = MediaItems.get({
                    itemId: item
                  }, function(i) {
                    if (i.reference == 1) {
                      i.reference = true;
                    } else {
                      i.reference = false;
                    }
                  });
                  itemsElements.push(newItem);
                });
              }
              request.itemsInRequest = itemsElements;
            });
            templateURL = 'views/Dialog/MassUpdateTakeRequestVolumeDialog.html';

            break;
          case 'send_back':
            var requestsOfTechs = $filter('filter')(requestsSelected, {
              tech_writer_id: $.cookie('user_id')
            }, true);
            if (requestsOfTechs != null && requestsOfTechs.length > 0) {
              requestsOfTechs.forEach(function(request) {
                var itemsElements = [];
                if (request.media_items != null) {
                  var itemsArray = request.media_items.split(",");
                  itemsArray.forEach(function(item) {
                    var newItem = MediaItems.get({
                      itemId: item
                    }, function(i) {
                      if (i.reference == 1) {
                        i.reference = true;
                      } else {
                        i.reference = false;
                      }
                    });
                    itemsElements.push(newItem);
                  });
                }
                request.itemsInRequest = itemsElements;

                // FileUploader
                $scope.uploader[request.id] = new FileUploader();
                $scope.uploader[request.id].url = URL_API + "/attachments.json/";
                $scope.uploader[request.id].autoUpload = true;
                $scope.uploader[request.id].headers = {
                  'auth-token': $.cookie('token'),
                  'app-code': Session.appCode(),
                  'branch': $rootScope.user_entity.person.branch_id
                }                
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


                Attachments.byRequestId({
                  request_id: request.id
                }, function(a) {
                  request.pj = a.length;
                  a.forEach(function(item) {
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

              });
              $scope.massRequestsToUpdate = requestsOfTechs;
              templateURL = 'views/Dialog/MassUpdateSendBackDialog.html';
            }
            break;
          case 'add_comment':
            swal({
                title: $rootScope._T["oq6r1261"],
                text: $rootScope._T["zt36a062"],
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                inputPlaceholder: $rootScope._T["4yvvlhl1"]
              },
              function(inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                  swal.showInputError($rootScope._T["wcqesaat"]);
                  return false
                }
                angular.forEach(requestsSelected, function(request) {
                  var newComment = new Comment()
                  newComment.text = inputValue
                  newComment.user_id = $.cookie('user_id')
                  newComment.request_id = request.id
                  newComment.show_tech = true
                  newComment.$save(function() {
                    swal($rootScope._T["vxngv3xo"], $rootScope._T["4feagwqb"], "success")

                    Request.get({
                      requestId: request.id
                    }, function(updateRequest) {
                      var allComments = [];
                      updateRequest.ownComment.forEach(function(comment) {
                        var formatedString = "";
                        formatedString += "<i>" + comment.user.firstname + " " + comment.user.lastname + "</i>";
                        formatedString += " - (" + comment.date_creation + ")";
                        formatedString += " : " + comment.text;
                        allComments.push(formatedString);
                      });


                      sendStandardNotif(
                        new NotificationService(), [request],
                        "planning,production",
                        $rootScope._T['8m4tsidm'],
                        newComment.text,
                        $filter,
                        "comment", $rootScope
                      );
                    });
                  })
                })
              });
            break;
          default:
            break;
        }
        if (templateURL != '') {
          var dialog = ngDialog.open({
            className: 'ngdialog-theme-demand dialogwidth80p',
            template: templateURL,
            scope: $scope,
            controller: 'MassUpdateDialogCtrl',
            closeByDocument: false
          });
          dialog.closePromise.then(function(data) {
            $state.reload();
          });
        }

      } else {
        swal($rootScope._T["9a5vpf3c"], $rootScope._T["zmsgyjhj"], "error");
      }
    }

    $scope.addComment = function(request) {

      let requestsSelected = [];
      if (request.from_group != null) {
        request.group.requests.forEach(function(requestInGroup) {
          requestsSelected.push(requestInGroup);
        });
      } else {
        requestsSelected.push(request);
      }
      swal({
        title: $rootScope._T["oq6r1261"],
        text: $rootScope._T["zt36a062"],
        type: "input",
        showCancelButton: true,
        closeOnConfirm: true,
        inputPlaceholder: $rootScope._T["4yvvlhl1"]
      }, function(inputValue) {
        if (inputValue === false) return false;
        if (inputValue === "") {
          swal.showInputError($rootScope._T["wcqesaat"]);
          return false
        }
        angular.forEach(requestsSelected, function(request) {
          let newComment = new Comment();
          newComment.text = inputValue;
          newComment.user_id = $.cookie('user_id');
          newComment.request_id = request.id;
          newComment.show_tech = true;
          newComment.$save(function() {
            Notification.success($rootScope._T["4feagwqb"]);
            sendStandardNotif(
              new NotificationService(),
              [request],
              "planning,production",
              $rootScope._T['8m4tsidm'],
              newComment.text,
              $filter,
              "comment",
              $rootScope
            );
          });
        });
      });
    }

    $scope.takeRequests = function(request) {

      let requestsSelected = [];
      if (request.from_group != null) {
        request.group.requests.forEach(function(requestInGroup) {
          requestsSelected.push(requestInGroup);
        });
      } else {
        requestsSelected.push(request);
      }

      let count = requestsSelected.length;
      angular.forEach(requestsSelected, function (request) {
        let newRequest = new Request();
        newRequest.is_planned = true;
        newRequest.is_validated_for_tech = true;
        newRequest.date_send_tech = todaySQL;
        newRequest.planification_date = todaySQL;
        newRequest.tech_writer_id = $.cookie('user_id');
        newRequest.date_start = null;
        newRequest.date_end = null;
        newRequest.date_start_time = null;
        newRequest.date_end_time = null;
        newRequest.$update({
          requestId: request.id
        }, function (newRequest) {
          count--;
          if (count == 0) {
            if (requestsSelected.length > 1) {
              Notification.success($rootScope._T["55jgts3l"]);
            } else {
              Notification.success($rootScope._T["4pydwzq6"]);
            }
            let notifDesc = $rootScope._T['2lx4lzvm']
            notifDesc += "<br/>" + $rootScope._T['ageoqhbl'] + " " + newRequest.tech_writer_user.person.firstname + " " + newRequest.tech_writer_user.person.lastname;

            angular.forEach(requestsSelected, function (req) {
              newActivityLogRequest(new Comment(), $.cookie('user_id'), req.id, $rootScope._T["aqychsu5"], newRequest.date_start, newRequest.date_end);
              req.tech_writer_user = newRequest.tech_writer_user;
              req.tech_writer_id = newRequest.tech_writer_id;
            });
            sendStandardNotif(
              new NotificationService(),
              requestsSelected,
              "production",
              $rootScope._T['nl4t04um'],
              notifDesc,
              $filter,
              "planification",
              $rootScope
            );
          }
        });
      });
    }


  $scope.sendBack = function(request, isDone) {

    let requestsSelected = [];
      if (request.from_group != null) {
        request.group.requests.forEach(function(requestInGroup) {
          requestsSelected.push(requestInGroup);
        });
      } else {
        requestsSelected.push(request);
      }

      let title = $rootScope._T["pcozpjy3"] + " " + (isDone ? $rootScope._T["t00oepyy"] : $rootScope._T["84z3qlkg"]);
      
    if (request.action_type_id == 461) {
      handlePhelixRequest(request, isDone, requestsSelected, title);
    } else {
      handleRegularRequest(isDone, requestsSelected, title);
    }
  };

function handlePhelixRequest(request, isDone, requestsSelected, title) {
   swal({
        title: $rootScope._T["3s7y421d"],
        text: $rootScope._T["mq93d9nv"],
        type: "info",
        showCancelButton: false,
        showConfirmButton: false, // Hide the confirm button initially
      });
      PhelixAlula.saveCatchupRequestIdLinkedPhelixJoblines({}, { request_id: request.id }, function (response) {
        try {
          if (response &&
              response[0] &&
              response[0][0] &&
              response[0][0].request_id !== undefined) {
            Notification.success($rootScope._T["9scual91"]);
            showSwal(title, isDone, requestsSelected);
          }else{
            swal({
                title: $rootScope._T["cl5e5z49"],
                text: $rootScope._T["n8iw0kd8"],
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: $rootScope._T["w7redrmn"],
                cancelButtonText: $rootScope._T["adoyhyi2"],
                closeOnConfirm: true
                },function() {
                    swal.close();
                    showSwal(title, isDone, requestsSelected);
                });
          }
        } catch (error) {
          console.error(error);
        }
      }, function (error) {
        console.error(error);
      });
}

function handleRegularRequest(isDone, requestsSelected, title) {
  showSwal(title, isDone, requestsSelected);
}

function showSwal(title, isDone, requestsSelected) {
  swal({
    title: title,
    showCancelButton: true,
    confirmButtonText: $rootScope._T["5ygcxbsu"],
    closeOnConfirm: true,
  }, function(response) {
    if (response) {
      updateRequests(isDone, requestsSelected);
    }
  });
}

function updateRequests(isDone, requestsSelected) {
  let count = requestsSelected.length;
  angular.forEach(requestsSelected, function(request) {
    let updateRequest = new Request();
    if (isDone) {
      updateRequest.is_done = 1;
      request.is_done = 1;
    } else {
      updateRequest.is_not_done = 1
      request.is_not_done = 1
      updateRequest.is_partial = 1
      request.is_partial = 1
    }
    updateRequest.closing_date = todaySQL;
    updateRequest.is_sent_back = 1;
    request.is_sent_back = 1;
    updateRequest.is_archived = 0;

    updateRequest.$update({
      requestId: request.id
    }, function (updatedRequest) {
      count--;
      $scope.requestsNotInProgress--;
      newActivityLogRequest(new Comment(), $.cookie('user_id'), request.id, $rootScope._T["3c3s4epd"])
      if (count == 0) {
        if (requestsSelected.length > 1) {
          Notification.success($rootScope._T["q970ntqh"]);
        } else {
          Notification.success($rootScope._T["gxtcdjdl"]);
        }

        let notif = setNotificationSendBack(requestsSelected);
        notif.$save();
      }
      // case Request related to Package PDS delivery update fields EDD / Workability/ Status  on phelix side 
      if (request.action_type_id == 461) {
        sharedServices.launchUpdatePhelixJoblinesFields(request, updatedRequest) ;
      }
      
    });
  });
}


    function setNotificationSendBack(requests) {
      let notif = new NotificationService();

      requests = $filter('orderBy')(requests, "product.human_description");
      let request_ids = [];
      requests.forEach(function (aReq) {
        request_ids.push(aReq.id);
      });

      let request = requests[0];

      if (requests.length == 1) {
        notif.request_id = requests[0].id;
      } else {
        notif.request_ids = request_ids.join(",");
        notif.group = 1
      }

      let descs = [];
      requests.forEach(function (aReq) {
        descs.push(aReq.product.human_description);
      });
      let prefix = sharedStart(descs);
      notif.product_desc = request.product.human_description;
      let splitHumanDesc = request.product.human_description.split(" - ");
      for (let i = 1; i < requests.length; i++) {
        if (splitHumanDesc != null && splitHumanDesc.length == 3) {
          notif.product_desc += ", " + requests[i].product.human_description.substr(request.product.human_description.length - splitHumanDesc[2].length);
        } else {
          notif.product_desc += ", " + requests[i].product.human_description.substr(prefix.length);
        }
      }

      notif.services = "planning,production";
      notif.type = "home";
      notif.project_id = request.product.subproject.project.id;
      notif.subproject_id = request.product.subproject.id;
      notif.planning_id = request.planning_id;
      notif.archived = 0;
      notif.etape_action = request.action_type.etape_type.value + " - " + request.action_type.value;
      notif.subject = $rootScope._T["3fx1rq8a"]
      notif.description = $rootScope._T["xmq4mba0"]
      notif.description += $rootScope._T["ageoqhbl"] + " " + request.tech_writer_user.firstname + " " + request.tech_writer_user.lastname + " <br/>";
      notif.origin_user_id = $.cookie('user_id')

      if (request.is_partial == 1) {
        // A replanifier 6rypdonx
        notif.replan = true;
        notif.description += $rootScope._T["6rypdonx"]
      } else if (request.is_not_done == 1) {
        // A replanifier
        notif.replan = true;
        notif.description +=  $rootScope._T["6rypdonx"]
      } else if (request.is_done == 1) {
        notif.is_done = true; // 5me8mcty
        notif.description +=  $rootScope._T["5me8mcty"]
      }

      if (request.ownObservation && request.ownObservation.length > 0) {
        notif.description += $rootScope._T["lccbwbpx"]
      } else {
        notif.description += $rootScope._T["ahwl5mah"]
      }

      if (notif.has_return) {
        notif.description += $rootScope._T["v4qd5380"]
      } else {
        notif.description += $rootScope._T["dciov1sc"]
      }

      //Patch pour désactiver si la demande est avec retour, on ne l'a met pas en terminée
      if (notif.has_return && notif.is_done) {
        notif.is_done = null;
      }
      return notif;
    };

    // jamais utilisé 20210427
    $scope.sendNotif = function(request, title, description, service, field) {
      var notif = new NotificationService();
      notif.services = service;
      notif.title = title;
      notif.description = description;
      notif.request_id = request.id;
      notif.project_id = request.product.subproject.project_id;
      notif.product_desc = request.product.human_description;
      notif.common_id = request.id + "_" + field;
      notif.etape_action = request.action_type.etape_type.value + " " + request.action_type.value;
      notif.type = "standard";
      notif.$save();
      
      
    };

    $scope.selectGroup = function(group) {
      group.requests.forEach(function(requestInGroup) {
        $scope.changeInputGroup(requestInGroup);
        requestInGroup.selected = !requestInGroup.selected;
      });
    };

    $scope.changeInputGroup = function(request) {
      $scope.plannings.forEach(function(planning) {
        var requestFiltered = $filter('filter')(planning.requests, {
          id: request.id
        }, true);
        if (requestFiltered != null && requestFiltered.length == 1) {
          requestFiltered[0].selected = !requestFiltered[0].selected;
        }
      });


    };

    $scope.getSelectedRequests = function() {
      var requests = [];
      $scope.plannings.forEach(function(planning) {
        var requestsSelected = $filter('filter')(planning.requests, {
          selected: true
        });

        if (requestsSelected != null && requestsSelected.length > 0) {
          requests = requests.concat(requestsSelected);
        }
      });

      $scope.showSendBackRequests = false
      angular.forEach(requests, function(request) {
        if (request.tech_writer_id == $.cookie('user_id')) {
          $scope.showSendBackRequests = true
        }
      })
      return requests;
    }

    $scope.isSelectedRequest = function() {
      return $scope.getSelectedRequests().length > 0;
    }
    /*
    pour des raisons inconnues l'affichage était limité à  4 planning_id (note phv 20210208)
    List originale: digital-media , labo-media, vod , sous-titrage
    Les données sont liées à la valeur planning_id de la table request
    au 2021/02/05, il n'existe aucune entrée vod dans la table request
    */    
    if (!$scope.dubPlacesByLocValue || !$rootScope.user_entity.permissions) {
      $location.path('/')
    } else {
      fetchPlannings();
    }

    function fetchPlannings() {
      /// const planningFilter = { 'digital-media': true,'labo-media': true,'sous-titrage': true}
      const planningFilter = { [service] : true};
      $scope.plannings =  [];
      $rootScope.user_main_location = $rootScope.user_entity.permissions[0].main_location;
      $rootScope.plannings.forEach(function (element) {
        if (planningFilter[element.id]) {
          const data = {
            id: element.id,
            name: element.name,
            requests: init(element.id)
          };
          if (element.main_location) {
            if ($rootScope.user_main_location == element.main_location) {
              $scope.plannings.push(data)
            };
          } else {
            $scope.plannings.push(data);
          }
        }
      });
    }

    let refetchInterval;
    function startRefetchInterval() {
      refetchInterval = setInterval(fetchPlannings, 60000);
    }
    function stopRefetchInterval() {
      clearInterval(refetchInterval);
    }
    $scope.$on('$destroy', stopRefetchInterval);
    $scope.$on('$viewContentLoaded', startRefetchInterval);
    window.addEventListener('beforeunload', stopRefetchInterval);
    

    $scope.plannings.forEach(function(planning) {
      if ($.cookie('pills') != null) {
        if (planning.id == $.cookie('pills')) {
          planning.active = true;
        }
      }
    });

    $scope.setCookiePlannedFilter = function (index) {
      $.cookie('plannedfilter', index, {
        path: '/',
        expires: 60
      });
    };

    $scope.recordDetail = function(id) {
      window.location.href = "#/requestsAutoTech/" + id;
    }

    $scope.startDate = null;
    $scope.endDate = null;
    $scope.requestsNotInProgress = 0;

    $scope.textFilterChange = function () {
      $scope.inCompleteRequest()
    }


    $scope.filterRequest = function (method) {
      $scope.startTimestamp = ""
      $scope.endTimestamp = ""
      switch (method) {
        case "previous":
          $scope.filterDate = 4;
          var startTemp = moment().startOf('isoWeek').subtract(1, "weeks")
          var endTemp = moment().endOf('isoWeek').subtract(1, "weeks")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.setCookiePlannedFilter("previous")
          break;

        case "current":
          $scope.filterDate = 3;

          var startTemp = moment().startOf('isoWeek')
          var endTemp = moment().endOf('isoWeek')
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.setCookiePlannedFilter("current")
          break;

        case "next":
          $scope.filterDate = 5;

          var startTemp = moment().startOf('isoWeek').add(1, "weeks")
          var endTemp = moment().endOf('isoWeek').add(1, "weeks")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.setCookiePlannedFilter("next")
          break;

        case "tomorrow":
          $scope.filterDate = 2;

          var startTemp = moment().add(1, "days")
          var endTemp = moment().add(1, "days")
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.setCookiePlannedFilter("tomorrow")
          break;

          case "yesterday":
            $scope.filterDate = 6;
  
            var startTemp = moment().subtract(1, "days")
            var endTemp = moment().subtract(1, "days")
            $scope.startDate = startTemp.format('DD/MM/YYYY')
            $scope.endDate = endTemp.format('DD/MM/YYYY')
            $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
            $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
            $scope.setCookiePlannedFilter("yesterday")
            break;
        case "today":
          $scope.filterDate = 1;

          $scope.startDate = moment().format('DD/MM/YYYY')
          $scope.endDate = moment().format('DD/MM/YYYY')

          var startTemp = moment()
          var endTemp = moment()
          $scope.startDate = startTemp.format('DD/MM/YYYY')
          $scope.endDate = endTemp.format('DD/MM/YYYY')
          $scope.startTimestamp = startTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.endTimestamp = endTemp.hours(0).minute(0).second(0).millisecond(0).format('x')
          $scope.setCookiePlannedFilter("today")
          break;

        default:
          $scope.filterDate = 0;

          $scope.startDate = ""
          $scope.endDate = ""
          $scope.startTimestamp = ""
          $scope.endTimestamp = ""
          $scope.setCookiePlannedFilter("")
          break;
      }

      

      $scope.filterChoosen = method
      if ( $scope.plannings[0]) {
        $scope.inCompleteRequest()
      }
    }

    $scope.inCompleteRequest = function () {
      let requestsNotInProgress = 0;
      let filteredDateRequests = $filter('filterRequestTechByDate')($scope.plannings[0].requests, $scope.startTimestamp, $scope.endTimestamp)
      let lastFilteredRequests = ($scope.textFilter == '' || $scope.textFilter == null) ? filteredDateRequests : $filter('magicFilterRequest')(filteredDateRequests, $scope.textFilter)
      if (lastFilteredRequests !== undefined) {
        lastFilteredRequests.map((filteredRequest) => {
          if(filteredRequest.is_finished === '0' && filteredRequest.display == 1 && filteredRequest.is_sent_back != 1) {
            if (filteredRequest.from_group == null) {
              requestsNotInProgress++;
            }
            if (filteredRequest.group !== undefined && filteredRequest.group.requests.length > 0) {
              requestsNotInProgress = requestsNotInProgress + filteredRequest.group.requests.length
            }
          } 
        })
      }
      $scope.requestsNotInProgress = requestsNotInProgress.toString();
    }

    if ($.cookie('plannedfilter') != null && $.cookie('plannedfilter') != '') {
      $scope.filterRequest($.cookie('plannedfilter'));
    } else {
      $scope.filterRequest('today');
    }
  }
]);
