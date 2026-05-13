'use strict';

/* Service concernant les notifications
* remplacera à terme bonsServices.factory('NotificationService', ['$resource', qui se trouve dans app/js/services.js
*/
Lantern.factory('NotificationsService', ['$http','$q', 'ApiRest', 'Session', '$rootScope', 'ngDialog', '$state',
  function($http, $q, ApiRest, Session, $rootScope, ngDialog, $state) {
    const service = {}
    
    // load notifs from server
    let allNotifications = null
    let allArchivedNotifications = null
    let allPostPonedNotifications = null
    $rootScope.allRequestsNotifs = {}
    $rootScope.allProductsNotifs = {}
    $rootScope.allProjectsNotifs = {}
    $rootScope.allSubprojectsNotifs = {}
    $rootScope.allFarmerbookingsNotifs = {}
    $rootScope.allWorkflowsNotifs = {}
    $rootScope.allUsersNotifs = {}
    
    service.manageReceivedData = function (done) {
      return function (response, params) {
        Object.keys(response.requests).forEach((id) => {
          $rootScope.allRequestsNotifs[id] = response.requests[id]
        })
        Object.keys(response.farmerbookings).forEach((farmer_id) => {
          $rootScope.allFarmerbookingsNotifs[farmer_id] = response.farmerbookings[farmer_id]
        })
        Object.keys(response.products).forEach((product_id) => {
          $rootScope.allProductsNotifs[product_id] = response.products[product_id]
        })
        Object.keys(response.projects).forEach((project_id) => {
          $rootScope.allProjectsNotifs[project_id] = response.projects[project_id]
        })
        Object.keys(response.subprojects).forEach((subproject_id) => {
          $rootScope.allSubprojectsNotifs[subproject_id] = response.subprojects[subproject_id]
        })
        Object.keys(response.workflows).forEach((workflow_id) => {
          $rootScope.allWorkflowsNotifs[workflow_id] = response.workflows[workflow_id]
        })
        Object.keys(response.users).forEach((user_id) => {
          $rootScope.allUsersNotifs[user_id] = response.users[user_id]
        })

        if (params.postponed == 1) {
          allPostPonedNotifications = response
          return done(response)
        } else if (params.archived == 1) {
          allArchivedNotifications = response
          return done(response)
        } else {
          allNotifications = response
          const plannings = {}
          const notificationTypes = {}
          Object.keys(response.notifs).forEach((notif_id) => {
            plannings[response.notifs[notif_id].planning_id] = $rootScope.planningsByService[response.notifs[notif_id].planning_id]
            notificationTypes[response.notifs[notif_id].category] = true
          })
          $rootScope.planningsFound = Object.values(plannings)
          $rootScope.planningsFound.unshift({ id: 0, name: 'All', value: 'all'})
          $rootScope.notificationsTypesArray = Object.keys(notificationTypes)
          $rootScope.notificationsTypesArray.unshift('All')
          return done(response)
        }
      }
      
    }

    service.removeFromArchivedNotifications = function (notif_id) {
      delete allArchivedNotifications[notif_id]
    }

    service.getAllNotifications = function (fromServer, params, successCallback, errorCallback) {
      if (!fromServer) {
        if (params.archived == 1 && allArchivedNotifications) {
          return successCallback(allArchivedNotifications, params)
        }
        if (params.postponed == 1 && allPostPonedNotifications) {
          return successCallback(allPostPonedNotifications, params)
        }
        if (params.archived == 0 && params.postponed == 0 && allNotifications) {
          return successCallback(allNotifications, params)
        }
      }
      ApiRest.post('/Notifs/all/notifications/0/1000/', null, params, 
        function(response) {
          return successCallback(response, params)
        }, 
        function(error) {
          return errorCallback(error)
        })
    }

    service.manageLatestNotificationsReceived = function (done) {
      return function (response) {
        const newNotifications = {}
        Object.keys(response.notifs).forEach((notif_id) => {
          if (response.notifs[notif_id].archived == 1) {
            if (allArchivedNotifications && !allArchivedNotifications[notif_id]) {
              allArchivedNotifications.notifs[notif_id] = response.notifs[notif_id]
              if ($rootScope.showArchivedNotifsValue == 1) {
                newNotifications[notif_id] = response.notifs[notif_id]
              }
            }
            // regarde si existe dans les deux autres et supprime
            if (allPostPonedNotifications && allPostPonedNotifications.notifs[notif_id]) {
              delete allPostPonedNotifications.notifs[notif_id]
            }
            if (allNotifications.notifs[notif_id]) {
              delete allNotifications.notifs[notif_id]
            }
          } else if (response.notifs[notif_id].postponed == 1) {
            if (allPostPonedNotifications && !allPostPonedNotifications.notifs[notif_id]) {
              allPostPonedNotifications.notifs[notif_id] = response.notifs[notif_id]
              if ($rootScope.showPostponedNotifsValue && $rootScope.showPostponedNotifsValue == 1) {
                newNotifications[notif_id] = response.notifs[notif_id]
              }
            }
            if (allArchivedNotifications && allArchivedNotifications.notifs[notif_id]) {
              delete allArchivedNotifications.notifs[notif_id]
            }
            if (allNotifications.notifs[notif_id]) {
              delete allNotifications.notifs[notif_id]
            }

          } else {
            if (allArchivedNotifications && allArchivedNotifications.notifs[notif_id]) {
              delete allArchivedNotifications[notif_id]
            }
            if (allPostPonedNotifications && allPostPonedNotifications[notif_id]) {
              delete allPostPonedNotifications.notifs[notif_id]
            }
            if (!allNotifications.notifs[notif_id] && $rootScope.showMainNotifsValue == 1) {
              newNotifications[notif_id] = response.notifs[notif_id]
            }
            // add to main notifications
            allNotifications.notifs[notif_id] = response.notifs[notif_id]
          }

        })
        Object.keys(response.requests).forEach((id) => {
          $rootScope.allRequestsNotifs[id] = response.requests[id]
        })
        Object.keys(response.farmerbookings).forEach((farmer_id) => {
          $rootScope.allFarmerbookingsNotifs[farmer_id] = response.farmerbookings[farmer_id]
        })
        Object.keys(response.products).forEach((product_id) => {
          $rootScope.allProductsNotifs[product_id] = response.products[product_id]
        })
        Object.keys(response.projects).forEach((project_id) => {
          $rootScope.allProjectsNotifs[project_id] = response.projects[project_id]
        })
        Object.keys(response.subprojects).forEach((subproject_id) => {
          $rootScope.allSubprojectsNotifs[subproject_id] = response.subprojects[subproject_id]
        })
        Object.keys(response.workflows).forEach((workflow_id) => {
          $rootScope.allWorkflowsNotifs[workflow_id] = response.workflows[workflow_id]
        })
        Object.keys(response.users).forEach((user_id) => {
          $rootScope.allUsersNotifs[user_id] = response.users[user_id]
        })
        Object.keys(response.latestFarmers).forEach((farmer_id) => {
          $rootScope.allFarmerbookingsNotifs[farmer_id] = response.latestFarmers[farmer_id]
        })
        return done(newNotifications, response.latestFarmers)
      }
      
    }


    let lastCheckTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
    service.getLatestNotifications = function (successCallback, errorCallback) {
      const parameters = {
        user_id: Session.userId(),
        type: 'standard',
        lasttime: lastCheckTime
      }
      ApiRest.post('/Notifs/latest/notifications/', null, parameters, 
      function(response) {
        lastCheckTime = moment(new Date().getTime()).format("YYYY-MM-DD HH:mm:ss")
        return successCallback(response)
      }, 
      function(error) {
        return errorCallback(error)
      })
    }

    $rootScope.homeNotifs = []
    $rootScope.homeRequests = {}
    $rootScope.homeProjects = {}
    $rootScope.homeSubProjects = {}
    $rootScope.homeObservations = {}
    $rootScope.homeReturns = {}
    $rootScope.homeWorkflows = {}
    service.manageHomeNotificationsReceived = function (done) {
      return function (response) {
        Object.keys(response.notifs).forEach((id) => {
          $rootScope.homeNotifs.push(response.notifs[id])
        })
        Object.keys(response.requests).forEach((id) => {
          $rootScope.homeRequests[id] = response.requests[id]
        })
        Object.keys(response.observations).forEach((request_id) => {
          $rootScope.homeObservations[request_id] = response.observations[request_id]
        })
        Object.keys(response.projects).forEach((project_id) => {
          $rootScope.homeProjects[project_id] = response.projects[project_id]
        })
        Object.keys(response.subprojects).forEach((subproject_id) => {
          $rootScope.homeSubProjects[subproject_id] = response.subprojects[subproject_id]
        })
        Object.keys(response.workflows).forEach((workflow_id) => {
          $rootScope.homeWorkflows[workflow_id] = response.workflows[workflow_id]
        })
        Object.keys(response.returns).forEach((request_id) => {
          $rootScope.homeReturns[request_id] = response.returns[request_id]
        })
        return done()
      }
    }

    service.getHomeNotifications = function (params, page, limit, successCallback, errorCallback) {
      if (page == 0) {
        $rootScope.homeNotifs = []
      }
      if (!limit) {
        limit = 20
      }
      ApiRest.post('/Notifs/home/notifications/' + page + '/' + limit + '/', null, params, 
        function(response) {
          return successCallback(response)
        }, 
        function(error) {
          return errorCallback(error)
        })
    }

    service.updateNotifications = function (notifs, successCallback) {
      ApiRest.post('/Notifs/update/notifications/', null, notifs, 
      function(response) {
        return successCallback(response)
      }, 
      function(error) {
        console.log(error)
        return {}
      })
      
    }

    service.deleteSeveralNotifications = function (listNotifs, successCallback) {
      ApiRest.post('/Notifs/delete/notifications/' , null, listNotifs,
      function(response) {
        listNotifs.forEach((notif_id) => {
          delete allArchivedNotifications.notifs[notif_id]
        })
        return successCallback(response)
      }, 
      function(error) {
        console.log(error)
        return {}
      })
    }

    service.deleteNotificationOnServer = function (notif_id, successCallback) {
      ApiRest.delete('/Notifs/' + notif_id + '/', null, 
      function(response) {
        delete allArchivedNotifications.notifs[notif_id]
        return successCallback(response)
      }, 
      function(error) {
        console.log(error)
        return {}
      })
    }

    service.updateLocalNotifications = function (from, to, notif_id) {
      if (from == 'main' && to == 'archived') {
        if (allArchivedNotifications) {
          allArchivedNotifications.notifs[notif_id] = allNotifications.notifs[notif_id]
        }
        delete allNotifications.notifs[notif_id]
      }
      if (from == 'main' && to == 'postponed') {
        if (allPostPonedNotifications) {
          allPostPonedNotifications.notifs[notif_id] = allNotifications.notifs[notif_id]
        }
        delete allNotifications.notifs[notif_id]
      }
      if (from == 'archived' && to == 'main') {
        allNotifications.notifs[notif_id] = allArchivedNotifications.notifs[notif_id]
        delete allArchivedNotifications.notifs[notif_id]
      }
      if (from == 'postponed' && to == 'main') {
        allNotifications.notifs[notif_id] = allPostPonedNotifications.notifs[notif_id]
        delete allPostPonedNotifications.notifs[notif_id]
      }
      if (from == 'postponed' && to == 'archived') {
        if (allArchivedNotifications) {
          allArchivedNotifications.notifs[notif_id] = allNotifications.notifs[notif_id]
        }
        delete allPostPonedNotifications.notifs[notif_id]
      }
      if (from == 'archived' && to == 'postponed') {
        if (allPostPonedNotifications) {
          allPostPonedNotifications.notifs[notif_id] = allArchivedNotifications.notifs[notif_id]
        }
        
        delete allArchivedNotifications.notifs[notif_id]
      }
      delete $rootScope.allRequestsNotifs[notif_id]
    }    

    return service
  }
]);
