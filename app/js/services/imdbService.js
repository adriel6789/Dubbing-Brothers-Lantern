'use strict';

Lantern.factory('ImdbService', ['$http','ApiRest', '$q',
  function($http, ApiRest, $q) {
    var service = {};

    service.searchByTitle = function (params, successCallback, errorCallback) {
      ApiRest.get('/imdb/searchmovie', params, function (response) {
        if(!response) return errorCallback(response);
        var formattedResponse = response.map(function (item) {
          return {
            id: null,
            imdb_id: item.imdb_id,
            vote_count: item.vote_count,
            vote_average: item.vote_average,
            title: item.title,
            release_date: item.start_year + '-01-01',
            original_title: item.original_title,
            source: 'imdb'
          }
        });
        return successCallback(formattedResponse)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getMovieByImdbId = function (params, successCallback, errorCallback){
        ApiRest.get('/imdb/searchbyimdbid', params, function (response) {
            if (response.error !== undefined)
                return errorCallback(response);
            return successCallback(response);
          }, function(error) {
            return errorCallback(error);
          });
    }

    service.getEpisodesSaisonById = function (params, successCallback, errorCallback) {
      ApiRest.get('/imdb/episodessaisonbyid', params, function (response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getEpisodesSaisonByIdDefer = function (params) {
      var deferred = $q.defer();
      ApiRest.get('/imdb/episodessaisonbyid', params, function (response) {
        deferred.resolve(response);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

    service.getIdFromTmdb = function (params, successCallback, errorCallback) {
      ApiRest.get('/projects/getimdbidfromtmdb', params, function (response) {
        return successCallback(response)
      }, function(error) {
        return errorCallback(error);
      });
    }

    service.getMovieByImdbId = function (params, successCallback, errorCallback){
      ApiRest.get('/imdb/searchbyimdbid', params, function (response) {
          if (response.error !== undefined)
              return errorCallback(response);
          return successCallback(response);
        }, function(error) {
          return errorCallback(error);
        });
    }


    return service;
  }
]);
