'use strict';



/**
 *  A supprimer (phv,10/120/2019)
 *  Tout ce code (suiviCellPlain et suiviCellManual ) est deprecated 
 *  et remplacé par 
 *  app\js\components\suiviCellManual.js
 *  et
 *  app\js\components\suiviCellPlain.js
 * 
 */


angular.module('bonsApp').component('suiviCellPlain', {
  // Binds the attibute data to the component controller.
  bindings: {
    cell: '='
  },

  controller : function (TableauSuiviCell, $filter) {

   this.saveCell = function(cell) {

     var updatedCell = new TableauSuiviCell();
     if (cell.id != 0) {
       updatedCell.id = cell.id;
      } else {
        updatedCell.product_id = cell.product_id;
        updatedCell.tableausuivicolumn_id = cell.tableausuivicolumn_id;
      }
     updatedCell.plain_value = cell.plain_value;
     updatedCell.$save();
     //TableauSuiviCell.save(cell);
   };
 },

  templateUrl : 'partials/Components/suiviCellPlain.html'
});


angular.module('bonsApp').component('suiviCellManual', {
  // Binds the attibute data to the component controller.
  bindings: {
    cell: '='
  },

  controller : function (TableauSuiviCell, $filter) {

   this.saveCell = function(cell) {
    var updatedCell = new TableauSuiviCell();
    if (cell.id != 0) {
      updatedCell.id = cell.id;
     } else {
       updatedCell.product_id = cell.product_id;
       updatedCell.tableausuivicolumn_id = cell.tableausuivicolumn_id;
     }
    updatedCell.manual_date = cell.manual_date;
    updatedCell.manual_validation = cell.manual_validation;
    updatedCell.$save();
   };
 },

  templateUrl : 'partials/Components/suiviCellManual.html'
});
