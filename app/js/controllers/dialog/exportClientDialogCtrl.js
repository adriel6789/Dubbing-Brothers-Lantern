Lantern.controller('ExportClientDialogCtrl', ['$scope', '$timeout', '$rootScope', '$anchorScroll', '$http', '$q', '$state', '$location',
'Project', '$cookies', '$stateParams', '$filter', 'ngDialog', 'ApiRest', 'Session', '$window', 'SuiviProdService', 
  function($scope, $timeout, $rootScope, $anchorScroll, $http, $q, $state, $location,
     Project, $cookies, $stateParams, $filter, ngDialog, ApiRest, Session, $window, SuiviProdService) {

    $scope.countColumn = 0;
    $scope.isSelectAllInfos = false;
    $scope.isSelectAllComments = false;
    $scope.showHiddenColumns = false;
    $scope.workflowsExport = [];
    $scope.allColumnsExport = [];
    $scope.allCellsExport = [];

    var positionSummary = $scope.columns.length;

    $scope.productInfos = [
      {id: 0, name: $rootScope._T["5jujjlwi"], isSelected: false, position: -4, isProductInfo: true, isSummary: false},
      {id: 0, name: $rootScope._T["52mgobdc"], isSelected: false, position: -3, isProductInfo: true, isSummary: false},
      {id: 0, name: $rootScope._T["k1t6im8d"], isSelected: false, position: -2, isProductInfo: true, isSummary: false}
    ];

    if ($scope.subproject.nature.name == 'film') {
      $scope.productInfos.push({id: 0, name: "Bobines", isSelected: false, position: -1, isProductInfo: true, isSummary: false});
    }

    angular.forEach($scope.workflows, function(workflow) {
      let column = $filter('filter')($scope.columns, {
        workflow_id: workflow.id
      }, true);
      if (column.length > 0) {
        autoSelectColumns(column);
        workflow.isAllSelected = false;
        let i = $scope.workflowsExport.push(workflow);
        $scope.workflowsExport[i-1].columns = column;
        let workflowInfos = [
          {id: 0, name: $rootScope._T["d4agimu2"], isSelected: false, position: positionSummary++, workflow: workflow, contextualInfoName: 'summary_short', isProductInfo: false, isSummary: true},
          {id: 0, name: $rootScope._T["ja2pw867"], isSelected: false, position: positionSummary++, workflow: workflow, contextualInfoName: 'summary_medium', isProductInfo: false, isSummary: true},
          {id: 0, name: $rootScope._T["81q8hgsn"], isSelected: false, position: positionSummary++, workflow: workflow, contextualInfoName: 'summary_long', isProductInfo: false, isSummary: true}
        ];
        for (var j = 0; j < workflowInfos.length; j++) {
          $scope.workflowsExport[i-1].columns.push(workflowInfos[j]);
        }
      }
    });

    $scope.commentColumns = $filter('filter')($scope.columns, {
      action_id: null,
      workflow_id: null
    }, true);
    autoSelectColumns($scope.commentColumns);

    function autoSelectColumns(columns) {
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].hide == "1") {
          columns[i].isSelected = false;
        } else {
          columns[i].isSelected = true;
          $scope.countColumn++;
        }
      }
    }

    $scope.selectColumn = function(column, origin) {
      if (column.isSelected) {
        column.isSelected = false;
        $scope.countColumn--;
        if (origin == 'productInfo') {
          $scope.isSelectAllInfos = false;
        } else if (origin == 'comment') {
          $scope.isSelectAllComments = false;
        } else {
          origin.isAllSelected = false;
        }
      } else {
        column.isSelected = true;
        $scope.countColumn++;
      }
      refreshExportable();
    }

    $scope.selectAllInfos = function() {
      $scope.isSelectAllInfos = !$scope.isSelectAllInfos;
      for (var i = 0; i < $scope.productInfos.length; i++) {
        if ($scope.isSelectAllInfos && !$scope.productInfos[i].isSelected) {
          $scope.productInfos[i].isSelected = true;
          $scope.countColumn++;
        } else if (!$scope.isSelectAllInfos && $scope.productInfos[i].isSelected) {
          $scope.productInfos[i].isSelected = false;
          $scope.countColumn--;
        }
      }
      refreshExportable();
    }

    $scope.selectAllColumns = function(workflow) {
      workflow.isAllSelected = !workflow.isAllSelected;
      for (var i = 0; i < workflow.columns.length; i++) {
        if (workflow.isAllSelected && !workflow.columns[i].isSelected) {
          if ($scope.showHiddenColumns || workflow.columns[i].hide != "1") {
            workflow.columns[i].isSelected = true;
            $scope.countColumn++;
          }
        } else if (!workflow.isAllSelected && workflow.columns[i].isSelected) {
          workflow.columns[i].isSelected = false;
          $scope.countColumn--;
        }
      }
      refreshExportable();
    }

    $scope.selectAllCommentColumns = function() {
      $scope.isSelectAllComments = !$scope.isSelectAllComments;
      for (var i = 0; i < $scope.commentColumns.length; i++) {
        if ($scope.isSelectAllComments && !$scope.commentColumns[i].isSelected) {
          if ($scope.showHiddenColumns || $scope.commentColumns[i].hide != "1") {
            $scope.commentColumns[i].isSelected = true;
            $scope.countColumn++;
          }
        } else if (!$scope.isSelectAllComments && $scope.commentColumns[i].isSelected) {
          $scope.commentColumns[i].isSelected = false;
          $scope.countColumn--;
        }
      }
      refreshExportable();
    }

    $scope.filterHiddenColumns = function(column) {
      return $scope.showHiddenColumns || column.hide != "1";
    }

    function setDateByMonth(cell) {

      angular.forEach(cell.requests, function(request) {
        request.ownFarmerbookings = $filter('orderBy')(objectInArray(request.ownFarmerbookings), ['day', 'start_time']);
        request.dateByMonth = {};
        if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) {
          let selectedFarmer = request.ownFarmerbookings;
          for (var i = 0; i < selectedFarmer.length; i += 1) {
            // si la demande n'est pas planifiée on affiche que les dates souhaitées sinon on affiche que les dates planifiées
            if ((request.is_planned == 0 && selectedFarmer[i].is_wish == "1") || (request.is_planned == 1 && selectedFarmer[i].booking_id != null)) {
              let momentDate = moment(selectedFarmer[i].day, "YYYY-MM-DD HH:mm:ss");
              if (momentDate.isValid()) {
                let month = momentDate.format("MMM");
                if (request.dateByMonth[month] === undefined) {
                  request.dateByMonth[month] = [];
                }
                let day = {
                  "day": momentDate.format("DD")
                };
                request.dateByMonth[month].push(day);
              }
            }
          }
        }
      });

      return cell;
    }

    function refreshExportable() {
      $scope.allColumnsExport = [];
      angular.forEach($scope.workflowsExport, function(workflow) {
        angular.forEach(workflow.columns, function(column) {
          if (column.isSelected) {
            $scope.allColumnsExport.push(column);
          }
        })
      });

      angular.forEach($scope.commentColumns, function(column) {
        if (column.isSelected) {
          $scope.allColumnsExport.push(column);
        }
      });

      angular.forEach($scope.productInfos, function(column) {
        if (column.isSelected) {
          $scope.allColumnsExport.push(column);
        }
      });

      $scope.allColumnsExport.sort(function(a, b) { return a.position - b.position });

      $scope.allCellsExport = [];
      angular.forEach($scope.subproject.ownProduct, function(product) {
        let i = $scope.allCellsExport.push(product);
        $scope.allCellsExport[i-1].selectedCells = [];
        angular.forEach($scope.allColumnsExport, function(column) {
          let cellsFiltered = $filter('filter')($scope.allCellsExport[i-1].cells, {
            column_id: column.id.toString()
          }, true);
          if (cellsFiltered.length > 0) {
            let cell = setDateByMonth(cellsFiltered[0]);
            $scope.allCellsExport[i-1].selectedCells.push(cell);
          } else {
            $scope.allCellsExport[i-1].selectedCells.push({name: column.name, isProductInfo: column.isProductInfo, isSummary: column.isSummary});
          }
        })
      });
    }

    refreshExportable();

    $scope.export = function() {

        // let data = document.getElementById('exportable').innerHTML.replace(/<\!--.+?-->/sg, "").replace(/ng-if=\".+?\"/sg, "").replace(/ng-repeat=\".+?\"/sg, "").replace(/ng-switch=\".+?\"/sg, "")
        //     .replace(/ng-switch-when=\".+?\"/sg, "").replace(/ng-style=\".+?\"/sg, "").replace(/class=\".+?\"/sg, "").replace(/&lt;/sg, "<").replace(/&gt;/sg, ">").replace(/style="/sg, "style=\"mso-number-format: '\@'; ");
        let data = document.getElementById('exportable').innerHTML.replace(/<\!--.+?-->/g, "").replace(/ng-if=\".+?\"/g, "").replace(/ng-repeat=\".+?\"/g, "").replace(/ng-switch=\".+?\"/g, "")
            .replace(/ng-switch-when=\".+?\"/g, "").replace(/ng-style=\".+?\"/g, "").replace(/class=\".+?\"/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/style="/g, "style=\"mso-number-format: '\@'; ");

        var header = '<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">';
      var blob = new Blob([header + data], {
        type: "data:application/vnd.ms-excel;charset=UTF-8"
      });

      saveAs(blob, "export.xls");
    };

    $scope.returnContextInfo = function(product, name, workflow) {
      var info = {};
      var found = false;
      if (product.ownContextualInfos != null) {
        product.ownContextualInfos.forEach(function(contextinfo) {
          if (contextinfo.workflow_id == workflow.id && contextinfo.name == name && !found) {
            info = contextinfo;
            if (name == "ordre_diff") {
              info.value = parseInt(info.value);
            }
            found = true;
          }
        });
      }
      return info;
    };

    $scope.formatDate = function(value) {
      let validDateFormat = ["DD/MM/YYYY", "DD/MM/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "D/M/YYYY", "D/M/YY", "DD/MM", "DD/M", "D/MM", "D/M", "DD-MM-YYYY", "DD-MM-YY", "DD-M-YYYY", "DD-M-YY", "D-MM-YYYY", "D-MM-YY", "D-M-YYYY", "D-M-YY", "DD-MM", "DD-M", "D-MM", "D-M"];
      if (moment(value, validDateFormat, true).isValid()) {
        return moment(value, validDateFormat, true).format("DD MMM");
      } else {
        return value;
      }
    }

  }
]);
