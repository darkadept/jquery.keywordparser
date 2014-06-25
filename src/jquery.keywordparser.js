// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ($, window, document, undefined) {

	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = "keywordparser",
		defaults = {
			event: "keyup",
			trigger: {which:221},
			filters: {},
			match: /{([^{}<>]+)}/g,
			append: "&nbsp;",
			DEBUG: false
		};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {

		init: function () {
			var self = this;

			rangy.init();

			self._bindEventWrapper();
		},

		_bindEventWrapper: function() {
			var self = this;

			// Bind the event on the element
			$(self.element).on(self.settings.event, function(e){
				// Only trigger the event if our trigger object matches
				var match = true;
				jQuery.each(Object.keys(self.settings.trigger), function(idx, value){
					if (self.settings.trigger[value] !== e[value])
						match = false;
				});
				// Execute the action
				if (match) self._triggerEvent();
			});
		},

		_triggerEvent: function() {
			var self = this;

			// Save the cursor position
			var savedCursorPos = rangy.saveSelection();

			// Create a range of the current container
			var range = rangy.getSelection().getRangeAt(0);
			range.selectNode(range.startContainer);

			// Get the HTML of everything inside the container
			var text = range.startContainer.innerHTML;

			// Attempt to match
			var match = self.settings.match.exec(text);
			if (match) {

				// Decode entities and match the key to a replacement value
				var key = self._decodeEntities(match[1]);
				var replacement = self.settings.filters[key];
				if (replacement) {

					// Replace the matched text with the replacement.
					text = text.replace(match[0], replacement + self.settings.append);

					// Alter the HTML
					range.startContainer.innerHTML = text;

					// Restore the cursor position
					rangy.restoreSelection(savedCursorPos);
				}
			}
		},

		// Decodes HTML entities
		_decodeEntities: function(html) {
			var txt = document.createElement("textarea");
			txt.innerHTML = html;
			return txt.value;
		},

		DLOG: function() {
			if (!this.settings.DEBUG) return;
			for (var i in arguments) {
				console.log(pluginName + ": ", arguments[i]);
			}
		}
	});


	$.fn[ pluginName ] = function (methodOrOptions) {
		if (!$(this).length) {
			return $(this);
		}
		var instance = $(this).data(pluginName);

		// CASE: action method (public method on PLUGIN class)
		if (instance && methodOrOptions.indexOf("_") !== 0 && instance[ methodOrOptions ]	&& typeof( instance[ methodOrOptions ] ) === "function") {

			return instance[ methodOrOptions ](Array.prototype.slice.call(arguments, 1));


			// CASE: argument is options object or empty = initialise
		}
		if (typeof methodOrOptions === "object" || !methodOrOptions) {

			instance = new Plugin($(this), methodOrOptions);    // ok to overwrite if this is a re-init
			$(this).data(pluginName, instance);
			return $(this);

			// CASE: method called before init
		} else if (!instance) {
			$.error("Plugin must be initialised before using method: " + methodOrOptions);

			// CASE: invalid method
		} else if (methodOrOptions.indexOf("_") === 0) {
			$.error("Method " + methodOrOptions + " is private!");
		} else {
			$.error("Method " + methodOrOptions + " does not exist.");
		}
	};

})(jQuery, window, document);
