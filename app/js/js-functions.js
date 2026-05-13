/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var today = new Date();
var day, month;
if (today.getDate() < 10) {
    day = "0" + today.getDate();
} else {
    day = today.getDate();
}

if ((today.getMonth() + 1) < 10) {
    month = "0" + (today.getMonth() + 1);
} else {
    month = (today.getMonth() + 1);
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

var jour = today.getFullYear() + "-" + month + "-" + day;
var todaySQL = today.getFullYear() + "-" + month + "-" + day + " " + addZero(today.getHours()) + ":" + addZero(today.getMinutes()) + ":" + addZero(today.getSeconds());

function copyToClipboard(s) {
    if (window.clipboardData && clipboardData.setData) {
        clipboardData.setData('text', s);
    }
}

String.prototype.trunc = String.prototype.trunc ||
    function (n, r) {
        if (r == null) { r = '...' }
        return (this.length > n) ? this.substr(0, n - 1).toString() + r : this.toString();
    };

String.prototype.truncLink = String.prototype.truncLink ||
    function (n) {
        return (this.length > n) ? '...' + this.substr(this.length - n, this.length).toString() : this.toString();
    };

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.sansAccent = function () {
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'];

    var str = this;
    for (var i = 0; i < accent.length; i++) {
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
}

function colorizeWorkflow(workflow) {
    if (workflow.language == null) {
        workflow.language = {};
        workflow.language.name = "";
    }


    let calcul =
        workflow.exploitation_id +
        workflow.workflow_type_id +
        workflow.doublage_type_id +
        workflow.norme_mix_id +
        workflow.language.name +
        workflow.servicing_type_id +
        workflow.diffuseur_id +
        workflow.resolution_id;

    if(workflow.servicing_type_id != null) {
       calcul +=
           workflow.servicing_type_id +
           workflow.diffuseur_id +
           workflow.resolution_id;
    }

    if (workflow.workflow_type_id == 2)
    {
		if (workflow.speed)
			calcul += workflow.speed.name;
    }

    if(workflow.prod_version !== "Client") {
        calcul += "Autre";
    }
    let color = hexToRgb(intToHex(hashCode(
        calcul
    )));

    color.font = getContrastYIQ(color);

    return color;
}

function getContrastYIQ(color) {
    var yiq = ((color.r * 299) + (color.g * 587) + (color.b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

// Note 20220706
// java String#hashCode
// Implémentation fausse, mais utilisée pour gérer la couleur des workflows
// etrangement même si le résultat est différent, le code rgb est identique pour ceux que j'ai vérifié, quelques un
// je laisse, ça pourrait perturber la prod
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

// Version empruntée sur le net et certifiée correcte 20220706
function hashCode2 (str) {
    let h,i
    for( i = 0, h = 0; i < str.length; i++)
        h = Math.imul(31, h) + str.charCodeAt(i) | 0 
    return h
}

function intToHex(i) {
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        o: 1
    } : null;
}

function getMediaItemsByMatch(workflow_name, etape_name, action_name, items) {
    var itemsToReturns = []
    switch (workflow_name) {
        case "doublage":
            var itemRef = []
            var itemCub = []
            var itemVoVi = []
            var itemPyr = []
            var itemPro = []
            var itemAudio = []


            var cubRef = false
            var pyrRef = false
            var proRef = false
            var voViRef = false
            var audioRef = false

            switch (etape_name) {
                case "prepa_audio":
                    angular.forEach(items, function (item) {
                        // if (item.reference == 1) { // On met tous les items de référence
                        //   item.reference = true;
                        //   itemRef.push(item);
                        // }

                        if (item.support == "VCube / Prod" || item.support == "VCube" 
                        || item.support == "Image doublage" || item.support == 'Dubbing image') { // On récupère le dernier élément VCube sauf si ref
                            if (item.reference == 1) {
                                itemCub.push(item)
                                cubRef = true
                            }
                            if (!cubRef) {
                                if (itemCub.length == 0) {
                                    itemCub.push(item)
                                } else if (itemCub.date_creation < item.date_creation) {
                                    itemCub[0] = item
                                }
                            }
                        }

                        if (action_name == "prepa_audio_fusion") { // Si action de Fusion
                            if (item.support == "Pyramix / Prod") { // On récupère tous les pyramix sauf si ref
                                if (item.reference == 1) {
                                    itemPyr.push(item)
                                    pyrRef = true
                                }
                                if (!pyrRef) {
                                    itemPyr.push(item)
                                }
                            } else if (item.support == "Protools / Prod") { // On récupère tous les protools sauf si ref
                                if (item.reference == 1) {
                                    itemPro.push(item)
                                    proRef = true
                                }
                                if (!proRef) {
                                    itemPro.push(item)
                                }
                            }
                        } else { // Si autre action
                            if (item.support == "VO/VI" || item.support == "VO" || item.support == "VI" || item.support == "VF" || item.support == "OV") { // On récupère tous les Vo/Vi sauf si ref
                                if (item.reference == 1) {
                                    itemVoVi.push(item)
                                    voViRef = true
                                }
                                if (!voViRef) {
                                    itemVoVi.push(item)
                                }
                            }
                        }
                    })
                    break;
                case "livraison":
                    break; //TODO: On annule la remontée pour la livraison le temps de trouver une solution avec les demandes liées.
                    angular.forEach(items, function (item) {
                        // if (item.reference == 1) { // On met tous les items de référence
                        //   item.reference = true;
                        //   itemRef.push(item);
                        // }

                        if (action_name == "livraison_safety") { // Si action de Safety
                            if (item.support == "Protools / Safety") { // On récupère le dernier élément Protools / Safety
                                if (item.reference == 1) {
                                    itemPro.push(item)
                                    proRef = true
                                }
                                if (!proRef) {
                                    if (itemPro.length == 0) {
                                        itemPro.push(item)
                                    } else if (itemPro.date_creation < item.date_creation) {
                                        itemPro[0] = item
                                    }
                                }


                            }
                        } else if (action_name == "livraison_audio_dcp") { // Si action de Audio DCP
                            if (item.support == "Audio / DCP") { // On récupère le dernier élément Audio / DCP
                                if (item.reference == 1) {
                                    itemAudio.push(item)
                                    audioRef = true
                                }
                                if (!audioRef) {
                                    if (itemAudio.length == 0) {
                                        itemAudio.push(item)
                                    } else if (itemAudio.date_creation < item.date_creation) {
                                        itemAudio[0] = item
                                    }
                                }

                            }
                        }
                    })

                    break;
                default:
                    if (etape_name == "enregistrement" || etape_name == "mixage" || etape_name == "montage" || etape_name == "fabrication") {
                        angular.forEach(items, function (item) {

                            if (item.support == "Pyramix / Prod") { // On récupère le dernier élément pyramix
                                if (item.reference == 1) {
                                    itemPyr.push(item)
                                    pyrRef = true
                                }
                                if (!pyrRef) {
                                    if (itemPyr.length == 0) {
                                        itemPyr.push(item)
                                    } else if (itemPyr.date_creation < item.date_creation) {
                                        itemPyr[0] = item
                                    }
                                }
                            } else if (item.support == "Protools / Prod") { // On récupère le dernier élément protools
                                if (item.reference == 1) {
                                    itemPro.push(item)
                                    proRef = true
                                }
                                if (!proRef) {
                                    if (itemPro.length == 0) {
                                        itemPro.push(item)
                                    } else if (itemPro.date_creation < item.date_creation) {
                                        itemPro[0] = item
                                    }
                                }
                            } else if (item.support == "VCube / Prod" || item.support == "VCube" || item.support == "Image doublage" || item.support == 'Dubbing image') { // On récupère le dernier élément VCube
                                if (item.reference == 1) {
                                    itemCub.push(item)
                                    cubRef = true
                                }
                                if (!cubRef) {
                                    if (itemCub.length == 0) {
                                        itemCub.push(item)
                                    } else if (itemCub.date_creation < item.date_creation) {
                                        itemCub[0] = item
                                    }
                                }
                            }
                        })
                    }

            }
            if (itemRef.length > 0) {
                itemsToReturns = itemRef
            } else {
                itemsToReturns = itemCub.concat(itemVoVi, itemPyr, itemPro, itemAudio)
            }
            break;
        default:

    }

    return itemsToReturns
}

function sharedStart(array) {
    var A = array.concat().sort(),
        a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
}

function sendStandardNotif(notif, requests, services, subject, description, $filter, category, $rootScope, old_hash, field) {
    requests = objectInArray(requests);
    requests = $filter('orderBy')(requests, "product.human_description");
    var request_ids = [];
    requests.forEach(function (aReq) {
        request_ids.push(aReq.id);
    });

    var request = requests[0];

    if(request.planning_id == "digital-media") {
      if(services.indexOf("digitalmedia") == -1) {
        services += ",digitalmedia";
      }
    }

    if (requests.length == 1) {
        notif.request_id = requests[0].id;
    } else {
        notif.request_ids = request_ids.join(",");
    }

    var descs = [];
    requests.forEach(function (aReq) {
        if(aReq.product != null && aReq.product.human_description != null)
            descs.push(aReq.product.human_description);
    });
    notif.product_desc = "";
    if(descs.length !== 0) {
        var prefix = sharedStart(descs);
        notif.product_desc = request.product.human_description;
        var splitHumanDesc = request.product.human_description.split(" - ");
        for (var i = 1; i < requests.length; i++) {
            if (splitHumanDesc != null && splitHumanDesc.length == 3) {
                notif.product_desc += ", " + requests[i].product.human_description.substr(request.product.human_description.length - splitHumanDesc[2].length);
            } else {
                notif.product_desc += ", " + requests[i].product.human_description.substr(prefix.length);
            }
        }
    }
    notif.main_location = null
    if (request.action_type != null) {
        if (request.action_type.branch_id == 2 && (request.action_type.etape_type.name == 'enregistrement' || request.action_type.etape_type.name == 'montage' )) {
            if (parseInt(request.workflow.dub_place_value) & parseInt(request.action_type.etape_type.loc_value)) {
                notif.main_location = $rootScope.dubPlacesByLocValue[request.action_type.branch_id][request.action_type.etape_type.loc_value].id
            }
        }
        notif.etape_action = request.action_type.etape_type.value + " - " + request.action_type.value;
    }


    notif.title = subject + " | " + notif.product_desc + " | " + notif.etape_action;

    if (field != null) {
        notif.common_id = request.id + "_" + field
    }

    notif.services = services;
    notif.type = "standard";
    notif.project_id = request.product.subproject.project.id;
    notif.subproject_id = request.product.subproject.id;
    notif.planning_id = request.planning_id;
    notif.archived = 0;
    notif.postponed = 0;
    notif.subject = subject;
    notif.description = description;
    if (category != null) {
        notif.category = category;
    }
    if (old_hash != null) {
        notif.old_hash = old_hash;
    }
    notif.hash = getHashRequest(request);
    notif.origin_user_id = $.cookie('user_id');

    notif.$save();
}

function newActivityLogRequest(newComment, userId, requestId, text, oldValue, newValue) {
    newComment.text = text;
    newComment.user_id = userId;
    newComment.request_id = requestId;
    newComment.show_tech = true
    newComment.activity_log = true
    newComment.old_value = oldValue
    newComment.new_value = newValue
    newComment.$save();
}

function countObjects(objects) {
    var count = 0;
    angular.forEach(objects, function () {
        count += 1;
    });
    return count;
};

function objectInArray(object) {
    if (!Array.isArray(object)) {
        var array = []
        for (var objectKey in object) {
            array.push(object[objectKey])
        }
        return array
    } else {
        return object
    }
}

function getPathRole(role) {
    if (role == "technicien") {
        path = "requestsValidated"
    } else if (role == "production") {
        path = "accueil"
    } else if (role == "planning") {
        path = "accueil"
    } else if (role == "digitalmedia") {
        path = "requestsAutoTech"
    } else if (role == "compta") {
        path = "compta"
    } else {
        path = "accueil"
    }
    return path
}

function htmlToPlaintext(text) {
    return text ? String(text).replace(/<[^>]+>/gm, '') : '';
}

function getSupports() {
    return [
        {
            support: "Pyramix / Prod",
            nature: "Audio"
        }, {
            support: "Protools / Prod",
            nature: "Audio"
        }, {
            support: "Protools / Safety",
            nature: "Audio"
        }, {
            support: "Audio / DCP",
            nature: "Audio"
        }, {
            support: "Image doublage",
            nature: "Video"
        }, {
            support: "FCP / Prod",
            nature: "Video"
        }, {
            support: "FCP / Media Original Master",
            nature: "Video"
        }, {
            support: "FCP / Media Master",
            nature: "Video"
        }, {
            support: "Master BDIG",
            nature: "Video"
        }, {
            support: "Master HDCAM",
            nature: "Video"
        }, {
            support: "Master HDCAM SR",
            nature: "Video"
        }, {
            support: "PAD Fichier",
            nature: "Video"
        }, {
            support: "PAD Bande",
            nature: "Video"
        }, {
            support: "MP3 / Divers",
            nature: "Audio"
        }, {
            support: "BWF / Divers",
            nature: "Audio"
        }, {
            support: "Erytmo",
            nature: "Video"
        }, {
            support: "Screener",
            nature: "Video"
        }, {
            support: "Mpeg1",
            nature: "Video"
        }, {
            support: "VO/VI",
            nature: "Audio"
        }, {
            support: "VO",
            nature: "Audio"
        }, {
            support: "VI",
            nature: "Audio"
        }, {
            support: "VL",
            nature: "Audio"
        }];
}

function getItemsDescription(items) {
    angular.forEach(items, function (item) {
        item.description = ""
        if (item.layout != null) {
            item.description += "Layout : " + item.layout + '<br>'
        }
        if (item.speed_reception != null) {
            item.description += "Vitesse réception : " + item.speed_reception + '<br>'
        }
        if (item.speed != null) {
            item.description += "Vitesse travail : " + item.speed + '<br>'
        }
        if (item.origin != null) {
            item.description += "Vitesse travail : " + item.origin
        }
    })

    return items
}

function getHashRequest(request) {
    let datesDelay = request.delai_souhaite; // On récupère les dates pour le futur index
    if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) { // Si l'on a des séances farmers
        let datesDelayTemp = [];
        angular.forEach(request.ownFarmerbookings, function (farmer) {
            datesDelayTemp.push(moment(farmer.day).format('x')) // On transforme la date en timestamp UNIX et on l'ajoute à datesDelay pour l'index
        });
        datesDelay += datesDelayTemp.sort().join(''); // On tri les farmers bookings par dates et on fusionne le tableau
    }
    return hashCode2(JSON.stringify(request.action_type_id + request.workflow_id + datesDelay)); // L'index du tableau pour grouper les demandes
}

function getKeyGroup(request) {
    return request.product.subproject.project_id + request.product.subproject.id;
}

// deprecated 20210325, remplacé par setTimeDateWishByBranch
function setTimeDateWish(date, time) {
    switch (time) {
      case "D":
        date.start_time_h = 9;
        date.start_time_m = 30;
        date.end_time_h = 18;
        date.end_time_m = 30;
      break;
      case "AM":
        date.start_time_h = 9;
        date.start_time_m = 30;
        date.end_time_h = 13;
        date.end_time_m = 30;
      break;
      case "PM":
        date.start_time_h = 14;
        date.start_time_m = 30;
        date.end_time_h = 18;
        date.end_time_m = 30;
      break;
      case "E":
        date.start_time_h = 19;
        date.start_time_m = 0;
        date.end_time_h = 0;
        date.end_time_m = 0;
      break;
      default:
        date.start_time_h = null;
        date.start_time_m = null;
        date.end_time_h = null;
        date.end_time_m = null;
    }
    return date;
}


// fonction provisoire, 20210323
function setTimeDateWishByBranch (branchId, date, time) {
    switch (branchId) {
        case '1':
            setFrenchTimeDateWish(date, time)
        break
        case '2':
            setFrenchTimeDateWish(date, time)
        break
        case '3':
            setUSTimeDateWish(date, time)
        break                
        case '4':
            setItalianTimeDateWish(date, time)
        break
    }
}

// différents preset par branch, à mettre un jour ddans la base
function presetTimeBase (branchId) {
    const presets = {
        1: { 1: 'Journée', 2: 'Matinée', 3: 'Après-midi',  4: 'Soirée' },
        2: { 1: 'Day', 2: 'AM', 3: 'PM' },
        3: { 1: 'Day', 2: 'AM', 3: 'PM' },
        4: { 1: 'Giorno', 2: '1 turno', 3: 'turno pause', 4: '2 turno',  5: '3 turno', 6: '4 turno'}
    }
    return presets[branchId]
}


function setFrenchTimeDateWish (date, time) {
    date.start_time_h = null
    date.start_time_m = null
    date.end_time_h = null
    date.end_time_m = null     
    const preset = {
        1: {
            start_time_h: { title: '9', value: 9 },
            start_time_m: 30,
            end_time_h: { title: '18', value: 18 },
            end_time_m: 30
        },
        2: {
            start_time_h: { title: '9', value: 9 },
            start_time_m: 30,
            end_time_h: { title: '13', value: 13 },
            end_time_m: 30
        },
        3: {
            start_time_h: { title: '14', value: 14 },
            start_time_m: 30,
            end_time_h: { title: '18', value: 18 },
            end_time_m: 30
        },
        4: {
            start_time_h: { title: '19', value: 19 },
            start_time_m: 0,
            end_time_h: { title: '0', value: 0 },
            end_time_m: 0
        }
    }
    if (preset[time]) {
        date.start_time_h = preset[time].start_time_h
        date.start_time_m = preset[time].start_time_m
        date.end_time_h = preset[time].end_time_h
        date.end_time_m = preset[time].end_time_m
    }
}

function setUSTimeDateWish (date, time) {
    date.start_time_h = null
    date.start_time_m = null
    date.end_time_h = null
    date.end_time_m = null     
    const preset = {
        1: {
            start_time_h: { title: '9 am', value: 9 },
            start_time_m: 0,
            end_time_h: { title: '6 pm', value: 18 },
            end_time_m: 0
        },
        2: {
            start_time_h: { title: '9 am', value: 9 },
            start_time_m: 0,
            end_time_h: { title: '1 pm', value: 13 },
            end_time_m: 0
        },
        3: {
            start_time_h: { title: '2 pm', value: 14},
            start_time_m: 0,
            end_time_h: { title: '6 pm', value: 18},
            end_time_m: 0
        }
    }
    if (preset[time]) {
        date.start_time_h = preset[time].start_time_h
        date.start_time_m = preset[time].start_time_m
        date.end_time_h = preset[time].end_time_h
        date.end_time_m = preset[time].end_time_m
    }
}

function getHourOptions (branchId) {
    if (branchId == 3) {
        return [
            { title: '12 am', value: 0 },
            { title: '01 am', value: 1 },
            { title: '02 am', value: 2 },
            { title: '03 am', value: 3 },
            { title: '04 am', value: 4 },
            { title: '05 am', value: 5 },
            { title: '06 am', value: 6 },
            { title: '07 am', value: 7 },
            { title: '08 am', value: 8 },
            { title: '09 am', value: 9 },
            { title: '10 am', value: 10 },
            { title: '11 am', value: 11 },
            { title: '12 pm', value: 12 },
            { title: '01 pm', value: 13 },
            { title: '02 pm', value: 14 },
            { title: '03 pm', value: 15 },
            { title: '04 pm', value: 16 },
            { title: '05 pm', value: 17 },
            { title: '06 pm', value: 18 },
            { title: '07 pm', value: 19 },
            { title: '08 pm', value: 20 },
            { title: '09 pm', value: 21 },
            { title: '10 pm', value: 22 },
            { title: '11 pm', value: 23 }
        ]
    } else {
        return [
            { title: '0', value: 0 },
            { title: '1', value: 1 },
            { title: '2', value: 2 },
            { title: '3', value: 3 },
            { title: '4', value: 4 },
            { title: '5', value: 5 },
            { title: '6', value: 6 },
            { title: '7', value: 7 },
            { title: '8', value: 8 },
            { title: '9', value: 9 },
            { title: '10', value: 10 },
            { title: '11', value: 11 },
            { title: '12', value: 12 },
            { title: '13', value: 13 },
            { title: '14', value: 14 },
            { title: '15', value: 15 },
            { title: '16', value: 16 },
            { title: '17', value: 17 },
            { title: '18', value: 18 },
            { title: '19', value: 19 },
            { title: '20', value: 20 },
            { title: '21', value: 21 },
            { title: '22', value: 22 },
            { title: '23', value: 23 }
        ]        
    }


}

function setItalianTimeDateWish (date, time) {
    date.start_time_h = null
    date.start_time_m = null
    date.end_time_h = null
    date.end_time_m = null
    const preset = {
        1: {
            start_time_h: { title: '9', value: 9 },
            start_time_m: 0,
            end_time_h: { title: '19', value: 19 },
            end_time_m: 30
        },
        2: {
            start_time_h: { title: '9', value: 9 },
            start_time_m: 0,
            end_time_h: { title: '12', value: 12 },
            end_time_m: 0
        },
        3: {
            start_time_h: { title: '12', value: 12 },
            start_time_m: 30,
            end_time_h: { title: '13', value: 13 },
            end_time_m: 30
        },
        4: {
            start_time_h: { title: '13', value: 13 },
            start_time_m: 30,
            end_time_h: { title: '16', value: 16 },
            end_time_m: 30
        },
        5: {
            start_time_h: { title: '16', value: 16 },
            start_time_m: 30,
            end_time_h: { title: '19', value: 19 },
            end_time_m: 30
        },
        6: {
            start_time_h: { title: '19', value: 19 },
            start_time_m: 30,
            end_time_h: { title: '22', value: 22 },
            end_time_m: 30
        }
    }
    if (preset[time]) {
        date.start_time_h = preset[time].start_time_h
        date.start_time_m = preset[time].start_time_m
        date.end_time_h = preset[time].end_time_h
        date.end_time_m = preset[time].end_time_m
    }
}

// de 18h30 à 6:30 pm
const i18nHourCorrespondance = {
    '00': { 'h' : '12', 't': 'am' },
    '01': { 'h' : '01', 't': 'am' },
    '02': { 'h' : '02', 't': 'am' },
    '03': { 'h' : '03', 't': 'am' },
    '04': { 'h' : '04', 't': 'am' },
    '05': { 'h' : '05', 't': 'am' },
    '06': { 'h' : '06', 't': 'am' },
    '07': { 'h' : '07', 't': 'am' },
    '08': { 'h' : '08', 't': 'am' },
    '09': { 'h' : '09', 't': 'am' },
    '10': { 'h' : '10', 't': 'am' },
    '11': { 'h' : '11', 't': 'am' },
    '12': { 'h' : '12', 't': 'pm' },
    '13': { 'h' : '01', 't': 'pm' },
    '14': { 'h' : '02', 't': 'pm' },
    '15': { 'h' : '03', 't': 'pm' },
    '16': { 'h' : '04', 't': 'pm' },
    '17': { 'h' : '05', 't': 'pm' },
    '18': { 'h' : '06', 't': 'pm' },
    '19': { 'h' : '07', 't': 'pm' },
    '20': { 'h' : '08', 't': 'pm' },
    '21': { 'h' : '09', 't': 'pm' },
    '22': { 'h' : '10', 't': 'pm' },
    '23': { 'h' : '11', 't': 'pm' }
}

const hourI18nCorrespondance = {
    '00': { title: '12 am', value: 0 },
    '01': { title: '01 am', value: 1 },
    '02': { title: '02 am', value: 2 },
    '03': { title: '03 am', value: 3 },
    '04': { title: '04 am', value: 4 },
    '05': { title: '05 am', value: 5 },
    '06': { title: '06 am', value: 6 },
    '07': { title: '07 am', value: 7 },
    '08': { title: '08 am', value: 8 },
    '09': { title: '09 am', value: 9 },
    '10': { title: '10 am', value: 10 },
    '11': { title: '11 am', value: 11 },
    '12': { title: '12 pm', value: 12 },
    '13': { title: '01 pm', value: 13 },
    '14': { title: '02 pm', value: 14 },
    '15': { title: '03 pm', value: 15 },
    '16': { title: '04 pm', value: 16 },
    '17': { title: '05 pm', value: 17 },
    '18': { title: '06 pm', value: 18 },
    '19': { title: '07 pm', value: 19 },
    '20': { title: '08 pm', value: 20 },
    '21': { title: '09 pm', value: 21 },
    '22': { title: '10 pm', value: 22 },
    '23': { title: '11 pm', value: 23 }
}

const hourI18nCorrespondanceExceptUS = {
    '00': { title: '0', value: 0 },
    '01': { title: '1', value: 1 },
    '02': { title: '2', value: 2 },
    '03': { title: '3', value: 3 },
    '04': { title: '4', value: 4 },
    '05': { title: '5', value: 5 },
    '06': { title: '6', value: 6 },
    '07': { title: '7', value: 7 },
    '08': { title: '8', value: 8 },
    '09': { title: '9', value: 9 },
    '10': { title: '10', value: 10 },
    '11': { title: '11', value: 11 },
    '12': { title: '12', value: 12 },
    '13': { title: '13', value: 13 },
    '14': { title: '14', value: 14 },
    '15': { title: '15', value: 15 },
    '16': { title: '16', value: 16 },
    '17': { title: '17', value: 17 },
    '18': { title: '18', value: 18 },
    '19': { title: '19', value: 19 },
    '20': { title: '20', value: 20 },
    '21': { title: '21', value: 21 },
    '22': { title: '22', value: 22 },
    '23': { title: '23', value: 23 }
}

function getI18nObjectFromHour (branchId) {
    return function (hour) {
        if (!hour) {
            return null
        }
        if (branchId == 3) {
            return hourI18nCorrespondance[hour]
        } else {
            return hourI18nCorrespondanceExceptUS[hour]
        }            
    }
}

function transformHourInI18nFormat (branchId) {
    return function (hour) {
        if (!hour) {
            return null
        }
        if (branchId == 3) {
            let splitted = hour.split('h')
            if (!splitted[1]) {
                splitted = hour.split(':')
            }
            return i18nHourCorrespondance[splitted[0]].h + ':' + splitted[1] + ' ' + i18nHourCorrespondance[splitted[0]].t
        } else {
            return hour
        }
    }
}

// return js unixtime (with milliseconds)
// start format 18h30 \d\dh\d\d idem pour end
function rebuildDateFromLanternPuzzle (day, start, end) {
    start = new Date(day.replace('00:00:00', start.replace('h', ':') + ':00')).getTime()
    end = new Date(day.replace('00:00:00', end.replace('h', ':') + ':00')).getTime()
    return { start: start, end: end }
}

function getMomentFormatWithHour (branchId) {
    return function () {
        if (branchId == 1) {
            return 'dddd Do MMMM YYYY \à HH:mm'
        } else if (branchId == 2) {
            return 'dddd Do MMMM YYYY HH:mm'
        } else if (branchId == 3) {
            return 'dddd Do MMMM YYYY hh:mm A'
        } else if (branchId == 4) {
            return 'dddd Do MMMM YYYY HH:mm'
        }
    }
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getPlaceHolderFormatDate (branchId) {
    return function (instant) {
        if (instant === 'start') {
            if (branchId == 1) {
                return 'ex: 09:00'
            } else if (branchId == 2) {
                return 'ex: 09:00'
            } else if (branchId == 3) {
                return 'ex: 09:00 am'
            } else if (branchId == 4) {
                return 'ex: 09:00'
            }
        }
        if (instant === 'end') {
            if (branchId == 1) {
                return 'ex: 18:00'
            } else if (branchId == 2) {
                return 'ex: 18:00'
            } else if (branchId == 3) {
                return 'ex: 06:00 pm'
            } else if (branchId == 4) {
                return 'ex: 18:00'
            }
        }
    }
}

function getPlaceHolderFormatDateByMode (mode) {
    return function (instant) {
        if (instant === 'start') {
            if (mode == 'basic') {
                return 'ex: 09:00'
            } else if (mode == 'us') {
                return 'ex: 09:00 am'
            } else {
                return 'ex: 09:00'
            }
        }
        if (instant === 'end') {
            if (mode == 'basic') {
                return 'ex: 18:00'
            } else if (mode == 'us') {
                return 'ex: 06:00 pm'
            } else {
                return 'ex: 18:00'
            }
        }
    }
}

function getPatternFormatDateByMode (mode) {
    return function (instant) {
            if (mode == 'basic') {
                return '\\d{2}:\\d{2}'
            } else if (mode == 'us') {
                return '\\d{2}:\\d{2} (am|pm)'
            } else {
                return '\\d{2}:\\d{2}'
            }
    }
}



// moving data in an array
// move to common library
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    }  

let interactJS = {

    //let position = { x: 0, y: 0 }
    // let edges = { left: true, right: true,   bottom: true,  top: true }
    //sample : interactJS.interact_execution('.dragresize',{x:'data-x',y:'data-y'},edges,position);
    interact_execution: function (class_reference, attributes, edges, position, handle) {
        //when overflow is set, force to display title of the modal
        $(class_reference).animate({ scrollTop: 0 }, "fast");

        interact(class_reference)
        .draggable({
            allowFrom: handle,
            inertia: true,
            autoScroll: true,
            listeners: {
                start (event) {
                },
                move (event) {
                    position.x += event.dx
                    position.y += event.dy
                    event.target.style.webkitTransform = event.target.style.transform = `translate(${position.x}px, ${position.y}px)`           
                },
                end (event) {
                    position.x += event.dx
                    position.y += event.dy
                    event.target.style.webkitTransform = event.target.style.transform = `translate(${position.x}px, ${position.y}px)`     
                    let target = event.target      
                    target.setAttribute(attributes.x, position.x)
                    target.setAttribute(attributes.y, position.y) 
                    interactJS.end_drag_action()              
                }
            }
        })  
        .resizable({
            edges: edges,
            inertia: {
                resistance: 30,
                minSpeed: 200,
                endSpeed: 100
              },    
            modifiers: [
                // keep the edges inside the parent
                interact.modifiers.restrictEdges({
                outer: 'parent'
                }),
                // minimum size
                interact.modifiers.restrictSize({
                min: { width: 800, height: 100 }
                })
            ]    
        })  
        .on('resizemove', function (event) {
            
            let target = event.target
            let x = (parseFloat(target.getAttribute(attributes.x)) || 0)
            let y = (parseFloat(target.getAttribute(attributes.y)) || 0)
    
            // update the element's style
            target.style.width = event.rect.width + 'px'
            target.style.height = event.rect.height + 'px'
    
            // translate when resizing from top or left edges
            x += event.deltaRect.left
            y += event.deltaRect.top
            
            target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px,' + y + 'px)'
    
            target.setAttribute(attributes.x, x)
            target.setAttribute(attributes.y, y)
        })  

    },
    end_drag_action: function () {


    }
}

const slugify = str =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');


// Clear the LocalStorage keys 
function clearSelectedLocalStorageKeys(keysToRemove) {
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

function listAndClearLocalStorageKeys(keysToRemove,prefix ) {
  // Get all keys in localStorage
  const keys = Object.keys(localStorage);
  // Filter keys matching the prefix
  const matchingKeys = keys.filter(key => key.startsWith(prefix));
  // Log the matching keys
  console.info('Matching LocalStorage keys:', matchingKeys);
  // Call clearSelectedLocalStorageKeys() with the keys to remove
  function clearLocalStorageKeys(keysToRemove) {
    if (keysToRemove.length === 0) {
      clearSelectedLocalStorageKeys(matchingKeys);
    } else {
      clearSelectedLocalStorageKeys(keysToRemove);
    }
  }
  // Call clearLocalStorageKeys() when needed
  clearLocalStorageKeys(keysToRemove);
}