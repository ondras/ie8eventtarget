/** CustomEvent polyfill */
(function() {
	if (!window.CustomEvent) {
		window.CustomEvent = function(type, props) {
			var def = {
				type: type,
				bubbles: false,
				cancelable: false,
				detail: null
			}
			var event = document.createEventObject();
			for (var p in def)   { event[p] = def[p];   }
			for (var p in props) { event[p] = props[p]; }
			return event;
		}
		return;
	}

	try {
		new CustomEvent("test");
	} catch (e) {
		var CE = function (type, props) {
			var def = {
				bubbles: false,
				cancelable: false,
				detail: null 
			};
			for (var p in props)   { def[p] = props[p];   }
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent(type, props.bubbles, props.cancelable, props.detail);
			return event;
		};
		
		CE.prototype = window.CustomEvent.prototype;
		window.CustomEvent = CE;
	}
})();
