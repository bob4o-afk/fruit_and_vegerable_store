/*
 * Generated by Eclipse Dirigible based on model and template.
 *
 * Do not modify the content as it may be re-generated again.
 */
angular.module('page', ['ideUI', 'ideView', 'entityApi'])
	.config(['messageHubProvider', function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'fruit_and_vegetable_store.launchpad.Home';
	}])
	.config(['entityApiProvider', function (entityApiProvider) {
		entityApiProvider.baseUrl = '/services/js/fruit_and_vegetable_store/gen/fruit_and_vegerable_store/ui/launchpad/Home/tiles.js';
	}])
	.controller('PageController', ['$scope', 'messageHub', 'entityApi', function ($scope, messageHub, entityApi) {
		$scope.state = {
			isBusy: true,
			error: false,
			busyText: 'Loading...',
		};

		$scope.openView = function (location) {
			messageHub.postMessage('openView', {
				location: location
			});
		};

		entityApi.list().then(function (response) {
			if (response.status != 200) {
				messageHub.showAlertError('Home', `Unable to get Home Launchpad: '${response.message}'`);
				$scope.state.isBusy = false;
				$scope.state.error = true;
				return;
			}
			$scope.state.isBusy = false;
			$scope.data = response.data;
			$scope.groups = Object.keys(response.data);
		}, function (error) {
			console.error(error);
			$scope.state.error = true;
		});
	}]);