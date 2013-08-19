describe("EventTarget", function() {
	var a, b, c;
	var LOG = [];

	beforeEach(function() {
		LOG = [];
		a = document.createElement("div");
		b = document.createElement("div");
		c = document.createElement("div");
		document.body.appendChild(a);
		a.appendChild(b);
		b.appendChild(c);
	});

	afterEach(function() {
		a.parentNode.removeChild(a);
	});


	var loga = function(e) { LOG.push("a"); }
	var logA = function(e) { LOG.push("A"); }
	var logb = function(e) { LOG.push("b"); }
	var logB = function(e) { LOG.push("B"); }
	var logc = function(e) { LOG.push("c"); }
	var logC = function(e) { LOG.push("C"); }

	var add = function(node, cb, capture) {
		node.addEventListener("click", cb, capture);
	}

	var remove = function(node, cb, capture) {
		node.removeEventListener("click", cb, capture);
	}

	var click = function(node, bubbles, cancelable) {
		var event = new MouseEvent("click", {bubbles:bubbles, cancelable:cancelable});
		return node.dispatchEvent(event);
	}

	describe("Adding listeners", function() {
		it("should add event listener", function() {
			add(a, loga);
			click(a);
			expect(LOG).toEqual(["a"]);
		});

		it("should add multiple event listeners in correct order", function() {
			add(a, loga);
			add(a, logb);
			click(a);
			expect(LOG).toEqual(["a", "b"]);
		});

		it("should ignore adding multiple same listeners", function() {
			add(a, loga);
			add(a, loga);
			click(a);
			expect(LOG).toEqual(["a"]);
		});
	});

	describe("Removing listeners", function() {
		it("should add and remove event listener", function() {
			add(a, loga);
			remove(a, loga);
			click(a);
			expect(LOG).toEqual([]);
		});

		it("should ignore nonexistant listener", function() {
			add(a, loga);
			remove(a, logb);
			click(a);
			expect(LOG).toEqual(["a"]);
		});

		it("should remove only one listener - the last one", function() {
			add(a, loga);
			add(a, logb);
			remove(a, logb);
			click(a);
			expect(LOG).toEqual(["a"]);
		});

		it("should remove only one listener - the first one", function() {
			add(a, loga);
			add(a, logb);
			remove(a, loga);
			click(a);
			expect(LOG).toEqual(["b"]);
		});

		it("should add and remove all event listeners - in FIFO order", function() {
			add(a, loga);
			add(a, logb);
			remove(a, loga);
			remove(a, logb);
			click(a);
			expect(LOG).toEqual([]);
		});

		it("should add and remove all event listeners - in LIFO order", function() {
			add(a, loga);
			add(a, logb);
			remove(a, logb);
			remove(a, loga);
			click(a);
			expect(LOG).toEqual([]);
		});
	});

	describe("Bubbling", function() {
		it("should perform basic bubbling", function() {
			add(a, loga);
			add(b, logb);
			add(c, logc);
			click(c, true);
			expect(LOG).toEqual(["c", "b", "a"]);
		});

		it("should handle listeners in correct order", function() {
			add(b, logb);
			add(c, logc);
			add(c, loga);
			click(c, true);
			expect(LOG).toEqual(["c", "a", "b"]);
		});

		it("should skip nodes without listeners", function() {
			add(a, loga);
			add(c, logc);
			click(c, true);
			expect(LOG).toEqual(["c", "a"]);
		});

		it("should not bubble when bubbles=false", function() {
			add(a, loga);
			add(c, logc);
			click(c, false);
			expect(LOG).toEqual(["c"]);
		});
	});

	describe("Exceptions", function() {
		it("should continue calling listeners after exception", function() {
			add(a, loga);
			add(a, function() { throw new Error(123); });
			add(a, function() { throw new Error(456); });
			add(a, logb);
			click(a);
			expect(LOG).toEqual(["a", "b"]);
		});
	});

	describe("Adding/removing during listener", function() {
		it("should not call listeners for the same node added during call", function() {
			add(a, function() {
				loga();
				add(a, logb);
			});
			click(a);
			expect(LOG).toEqual(["a"]);
			click(a);
			expect(LOG).toEqual(["a", "a", "b"]);
		});

		/* browser implementations do not do this correctly atm. */
		/*
		it("should call listeners for the same node removed during call", function() {
			add(a, function() {
				loga();
				remove(a, logb);
			});
			add(a, logb);
			click(a, true);
			expect(LOG).toEqual(["a", "b"]);
			click(a);
			expect(LOG).toEqual(["a", "b", "a"]);
		});
		*/

		it("should call listeners for the upper node added during call", function() {
			add(c, function() {
				logc();
				add(b, logb);
			});
			click(c, true);
			expect(LOG).toEqual(["c", "b"]);
		});

		it("should not call listeners removed from the upper node during call", function() {
			add(b, logb);
			add(c, function() {
				logc();
				remove(b, logb);
			});
			click(c, true);
			expect(LOG).toEqual(["c"]);
		});
	});

	describe("Stopping during bubble phase", function() {
		it("should stop propagation", function() {
			add(a, loga);
			add(b, function(e) {
				logb();
				e.stopPropagation();
			});
			add(c, logc);

			click(c, true);
			expect(LOG).toEqual(["c", "b"]);
		});

		it("should not stop other listeners on same node", function() {
			add(c, function(e) {
				logc();
				e.stopPropagation();
			});
			add(c, logb);
			add(a, loga);

			click(c, true);
			expect(LOG).toEqual(["c", "b"]);
		});
	});

	describe("Stopping immediate propagation", function() {
		it("should stop immediate propagation", function() {
			add(c, function(e) {
				logc();
				e.stopImmediatePropagation();
			});
			add(c, logb);

			click(c, true);
			expect(LOG).toEqual(["c"]);
		});
	});

	describe("Event properties", function() {
		it("should contain correct target", function() {
			add(c, function(e) {
				expect(e.target).toBe(c);
			});

			click(c);
		});

		it("should contain correct currentTarget", function() {
			add(c, function(e) {
				expect(e.target).toBe(c);
				expect(e.currentTarget).toBe(c);
			});

			add(b, function(e) {
				expect(e.target).toBe(c);
				expect(e.currentTarget).toBe(b);
			});

			click(c, true);
		});

		it("should contain correct eventPhase", function() {
			add(c, function(e) {
				expect(e.eventPhase).toBe(Event.AT_TARGET);
			});

			add(b, function(e) {
				expect(e.eventPhase).toBe(Event.BUBBLING_PHASE);
			});

			click(c, true);
		});
	});

	describe("Dispatch", function() {
		it("should dispatch to window", function() {
			var func = function(e) {
				LOG.push("win");
			};
			add(window, func);
			click(window);
			remove(window, func)
			expect(LOG).toEqual(["win"]);
		});

		it("should call listeners with a proper type", function() {
			add(c, logc);

			click(c);
			var e = new MouseEvent("mousedown");
			c.dispatchEvent(e);
			click(c);

			expect(LOG).toEqual(["c", "c"]);
		});

		it("should return true for non-canceled events", function() {
			add(a, loga);
			var result = click(a, true);
			expect(LOG).toEqual(["a"]);
			expect(result).toBe(true);
		});

		it("should return false for canceled events", function() {
			add(a, function(e) {
				loga();
				e.preventDefault();
			});
			add(b, logb);
			var result = click(b, true, true);
			expect(LOG).toEqual(["b", "a"]);
			expect(result).toBe(false);
		});

		it("should return truer for canceled non-cancelable events", function() {
			add(a, function(e) {
				loga();
				e.preventDefault();
			});
			add(b, logb);
			var result = click(b, true, false);
			expect(LOG).toEqual(["b", "a"]);
			expect(result).toBe(true);
		});
	});

	describe("Capture", function() {
		it("should add and invoke listeners in correct order", function() {
			add(a, logA, true);
			add(b, logB, true);
			add(a, loga, false);
			add(b, logb, false);
			click(b, true);
			expect(LOG).toEqual(["A", "B", "b", "a"]);
		});

		it("should add identical listeners to different phases", function() {
			add(a, loga, true);
			add(a, loga, false);
			click(a, true);
			expect(LOG).toEqual(["a", "a"]);
		});

		it("should remove capture listeners as well", function() {
			add(a, loga, true);
			add(a, loga, false);
			remove(a, loga, true);
			remove(a, loga, false);
			click(a, true);
			expect(LOG).toEqual([]);
		});

		it("should not remove listeners from other phase", function() {
			add(a, loga, false);
			remove(a, loga, true);

			add(b, logb, true);
			remove(b, logb, false);

			click(b, true);
			expect(LOG).toEqual(["b", "a"]);
		});

		it("should properly set eventPhase", function() {
			add(a, function(e) {
				expect(e.eventPhase).toBe(Event.CAPTURING_PHASE);
			}, true);

			add(a, function(e) {
				expect(e.eventPhase).toBe(Event.BUBBLING_PHASE);
			}, false);

			click(b, true);
		});

		it("should properly set eventPhase and order for target listeners", function() {
			add(a, function(e) {
				expect(e.eventPhase).toBe(Event.AT_TARGET);
				loga();
			}, false);

			add(a, function(e) {
				expect(e.eventPhase).toBe(Event.AT_TARGET);
				logb();
			}, true);

			click(a, true);
			expect(LOG).toEqual(["a", "b"]);
		});

		it("should stop propagation to bubble phase", function() {
			add(a, function(e) {
				loga();
				e.stopPropagation();
			}, true);

			add(a, logb, false);

			click(b, true);
			expect(LOG).toEqual(["a"]);
		});

		it("should not stop propagation to bubble phase when at target", function() {
			add(a, function(e) {
				loga();
				e.stopPropagation();
			}, true);

			add(a, logb, false);

			click(a, true);
			expect(LOG).toEqual(["a", "b"]);
		});
	});
});