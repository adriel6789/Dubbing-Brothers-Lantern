Lantern.controller('TimeTrackingCtrl', ['$rootScope', '$scope', '$filter', '$cookies', '$state', '$stateParams', '$location', 'Project', 'Farmer', 'Request', 'Valuelist', '$q',
  function($rootScope, $scope, $filter, $cookies, $state, $stateParams, $location, Project, Farmer, Request, Valuelist, $q) {


    $scope.project = Project.queryFalse({
      projectId: $stateParams.idProject
    })
    var etapes_doublage = Valuelist.getEtapeActionByWorkflow({
      workflow_type_id: 1
    })
    var etapes_mastering = Valuelist.getEtapeActionByWorkflow({
      workflow_type_id: 2
    })
    var etapes_servicing = Valuelist.getEtapeActionByWorkflow({
      workflow_type_id: 3
    })

    $scope.showFilter = true;
    $scope.filter = {};
    $scope.filter.subproject = null;
    $scope.filter.products = [];
    $scope.filter.workflow = null;
    $scope.filter.etapes = [];
    $scope.filter.actions = [];

    $scope.addSubprojectFilter = function(subproject) {
      subproject.ownProduct = objectInArray(subproject.ownProduct);
      subproject.ownProduct = $filter('orderBy')(subproject.ownProduct, "human_description");
      $scope.filter.subproject = subproject;
      unselectProduct();
    }

    function unselectProduct() {
      angular.forEach($scope.filter.products, function(product) {
        product.selectByFilter = false;
      })
      $scope.filter.products = [];
      checkCommonAllWorkflowForFilter();
      unselectWorkflow();
    }

    $scope.addProductFilter = function(product) {
      angular.forEach(product.sharedWorkflow, function(workflow) {
        workflow.color = colorizeWorkflow(workflow);
      })
      product.selectByFilter = !product.selectByFilter
      if (product.selectByFilter) {
        $scope.filter.products.push(product);
          //  checkCommonProductWorkflowForFilter(product)
      } else {
        var index = $scope.filter.products.indexOf(product);
        if (index != -1) {
          $scope.filter.products.splice(index);
        }

      }
      unselectWorkflow();
      checkCommonAllWorkflowForFilter();
    }

    $scope.workflowsForFilter = [];

    function checkCommonProductWorkflowForFilter(product) {
      if ($scope.workflowsForFilter.length == 0) {
        $scope.workflowsForFilter = product.sharedWorkflow.slice();
      } else {
        var temp = [];
        angular.forEach($scope.workflowsForFilter, function(workflow, index) {
          if ($filter('filter')(product.sharedWorkflow, {
              id: workflow.id
            }, true).length == 1) {
            temp.push(workflow);
          }
        })
        $scope.workflowsForFilter = temp.slice();
      }
    }

    function checkCommonAllWorkflowForFilter() {
      var productSelected = $filter('filter')($scope.filter.subproject.ownProduct, {
        selectByFilter: true
      });
      $scope.workflowsForFilter = [];
      angular.forEach(productSelected, function(product) {
        checkCommonProductWorkflowForFilter(product);
      });
    }

    function unselectWorkflow() {
      if ($scope.filter.workflow != null) {
        $scope.filter.workflow.selectByFilter = false;
        unselectEtape();
      }
      $scope.filter.workflow = null;
    }

    $scope.addWorkflowFilter = function(workflow) {
      if ($scope.filter.workflow != null) {
        $scope.filter.workflow.selectByFilter = false;
        unselectEtape();
      }

      workflow.selectByFilter = true;
      $scope.filter.workflow = workflow;

      if (workflow.workflow_type_id == 1) {
        $scope.etapesForFilter = filterEtapes(etapes_doublage);
      } else if (workflow.workflow_type_id == 2) {
        $scope.etapesForFilter = filterEtapes(etapes_mastering);
      } else if (workflow.workflow_type_id == 3) {
        $scope.etapesForFilter = filterEtapes(etapes_servicing);
      }
    }

    function filterEtapes(etapes) {
      let filteredEtapes = [];
      angular.forEach(etapes, function(etape) {
        let skipEtape = true;
        angular.forEach(etape.actions, function(action) {
          if (action.planning == "farmer") {
            skipEtape = false;
          }
        });
        if (!skipEtape) {
          filteredEtapes.push(etape);
        }
      });
      return filteredEtapes;
    }

    function unselectEtape() {
      angular.forEach($scope.filter.etapes, function(etape) {
        etape.selectByFilter = false;
        unselectActions(etape);
      })
      $scope.filter.etapes = [];
      $scope.etapesForFilter = null;
      $scope.filter.actions = [];
    }

    $scope.addEtapeFilter = function(etape) {
      let index = $scope.filter.etapes.indexOf(etape);
      if (index != -1) {
        $scope.filter.etapes.splice(index, 1);
        etape.selectByFilter = false;
        unselectActions(etape);
        delete $scope.filter.actions[etape.id];
      } else {
        $scope.filter.etapes.push(etape);
        etape.selectByFilter = true;
        angular.forEach(etape.actions, function(action) {
          if (action.planning == 'farmer') {
            $scope.addActionFilter(action, false, etape);
          }
        });
      }
    }

    function unselectActions(etape) {
      angular.forEach(etape.actions, function(action) {
        action.selectByFilter = false;
        let index = $scope.filter.actions[etape.id].indexOf(action);
        if (index != -1) {
          $scope.filter.actions[etape.id].splice(index, 1);
        }
      });
    }

    $scope.addActionFilter = function(action, isFromFilter, etape) {
      if ($scope.filter.actions[etape.id] === undefined) {
        $scope.filter.actions[etape.id] = [];
      }
      if (isFromFilter && $scope.filter.actions[etape.id].length > 1 || !isFromFilter) {
        action.selectByFilter = !action.selectByFilter;
        if (action.selectByFilter) {
          $scope.filter.actions[etape.id].push(action);
            //  checkCommonProductWorkflowForFilter(product)
        } else {
          var index = $scope.filter.actions[etape.id].indexOf(action);
          if (index != -1) {
            $scope.filter.actions[etape.id].splice(index, 1);
          }
        }
        if (isFromFilter) {
          $scope.generateTimeTracking();
        }
      }
    }

    $scope.isFilterValid = function() {
      if ($scope.filter.subproject == null) {
        return $rootScope._T["eseigr86"];
      } else if ($scope.filter.products.length == 0) {
        return $rootScope._T["lfv8limq"];
      } else if ($scope.filter.workflow == null) {
        return $rootScope._T["91ev17n2"];
      } else if ($scope.filter.etapes.length == 0) {
        return $rootScope._T["pqycpda5"];
      } else if (!isFilterActionsValid()) {
        return $rootScope._T["lntqa0hm"];
      } else return true;
    }

    function isFilterActionsValid() {
      let isValid = true;
      angular.forEach($scope.filter.actions, function(actions) {
        if (actions.length == 0) {
          isValid = false;
        }
      });
      return isValid;
    }


    $scope.generateTimeTracking = function() {

      $scope.allFarmers = [];

      $scope.productSelected = $filter('filter')($scope.filter.subproject.ownProduct, {
        selectByFilter: true
      });

      let size = $scope.productSelected.length;

      angular.forEach($scope.filter.etapes, function(etape) {
        $scope.allFarmers[etape.id] = [];
        let count = 0;

        angular.forEach($scope.productSelected, function(product) {
          if (product.farmers === undefined) {
            product.farmers = [];
          }
          product.farmers[etape.id] = [];
          var filtersRequest = [{
            "name": "product_id",
            "value": product.id
          }, {
            "name": "workflow_id",
            "value": $scope.filter.workflow.id
          }];
          Request.getRequestsBy({
            filters: [filtersRequest]
          }, function(requests) {
            requests.forEach(function(request) {
              if ($scope.filter.workflow.id == request.workflow_id && request.action_type.etape_type.value == etape.value && $filter('filter')($scope.filter.actions[etape.id], {
                  id: parseInt(request.action_type.id)
                }, true).length > 0) {
                angular.forEach(request.ownFarmerbookings, function(farmer) {
                  if (farmer.is_finished == 1 && farmer.is_done == 1 && farmer.working_time_start != null && farmer.working_time_end != null) {
                    farmer.request = request;
                    $scope.allFarmers[etape.id].push(farmer);
                    product.farmers[etape.id].push(farmer);
                  }
                });
              }
            })
            count++;
            if (size == count) {
              prepareGraph(etape);
            }
          });
        })

      });

    }

    $scope.timeCountAll = function() {
      var productSelected = $filter('filter')($scope.filter.subproject.ownProduct, {
        selectByFilter: true
      })
      angular.forEach(productSelected, function(product) {

      })
    }

    function prepareGraph(etape) {
      var jsonStr = '[]';

      var productSelected = $filter('filter')($scope.filter.subproject.ownProduct, {
        selectByFilter: true
      });

      if ($scope.timeCountAll === undefined) {
        $scope.timeCountAll = [];
      }

      $scope.timeCountAll[etape.id] = 0;

      angular.forEach(productSelected, function(product) {
        var obj = JSON.parse(jsonStr);

        var object = {};
        if (product.episode_number != null) {
          object.key = $rootScope._T['m3iyfpjn'] + " " + product.episode_number;
        } else if (product.description != null && product.description.value != null) {
          object.key = product.description.value;
        } else {
          object.key = product.description_text;
        }

        product.action_farmers = {};
        angular.forEach($scope.filter.actions[etape.id], function(action) {
          if (product.action_farmers[action.name] == null) {
            product.action_farmers[action.name] = {};
            product.action_farmers[action.name].name = action.value;
            product.action_farmers[action.name].sum = 0;
          }
          product.action_farmers[action.name].sum = $scope.countByAction(product, action.name, 'hours', etape);
          $scope.timeCountAll[etape.id] += product.action_farmers[action.name].sum;
        });


        object.values = [];
        angular.forEach(product.action_farmers, function(action) {
          var values = {};

          values.x = action.name;
          values.y = action.sum;

          object.values.push(values);
        })


        obj.push(object);
        jsonStr = JSON.stringify(obj);
      })

      if ($scope.data === undefined) {
        $scope.data = [];
      }
      $scope.data[etape.id] = JSON.parse(jsonStr);
    }



    $scope.options = {
      "chart": {
        "type": "multiBarChart",
        "height": 700,
        "margin": {
          "top": 20,
          "right": 20,
          "bottom": 45,
          "left": 45
        },
        "clipEdge": true,
        "duration": 500,
        "stacked": true,
        "xAxis": {
          "axisLabel": $rootScope._T['h6jj63br'],
          "showMaxMin": false
        },
        "yAxis": {
          "axisLabel": $rootScope._T['dbl5u3jl'],
          "axisLabelDistance": -20
        }
      }
    };

    $scope.timeCountOne = function(farmer, format) {
      if (farmer.working_time_start != null && farmer.working_time_end != null) {
        var start = moment(farmer.working_time_start);
        var end = moment(farmer.working_time_end);
        var diff = end.diff(start, 'minutes');
        if (farmer.break_time != null) {
          diff -= farmer.break_time;
        }
        var duration = moment.duration(diff, 'minutes');
        if (format == 'minutes') {
          //var min = end.diff(start, 'minutes');
          return duration.asMinutes();
        } else if (format == 'hours') {
          //var hours = end.diff(start, 'hours', true);
          return duration.asHours(true).toFixed(2);
        }
      } else {
        return "Séance non terminée";
      }
    };

    $scope.timeCountProduct = function(product, format, etape) {
      var sum = 0;

      if (product.farmers !== undefined) {
        angular.forEach(product.farmers[etape.id], function(farmer) {
          var calc = $scope.timeCountOne(farmer, 'minutes');
          if (calc === parseInt(calc, 10)) {
            sum += calc;
          }
        });
      }

      if (sum != 0) {
        var duration = moment.duration(sum, 'minutes');

        if (format == 'minutes') {
          return duration.asMinutes();
        } else if (format == 'hours') {
          return duration.asHours(true).toFixed(2);
        }
      } else {
        return 0;
      }
    };



    $scope.countByAction = function(product, action, type, etape) {

      let sum = 0;
      if (product.farmers !== undefined) {
        angular.forEach(product.farmers[etape.id], function(farmer) {
          let calc = $scope.timeCountOne(farmer, type);

          if (!isNaN(calc)) {
            if (farmer.request.action_type.name == action) {
              sum += parseFloat(calc);
            }
          }
        });
      }

      return sum;
    }

    $scope.formatDate = function(minutes, total) {
      var result = {};
      if (total) {
        minutes = parseInt(minutes);
      }
      if (minutes === parseInt(minutes, 10) && minutes != 0) {
        var calcHours = parseInt(minutes / 60);
        var calcMinutes = minutes % 60;

        if (calcHours < 10) {
          calcHours = "0" + calcHours;
        }
        if (calcMinutes < 10) {
          calcMinutes = "0" + calcMinutes;
        }

        result.hours = calcHours + 'h' + calcMinutes;

        result.minutes = minutes + ' min';
      } else {
        result.hours = '0h00';
        result.minutes = '00 min';
      }
      return result;
    }

    $scope.exportSeances = function() {

      var header = '<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">';
      var blob = new Blob([header + document.getElementById('exportable').innerHTML], {
        type: "data:application/vnd.ms-excel;charset=UTF-8"
      });

      saveAs(blob, $scope.project.name + ".xls");
    };


  }
]);
