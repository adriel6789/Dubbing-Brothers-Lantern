'use strict';

Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

angular.module('Lantern').filter('weekFilter', function () {
    return function (demandes) {
        return demandes.filter(function (demande) {
            if (demande.day != null) {
                var today = new Date();
                var t = demande.day.split(/[- :]/);
                var dateDemande = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);


                if (today.getWeek() == dateDemande.getWeek() && today.getTime() < dateDemande.getTime()) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('propsFilter', function () {
    return function (items, props) {
        var out = [];
        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop] != null && item[prop].toString().toLowerCase().sansAccent().indexOf(text.sansAccent()) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    }
});

angular.module('Lantern').filter('projectFilter', function ($filter) {
    return function (projects, favorites) {
        let out = [];
        if (angular.isArray(projects) && angular.isArray(favorites)) {
            projects.forEach(function (project) {
                if (!$filter('filter')(favorites, {'id':project.id}, true).length > 0) {
                    out.push(project);
                }
            });
        } else {
            // Let the output be the input untouched
            out = projects;
        }

        return out;
    }
});

angular.module('Lantern').filter('nextWeekFilter', function () {
    return function (requests) {
        return requests.filter(function (request) {
            if (request.ownFarmerbookings != null) {
                var willShow = false;
                angular.forEach(request.ownFarmerbookings, function (farmer) {
                    var today = new Date();
                    var dayNextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    var t = farmer.day.split(/[- :]/);
                    var dateFarmer = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

                    if (dayNextWeek.getWeek() == dateFarmer.getWeek() && today.getTime() < dateFarmer.getTime()) {
                        willShow = true;
                    }
                });
                if (willShow) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('nextWeekFilterFarmer', function () {
    return function (farmers) {
        return farmers.filter(function (farmer) {
            var willShow = false;
            var today = new Date();
            var dayNextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            var t = farmer.day.split(/[- :]/);
            var dateFarmer = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);


            if (dayNextWeek.getWeek() == dateFarmer.getWeek() && today.getTime() < dateFarmer.getTime()) {
                willShow = true;
            }
            if (willShow) {
                return true;
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('followingWeekFilterFarmer', function () {
    return function (farmers) {
        return farmers.filter(function (farmer) {
            var willShow = false;
            var today = new Date();
            var dayNextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
            var t = farmer.day.split(/[- :]/);
            var dateFarmer = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

            if (dayNextWeek.getWeek() == dateFarmer.getWeek() && today.getTime() < dateFarmer.getTime()) {
                willShow = true;
            }
            if (willShow) {
                return true;
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('dateInWeek', function ($filter) {
    return function (demandes, jour) {
        return demandes.filter(function (demande) {
            if (demande.ownFarmerbookings != null) {
                var willShow = false;
                demande.ownFarmerbookings.forEach(function (farmer) {
                    var t = farmer.day.split(/[- :]/);
                    var dateFarmer = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
                    var dateDay = $filter('date')(dateFarmer, 'EEE');
                    if (jour == dateDay) {
                        willShow = true;
                    }

                });
                if (willShow) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('rangeForPlannedRequests', function ($filter) {
    return function (requests, dateStart, dateEnd, onlyNextBooking) {
        if (requests != null) {
            return requests.filter(function (request) {

                var found = false
                if (dateStart != "" && dateEnd != "") {
                    var start = dateStart.split('-');
                    var end = dateEnd.split('-');

                    var startDate = new Date(start[2], start[1] - 1, start[0]).getTime();
                    var endDate = new Date(end[2], end[1] - 1, end[0]).getTime();

                    if (startDate != null && endDate != null && request.action_type.planning == 'parallele') {
                        if (request.date_start != null) {
                            var months = [];
                            months['Janvier'] = 0;
                            months['Février'] = 1;
                            months['Mars'] = 2;
                            months['Avril'] = 3;
                            months['Mai'] = 4;
                            months['Juin'] = 5;
                            months['Juillet'] = 6;
                            months['Août'] = 7;
                            months['Septembre'] = 8;
                            months['Octobre'] = 9;
                            months['Novembre'] = 10;
                            months['Décembre'] = 11;

                            var date_start_split = request.date_start.split(' ')
                            var date_start = new Date(date_start_split[2], months[date_start_split[1]], date_start_split[0])

                            if (date_start >= startDate && date_start <= endDate) {
                                found = true
                            }
                        }
                    } else if (startDate != null && endDate != null && request.ownFarmerbookings != null) {
                        if (onlyNextBooking) {
                            if (request.next_farmerbooking != null) {
                                var dt = request.next_farmerbooking.day.split(' ');
                                var t = dt[0].split('-');

                                var currentTime = new Date(t[0], t[1] - 1, t[2]);
                                if (currentTime >= startDate && currentTime <= endDate) {
                                    found = true;
                                }
                            }
                        } else {
                            angular.forEach(request.ownFarmerbookings, function (farmer) {
                                var dt = farmer.day.split(' ');
                                var t = dt[0].split('-');

                                var currentTime = new Date(t[0], t[1] - 1, t[2]);
                                if (currentTime >= startDate && currentTime <= endDate) {
                                    found = true;
                                    //requestsTemp.push(request);
                                }
                            });
                        }
                    }
                } else {
                    found = true
                }

                return found
            });
        }

    };
});


angular.module('Lantern').filter('dateInWeekFarmer', function ($filter) {
    return function (farmers, day) {
        return farmers.filter(function (farmer) {
            var dateFarmer = moment(farmer.day)
            return moment(day.format('YYYY-MM-DD')).isSame(dateFarmer.format('YYYY-MM-DD'), 'day')
        });
    };
});

angular.module('Lantern').filter('dateInWeekFarmerValidated', function ($filter) {
    return function (farmerEntities, day) {
        if (farmerEntities != null) {
            return farmerEntities.filter(function (farmerEntity) {
                if(farmerEntity.length > 0){
                    var dateFarmer = moment(farmerEntity[0].day)
                    if (moment().subtract(1, 'days').isSame(day, 'day')) {
                        return moment(day.format('YYYY-MM-DD')).isSameOrAfter(dateFarmer.format('YYYY-MM-DD'), 'day')
                    } else {
                        return moment(day.format('YYYY-MM-DD')).isSame(dateFarmer.format('YYYY-MM-DD'), 'day')
                    }
                }
            });
        }
    };
});

// gestion de l'heure du laitier 20220517
angular.module('Lantern').filter('MilkManDateInWeekFarmerValidated', function ($filter) {
    return function (farmerEntities, day) {
        if (farmerEntities != null) {
            return farmerEntities.filter(function (farmerEntity) {
                if (farmerEntity.length > 0){
                    if (farmerEntity[0].milkManDay) {
                        const dateFarmer = moment(farmerEntity[0].milkManDay)
                        if (moment().subtract(1, 'days').isSame(day, 'day')) {
                            return moment(day.format('YYYY-MM-DD')).isSameOrAfter(dateFarmer.format('YYYY-MM-DD'), 'day')
                       } else {
                           return moment(day.format('YYYY-MM-DD')).isSame(dateFarmer.format('YYYY-MM-DD'), 'day')
                       }                        
                    } else {
                        const dateFarmer = moment(farmerEntity[0].day)
                        if (moment().subtract(1, 'days').isSame(day, 'day')) {
                            return moment(day.format('YYYY-MM-DD')).isSameOrAfter(dateFarmer.format('YYYY-MM-DD'), 'day')
                       } else {
                           return moment(day.format('YYYY-MM-DD')).isSame(dateFarmer.format('YYYY-MM-DD'), 'day')
                       }
                    }
                }
            })
        }
    }
})    

angular.module('Lantern').filter('farmerDate', function () {
    return function (request, dateFilter) {
        return request.filter(function (request) {
            if (request.ownFarmerbookings != null) {
                var willShow = false;
                request.ownFarmerbookings.forEach(function (farmer) {
                    var found = farmer.day.indexOf(dateFilter);
                    if (found != -1) {
                        willShow = true;
                    }
                });
                if (willShow) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        });
    };
});

angular.module('Lantern').filter('userComment', function () {
    return function (comments) {
        comments = objectInArray(comments);
        var comments_to_return = [];
        for (var i = 0; i < comments.length; i += 1) {
            if (comments[i].activity_log || comments[i].text == "" || comments[i].text == null) continue;
            comments_to_return.push(comments[i]);
        }
        return comments_to_return;
    };
});

angular.module('Lantern').filter('workflowFilter', function () {
    return function (products, workflow) {
        if (products != null && workflow != null) {
            return products.filter(function (product) {
                if (product.sharedWorkflow != null) {
                    var willShow = false;
                    product.sharedWorkflow.forEach(function (prodWorkflow) {
                        if (prodWorkflow.id == workflow.id) {
                            willShow = true;
                        }
                    });
                    return willShow;
                } else {
                    return false;
                }

            });
        } else {
            return false;
        }
    };
});

angular.module('Lantern').filter('asDate', function () {
    return function (dateString) {
        if (dateString != null) {
            if (dateString.match(/\//)) {
                return dateString;
            } else {
                var o = dateString.replace(/-/g, "/");
                return Date.parse(o)
            }

        } else {
            
            return null;
        }
    };
});

angular.module('Lantern').filter('asDateSQL', function () {
    return function (dateString) {
        if (dateString != null) {
            var o = moment(dateString).format("DD/MM/YYYY");
            return Date.parse(o);
        } else {
            return null;
        }
    };
});

angular.module('Lantern').filter('dateSectionFilter', function ($filter) {
    return function (notifs, date) {
        return notifs.filter(function (notif) {
            var now = moment();
            var yesterday = moment();
            yesterday.subtract(1, 'days');
            var last_week = moment();
            last_week.subtract(7, 'days');
            var more_two_week = moment();
            more_two_week.subtract(14, 'days');

            var today_check = moment(notif.date_creation).isSame(now, 'day');
            var yesterday_check = moment(notif.date_creation).isSame(yesterday, 'day');
            var this_week_check = moment(notif.date_creation).isSame(now, 'week');
            var last_week_check = moment(notif.date_creation).isSame(last_week, 'week');
            var more_two_week_check = moment(notif.date_creation).isBefore(last_week);

            switch (date) {
                case 'today':
                    if (today_check) {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                case 'yesterday':
                    if (yesterday_check) {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                case 'this_last_week':
                    if (last_week_check || (this_week_check && !today_check && !yesterday_check)) {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                case 'more_two_week':
                    if (more_two_week_check) {
                        return true;
                    } else {
                        return false;
                    }
                    break;
                default:
                    return true;
                    break;
            }
        });
    };
});

angular.module('Lantern').filter('notInGroup', function ($filter) {
    return function (requests) {
        return requests.filter(function (request) {
            if (request != null && !request.in_group) {
                return request
            } else {
                return null;
            }
        });
    };
});

angular.module('Lantern').filter('filterRequest', function ($filter) {
    return function (requests, textFilter, enableFilterWorkflow) {
        if (requests != null) {
            return requests.filter(function (request) {
                var requestTemp = request
                if (request[0] != null && request[0].request != null) {
                    requestTemp = request[0].request
                }
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (requestTemp.id != null && requestTemp.id.toString().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (requestTemp.product != null && requestTemp.product.human_description != null && requestTemp.product.human_description.toLowerCase().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (requestTemp.tech_writer_user != null && requestTemp.tech_writer_user.person != null && (requestTemp.tech_writer_user.person.lastname.toLowerCase().indexOf(textFilter) != -1 || requestTemp.tech_writer_user.person.firstname.toLowerCase().indexOf(textFilter) != -1)) {
                        found = true;
                    }

                    if (requestTemp.user != null && requestTemp.user.person != null && requestTemp.user.person.lastname && (requestTemp.user.person.lastname.toLowerCase().indexOf(textFilter) != -1 || requestTemp.user.person.firstname.toLowerCase().indexOf(textFilter) != -1)) {
                        found = true;
                    }
                    if( enableFilterWorkflow != undefined && enableFilterWorkflow ){
                        if (requestTemp.workflow != null && requestTemp.workflow.format_mix != null && (requestTemp.workflow.format_mix.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.format_mix.key.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }
                        if (requestTemp.workflow != null && requestTemp.workflow.exploitation != null && (requestTemp.workflow.exploitation.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.exploitation.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }

                        if (requestTemp.workflow != null && requestTemp.workflow.norme_mix != null && (requestTemp.workflow.norme_mix.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.norme_mix.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }

                        if (requestTemp.workflow != null && requestTemp.workflow.workflow_type != null && (requestTemp.workflow.workflow_type.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.workflow_type.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }

                        if (requestTemp.workflow != null && requestTemp.workflow.doublage_type != null && (requestTemp.workflow.doublage_type.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.doublage_type.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }

                        if (requestTemp.workflow != null && requestTemp.workflow.language != null && (requestTemp.workflow.language.value.toLowerCase().indexOf(textFilter) != -1 || requestTemp.workflow.language.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }

                        if (requestTemp.action_type != null &&
                            ((requestTemp.action_type.value != null && requestTemp.action_type.value.toLowerCase().indexOf(textFilter) != -1) || (requestTemp.action_type.etape_type != null && requestTemp.action_type.etape_type.value.toLowerCase().indexOf(textFilter) != -1 ))){
                            found = true;
                        }
                            //get out it of the condition if  bug
                        if (requestTemp.action_type != null && (requestTemp.action_type.name != null && requestTemp.action_type.name.toLowerCase().indexOf(textFilter) != -1 || requestTemp.action_type.etape_type != null && requestTemp.action_type.etape_type.name.toLowerCase().indexOf(textFilter) != -1)) {
                            found = true;
                        }
                    }

                    if (requestTemp.product != null && requestTemp.product.subproject.project.client != null && requestTemp.product.subproject.project.client.name.toLowerCase().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (requestTemp.date_creation != null) {
                        var filtered;
                        filtered = $filter('asDate')(requestTemp.date_creation);
                        filtered = $filter('date')(filtered, "dd/MM/yyyy HH:mm");
                        if (filtered.indexOf(textFilter) != -1) {
                            found = true;
                        }
                    }

                    if (requestTemp.planification_date != null) {
                        var filtered;
                        filtered = $filter('asDate')(requestTemp.planification_date);
                        filtered = $filter('date')(filtered, "dd/MM/yyyy HH:mm");
                        if (filtered.indexOf(textFilter) != -1) {
                            found = true;
                        }
                    }

                    if (requestTemp.ownFarmerbookings != null) {
                        angular.forEach(requestTemp.ownFarmerbookings, function (farmer) {
                            var filtered;
                            filtered = $filter('asDate')(farmer.day);
                            filtered = $filter('date')(filtered, "dd/MM/yyyy");
                            if (filtered.indexOf(textFilter) != -1) {
                                found = true;
                            }
                        });
                    }

                    if (found) {
                        return request;
                    } else {
                        return null;
                    }
                } else {
                    return request;
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterProduct', function ($filter) {
    return function (products, textFilter) {
        if (products != null) {
            return products.filter(function (product) {
                let productTemp = product
                if (product[0] != null && product[0].product != null) {
                    productTemp = product[0].product
                }
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent()
                    let found = false
                    if (productTemp.episode_number != null && productTemp.episode_number.toString().indexOf(textFilter) != -1) {
                        found = true
                    }
                    if (productTemp.episode_number != null && productTemp.episode_number.toString().toLowerCase().indexOf(textFilter) != -1) {
                        found = true
                    }
                    if (productTemp.title_vo != null && productTemp.title_vo.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true
                    }
                    if (productTemp.title_vf != null && productTemp.title_vf.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true
                    }
                    if (productTemp.description_text != null && productTemp.description_text.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true
                    }

                    if (productTemp.description != null && productTemp.description.name != null && productTemp.description.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true
                    }

                    if (productTemp.description != null && productTemp.description.value != null && productTemp.description.value.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true
                    }

                    if (found) {
                        return product
                    } else {
                        return null
                    }
                } else {
                    return product
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterEtape', function ($filter) {
    return function (etapes, textFilter) {
        if (etapes != null) {
            return etapes.filter(function (etape) {
                var etapeTemp = etape
                if (etape[0] != null && etape[0].etape != null) {
                    etapeTemp = etape[0].etape
                }
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (etapeTemp.action != null && etapeTemp.action.value != null && etapeTemp.action.value.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (etapeTemp.action != null && etapeTemp.action.etape_type != null && etapeTemp.action.etape_type.value != null && etapeTemp.action.etape_type.value.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (found) {
                        return etape;
                    } else {
                        return null;
                    }
                } else {
                    return etape;
                }
            });
        }
    };
});


angular.module('Lantern').filter('filterProjectName', function ($filter) {
    return function (projects, textFilter) {
        if (projects != null) {
            return projects.filter(function (project) {
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase();
                    var found = false;
                    if (project.name != null && project.name.toLowerCase() == textFilter) {
                        found = true;
                    }
                    if (project.code_name != null && project.code_name.toLowerCase() == textFilter) {
                        found = true;
                    }
                    if (project.code_name_2 != null && project.code_name_2.toLowerCase() == textFilter) {
                        found = true;
                    }
                    if (project.code_name_3 != null && project.code_name_3.toLowerCase() == textFilter) {
                        found = true;
                    }

                    if (found) {
                        return project;
                    } else {
                        return null;
                    }
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterProjectByNameOrClient', function ($filter) {
    return function (projects, textFilter, rights) {
        if (!projects) {
            return;
        }
        else if (!textFilter) {
            return projects;
        }
        else {
            const term = textFilter.toLowerCase();
            // Return the array and filter it by looking for any occurrences of the search term in each items id or name.
            return projects.filter(function (item) {
                let termInId = false
                if (item.name_format != null) {
                    termInId = item.name_format.toLowerCase().indexOf(term) > -1;
                }
                let termInName = false
                if (item.client != null && item.client.name != null) {
                    termInName = item.client.name.toLowerCase().indexOf(term) > -1;
                }
                // added 20210209 cherche nom original ou nom de code si compta
                if (rights && item.protected && item.name) {
                    termInId = item.name.toLowerCase().indexOf(term) > -1;
                    if (!termInId && item.name_format) {
                        termInId = item.name_format.toLowerCase().indexOf(term) > -1;
                    }
                }
                return termInId || termInName;
            });
        }
    };
});

angular.module('Lantern').filter('filterProjectByNameOrCodeNameOrClient', function ($filter) {
    return function (projects, textFilter) {
        if (!projects) {
            return;
        }
        else if (!textFilter) {
            return projects;
        }
        else {
            var term = textFilter.toLowerCase().sansAccent();
            // Return the array and filter it by looking for any occurrences of the search term in each items id or name.
            return projects.filter(function (item) {
                let termInName = false;
                if (item.name != null) {
                    termInName = item.name.toLowerCase().sansAccent().indexOf(term) > -1;
                }
                let termInCodeName = false;
                if (item.code_name != null) {
                    termInCodeName = item.code_name.toLowerCase().sansAccent().indexOf(term) > -1;
                }
                let termInCodeName2 = false;
                if (item.code_name_2 != null) {
                    termInCodeName2 = item.code_name_2.toLowerCase().sansAccent().indexOf(term) > -1;
                }
                let termInCodeName3 = false;
                if (item.code_name_3 != null) {
                    termInCodeName3 = item.code_name_3.toLowerCase().sansAccent().indexOf(term) > -1;
                }
                let termInClient = false;
                if (item.client != null && item.client.name != null) {
                    termInClient = item.client.name.toLowerCase().sansAccent().indexOf(term) > -1;
                }
                return termInName || termInCodeName || termInCodeName2 || termInCodeName3 || termInClient;
            });
        }
    };
});

angular.module('Lantern').filter('filterTemplate', function ($filter) {
    return function (templates, textFilter) {
        if (templates != null) {
            return templates.filter(function (template) {
                var templateTemp = template
                if (template[0] != null && template[0].template != null) {
                    templateTemp = template[0].template
                }
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (templateTemp.name != null && templateTemp.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (found) {
                        return template;
                    } else {
                        return null;
                    }
                } else {
                    return template;
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterSubProjectNameOrClient', function ($filter) {
    return function (subprojects, textFilter) {
        if (subprojects != null) {
            return subprojects.filter(function (subproject) {
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (subproject.project.show_name != undefined && subproject.project.show_name != null && subproject.project.show_name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }
                    if (subproject.project.client.name != null && subproject.project.client.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }
                    if (subproject.nature.name == 'serie' && subproject.season != null && ('saison '+subproject.season).toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }
                    if (subproject.nature.name != 'serie' && subproject.nature.name != null && subproject.nature.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (found) {
                        return subproject;
                    } else {
                        return null;
                    }
                } else {
                    return subproject;
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterSubProjectWorkflow', function ($filter) {
    return function (subprojects, workflowFilter) {
        if (subprojects != null) {
            return subprojects.filter(function (subproject) {
                if (workflowFilter != null) {
                    var found = false;
                    angular.forEach(subproject.ownProduct, function(product) {
                        angular.forEach(product.sharedWorkflow, function(workflow) {
                            if(workflow.workflow_type.name == workflowFilter || (workflowFilter == 'doublage_mastering' && (workflow.workflow_type.name == 'doublage' || workflow.workflow_type.name == 'mastering'))) {
                                found = true;
                            }
                        });
                    });
                    if (found) {
                        return subproject;
                    } else {
                        return null;
                    }
                } else {
                    return subproject;
                }
            });
        }
    };
});

angular.module('Lantern').filter('filterProductWorkflow', function ($filter) {
    return function (products, workflowFilter) {
        if (products != null) {
            if (workflowFilter != null) {
                var filtered = [];
                angular.forEach(products, function(product) {
                    angular.forEach(product.sharedWorkflow, function(workflow) {
                        if(workflow.workflow_type.name == workflowFilter || (workflowFilter == 'doublage_mastering' && (workflow.workflow_type.name == 'doublage' || workflow.workflow_type.name == 'mastering'))) {
                            if (filtered.indexOf(product) == -1) {
                                filtered.push(product);
                            }
                        }
                    });
                });
                return filtered;
            } else {
                return products;
            }
        }
    };
});

angular.module('Lantern').filter('filterTemplateWorkflow', function ($filter) {
    return function (workflows, template) {
      if(!workflows) {
        return;
      } else if(!template) {
        return workflows;
      } else {
        var filtered = [];
        angular.forEach(workflows, function(workflow) {
          if (workflow.workflow_type_id == template.workflow_type_id) {
            if (!workflow.doublage_type_id && !template.doublage_type_id || workflow.doublage_type_id == template.doublage_type_id) {
              if (!workflow.norme_mix_id && !template.norme_mix_id || workflow.norme_mix_id == template.norme_mix_id) {
                filtered.push(workflow);
              }
            }
          }
        })
        return filtered;
      }
    };
});

angular.module('Lantern').filter('filterReturnUsername', function ($filter) {
    return function (returns, textFilter) {
        if (returns != null) {
            return returns.filter(function (aReturn) {
                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (aReturn.fullname != null && aReturn.fullname.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (found) {
                        return aReturn;
                    } else {
                        return null;
                    }
                } else {
                    return aReturn;
                }
            });
        }
    };
});

angular.module('Lantern').filter('magicFilter', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ')
            angular.forEach(list, function (item) {
                if (item.date_creation != null) {
                    item.date_creation_search = $filter('date')($filter('asDate')(item.date_creation), "dd/MM/yyyy")
                }
            })
            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filter')(results, text)
            })
            angular.forEach(list, function (item) {
                delete item.date_creation_search
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('magicFilterRequest', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ')
            angular.forEach(list, function (item) {
                if (item.date_creation != null) {
                    item.date_creation_search = $filter('date')($filter('asDate')(item.date_creation), "dd/MM/yyyy")
                }
            })

            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filterRequest')(results, text)
            })
            angular.forEach(list, function (item) {
                delete item.date_creation_search
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('magicFilterProduct', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ')

            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filterProduct')(results, text)
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('magicFilterProductType', function ($filter) {
  return function (list, productType) {
    if (!list) {
      return;
    }
    if (productType === undefined) {
      return list;
    }
    return list.filter(function (item) {
      return item.type == productType;
    });
  };
});

angular.module('Lantern').filter('magicFilterEtape', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else if (textFilter.length < 2) {
            return list
        }        
        else {
            var textArray = textFilter.split(' ')

            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filterEtape')(results, text)
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('showGroupCard', function ($filter) {
    return function (items, textFilter, hideAllFarmersSent ,enableFilterWorkflow) {
        if (hideAllFarmersSent == null) hideAllFarmersSent = false;
        var result = $filter('magicFilterGroupRequest')(items, textFilter, hideAllFarmersSent, enableFilterWorkflow);
        var filtered = [];
        angular.forEach(result, function (item) {
            if (item.noRequest == null || item.noRequest == false){
                  //level requests
                    angular.forEach(item.requests, function (request,k) {
                            if(request.to_hide != undefined && request.to_hide){
                                delete item.requests[k];
                            }
                        });

                        // level sortedRequests
                    angular.forEach(item.sortedRequests, function (sortedRequest,r) {
                        angular.forEach(sortedRequest.requests, function (request,k) {
                            if(request.to_hide != undefined && request.to_hide){
                                delete sortedRequest.requests[k];
                            }
                        });
                    });
            filtered.push(item);
            } 
        });
        return filtered;
    };
});



angular.module('Lantern').filter('magicFilterGroupRequest', function ($filter) {
    return function (list, textFilter, hideAllFarmersSent, enableFilterWorkflow) {
        if (!list) {
            return;
        }
        else {
            if (hideAllFarmersSent == null) hideAllFarmersSent = false;
            if (textFilter == null) textFilter = "";
            var result = {};
            var textArray = textFilter.split(' ');
            angular.forEach(list, function (groupOfRequests, key) {
                 groupOfRequests.noRequest = true;  // this variable need to e outside of the loop
                angular.forEach(groupOfRequests.requests, function (request) {
                    if (hideAllFarmersSent && request.ownFarmerbookings != null) {
                        var isAllFarmerSent = true;
                        for (var i = 0; i < request.ownFarmerbookings.length; i += 1) {

                            if (request.ownFarmerbookings[i].is_selected != 1 &&
                                moment(request.ownFarmerbookings[i].day).isSame(moment().set({'hour':0,'minute':0,'second':0,'millisecond':0})))
                            { isAllFarmerSent = false; break; }
                        }
                    }
                    if (textFilter == "") {
                        if (!isAllFarmerSent) {
                            result[key] = groupOfRequests;
                            groupOfRequests.noRequest = false;
                        }
                    } else if (groupOfRequests.requests != null) {
                            request.to_hide = true;
                        if (request.date_creation != null) {
                            request.date_creation_search = $filter('date')($filter('asDate')(request.date_creation), "dd/MM/yyyy")
                        }
                        var not_show = null;
                        angular.forEach(textArray, function (text) {
                            if ((not_show == null || not_show == false) && $filter('filterRequest')([request], text, enableFilterWorkflow).length > 0) {
                                not_show = false;
                            } else {
                                not_show = true;
                            }
                        });
                        if (isAllFarmerSent) {
                            not_show = true;
                        }
                        if (not_show == false) {
                            groupOfRequests.noRequest = false;
                            request.to_hide = false;
                            result[key] = groupOfRequests;
                        } else {
                           // groupOfRequests.noRequest = true; // please never do that! it's a wrong logic
                        }
                    }
                })
                //var request = groupOfRequests.requests[0];

            })
            return result;
        }
    };
});

angular.module('Lantern').filter('magicFilterTemplate', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ')

            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filterTemplate')(results, text)
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('magicFilterReturnUsername', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ')

            var results = list
            angular.forEach(textArray, function (text) {
                results = $filter('filterReturnUsername')(results, text)
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('showGroupCardForDate', function ($filter) {
    return function (items, startDate, endDate) {
        if (startDate == null) startDate = false;
        if (endDate == null) endDate = false;
        var result = $filter('filterGroupRequestByDate')(items, startDate, endDate);
        var filtered = [];
        angular.forEach(result, function (item) {
            if (item.noRequestDate == null || item.noRequestDate == false) filtered.push(item);
        });
        return filtered;
    };
});

angular.module('Lantern').filter('filterGroupRequestByDate', function ($filter) {
    return function (list, startDate, endDate) {
        if (!list) {
            return;
        }
        else if (startDate == null || endDate == null) {
            return list;
        }
        else {
            if (startDate == null) startDate = "";
            if (endDate == null) endDate = "";
            var result = {};
            angular.forEach(list, function (groupOfRequests, key) {
                if (startDate == "" && endDate == "") {
                    result[key] = groupOfRequests;
                    groupOfRequests.noRequestDate = false;
                } else if (groupOfRequests.requests != null) {
                    var not_show = null;
                    groupOfRequests.noRequestDate = true;
                    angular.forEach(groupOfRequests.requests, function (request) {
                        if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) { // Si l'on a des séances farmers
                            //mainList.noRequest = true;
                            for (var i = 0; i < request.ownFarmerbookings.length; i += 1) {
                                var date_timestamp = moment(request.ownFarmerbookings[i].day).format('x');

                                if (date_timestamp >= startDate && date_timestamp <= endDate) {

                                    groupOfRequests.noRequestDate = false;
                                    break;
                                }


                                //not_show = true;
                            }
                        }
                        else {
                            if (request.delai_souhaite != null) {
                                var delai_souhaite_array = request.delai_souhaite.split(',');
                                //mainList.noRequest = true;
                                for (var i = 0; i < delai_souhaite_array.length; i += 1) {
                                    if (delai_souhaite_array[i] >= startDate && delai_souhaite_array[i] <= endDate) {
                                        groupOfRequests.noRequestDate = false;
                                        break;
                                    }
                                }
                            }
                        }



                        if (groupOfRequests.noRequestDate == false) {
                            groupOfRequests.noRequestDate = false;
                            result[key] = groupOfRequests;
                        } else {
                            //groupOfRequests.noRequestDate = true;
                        }
                    })



                }


            })
            return result;
        }
    };
});

angular.module('Lantern').filter('filterRequestTechByDate', function ($filter) {
    return function (list, startDate, endDate) {
        if (!list) {
            return;
        } else if (startDate == null || endDate == null || startDate == "" || endDate == "") {
            return list;
        } else {
            if (startDate == null) startDate = "";
            if (endDate == null) endDate = "";
            var result = [];

            angular.forEach(list, function(request) {

              let noDate = true;
              let found = false

              if (request.ownFarmerbookings != null && request.ownFarmerbookings.length > 0) {
                angular.forEach(request.ownFarmerbookings, function(farmer) {
                  if (farmer.is_wish == 1) {
                    noDate = false;
                    if (moment(farmer.day).format('x') >= startDate && moment(farmer.day).format('x') <= endDate) {
                      found = true;
                    }
                  }
                });
                if (found) {
                  result.push(request);
                }
              }

              if (noDate) {
                let date_creation = moment(request.date_creation).hours(0).minute(0).second(0).millisecond(0).format('x');
                if (date_creation >= startDate && date_creation <= endDate)
                  result.push(request);
              }
            })

            return result;
        }
    };
});

angular.module('Lantern').filter('orderObjectBy', function () {
    return function (items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function (item) {
            filtered.push(item);
        });
        filtered.sort(function (a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if (reverse) filtered.reverse();
        return filtered;
    };
});

angular.module('Lantern').filter('orderNotifs', function () {
    return function (items, importantFirst) {
        var notifs = [];
        var importantNotifs = [];
        angular.forEach(items, function (item) {
            if(importantFirst && ((item.request != null && item.request.important == 1) || (item.requests != null && item.requests[0].important == 1))) {
                importantNotifs.push(item);
            } else {
                notifs.push(item);
            }
        });

        return importantNotifs.concat(notifs);
    };
});

angular.module('Lantern').filter('magicFilterNotif', function ($filter) {
    return function (list, textFilter) {
        if (!list) {
            return;
        }
        else if (!textFilter) {
            return list;
        }
        else {
            var textArray = textFilter.split(' ');
            var results = list;
            angular.forEach(textArray, function (text) {
                results = $filter('filterNotif')(results, text)
            })
            if (results.length > 0) return results
        }
    };
});

angular.module('Lantern').filter('filterNotif', function ($filter) {
    return function (notifs, textFilter) {
        if (notifs != null) {
            return notifs.filter(function (notif) {

                if (textFilter != null) {
                    textFilter = textFilter.toLowerCase().sansAccent();
                    var found = false;

                    if (notif.origin_user && notif.origin_user.firstname != null && notif.origin_user.firstname.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                      found = true;
                    }

                    if (notif.origin_user && notif.origin_user.lastname != null && notif.origin_user.lastname.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                      found = true;
                    }

                    if (notif.product_desc != null && notif.product_desc.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                      found = true;
                    }

                    if (notif.etape_action != null && notif.etape_action.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                      found = true;
                    }

                    let requestTemp = notif.request;
                    if (notif.requests != null && notif.requests[0] != null) {
                        requestTemp = notif.requests[0]
                    }

                    if (requestTemp.product != null && requestTemp.product.subproject.project.client != null && requestTemp.product.subproject.project.client.name.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (requestTemp.workflow != null && requestTemp.workflow.language != null && requestTemp.workflow.language.value.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (requestTemp.workflow != null && requestTemp.workflow.norme_mix != null && requestTemp.workflow.norme_mix.value.toLowerCase().sansAccent().indexOf(textFilter) != -1) {
                        found = true;
                    }

                    if (found) {
                        return notif;
                    } else {
                        return null;
                    }
                } else {
                    return notif;
                }
            });
        }
    };
});

angular.module('Lantern').filter('addLineBreakForExcel', function () {
    return function (text) {
        // return text.replace(/\n/sg, "<br style='mso-data-placement:same-cell;'>");
        return text.replace(/\n/g, "<br style='mso-data-placement:same-cell;'>");
    };
});

angular.module('Lantern').filter('filterReturnsResolved', function() {
    return function (returns, hideResolved) {
        if (returns != null) {
            return returns.filter(function (aReturn) {
                if (hideResolved) {
                    if (aReturn.is_resolved == 1) {
                        return null;
                    } else {
                        return aReturn;
                    }
                } else {
                    return aReturn;
                }
            });
        }
    }
});

angular.module('Lantern').filter('filterReturnsAction', function() {
    return function (returns, action) {
        if (returns != null) {
            return returns.filter(function (aReturn) {
                if (action) {
                    switch (action) {
                      case "is_ignored":
                        return aReturn.is_ignored == 1 ? aReturn : null;
                      case "is_not_done":
                        return aReturn.is_not_done == 1 ? aReturn : null;
                      case "to_review":
                        return aReturn.to_review == 1 ? aReturn : null;
                      case "to_mix":
                        return aReturn.to_mix == 1 ? aReturn : null;
                      case "is_resolved":
                        return aReturn.is_resolved == 1 ? aReturn : null;
                      case "none":
                        return (aReturn.is_ignored != 1 && aReturn.is_not_done != 1 && aReturn.to_review != 1 && aReturn.to_mix != 1 && aReturn.is_resolved != 1) ? aReturn : null;
                      default:
                        return aReturn;
                    }
                } else {
                    return aReturn;
                }
            });
        }
    }
});

// filtre utilisé dans app/components/dateRequestPopup.html
angular.module('Lantern').filter('filterDayNotPlanned', function($filter) {
    return function (dateStartEnd, originalDates) {
        if (dateStartEnd != null) {
            if (originalDates.length > 0) {
                return dateStartEnd.filter(function (date) {
                    let oDates = $filter('filter')(originalDates, {
                      day: date.day,
                      is_farmer: true
                    }, true);
                    if (oDates.length == 0) {
                        return date;
                    } else {
                        return null;
                    }
                });
            } else {
                return dateStartEnd;
            }
        }
    }
});

angular.module('Lantern').filter('uniqueMediaFilter', function() {
    return function (arr, field) {
        var o = {}, i, l = arr.length, r = [];
        for(i=0; i<l;i+=1) {
            o[arr[i][field]] = arr[i];
        }
        for(i in o) {
            if (o[i][field]) {
                r.push(o[i]);
            }
        }
        r.sort(function(a, b) {
            return (a[field] > b[field]) ? 1 : ((b[field] > a[field]) ? -1 : 0);
        });
        return r;
    };        
});
