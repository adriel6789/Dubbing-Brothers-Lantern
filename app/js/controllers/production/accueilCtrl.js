/**
 * Created by Marcel on 23/03/2015.
 */

Lantern.controller('accueilCtrl', ['$scope', '$rootScope', '$filter', '$cookies', '$stateParams', '$state', '$location', 'ngDialog', 
  'Request', 'Product', 'Favorite', 'NotificationService', 'Comment', 'RequestGroup', '$window', 'Session', 'User', 
  'CreateRequestService', 'WorkflowHelperService', 'ApiRest', 'ClientService', 'PersonsService', 'NotificationsService','Valuelist', 'ValueListService',
  function ($scope, $rootScope, $filter, $cookies, $stateParams, $state, $location, ngDialog, 
    Request, Product, Favorite, NotificationService, Comment, RequestGroup, $window, Session, User, 
    CreateRequestService, WorkflowHelperService, ApiRest, ClientService, PersonsService, NotificationsService, Valuelist, ValueListService) {

    $scope.allNotifs = []
    $scope.subproject_natures = Valuelist.query({tableName: 'subproject_nature'});
    $rootScope.subproject_natures = $scope.subproject_natures

    ValueListService.getLanguages(ValueListService.manageReceivedLanguages(
      function () {}
    ), function () {})
    ValueListService.getNormesMix(ValueListService.manageReceivedNormesMix(
      function () {}
    ), function () {})
    ValueListService.getResolutions(ValueListService.manageReceivedResolutions(
      function () {}
    ), function () {})

    ValueListService.getSpeeds()
    $scope.user_role = Session.role();

    var upUser = new User();
    upUser.last_notification_home_consult = moment().format("YYYY-MM-DD HH:mm:ss");
    upUser.$update({}, function () {
      $rootScope.isNewHomeNotification()
    })

    $scope.dates_sections = [{
      "date": "today",
      "desc": $rootScope._T["ze7enx7x"]
    }, {
      "date": "yesterday",
      "desc": $rootScope._T["0axqi4w1"]
    }, {
      "date": "this_last_week",
      "desc": $rootScope._T["jbveza9i"]
    }, {
      "date": "more_two_week",
      "desc": $rootScope._T["a9tmfv0z"]
    }]   

    $rootScope.hasValues = function () {
      if ($rootScope.values) {
        return true
      }
      return false
    }
    $rootScope.getValues = function () {
      ApiRest.get('/Clients/', {
      }, function (data) {
        data.forEach(function (item) {
          $rootScope.clients[item.id] = item
        })
      }, null, true)
  
      ApiRest.get('/valuelists/values/', {
      }, function (data) {

        $rootScope.values = data
        Object.keys($rootScope.values.workflow_type).forEach(function (id) {
          ApiRest.get('/valuelists/ActionsByEtape/', {workflow_type_id: id}, function(etapes_actions) {
            $rootScope.etapes_actions[id] = {}
            etapes_actions.forEach(function (element) {
              $rootScope.etapes[element.id] = element
              $rootScope.etapes_actions[id][element.id] = element
              element.actions.forEach(function (action) {
                $rootScope.actions[action.id] = action
              })
            })
          })  
        })
      }, null, true)      
    }    

    function init() {
      ClientService.getClients({}, function() {
      }, ClientService.manageClientError)
      PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
      $scope.allNotifs = [];

      $scope.loadNotifsHome()

      if ($rootScope.canDisplay(5)) {
        $scope.planningsHome = angular.copy($rootScope.plannings)

        if ($.cookie('planningHome') != null) {
          var tabId = $.cookie('planningHome').split(',');
          angular.forEach($scope.planningsHome, function (planning) {
            if (tabId.indexOf(planning.id) != -1) {
              planning.show = true;
            } else {
              planning.show = false;
            }
          })

          var filtersUnplanned = [{
            "name": "is_planned",
            "value": "0"
          }, {
            "name": "plannings",
            "value": $.cookie('planningHome')
          }, {
            "name": "on_hold",
            "value": "0"
          }, {
            "name": "is_done",
            "value": "0"
          }, {
            "name": "is_finished",
            "value": "0"
          }];

          var filtersPlanned = [{
            "name": "is_planned",
            "value": "1"
          }, {
            "name": "plannings",
            "value": $.cookie("planningHome")
          }, {
            "name": "on_hold",
            "value": "0"
          }, {
            "name": "request.is_done",
            "value": "0"
          }, {
            "name": "request.is_finished",
            "value": "0"
          }, {
            "name": "farmerbookings.is_selected",
            "value": "0"
          }, {
            "name": "day",
            "value": moment().format("YYYY-MM-DD") + " 00:00:00"
          }];
          if (Session.branchId() == 2 && $.cookie('locpills')) {
              filtersUnplanned.push({ name: 'main_location', value: $.cookie('locpills')})
              filtersPlanned.push({ name: 'main_location', value: $.cookie('locpills')})
          }
          Request.countRequests({
            filters: [filtersUnplanned],
            planned: false
          }, function (response) {
            $scope.countUnplanned = response[0]
          })
          Request.countRequests({
            filters: [filtersPlanned],
            planned: true
          }, function (response) {
            $scope.countPlanned = response[0]
          })

        }
      }

      $rootScope.getValues()
    }

    let subprojectNatureById = null
    const homeNotifsReceived = function () {
      if (!subprojectNatureById) {
        subprojectNatureById = {}
        $scope.subproject_natures.forEach((entry) => {
          subprojectNatureById[entry.id] = entry[$rootScope.getLang()]
        })
      }
      const allNotifs = []
      $scope.allNotifs = []
      $scope.observations = $rootScope.homeObservations
      $scope.requests = $rootScope.homeRequests
      $rootScope.homeNotifs.forEach((notif) => {
        if ($rootScope.homeRequests[notif.request_id].return_id) {
          notif.has_return = 1
        }
        notif.product_id = $rootScope.homeRequests[notif.request_id].product_id
        notif.request = $rootScope.homeRequests[notif.request_id]
        
        notif.observations = $rootScope.homeObservations[notif.request_id]

        notif.returns = false
        notif.hasReturnToCorrect = null
        if (notif.request.sharedReturn.length > 0) {
          notif.returns = 1
          notif.request.sharedReturn.forEach((item) => {
            if (item.is_not_done == 1 || item.to_review == 1) {
              notif.hasReturnToCorrect = true
            }
          })
        }
        $rootScope.homeReturns[notif.request_id]
        notif.date_moment = moment(notif.date_creation)
        notif.request.projectName = $rootScope.homeProjects[notif.request.project]
        notif.request.subproject_detail = $rootScope.homeSubProjects[notif.request.subproject]
        notif.request.subproject_nature = subprojectNatureById[notif.request.subproject_detail.nature_id]
        notif.request.workflow = WorkflowHelperService.describeBarWorkflowByIds($rootScope.homeWorkflows[notif.request.workflow_id])  

        allNotifs.push(notif)

      })
      $scope.allNotifs = allNotifs
    }

    $scope.pageNotificationHome = 0;
    $scope.loadNotifsHome = function () {
      const parameters = {
        user_id: Session.userId(),
        archived: 0
      }

      NotificationsService.getHomeNotifications(parameters, $scope.pageNotificationHome, null, NotificationsService.manageHomeNotificationsReceived(homeNotifsReceived), function () {})

      $scope.pageNotificationHome += 1


      /*

      $scope.notifIsLoading = true
      var filterNotifs = [{
        "name": "user_id",
        "value": Session.userId()
      }, {
        "name": "archived",
        "value": "0"
      }];
      $scope.planningsHome = angular.copy($rootScope.plannings)


      // charge des notifs de type home
      NotificationService.getNotifsHomeBy({
        filters: [filterNotifs],
        page: $scope.pageNotificationHome
      }, function (notifs) {
        notifs.forEach(function (notif) {
          if (notif.request != null && notif.request.workflow != null) {
            notif.request.workflow.color = colorizeWorkflow(notif.request.workflow);
            notif.request.product.human_description = notif.request.product.human_description.replace('Saison', $rootScope._T["6vwtywcc"]).replace('Episode', $rootScope._T["m3iyfpjn"])
            notif.request.workflow.description = WorkflowHelperService.describeWorkflow(notif.request.workflow);
            if (Object.keys(notif.request.sharedReturn).length > 0) {
              notif.hasReturnToCorrect = false;
              angular.forEach(notif.request.sharedReturn, function(aReturn) {
                if (aReturn.is_not_done == 1 || aReturn.to_review == 1) {
                  notif.hasReturnToCorrect = true;
                }
              })
            }
          } else if (notif.requests != null) {
            notif.hasReturnToCorrect = false;
            angular.forEach(notif.requests, function (request) {
              if (request.workflow!= null) {
                request.workflow.color = colorizeWorkflow(request.workflow);
                request.workflow.description = WorkflowHelperService.describeWorkflow(request.workflow);
                if (notif.request) {
                  request.product.human_description = notif.request.product.human_description.replace('Saison', $rootScope._T["6vwtywcc"]).replace('Episode', $rootScope._T["m3iyfpjn"])
                }
              }
              if (Object.keys(request.sharedReturn).length > 0) {
                request.hasReturnToCorrect = false;
                angular.forEach(request.sharedReturn, function(aReturn) {
                  if (aReturn.is_not_done == 1 || aReturn.to_review == 1) {
                    notif.hasReturnToCorrect = true;
                    request.hasReturnToCorrect = true;
                  }
                })
              }
            })
          }

          if ($rootScope.canDisplay(5)) {
            if ($.cookie('planningHome') != null) {
              var cookie = $.cookie('planningHome');
              var tabId = cookie.split(',');
              if (cookie == "") {
                $scope.noPlanningSelected = true;
              } else {
                var index = tabId.indexOf(notif.planning_id);
                if (index != -1) {
                  notif.date_moment = moment(notif.date_creation);
                  if ($filter('filter')($scope.allNotifs, notif.id, true).length == 0) {
                    $scope.allNotifs.push(notif);
                  }
                }
              }
            } else {
              $scope.noPlanningSelected = true;
            }
          } else {
            notif.date_moment = moment(notif.date_creation);
            $scope.allNotifs.push(notif);
          }
        });

        $scope.notifIsLoading = false
        $scope.pageNotificationHome += 1;
      });
      */
    }


    $scope.infiniteScrollNotificationHome = function () {
      if (!$scope.notifIsLoading && $state.current.name == "app.index") {
        const parameters = {
          user_id: Session.userId(),
          archived: 0
        }
        NotificationsService.getHomeNotifications(parameters, $scope.pageNotificationHome, null, NotificationsService.manageHomeNotificationsReceived(homeNotifsReceived), function () {})
        $scope.pageNotificationHome += 1
      }
    }

    init();

    angular.element($window)
      .bind(
      "scroll",
      function () {
        var windowHeight = "innerHeight" in window ? window.innerHeight :
          document.documentElement.offsetHeight;
        var body = document.body,
          html = document.documentElement;
        var docHeight = Math.max(body.scrollHeight,
          body.offsetHeight, html.clientHeight,
          html.scrollHeight, html.offsetHeight);
        windowBottom = windowHeight + window.pageYOffset;
        if (windowBottom >= docHeight) {
          $scope.infiniteScrollNotificationHome()
        }
      });


    $scope.setCookiePlanning = function (planning_id, main_location, today) {
      $.cookie('pills', planning_id, {
        path: '/',
        expires: 60
      });
      $.cookie('locpills', main_location, {
        path: '/',
        expires: 60
      });
      if (today) {
        $.cookie('plannedfilter', "today", {
          path: '/',
          expires: 60
        });
      } else {
        $.cookie('plannedfilter', "", {
          path: '/',
          expires: 60
        });
      }
    }

    $scope.dismissNotif = function (notif_id) {
      var updateNotif = new NotificationService();
      updateNotif.archived = 1;
      updateNotif.$update({
        "id": notif_id
      }, function () {
        $scope.allNotifs.forEach(function (notif, index) {
          if (notif.id == notif_id) {
            notif.archived = 1;
          }
        });
      });
    };

    $scope.showObservations = function (observations) {
      $scope.myObservations = observations
      ngDialog.open({
        template: 'views/Dialog/ShowObservations.html',
        scope: $scope,
        controller: 'ShowObservationsDialogCtrl',
        closeByDocument: false
      });
    };

    $scope.goManageReturns = function (product_id, request_id) {
      Request.get({
        requestId: request_id
      }, function (request) {
        $location.path('/manageReturns/' + product_id + "/" + request.workflow_id);
      });
    };

    $scope.replanRequest = function (notif, index) {
      swal({
        title: $rootScope._T["sz80bnvo"],
        text: $rootScope._T["ou4vmawf"],
        type: "info",
        showCancelButton: true,
        confirmButtonText: $rootScope._T["w7redrmn"],
        cancelButtonText: $rootScope._T["ficbz281"],
        closeOnConfirm: true
      }, function () {
        let newRequest = new Request();
        newRequest.is_planned = 0;
        newRequest.is_sent_back = 0;
        newRequest.is_not_done = 0;
        newRequest.is_in_progress = 0;
        newRequest.is_done = 0;

        newRequest.$update({
          requestId: notif.request.id
        }, function () {
          newActivityLogRequest(new Comment(), Session.userId(), notif.request.id, $rootScope._T["fe285hfu"])
          NotificationService.deleteByCommonId({
            'common_id': notif.common_id
          });

          let servicesToNotify = "production,planning";
          let role = Session.role();
          if ($rootScope.canDisplay(4)) {
            servicesToNotify = "production";
          }

          sendStandardNotif(
            new NotificationService(), [notif.request],
            servicesToNotify,
            $rootScope._T["hribawnh"],
            "Demande(s) replanifiée(s)",
            $filter,
            "planification",
            $rootScope
          );

          goToRequestsGroup(notif.request)          
        });
      });
    };

    function goToRequestsGroup(request) {
        $state.go($state.current.name, {
            requestId:request.id
        });
    }          

    $scope.replanGroupRequest = function (notif) {
      swal({
        title: $rootScope._T["yf5y50z6"],
        text: $rootScope._T["9bgh7n5i"],
        type: "info",
        showCancelButton: true,
        confirmButtonText: $rootScope._T["w7redrmn"],
        cancelButtonText: $rootScope._T["ficbz281"],
        closeOnConfirm: true
      }, function () {
        let notifSend = false;
        let count = 0;
        let size = notif.requests.length;
        angular.forEach(notif.requests, function (request) {
          let newRequest = new Request();

          newRequest.is_planned = 0;
          newRequest.is_sent_back = 0;
          newRequest.is_not_done = 0;
          newRequest.is_in_progress = 0;
          newRequest.is_done = 0;

          newRequest.$update({
            requestId: request.id
          }, function () {
            newActivityLogRequest(new Comment(), Session.userId(), request.id, $rootScope._T["fe285hfu"]);

            if (!notifSend) {
              notifSend = true;
              let servicesToNotify = "production,planning";
              let role = Session.role();
              if ($rootScope.canDisplay(4)) {
                servicesToNotify = "production";
              }

              sendStandardNotif(
                new NotificationService(),
                notif.requests,
                servicesToNotify,
                $rootScope._T["hribawnh"],
                "Demande(s) replanifiée(s)",
                $filter,
                "planification",
                $rootScope
              );
            }

            count += 1;
            if (count === size) {
              goToRequestsGroup(request)              
            }

          });
        });
        NotificationService.deleteByCommonId({
          'common_id': notif.common_id
        });
        $scope.allNotifs.forEach(function (aNotif, index) {
          if (aNotif.id === notif.id) {
            notif.archived = 1;
          }
        });
       });
    };

    $scope.newRequestFromNotif = function (request_id) {
      Request.get({
        requestId: request_id
      }, function (request) {
        CreateRequestService.createRequestDialog(request.product.id, request.workflow.id, request.id, null, null,null);
      });

      $rootScope.scopeSave = true
      $scope.allNotifs = []

    }

    $scope.newRequestGroupFromNotif = function (requests) {
      var request_ids = []
      var product_ids = []
      angular.forEach(requests, function (request) {
        request_ids.push(request.id)
        product_ids.push(request.product.id)
      })
      Request.get({
        requestId: requests[0].id
      }, function (request) {
        CreateRequestService.createRequestDialog(product_ids.join(','), request.workflow.id, request_ids.join(','), null, null,null);
      });
    }

    $scope.dismissAllFinished = function () {
      if (confirm($rootScope._T["rk1awbb7"])) {
        NotificationService.archivedNotifsByUser({
          "user_id": Session.userId()
        }, function () {
          $state.reload();
        });
      }
    }

    $scope.countNotifications = function () {
      var count = 0;
      $scope.allNotifs.forEach(function (notif) {
        if (notif.archived != 1) count++;
      });
      return count;
    }
  }
]);
