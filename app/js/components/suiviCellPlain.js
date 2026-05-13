Lantern.component('suiviCellPlain', {
  // Binds the attibute data to the component controller.
  bindings: {
    cell: '=',
    role: '=',
  },
  controller: function($rootScope, $scope, $filter, ApiRest, ResponseToastService, Notification) {

    $scope.saveCellComment = function(cell) {
      if (cell.plain_value.length > 0) {
        ApiRest.put('/tableausuivicells', {}, {
          tableausuivicolumn_id: cell.tableausuivicolumn_id,
          product_id: cell.product_id,
          plain_value: cell.plain_value,
          checked: false
        }, function(response) {
          Notification.success($rootScope._T["ieiv2bwq"]);
        }, function(error) {
          Notification.error(ResponseToastService.error.message);
        });
      };
    }
  },

  templateUrl: 'partials/Components/suiviCellPlain.html'
});
