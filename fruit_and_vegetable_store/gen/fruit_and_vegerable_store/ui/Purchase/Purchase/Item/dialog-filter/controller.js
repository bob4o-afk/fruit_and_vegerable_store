angular.module('page', ["ideUI", "ideView"])
	.config(["messageHubProvider", function (messageHubProvider) {
		messageHubProvider.eventIdPrefix = 'fruit_and_vegetable_store.Purchase.Item';
	}])
	.controller('PageController', ['$scope', 'messageHub', 'ViewParameters', function ($scope, messageHub, ViewParameters) {

		$scope.entity = {};
		$scope.forms = {
			details: {},
		};

		let params = ViewParameters.get();
		if (Object.keys(params).length) {
			$scope.entity = params.entity ?? {};
			$scope.selectedMainEntityKey = params.selectedMainEntityKey;
			$scope.selectedMainEntityId = params.selectedMainEntityId;
			$scope.optionsProduct = params.optionsProduct;
			$scope.optionsPurchase = params.optionsPurchase;
			$scope.optionsCurrency = params.optionsCurrency;
		}

		$scope.filter = function () {
			let entity = $scope.entity;
			const filter = {
				$filter: {
					equals: {
					},
					notEquals: {
					},
					contains: {
					},
					greaterThan: {
					},
					greaterThanOrEqual: {
					},
					lessThan: {
					},
					lessThanOrEqual: {
					}
				},
			};
			if (entity.Id !== undefined) {
				filter.$filter.equals.Id = entity.Id;
			}
			if (entity.Name) {
				filter.$filter.contains.Name = entity.Name;
			}
			if (entity.Price !== undefined) {
				filter.$filter.equals.Price = entity.Price;
			}
			if (entity.Product !== undefined) {
				filter.$filter.equals.Product = entity.Product;
			}
			if (entity.AmountInShop !== undefined) {
				filter.$filter.equals.AmountInShop = entity.AmountInShop;
			}
			if (entity.Purchase !== undefined) {
				filter.$filter.equals.Purchase = entity.Purchase;
			}
			if (entity.Currency !== undefined) {
				filter.$filter.equals.Currency = entity.Currency;
			}
			messageHub.postMessage("entitySearch", {
				entity: entity,
				filter: filter
			});
			$scope.cancel();
		};

		$scope.resetFilter = function () {
			$scope.entity = {};
			$scope.filter();
		};

		$scope.cancel = function () {
			messageHub.closeDialogWindow("Item-filter");
		};

		$scope.clearErrorMessage = function () {
			$scope.errorMessage = null;
		};

	}]);