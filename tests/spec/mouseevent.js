describe("MouseEvent", function() {
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

	describe("construction", function() {
		it("should throw an exception if no type is specified", function() {
			var test = function() {
				new MouseEvent();
			}

			expect(test).toThrow();
		});
	});

	describe("dispatching", function() {
		it("should dispatch to a target node", function() {
			var event = new MouseEvent("click");
			add(a, loga);
			a.dispatchEvent(event);

			expect(LOG).toEqual(["a"]);
		});

		it("should return false when cancelled", function() {
			var event = new MouseEvent("click", {cancelable:true});
			add(c, function(e) {
				logc();
				e.preventDefault();
			});
			var result = c.dispatchEvent(event);

			expect(LOG).toEqual(["c"]);
			expect(result).toBe(false);
		});

		it("should return true when not cancelled", function() {
			var event = new MouseEvent("click", {cancelable:true});
			add(c, function(e) {
				logc();
			});
			var result = c.dispatchEvent(event);

			expect(LOG).toEqual(["c"]);
			expect(result).toBe(true);
		});
	});

	describe("properties", function() {
		it("should contain correct type", function() {
			var event = new MouseEvent("click");
			add(a, function(e) {
				expect(e.type).toBe("click");
			});
			a.dispatchEvent(event);
		});
	});

	describe("propagation", function() {
		it("should not bubble by default", function() {
			var event = new MouseEvent("click");
			add(b, logb);
			add(c, logc);
			c.dispatchEvent(event);

			expect(LOG).toEqual(["c"]);
		});

		it("should bubble if requested", function() {
			var event = new MouseEvent("click", {bubbles:true});
			add(b, logb);
			add(c, logc);
			c.dispatchEvent(event);

			expect(LOG).toEqual(["c", "b"]);
		});
	});

	describe("cancellation", function() {
		it("should not be cancellable by default", function() {
			var event = new MouseEvent("click");
			add(c, function(e) {
				logc();
				e.preventDefault();
			});
			var result = c.dispatchEvent(event);

			expect(LOG).toEqual(["c"]);
			expect(result).toBe(true);
		});

		it("should be cancellable if requested", function() {
			var event = new MouseEvent("click", {cancelable:true});
			add(c, function(e) {
				logc();
				e.preventDefault();
			});
			var result = c.dispatchEvent(event);

			expect(LOG).toEqual(["c"]);
			expect(result).toBe(false);
		});

	});
});
