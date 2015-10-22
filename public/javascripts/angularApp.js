var app = angular.module('flapperNews', ['ui.router']);
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('posts', { 
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    })
    .state('home', {
      url: '/home', 
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['posts', function(posts) {
          return posts.getAll();
        }]
      }
    });

    $urlRouterProvider.otherwise('home');
}]);
app.factory('posts', ['$http', function($http) {
  var o = {};
  
  o.create = function(post) {
    return $http.post('/posts', post).success(function(data) {
      o.posts.push(data);
    });

  };
  o.getAll = function() {
    return $http.get('/posts').success(function(data) {
      angular.copy(data, o.posts);
    });
  };

  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res) {
      return res.data
    });
  };

  o.posts = [];

  return o;
}]);
app.controller('PostsCtrl', 
function($scope, $stateParams, posts, post) {
  $scope.post = post;
})
app.controller('MainCtrl', [
'$scope',
'posts',
function($scope, posts) {
  $scope.posts = posts.posts;

  $scope.addPost = function() {
    if(!$scope.title || $scope.title == '') { return; }

    posts.create({ link: $scope.link, title: $scope.title, upvotes: 0 });
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post) {
    post.upvotes += 1;
  };
}]);
