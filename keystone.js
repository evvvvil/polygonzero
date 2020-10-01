// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'euphoricblast',
	'brand': 'euphoricblast',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs',
	}).engine,

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	posts: ['posts', 'post-categories'],
	galleries: 'galleries',
	enquiries: 'enquiries',
	users: 'users',
});

//ADD NEW MODEL LIKE THIS:
//posts: ['posts', 'post-categories', 'PostPageContent'],
keystone.set('cloudinary secure', true);


// Start Keystone to connect to your database and initialise the web server

var sock = require('socket.io');

keystone.start({
        onStart: function() {
            var hserver = keystone.httpServer;
            var io = keystone.set('io', sock.listen(hserver)).get('io');
            // Socket function
            io.on('connection', function (socket) {
                console.log('Socket connected.')
                socket.emit('news', 'Socket connected!');
			  	socket.on('fromClient', function (data) {
			    console.log(data);
			  });
				socket.on('*', function (data) {
				socket.broadcast.emit(data);
			});
            });
        }
    });
