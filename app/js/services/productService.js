'use strict';

/* Services */
Lantern.factory('ProductService', ['$rootScope', 'ApiRest', 'Session', '$q',
  function($rootScope, ApiRest, Session, $q) {
    let service = {};
    service.getProducts = function(params, successCallback, errorCallback) {
      ApiRest.get('/products', params, function(products) {
        return successCallback(products)
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.getProduct = function(params, successCallback, errorCallback) {
      ApiRest.get('/products/'+params.id, {}, function(product) {
        return successCallback(product)
      }, function(error) {
        return errorCallback(error);
      });
    };
      /**
       * Get a product and allows the use of deferred promise
       * @param id : product Id
       * @returns {*} : deferred promise
       */
      service.getProductDefer = function(id){
          let params = {};
          params.id = id;
          let deferred = $q.defer();
          service.getProduct(params, function(product){
              deferred.resolve(product);
          }, function(error){
              deferred.reject(error);
          });
          return deferred.promise;
      };

    service.updateProduct = function(params, data, successCallback, errorCallback) {
      ApiRest.put('/products/update', params, data, function(response) {
        return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.postProduct = function(params, data, successCallback, errorCallback) {
      ApiRest.post('/products', params, data, function(response) {
       return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.updateFactoryAccess = function(data, successCallback, errorCallback) {
      ApiRest.post('/products/factoryaccess', {}, data, function(response) {
       return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.deleteProduct = function(params, successCallback, errorCallback) {
      ApiRest.delete('/products/'+params.id, {}, function(response) {
        return successCallback(response);
      }, function(error) {
        return errorCallback(error);
      });
    };

    service.downloadDubxScript = function(params, successCallback, errorCallback) {
      ApiRest.getBlob(`/products/download-dubx-script/${params.dubxId}`, {}, function(response) {
        return successCallback(response);
      }, function (error) {
        return errorCallback(error);
      })
    }

    service.getProductNameFromRequest = function(request) {
        let productName;
        if (request.product.subproject.nature.name === 'serie') {
            productName = (request.product.type == 0 ? $rootScope._T["xxxzi2yb"] : $rootScope._T["h12xqsuf"]) + " " + request.product.episode_number;
        } else if (request.product.subproject.nature.name === 'film') {
            productName = request.product.description.value;
        } else {
            productName = request.product.description_text;
        }
        return productName;
    };

    return service;
  }
]);
