var app = angular.module('flapperNews', ['ui.router']);
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: function($state, auth) {
        if(auth.isLoggedIn()) {
          $state.go('home');
        }
      }
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: function($state, auth) {
        if(auth.isLoggedIn()) {
          $state.go('home');
        }
      }
    })
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
app.factory('auth', function($http, $window) {
  var auth = {};

  auth.saveToken = function(token) {
    $window.localStorage['flapper-news-token'] = token;
  };

  auth.getToken = function() {
    return $window.localStorage['flapper-news-token'];
  };

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if(token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > (Date.now() / 1000);
    } else {
      return false;
    }
  };

  auth.currentUser = function() {
    if(auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user) {
    return $http.post('/register', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(user) {
    return $http.post('/login', user).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('flapper-news-token');
  };

  return auth;
});
app.factory('posts', ['auth', '$http', function(auth, $http) {
  var o = {};
  
  o.getHeader = function() {
    return {
      headers: {
        Authorization: 'Bearer ' + auth.getToken()
      }
    };
  };

  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, o.getHeader());
  };

  o.create = function(post) {
    return $http.post('/posts', post, o.getHeader()).success(function(data) {
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
  
  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, o.getHeader()).then(function(res) {
      return res.data;
    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, o.getHeader()).then(function(res) {
      return res.data;
    });
  };

  o.posts = [];

  return o;
}]);
app.controller('NavCtrl', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
});
app.controller('AuthCtrl', function($scope, $state, auth) {
  $scope.user = {};

  $scope.register = function() {
    auth.register($scope.user).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $state.go('home');
    });
  };

  $scope.logIn = function() {
    auth.logIn($scope.user).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $state.go('home');
    });
  };
});
app.controller('PostsCtrl', 
function($scope, posts, post, auth) {
  $scope.post = post;

  $scope.isLoggedIn = auth.isLoggedIn;
  
  $scope.upvoteComment = function(comment) {
    posts.upvoteComment(post, comment).then(function(newComment) {
      angular.copy(newComment, comment);
    }); 
  };

  $scope.upvote = function() {
    posts.upvote(post);
  };

  $scope.addComment = function() {
    if($scope.body === '') { return; }

    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user'
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });

    $scope.body = '';
  };
})
app.controller('MainCtrl', function($scope, posts, auth) {
  $scope.posts = posts.posts;

  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addPost = function() {
    if(!$scope.title || $scope.title == '') { return; }

    posts.create({ link: $scope.link, title: $scope.title, upvotes: 0 });
    $scope.title = '';
    $scope.link = '';
  };

  $scope.incrementUpvotes = function(post) {
    posts.upvote(post).then(function(newPost) {
      angular.copy(newPost, post);
    });
  };
});
