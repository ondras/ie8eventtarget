if (!document.addEventListener && window.Element && window.Event) {
	Event.prototype.stopPropagation = function() { this.cancelBubble = true; }
	Event.prototype.preventDefault = function() { this.returnValue = false; }

	var proto = {
		addEventListener: function(type, listener, useCapture) {
			if (useCapture) { throw new Error("Unable to polyfill event capturing"); }

			if (!this.__events) { this.__events = []; }

			for (var i=0;i<this.__events.length;i++) {
				var item = this.__events[i];
				if (item[0] == type && item[1] == listener) { return; }
			}

			var elm = this;
			var cb = function(e) {
				e.timeStamp = +new Date();
				e.target = e.srcElement;
				e.currentTarget = elm;
				e.pageX = e.clientX + document.documentElement.scrollLeft;
				e.pageY = e.clientY + document.documentElement.scrollTop;

				if (e.type == "mouseover") { 
					e.relatedTarget = e.fromElement; 
				} else if (e.type == "mouseout") { 
					e.relatedTarget = e.toElement; 
				} else {
					e.relatedTarget = null;
				}

				if (typeof(listener) == "function") {
					listener(e);
				} else {
					listener.handleEvent(e);
				}
			}

			this.attachEvent("on"+type, cb);
			this.__events.push([type, listener, cb]);
		},

		removeEventListener: function(type, listener, useCapture) {
			if (useCapture) { throw new Error("Unable to polyfill event capturing"); }

			var index = -1;
			var events = this.__events || [];
			for (var i=0;i<events.length;i++) {
				var item = events[i];
				if (item[0] == type && item[1] == listener) { 
					index = i;
					break;
				}
			}

			var cb = events.splice(i, 1)[0][2];
			this.detachEvent("on"+type, cb);
		},

		dispatchEvent: function(event) {
			event.srcElement = this;
			return this.fireEvent("on" + event.type, event);
		}
	}

	var todo = [Element, window.constructor, document.constructor];
	while (todo.length) {
		var parent = todo.pop();
		for (var p in proto) { parent.prototype[p] = proto[p]; }
	}
}

/** Bonus: CustomEvent polyfill to ease dispatchEvent usage */
if (!window.CustomEvent) {
	var CustomEvent = function(type, props) {
		var event = document.createEventObject();
		event.type = type;
		return event;
	}
} else {
	try {
		new CustomEvent("test");
	} catch (e) {
		var CE = function(type, props) {
			props = props || { bubbles: false, cancelable: false, detail: undefined };
			var event = document.createEvent("CustomEvent");
			event.initCustomEvent(type, props.bubbles, props.cancelable, props.detail);
    		return event;
		}
		CE.prototype = CustomEvent.prototype;
		CustomEvent = CE;
	}
}