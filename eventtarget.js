/**
 * EventTarget support. Limitations (in IE8):
 *  - does not support capture
 *  - does not support window.dispatchEvent
 */
if (!document.addEventListener && window.Element && window.Event) {
	Event.prototype.stopPropagation = function() { this.cancelBubble = true; };
	Event.prototype.preventDefault = function() { this.returnValue = false; };

	(function() {
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
	})();
}

/** Bonus: MouseEvent polyfill to ease dispatchEvent usage */
if (!window.MouseEvent) {
	var MouseEvent = function(type, props) {
		var def = {
			type: type	
		}
		var event = document.createEventObject();
		for (var p in def)   { event[p] = def[p];   }
		for (var p in props) { event[p] = props[p]; }
		return event;
	}
} else {
	try {
		new MouseEvent("click");
	} catch (e) {
		(function() {
			var MouseEvent = function(type, props) {
				var def = {
					type: type,
					canBubble: true,
					cancelable: true,
					view: window,
					detail: 1,
					screenX: 0,
					screenY: 0,
					clientX: 0,
					clientY: 0,
					ctrlKey: false,
					altLey: false,
					shiftKey: false,
					metaKey: false,
					button: 0,
					relatedTarget: null
				}
				for (var p in props)   { def[p] = props[p];   }
				var event = document.createEvent("MouseEvent");
				event.initMouseEvent(
					def.type, def.canBubble, def.cancelable, def.view, def.detail, def.screenX, def.screenY,
					def.clientX, def.clientY, def.ctrlKey, def.altKey, def.shiftKey, def.metaKey, def.button, def.relatedTarget
				);
				return event;
			}
			MouseEvent.prototype = window.MouseEvent.prototype;
			window.MouseEvent = MouseEvent;
		})();
	}
}
