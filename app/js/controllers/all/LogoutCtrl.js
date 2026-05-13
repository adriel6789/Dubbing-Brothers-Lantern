Lantern.controller('LogoutCtrl', ['$rootScope', 'Session', 'AuthService', 'EVENTS', '$interval',
    function($rootScope, Session, AuthService, EVENTS, $interval) {

        $.cookie("token", null, {
            path: '/',
            expires: 0
        });
        $.cookie("role", null, {
            path: '/',
            expires: 0
        });
        $.cookie("roles", null, {
            path: '/',
            expires: 0
        });
        $.cookie("user_id", null, {
            path: '/',
            expires: 0
        });

        $rootScope.showNotifSidebar = false
        $interval.cancel($rootScope.checKNotifPid)
        AuthService.logout();
        Session.clean();
        Session.clearCustomCookies();
        $rootScope.$broadcast(EVENTS.logoutSucceeded);
        // clear localStorage to have updated content after login
        listAndClearLocalStorageKeys([],'lantern_');
    }

]);