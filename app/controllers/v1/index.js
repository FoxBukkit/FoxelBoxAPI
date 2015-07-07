function registerFile(file, route) {
	var controller = require('./' + file);
	controller.actions.forEach(function(action) {
		route({
			method: action.method,
			path: file + '/' + action.name,
			handler: action.run.bind(action)
		});
	});
}

module.exports = function(route) {
	registerFile('login', route);
};
