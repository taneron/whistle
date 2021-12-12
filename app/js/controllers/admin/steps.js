GL.controller("AdminStepAddCtrl", ["$scope",
  function($scope) {
    $scope.new_step = {};

    $scope.add_step = function() {
      var step = new $scope.AdminUtils.new_step($scope.questionnaire.id);
      step.label = $scope.new_step.label;
      step.order = $scope.newItemOrder($scope.questionnaire.steps, "order");

      step.$save(function(new_step){
        $scope.questionnaire.steps.push(new_step);
        $scope.new_step = {};
      });
    };
  }
]).
controller("AdminStepEditorCtrl", ["$scope", "$http", "AdminStepResource", "AdminFieldResource",
  function($scope, $http, AdminStepResource, AdminFieldResource) {
    $scope.editing = false;
    $scope.new_field = {};

    $scope.showAddTrigger = false;
    $scope.new_trigger = {"field": "", "option": "", "sufficient": true};

    $scope.fields = $scope.step.children;
    $scope.fieldResource = AdminFieldResource;

    $scope.toggleEditing = function () {
      $scope.editing = $scope.editing ^ 1;
    };

    $scope.toggleAddTrigger = function () {
      $scope.showAddTrigger = !$scope.showAddTrigger;
    };

    $scope.save_step = function(step) {
      step = new AdminStepResource(step);
      return $scope.Utils.update(step);
    };

    $scope.showAddQuestion = $scope.showAddQuestionFromTemplate = false;
    $scope.toggleAddQuestion = function() {
      $scope.showAddQuestion = !$scope.showAddQuestion;
      $scope.showAddQuestionFromTemplate = false;
    };

    $scope.toggleAddQuestionFromTemplate = function() {
      $scope.showAddQuestionFromTemplate = !$scope.showAddQuestionFromTemplate;
      $scope.showAddQuestion = false;
    };

    $scope.delField = function(field) {
      return $scope.Utils.deleteResource($scope.fieldResource, $scope.fields, field);
    };

    $scope.add_field = function() {
      var field = $scope.AdminUtils.new_field($scope.step.id, "");
      field.label = $scope.new_field.label;
      field.type = $scope.new_field.type;
      field.attrs = $scope.resources.get_field_attrs(field.type);
      field.y = $scope.newItemOrder($scope.fields, "y");

      if (field.type === "fileupload") {
        field.multi_entry = true;
      }

      field.$save(function(new_field){
        $scope.fields.push(new_field);
        $scope.new_field = {};
      });
    };

    $scope.add_field_from_template = function() {
      var field = $scope.AdminUtils.new_field($scope.step.id, "");
      field.template_id = $scope.new_field.template_id;
      field.instance = "reference";
      field.y = $scope.newItemOrder($scope.fields, "y");

      field.$save(function(new_field) {
        $scope.fields.push(new_field);
        $scope.new_field = {};
      });
    };

    $scope.delTrigger = function(trigger) {
      $scope.step.triggered_by_options.splice($scope.step.triggered_by_options.indexOf(trigger), 1);
    };

    function swap($event, index, n) {
      $event.stopPropagation();

      var target = index + n;
      if (target < 0 || target >= $scope.questionnaire.steps.length) {
        return;
      }

      var a = $scope.questionnaire.steps[target];
      var b = $scope.questionnaire.steps[index];
      $scope.questionnaire.steps[target] = b;
      $scope.questionnaire.steps[index] = a;

      return $http({
        method: "PUT",
        url: "api/admin/steps",
        data: {
          "operation": "order_elements",
          "args": {
            "ids": $scope.questionnaire.steps.map(function(s) { return s.id; }),
            "questionnaire_id": $scope.questionnaire.id,
           },
        },
      });
    }

    $scope.moveUp = function(e, idx) { swap(e, idx, -1); };
    $scope.moveDown = function(e, idx) { swap(e, idx, 1); };

    $scope.addTrigger = function() {
      $scope.step.triggered_by_options.push($scope.new_trigger);
      $scope.toggleAddTrigger();
      $scope.new_trigger = {"field": "", "option": "", "sufficient": true};
    };
  }
]);
