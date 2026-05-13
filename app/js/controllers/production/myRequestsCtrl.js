Lantern.controller('MyRequestsCtrl', ['$rootScope', '$scope', '$filter', '$state', 'Request', 'Valuelist', 'RequestGroup', 'ngTableParams', 'ngDialog', 'Comment', 'NotificationService', '$location', 'Session', 'WorkflowHelperService',
  function ($rootScope, $scope, $filter, $state, Request, Valuelist, RequestGroup, ngTableParams, ngDialog, Comment, NotificationService, $location, Session, WorkflowHelperService) {
    // ne semble plus trop utilisé
    $scope.refreshRequests = function() {
      var data = $scope.requests = [];
      var filters = [{
        "name": "user_id",
        "value": Session.userId()
      }, {
        "name": "is_done",
        "value": "0"
      }];
      Request.getRequestsBy({
        filters: [filters]
      }, function(requests) {
        for (var i = requests.length - 1; i >= 0; i--) {
          if (requests[i].delai_souhaite != null) {
            requests[i].selectedDates = requests[i].delai_souhaite.split(',')
          }
          requests[i].workflow.color = colorizeWorkflow(requests[i].workflow)
          requests[i].workflow.description = WorkflowHelperService.describeWorkflow(requests[i].workflow)
          requests[i].ownFarmerbookings = objectInArray(requests[i].ownFarmerbookings)
          if (requests[i].is_sent_back == 1) {
            //requests.splice(i, 1);
            //On vérifie s'il ne reste pas des séances
            var remainFarmer = false;
            angular.forEach(requests[i].ownFarmerbookings, function(farmer) {
              if (farmer.is_done != 1) {
                remainFarmer = true;
              }
            });

            if (remainFarmer) {
              $scope.requests.push(requests[i]);
            }
          } else {
            requests[i].display = 1
            if (requests[i].in_group == 1) {
              requests[i].display = 0
            }

            $scope.requests.push(requests[i]);
          }
        }


        var filtersGroup = [{
          "name": "user_id",
          "value": Session.userId()
        }, {
          "name": "is_done",
          "value": "0"
        }];
        $scope.groups = RequestGroup.getAllRequestsBy({
          filters: [filtersGroup]
        }, function(groups) {
          groups.forEach(function(group) {
            var products_names = [];
            var countRequest = 0;
            group.requests.forEach(function(request) {
              if (request.product != null) {
                products_names.push(request.product.human_description);
              }
              if (request.is_sent_back != 1) {
                countRequest++;
              }
            });

            var oneRequest = group.requests[0];
            if (oneRequest.user_id == Session.userId()) {
              if (oneRequest.delai_souhaite != null) {
                oneRequest.selectedDates = oneRequest.delai_souhaite.split(',')
              }
              oneRequest.ownFarmerbookings = objectInArray(oneRequest.ownFarmerbookings)
              oneRequest.from_group = group.id;
              oneRequest.products_names = products_names;
              oneRequest.number_request = countRequest;
              oneRequest.group = group;
              oneRequest.showGroup = false;
              oneRequest.workflow.color = colorizeWorkflow(oneRequest.workflow)
              oneRequest.workflow.description = WorkflowHelperService.describeWorkflow(oneRequest.workflow)
              oneRequest.display = 1;
              if (oneRequest.is_sent_back != 1) {
                $scope.requests.push(oneRequest);
              }
            }
          });

          data = $scope.requests;

          $scope.tableParams = new ngTableParams({
            //page: 1, // show first page
            count: 50,
            sorting: {
              date_creation: 'desc' // initial sorting
            }
          }, {
            total: data.length, // length of data
            getData: function($defer, params) {
              // use build-in angular filter
              var orderedData = params.sorting() ?
                $filter('orderBy')(data, params.orderBy()) : data;
              orderedData = params.filter ?
                $filter('filter')(orderedData, params.filter()) :
                orderedData;

              params.total(orderedData.length); // set total for recalc pagination

              $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          });
        });
      });
    };
    $scope.refreshRequests();

    $scope.action_types = Valuelist.query({
      tableName: 'action_types'
    });
    $scope.etapes = Valuelist.query({
      tableName: 'etape_types'
    });

    $scope.refreshFilters = function() {

      $scope.techsFilter = [];
      $scope.auditsFilter = [];

      var filteredDemand = $filter('nextWeekFilter')($scope.demandes);

      filteredDemand.forEach(function(demande) {
        // Pour les techs

        if (demande.ownFarmerbookings != null) {
          demande.ownFarmerbookings.forEach(function(farmer) {

            if (farmer.recorder != null) {
              var found = $filter('filter')($scope.techsFilter, {
                name: farmer.recorder
              }, true);
              if (!found.length) {
                var option = {
                  name: farmer.recorder
                };
                $scope.techsFilter.push(option);
              }
            }
            if (farmer.ingenieur != null) {
              var found = $filter('filter')($scope.techsFilter, {
                name: farmer.ingenieur
              }, true);
              if (!found.length) {
                var option = {
                  name: farmer.ingenieur
                };
                $scope.techsFilter.push(option);
              }
            }

            //Pour les audits
            if (farmer.audit != null) {
              var found = $filter('filter')($scope.auditsFilter, {
                name: farmer.audit
              }, true);
              if (!found.length) {
                var option = {
                  name: farmer.audit
                };
                $scope.auditsFilter.push(option);
              }
            }
          });
        }
      });
    };

    $scope.deleteLines = function() {

      var requestsSelected = $filter('filter')($scope.requests, {
        selected: true,
        in_group: "!1"
      });

      var groupRequestsSelected = $filter('filter')($scope.requests, {
        selected: true,
        in_group: 1
      });


      groupRequestsSelected.forEach(function(mainRequest) {
        if (mainRequest.group != null) {
          mainRequest.group.requests.forEach(function(request) {
            requestsSelected.push(request);
          });
        }
      });

      var count = 0;
      var size = requestsSelected.length;


      if (requestsSelected.length != 0) {
        //Check si des demandes sont déjà planifiées
        var somePlanned = false;
        requestsSelected.forEach(function(request, index) {
          if (request.is_planned == 1) {
            somePlanned = true;
            return;
          }
        });
        if (!somePlanned) {
          if (confirm($rootScope._T["59p5v06r"])) {
            requestsSelected.forEach(
              function(request, index) {
                Request.delete({
                    requestId: request.id
                  },
                  //Fonction de callback pour bien rafraichir la liste via une nouvelle requête API
                  function() {
                    count++;
                    if (count == size) {
                      if (groupRequestsSelected.length != 0) {
                        var countGroup = 0;
                        var totalGroup = groupRequestsSelected.length;
                        groupRequestsSelected.forEach(function(request) {
                          RequestGroup.delete({
                            id: request.group.id
                          }, function() {
                            countGroup++;
                            if (totalGroup == countGroup) {
                              $state.reload();
                            }
                          });
                        });
                      } else {
                        $state.reload();
                      }
                    }
                  });
              }
            );
          }
        } else {
          alert($rootScope._T["ok34a4cr"]);
        }
      }
    };


    $scope.isOnGroup = function(request) {
      if ($scope.groups != null && request.in_group == 1) {
        for (i = $scope.groups.length - 1; i >= 0; i--) {
          if ($scope.groups[i].requests != null) {
            for (j = $scope.groups[i].requests.length - 1; j >= 0; j--) {
              if ($scope.groups[i].requests[j].id == request.id) {
                return $scope.groups[i];
              }
            };
          } else {
            console.log("No request in group");
            console.log(group);
          }
        }
      }
      return false;

    };

    $scope.selectGroup = function(group) {
      group.requests.forEach(function(requestInGroup) {

        var allRequest = $filter('filter')($scope.requests, {
          id: requestInGroup.id
        }, true);

        if (allRequest != null && allRequest.length == 1) {
          allRequest[0].selected = !allRequest[0].selected;
        }
        requestInGroup.selected = !requestInGroup.selected;
      });
    };

    $scope.changeInputGroup = function(request) {
      //request.selected = !request.selected;
      var requestFiltered = $filter('filter')($scope.requests, {
        id: request.id
      }, true);
      if (requestFiltered != null && requestFiltered.length == 1) {
        requestFiltered[0].selected = !requestFiltered[0].selected;
      }
    };

    $scope.unselectRequests = function() {
      var requestsSelected = $filter('filter')($scope.requests, {
        selected: true
      })

      angular.forEach(requestsSelected, function(request) {
        request.selected = false
      });

      $scope.groups.forEach(function(group) {
        var requestsSelected = $filter('filter')(group.requests, {
          selected: true
        });

        angular.forEach(requestsSelected, function(request) {
          request.selected = false
        });
      });

      //Fix en JS pur pour les checkbox des groupes
      var groupInbox = document.getElementsByClassName('checkboxGroup');
      for (var i = 0; i < groupInbox.length; i++) {
        groupInbox[i].checked = false;
      }
    }

    $scope.massUpdatePopup = function(object) {
      var requestsSelected = $filter('filter')($scope.requests, {
        selected: true
      });
      if (requestsSelected.length > 0) {
        $scope.massRequestsToUpdate = requestsSelected;
        var templateURL = '';
        switch (object) {
          case 'urgent':
            templateURL = 'views/Dialog/MassUpdateUrgentDialog.html';
            break;
          case 'date_desired':
            templateURL = 'views/Dialog/MassUpdateDateDesiredDialog.html';
            break;
          case 'put_on_hold_or_cancel_requests':
            templateURL = 'views/Dialog/MassUpdateCancelOnHoldDialog.html';
            break;
          case 'add_comment':
            var count = 0;
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
                        count++;

                        if (count == requestsSelected.length) {
                          sendStandardNotif(
                            new NotificationService(),
                            $scope.massRequestsToUpdate,
                            "production,planning",
                            $rootScope._T['8m4tsidm'],
                            newComment.text,
                            $filter,
                            "comment",
                            $rootScope
                          );
                        }
                      });

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
            className: 'ngdialog-theme-default',
            template: templateURL,
            scope: $scope,
            controller: 'MassUpdateDialogCtrl',
            closeByDocument: false
          });
          dialog.closePromise.then(function(data) {
            $scope.unselectRequests()
            //$state.reload();
          });
        }

      } else {
        swal($rootScope._T["9a5vpf3c"], $rootScope._T["zmsgyjhj"], "error");
      }
    }

    // jamais utilisé abandonné ou pas terminé (note phv du 20210430)
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
      notif.origin_user_id = $.cookie('user_id')
      notif.type = "standard";
      notif.$save();
    };

    $scope.isSelectedRequest = function() {
      var requestsSelected = $filter('filter')($scope.requests, {
        selected: true
      });
      if (requestsSelected != null && requestsSelected.length > 0) {
        return true;
      } else {
        return false;
      }
    }

    $scope.countRequestPlanInGroup = function(group) {
      var count = 0;
      group.requests.forEach(function(request) {
        if (request.ownFarmerbookings.length == 0) {
          //if (request.date_start != null || request.date_end != null) {
          if (request.planification_date != null) {
            count++;
          }
        } else {
          if (request.is_planned == 1) {
            count++;
          }
        }
      });
      return count;
    }


  }
]);
