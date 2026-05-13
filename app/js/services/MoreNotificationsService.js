'use strict';

/**
 * A noter que c'est aussi une gestion des historiques d'actions 
 * Service concernant les notifications, NotificationService est pris d'où le  nom de MoreNotificationsService
 * remplacera à terme bonsServices.factory('notificationService', ['$resource', qui se trouve dans app/js/services.js
*/
Lantern.factory('MoreNotificationsService', ['$http','$q', 'ApiRest', 'Session', 'User', '$location', '$rootScope', 
  '$state','NotificationService', 'UsersService', 'NotificationsService', 'ClientService',
  'ValueListService', 'WorkflowHelperService', '$interval','Valuelist',
  function($http, $q, ApiRest, Session, User, $location, $rootScope, 
    state, NotificationService, UsersService, NotificationsService, ClientService, 
    ValueListService, WorkflowHelperService, $interval, Valuelist) {
    const service = {}

    const getValues = function () {
      ClientService.getClients({}, function() {
        // $rootScope.clientsLight
      }, ClientService.manageClientError)
      ValueListService.getLanguages(ValueListService.manageReceivedLanguages(
        function () {}
      ), function () {})
      ValueListService.getNormesMix(ValueListService.manageReceivedNormesMix(
        function () {}
      ), function () {})
      ValueListService.getResolutions(ValueListService.manageReceivedResolutions(
        function () {}
      ), function () {})
      if (!$rootScope.subproject_natures) {
        $rootScope.subproject_natures = Valuelist.query({tableName: 'subproject_nature'})
      }
      ValueListService.getPlanningTypes()

    }
    $rootScope.notifs = null
    $rootScope.badge = {
      main: 0,
      archived: 0,
      postponed: 0
    }

    $rootScope.layoutMainDivHeight = 82

    $rootScope.notificationsArrival = false
    $rootScope.notificationsArrivalNumber = 0
    $rootScope.showLoadMoreNotif = true
    $rootScope.pageNotifications = 0

    $rootScope.pageMainNotifications = 0
    $rootScope.pageArchivedNotifications = 0
    $rootScope.pagePostponedNotifications = 0

    $rootScope.nbNotifsByPage = 50
    $rootScope.nbNotifsByPageMain = 50
    $rootScope.nbNotifsByPagePostPoned = 80
    $rootScope.nbNotifsByPageArchived = 100

    $rootScope.slicedNotifications = {}
    $rootScope.currentPageNumber = 1
    $rootScope.goToPreviousPage = false
    
    $rootScope.showMainNotifsValue = 1
    $rootScope.showArchivedNotifsValue = 0
    $rootScope.showPostponedNotifsValue = 0

    $rootScope.isShowNotifsFilter = false
    $rootScope.notifFilterText = ""
    $rootScope.notifIsLoading = false
    $rootScope.planningsFound = []

    $rootScope.notificationsTypesArray = []

    service.showNotifsFilter = function () {
      $rootScope.isShowNotifsFilter = !$rootScope.isShowNotifsFilter
    }

    service.archiveNotification = function (notif)  {
      
      ApiRest.put('/Notifs/' + notif.id, {}, {
        archived: "1",
        postponed: "0",
        date_archive: moment().format("YYYY-MM-DD HH:mm:ss")
      }, function (response) {
        if ($rootScope.showPostponedNotifsValue == 1) {
          NotificationsService.updateLocalNotifications('postponed', 'archived', notif.id)
        } else {
          NotificationsService.updateLocalNotifications('main', 'archived', notif.id)
        }
        $rootScope.badge.archived += 1
        $rootScope.badge.main -= 1
        let params = {
          user_id: response.user_id,
          notif_id :response.id,
          service :Session.role()
        }
        // archive the collaboration Notifs  
        $rootScope.goToPreviousPage = true
        $rootScope.archiveCollaborationNotification(params) 
        $rootScope.notifs = []
        service.loadNotifications()

      })
    }

    service.postponeNotification  = function (notif)  {
      ApiRest.put('/Notifs/' + notif.id, {}, {
        archived: "0",
        postponed: "1",
        date_archive: null
      }, function () {
        if ($rootScope.showArchivedNotifsValue) {
          NotificationsService.updateLocalNotifications('archived', 'postponed', notif.id)
        } else {
          NotificationsService.updateLocalNotifications('main', 'postponed', notif.id)
        }
        
        $rootScope.badge.postponed++
        $rootScope.badge.main--
        $rootScope.goToPreviousPage = true
        $rootScope.notifs = []
        service.loadNotifications()
      })
      
    }

    // remet une notif dans le main
    service.unPostponeOrUnarchiveNotification = function (notif) {
      ApiRest.put('/Notifs/' + notif.id, {}, {
        archived: "0",
        postponed: "0",
        date_archive: null
      }, function (response) {
        if (notif.archived == 1) {
          NotificationsService.updateLocalNotifications('archived', 'main', notif.id)
          $rootScope.badge.main++
          $rootScope.badge.archived--
        }
        if (notif.postponed == 1) {
          NotificationsService.updateLocalNotifications('postponed', 'main', notif.id)
          $rootScope.badge.main++
          $rootScope.badge.postponed--
        }
        $rootScope.notifs = []
        service.loadNotifications()
          let params = {
            user_id: response.user_id,
            notif_id :response.id,
            service :Session.role(),
            action :'unarchive',
          }
          $rootScope.archiveCollaborationNotification(params) // unarchive the collaboration Notifs
      })
    }

    $rootScope.checKNotifPid = null
    service.checkNewNotification = function () {
      if ($rootScope.checKNotifPid) {
        return
      }
      $rootScope.checKNotifPid = $interval(function () {
        service.loadLatestNotification()
        }, 15000) // 15 seconds
    }

    // load last notifs
    service.loadLatestNotification = function () {
      if ($rootScope.user_entity == undefined) return false
      NotificationsService.getLatestNotifications(
        NotificationsService.manageLatestNotificationsReceived((newNotifications, latestFarmers) => {
          Object.keys(newNotifications).forEach((notif_id) => {
            $rootScope.notificationsArrival = true
            $rootScope.notificationsArrivalNumber++ 
            newNotifications[notif_id].product_id = $rootScope.allRequestsNotifs[newNotifications[notif_id].request_id].product_id
            newNotifications[notif_id].request = $rootScope.allRequestsNotifs[newNotifications[notif_id].request_id]
            newNotifications[notif_id].request.ownFarmers = {}
            newNotifications[notif_id].request.farmers.forEach((farmer_id) => {
              newNotifications[notif_id].request.ownFarmers[farmer_id] = $rootScope.allFarmerbookingsNotifs[farmer_id]
            })
            newNotifications[notif_id].origin_user = $rootScope.allUsersNotifs[newNotifications[notif_id].origin_user_id]
            newNotifications[notif_id].request.projectName = $rootScope.allProjectsNotifs[newNotifications[notif_id].request.project]
            newNotifications[notif_id].request.subproject_detail = $rootScope.allSubprojectsNotifs[newNotifications[notif_id].request.subproject]
            newNotifications[notif_id].request.subproject_nature = subprojectNatureById[newNotifications[notif_id].request.subproject_detail.nature_id]
            newNotifications[notif_id].date_creation_moment = moment(newNotifications[notif_id].date_creation);
            newNotifications[notif_id].request.workflow = WorkflowHelperService.describeBarWorkflowByIds($rootScope.allWorkflowsNotifs[newNotifications[notif_id].request.workflow_id])
            newNotifications[notif_id].client = $rootScope.clientsLight[$rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[newNotifications[notif_id].request_id].project].client_id]
            $rootScope.AllNotifications.unshift(newNotifications[notif_id])

          })
          $rootScope.$broadcast('sync-update-date-wish-reviewed', latestFarmers);
        }), function () {})
      

    }

    $rootScope.changeDisplayNumber = function (changeNumber) {
      if ($rootScope.notifIsLoading) {
        return
      }
      if (changeNumber == 0) {
        $rootScope.nbNotifsByPageMain = 50
        $rootScope.nbNotifsByPagePostPoned = 80
        $rootScope.nbNotifsByPageArchived = 100
      } else {
        if ($rootScope.showArchivedNotifsValue == 1) {
          $rootScope.nbNotifsByPageArchived += changeNumber
        }
        if ($rootScope.showPostponedNotifsValue == 1) {
          $rootScope.nbNotifsByPagePostPoned += changeNumber
        }
        if ($rootScope.showMainNotifsValue == 1) {
          $rootScope.nbNotifsByPageMain += changeNumber
        }
      }
      service.loadNotifications()
    }

    $rootScope.reloadNotifications = function () {
      // stop interval, it will be relaod at the end of loadNotifications
      $interval.cancel($rootScope.checKNotifPid)
      $rootScope.notifs = []
      // laod from server
      service.loadNotifications(1)
    }
    $rootScope.seeNewNotifications = function () {
      $rootScope.notificationsArrival = false
      $rootScope.notificationsArrivalNumber = 0
      $rootScope.rangeDateNotif = {}
      $rootScope.notifFilterText = ""
      $rootScope.notifIsLoading = false
      $rootScope.notifs = []
      // laod from server
      service.loadNotifications()
    }

    $rootScope.currentPlanning = null
    $rootScope.planningToFilter = null
    $rootScope.filterByPlanning = function (planning) {
      // $rootScope.notifFilterText = ""
      // $rootScope.rangeDateNotif = {}
      if (!planning) {
        $rootScope.planningToFilter =  null
      } else if (planning.id == 0) {
        $rootScope.planningToFilter =  null
      } else {
        $rootScope.planningToFilter = planning.id
      }
      $rootScope.notifs = []
      // laod from server
      service.loadNotifications()
    }

    $rootScope.currentTypeNotification =  null
    $rootScope.filterTypePlanning = null
    $rootScope.filterByTypeNotifications = function (typeNotification) {
      // $rootScope.notifFilterText = ""
      // $rootScope.rangeDateNotif = {}
      if (typeNotification == 'All') {
        $rootScope.filterTypePlanning = null
      } else {
        $rootScope.filterTypePlanning = typeNotification
      }
      $rootScope.notifs = []
      // laod from server
      service.loadNotifications()
    }

    // load notifs when open the notifs or change data to get (archived, postponed or all)
    // mais si déjà chargé, ne recharge pas tout
    // par contre lance la recherche de différence
    $rootScope.AllNotifications = null
    let subprojectNatureById = null
    service.loadNotifications = function (fromServer) {
      if ($rootScope.user_entity == undefined) return false
      getValues()
      if (!subprojectNatureById) {
        subprojectNatureById = {}
        $rootScope.subproject_natures.forEach((entry) => {
          subprojectNatureById[entry.id] = entry[$rootScope.getLang()]
        })
      }
      $rootScope.notifs = []
      $rootScope.notifIsLoading = true
      const parameters = {
        user_id: Session.userId(),
        type: 'standard',
        show_created_request: $rootScope.showCreatedRequest,
        archived: $rootScope.showArchivedNotifsValue,
        postponed: $rootScope.showPostponedNotifsValue
      }

      $rootScope.slicedNotifications = {}
      // list of requests where farmer has date start and end
      const farmerInDateRangeFoundRequestList = {}
      let searchedByDates = false
      NotificationsService.getAllNotifications(fromServer, parameters, 
        NotificationsService.manageReceivedData(function (response) {
          // $rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[notifsList[notif_id].request_id]]
          // filter by branch for multi branches users

          let notifsList = JSON.parse(JSON.stringify(response.notifs))
          const byBranch = {}
          Object.keys(notifsList).forEach((notif_id) => {
            if (notifsList[notif_id].request_id && $rootScope.allRequestsNotifs[notifsList[notif_id].request_id] && $rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[notifsList[notif_id].request_id].project].branch_id == Session.branchId()) {
              byBranch[notif_id] = notifsList[notif_id]
            }
          })
          notifsList = byBranch
          $rootScope.AllNotifications = []
          let allNotifs = {}
          
          if ($rootScope.planningToFilter) {
            const filter = {}
            Object.keys(notifsList).forEach((notif_id) => {
              if (notifsList[notif_id].planning_id == $rootScope.planningToFilter) {
                filter[notif_id] = notifsList[notif_id]
              }
            })
            notifsList = filter
          }
          if ($rootScope.filterTypePlanning) {
            const filter = {}
            Object.keys(notifsList).forEach((notif_id) => {
              if (notifsList[notif_id].category == $rootScope.filterTypePlanning) {
                filter[notif_id] = notifsList[notif_id]
              }
            })
            notifsList = filter
          }
          
          // manage range of date, reduce the array to the date asked
          if ($rootScope.rangeDateNotif.dateStart && $rootScope.rangeDateNotif.dateStart != "" && $rootScope.rangeDateNotif.dateEnd && $rootScope.rangeDateNotif.dateEnd != "") {
            searchedByDates = true
            // recherche dans les farmers
            let chunks = $rootScope.rangeDateNotif.dateStart.split('-')
            const startTimeSearched = new Date(chunks[2]+'-'+chunks[1]+'-'+chunks[0]).getTime()
            let chunks2 = $rootScope.rangeDateNotif.dateEnd.split('-')
            let endTimeSearched = new Date(chunks2[2]+'-'+chunks2[1]+'-'+chunks2[0]).getTime()
            if (startTimeSearched == endTimeSearched) {
              endTimeSearched += (86400 * 1000)
            }
            Object.keys($rootScope.allFarmerbookingsNotifs).forEach((farmer_id) => {
              if ($rootScope.allFarmerbookingsNotifs[farmer_id].is_wish != 0) {
                const startDayTime = $rootScope.allFarmerbookingsNotifs[farmer_id].day.replace('00:00:00', '12:00:00')
                const dayFound = new Date(startDayTime).getTime()
                if (dayFound >= startTimeSearched && dayFound <= endTimeSearched) {
                  farmerInDateRangeFoundRequestList[$rootScope.allFarmerbookingsNotifs[farmer_id].request_id] = true
                }
              }
            })
            Object.keys(notifsList).forEach((notif_id) => {
              if (farmerInDateRangeFoundRequestList[notifsList[notif_id].request_id]) {
                allNotifs[notif_id] = notifsList[notif_id]
              }
            })
          } else if ($rootScope.notifFilterText != "") {
            Object.keys(notifsList).forEach((notif_id) => {
              notifsList[notif_id].origin_user = $rootScope.allUsersNotifs[notifsList[notif_id].origin_user_id]
              notifsList[notif_id].client = $rootScope.clientsLight[$rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[notifsList[notif_id].request_id].project].client_id]
            } )
            allNotifs = service.filterTextInNotifs(notifsList, $rootScope.notifFilterText)
          
          } else {
            // no range, all dates
            allNotifs = notifsList
          }
          // then other filters
          if ($rootScope.importantNotifsFirst) {
            Object.keys(allNotifs).forEach((notif_id) => {
              if (allNotifs[notif_id].important) {
                $rootScope.AllNotifications.push(allNotifs[notif_id])
                delete allNotifs[notif_id]
              }
            })
          }

          // which remains
          Object.keys(allNotifs).forEach((notif_id) => {
              if ($rootScope.showCreatedRequest) {
                $rootScope.AllNotifications.push(allNotifs[notif_id])
              } else {
                if (allNotifs[notif_id].category != 'creation') {
                  $rootScope.AllNotifications.push(allNotifs[notif_id])
                }
              }
          })

          if (parameters.archived == 1) {
            $rootScope.badge.archived = $rootScope.AllNotifications.length
            $rootScope.nbNotifsByPage = $rootScope.nbNotifsByPageArchived
          } else if (parameters.postponed == 1) {
            $rootScope.badge.postponed = $rootScope.AllNotifications.length
            $rootScope.nbNotifsByPage = $rootScope.nbNotifsByPagePostPoned
          } else {
            $rootScope.badge.main = $rootScope.AllNotifications.length
            $rootScope.nbNotifsByPage = $rootScope.nbNotifsByPageMain
          }

          $rootScope.AllNotifications = $rootScope.AllNotifications.sort(function(a,b){return new Date(b.date_creation) - new Date(a.date_creation)})
          if ($rootScope.AllNotifications.length == 0) {
            $rootScope.layoutMainDivHeight = 82
            $rootScope.notifs = []
          } else {
            // slice array
            let index = 0
            for (let i = 0; i < $rootScope.AllNotifications.length; i += $rootScope.nbNotifsByPage) {
              index++
              const chunk = $rootScope.AllNotifications.slice(i, i + $rootScope.nbNotifsByPage);
              if (!$rootScope.slicedNotifications[index]) {
                $rootScope.slicedNotifications[index] = chunk
              }
            }
            if ($rootScope.goToPreviousPage) {
              $rootScope.goToPreviousPage = false
              if ($rootScope.slicedNotifications[$rootScope.currentPageNumber]) {
                $rootScope.notifs = $rootScope.slicedNotifications[$rootScope.currentPageNumber]
                $rootScope.currentPageNumber = $rootScope.currentPageNumber
              } else if ($rootScope.slicedNotifications[$rootScope.currentPageNumber - 1]) {
                $rootScope.notifs = $rootScope.slicedNotifications[$rootScope.currentPageNumber - 1]
                $rootScope.currentPageNumber = $rootScope.currentPageNumber - 1
              } else {
                $rootScope.notifs = $rootScope.slicedNotifications[1]
                $rootScope.currentPageNumber = 1
              }

            } else {
              $rootScope.notifs = $rootScope.slicedNotifications[1]
              $rootScope.currentPageNumber = 1
            }

            if (Object.keys($rootScope.slicedNotifications).length < 10) {
              $rootScope.layoutMainDivHeight = 82
            } else {
              $rootScope.layoutMainDivHeight = 72
            }
            
            
            $rootScope.notifs.forEach((notif) => {
              notif.origin_user = $rootScope.allUsersNotifs[notif.origin_user_id]
              notif.product_id = $rootScope.allRequestsNotifs[notif.request_id].product_id
              notif.request = $rootScope.allRequestsNotifs[notif.request_id]
              notif.request.ownFarmers = {}
              notif.request.farmers.forEach((farmer_id) => {
                notif.request.ownFarmers[farmer_id] = $rootScope.allFarmerbookingsNotifs[farmer_id]
              })
              notif.request.projectName = $rootScope.allProjectsNotifs[notif.request.project]
              notif.request.subproject_detail = $rootScope.allSubprojectsNotifs[notif.request.subproject]
              notif.request.subproject_nature = subprojectNatureById[notif.request.subproject_detail.nature_id]
              notif.date_creation_moment = moment(notif.date_creation);
              notif.request.workflow = WorkflowHelperService.describeBarWorkflowByIds($rootScope.allWorkflowsNotifs[notif.request.workflow_id])
              notif.client = $rootScope.clientsLight[$rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[notif.request_id].project].client_id]
            })
          }

          $rootScope.notifIsLoading = false
          service.checkNewNotification()
        }), 
        function () {}
        )
    }

    $rootScope.displayNotificationPage = function (pageNumber) {
      $rootScope.currentPageNumber = pageNumber
      $rootScope.notifs = []
      $rootScope.notifs = $rootScope.slicedNotifications[pageNumber]
      $rootScope.notifs.forEach((notif) => {
        notif.origin_user = $rootScope.allUsersNotifs[notif.origin_user_id]
        notif.product_id = $rootScope.allRequestsNotifs[notif.request_id].product_id
        notif.request = $rootScope.allRequestsNotifs[notif.request_id]
        notif.request.ownFarmers = {}
        notif.request.farmers.forEach((farmer_id) => {
          notif.request.ownFarmers[farmer_id] = $rootScope.allFarmerbookingsNotifs[farmer_id]
        })
        notif.request.projectName = $rootScope.allProjectsNotifs[notif.request.project]
        notif.request.subproject_detail = $rootScope.allSubprojectsNotifs[notif.request.subproject]
        notif.request.subproject_nature = subprojectNatureById[notif.request.subproject_detail.nature_id]
        notif.date_creation_moment = moment(notif.date_creation);
        notif.request.workflow = WorkflowHelperService.describeBarWorkflowByIds($rootScope.allWorkflowsNotifs[notif.request.workflow_id])
        notif.client = $rootScope.clientsLight[$rootScope.allProjectsNotifs[$rootScope.allRequestsNotifs[notif.request_id].project].client_id]
      })
    }

    // deprecated
    service.loadMoreNotif = function (user) {
      if ($rootScope.user_entity == undefined) return false
      $rootScope.notifIsLoading = true

      if ($rootScope.showArchivedNotifsValue == '1') {
        $rootScope.importantNotifsFirst = false
      } else if ($rootScope.user_entity.important_notifs_first != null) {
        if ($rootScope.user_entity.important_notifs_first == '1') {
          $rootScope.importantNotifsFirst = true
        } else {
          $rootScope.importantNotifsFirst = false
        }
      } else {
        $rootScope.importantNotifsFirst = true
      }

      let filters = [{
        "name": "user_id",
        "value": Session.userId()
      },
      {
        "name": "range_dates_request",
        "value": JSON.stringify($rootScope.rangeDateNotif)
      },
      {
        "name": "show_created_request",
        "value": $rootScope.showCreatedRequest
      }, {
        "name": "type",
        "value": "'standard'"
      }, {
        "name": "archived",
        "value": $rootScope.showArchivedNotifsValue
      }, {
        "name": "postponed",
        "value": $rootScope.showPostponedNotifsValue
      }, {
        "name": "urgent_first",
        "value": $rootScope.importantNotifsFirst
      }]

      NotificationService.getNotifsBy({
        filters: [filters],
        'page': $rootScope.pageNotifications
      }, function (notifs) {
        notifs.forEach(function (notif) {
          let found = false
          $rootScope.notifs.forEach(function (currentNotif) {
            if (currentNotif.id == notif.id) {
              found = true
              return
            }
          });
          if (!found) {
            notif.date_creation_moment = moment(notif.date_creation);

            if (user != null && notif.date_creation >= moment(user.last_notification_consult).format("YYYY-MM-DD HH:mm:ss")) {
              notif.new_notification = true
            }
            if ( (notif.requests != null && notif.requests[0].id !== 0) || (notif.request != null && notif.request.id !== 0) ) {
              $rootScope.notifs.push(notif)
            }

          }
        })

        if (notifs.length < 20) {
          $rootScope.showLoadMoreNotif = false
        }
        $rootScope.notifIsLoading = false
        $rootScope.pageNotifications += 1
      })
    }

    $rootScope.setImportantNotifsFirst = function(value) {
      // reorder notifs by importance
      $rootScope.importantNotifsFirst = value
      $rootScope.user_entity.important_notifs_first = value
      UsersService.updateParameter({ important_notifs_first:  value }, function resolved(response) {}, function rejected() {})
      $rootScope.notifs = []
      service.loadNotifications()
    }

    $rootScope.setShowNotifsCreatedRequest = function(value) {
      // reorder notifs with create request first
      $rootScope.showCreatedRequest = value
      $rootScope.user_entity.show_created_request = value
      UsersService.updateParameter({ showCreatedRequest:  value }, function resolved(response) {}, function rejected() {})
      $rootScope.notifs = []
      service.loadNotifications()
    }

    service.filterTextInNotifs = function (notifs, textFilter) {
      const foundNotifs = {}
      textFilter = textFilter.toLowerCase().sansAccent();
      Object.keys(notifs).filter(function (notif_id) {
        let notif = notifs[notif_id]
        let found = false;
        if (notif.origin_user && notif.origin_user.firstname != null && notif.origin_user.firstname.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
          found = true;
        }

        if (notif.origin_user && notif.origin_user.lastname != null && notif.origin_user.lastname.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
          found = true;
        }

        if (notif.product_desc != null && notif.product_desc.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
          found = true;
        }

        if (notif.etape_action != null && notif.etape_action.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
          found = true;
        }
        if (notif.client && notif.client.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
            found = true;
        }
        
        if (found) {
          foundNotifs[notif_id] = notif
        }
      })
      return foundNotifs
    }

    // filter by text
    $rootScope.setNotifFilterText = function(notifFilterText) {
      $rootScope.rangeDateNotif = {}
      $rootScope.notifFilterText = notifFilterText
      $rootScope.notifs = []
      service.loadNotifications()
    }

    $rootScope.changeRequestIdNotif = function (notif) {
      let request_id = -1;
      if (notif.request != null) request_id = notif.request.id
      else if (notif.requests != null) request_id = notif.requests[0].id
      else console.error("field request seems to be null.")
      $rootScope.id_request_notif = request_id
    }

    $rootScope.rangeDateNotif = {}
    $rootScope.$watchCollection('rangeDateNotif', function() {
      // watch when there is update in html page
      if ($rootScope.user_entity == undefined) return false
      $rootScope.notifFilterText = ""
      getValues()
      $rootScope.notifs = []
      if ($rootScope.rangeDateNotif.dateStart && $rootScope.rangeDateNotif.dateStart != "" && $rootScope.rangeDateNotif.dateEnd && $rootScope.rangeDateNotif.dateEnd != "") {
        service.loadNotifications()
      } else {
        if ($rootScope.rangeDateNotif.dateStart == "" && $rootScope.rangeDateNotif.dateEnd == "") {
          service.loadNotifications()
        }
        // 
      }
      
    })

    // first access to notification on the left
    $rootScope.clearNotif = function (resetBadge) {
      if (resetBadge == null) resetBadge = true

      $rootScope.newNotifReceived = false
      if (Session.userId() != null && ($rootScope.showNotifSidebar || $rootScope.isMobile())) {
        $rootScope.notifs = []
        service.loadNotifications()
        if (resetBadge) {
          UsersService.updateParameter({ last_notification_consult: moment().format("YYYY-MM-DD HH:mm:ss") }, function resolved(response) {}, function rejected() {})
          if ($rootScope.AllNotifications) {
            $rootScope.badge.main = $rootScope.AllNotifications.length
          }
          titlenotifier.reset()
        }
      }
    }    

    $rootScope.canBeDeleted = function (notif, date_creation) {
      if (new Date(date_creation).getTime() + 86400 * 30 * 1000 > new Date().getTime()) {
        return false
      }
      return true
    }

    // remove a notif on the server side
    $rootScope.deleteNotification = function (notif, index) {
      delete $rootScope.allRequestsNotifs[notif.id]
      NotificationsService.removeFromArchivedNotifications(notif.id)
      $rootScope.notifs.splice(index, 1)
      $rootScope.badge.archived--
      
      NotificationsService.deleteNotificationOnServer(notif.id, 
        function (response) {
          // ne réaffiche rien
      })

    }

    

    $rootScope.deleteAllNotifications = function () {
      const listNotifToDelete = []
      $rootScope.notifs.forEach((notif) => {
        listNotifToDelete.push(notif.id)
        $rootScope.badge.archived--
      })
      NotificationsService.deleteSeveralNotifications(listNotifToDelete, 
        function (response) {
          $rootScope.notifs = []
          $rootScope.goToPreviousPage = true
          service.loadNotifications()
      })
    }    


    // dans la barre latérale gauche des notifs, en dessous de l'entonnoir (pas très visible si pas habitué)
    // uniquement les notifs main
    $rootScope.archiveAllNotifications = function () {
      if ($rootScope.showArchivedNotifsValue != 0 || $rootScope.showPostponedNotifsValue != 0) {
        console.log('pas possible')
        return
      }
      $rootScope.goToPreviousPage = false
      const nbArchived = $rootScope.notifs.length
      const params = {
        service: Session.role(),
        notifsList: []
      }
      $rootScope.notifs.forEach((notif) => {
        params.notifsList.push({
          id: notif.id,
          archived: 1,
          postponed: 0,
          date_archive: moment().format("YYYY-MM-DD HH:mm:ss")
        })
      })
      NotificationsService.updateNotifications(params, function () {
        params.notifsList.forEach((notif) => {
          NotificationsService.updateLocalNotifications('main', 'archived', notif.id)
        })
        $rootScope.goToPreviousPage = true
        $rootScope.badge.archived += nbArchived
        $rootScope.badge.main -= nbArchived
        $rootScope.notifs = []
        service.loadNotifications()
      })
    }



    $rootScope.archiveCollaborationNotification = function (params) {
      if($rootScope.list_services_notif.indexOf(params.service) == -1){
        return false
      }
      ApiRest.post('/Notifs/collaborationNotif', {}, params, function (response) {},function(error) {
          console.error(error)
      })
    }

    // reload notifs
    $rootScope.reloadMainNotif = function() {
      $rootScope.showMainNotifsValue = 1
      $rootScope.showArchivedNotifsValue = 0
      $rootScope.showPostponedNotifsValue = 0
      $rootScope.notifs = []
      // recharge les notifs
      service.loadNotifications()
      if ($rootScope.badge.main > 0) {
        $rootScope.newNotifReceived = false
        UsersService.updateParameter({ last_notification_consult: moment().format("YYYY-MM-DD HH:mm:ss") }, function resolved(response) {}, function rejected() {})
        $rootScope.badge.main = $rootScope.AllNotifications.length
        titlenotifier.reset()
      }

    }

    $rootScope.loadArchivedNotif = function() {
      $rootScope.showMainNotifsValue = 0
      $rootScope.showArchivedNotifsValue = 1
      $rootScope.showPostponedNotifsValue = 0
      $rootScope.pageNotifications = 0
      $rootScope.notifs = []
      service.loadNotifications()
    }


    $rootScope.loadPostponedNotif = function() {
      $rootScope.showMainNotifsValue = 0
      $rootScope.showArchivedNotifsValue = 0
      $rootScope.showPostponedNotifsValue = 1
      $rootScope.pageNotifications = 0
      $rootScope.notifs = []
      service.loadNotifications()
    }

    // called from app.js
    $rootScope.countPostponedNotifs = function() {
        if ($location.path() === '/login') return
        if (DISABLE_NOTIFICATIONS) return
        let filters = [{
        "name": "user_id",
        "value": Session.userId()
      }, {
        "name": "type",
        "value": "'standard'"
      }, {
        "name": "archived",
        "value": "0"
      }, {
        "name": "postponed",
        "value": "1"
      }]

      ApiRest.get('/Notifs/count', {
        filters: [filters]
      }, function (data) {
        $rootScope.badge.postponed = data.response
      }, null, true)
    }

    $rootScope.archiveNotification = service.archiveNotification

    $rootScope.postponeNotification = service.postponeNotification

    $rootScope.unPostponeOrUnarchiveNotification = service.unPostponeOrUnarchiveNotification

    $rootScope.showNotifsFilter = service.showNotifsFilter

    return service
  }
])
