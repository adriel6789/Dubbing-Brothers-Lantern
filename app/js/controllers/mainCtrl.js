Lantern.controller('MainCtrl', ['$rootScope', '$scope', '$state', '$location', 'AuthService', 'EVENTS', 'Session', 'ClientService',
    function($rootScope, $scope, $state, $location, AuthService, EVENTS, Session, ClientService) {
        // search bitwise operator in Google or any search engine
        // id come from database table app_role (app_id 2)
        $rootScope.admin        = 1
        $rootScope.production   = 2
        $rootScope.planning     = 4
        $rootScope.technician   = 8
        $rootScope.digimedia    = 16
        $rootScope.accounting   = 32
        $rootScope.security     = 64
        $rootScope.sales        = 128
        const bitwiseRoleHash = {
            '5': 1,     // admin
            '6': 2,     // charge_prod
            '7': 4,     // planning
            '8': 8,     // technicien
            '10': 16,   // digital media
            '11': 32,   // compta
            '21': 64,   // sécurité
            '23': 128,  // commercial
            '96': 256,  // qc   (ffs)
            '97': 512,   // prépa  (ffs)
            '98': 1024   // stage manager  (ffs)
        }
        
        const setUSerAccessRights = function setUSerAccessRights () {
            if ($rootScope.user_entity && $rootScope.user_entity.permissions) {
                $rootScope.user_entity.permissions.forEach(function (application) {
                    if (application.app_id == 2) {
                        application.roles.forEach(function (role) {
                            if (role.branch_id == Session.branchId())
                                $rootScope.userAccessRights |= bitwiseRoleHash[role.id]
                        })
                    }
                })
            }
        }
        if ($rootScope.user_entity) {
            setUSerAccessRights()
        }
        $rootScope.canDisplay = function (rightsRequired) {
            if (!$rootScope.userAccessRights) setUSerAccessRights()
            return $rootScope.userAccessRights & rightsRequired ? true : false
        }
        // add $rootScope.clientsLight
        ClientService.getClients({}, function() {
        }, ClientService.manageClientError)
    }

]);
