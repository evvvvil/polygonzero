var keystone = require('keystone');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'Project';
	locals.filters = {
		post: req.params.post,
	};
	locals.data = {
		post:"",
		relatedPosts: [],
	};

	//CLEANUP OTHER POLULATE THAT ARE NOT NEEDED!!!
//CLEANUP OTHER POLULATE THAT ARE NOT NEEDED!!!
	//CLEANUP OTHER POLULATE THAT ARE NOT NEEDED!!!
	//CLEANUP OTHER POLULATE THAT ARE NOT NEEDED!!!
	//CLEANUP OTHER POLULATE THAT ARE NOT NEEDED!!!


	// Load the current post
	view.on('init', function (next) {
		var q = keystone.list('Post').model.findOne({
			state: 'published',
			slug: locals.filters.post,
		}).populate('relatedPosts');
		
		q.exec(function (err, result) {
			locals.data.post = result;
			locals.data.relatedPosts=result.relatedPosts;
			next(err);
		});
	});

	// Render the view
	view.render('post', { bodyId: 'project-page', video:'whatever', lightbox:'whatever', cloudinaryResponsive: 'whatever'});
};
