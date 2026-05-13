'use strict';

angular.module('Lantern')
  .factory('htmlCacheBuster', function() {
    return {
      'request': function(config) {
        if (config.url.indexOf('views') !== -1) {
          config.url = config.url + '?v=___REPLACE_IN_GULP___';
        }
        return config;
      }
    }
  })
  .config(['$httpProvider',function($httpProvider) {
    $httpProvider.interceptors.push('htmlCacheBuster');
  }]);