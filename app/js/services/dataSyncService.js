/*
    synchronizing tool to get real time data from database 
    A new service must be declared :)
*/
Lantern.factory('dataSync', 
    ['$rootScope','ApiRest','$interval','$timeout', 'Session', '$resource', '$location','$state','$q',
    'ContextualInfo','Attachments',
     function($rootScope,ApiRest,$interval,$timeout, Session,$resource,$location,$state, $q,
        ContextualInfo,Attachments) {

        /** Functions to get data from API Rest(ler) */
        checkContextInfo = function (string_products,done) {
            let products_found = {}
            ContextualInfo.byProducts(
                {products: string_products}, 
                function (result) {
                Object.keys(result).forEach(
                    function (product_id) {
                        products_found[product_id] = result[product_id];
                    }
                )
                return done(products_found);
                }
            )
        }    

        checkAttachements = function (string_products,done) {
            let products_found = {}
            Attachments.byProducts(
                {products: string_products}, 
                function (result) {
                Object.keys(result).forEach(
                    function (product_id) {
                        products_found[product_id] = result[product_id];
                    }
                )
                return done(products_found);
                }
            )
        }

        checkReturns = function (list_products,done) {
            ApiRest.post('/returns/byproducts', {},list_products,function (result) {
                return done(result);
            })
        }

        checkFarmers = function (products,done) {
            let subproject_id = service.getCurrentSubprojectId();
            let list_products = []
            let list_requests = []
            products.forEach(function(product) {
                list_products.push( parseInt(product.id,10))
                product.cells.forEach(function (cell) {
                    if (cell.action && cell.action.allow_request == "1") {
                        cell.requests.forEach(function (request) {
                            list_requests.push(request.id)
                        })
                    }
                })
             })  
            ApiRest.post('/requests/checkFarmersBooking', {},
                                        {'products':list_products,
                                        'requests':list_requests,
                                        'last_time': service.getSubprojectDate("farmers",subproject_id)
                                        },function (result) {
                service.setSubprojectDate("farmers",subproject_id);
                return done(result);
            })            
        }

        checkTechFarmers = function (booking_list,done) {
            let subproject_id = service.getCurrentSubprojectId();
            ApiRest.post('/Farmerbookings/checkFarmersBooking', {},
                                        {'bookings':booking_list,
                                        'last_time': service.getSubprojectDate("farmertech",subproject_id)
                                        },function (result) {
                service.setSubprojectDate("farmertech",subproject_id);
                return done(result);
            })               

        }

        checkSuiviCells = function (data_requested,done) {
            let subproject_id = service.getCurrentSubprojectId();
            ApiRest.post('/TableauSuiviCells/getdatabyproducts', {},
                            data_requested,
                            function (result) { 
                                return done(result);
                            }) 
        }

        /**
         * End of function to synchronize with database
         * 
         * Elements with can be synchronized
         * Adding an element requires to add a line to this service and a function
         * This function get data AND must not know about what is done of them
         */
        let service = {
            'elements':{
                'contextInfos' : {id:null,delay: intervals_config.contextInfos || 60000,action:checkContextInfo},
                'attachments' : {id:null,delay: intervals_config.attachments || 60000,action:checkAttachements},
                'returns' : {id:null,delay: intervals_config.returns || 60000,action:checkReturns},
                'farmers' : {id:null,dates:{},delay: intervals_config.farmers || 60000,action:checkFarmers},
                'farmertech':{id:null,dates:{},delay: intervals_config.farmertech || 60000,action:checkTechFarmers},
                'suivicells':{id:null,dates:{},delay: intervals_config.suivicells || 60000,action:checkSuiviCells}

            },
            'variables':{
                'current_page':undefined,
                'subproject_id':undefined
            },
            location_change_reference:null


        };

        /** $interval must be ended when page is closed 
         *  $interval in this library work for a specific page not for the root
         *  if current page is not present any more, $interval must be stopped
         * Note that new sync commands are timeouted 
        */

        $rootScope.$watch(function(){
            return $location.path();
          }, function(value) {
            var regex = new RegExp(service.variables.current_page);
            if (!value.match(regex) ) {
                Object.keys(service.elements).forEach(
                    function (element) {
                        if (service.elements[element].id) {
                            $interval.cancel(service.elements[element].id);
                            service.elements[element].id = undefined          
                        }
                    }
                )
                service.variables.current_page =  undefined    
            }
          })          

          /**
           * Start each element to synchronize with database
           * 
           * $scope is current scope of calling controller
           * 
           * Element are stored in list
           * 
           */
        service.startSync = function (one_start,$scope,list) {
            let delay_timeout = 50 
            let delay_timeout_main = 500 

            let ai = 100;
            Object.keys(list).forEach(
                function (clef) {
                    let delay_intervals = service.elements[clef].delay || 60000
                    
                    ai += 100;
                    if (one_start) {
                        
                        $timeout( function () {
                            list[clef]($scope,service.elements[clef].action)
                         },delay_timeout + ai
                        )
                        
                    }
                    $timeout( function () {
                        // can stop interval if id is defined
                        if (service.elements[clef].id) {
                            $interval.cancel(service.elements[clef].id);
                            service.elements[clef].id = undefined   
                        }
                        service.elements[clef].id = $interval(function () {
                            list[clef]($scope,service.elements[clef].action)
                        
                        },delay_intervals);
                    },delay_timeout_main+ai);
                    
                }

            )
        }

        service.getCurrentWatchedPage = function () {
            return service.variables.current_page
        }

        service.addPage2watch = function (page) {
            service.variables.current_page = page
        }
        service.setLocationChangeReference = function (reference,$scope) {
            service.location_change_reference = reference
            service.scope = $scope
        }
        service.unsetLocationChangeReference = function () {
            service.scope.$on('$destroy', service.location_change_reference);
            service.location_change_reference = null
            service.scope = null
        }        

        /**
         *  For farmer and request data, check data since last time data was requested
         * 
         *  set each time data are synchorinized for a subproject
         */
        service.setSubprojectDate = function (element,subproject_id) {
            service.elements[element].dates[subproject_id] = Math.round(new Date().getTime() / 1000);
        }
        service.getSubprojectDate = function (element,subproject_id) {
            return service.elements[element].dates[subproject_id];
        }  
        
        service.setCurrentSubprojectId = function (subproject_id) {
            service.variables.subproject_id = subproject_id
        }
        service.getCurrentSubprojectId = function (element,subproject_id) {
            return service.variables.subproject_id
        }    
        
        service.stopSynchro = function (done) {
            Object.keys(service.elements).forEach(
                function (element) {
                    if (service.elements[element].id) {
                        $interval.cancel(service.elements[element].id);
                        service.elements[element].id = undefined          
                    }
                }
            )
            if (done) {
                return done();
            }
            
        }
        
        return service;
    }
    ]
)