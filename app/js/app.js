'use strict';

/* App Module */
//var URL_API = "http://10.0.1.28/restler/public/central-api";

//URL vers le serveur WebSocket (serveur Node.JS dédié)
//var IP_SOCKET = "http://10.0.1.28:8080/";

//Variable pour les forms dynamiques
//var dynamicForm = [];

var Lantern = angular.module('Lantern', [
  'ngRoute',
  'bonsServices',
  'ngDialog',
  'ngAnimate',
  'ngCookies',
  'xeditable',
  'smart-table',
  'textAngular',
  'pageslide-directive',
  'ngSanitize',
  'ui.select',
  'angularFileUpload',
  'gm.datepickerMultiSelect',
  'ui.bootstrap',
  'ui.bootstrap.datetimepicker',
  'ngTable',
  'ngVis',
  'nvd3',
  'chart.js',
  'frapontillo.gage',
  'dndLists',
  'angular-clipboard',
  'angularMoment',
  'angulartics',
  'ngToast',
  'angular-inview',
  'angularCancelOnNavigateModule',
  'angular-loading-bar',
  'cfp.loadingBar',
  'ui.router',
  'ui-notification',
  'ngDraggable',
  'ngDialog',
  'ngDesktopNotification',
  "angularjs-dropdown-multiselect"
]);

Lantern.constant('API_CONFIG', {
  base: URL_API,
  base2: 'http://10.0.1.28:1337',
  io: IP_SOCKET
});

Lantern.constant('USER_ROLES', {
  all: 'all',
  guest: 'guest',
  planning: 'planning',
  technicien: 'technicien',
  compta: 'compta',
  digitalmedia: 'digitalmedia',
  qc: 'qc',
  prepa: 'prepa',
  production: 'production',
  service: 'service',
  security: 'security',
  commercial: 'commercial'
});

Lantern.constant('EVENTS', {
  loginSucceeded: 'loginSucceeded',
  logoutSucceeded: 'logoutSucceeded',
  notAuthenticated: 'notAuthenticated',
  notAuthorized: 'notAuthorized',
  loadingProgress : 'loadingProgress',
  loadingDone : 'loadingDone'
});

Lantern.constant('uiDatetimePickerConfig', {
    dateFormat: 'yyyy-MM-dd HH:mm',
    defaultTime: '00:00:00',
    html5Types: {
        date: 'yyyy-MM-dd',
        'datetime-local': 'yyyy-MM-ddTHH:mm:ss.sss',
        'month': 'yyyy-MM'
    },
    initialPicker: 'date',
    reOpenDefault: false,
    enableDate: true,
    enableTime: false,
    buttonBar: {
        show: true,
        now: {
            show: false,
            text: 'Maintenant',
            cls: 'btn-sm btn-default'
        },
        today: {
            show: true,
            text: 'Aujourd\'hui',
            cls: 'btn-sm btn-default'
        },
        clear: {
            show: false,
            text: 'Nettoyer',
            cls: 'btn-sm btn-default'
        },
        date: {
            show: false,
            text: 'Date',
            cls: 'btn-sm btn-default'
        },
        time: {
            show: false,
            text: 'Temps',
            cls: 'btn-sm btn-default'
        },
        close: {
            show: false,
            text: 'Fermer',
            cls: 'btn-sm btn-default'
        },
        cancel: {
            show: false,
            text: 'Annuler',
            cls: 'btn-sm btn-default'
        }
    },
    closeOnDateSelection: true,
    closeOnTimeNow: true,
    appendToBody: false,
    altInputFormats: [],
    ngModelOptions: {},
    saveAs: false,
    readAs: false
});

Lantern.config(function (NotificationProvider) {
  NotificationProvider.setOptions({
    delay: 5000,
    startTop: 60,
    startRight: 10,
    verticalSpacing: 20,
    horizontalSpacing: 20,
    positionX: 'right',
    positionY: 'top'
  });
});

Lantern.run(['$rootScope', '$window', '$compile', '$state', '$cookies', '$sce', '$location', '$timeout', '$http', 'NotificationService', 
  'MoreNotificationsService', 'ngDialog', 'User', 'Request', '$analytics', 'ngToast', 'Session', 'EVENTS', 'AuthService', 'Notification', 
  'ApiRest', '$interval', 'cfpLoadingBar', 'desktopNotification', 'SuiviProdService', 'TableauSuivi', '$stateParams', '$localstorage', 
  'RoomService', 'PersonsService', 'ValueListService', 'ClientService', 'Valuelist',
  function ($rootScope, $window, $compile, $state, $cookies, $sce, $location, $timeout, $http, 
    NotificationService, MoreNotificationsService ,ngDialog, User, Request, $analytics, ngToast, Session, EVENTS, AuthService, Notification, 
    ApiRest, $interval, cfpLoadingBar, desktopNotification, SuiviProdService, TableauSuivi, $stateParams, $localstorage,
    RoomService, PersonsService, ValueListService, ClientService, Valuelist) {
    $rootScope.debug_notif = DEBUG_NOTIF;
    $rootScope.list_services_notif = LIST_SERVICES_NOTIF;
    $rootScope.size_dropdown_list = SIZE_DROPDOWN_LIST;
    /** charges de prod  */
    $.removeCookie("branches");
    $rootScope.chargeprod = {};
    if (!$rootScope.subprojects) {
      $rootScope.subprojects = {}
    }

    Session.setBranch();

    function waitForVariableDefined(callback) {
      if ($rootScope.user_entity && $rootScope.user_entity.person) {
        callback();
      } else {
        const unwatch = $rootScope.$watch('user_entity.permissions', function (newVal) {
          if (newVal) {
            unwatch(); // Stop watching once the variable is defined
            callback(newVal);
          }
        })
      }
    }

    function checkUserState () {
      $rootScope.clients = {}
      $rootScope.values = null
      $rootScope.etapes_actions = {}
      $rootScope.actions = {}
      $rootScope.user_main_location = null
      waitForVariableDefined(function () {
        if ($rootScope.user_entity.permissions[0] && $rootScope.user_entity.permissions[0].main_location) {
          $.cookie('locpills', $rootScope.user_entity.permissions[0].main_location, {
            path: '/',
            expires: 1
          });
          $rootScope.user_main_location = $rootScope.user_entity.permissions[0] && $rootScope.user_entity.permissions[0].main_location
        }
        ValueListService.getPlanningTypes()
        PersonsService.getTechnicians(function (result) {
          PersonsService.getContributors(function () {}, PersonsService.manageContributorError)
        }, PersonsService.manageTechniciansError)
        PersonsService.getStageManagers(function (result) {
          // $rootScope.stageManagersById
        }, PersonsService.manageStageManagersError)
        PersonsService.getArtisticDirectors(function(directors) {}, function () {})
        RoomService.getRoomsForABranch(function () {}, RoomService.manageRoomError)
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
          }), {})
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
            Valuelist.query({tableName: 'subproject_nature'}, 
            function (response) {
                response.pop()
                $rootScope.subproject_natures = response
            });

          }
          ValueListService.getPresetTimes(function ()  {}, function () {}) 
          Valuelist.getEtapeActionByWorkflow({
            workflow_type_id: 1
          }, function(etapes) {
            ValueListService.initEtapesActions(JSON.parse(JSON.stringify(etapes)))
          })
          ValueListService.getFormatMixFromDatabase(ValueListService.gotFormatMixFromDatabase,function () {})
      });
    }

    checkUserState()






    // related to Phelix module 
    const doublage_type_id_values =  DOUBLAGE_TYPE_ID_VALUES;
    const format_mix_id_values =  FORMAT_MIX_ID_VALUES
    const workflow_type_id_value  =  WORKFLOW_TYPE_ID_VALUE;
    const client_id_values  =  CLIENT_ID_VALUES; // Alula
    const action_type_id_values  = ACTION_TYPE_ID_VALUES; 

    $rootScope.check_valid_workflow_values_phelix = function(requiredWorkflowValues, workflow_type_id, doublage_type_id, format_mix_id, client_id,action_type_id){
        return ((!requiredWorkflowValues.includes(undefined) && !requiredWorkflowValues.includes(null)
                && (workflow_type_id_value == workflow_type_id )
                && (client_id_values.indexOf(parseInt(client_id)) > -1) 
                && (action_type_id_values.indexOf(parseInt(action_type_id)) > -1) 
                && (format_mix_id_values.indexOf(format_mix_id) > -1) 
                && (doublage_type_id_values.indexOf(doublage_type_id) > -1)
                && (doublage_type_id_values.indexOf(doublage_type_id) > -1))? true: false); 
    }

    $rootScope.hasBase = function () {
      if ($rootScope.values) {
        return true
      }
      return false
    }
    $rootScope.getBase = function (done) {
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
            return done()
          })  
        })
      }, null, true)
    }
    $rootScope.recipientsGroup = null

    $rootScope.getMailRecipientsGroup = function (done) {
      if ($rootScope.recipientsGroup) {
        return done()
      } else {
        ApiRest.get('/notifs/mail/groups/', {
        }, function (data) {
          $rootScope.recipientsGroup = []
          data.forEach(function (item) {
            $rootScope.recipientsGroup.push({ name: item.name, value: item.display })
          })
          return done()
        }, null, true) 
      }
    }

    $rootScope.getProductHumanDescription = function (product) {
      name = product.name + ' ' + $rootScope.values.subproject_nature[product.nature_id].val + ' ' + product.description_text
      if ($rootScope.values.subproject_nature[product.nature_id].name == 'serie') {
        name = product.name + ' - '+ $rootScope._T["6vwtywcc"] +'  ' + product.season + ' - ' + 'episode' + ' ' + product.episode_number
      } else if ($rootScope.values.subproject_nature[product.nature_id].name == 'film') {
        name = product.name + ' ' + $rootScope.values.subproject_nature[product.nature_id].val + ' ' + ' ' + $rootScope.values.product_description[product.description_id].val
      }
      return name
    }

    $rootScope.getProjectHumanDescription = function (product) {
      name = product.name + ' ' + $rootScope.values.subproject_nature[product.nature_id].val + ' ' + product.description_text
      if ($rootScope.values.subproject_nature[product.nature_id].name == 'serie') {
        name = product.name + ' - '+ $rootScope._T["6vwtywcc"] +'  ' + product.season
      } else if ($rootScope.values.subproject_nature[product.nature_id].name == 'film') {
        name = product.name + ' ' + $rootScope.values.subproject_nature[product.nature_id].val + ' ' + ' ' + $rootScope.values.product_description[product.description_id].val
      }
      return name
    }

    $rootScope.user_Permission = false;
    $rootScope.checkIsMobile = null;
    $rootScope.login_without = LOGIN_WITHOUT_SALOON;
    $rootScope.showCreatedRequest = true;
    Session.planningRequestRangeDatesStored = {} // see app\requestGroupList\requestGroupListCtrl.js
    let redirect = function (isLogin) {
      if (Session.role() === "planning") {
        $location.path('/records');
      } else if (Session.role() === "technicien") {
        if ($rootScope.isMobile()) {
          $location.path('/recordsPrevisionalTech')
        } else {
          $location.path('/requestsValidated');
        }
      } else if (Session.role() === "compta") {
        $location.path('/compta');
      } else if (Session.role() === "digitalmedia") {
        $rootScope.user_entity && $rootScope.user_entity.permissions ? $location.path('/requestsAutoTech') : $location.path('/');
      } else if (Session.role() === "qc") {
        $rootScope.user_entity && $rootScope.user_entity.permissions ? $location.path('/requestsAutoTech') : $location.path('/');
      } else if (Session.role() === "prepa") {
        $rootScope.user_entity && $rootScope.user_entity.permissions ? $location.path('/requestsAutoTech') : $location.path('/');
      } else if (Session.role() === "security") {
            $location.path('/security');
      } else {
        $location.path('/');
      }
      if (isLogin === true) location.reload();
    };

    $rootScope.$on(EVENTS.loginSucceeded, function (event) {
      $rootScope.initNotification();
      redirect(true);
    });

    $rootScope.$on(EVENTS.logoutSucceeded, function (event) {
      $location.path('/login');
    });

    $rootScope.$on(EVENTS.notAuthenticated, function (event) {
      $location.path('/login');
    });

    $rootScope.$on(EVENTS.notAuthorized, function (event) {
      redirect();
    });

    $rootScope.$on(EVENTS.loadingProgress, function (event) {
      $rootScope.loading = true;
    });

    $rootScope.$on(EVENTS.loadingDone, function (event) {
      $rootScope.loading = false;
    });

    $rootScope.isMobile = function () {
      if ($rootScope.checkIsMobile == null) {
        var check = false;
        (function (a) {
          if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
        })(navigator.userAgent || navigator.vendor || window.opera);

        $rootScope.checkIsMobile = check
      }
      return $rootScope.checkIsMobile;
    };

    $rootScope.role_of_user = Session.role();
    $rootScope.showLoading = 0;

    $rootScope.aprilFoolsDay = moment().month() == 3 && moment().date() == 1; // 1er avril

    $rootScope.konamiEnter = false

    $rootScope.activateKonami = function () {
      $rootScope.konamiEnter = !$rootScope.konamiEnter;
      $rootScope.$apply();
    };

    $rootScope.alertView = false

    $rootScope.openPanelSettings = function () {
      var dialog = ngDialog.open({
        template: 'views/Dialog/SettingsUserDialog.html',
        scope: $rootScope,
        controller: 'SettingsUserDialogCtrl',
        closeByDocument: false
      });

      dialog.closePromise.then(function (data) {
        $state.reload();
      });
    };

    /*
    $rootScope.plannings = []
    if (Session.token()) {
      ApiRest.get('/bookingPlanningtypes/', {}, function(result) {
        if (!result.error) {
          result.forEach(function (type) {
            $rootScope.plannings.push(
              {
                id: type.service,
                name: type.name,
                color: type.color,
                main_location: type.main_location,
                service: type.service,
                branch_id: type.branch_id
              }
            )
          } )
        }
      })
    }
    */

    $rootScope.goToRequestGroup = function (requestId) {
        $state.go($state.current.name, {
            requestId:requestId
        });
    };

    $rootScope.countPostponedNotifs()

    titlenotifier.reset();

    $rootScope.permission = function () {
      return AuthService.checkPermission($rootScope.authorizedRoles, Session.role());
    };

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParam) {
      $rootScope.state = toState;
      $rootScope.params = toParams;
      $rootScope.fromState = fromState;
      $rootScope.showLoading = 0;

      Session.checkReloadSession(function () {
        $rootScope.role_of_user = Session.role();
        Session.reloadAuth().then((entity) => {
          entity.userDetails.$promise.then((result) => {
            $rootScope.user_entity = result;
            $rootScope.showCreatedRequest = (result.show_created_request == 1 ? true : false);
          })
          $rootScope.user_Permission = entity.permissionResult.allowed;
        }).catch(error => {
            console.error('An error occurred:->', error);
          });
      });

      var authorizedRoles = toState.data.authorizedRoles;
      $rootScope.authorizedRoles = authorizedRoles;
      $rootScope.permission(authorizedRoles);

      function checkAccess() {
        if (!AuthService.isAuthorized(authorizedRoles)) {
          //event.preventDefault();
          if (AuthService.isAuthenticated()) {
            $rootScope.$broadcast(EVENTS.notAuthorized);
          } else {
            $rootScope.$broadcast(EVENTS.notAuthenticated);
          }
        }
      };

      if ($rootScope.state.name != 'app.restore') {
        checkAccess();
      }

      if ($rootScope.state.name != 'app.suiviProd') {
        sessionStorage.removeItem('cache_pushfilterWorkflow');
        sessionStorage.removeItem('cache_scope_workflows');
      }
    });

    $rootScope.$on('$stateChangeSuccess', function (event, current, previous) {
      $rootScope.alertBox = null;
      if (current.data != null) {
        $rootScope.title = current.data.title;
        watchNotifSidebar($rootScope);
      }
    });

    $rootScope.$on('createNewDemand', function(event, params) {
      ApiRest.get('/tableausuivicells/columns', {
        tableau_id: params.tableausuivi_id,
        user_id: Session.userId()
      }, function(columns) {
        var found = false;
        columns.forEach(function(column) {
          if (column.workflow_id == params.workflow_id && column.action_id == params.action_id) {
            found = true;
          };
        });

        if (!found) {
          TableauSuivi.get({
            id: params.tableausuivi_id
          }, function(tableau) {
            SuiviProdService.addColumn('action', params, tableau, null, null, function(success) {}, function(error) {});
          });
        };
      }, function(error) {

      });
    });

    $rootScope.initNotification = function (ignoreLoadingBar) {
        if ($location.path() === '/login') return;
        if (DISABLE_NOTIFICATIONS) return;
        if (ignoreLoadingBar == null) ignoreLoadingBar = false;
      if ($.cookie('user_id') != null) {
        var filters = [{
          "name": "user_id",
          "value": Session.userId()
        },{
          "name": "show_created_request",
          "value": $rootScope.showCreatedRequest
        },{
          "name": "type",
          "value": "'standard'"
          }, {
            "name": "last_notification_consult",
            "value": "1"
          }];

        ApiRest.get('/Notifs/count', {
          filters: [filters]
        }, function (data) {
          if (data != null) {
            if (data.unread != null) {
              if (data.unread > $rootScope.badge.count && desktopNotification.isSupported()) {
                var nbNotification = data.unread - $rootScope.badge.count;
                var titleNotification = "Vous avez reçu " + nbNotification + " nouvelle(s) notification(s)"
                var options = {
                  body: "Cliquez pour accéder aux notifications",
                  autoClose: false,
                  showOnPageHidden: false,
                  icon: "img/logo-b.png",
                  onClick: function () {
                    window.focus();
                    $rootScope.showNotifSidebar = true;
                    $rootScope.clearNotif(true);
                  }
                };

                if (desktopNotification.currentPermission === desktopNotification.permissions.granted) {
                  desktopNotification.show(titleNotification, options);
                } else {
                  try {
                    desktopNotification.requestPermission().then(function (permission) {
                      desktopNotification.show(titleNotification, options);
                    });
                  }
                  catch (exception){
                    desktopNotification.show(titleNotification, options);
                  }
                }
              }
              $rootScope.badge.count = data.unread;
              titlenotifier.set($rootScope.badge.count);
            } else {
              $rootScope.badge.count = -1;
            }
            if ($rootScope.badge.count > 0 && $rootScope.showNotifSidebar) {
              $rootScope.newNotifReceived = true;
              //$rootScope.clearNotif(false);
            }
          }
        }, null, ignoreLoadingBar);

      } else {
        $rootScope.badge.count = 0;
      }
    };
    $rootScope.hasToReload = false;
    $rootScope.reloadWindow = function () { location.reload(); }
    $rootScope.initNotification();

    $rootScope.isNewHomeNotification = function () {
      if ($location.path() === '/login') return;
      if (DISABLE_NOTIFICATIONS) return;
      let ignoreLoadingBar = true;
      const filters = [{
        "name": "user_id",
        "value": Session.userId()
      }, {
        "name": "type",
        "value": "'home'"
      }, {
        "name": "archived",
        "value": "0"
      }, {
        "name": "last_notification_home_consult",
        "value": "1"
      }];

      ApiRest.get('/Notifs/count', {
        filters: [filters]
      }, function (data) {
        if (data)  $rootScope.badge.homeCount = data.unread;
      }, null, ignoreLoadingBar);
    }
    $rootScope.isNewHomeNotification()

    $interval(function () {
      if ($.cookie('token') == null && $location.path() !== '/login') {
        $rootScope.hasToReload = true;
      } else if ($location.path() !== '/login'){
          $rootScope.initNotification(true);
          $rootScope.isNewHomeNotification();
      }

    }, 30000);

    
    switch (Session.role()) {
      case 'admin':
        $.cookie('role', 'all', {
          path: '/',
          expires: 1
        });
        break;
      case 'charge_prod':
        $.cookie('role', 'production', {
          path: '/',
          expires: 1
        });
        break;
      case 'planning':
        $.cookie('role', 'planning', {
          path: '/',
          expires: 1
        });
        break;
      case 'technicien':
        $.cookie('role', 'technicien', {
          path: '/',
          expires: 1
        });
        break;      
      case 'service':
        $.cookie('role', 'service', {
          path: '/',
          expires: 1
        });
        break;
    };

    $rootScope.cookieDebug = Session.role();
    $rootScope.userRole = Session.role();
    $rootScope.date_today = new Date();

    $rootScope.syncFarmer = function () {
      /*
      $http({
        method: 'GET',
        url: URL_API + '/requests/syncFarmer'
      }).success(function (data, status, headers, config) {
        Notification.success($rootScope._T["4746enjh"]);
        $state.reload();
      }).error(function (data, status, headers, config) {
        Notification.error($rootScope._T["hjbyqsny"]);
      });
      */
    }

    //Global functions
    $rootScope.techFreelance = function () {
      if ($rootScope.user_entity.person != null && $rootScope.user_entity.person.company != null 
          && ($rootScope.user_entity.person.company.toLowerCase() == "freelance" || ($rootScope.user_entity.company != undefined && $rootScope.user_entity.company.toLowerCase() == "freelance")) ) {
        return true;
      } else {
        return false;
      }
    };

    $rootScope.branchName = null
    $rootScope.getBranchName = function () {
      if ($rootScope.branchName) {
        return $rootScope.branchName
      }
      $rootScope.user_entity.permissions.forEach((item) => {
        if (item.app_id == 2) {
          $rootScope.branchName = item.branch.lang
        }
      })
      return $rootScope.branchName
    }

    $rootScope.showToast = function (text, state) {
      if (state == null) {
        state = "success"
      }
      ngToast.create({
        className: state,
        content: text
      });
    };

    $rootScope.showNotifSuccess = function (text) {
      Notification.success(text);
    };


    $rootScope.$on('ngDialog.opened', function (e, $dialog) {
      if($dialog.name === $rootScope.previousRequestId) {
          $rootScope.dialog = $dialog;
          $rootScope.requestGroupDialogId = $dialog.dialog.attr('id');
      }
    });

    $rootScope.previousRequestId = null;
    $rootScope.requestGroupDialogId = null;

    $rootScope.$watchCollection(function(){
        return $state.params;
    }, function(){
      if($stateParams.requestId != null){
          if($rootScope.previousRequestId !== $stateParams.requestId) {
            ngDialog.close($rootScope.requestGroupDialogId);
          }
          $rootScope.previousRequestId = $stateParams.requestId;
          $rootScope.openRequestGroupDialog($stateParams.requestId);
      } else {
          ngDialog.close($rootScope.requestGroupDialogId);
          $rootScope.previousRequestId = null;
          $rootScope.requestGroupDialogId = null;
      }
    });

    $rootScope.openRequestGroupDialog = function(requestId) {
      if(requestId != null) {
          ngDialog.open({
              name: requestId,
              className: 'ngdialog-theme-demand popup',
              width: '90%',
              template: 'requestGroup/requestGroup.html',
              controller: 'requestGroupCtrl',
              closeByDocument: false,
              closeByNavigation: true,
              closeByEscape: false
          })
          .closePromise.then(function(data){
            if(data.value === "close") {
                $state.go($state.current.name, {
                    requestId: null
                });
            }
            if(data.value === "close&reload") {
                $state.go($state.current.name, {
                    requestId: null
                });
                $state.reload();
            }

          });
      }
    }
    
    $rootScope.setLang  = lang => {
      $cookies.put("language", lang);
      window.location.reload();
    }

    $rootScope.getLang = () => {
      if (!$cookies.get("language")){
        $cookies.put("language", "fr");
        return "fr";
      }

      return $cookies.get("language");
    }
  }
]);

Lantern.provider("$translation", function() {
  this.$get = ($rootScope, $http) => {
    return $http.get(URL_API + "/translation/apptranslationcache?appId=2").then( response => {
      if (response && response.data) {
        $rootScope.translations = response.data.translations;
        
        $rootScope._T = {}
        let _lang = $rootScope.getLang();
        moment.locale(_lang);
        
        for (let id in $rootScope.translations) {
          $rootScope._T[id] = $rootScope.translations[id][_lang] ? $rootScope.translations[id][_lang] : `{{ ${id} }}`;
        }
      }
    }).catch(ex => {
      // Handle ex
      console.log("EX", ex)
    }) 
  };
});

Lantern.run(['editableOptions','$http','Session',function (editableOptions,$http, Session) {
  let branchId = Session.branchId();
  editableOptions.theme = 'bs3';
  if( $http.defaults.headers.common['app-code'] == undefined){
    $http.defaults.headers.common['app-code']= $.cookie('app_code'); 
    $http.defaults.headers.common.branch = branchId; 
    $http.defaults.headers.common.application = 'lantern'; 
  }
}]);

let notifWatch;

function watchNotifSidebar(rootScope) {
  let bodySize;
  let isApplied = rootScope.showNotifSidebar;

  //Si le watch existe, on le détruit
  if (notifWatch) {
    notifWatch();
  }

  notifWatch = rootScope.$watch('showNotifSidebar', function (value) {
      let body = $('body');

      if (value === true) {
      rootScope.showLoadMoreNotif = true;
      let sidebarWidth = $('#notifSidebar').attr('ps-size');
      let newSize = body.width() - parseInt(sidebarWidth.substring(0, sidebarWidth.length - 2)) + 'px';

      if (!isApplied) {
        body.animate({
          width: newSize
        }, 500, 'swing', function () {
          $('.container-fixed-nav-aside-activity').css('width', $('.view-frame').width() * 0.2 + 'px');
          isApplied = true;
        });
      } else {
        setTimeout(function () {
          $('.container-fixed-nav-aside-activity').css('width', $('.view-frame').width() * 0.2 + 'px');
        }, 500);
      }
    } else if (value !== undefined) {
      body.animate({
        width: bodySize
      }, 500, 'swing', function () {
        body.css('width', '');
        $('.container-fixed-nav-aside-activity').css('width', "");
        bodySize = body.width();
        isApplied = false;
      });
    }
  });
}



Lantern.factory('myInterceptor', ['$log', '$location', function ($log, $location) {

  return {
    responseError: function (response) {
      if (response.status === 401 && $location.path() !== '/login') {
        $location.path('/logout');
      }
      return response;
    }
  };
}]);

Lantern.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('myInterceptor');
}]);

Lantern.config([
  '$stateProvider',
  '$locationProvider',
  '$urlRouterProvider',
  'USER_ROLES',
  '$translationProvider',
  function ($stateProvider, $locationProvider, $urlRouterProvider, USER_ROLES, $translation, $rootScope) {
    $urlRouterProvider.otherwise('/');
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl',
      resolve: {
        function($rootScope, $http) {
          return $translation.$get($rootScope, $http)
        }
      },
      data: {
        authorizedRoles: [
          USER_ROLES.guest
        ]
      }
    }).state('forgotpassword', {
      url: '/forgotpassword',
      templateUrl: 'views/forgotpassword.html',
      controller: 'ForgotpasswordCtrl',
      data: {
        authorizedRoles: [USER_ROLES.guest]
      }
    }).state('app', {
      abstract: true,
      templateUrl: 'views/layout.html',
      controller: 'MainCtrl',
      resolve: {
        function ($rootScope, $http) {
          return $translation.$get($rootScope, $http)
        }
      },
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.planning,
          USER_ROLES.technicien,
          USER_ROLES.compta,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.production,
          USER_ROLES.commercial
        ]
      }
    }).state('app.logout', {
      url: '/logout',
      controller: 'LogoutCtrl',
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.guest,
          USER_ROLES.planning,
          USER_ROLES.technicien,
          USER_ROLES.compta,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.production,
          USER_ROLES.commercial
        ]
      }
    }).state('app.index', {
      url: '/?:requestId',
      templateUrl: 'views/production/accueil.html',
      controller: 'accueilCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.planning,
          USER_ROLES.production,
          USER_ROLES.technicien,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.commercial
        ]
      }
    }).state('app.createPlanning', {
      url: '/createPlanning?product_ids&workflow_id&subproject_id&requestId',
      title: 'Pose de Planning',
      templateUrl: 'views/production/createPlanning.html',
      controller: 'CreatePlanningCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production
        ]
      }
    }).state('app.projects', {
      url: '/projects?:requestId&:new',
      title: 'Liste des projets',
      templateUrl: 'projectsList/projectsList.html',
      controller: 'ProjectsListCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production,
          USER_ROLES.planning,
          USER_ROLES.technicien,
          USER_ROLES.compta,
          USER_ROLES.commercial
        ]
      }
    }).state('app.projectsDigi', {
      url: '/projectsDigi?:requestId',
      title: 'Liste des projets',
      templateUrl: 'projectsDigi/projectsDigi.html',
      controller: 'ProjectsDigiCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.digitalmedia
        ]
      }
    }).state('app.subprojects', {
      url: '/subprojects/:id?:requestId',
      title: 'Sous-projet',
      templateUrl: 'views/production/subprojectDetailTable.html',
      controller: 'SubprojectDetailTableCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production,
          USER_ROLES.planning,
          USER_ROLES.technicien,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.digitalmedia
        ]
      }
    }).state('app.subprojectsAdvanced', {
      url: '/subprojectsAdvanced/:id?:requestId',
      title: 'Sous-projet',
      templateUrl: 'views/production/subprojectDetail.html',
      controller: 'SubprojetDetailCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production,
          USER_ROLES.planning,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.technicien
        ]
      }
    }).state('app.records', {
      abstract: true,
      title: 'Demandes non planifiées',
      templateUrl: 'views/Planning/recordsLayout.html',
      controller: 'RecordsListCtrl',
      cache: false,
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production,
          USER_ROLES.planning,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.technicien
        ]
      }
    }).state('app.requestGroupNonePlan', {
      url: '/requestsUnplanned?pagination&planning&farmer&:requestId',
      title: 'Demandes non planifiées',
      templateUrl: 'requestGroupList/requestGroupListPlanning.html',
      controller: 'RequestGroupListCtrl',
      cache: false,
        reloadOnSearch: false,
        data: {
            authorizedRoles: [
                USER_ROLES.all,
                USER_ROLES.technicien,
                USER_ROLES.planning,
                USER_ROLES.production
            ]
        }
    }).state('app.requestGroupPlanned', {
      url: '/requestsPlanned?pagination&planning&farmer&:requestId',
      title: 'Demandes planifiées',
      templateUrl: 'requestGroupList/requestGroupListPlanning.html',
      controller: 'RequestGroupListCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.technicien,
          USER_ROLES.planning
        ]
      }
    }).state('app.requestsValidated', {
      url: '/requestsValidated?:requestId',
      title: 'Liste des demandes',
      templateUrl: 'views/Technicien/requestsValidatedList.html',
      controller: 'RequestsValidatedListCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.technicien,
          USER_ROLES.planning,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.digitalmedia
        ]
      }
    }).state('app.recordsPrevisional', {
      url: '/recordsPrevisional?:requestId',
      templateUrl: 'views/Planning/recordsPrevisionalList.html',
      controller: 'RecordsPrevisionalListCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.technicien,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.planning
        ]
      }
    }).state('app.recordsPrevisionalTech', {
      title: 'Liste des prochaines séances',
      templateUrl: 'views/Technicien/recordsPrevisionalList.html',
      controller: 'RecordsPrevisionalListTechCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.planning,
          USER_ROLES.technicien
        ]
      }
    }).state('app.myRequests', {
      url: '/myRequests?:requestId',
      title: 'Mes demandes',
      templateUrl: 'views/production/myRequests.html',
      controller: 'MyRequestsCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          //USER_ROLES.production
        ]
      }
    }).state('app.requests', { // on va chercher l'ensemble des requests - ne semble plus utilisé (phv 20230808)
      abstract: true,
      url: '/requests',
      title: 'Détail de la demande',
      template: '<div ui-view></div>',
      controller: 'requestsCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production
        ]
      }
    }).state('app.requestsDetail', {
      url: '/requests/detail/:id?requestGroup&:requestId',
      title: 'Détail de la demande',
      templateUrl: 'views/production/requestDetail.html',
      controller: 'RequestDetailCtrl',
      reloadOnSearch: false,
      data: {
        authorizedRoles: [
          USER_ROLES.all,
          USER_ROLES.production,
          USER_ROLES.planning,
          USER_ROLES.technicien,
          USER_ROLES.digitalmedia,
          USER_ROLES.qc,
          USER_ROLES.prepa,
          USER_ROLES.commercial
        ]
      }
    }).state('app.requests.demands', {
        url: '/demands?id&key&new&pagination&requestId',
        title: 'Mes demandes',
        templateUrl: 'views/production/requestDemands.html',
        controller: 'requestDemandsDetailCtrl',
        reloadOnSearch: false,
        data: {
            authorizedRoles: [
                USER_ROLES.all,
                USER_ROLES.production
            ]
        }
    }).state('app.requestGroup', {
        url: '/requestGroup?pagination&requestId',
        title: 'Mes demandes groupées',
        templateUrl: 'requestGroupList/requestGroupList.html',
        controller: 'RequestGroupListCtrl',
        reloadOnSearch: false,
        data: {
            authorizedRoles: [
                USER_ROLES.all,
                USER_ROLES.production,
                USER_ROLES.technicien,
                USER_ROLES.planning
            ]
        }
    }).state('app.requestsTech', {
        url: '/requestsTech/:id?farmer&:requestId',
        title: 'Détail de la demande',
        templateUrl: 'views/Technicien/requestDetailTechnicien.html',
        controller: 'RequestDetailTechnicienCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.technicien,
            USER_ROLES.planning,
            USER_ROLES.digitalmedia
          ]
        }
      }).state('app.products', {
        url: '/products/:id?workflow_id&:requestId',
        title: 'Détail du produit',
        templateUrl: 'views/production/productDetailProd.html',
        controller: 'ProductDetailProductionCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.planning,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.digitalmedia,
            USER_ROLES.qc,
            USER_ROLES.prepa,
            USER_ROLES.compta,
            USER_ROLES.commercial
          ]
        }
      }).state('app.productsMedia', {
        url: '/products/:id/mediaItems?search&requestId',
        title: 'Éléments de travail',
        templateUrl: 'views/production/productMediaItems.html',
        controller: 'ProductMediaItemsProdCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.qc,
            USER_ROLES.prepa,
            USER_ROLES.digitalmedia
          ]
        }
      }).state('app.product_workflows', {
        url: '/product_workflows/:id?:requestId',
        templateUrl: 'views/production/editProductWorkflowProd.html',
        controller: 'EditProductWorkflowProdCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.qc,
            USER_ROLES.prepa,
            USER_ROLES.digitalmedia
          ]
        }
      }).state('app.manageReturns', {
        url: '/manageReturns/:id?:requestId',
        title: 'Gestion des retours',
        templateUrl: 'views/production/manageReturns.html',
        controller: 'ManageReturnsCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.manageReturns.workflow', {
        url: '/:workflow_id?:requestId',
        title: 'Gestion des retours',
        templateUrl: 'views/production/manageReturns.html',
        controller: 'ManageReturnsCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.returns', {
        url: '/returns?project&workflow&requestId',
        title: 'Gestion des retours',
        templateUrl: 'views/production/returns.html',
        controller: 'ReturnsCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.records.manageTechRequests', {
        url: '/manageTechRequests?:requestId',
        title: 'Panier des techniciens',
        templateUrl: 'views/Planning/manageTechRequests.html',
        controller: 'manageTechRequestsCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.timeTracking', {
        url: '/timeTracking/:idProject?:requestId',
        title: 'Suivi du temps',
        templateUrl: 'views/production/timeTracking.html',
        controller: 'TimeTrackingCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.planning,
            USER_ROLES.commercial
          ]
        }
      }).state('app.createDm', {
        title: 'Créer des éléments de travail',
        templateUrl: 'views/DigitalMedia/createDemandDigitalMedia.html',
        controller: 'CreateDemandDigitalMediaCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.qc,
            USER_ROLES.prepa,
            USER_ROLES.digitalmedia
          ]
        }
      }).state('app.technicalSpecList', {
        url: '/technicalSpecList/:idClient?:requestId',
        title: 'Liste des spécifications techniques',
        templateUrl: 'views/production/technicalSpecList.html',
        controller: 'TechnicalSpecListCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.technicalSpecEdit', {
        url: "/technicalSpecEdit/:idSpec?:requestId",
        title: 'Éditer une spec',
        templateUrl: 'views/production/technicalSpec.html',
        controller: 'TechnicalSpecCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.technicalSpecNew', {
        url: '/technicalSpecNew/:idClient?:requestId',
        title: 'Créer une spéc',
        templateUrl: 'views/production/technicalSpec.html',
        controller: 'TechnicalSpecCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production
          ]
        }
      }).state('app.stepList', {
        url: '/stepList/:idClient?:requestId',
        title: 'Liste d\'étapes',
        templateUrl: 'views/production/stepList.html',
        controller: 'StepListCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production
          ]
        }
      }).state('app.stepDetailEdit', {
        url: '/stepDetailEdit/:idStep?:requestId',
        title: 'Éditer une étape',
        templateUrl: 'views/production/stepDetail.html',
        controller: 'StepDetailCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production
          ]
        }
      }).state('app.stepDetailNew/:idClient', {
        url: '/stepDetailNew/:idClient?:requestId',
        title: 'Créer une étape',
        templateUrl: 'views/production/stepDetail.html',
        controller: 'StepDetailCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production
          ]
        }
      }).state('app.historicalRequestsTech', {
        url: '/historicalRequestsTech?:requestId&:service',
        title: 'Historique des demandes',
        templateUrl: 'views/Technicien/historicalRequestsTech.html',
        controller: 'HistoricalRequestsTechCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.technicien,
            USER_ROLES.planning,
            USER_ROLES.digitalmedia,
            USER_ROLES.qc,
            USER_ROLES.prepa
          ]
        }
      }).state('app.requestsAutoTech', {
        url: '/requestsAutoTech?:requestId&:service',
        title: 'Liste des demandes en volume',
        templateUrl: 'views/Technicien/requestsAutoTechList.html',
        controller: 'RequestsAutoTechListCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.technicien,
            USER_ROLES.planning,
            USER_ROLES.digitalmedia,
            USER_ROLES.qc,
            USER_ROLES.prepa
          ]
        }     
      }).state('app.dashboard', {
        url: '/dashboard?:requestId',
        title: 'Dashboard',
        templateUrl: 'views/production/dashboard.html',
        controller: 'DashboardCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production
          ]
        }
      }).state('app.clients', {
        url: '/clients?:requestId',
        title: 'Liste des Clients',
        templateUrl: 'views/production/listClients.html',
        controller: 'ListClientsCtrl',
        reloadOnSearch: false,
        cache: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien,
            USER_ROLES.commercial,
            USER_ROLES.planning
          ]
        }
      }).state('app.comptaTech', {
        url: '/comptaTech?:requestId',
        title: 'Votre Comptabilité',
        templateUrl: 'views/Counted/countedTech.html',
        controller: 'CountedTechCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.planning,
            USER_ROLES.technicien
          ]
        }
      }).state('app.compta', {
        url: '/compta?:requestId',
        title: 'Comptabilité des techniciens',
        templateUrl: 'views/Counted/counted.html',
        controller: 'CountedCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.compta,
            USER_ROLES.technicien,
            USER_ROLES.planning
          ]
        }
      }).state('app.previsCompta', {
        url: '/previsCompta?:requestId',
        title: 'previsionnel comptabilité',
        templateUrl: 'views/Counted/previsional_counted.html',
        controller: 'previsionalCountedCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.compta,
            USER_ROLES.planning
          ]
        }
      }).state('app.interco', {
        url: '/interco?:requestId',
        title: 'interco',
        templateUrl: 'views/Counted/interco.html',
        controller: 'intercoCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.compta,
            USER_ROLES.planning
          ]
        }
      }).state('app.administration', {
        url: '/administration?:requestId',
        title: 'Administration',
        templateUrl: 'views/administration.html',
        controller: 'AdministrationCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all
          ]
        }
      })
      .state('app.suiviProd', {
        url: '/suiviProd/:id?requestId',
        title: 'Suivi de Prod',
        templateUrl: 'partials/Production/suiviProd.html',
        controller: 'SuiviProdCtrl',
        reloadOnSearch:false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.planning,
            USER_ROLES.technicien,
            USER_ROLES.compta,
            USER_ROLES.commercial
          ]
        }
      })
      .state('app.notifications', {
        url: '/notifications?:requestId',
        title: 'Notifications',
        templateUrl: 'views/production/notifications.html',
        controller: 'NotificationsCtrl',
          reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.planning,
            USER_ROLES.technicien
          ]
        }
      }).state('app.restore', {
        url: '/restore?redirect&app_code&token',
        templateUrl: 'views/restore.html',
        controller: 'RestoreCtrl',
        reloadOnSearch: false,
        data: {
          authorizedRoles: [
            USER_ROLES.all,
            USER_ROLES.production,
            USER_ROLES.technicien
          ]
        }
      }).state('app.historicalRequestsDigitalMedia', {
        url: '/historicalRequestsDigitalMedia?:requestId&service',
        title: 'Historique Digital Media',
        templateUrl: 'views/DigitalMedia/historicalRequestsDigitalMedia.html',
        controller: 'historicalRequestsDigitalMediaCtrl',
        reloadOnSearch: false,
        data: {
            authorizedRoles: [
                USER_ROLES.all,
                USER_ROLES.digitalmedia,
                USER_ROLES.qc,
                USER_ROLES.prepa
            ]
        }
    }).state('app.security', {
        url: '/security',
        title: 'Page d\'acceuil sécurité',
        templateUrl: 'security/security.html',
        controller: 'SecurityCtrl',
        reloadOnSearch: false,
        data: {
            authorizedRoles: [
                USER_ROLES.all,
                USER_ROLES.security
            ]
        }
    })
  }
]);
