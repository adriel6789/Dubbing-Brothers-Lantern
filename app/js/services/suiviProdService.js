Lantern.factory('SuiviProdService', [
  '$rootScope', 'TableauSuiviColumn', 'Session', 'Notification', 'ApiRest',
  function ($rootScope, TableauSuiviColumn, Session, Notification, ApiRest) {

    var rest = {};
    var service = {};

    service.addColumn = function (type, params, tableau, workflow_main, action_main, successCallback, errorCallback) {
      var newColumn = new TableauSuiviColumn();
      newColumn.tableausuivi_id = params ? params.tableausuivi_id : tableau.id;
      newColumn.position = Number(tableau.ownTableausuivicolumn.length);
      newColumn.user_id = Session.userId();
      if (type == 'action') {
        newColumn.workflow_id = params ? params.workflow_id : workflow_main.id;
        newColumn.action_id = params ? params.action_id : action_main.id;
      } else if (type == "user") {

        swal({
            title: $rootScope._T["6uv48wvh"],
            text: $rootScope._T["zwn3z74w"],
            type: "input",
            showCancelButton: true,
            closeOnConfirm: false,
            animation: "slide-from-top",
            inputPlaceholder: $rootScope._T["1oew2a3t"]
          },
          function(inputValue) {
            if (inputValue === false) return false;

            if (inputValue === "") {
              swal.showInputError($rootScope._T["i7qbqf6h"]);
              return false
            }
            newColumn.name = inputValue;
            newColumn.$save({}, function(response) {
              swal($rootScope._T["9hxf1btk"], "", "success");
              rest.createReorder(response.id, newColumn.position);
              return successCallback(response);
            }, function(error) {
              Notification.error(ResponseToastService.error[JSON.stringify(error.status)]);
              return errorCallback(error);
            });
          });
        return;
      } else {
        console.error("Type of column not defined");
        return null;
      }

      newColumn.$save({}, function(response) {
        Notification.success($rootScope._T["s3oyw9ls"]);
        rest.createReorder(response.id, newColumn.position);
        return successCallback(response);
      }, function(error) {
        Notification.error(ResponseToastService.error[JSON.stringify(error.status)]);
        return errorCallback(error);
      });

    };

    rest.createReorder = function(columnId, position) {
      ApiRest.post('/tableausuivicolumnsdisplay', {}, {
        user_id: Session.userId(),
        column_id: columnId,
        position: position
      }, function(success) {

      }, function(error) {

      });
    };

    // voir app/partials/Components/suivi_cells/suiviCellManual.html
    // 
    const contextInfoActions = {
      prod_ordre_diff: 'ordre_diff',
      prod_due_date: 'due_date',
      prod_title_vf: 'title_vf',
      prod_title_vd: 'title_vd',
      prod_title_vi: 'title_vi',
      prod_note: 'note',
      prod_sortie_france: 'sortie_france',
      prod_sortie: 'sortie',
      prod_air_date: 'air_date'
    }
    service.contextInfoActions = contextInfoActions
    $rootScope.contextInfoActions = contextInfoActions
    service.hasContextInfo = function () {
      return function (action, field) {
        if (field) {
          if (contextInfoActions[action] == field) {
            return true
          }
          return false
        } else {
          if (contextInfoActions[action]) {
            return true
          }
          return false
        }

      }
    }



    const validDatesActions = {
      'prod_prelim_1': true,
      'prod_prelim_2': true,
      'prod_prelim_3': true,
      'prod_prelim_4': true,
      'prod_fnl': true,
      prod_fnl_v2: true,
      // prod_verif: true,
      prod_stems_1: true,
      prod_stems_2: true,
      prod_stems_3: true,
      prod_stems_4: true,
      prod_fnl_stems_1: true,
      prod_fnl_stems_2: true,
      // 'prod_relecture_texte': true,
      'prod_audio_materials': true,
      'prod_audio_materials': true,
      'prod_qc_reports': true,
      'prod_mastering_note': true,
      'prod_mastering_due_date': true,
      'prod_servicing_note': true,
      'prod_servicing_due_date': true,
      'prod_servicing_diff_date': true
    }
    service.validDatesActions = validDatesActions
    $rootScope.validDatesActions = validDatesActions
    service.hasValidDate = function () {
      return function (action) {
        if (validDatesActions[action]) {
          return true
        }
        return false
      }      
    }

    // add a field note in component prod_valid
    const noteInProdValidComponent = {
      prod_script_vf : true,
      prod_screener : true,
      prod_dispo_doublage : true,
      prod_validation : true,
      prod_verif: true,
      prod_validation_mastering_regie : true,
      prod_validation_mastering_report : true,
      prod_validation_mastering_cf : true,
      prod_validation_mastering_original_master : true,
      prod_validation_mastering_qc : true,
      prod_validation_mastering_qc : true,
      prod_validation_mastering_qc_om : true,
      prod_validation_mastering_livraison : true,
      prod_validation_servicing_livraison : true,
      prod_conti_1: true,
      prod_conti_2: true,
      prod_conti_3: true,
      prod_conti_4: true,
      prod_fnl_conti_1: true,
      prod_fnl_conti_2: true,
      prod_casting_list: true,
      prod_dubbing_script: true,
      screener_dt_mix: true,
      prod_relecture_texte: true,
      prod_subtitles: true,
      prod_livraison_physique_safety: true,
      prod_livraison_physique_mix: true,
      prod_validation_cf: true,
      prod_travaux_regie: true,
      prod_ttal_dubbing_script: true,
      prod_ttal_as_rec: true,
      prod_dub_card_plattform: true,
      prod_dub_card_script: true,
      prod_localization_library: true,
      prod_asr_script: true,
      prod_script_vo: true,
      fabric_asr_script: true,
      prod_servicing_pad : true
    }
    service.noteInProdValidComponent = noteInProdValidComponent
    $rootScope.noteInProdValidComponent = noteInProdValidComponent

    const validItemActions = {
      prod_casting_list: true,
      prod_validation: true,
      prod_verif: true,
      prod_validation_mastering_regie : true,
      prod_validation_mastering_report : true,
      prod_validation_mastering_cf : true,
      prod_validation_mastering_original_master : true,
      prod_validation_mastering_qc : true,
      prod_validation_mastering_qc : true,
      prod_validation_mastering_qc_om : true,
      prod_validation_mastering_livraison : true,
      prod_validation_servicing_livraison : true,
      prod_conti_1: true,
      prod_conti_2: true,
      prod_conti_3: true,
      prod_conti_4: true,
      prod_fnl_conti_1: true,
      prod_fnl_conti_2: true,
      prod_script_vf: true,
      prod_screener: true,
      prod_dispo_doublage: true,
      prod_dubbing_script: true,
      screener_dt_mix: true,
      prod_relecture_texte: true,
      prod_subtitles: true,
      prod_livraison_physique_safety: true,
      prod_livraison_physique_mix: true,
      prod_validation_cf: true,
      prod_travaux_regie: true,
      prod_ttal_dubbing_script: true,
      prod_ttal_as_rec: true,
      prod_dub_card_plattform: true,
      prod_dub_card_script: true,
      prod_localization_library: true,
      prod_asr_script: true,
      prod_script_vo: true,
      fabric_asr_script: true,
      prod_servicing_pad: true
    }
    service.validItemActions = validItemActions
    $rootScope.validItemActions = validItemActions
    // partials/Components/suivi/prod_valid.html
    service.hasValidItem = function () {
      return function (action) {
        if (validItemActions[action]) {
          return true
        } else if (action.match(/prod_validation/)) {
          return true  
        }
        return false
      }      
    }
    const validNoteActions = {
    //   'prod_script_vo': true
    }
    service.validNoteActions = validNoteActions
    $rootScope.validNoteActions = validNoteActions
    service.hasValidNote = function () {
      return function (action) {
        if (validNoteActions[action]) {
          return true
        }
        return false
      }      
    }    



    service.hasClientNumber = function () {
      return function (action) {
        if (action.match(/client_number_.*/)) {
          return true  
        }
        return false
      }      
    } 
   

    return service;
  }

]);
