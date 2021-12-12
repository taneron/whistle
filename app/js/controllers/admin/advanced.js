GL.
controller("AdminAdvancedCtrl", ["$scope", function($scope) {
  $scope.tabs = [
    {
      title:"Main configuration",
      template:"views/admin/advanced/tab1.html"
    }
  ];

  if ($scope.resources.node.root_tenant) {
    $scope.tabs.push({
      title:"Anomaly detection thresholds",
      template:"views/admin/advanced/tab2.html"
    });
  }

  $scope.resetSubmissions = function() {
    $scope.Utils.deleteDialog().then(function() {
      return $scope.Utils.applyConfig("reset_submissions");
    });
  };

  $scope.toggleEncryption = function() {
    if ($scope.resources.node.encryption) {
      $scope.Utils.openConfirmableModalDialog("views/modals/enable_encryption.html").then(
      function() {
        $scope.resources.node.encryption = true;
        $scope.resources.node.escrow = false;
        $scope.Utils.update($scope.resources.node, function() {
          if(!$scope.resources.preferences.encryption) {
            $scope.Authentication.logout();
          }
	});
      },
      function() {
        $scope.resources.node.encryption = false;
      });
    }
  };
}]);
