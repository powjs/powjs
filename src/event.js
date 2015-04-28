(function(global) {
	"use strict"
	/**
		The Document interface:
			createEvent(type)
			CustomEvent(type, detail)
		The CustomEvent interface:
			initCustomEvent(type, canBubble, cancelable, detail)
			detail attribute
		The EventTarget interface:
			addEventListener(type, listener, useCapture)
			removeEventListener(type, listener, useCapture)
			dispatchEvent(event)
		The Event interface:
			NONE constant
			CAPTURING_PHASE constant
			AT_TARGET constant
			BUBBLING_PHASE constant
			type attribute
			target attribute
			currentTarget attribute
			eventPhase attribute
			bubbles attribute
			cancelable attribute
			timeStamp attribute
			defaultPrevented attribute
			isTrusted attribute
			stopPropagation() method
			stopImmediatePropagation() method
			preventDefault() method
			initEvent(type, canBubble, cancelable) method
	 */
	var ELEMENT_NODE = Node.ELEMENT_NODE,
		ATTRIBUTE_NODE = Node.ATTRIBUTE_NODE,
		TEXT_NODE = Node.TEXT_NODE,
		CDATA_SECTION_NODE = Node.CDATA_SECTION_NODE,
		ENTITY_REFERENCE_NODE = Node.ENTITY_REFERENCE_NODE,
		ENTITY_NODE = Node.ENTITY_NODE,
		PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE,
		COMMENT_NODE = Node.COMMENT_NODE,
		DOCUMENT_NODE = Node.DOCUMENT_NODE,
		DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE,
		DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE,
		NOTATION_NODE = Node.NOTATION_NODE,
		oString = global.Pow.oString

	global.Pow.extend(
		global.Pow.prototype, {
			addEventListener: on,
			removeEventListener: off,
			dispatchEvent: fire
		},
		on, off, fire, once
	)

	// 全部支持 Element 的事件
	global.Pow.StandardEvents = Object.create(null)
	global.Pow.any({
		abort: "Window,Element:Event",
		blur: "Window,Element:FocusEvent",
		click: "Element:MouseEvent",
		dblclick: "Element:MouseEvent",
		error: "Window,Element:Event",
		focus: "Window,Element:FocusEvent",
		focusin: "Window,Element:FocusEvent",
		focusout: "Window,Element:FocusEvent",
		keydown: "Element:KeyboardEvent",
		keyup: "Element:KeyboardEvent",
		load: "Window,Document,Element:Event",
		mousedown: "Element:MouseEvent",
		mouseenter: "Element:MouseEvent",
		mouseleave: "Element:MouseEvent",
		mousemove: "Element:MouseEvent",
		mouseout: "Element:MouseEvent",
		mouseover: "Element:MouseEvent",
		mouseup: "Element:MouseEvent",
		resize: "Window,Element:UIEvent",
		scroll: "Document,Element:UIEvent",
		select: "Element:Event",
		unload: "Window,Document,Element:Event",
		wheel: "Element:WheelEvent"
	}, function(s, k) {
		this[k] = Object.create(null)
		s = s.split(':')
		this[k].iface = s[1]
		this[k].target = s[0].split(',')
	}, global.Pow.StandardEvents)

	function on(type, listener, useCapture) {
		/**
			在每个元素上注册监听事件. 多个 type 用 "," 拼接.
		 */
		var pool = this.Pow.Pool
		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				pool.put(evKey(el), el, t, listener)
				if (el.addEventListener) {
					el.addEventListener(type, listener, useCapture)
				}
			})
		}, this)
		return this
	}

	function once(type, listener, useCapture) {
		/**
			在每个元素上注册一次性监听事件. 多个 type 用 "," 拼接.
		 */
		var key, callee, pool = this.Pow.Pool

		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				key = evKey(el)
				if (el.addEventListener) {
					callee = onceListener(pool, el, t, listener, useCapture)
					el.addEventListener(t, callee, useCapture)
				} else {
					callee = onceListener(pool, el, t, callee, key)
				}
				pool.put(key, el, t, listener)
			})
		}, this)
		return this
	}

	function onceListener(pool, el, t, listener, key, callee) {
		return callee = function(e) {
			setTimeout(function() {
				pool.use(key, el, t, listener)
				if (typeof key !== 'string') {
					el.removeEventListener(t, callee, key)
				}
			}, 0)
			return listener(e)
		}
	}

	function off(type, listener, useCapture) {
		/**
			在每个元素上注销监听事件. 多个 type 用 "," 拼接.
		 */
		var pool = this.Pow.Pool
		useCapture = !!useCapture
		type = type.toLowerCase()
		type.split(',').forEach(function(t) {
			t = t.trim()
			this.forEach(function(el) {
				if (el.removeEventListener) {
					el.removeEventListener(type, listener, useCapture)
				}
				pool.use(evKey(el), el, t, listener)
			})
		}, this)
		return this
	}

	function fire(type, props) {
		/**
			在每个元素上派发(触发)单个事件.
		 */
		var event, target,
			pow = this.Pow,
			pool = pow.Pool

		if (typeof type !== 'string') {
			props = type, type = type.type
		} else {
			props = props || Object.create(null)
		}

		target = pow.StandardEvents[type]
		event = pow.document.createEvent(target && target.iface || 'CustomEvent')
		target = target && target.target || []

		pow.extend(event, props)
		event.initEvent(type,
			props.bubbles === false ? false : true,
			props.cancelable === false ? false : true
		)

		// ??? stopPropagation, preventDefault
		type = type.toLowerCase()
		this.forEach(function(el) {
			if (el.dispatchEvent) {
				el.dispatchEvent(event)
				return
			}
			props = pool.get(evKey(el), el, type)
			if (props) props.objs.forEach(function(listener) {
				if (listener) listener(event)
			})
		})
		return this
	}

	function evKey(target) {
		// 非 Element 根据目标类型计算 key
		return 'events_' + oString(target)
	}

})(this)