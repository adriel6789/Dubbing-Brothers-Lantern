bonsServices
  .factory("Session", [
    "$resource",
    "$rootScope",
    "$http",
    "User",
    "$localstorage",
    function($resource, $rootScope, $http, User, $localstorage) {
      var session = {};
      var role = null;
      var roles = null;
      var token = null;
      var userId = null;
      var appCode = null;
      var user = null;
      var userBranches = null;
      var userAdminPermission = null;

      session.clean = function() {
        $.removeCookie("token");
        $.removeCookie("role");
        $.removeCookie("roles");
        $.removeCookie("user_id");
        $localstorage.remove("branches");
        role = null;
        token = null;
        roles = null;
        user_id = null;
        userBranches =  null;
      };

     session.clearCustomCookies = function () {
       if (
         localStorage.getItem("current_version") != null &&
         localStorage.getItem("current_version") != window.APP_VERSION
       ) {
         localStorage.removeItem("current_version");
         localStorage.removeItem("holydays");
       }
       if (localStorage.getItem("current_version") == null) {
         localStorage.setItem("current_version", window.APP_VERSION);
       }
     };

      session.role = function() {
        return role ? role : $.cookie("role");
      };

      session.roles = function() {
        return roles ? roles : $.cookie("roles");
      };

      session.token = function() {
        return token ? token : $.cookie("token");
      };

      session.userId = function() {
        return userId ? userId : $.cookie("user_id");
      };

      session.appCode = function() {
        return appCode ? appCode : $.cookie("app_code");
      };

      session.userBranches = function() {
        return userBranches || !$localstorage.getObject("branches") ? userBranches : $localstorage.getObject("branches");
      };

      // if ($rootScope.branch) {
      //   $localstorage.setObject('lantern_branch', { id: $rootScope.branch })
      // }

      session.setBranch = function (branchId) {
        if (!branchId)
        {
          var branch = $localstorage.getObject('lantern_branch');

          if (branch)
            branchId = branch.id;
        }
        
        if (!branchId)
          branchId = "1";

        $localstorage.setObject('lantern_branch', { id: branchId })

        var branches = session.userBranches();
        var branch = branches ? branches.find(branch => branch.id == branchId) : null;

        if (branch)
        {
          $.cookie("role", branch.role, {
            expires: 1,
            path: "/"
          });
        }
        //session.branch = $localstorage.getObject('lantern_branch')
      }

      session.branchId = function() {
        var branch = $localstorage.getObject('lantern_branch');
        
        if (!branch || !branch.id)
          return 1;

          return branch.id;
      }

      //session.branch = $localstorage.getObject('lantern_branch') // to be removed

      session.reload = function() {
        role = $.cookie("role");
        roles = $.cookie("roles");
        token = $.cookie("token");
        userId = $.cookie("user_id");
        appCode = $.cookie("app_code");
        $http.defaults.headers.common["auth-token"] = token;
      };

      session.checkReloadSession = function(succesCallback) {
        if (!token) {
          session.reload();
        }
        return succesCallback();
      };

      session.reloadAuth = function () {
        return new Promise((resolve, reject) => {
          var userPromise = permissionPromise = {};
          if (userId != null) {
            if (user){
              userPromise = Promise.resolve(user)
            }else{
               userPromise = new Promise((resolve, reject) => {
                User.getCurrentUserDetails({},
                  user => {
                    resolve(user)
                  }
                , reject);
              });
            }
            if (userAdminPermission != null){
               permissionPromise = Promise.resolve(userAdminPermission)
            }else{
               permissionPromise = new Promise((resolve, reject) => {
                User.checkPermissionId({}, result => {
                  resolve(result);
                },reject);
              });
            }
          } else {
            reject(null);
          }
          Promise.all([userPromise, permissionPromise])
            .then(results => {
              const [userDetails, permissionResult] = results;
              user = userDetails;
              userAdminPermission = permissionResult;
              resolve({ userDetails, permissionResult });
            })
            .catch(error => {
              reject(error);
            });
        })
      };

      session.rememberMe = function() {
        return $.cookie("rememberMe");
      };

      session.create = function(data) {
        if (data.user == undefined) {
          // connexion avec le restore token
          data.user = data;
          data.user_id = data.id;
        }
        role = data.role;
        roles = data.roles;
        token = data.token;
        userId = data.user_id;
        appCode = data.app_code;
        userBranches = data.branches;

        var userBranch = session.branchId();

        if (!userBranch) {
          if (userBranches[0]) {
            data.role = userBranches[0].role
            userBranch = userBranches[0].id
          }
        } else if (userBranches && userBranches.length > 0){
          var cookieBranch = userBranches.find(branch => branch.id == userBranch);

          if (!cookieBranch)
            cookieBranch = userBranches[0]; 

          data.role = cookieBranch.role
          userBranch = cookieBranch.id
        }
      
        $rootScope.showLoading--;

        if (data.token != null) {
          session.clean();

          $.cookie("rememberMe", data.user.email.split("@")[0], {
            expires: 60,
            path: "/"
          });

          $.cookie("token", data.token, {
            expires: 1,
            path: "/"
          });
          $.cookie("roles", data.roles, {
            expires: 1,
            path: "/"
          });
          $.cookie("role", data.role, {
            expires: 1,
            path: "/"
          });
          $.cookie("user_id", data.user_id, {
            expires: 7,
            path: "/"
          });
          $.cookie("app_code", "bons-travaux-auto", {
            expires: 1,
            path: "/"
          });

          $localstorage.setObject("branches", data.branches);

          $.cookie("planningHome", data.user.lantern_plannings, {
            path: "/",
            expires: 60
          });

          session.setBranch(userBranch);

          var role = $.cookie("role");
          $("#notifications").css("display", "block");

          $("#sidemenu").show();
          $("ul.nav li").css("display", "none");

          switch (role) {
            case "all":
              //window.location.href = "#/projects";
              break;
            case "admin":
              $.cookie("role", "all", {
                expires: 1,
                path: "/"
              });
              var role = "all";
              $rootScope.role_of_user = $.cookie("role");
              $("ul.nav li." + role).show();
              break;
            case "production":
              //tech_test@test.com
              //window.location.href = "#/projects";
              break;
            case "charge_prod":
              /* TEMP FIX */
              $.cookie("role", "production", {
                expires: 1,
                path: "/"
              });
              var role = "production";
              $rootScope.role_of_user = $.cookie("role");
              $("ul.nav li." + role).show();
              /* END TEMP FIX */
              //$location.path("/projects");
              break;
            case "planning":
              var role = "planning";
              $.cookie("role", role, {
                expires: 1,
                path: "/"
              });
              $("ul.nav li." + role).show();
              $rootScope.role_of_user = $.cookie("role");
              //$location.path("/records");
              break;
            case "technicien":
              var role = "technicien";
              $.cookie("role", role, {
                expires: 1,
                path: "/"
              });
              $("ul.nav li." + role).show();
              $rootScope.role_of_user = $.cookie("role");
              // if($rootScope.isMobile()){
              //   $location.path("/recordsPrevisionalTech");
              // } else {
              //   $location.path("/requestsValidated");
              // }

              break;
            case "digitalmedia":
              var role = "digitalmedia";
              $rootScope.role_of_user = $.cookie("role");
              $("ul.nav li." + role).show();
              //$location.path("/requestsAutoTech");
              break;
            case "compta":
              var role = "compta";
              $.cookie("role", role, {
                expires: 1,
                path: "/"
              });

              $rootScope.role_of_user = $.cookie("role");
              $("ul.nav li." + role).show();
              //$location.path("/compta");
              break;
          }
        }
      };
      return session;
    }
  ])
  .factory("$localstorage", [
    "$window",
    function($window) {
      return {
        set: function(key, value) {
          $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
          return $window.localStorage[key] || defaultValue || false;
        },
        setObject: function(key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key, defaultValue) {
          if ($window.localStorage[key] != undefined) {
            return JSON.parse($window.localStorage[key]);
          } else {
            return defaultValue || false;
          }
        },
        remove: function(key) {
          $window.localStorage.removeItem(key);
        },
        clear: function() {
          $window.localStorage.clear();
        }
      };
    }
  ])
  .factory("localUpdates",['$rootScope','$localstorage',
  function ($rootScope, $localstorage) {
    const service = {}
    service.getUpdateInformations = function () {
      // TODO verifie date de derniere mise  a jour des valeurs stockees, salles, values, etc
      return []
    }
    // get updates from localstorage et check date  of  last updates
    // element: rooms, clients, contributors, da, prodmanagers, values
    // localUpdates.checkUpdates('element')
    service.checkUpdates = function (element, delay) {
      values_updates = $localstorage.getObject('lantern_values_updates')
      if (!values_updates) {
        values_updates = {} 
      }
      const unixtimestamp = new Date().getTime() - (delay * 1000) // (86400 * 24 * 1000)
      if (values_updates[element]) {
        if (unixtimestamp > values_updates[element]) {
          values_updates[element] = new Date().getTime()
          $localstorage.setObject('lantern_values_updates', values_updates)          
          return true
        } else {
          return false
        }
      } else {
        values_updates[element] = new Date().getTime()
        $localstorage.setObject('lantern_values_updates', values_updates)
        return true
      } 
    }
    return service
  }
 ])
