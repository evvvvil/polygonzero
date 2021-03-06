var moment = require('moment');
var _ = require('lodash');
var hbs = require('handlebars');
var keystone = require('keystone');
var cloudinary = require('cloudinary');
var util = require('handlebars-utils');

// Collection of templates to interpolate
var linkTemplate = _.template('<a href="<%= url %>"><%= text %></a>');
var scriptTemplate = _.template('<script src="<%= src %>"></script>');
var cssLinkTemplate = _.template('<link href="<%= href %>" rel="stylesheet">');

var toTidy, lower;
function tidyShitUp(toTidy,lower){
	//TODO: FIX THIS MESS!!! should do direct if toTidy.startsWith("vr")-> return "VR & AR"
	//This is a messy but any other way lodash falls over with category starting with numbers like "3d graphics"
	//also i have to make special case for VFX and VJing to be in caps, not elegant but easy,
	//make your use case here if you want caps
	if(lower>0){
		return _.replace(_.replace(toTidy.toLowerCase(),'-and-', ' & '),'-',' ');
	}else{
		return _.replace(_.replace(_.replace(_.replace(_.replace(_.replace(_.capitalize(toTidy),'-and-', ' & '),'-',' '),'vfx','VFX'),'vjin','VJin'),'Vr','VR'),'ar','AR');
	}
}

module.exports = function () {

	var _helpers = {};

	/**
	 * Generic HBS Helpers
	 * ===================
	 */

	_helpers.AFgetCategoriesPos = function (index,yOffset,zOffset) {
		var modIndex=index%4,x=-1.14,y=2.706,z=.355;
		if(modIndex>0&&modIndex<3) {x=-.397;z=.085;}
		if(modIndex>1) x*=-1;
		if(index>3) y-=.6;
		y+=yOffset;
		z+=zOffset;
		return x+" "+y+" "+z;
	};

	_helpers.AFstrip = function (what) {
		return new Handlebars.SafeString(what);
	};

	_helpers.AFgetCategoriesImage = function (featuredProj,catName) {
		var res;
		for(var i=0;i<featuredProj.length;i++){
			var item = featuredProj[i].categories;
		   	if(featuredProj[i].categories[0].name==catName){
				foundIndex=0;
			}	else{
				foundIndex=-1;
			}
			if(foundIndex>=0){
				var found=featuredProj[i];

				if(found.mainImage!==null&&found.mainImage!==undefined){
					res= found.mainImage; break;
				}else{
					res='';
				}
			}else{
				res= '';
			}
		}
		return res;
	};

	_helpers.AFgetCorridorsPos = function (index,x1,y1,z1,x2,y2,z2) {
		var modIndex=index%4,x=x1,y=y1,z=z1;
		if(modIndex>0&&modIndex<3) {x=x2;z=z2;}
		if(modIndex>1) x*=-1;
		if(index>3) y=y2;
		return x+" "+y+" "+z;
	};

	_helpers.AFgetCategoriesRot = function (index,z1,z2) {
		var modIndex=index%4,y=30,z=z1;
		if(modIndex>0&&modIndex<3) y=10;
		if(modIndex>1){ y*=-1;z=z2;}
		return 0+" "+y+" "+z;
	};

	_helpers.printName = function (a) {
			return a["name.full"];
	};

	_helpers.jsonView = function (a) {
		//console.log(_.map(a, 'name'));
			return JSON.stringify(a);
			//_.map(a, 'name');
	};

	_helpers.getVideoAspectClasses = function (a,b) {
		var result;
		if(a.includes("youtu")){
			result="youtube-video ";
		}else{
			result="vimeo-video "
		}
		if(b.includes("portrait")){
			result+="portrait";
		}else if(b.includes("landscape")){
			result+="landscape";
		}else{
			result+="4by3";
		}
		return result;
	};

	_helpers.getImageAspectClasses = function (a,b,c) {
		if(a<b){
			return "portrait "+c;
		}else{
			return "landscape "+c;
		}
	};

	_helpers.pageTitle = function (section, category, postTitle, postType) {
		var intro=" - London Creative Studio";
			if(section=="Home"){
				return intro;
			}else{
				var description;
				section=_.startCase(section);
				if(category!==undefined){
					if(postType=="work"||postType=="lab"||postType=="blog"){
						description=" - "+postTitle;
					}else{
						description=" - "+tidyShitUp(category,0);
					}
				}else{
					if(section=="Lab"){
						if(postType=="work"||postType=="lab"||postType=="blog"){
							description=" - "+postTitle;
						}else{
							description=" - Lab";
						}
					}else{
						description=" - "+section;
					}
				}
				return description;
			}
	};

	_helpers.add = function (a, b) {
			return  (a+b);
	};

	_helpers.getMetaDescription = function (section, category, postTitle, postType, postContentBrief) {
		var intro="We're amazing and we never spill our tea.";
		var whatWeDo="Interactive design, virtual reality, 3d VFX, video games, motion graphics, web development, projection, VJing, graphic design.";
			if(section=="Home"){
				return intro+" "+whatWeDo;
			}else if(section=="About"){
				return "Euphoric Blast is a new London creative studio. "+intro;
			}else{
				var description;
				section=_.startCase(section);
				if(category!==undefined){
					if(postType=="work"||postType=="lab"||postType=="blog"){
						//description=postTitle;
						if(postContentBrief!==undefined){
							description=_.unescape(postContentBrief.replace(/<\/?[^>]+(>|$)/g, ""));
						}
					}else{
						description="Euphoric Blast "+tidyShitUp(category,1)+" projects.";
					}
				}else{
					if(section=="Lab"){
						description="Euphoric Blast digital experiments.";
					}else{
						description=section+" page. "+whatWeDo+" "+intro;
					}
				}
				return description;
			}
	};

	_helpers.getFacebookOGImage = function (postType, image) {
		if(postType=="work"||postType=="lab"||postType=="blog"){
			return image;
		}else{
			return "http://www.euphoricblast.com/images/og-image.jpg";
		}
	};

	_helpers.getMetaKeywords = function (section, category, postTitle, postType, postContentBrief) {
		var generalKeywords="interactive design,virtual reality,3d,vfx,motion graphics,projection mapping,graphic design,web development,video games,vjing,london,projection,motion,virtual,reality,design,interactive";
		if(section=="Home"){
			return "euphoric,blast,"+generalKeywords;
		}else{
			var keywords;
			section=section.toLowerCase();
			keywords=section;
			if(category!==undefined){
				category=tidyShitUp(category,1)
				keywords+=","+category+","+category.replace("&","").replace(/[\s,]+/g,",");
			}
			if(postType=="work"||postType=="lab"||postType=="blog"){
				keywords+=","+postTitle.replace(/[\s,]+/g,",").toLowerCase();
			}else{
				if(category==undefined){
					keywords+=","+generalKeywords;
				}
			}
			return keywords;
		}
	};

	_helpers.addLength = function (a, b) {
		var countA=0;var countB=0;
		if(a!==undefined) countA=a.length;
		if(b!==undefined) countB=b.length;
			return  (countA+countB);
	};

	_helpers.getLength = function (a) {
		var countA=0;
		if(a!==undefined) countA=a.length;
			return  (countA);
	};

	_helpers.ifeq = function (a, b, options) {
		if (a == b) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifcontains = function (a, b, options) {
		if (a.includes(b)) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.iflt = function (a, b, options) {
		if (a < b) {
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.iflte = function (a, b, options) {
		if (a <= b) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifgte = function (a, b, options) {
		if (a >= b) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifgt = function (a, b, options) {
		if (a > b) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifundefined = function (a, options) {
		if (a == undefined) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifdefined = function (a, options) {
		if (a !== undefined) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.ifdefined = function (a, options) {
		if (a !== undefined) { // eslint-disable-line eqeqeq
			return options.fn(this);
		} else {
			return options.inverse(this);
		}
	};

	_helpers.or = function(/* any, any, ..., options */) {
	  var len = arguments.length - 1;
	  var options = arguments[len];
	  var val = false;

	  for (var i = 0; i < len; i++) {
	    if (arguments[i]) {
	      val = true;
	      break;
	    }
	  }
	  return util.value(val, this, options);
	};

	_helpers.and = function() {
	  var len = arguments.length - 1;
	  var options = arguments[len];
	  var val = true;

	  for (var i = 0; i < len; i++) {
	    if (!arguments[i]) {
	      val = false;
	      break;
	    }
	  }

	  return util.value(val, this, options);
	};

	_helpers.sectionURL = function (a) {
		return ("/"+_.lowerCase(a));
	};

	_helpers.fuckIt = function (a) {
		console.log(a);
		return (a);
	};

	_helpers.getColSimple = function (a,b) {
		return Math.max(Math.floor(12/a),b);
	};

	_helpers.ifCropLeftOvers = function (a,numOfProjects,offset, options) {

	a+=offset;
		if(numOfProjects==1){
				return options.fn(this);
		}else{
			if(numOfProjects%5==4||numOfProjects%5==1){

				if(numOfProjects-a<2|| numOfProjects==4){
					return options.fn(this);
				}
			}
		}
		return options.inverse(this);
	};

	_helpers.ifSmallDevice = function (a, options) {
		if(a<=768){
				return options.fn(this);
		}else{
			return options.inverse(this);
		}
	};

	_helpers.ifSectionOrProject = function (a,b,c,options) {
		if(a==b||(a=="Project" && _.lowerCase(b)==c)){
				return options.fn(this);
		}else{
		return options.inverse(this);
		}
	};

	_helpers.getColAdvanced = function (a,numOfProjects,offset) {
		a+=offset;
		if(numOfProjects<5){
			if(numOfProjects==2||numOfProjects==4){
				return ("col-md-6");
			}else{
				if(numOfProjects==3) return ("col-md-4");
				return ("col-md-12");
			}
		}else{
			if(numOfProjects%5==1||numOfProjects%5==4){
				if(a==(numOfProjects-1)){
					return ("col-md-12");
				}
			}else if(numOfProjects>6 && (numOfProjects-7)%5==0){
				if(numOfProjects-a<3){
					return ("col-md-6");
				}
			}
			if(a%5<3){
				return("col-md-4");
			}else{
				return("col-md-6");
			}
		}
	};

	_helpers.getVideoURL = function (a,b) {
		if(a.includes("vimeo")){
			var result;
			result="https://player.vimeo.com/video/"+_.split(a,".com/")[1]+"?title=0&byline=0&portrait=0&color=000000&muted=1";
			if(b!="auto"){
				result+="&quality="+b;
			}
			return result;
		}else{
			return "https://www.youtube.com/embed/"+_.split(a,"v=")[1]+"?showinfo=0&mute=1&enablejsapi=1";
			//return "https://www.youtube.com/embed/"+_.split(a,"v=")[1]+"?showinfo=0&autoplay=1&enablejsapi=1";
		}
	};
	_helpers.getLoopVideoURL = function (a) {
		if(a.includes("vimeo")){
			return "https://player.vimeo.com/video/"+_.split(a,".com/")[1]+"?title=0&byline=0&portrait=0&color=000000&muted=1&loop=1";
		}else{
			var ytID=_.split(a,"v=")[1];
			return "https://www.youtube.com/embed/"+ytID+"?enablejsapi=1&showinfo=0&autoplay=1&loop=1&controls=0&playlist="+ytID;
		}
	};
	_helpers.ifLocationIsWeb = function (a,options) {
		if(a.includes("www")|| a.includes("https")|| a.includes("http")){
			return options.fn(this);
		} else {
			return options.inverse(this);
		}


	};


	/**
	 * Port of Ghost helpers to support cross-theming
	 * ==============================================
	 *
	 * Also used in the default keystonejs-hbs theme
	 */

	// ### Date Helper
	// A port of the Ghost Date formatter similar to the keystonejs - pug interface
	//
	//
	// *Usage example:*
	// `{{date format='MM YYYY}}`
	// `{{date publishedDate format='MM YYYY'`
	//
	// Returns a string formatted date
	// By default if no date passed into helper than then a current-timestamp is used
	//
	// Options is the formatting and context check this.publishedDate
	// If it exists then it is formated, otherwise current timestamp returned

	_helpers.date = function (context, options) {
		if (!options && context.hasOwnProperty('hash')) {
			options = context;
			context = undefined;

			if (this.publishedDate) {
				context = this.publishedDate;
			}
		}

		// ensure that context is undefined, not null, as that can cause errors
		context = context === null ? undefined : context;

		var f = options.hash.format || 'MMM Do, YYYY';
		var timeago = options.hash.timeago;
		var date;

		// if context is undefined and given to moment then current timestamp is given
		// nice if you just want the current year to define in a tmpl
		if (timeago) {
			date = moment(context).fromNow();
		} else {
			date = moment(context).format(f);
		}
		return date;
	};

	// ### Category Helper
	// Ghost uses Tags and Keystone uses Categories
	// Supports same interface, just different name/semantics
	//
	// *Usage example:*
	// `{{categoryList categories separator=' - ' prefix='Filed under '}}`
	//
	// Returns an html-string of the categories on the post.
	// By default, categories are separated by commas.
	// input. categories:['tech', 'js']
	// output. 'Filed Undder <a href="blog/tech">tech</a>, <a href="blog/js">js</a>'

	_helpers.categoryList = function (categories, section, options) {
		var autolink = _.isString(options.hash.autolink) && options.hash.autolink === 'false' ? false : true;
		var separator = _.isString(options.hash.separator) ? options.hash.separator : ', ';
		var prefix = _.isString(options.hash.prefix) ? options.hash.prefix : '';
		var suffix = _.isString(options.hash.suffix) ? options.hash.suffix : '';
		var output = '';

		function createTagList (tags) {
			var tagNames = _.map(tags, 'name');

			if (autolink) {
				return _.map(tags, function (tag) {
					return linkTemplate({
						url: ('/'+section+'/' + tag.key),
						text: _.escape(tag.name),
					});
				}).join(separator);
			}
			return _.escape(tagNames.join(separator));
		}

		if (categories && categories.length) {
			output = prefix + createTagList(categories) + suffix;
		}
		return new hbs.SafeString(output);
	};

	/**
	 * KeystoneJS specific helpers
	 * ===========================
	 */

	// block rendering for keystone admin css
	_helpers.isAdminEditorCSS = function (user, options) {
		var output = '';
		if (typeof (user) !== 'undefined' && user.isAdmin) {
			output = cssLinkTemplate({
				href: '/keystone/styles/content/editor.min.css',
			});
		}
		return new hbs.SafeString(output);
	};

	// block rendering for keystone admin js
	_helpers.isAdminEditorJS = function (user, options) {
		var output = '';
		if (typeof (user) !== 'undefined' && user.isAdmin) {
			output = scriptTemplate({
				src: '/keystone/js/content/editor.js',
			});
		}
		return new hbs.SafeString(output);
	};

	// Used to generate the link for the admin edit post button
	_helpers.adminEditableUrl = function (user, options) {
		var rtn = keystone.app.locals.editable(user, {
			list: 'Post',
			id: options,
		});
		return rtn;
	};

	// ### CloudinaryUrl Helper
	// Direct support of the cloudinary.url method from Handlebars (see
	// cloudinary package documentation for more details).
	//
	// *Usage examples:*
	// `{{{cloudinaryUrl image width=640 height=480 crop='fill' gravity='north'}}}`
	// `{{#each images}} {{cloudinaryUrl width=640 height=480}} {{/each}}`
	//
	// Returns an src-string for a cloudinary image

	_helpers.cloudinaryUrl = function (context, options) {

		// if we dont pass in a context and just kwargs
		// then `this` refers to our default scope block and kwargs
		// are stored in context.hash
		if (!options && context.hasOwnProperty('hash')) {
			// strategy is to place context kwargs into options
			options = context;
			// bind our default inherited scope into context
			context = this;
		}

		// safe guard to ensure context is never null
		context = context === null ? undefined : context;

		if ((context) && (context.public_id)) {
			options.hash.secure = keystone.get('cloudinary secure') || false;
			var imageName = context.public_id.concat('.', context.format);
			return cloudinary.url(imageName, options.hash);
		}
		else {
			return null;
		}
	};

	// ### Content Url Helpers
	// KeystoneJS url handling so that the routes are in one place for easier
	// editing.  Should look at Django/Ghost which has an object layer to access
	// the routes by keynames to reduce the maintenance of changing urls

	// Direct url link to a specific post
	_helpers.postUrl = function (postSlug, category, section, options) {
		if(category===undefined) {
			if(section=='Lab'){
				category='lab/';
			}else{
				category='';
			}
		}else{
			category+='/';
		}
		return ('/'+ category + postSlug);
	};

	// might be a ghost helper
	// used for pagination urls on blog
	_helpers.pageUrl = function (pageNumber, section, options) {
		return '/'+section+'?page=' + pageNumber;
	};

	// create the category url for a blog-category page
	_helpers.categoryUrl = function (categorySlug, section, options) {
		return ('/' + categorySlug);
	};

	_helpers.capitalise = function (a) {
		return _.capitalize(a);
	};
	_helpers.tidyAndCapitalise = function (a) {
		return tidyShitUp(a,0);
	};

	// ### Pagination Helpers
	// These are helpers used in rendering a pagination system for content
	// Mostly generalized and with a small adjust to `_helper.pageUrl` could be universal for content types

	/*
	* expecting the data.posts context or an object literal that has `previous` and `next` properties
	* ifBlock helpers in hbs - http://stackoverflow.com/questions/8554517/handlerbars-js-using-an-helper-function-in-a-if-statement
	* */
	_helpers.ifHasPagination = function (postContext, options) {
		// if implementor fails to scope properly or has an empty data set
		// better to display else block than throw an exception for undefined
		if (_.isUndefined(postContext)) {
			return options.inverse(this);
		}
		if (postContext.next || postContext.previous) {
			return options.fn(this);
		}
		return options.inverse(this);
	};



	_helpers.paginationNavigation = function (pages, currentPage, totalPages, options) {
		var html = '';

		// pages should be an array ex.  [1,2,3,4,5,6,7,8,9,10, '....']
		// '...' will be added by keystone if the pages exceed 10
		_.each(pages, function (page, ctr) {
			// create ref to page, so that '...' is displayed as text even though int value is required
			var pageText = page;
			// create boolean flag state if currentPage
			var isActivePage = ((page === currentPage) ? true : false);
			// need an active class indicator
			var liClass = ((isActivePage) ? ' class="active"' : '');

			// if '...' is sent from keystone then we need to override the url
			if (page === '...') {
				// check position of '...' if 0 then return page 1, otherwise use totalPages
				page = ((ctr) ? totalPages : 1);
			}

			// get the pageUrl using the integer value
			var pageUrl = _helpers.pageUrl(page);
			// wrapup the html
			html += '<li' + liClass + '>' + linkTemplate({ url: pageUrl, text: pageText }) + '</li>\n';
		});
		return html;
	};

	// special helper to ensure that we always have a valid page url set even if
	// the link is disabled, will default to page 1
	_helpers.paginationPreviousUrl = function (previousPage, totalPages) {
		if (previousPage === false) {
			previousPage = 1;
		}
		return _helpers.pageUrl(previousPage);
	};

	// special helper to ensure that we always have a valid next page url set
	// even if the link is disabled, will default to totalPages
	_helpers.paginationNextUrl = function (nextPage, totalPages) {
		if (nextPage === false) {
			nextPage = totalPages;
		}
		return _helpers.pageUrl(nextPage);
	};


	//  ### Flash Message Helper
	//  KeystoneJS supports a message interface for information/errors to be passed from server
	//  to the front-end client and rendered in a html-block.  FlashMessage mirrors the Pug Mixin
	//  for creating the message.  But part of the logic is in the default.layout.  Decision was to
	//  surface more of the interface in the client html rather than abstracting behind a helper.
	//
	//  @messages:[]
	//
	//  *Usage example:*
	//  `{{#if messages.warning}}
	//      <div class="alert alert-warning">
	//          {{{flashMessages messages.warning}}}
	//      </div>
	//   {{/if}}`

	_helpers.flashMessages = function (messages) {
		var output = '';
		for (var i = 0; i < messages.length; i++) {

			if (messages[i].title) {
				output += '<h4>' + messages[i].title + '</h4>';
			}

			if (messages[i].detail) {
				output += '<p>' + messages[i].detail + '</p>';
			}

			if (messages[i].list) {
				output += '<ul>';
				for (var ctr = 0; ctr < messages[i].list.length; ctr++) {
					output += '<li>' + messages[i].list[ctr] + '</li>';
				}
				output += '</ul>';
			}
		}
		return new hbs.SafeString(output);
	};


	//  ### underscoreMethod call + format helper
	//	Calls to the passed in underscore method of the object (Keystone Model)
	//	and returns the result of format()
	//
	//  @obj: The Keystone Model on which to call the underscore method
	//	@undescoremethod: string - name of underscore method to call
	//
	//  *Usage example:*
	//  `{{underscoreFormat enquiry 'enquiryType'}}

	_helpers.underscoreFormat = function (obj, underscoreMethod) {
		return obj._[underscoreMethod].format();
	};
	_helpers.ifPostIsInCategory = function (categories, category, options) {
		var found=false;

			if(categories[0].name==category){
				found=true;
			}
		if(found){
			return options.fn(this);
		}else{
			return options.inverse(this);
		}

	};
	_helpers.ifPostIsInCategoryKey = function (categories, category, options) {
		var found=false;
			if(categories[0].key==category){
				found=true;
			}
		if(found){
			return options.fn(this);
		}else{
			return options.inverse(this);
		}

	};



	return _helpers;
};
