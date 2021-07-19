/* PrismJS 1.20.0
https://prismjs.com/download.html#themes=prism-coy&languages=markup+css+clike+javascript+applescript+arduino+aspnet+bash+basic+bison+c+csharp+cpp+cmake+css-extras+diff+docker+git+go+haskell+java+js-extras+json+jsonp+json5+kotlin+latex+less+makefile+markdown+matlab+nasm+objectivec+opencl+powershell+pug+python+regex+rest+rust+scala+sql+swift+toml+typescript+vbnet+verilog+vhdl+wasm+wiki+yaml&plugins=line-numbers+autolinker+file-highlight+show-language+highlight-keywords+inline-color+command-line+normalize-whitespace+toolbar+copy-to-clipboard+match-braces+diff-highlight */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function (_self){

// Private helper vars
var lang = /\blang(?:uage)?-([\w-]+)\b/i;
var uniqueId = 0;


var _ = {
	manual: _self.Prism && _self.Prism.manual,
	disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
	util: {
		encode: function encode(tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, encode(tokens.content), tokens.alias);
			} else if (Array.isArray(tokens)) {
				return tokens.map(encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).slice(8, -1);
		},

		objId: function (obj) {
			if (!obj['__id']) {
				Object.defineProperty(obj, '__id', { value: ++uniqueId });
			}
			return obj['__id'];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function deepClone(o, visited) {
			var clone, id, type = _.util.type(o);
			visited = visited || {};

			switch (type) {
				case 'Object':
					id = _.util.objId(o);
					if (visited[id]) {
						return visited[id];
					}
					clone = {};
					visited[id] = clone;

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = deepClone(o[key], visited);
						}
					}

					return clone;

				case 'Array':
					id = _.util.objId(o);
					if (visited[id]) {
						return visited[id];
					}
					clone = [];
					visited[id] = clone;

					o.forEach(function (v, i) {
						clone[i] = deepClone(v, visited);
					});

					return clone;

				default:
					return o;
			}
		},

		/**
		 * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
		 *
		 * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
		 *
		 * @param {Element} element
		 * @returns {string}
		 */
		getLanguage: function (element) {
			while (element && !lang.test(element.className)) {
				element = element.parentElement;
			}
			if (element) {
				return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
			}
			return 'none';
		},

		/**
		 * Returns the script element that is currently executing.
		 *
		 * This does __not__ work for line script element.
		 *
		 * @returns {HTMLScriptElement | null}
		 */
		currentScript: function () {
			if (typeof document === 'undefined') {
				return null;
			}
			if ('currentScript' in document) {
				return document.currentScript;
			}

			// IE11 workaround
			// we'll get the src of the current script by parsing IE11's error stack trace
			// this will not work for inline scripts

			try {
				throw new Error();
			} catch (err) {
				// Get file src url from stack. Specifically works with the format of stack traces in IE.
				// A stack will look like this:
				//
				// Error
				//    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
				//    at Global code (http://localhost/components/prism-core.js:606:1)

				var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
				if (src) {
					var scripts = document.getElementsByTagName('script');
					for (var i in scripts) {
						if (scripts[i].src == src) {
							return scripts[i];
						}
					}
				}
				return null;
			}
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need an object and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			var ret = {};

			for (var token in grammar) {
				if (grammar.hasOwnProperty(token)) {

					if (token == before) {
						for (var newToken in insert) {
							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					// Do not insert token which also occur in insert. See #1525
					if (!insert.hasOwnProperty(token)) {
						ret[token] = grammar[token];
					}
				}
			}

			var old = root[inside];
			root[inside] = ret;

			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === old && key != inside) {
					this[key] = ret;
				}
			});

			return ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function DFS(o, callback, type, visited) {
			visited = visited || {};

			var objId = _.util.objId;

			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					var property = o[i],
					    propertyType = _.util.type(property);

					if (propertyType === 'Object' && !visited[objId(property)]) {
						visited[objId(property)] = true;
						DFS(property, callback, null, visited);
					}
					else if (propertyType === 'Array' && !visited[objId(property)]) {
						visited[objId(property)] = true;
						DFS(property, callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},

	highlightAll: function(async, callback) {
		_.highlightAllUnder(document, async, callback);
	},

	highlightAllUnder: function(container, async, callback) {
		var env = {
			callback: callback,
			container: container,
			selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
		};

		_.hooks.run('before-highlightall', env);

		env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

		_.hooks.run('before-all-elements-highlight', env);

		for (var i = 0, element; element = env.elements[i++];) {
			_.highlightElement(element, async === true, env.callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language = _.util.getLanguage(element);
		var grammar = _.languages[language];

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		var parent = element.parentNode;
		if (parent && parent.nodeName.toLowerCase() === 'pre') {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		function insertHighlightedCode(highlightedCode) {
			env.highlightedCode = highlightedCode;

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
			callback && callback.call(env.element);
		}

		_.hooks.run('before-sanity-check', env);

		if (!env.code) {
			_.hooks.run('complete', env);
			callback && callback.call(env.element);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (!env.grammar) {
			insertHighlightedCode(_.util.encode(env.code));
			return;
		}

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				insertHighlightedCode(evt.data);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
		}
	},

	highlight: function (text, grammar, language) {
		var env = {
			code: text,
			grammar: grammar,
			language: language
		};
		_.hooks.run('before-tokenize', env);
		env.tokens = _.tokenize(env.code, env.grammar);
		_.hooks.run('after-tokenize', env);
		return Token.stringify(_.util.encode(env.tokens), env.language);
	},

	tokenize: function(text, grammar) {
		var rest = grammar.rest;
		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		var tokenList = new LinkedList();
		addAfter(tokenList, tokenList.head, text);

		matchGrammar(text, tokenList, grammar, tokenList.head, 0);

		return toArray(tokenList);
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	},

	Token: Token
};

_self.Prism = _;

function Token(type, content, alias, matchedStr, greedy) {
	this.type = type;
	this.content = content;
	this.alias = alias;
	// Copy of the full string this token was created from
	this.length = (matchedStr || '').length|0;
	this.greedy = !!greedy;
}

Token.stringify = function stringify(o, language) {
	if (typeof o == 'string') {
		return o;
	}
	if (Array.isArray(o)) {
		var s = '';
		o.forEach(function (e) {
			s += stringify(e, language);
		});
		return s;
	}

	var env = {
		type: o.type,
		content: stringify(o.content, language),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language
	};

	var aliases = o.alias;
	if (aliases) {
		if (Array.isArray(aliases)) {
			Array.prototype.push.apply(env.classes, aliases);
		} else {
			env.classes.push(aliases);
		}
	}

	_.hooks.run('wrap', env);

	var attributes = '';
	for (var name in env.attributes) {
		attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
	}

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
};

/**
 * @param {string} text
 * @param {LinkedList<string | Token>} tokenList
 * @param {any} grammar
 * @param {LinkedListNode<string | Token>} startNode
 * @param {number} startPos
 * @param {boolean} [oneshot=false]
 * @param {string} [target]
 */
function matchGrammar(text, tokenList, grammar, startNode, startPos, oneshot, target) {
	for (var token in grammar) {
		if (!grammar.hasOwnProperty(token) || !grammar[token]) {
			continue;
		}

		var patterns = grammar[token];
		patterns = Array.isArray(patterns) ? patterns : [patterns];

		for (var j = 0; j < patterns.length; ++j) {
			if (target && target == token + ',' + j) {
				return;
			}

			var pattern = patterns[j],
				inside = pattern.inside,
				lookbehind = !!pattern.lookbehind,
				greedy = !!pattern.greedy,
				lookbehindLength = 0,
				alias = pattern.alias;

			if (greedy && !pattern.pattern.global) {
				// Without the global flag, lastIndex won't work
				var flags = pattern.pattern.toString().match(/[imsuy]*$/)[0];
				pattern.pattern = RegExp(pattern.pattern.source, flags + 'g');
			}

			pattern = pattern.pattern || pattern;

			for ( // iterate the token list and keep track of the current token/string position
				var currentNode = startNode.next, pos = startPos;
				currentNode !== tokenList.tail;
				pos += currentNode.value.length, currentNode = currentNode.next
			) {

				var str = currentNode.value;

				if (tokenList.length > text.length) {
					// Something went terribly wrong, ABORT, ABORT!
					return;
				}

				if (str instanceof Token) {
					continue;
				}

				var removeCount = 1; // this is the to parameter of removeBetween

				if (greedy && currentNode != tokenList.tail.prev) {
					pattern.lastIndex = pos;
					var match = pattern.exec(text);
					if (!match) {
						break;
					}

					var from = match.index + (lookbehind && match[1] ? match[1].length : 0);
					var to = match.index + match[0].length;
					var p = pos;

					// find the node that contains the match
					p += currentNode.value.length;
					while (from >= p) {
						currentNode = currentNode.next;
						p += currentNode.value.length;
					}
					// adjust pos (and p)
					p -= currentNode.value.length;
					pos = p;

					// the current node is a Token, then the match starts inside another Token, which is invalid
					if (currentNode.value instanceof Token) {
						continue;
					}

					// find the last node which is affected by this match
					for (
						var k = currentNode;
						k !== tokenList.tail && (p < to || (typeof k.value === 'string' && !k.prev.value.greedy));
						k = k.next
					) {
						removeCount++;
						p += k.value.length;
					}
					removeCount--;

					// replace with the new match
					str = text.slice(pos, p);
					match.index -= pos;
				} else {
					pattern.lastIndex = 0;

					var match = pattern.exec(str);
				}

				if (!match) {
					if (oneshot) {
						break;
					}

					continue;
				}

				if (lookbehind) {
					lookbehindLength = match[1] ? match[1].length : 0;
				}

				var from = match.index + lookbehindLength,
					match = match[0].slice(lookbehindLength),
					to = from + match.length,
					before = str.slice(0, from),
					after = str.slice(to);

				var removeFrom = currentNode.prev;

				if (before) {
					removeFrom = addAfter(tokenList, removeFrom, before);
					pos += before.length;
				}

				removeRange(tokenList, removeFrom, removeCount);

				var wrapped = new Token(token, inside ? _.tokenize(match, inside) : match, alias, match, greedy);
				currentNode = addAfter(tokenList, removeFrom, wrapped);

				if (after) {
					addAfter(tokenList, currentNode, after);
				}


				if (removeCount > 1)
					matchGrammar(text, tokenList, grammar, currentNode.prev, pos, true, token + ',' + j);

				if (oneshot)
					break;
			}
		}
	}
}

/**
 * @typedef LinkedListNode
 * @property {T} value
 * @property {LinkedListNode<T> | null} prev The previous node.
 * @property {LinkedListNode<T> | null} next The next node.
 * @template T
 */

/**
 * @template T
 */
function LinkedList() {
	/** @type {LinkedListNode<T>} */
	var head = { value: null, prev: null, next: null };
	/** @type {LinkedListNode<T>} */
	var tail = { value: null, prev: head, next: null };
	head.next = tail;

	/** @type {LinkedListNode<T>} */
	this.head = head;
	/** @type {LinkedListNode<T>} */
	this.tail = tail;
	this.length = 0;
}

/**
 * Adds a new node with the given value to the list.
 * @param {LinkedList<T>} list
 * @param {LinkedListNode<T>} node
 * @param {T} value
 * @returns {LinkedListNode<T>} The added node.
 * @template T
 */
function addAfter(list, node, value) {
	// assumes that node != list.tail && values.length >= 0
	var next = node.next;

	var newNode = { value: value, prev: node, next: next };
	node.next = newNode;
	next.prev = newNode;
	list.length++;

	return newNode;
}
/**
 * Removes `count` nodes after the given node. The given node will not be removed.
 * @param {LinkedList<T>} list
 * @param {LinkedListNode<T>} node
 * @param {number} count
 * @template T
 */
function removeRange(list, node, count) {
	var next = node.next;
	for (var i = 0; i < count && next !== list.tail; i++) {
		next = next.next;
	}
	node.next = next;
	next.prev = node;
	list.length -= i;
}
/**
 * @param {LinkedList<T>} list
 * @returns {T[]}
 * @template T
 */
function toArray(list) {
	var array = [];
	var node = list.head.next;
	while (node !== list.tail) {
		array.push(node.value);
		node = node.next;
	}
	return array;
}


if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _;
	}

	if (!_.disableWorkerMessageHandler) {
		// In worker
		_self.addEventListener('message', function (evt) {
			var message = JSON.parse(evt.data),
				lang = message.language,
				code = message.code,
				immediateClose = message.immediateClose;

			_self.postMessage(_.highlight(code, _.languages[lang], lang));
			if (immediateClose) {
				_self.close();
			}
		}, false);
	}

	return _;
}

//Get current script and highlight
var script = _.util.currentScript();

if (script) {
	_.filename = script.src;

	if (script.hasAttribute('data-manual')) {
		_.manual = true;
	}
}

function highlightAutomaticallyCallback() {
	if (!_.manual) {
		_.highlightAll();
	}
}

if (!_.manual) {
	// If the document state is "loading", then we'll use DOMContentLoaded.
	// If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
	// DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
	// might take longer one animation frame to execute which can create a race condition where only some plugins have
	// been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
	// See https://github.com/PrismJS/prism/issues/2102
	var readyState = document.readyState;
	if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
		document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
	} else {
		if (window.requestAnimationFrame) {
			window.requestAnimationFrame(highlightAutomaticallyCallback);
		} else {
			window.setTimeout(highlightAutomaticallyCallback, 16);
		}
	}
}

return _;

})(_self);

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism;
}
;
Prism.languages.markup = {
	'comment': /<!--[\s\S]*?-->/,
	'prolog': /<\?[\s\S]+?\?>/,
	'doctype': {
		pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
		greedy: true
	},
	'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
		greedy: true,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
				inside: {
					'punctuation': [
						/^=/,
						{
							pattern: /^(\s*)["']|["']$/,
							lookbehind: true
						}
					]
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
	Prism.languages.markup['entity'];

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
	/**
	 * Adds an inlined language to markup.
	 *
	 * An example of an inlined language is CSS with `<style>` tags.
	 *
	 * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
	 * case insensitive.
	 * @param {string} lang The language key.
	 * @example
	 * addInlined('style', 'css');
	 */
	value: function addInlined(tagName, lang) {
		var includedCdataInside = {};
		includedCdataInside['language-' + lang] = {
			pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
			lookbehind: true,
			inside: Prism.languages[lang]
		};
		includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

		var inside = {
			'included-cdata': {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: includedCdataInside
			}
		};
		inside['language-' + lang] = {
			pattern: /[\s\S]+/,
			inside: Prism.languages[lang]
		};

		var def = {};
		def[tagName] = {
			pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
			lookbehind: true,
			greedy: true,
			inside: inside
		};

		Prism.languages.insertBefore('markup', 'cdata', def);
	}
});

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

(function (Prism) {

	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

	Prism.languages.css = {
		'comment': /\/\*[\s\S]*?\*\//,
		'atrule': {
			pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
			inside: {
				'rule': /^@[\w-]+/,
				'selector-function-argument': {
					pattern: /(\bselector\s*\((?!\s*\))\s*)(?:[^()]|\((?:[^()]|\([^()]*\))*\))+?(?=\s*\))/,
					lookbehind: true,
					alias: 'selector'
				}
				// See rest below
			}
		},
		'url': {
			pattern: RegExp('url\\((?:' + string.source + '|[^\n\r()]*)\\)', 'i'),
			greedy: true,
			inside: {
				'function': /^url/i,
				'punctuation': /^\(|\)$/
			}
		},
		'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
		'string': {
			pattern: string,
			greedy: true
		},
		'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
		'important': /!important\b/i,
		'function': /[-a-z0-9]+(?=\()/i,
		'punctuation': /[(){};:,]/
	};

	Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

	var markup = Prism.languages.markup;
	if (markup) {
		markup.tag.addInlined('style', 'css');

		Prism.languages.insertBefore('inside', 'attr-value', {
			'style-attr': {
				pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
				inside: {
					'attr-name': {
						pattern: /^\s*style/i,
						inside: markup.tag.inside
					},
					'punctuation': /^\s*=\s*['"]|['"]\s*$/,
					'attr-value': {
						pattern: /.+/i,
						inside: Prism.languages.css
					}
				},
				alias: 'language-css'
			}
		}, markup.tag);
	}

}(Prism));

Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true,
			greedy: true
		}
	],
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
		lookbehind: true,
		inside: {
			'punctuation': /[.\\]/
		}
	},
	'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(?:true|false)\b/,
	'function': /\w+(?=\()/,
	'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
	'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
	'class-name': [
		Prism.languages.clike['class-name'],
		{
			pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
			lookbehind: true
		}
	],
	'keyword': [
		{
			pattern: /((?:^|})\s*)(?:catch|finally)\b/,
			lookbehind: true
		},
		{
			pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
			lookbehind: true
		},
	],
	'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
	'operator': /--|\+\+|\*\*=?|=>|&&|\|\||[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?[.?]?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
		lookbehind: true,
		greedy: true
	},
	// This must be declared before keyword because we use "function" inside the look-forward
	'function-variable': {
		pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
		alias: 'function'
	},
	'parameter': [
		{
			pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
			inside: Prism.languages.javascript
		},
		{
			pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		},
		{
			pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
			lookbehind: true,
			inside: Prism.languages.javascript
		}
	],
	'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
	'template-string': {
		pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
		greedy: true,
		inside: {
			'template-punctuation': {
				pattern: /^`|`$/,
				alias: 'string'
			},
			'interpolation': {
				pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
				lookbehind: true,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\${|}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;

Prism.languages.applescript = {
	'comment': [
		// Allow one level of nesting
		/\(\*(?:\(\*(?:[^*]|\*(?!\)))*\*\)|(?!\(\*)[\s\S])*?\*\)/,
		/--.+/,
		/#.+/
	],
	'string': /"(?:\\.|[^"\\\r\n])*"/,
	'number': /(?:\b\d+\.?\d*|\B\.\d+)(?:e-?\d+)?\b/i,
	'operator': [
		/[&=≠≤≥*+\-\/÷^]|[<>]=?/,
		/\b(?:(?:start|begin|end)s? with|(?:(?:does not|doesn't) contain|contains?)|(?:is|isn't|is not) (?:in|contained by)|(?:(?:is|isn't|is not) )?(?:greater|less) than(?: or equal)?(?: to)?|(?:(?:does not|doesn't) come|comes) (?:before|after)|(?:is|isn't|is not) equal(?: to)?|(?:(?:does not|doesn't) equal|equals|equal to|isn't|is not)|(?:a )?(?:ref(?: to)?|reference to)|(?:and|or|div|mod|as|not))\b/
	],
	'keyword': /\b(?:about|above|after|against|apart from|around|aside from|at|back|before|beginning|behind|below|beneath|beside|between|but|by|considering|continue|copy|does|eighth|else|end|equal|error|every|exit|false|fifth|first|for|fourth|from|front|get|given|global|if|ignoring|in|instead of|into|is|it|its|last|local|me|middle|my|ninth|of|on|onto|out of|over|prop|property|put|repeat|return|returning|second|set|seventh|since|sixth|some|tell|tenth|that|the|then|third|through|thru|timeout|times|to|transaction|true|try|until|where|while|whose|with|without)\b/,
	'class': {
		pattern: /\b(?:alias|application|boolean|class|constant|date|file|integer|list|number|POSIX file|real|record|reference|RGB color|script|text|centimetres|centimeters|feet|inches|kilometres|kilometers|metres|meters|miles|yards|square feet|square kilometres|square kilometers|square metres|square meters|square miles|square yards|cubic centimetres|cubic centimeters|cubic feet|cubic inches|cubic metres|cubic meters|cubic yards|gallons|litres|liters|quarts|grams|kilograms|ounces|pounds|degrees Celsius|degrees Fahrenheit|degrees Kelvin)\b/,
		alias: 'builtin'
	},
	'punctuation': /[{}():,¬«»《》]/
};

Prism.languages.c = Prism.languages.extend('clike', {
	'comment': {
		pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
		greedy: true
	},
	'class-name': {
		pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+/,
		lookbehind: true
	},
	'keyword': /\b(?:__attribute__|_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
	'function': /[a-z_]\w*(?=\s*\()/i,
	'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/,
	'number': /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i
});

Prism.languages.insertBefore('c', 'string', {
	'macro': {
		// allow for multiline macro definitions
		// spaces after the # character compile fine with gcc
		pattern: /(^\s*)#\s*[a-z]+(?:[^\r\n\\]|\\(?:\r\n|[\s\S]))*/im,
		lookbehind: true,
		alias: 'property',
		inside: {
			// highlight the path of the include statement as a string
			'string': {
				pattern: /(#\s*include\s*)(?:<.+?>|(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2)/,
				lookbehind: true
			},
			// highlight macro directives as keywords
			'directive': {
				pattern: /(#\s*)\b(?:define|defined|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
				lookbehind: true,
				alias: 'keyword'
			}
		}
	},
	// highlight predefined macros as constants
	'constant': /\b(?:__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|stdin|stdout|stderr)\b/
});

delete Prism.languages.c['boolean'];

Prism.languages.cpp = Prism.languages.extend('c', {
	'class-name': {
		pattern: /(\b(?:class|enum|struct)\s+)\w+/,
		lookbehind: true
	},
	'keyword': /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
	'number': {
		pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+\.?[\da-f']*|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+\.?[\d']*|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]*/i,
		greedy: true
	},
	'operator': />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
	'boolean': /\b(?:true|false)\b/
});

Prism.languages.insertBefore('cpp', 'string', {
	'raw-string': {
		pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
		alias: 'string',
		greedy: true
	}
});

Prism.languages.arduino = Prism.languages.extend('cpp', {
	'keyword': /\b(?:setup|if|else|while|do|for|return|in|instanceof|default|function|loop|goto|switch|case|new|try|throw|catch|finally|null|break|continue|boolean|bool|void|byte|word|string|String|array|int|long|integer|double)\b/,
	'builtin': /\b(?:KeyboardController|MouseController|SoftwareSerial|EthernetServer|EthernetClient|LiquidCrystal|LiquidCrystal_I2C|RobotControl|GSMVoiceCall|EthernetUDP|EsploraTFT|HttpClient|RobotMotor|WiFiClient|GSMScanner|FileSystem|Scheduler|GSMServer|YunClient|YunServer|IPAddress|GSMClient|GSMModem|Keyboard|Ethernet|Console|GSMBand|Esplora|Stepper|Process|WiFiUDP|GSM_SMS|Mailbox|USBHost|Firmata|PImage|Client|Server|GSMPIN|FileIO|Bridge|Serial|EEPROM|Stream|Mouse|Audio|Servo|File|Task|GPRS|WiFi|Wire|TFT|GSM|SPI|SD|runShellCommandAsynchronously|analogWriteResolution|retrieveCallingNumber|printFirmwareVersion|analogReadResolution|sendDigitalPortPair|noListenOnLocalhost|readJoystickButton|setFirmwareVersion|readJoystickSwitch|scrollDisplayRight|getVoiceCallStatus|scrollDisplayLeft|writeMicroseconds|delayMicroseconds|beginTransmission|getSignalStrength|runAsynchronously|getAsynchronously|listenOnLocalhost|getCurrentCarrier|readAccelerometer|messageAvailable|sendDigitalPorts|lineFollowConfig|countryNameWrite|runShellCommand|readStringUntil|rewindDirectory|readTemperature|setClockDivider|readLightSensor|endTransmission|analogReference|detachInterrupt|countryNameRead|attachInterrupt|encryptionType|readBytesUntil|robotNameWrite|readMicrophone|robotNameRead|cityNameWrite|userNameWrite|readJoystickY|readJoystickX|mouseReleased|openNextFile|scanNetworks|noInterrupts|digitalWrite|beginSpeaker|mousePressed|isActionDone|mouseDragged|displayLogos|noAutoscroll|addParameter|remoteNumber|getModifiers|keyboardRead|userNameRead|waitContinue|processInput|parseCommand|printVersion|readNetworks|writeMessage|blinkVersion|cityNameRead|readMessage|setDataMode|parsePacket|isListening|setBitOrder|beginPacket|isDirectory|motorsWrite|drawCompass|digitalRead|clearScreen|serialEvent|rightToLeft|setTextSize|leftToRight|requestFrom|keyReleased|compassRead|analogWrite|interrupts|WiFiServer|disconnect|playMelody|parseFloat|autoscroll|getPINUsed|setPINUsed|setTimeout|sendAnalog|readSlider|analogRead|beginWrite|createChar|motorsStop|keyPressed|tempoWrite|readButton|subnetMask|debugPrint|macAddress|writeGreen|randomSeed|attachGPRS|readString|sendString|remotePort|releaseAll|mouseMoved|background|getXChange|getYChange|answerCall|getResult|voiceCall|endPacket|constrain|getSocket|writeJSON|getButton|available|connected|findUntil|readBytes|exitValue|readGreen|writeBlue|startLoop|IPAddress|isPressed|sendSysex|pauseMode|gatewayIP|setCursor|getOemKey|tuneWrite|noDisplay|loadImage|switchPIN|onRequest|onReceive|changePIN|playFile|noBuffer|parseInt|overflow|checkPIN|knobRead|beginTFT|bitClear|updateIR|bitWrite|position|writeRGB|highByte|writeRed|setSpeed|readBlue|noStroke|remoteIP|transfer|shutdown|hangCall|beginSMS|endWrite|attached|maintain|noCursor|checkReg|checkPUK|shiftOut|isValid|shiftIn|pulseIn|connect|println|localIP|pinMode|getIMEI|display|noBlink|process|getBand|running|beginSD|drawBMP|lowByte|setBand|release|bitRead|prepare|pointTo|readRed|setMode|noFill|remove|listen|stroke|detach|attach|noTone|exists|buffer|height|bitSet|circle|config|cursor|random|IRread|setDNS|endSMS|getKey|micros|millis|begin|print|write|ready|flush|width|isPIN|blink|clear|press|mkdir|rmdir|close|point|yield|image|BSSID|click|delay|read|text|move|peek|beep|rect|line|open|seek|fill|size|turn|stop|home|find|step|tone|sqrt|RSSI|SSID|end|bit|tan|cos|sin|pow|map|abs|max|min|get|run|put)\b/,
	'constant': /\b(?:DIGITAL_MESSAGE|FIRMATA_STRING|ANALOG_MESSAGE|REPORT_DIGITAL|REPORT_ANALOG|INPUT_PULLUP|SET_PIN_MODE|INTERNAL2V56|SYSTEM_RESET|LED_BUILTIN|INTERNAL1V1|SYSEX_START|INTERNAL|EXTERNAL|DEFAULT|OUTPUT|INPUT|HIGH|LOW)\b/
});

(function (Prism) {

	/**
	 * Replaces all placeholders "<<n>>" of given pattern with the n-th replacement (zero based).
	 *
	 * Note: This is a simple text based replacement. Be careful when using backreferences!
	 *
	 * @param {string} pattern the given pattern.
	 * @param {string[]} replacements a list of replacement which can be inserted into the given pattern.
	 * @returns {string} the pattern with all placeholders replaced with their corresponding replacements.
	 * @example replace(/a<<0>>a/.source, [/b+/.source]) === /a(?:b+)a/.source
	 */
	function replace(pattern, replacements) {
		return pattern.replace(/<<(\d+)>>/g, function (m, index) {
			return '(?:' + replacements[+index] + ')';
		});
	}
	/**
	 * @param {string} pattern
	 * @param {string[]} replacements
	 * @param {string} [flags]
	 * @returns {RegExp}
	 */
	function re(pattern, replacements, flags) {
		return RegExp(replace(pattern, replacements), flags || '');
	}

	/**
	 * Creates a nested pattern where all occurrences of the string `<<self>>` are replaced with the pattern itself.
	 *
	 * @param {string} pattern
	 * @param {number} depthLog2
	 * @returns {string}
	 */
	function nested(pattern, depthLog2) {
		for (var i = 0; i < depthLog2; i++) {
			pattern = pattern.replace(/<<self>>/g, function () { return '(?:' + pattern + ')'; });
		}
		return pattern.replace(/<<self>>/g, '[^\\s\\S]');
	}

	// https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/
	var keywordKinds = {
		// keywords which represent a return or variable type
		type: 'bool byte char decimal double dynamic float int long object sbyte short string uint ulong ushort var void',
		// keywords which are used to declare a type
		typeDeclaration: 'class enum interface struct',
		// contextual keywords
		// ("var" and "dynamic" are missing because they are used like types)
		contextual: 'add alias ascending async await by descending from get global group into join let nameof notnull on orderby partial remove select set unmanaged value when where where',
		// all other keywords
		other: 'abstract as base break case catch checked const continue default delegate do else event explicit extern finally fixed for foreach goto if implicit in internal is lock namespace new null operator out override params private protected public readonly ref return sealed sizeof stackalloc static switch this throw try typeof unchecked unsafe using virtual volatile while yield'
	};

	// keywords
	function keywordsToPattern(words) {
		return '\\b(?:' + words.trim().replace(/ /g, '|') + ')\\b';
	}
	var typeDeclarationKeywords = keywordsToPattern(keywordKinds.typeDeclaration);
	var keywords = RegExp(keywordsToPattern(keywordKinds.type + ' ' + keywordKinds.typeDeclaration + ' ' + keywordKinds.contextual + ' ' + keywordKinds.other));
	var nonTypeKeywords = keywordsToPattern(keywordKinds.typeDeclaration + ' ' + keywordKinds.contextual + ' ' + keywordKinds.other);
	var nonContextualKeywords = keywordsToPattern(keywordKinds.type + ' ' + keywordKinds.typeDeclaration + ' ' + keywordKinds.other);

	// types
	var generic = nested(/<(?:[^<>;=+\-*/%&|^]|<<self>>)*>/.source, 2); // the idea behind the other forbidden characters is to prevent false positives. Same for tupleElement.
	var nestedRound = nested(/\((?:[^()]|<<self>>)*\)/.source, 2);
	var name = /@?\b[A-Za-z_]\w*\b/.source;
	var genericName = replace(/<<0>>(?:\s*<<1>>)?/.source, [name, generic]);
	var identifier = replace(/(?!<<0>>)<<1>>(?:\s*\.\s*<<1>>)*/.source, [nonTypeKeywords, genericName]);
	var array = /\[\s*(?:,\s*)*\]/.source;
	var tupleElement = replace(/[^,()<>[\];=+\-*/%&|^]|<<0>>|<<1>>|<<2>>/.source, [generic, nestedRound, array])
	var tuple = replace(/\(<<0>>+(?:,<<0>>+)+\)/.source, [tupleElement]);
	var typeExpression = replace(/(?:<<0>>|<<1>>)(?:\s*(?:\?\s*)?<<2>>)*(?:\s*\?)?/.source, [tuple, identifier, array]);

	var typeInside = {
		'keyword': keywords,
		'punctuation': /[<>()?,.:[\]]/
	};

	// strings & characters
	// https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure#character-literals
	// https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure#string-literals
	var character = /'(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'/.source; // simplified pattern
	var regularString = /"(?:\\.|[^\\"\r\n])*"/.source;
	var verbatimString = /@"(?:""|\\[\s\S]|[^\\"])*"(?!")/.source;


	Prism.languages.csharp = Prism.languages.extend('clike', {
		'string': [
			{
				pattern: re(/(^|[^$\\])<<0>>/.source, [verbatimString]),
				lookbehind: true,
				greedy: true
			},
			{
				pattern: re(/(^|[^@$\\])<<0>>/.source, [regularString]),
				lookbehind: true,
				greedy: true
			},
			{
				pattern: RegExp(character),
				greedy: true,
				alias: 'character'
			}
		],
		'class-name': [
			{
				// Using static
				// using static System.Math;
				pattern: re(/(\busing\s+static\s+)<<0>>(?=\s*;)/.source, [identifier]),
				lookbehind: true,
				inside: typeInside
			},
			{
				// Using alias (type)
				// using Project = PC.MyCompany.Project;
				pattern: re(/(\busing\s+<<0>>\s*=\s*)<<1>>(?=\s*;)/.source, [name, typeExpression]),
				lookbehind: true,
				inside: typeInside
			},
			{
				// Using alias (alias)
				// using Project = PC.MyCompany.Project;
				pattern: re(/(\busing\s+)<<0>>(?=\s*=)/.source, [name]),
				lookbehind: true
			},
			{
				// Type declarations
				// class Foo<A, B>
				// interface Foo<out A, B>
				pattern: re(/(\b<<0>>\s+)<<1>>/.source, [typeDeclarationKeywords, genericName]),
				lookbehind: true,
				inside: typeInside
			},
			{
				// Single catch exception declaration
				// catch(Foo)
				// (things like catch(Foo e) is covered by variable declaration)
				pattern: re(/(\bcatch\s*\(\s*)<<0>>/.source, [identifier]),
				lookbehind: true,
				inside: typeInside
			},
			{
				// Name of the type parameter of generic constraints
				// where Foo : class
				pattern: re(/(\bwhere\s+)<<0>>/.source, [name]),
				lookbehind: true
			},
			{
				// Casts and checks via as and is.
				// as Foo<A>, is Bar<B>
				// (things like if(a is Foo b) is covered by variable declaration)
				pattern: re(/(\b(?:is|as)\s+)<<0>>/.source, [typeExpression]),
				lookbehind: true,
				inside: typeInside
			},
			{
				// Variable, field and parameter declaration
				// (Foo bar, Bar baz, Foo[,,] bay, Foo<Bar, FooBar<Bar>> bax)
				pattern: re(/\b<<0>>(?=\s+(?!<<1>>)<<2>>(?:\s*[=,;:{)\]]|\s+in))/.source, [typeExpression, nonContextualKeywords, name]),
				inside: typeInside
			}
		],
		'keyword': keywords,
		// https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/lexical-structure#literals
		'number': /(?:\b0(?:x[\da-f_]*[\da-f]|b[01_]*[01])|(?:\B\.\d+(?:_+\d+)*|\b\d+(?:_+\d+)*(?:\.\d+(?:_+\d+)*)?)(?:e[-+]?\d+(?:_+\d+)*)?)(?:ul|lu|[dflmu])?\b/i,
		'operator': />>=?|<<=?|[-=]>|([-+&|])\1|~|\?\?=?|[-+*/%&|^!=<>]=?/,
		'punctuation': /\?\.?|::|[{}[\];(),.:]/
	});

	Prism.languages.insertBefore('csharp', 'number', {
		'range': {
			pattern: /\.\./,
			alias: 'operator'
		}
	});

	Prism.languages.insertBefore('csharp', 'punctuation', {
		'named-parameter': {
			pattern: re(/([(,]\s*)<<0>>(?=\s*:)/.source, [name]),
			lookbehind: true,
			alias: 'punctuation'
		}
	});

	Prism.languages.insertBefore('csharp', 'class-name', {
		'namespace': {
			// namespace Foo.Bar {}
			// using Foo.Bar;
			pattern: re(/(\b(?:namespace|using)\s+)<<0>>(?:\s*\.\s*<<0>>)*(?=\s*[;{])/.source, [name]),
			lookbehind: true,
			inside: {
				'punctuation': /\./
			}
		},
		'type-expression': {
			// default(Foo), typeof(Foo<Bar>), sizeof(int)
			pattern: re(/(\b(?:default|typeof|sizeof)\s*\(\s*)(?:[^()\s]|\s(?!\s*\))|<<0>>)*(?=\s*\))/.source, [nestedRound]),
			lookbehind: true,
			alias: 'class-name',
			inside: typeInside
		},
		'return-type': {
			// Foo<Bar> ForBar(); Foo IFoo.Bar() => 0
			// int this[int index] => 0; T IReadOnlyList<T>.this[int index] => this[index];
			// int Foo => 0; int Foo { get; set } = 0;
			pattern: re(/<<0>>(?=\s+(?:<<1>>\s*(?:=>|[({]|\.\s*this\s*\[)|this\s*\[))/.source, [typeExpression, identifier]),
			inside: typeInside,
			alias: 'class-name'
		},
		'constructor-invocation': {
			// new List<Foo<Bar[]>> { }
			pattern: re(/(\bnew\s+)<<0>>(?=\s*[[({])/.source, [typeExpression]),
			lookbehind: true,
			inside: typeInside,
			alias: 'class-name'
		},
		/*'explicit-implementation': {
			// int IFoo<Foo>.Bar => 0; void IFoo<Foo<Foo>>.Foo<T>();
			pattern: replace(/\b<<0>>(?=\.<<1>>)/, className, methodOrPropertyDeclaration),
			inside: classNameInside,
			alias: 'class-name'
		},*/
		'generic-method': {
			// foo<Bar>()
			pattern: re(/<<0>>\s*<<1>>(?=\s*\()/.source, [name, generic]),
			inside: {
				'function': re(/^<<0>>/.source, [name]),
				'generic': {
					pattern: RegExp(generic),
					alias: 'class-name',
					inside: typeInside
				}
			}
		},
		'type-list': {
			// The list of types inherited or of generic constraints
			// class Foo<F> : Bar, IList<FooBar>
			// where F : Bar, IList<int>
			pattern: re(
				/\b((?:<<0>>\s+<<1>>|where\s+<<2>>)\s*:\s*)(?:<<3>>|<<4>>)(?:\s*,\s*(?:<<3>>|<<4>>))*(?=\s*(?:where|[{;]|=>|$))/.source,
				[typeDeclarationKeywords, genericName, name, typeExpression, keywords.source]
			),
			lookbehind: true,
			inside: {
				'keyword': keywords,
				'class-name': {
					pattern: RegExp(typeExpression),
					greedy: true,
					inside: typeInside
				},
				'punctuation': /,/
			}
		},
		'preprocessor': {
			pattern: /(^\s*)#.*/m,
			lookbehind: true,
			alias: 'property',
			inside: {
				// highlight preprocessor directives as keywords
				'directive': {
					pattern: /(\s*#)\b(?:define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\b/,
					lookbehind: true,
					alias: 'keyword'
				}
			}
		}
	});

	// attributes
	var regularStringOrCharacter = regularString + '|' + character;
	var regularStringCharacterOrComment = replace(/\/(?![*/])|\/\/[^\r\n]*[\r\n]|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>/.source, [regularStringOrCharacter]);
	var roundExpression = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [regularStringCharacterOrComment]), 2);

	// https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/attributes/#attribute-targets
	var attrTarget = /\b(?:assembly|event|field|method|module|param|property|return|type)\b/.source;
	var attr = replace(/<<0>>(?:\s*\(<<1>>*\))?/.source, [identifier, roundExpression]);

	Prism.languages.insertBefore('csharp', 'class-name', {
		'attribute': {
			// Attributes
			// [Foo], [Foo(1), Bar(2, Prop = "foo")], [return: Foo(1), Bar(2)], [assembly: Foo(Bar)]
			pattern: re(/((?:^|[^\s\w>)?])\s*\[\s*)(?:<<0>>\s*:\s*)?<<1>>(?:\s*,\s*<<1>>)*(?=\s*\])/.source, [attrTarget, attr]),
			lookbehind: true,
			greedy: true,
			inside: {
				'target': {
					pattern: re(/^<<0>>(?=\s*:)/.source, [attrTarget]),
					alias: 'keyword'
				},
				'attribute-arguments': {
					pattern: re(/\(<<0>>*\)/.source, [roundExpression]),
					inside: Prism.languages.csharp
				},
				'class-name': {
					pattern: RegExp(identifier),
					inside: {
						'punctuation': /\./
					}
				},
				'punctuation': /[:,]/
			}
		}
	});


	// string interpolation
	var formatString = /:[^}\r\n]+/.source;
	// multi line
	var mInterpolationRound = nested(replace(/[^"'/()]|<<0>>|\(<<self>>*\)/.source, [regularStringCharacterOrComment]), 2)
	var mInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [mInterpolationRound, formatString]);
	// single line
	var sInterpolationRound = nested(replace(/[^"'/()]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|<<0>>|\(<<self>>*\)/.source, [regularStringOrCharacter]), 2)
	var sInterpolation = replace(/\{(?!\{)(?:(?![}:])<<0>>)*<<1>>?\}/.source, [sInterpolationRound, formatString]);

	function createInterpolationInside(interpolation, interpolationRound) {
		return {
			'interpolation': {
				pattern: re(/([^{](?:\{\{)*)<<0>>/.source, [interpolation]),
				lookbehind: true,
				inside: {
					'format-string': {
						pattern: re(/(^\{(?:(?![}:])<<0>>)*)<<1>>(?=\}$)/.source, [interpolationRound, formatString]),
						lookbehind: true,
						inside: {
							'punctuation': /^:/
						}
					},
					'punctuation': /^\{|\}$/,
					'expression': {
						pattern: /[\s\S]+/,
						alias: 'language-csharp',
						inside: Prism.languages.csharp
					}
				}
			},
			'string': /[\s\S]+/
		};
	}

	Prism.languages.insertBefore('csharp', 'string', {
		'interpolation-string': [
			{
				pattern: re(/(^|[^\\])(?:\$@|@\$)"(?:""|\\[\s\S]|\{\{|<<0>>|[^\\{"])*"/.source, [mInterpolation]),
				lookbehind: true,
				greedy: true,
				inside: createInterpolationInside(mInterpolation, mInterpolationRound),
			},
			{
				pattern: re(/(^|[^@\\])\$"(?:\\.|\{\{|<<0>>|[^\\"{])*"/.source, [sInterpolation]),
				lookbehind: true,
				greedy: true,
				inside: createInterpolationInside(sInterpolation, sInterpolationRound),
			}
		]
	});

}(Prism));

Prism.languages.dotnet = Prism.languages.cs = Prism.languages.csharp;

Prism.languages.aspnet = Prism.languages.extend('markup', {
	'page-directive': {
		pattern: /<%\s*@.*%>/i,
		alias: 'tag',
		inside: {
			'page-directive': {
				pattern: /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
				alias: 'tag'
			},
			rest: Prism.languages.markup.tag.inside
		}
	},
	'directive': {
		pattern: /<%.*%>/i,
		alias: 'tag',
		inside: {
			'directive': {
				pattern: /<%\s*?[$=%#:]{0,2}|%>/i,
				alias: 'tag'
			},
			rest: Prism.languages.csharp
		}
	}
});
// Regexp copied from prism-markup, with a negative look-ahead added
Prism.languages.aspnet.tag.pattern = /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i;

// match directives of attribute value foo="<% Bar %>"
Prism.languages.insertBefore('inside', 'punctuation', {
	'directive': Prism.languages.aspnet['directive']
}, Prism.languages.aspnet.tag.inside["attr-value"]);

Prism.languages.insertBefore('aspnet', 'comment', {
	'asp-comment': {
		pattern: /<%--[\s\S]*?--%>/,
		alias: ['asp', 'comment']
	}
});

// script runat="server" contains csharp, not javascript
Prism.languages.insertBefore('aspnet', Prism.languages.javascript ? 'script' : 'tag', {
	'asp-script': {
		pattern: /(<script(?=.*runat=['"]?server['"]?)[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,
		lookbehind: true,
		alias: ['asp', 'script'],
		inside: Prism.languages.csharp || {}
	}
});

(function(Prism) {
	// $ set | grep '^[A-Z][^[:space:]]*=' | cut -d= -f1 | tr '\n' '|'
	// + LC_ALL, RANDOM, REPLY, SECONDS.
	// + make sure PS1..4 are here as they are not always set,
	// - some useless things.
	var envVars = '\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b';
	var insideString = {
		'environment': {
			pattern: RegExp("\\$" + envVars),
			alias: 'constant'
		},
		'variable': [
			// [0]: Arithmetic Environment
			{
				pattern: /\$?\(\([\s\S]+?\)\)/,
				greedy: true,
				inside: {
					// If there is a $ sign at the beginning highlight $(( and )) as variable
					'variable': [
						{
							pattern: /(^\$\(\([\s\S]+)\)\)/,
							lookbehind: true
						},
						/^\$\(\(/
					],
					'number': /\b0x[\dA-Fa-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee]-?\d+)?/,
					// Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
					'operator': /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
					// If there is no $ sign at the beginning highlight (( and )) as punctuation
					'punctuation': /\(\(?|\)\)?|,|;/
				}
			},
			// [1]: Command Substitution
			{
				pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
				greedy: true,
				inside: {
					'variable': /^\$\(|^`|\)$|`$/
				}
			},
			// [2]: Brace expansion
			{
				pattern: /\$\{[^}]+\}/,
				greedy: true,
				inside: {
					'operator': /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
					'punctuation': /[\[\]]/,
					'environment': {
						pattern: RegExp("(\\{)" + envVars),
						lookbehind: true,
						alias: 'constant'
					}
				}
			},
			/\$(?:\w+|[#?*!@$])/
		],
		// Escape sequences from echo and printf's manuals, and escaped quotes.
		'entity': /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})/
	};

	Prism.languages.bash = {
		'shebang': {
			pattern: /^#!\s*\/.*/,
			alias: 'important'
		},
		'comment': {
			pattern: /(^|[^"{\\$])#.*/,
			lookbehind: true
		},
		'function-name': [
			// a) function foo {
			// b) foo() {
			// c) function foo() {
			// but not “foo {”
			{
				// a) and c)
				pattern: /(\bfunction\s+)\w+(?=(?:\s*\(?:\s*\))?\s*\{)/,
				lookbehind: true,
				alias: 'function'
			},
			{
				// b)
				pattern: /\b\w+(?=\s*\(\s*\)\s*\{)/,
				alias: 'function'
			}
		],
		// Highlight variable names as variables in for and select beginnings.
		'for-or-select': {
			pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
			alias: 'variable',
			lookbehind: true
		},
		// Highlight variable names as variables in the left-hand part
		// of assignments (“=” and “+=”).
		'assign-left': {
			pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
			inside: {
				'environment': {
					pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars),
					lookbehind: true,
					alias: 'constant'
				}
			},
			alias: 'variable',
			lookbehind: true
		},
		'string': [
			// Support for Here-documents https://en.wikipedia.org/wiki/Here_document
			{
				pattern: /((?:^|[^<])<<-?\s*)(\w+?)\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\2/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			},
			// Here-document with quotes around the tag
			// → No expansion (so no “inside”).
			{
				pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s*(?:\r?\n|\r)[\s\S]*?(?:\r?\n|\r)\3/,
				lookbehind: true,
				greedy: true
			},
			// “Normal” string
			{
				pattern: /(^|[^\\](?:\\\\)*)(["'])(?:\\[\s\S]|\$\([^)]+\)|`[^`]+`|(?!\2)[^\\])*\2/,
				lookbehind: true,
				greedy: true,
				inside: insideString
			}
		],
		'environment': {
			pattern: RegExp("\\$?" + envVars),
			alias: 'constant'
		},
		'variable': insideString.variable,
		'function': {
			pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|aptitude|apt-cache|apt-get|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		'keyword': {
			pattern: /(^|[\s;|&]|[<>]\()(?:if|then|else|elif|fi|for|while|in|case|esac|function|select|do|done|until)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		// https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
		'builtin': {
			pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|break|cd|continue|eval|exec|exit|export|getopts|hash|pwd|readonly|return|shift|test|times|trap|umask|unset|alias|bind|builtin|caller|command|declare|echo|enable|help|let|local|logout|mapfile|printf|read|readarray|source|type|typeset|ulimit|unalias|set|shopt)(?=$|[)\s;|&])/,
			lookbehind: true,
			// Alias added to make those easier to distinguish from strings.
			alias: 'class-name'
		},
		'boolean': {
			pattern: /(^|[\s;|&]|[<>]\()(?:true|false)(?=$|[)\s;|&])/,
			lookbehind: true
		},
		'file-descriptor': {
			pattern: /\B&\d\b/,
			alias: 'important'
		},
		'operator': {
			// Lots of redirections here, but not just that.
			pattern: /\d?<>|>\||\+=|==?|!=?|=~|<<[<-]?|[&\d]?>>|\d?[<>]&?|&[>&]?|\|[&|]?|<=?|>=?/,
			inside: {
				'file-descriptor': {
					pattern: /^\d/,
					alias: 'important'
				}
			}
		},
		'punctuation': /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
		'number': {
			pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
			lookbehind: true
		}
	};

	/* Patterns in command substitution. */
	var toBeCopied = [
		'comment',
		'function-name',
		'for-or-select',
		'assign-left',
		'string',
		'environment',
		'function',
		'keyword',
		'builtin',
		'boolean',
		'file-descriptor',
		'operator',
		'punctuation',
		'number'
	];
	var inside = insideString.variable[1].inside;
	for(var i = 0; i < toBeCopied.length; i++) {
		inside[toBeCopied[i]] = Prism.languages.bash[toBeCopied[i]];
	}

	Prism.languages.shell = Prism.languages.bash;
})(Prism);

Prism.languages.basic = {
	'comment': {
		pattern: /(?:!|REM\b).+/i,
		inside: {
			'keyword': /^REM/i
		}
	},
	'string': {
		pattern: /"(?:""|[!#$%&'()*,\/:;<=>?^_ +\-.A-Z\d])*"/i,
		greedy: true
	},
	'number': /(?:\b\d+\.?\d*|\B\.\d+)(?:E[+-]?\d+)?/i,
	'keyword': /\b(?:AS|BEEP|BLOAD|BSAVE|CALL(?: ABSOLUTE)?|CASE|CHAIN|CHDIR|CLEAR|CLOSE|CLS|COM|COMMON|CONST|DATA|DECLARE|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DIM|DO|DOUBLE|ELSE|ELSEIF|END|ENVIRON|ERASE|ERROR|EXIT|FIELD|FILES|FOR|FUNCTION|GET|GOSUB|GOTO|IF|INPUT|INTEGER|IOCTL|KEY|KILL|LINE INPUT|LOCATE|LOCK|LONG|LOOP|LSET|MKDIR|NAME|NEXT|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPEN|OPTION BASE|OUT|POKE|PUT|READ|REDIM|REM|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SHARED|SINGLE|SELECT CASE|SHELL|SLEEP|STATIC|STEP|STOP|STRING|SUB|SWAP|SYSTEM|THEN|TIMER|TO|TROFF|TRON|TYPE|UNLOCK|UNTIL|USING|VIEW PRINT|WAIT|WEND|WHILE|WRITE)(?:\$|\b)/i,
	'function': /\b(?:ABS|ACCESS|ACOS|ANGLE|AREA|ARITHMETIC|ARRAY|ASIN|ASK|AT|ATN|BASE|BEGIN|BREAK|CAUSE|CEIL|CHR|CLIP|COLLATE|COLOR|CON|COS|COSH|COT|CSC|DATE|DATUM|DEBUG|DECIMAL|DEF|DEG|DEGREES|DELETE|DET|DEVICE|DISPLAY|DOT|ELAPSED|EPS|ERASABLE|EXLINE|EXP|EXTERNAL|EXTYPE|FILETYPE|FIXED|FP|GO|GRAPH|HANDLER|IDN|IMAGE|IN|INT|INTERNAL|IP|IS|KEYED|LBOUND|LCASE|LEFT|LEN|LENGTH|LET|LINE|LINES|LOG|LOG10|LOG2|LTRIM|MARGIN|MAT|MAX|MAXNUM|MID|MIN|MISSING|MOD|NATIVE|NUL|NUMERIC|OF|OPTION|ORD|ORGANIZATION|OUTIN|OUTPUT|PI|POINT|POINTER|POINTS|POS|PRINT|PROGRAM|PROMPT|RAD|RADIANS|RANDOMIZE|RECORD|RECSIZE|RECTYPE|RELATIVE|REMAINDER|REPEAT|REST|RETRY|REWRITE|RIGHT|RND|ROUND|RTRIM|SAME|SEC|SELECT|SEQUENTIAL|SET|SETTER|SGN|SIN|SINH|SIZE|SKIP|SQR|STANDARD|STATUS|STR|STREAM|STYLE|TAB|TAN|TANH|TEMPLATE|TEXT|THERE|TIME|TIMEOUT|TRACE|TRANSFORM|TRUNCATE|UBOUND|UCASE|USE|VAL|VARIABLE|VIEWPORT|WHEN|WINDOW|WITH|ZER|ZONEWIDTH)(?:\$|\b)/i,
	'operator': /<[=>]?|>=?|[+\-*\/^=&]|\b(?:AND|EQV|IMP|NOT|OR|XOR)\b/i,
	'punctuation': /[,;:()]/
};
Prism.languages.bison = Prism.languages.extend('c', {});

Prism.languages.insertBefore('bison', 'comment', {
	'bison': {
		// This should match all the beginning of the file
		// including the prologue(s), the bison declarations and
		// the grammar rules.
		pattern: /^[\s\S]*?%%[\s\S]*?%%/,
		inside: {
			'c': {
				// Allow for one level of nested braces
				pattern: /%\{[\s\S]*?%\}|\{(?:\{[^}]*\}|[^{}])*\}/,
				inside: {
					'delimiter': {
						pattern: /^%?\{|%?\}$/,
						alias: 'punctuation'
					},
					'bison-variable': {
						pattern: /[$@](?:<[^\s>]+>)?[\w$]+/,
						alias: 'variable',
						inside: {
							'punctuation': /<|>/
						}
					},
					rest: Prism.languages.c
				}
			},
			'comment': Prism.languages.c.comment,
			'string': Prism.languages.c.string,
			'property': /\S+(?=:)/,
			'keyword': /%\w+/,
			'number': {
				pattern: /(^|[^@])\b(?:0x[\da-f]+|\d+)/i,
				lookbehind: true
			},
			'punctuation': /%[%?]|[|:;\[\]<>]/
		}
	}
});
Prism.languages.cmake = {
	'comment': /#.*/,
	'string': {
		pattern: /"(?:[^\\"]|\\.)*"/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\${(?:[^{}$]|\${[^{}$]*})*}/,
				inside: {
					'punctuation': /\${|}/,
					'variable': /\w+/
				}
			}
		}
	},
	'variable': /\b(?:CMAKE_\w+|\w+_(?:VERSION(?:_MAJOR|_MINOR|_PATCH|_TWEAK)?|(?:BINARY|SOURCE)_DIR|DESCRIPTION|HOMEPAGE_URL|ROOT)|(?:CTEST_CUSTOM_(?:MAXIMUM_(?:(?:FAIL|PASS)ED_TEST_OUTPUT_SIZE|NUMBER_OF_(?:ERROR|WARNING)S)|ERROR_(?:P(?:OST|RE)_CONTEXT|EXCEPTION|MATCH)|P(?:OST|RE)_MEMCHECK|WARNING_(?:EXCEPTION|MATCH)|(?:MEMCHECK|TESTS)_IGNORE|P(?:OST|RE)_TEST|COVERAGE_EXCLUDE)|ANDROID|APPLE|BORLAND|BUILD_SHARED_LIBS|CACHE|CPACK_(?:ABSOLUTE_DESTINATION_FILES|COMPONENT_INCLUDE_TOPLEVEL_DIRECTORY|ERROR_ON_ABSOLUTE_INSTALL_DESTINATION|INCLUDE_TOPLEVEL_DIRECTORY|INSTALL_DEFAULT_DIRECTORY_PERMISSIONS|INSTALL_SCRIPT|PACKAGING_INSTALL_PREFIX|SET_DESTDIR|WARN_ON_ABSOLUTE_INSTALL_DESTINATION)|CTEST_(?:BINARY_DIRECTORY|BUILD_COMMAND|BUILD_NAME|BZR_COMMAND|BZR_UPDATE_OPTIONS|CHANGE_ID|CHECKOUT_COMMAND|CONFIGURATION_TYPE|CONFIGURE_COMMAND|COVERAGE_COMMAND|COVERAGE_EXTRA_FLAGS|CURL_OPTIONS|CUSTOM_(?:COVERAGE_EXCLUDE|ERROR_EXCEPTION|ERROR_MATCH|ERROR_POST_CONTEXT|ERROR_PRE_CONTEXT|MAXIMUM_FAILED_TEST_OUTPUT_SIZE|MAXIMUM_NUMBER_OF_(?:ERRORS|WARNINGS)|MAXIMUM_PASSED_TEST_OUTPUT_SIZE|MEMCHECK_IGNORE|POST_MEMCHECK|POST_TEST|PRE_MEMCHECK|PRE_TEST|TESTS_IGNORE|WARNING_EXCEPTION|WARNING_MATCH)|CVS_CHECKOUT|CVS_COMMAND|CVS_UPDATE_OPTIONS|DROP_LOCATION|DROP_METHOD|DROP_SITE|DROP_SITE_CDASH|DROP_SITE_PASSWORD|DROP_SITE_USER|EXTRA_COVERAGE_GLOB|GIT_COMMAND|GIT_INIT_SUBMODULES|GIT_UPDATE_CUSTOM|GIT_UPDATE_OPTIONS|HG_COMMAND|HG_UPDATE_OPTIONS|LABELS_FOR_SUBPROJECTS|MEMORYCHECK_(?:COMMAND|COMMAND_OPTIONS|SANITIZER_OPTIONS|SUPPRESSIONS_FILE|TYPE)|NIGHTLY_START_TIME|P4_CLIENT|P4_COMMAND|P4_OPTIONS|P4_UPDATE_OPTIONS|RUN_CURRENT_SCRIPT|SCP_COMMAND|SITE|SOURCE_DIRECTORY|SUBMIT_URL|SVN_COMMAND|SVN_OPTIONS|SVN_UPDATE_OPTIONS|TEST_LOAD|TEST_TIMEOUT|TRIGGER_SITE|UPDATE_COMMAND|UPDATE_OPTIONS|UPDATE_VERSION_ONLY|USE_LAUNCHERS)|CYGWIN|ENV|EXECUTABLE_OUTPUT_PATH|GHS-MULTI|IOS|LIBRARY_OUTPUT_PATH|MINGW|MSVC(?:10|11|12|14|60|70|71|80|90|_IDE|_TOOLSET_VERSION|_VERSION)?|MSYS|PROJECT_(?:BINARY_DIR|DESCRIPTION|HOMEPAGE_URL|NAME|SOURCE_DIR|VERSION|VERSION_(?:MAJOR|MINOR|PATCH|TWEAK))|UNIX|WIN32|WINCE|WINDOWS_PHONE|WINDOWS_STORE|XCODE|XCODE_VERSION))\b/,
	'property': /\b(?:cxx_\w+|(?:ARCHIVE_OUTPUT_(?:DIRECTORY|NAME)|COMPILE_DEFINITIONS|COMPILE_PDB_NAME|COMPILE_PDB_OUTPUT_DIRECTORY|EXCLUDE_FROM_DEFAULT_BUILD|IMPORTED_(?:IMPLIB|LIBNAME|LINK_DEPENDENT_LIBRARIES|LINK_INTERFACE_LANGUAGES|LINK_INTERFACE_LIBRARIES|LINK_INTERFACE_MULTIPLICITY|LOCATION|NO_SONAME|OBJECTS|SONAME)|INTERPROCEDURAL_OPTIMIZATION|LIBRARY_OUTPUT_DIRECTORY|LIBRARY_OUTPUT_NAME|LINK_FLAGS|LINK_INTERFACE_LIBRARIES|LINK_INTERFACE_MULTIPLICITY|LOCATION|MAP_IMPORTED_CONFIG|OSX_ARCHITECTURES|OUTPUT_NAME|PDB_NAME|PDB_OUTPUT_DIRECTORY|RUNTIME_OUTPUT_DIRECTORY|RUNTIME_OUTPUT_NAME|STATIC_LIBRARY_FLAGS|VS_CSHARP|VS_DOTNET_REFERENCEPROP|VS_DOTNET_REFERENCE|VS_GLOBAL_SECTION_POST|VS_GLOBAL_SECTION_PRE|VS_GLOBAL|XCODE_ATTRIBUTE)_\w+|\w+_(?:CLANG_TIDY|COMPILER_LAUNCHER|CPPCHECK|CPPLINT|INCLUDE_WHAT_YOU_USE|OUTPUT_NAME|POSTFIX|VISIBILITY_PRESET)|ABSTRACT|ADDITIONAL_MAKE_CLEAN_FILES|ADVANCED|ALIASED_TARGET|ALLOW_DUPLICATE_CUSTOM_TARGETS|ANDROID_(?:ANT_ADDITIONAL_OPTIONS|API|API_MIN|ARCH|ASSETS_DIRECTORIES|GUI|JAR_DEPENDENCIES|NATIVE_LIB_DEPENDENCIES|NATIVE_LIB_DIRECTORIES|PROCESS_MAX|PROGUARD|PROGUARD_CONFIG_PATH|SECURE_PROPS_PATH|SKIP_ANT_STEP|STL_TYPE)|ARCHIVE_OUTPUT_DIRECTORY|ARCHIVE_OUTPUT_NAME|ATTACHED_FILES|ATTACHED_FILES_ON_FAIL|AUTOGEN_(?:BUILD_DIR|ORIGIN_DEPENDS|PARALLEL|SOURCE_GROUP|TARGETS_FOLDER|TARGET_DEPENDS)|AUTOMOC|AUTOMOC_(?:COMPILER_PREDEFINES|DEPEND_FILTERS|EXECUTABLE|MACRO_NAMES|MOC_OPTIONS|SOURCE_GROUP|TARGETS_FOLDER)|AUTORCC|AUTORCC_EXECUTABLE|AUTORCC_OPTIONS|AUTORCC_SOURCE_GROUP|AUTOUIC|AUTOUIC_EXECUTABLE|AUTOUIC_OPTIONS|AUTOUIC_SEARCH_PATHS|BINARY_DIR|BUILDSYSTEM_TARGETS|BUILD_RPATH|BUILD_RPATH_USE_ORIGIN|BUILD_WITH_INSTALL_NAME_DIR|BUILD_WITH_INSTALL_RPATH|BUNDLE|BUNDLE_EXTENSION|CACHE_VARIABLES|CLEAN_NO_CUSTOM|COMMON_LANGUAGE_RUNTIME|COMPATIBLE_INTERFACE_(?:BOOL|NUMBER_MAX|NUMBER_MIN|STRING)|COMPILE_(?:DEFINITIONS|FEATURES|FLAGS|OPTIONS|PDB_NAME|PDB_OUTPUT_DIRECTORY)|COST|CPACK_DESKTOP_SHORTCUTS|CPACK_NEVER_OVERWRITE|CPACK_PERMANENT|CPACK_STARTUP_SHORTCUTS|CPACK_START_MENU_SHORTCUTS|CPACK_WIX_ACL|CROSSCOMPILING_EMULATOR|CUDA_EXTENSIONS|CUDA_PTX_COMPILATION|CUDA_RESOLVE_DEVICE_SYMBOLS|CUDA_SEPARABLE_COMPILATION|CUDA_STANDARD|CUDA_STANDARD_REQUIRED|CXX_EXTENSIONS|CXX_STANDARD|CXX_STANDARD_REQUIRED|C_EXTENSIONS|C_STANDARD|C_STANDARD_REQUIRED|DEBUG_CONFIGURATIONS|DEBUG_POSTFIX|DEFINE_SYMBOL|DEFINITIONS|DEPENDS|DEPLOYMENT_ADDITIONAL_FILES|DEPLOYMENT_REMOTE_DIRECTORY|DISABLED|DISABLED_FEATURES|ECLIPSE_EXTRA_CPROJECT_CONTENTS|ECLIPSE_EXTRA_NATURES|ENABLED_FEATURES|ENABLED_LANGUAGES|ENABLE_EXPORTS|ENVIRONMENT|EXCLUDE_FROM_ALL|EXCLUDE_FROM_DEFAULT_BUILD|EXPORT_NAME|EXPORT_PROPERTIES|EXTERNAL_OBJECT|EchoString|FAIL_REGULAR_EXPRESSION|FIND_LIBRARY_USE_LIB32_PATHS|FIND_LIBRARY_USE_LIB64_PATHS|FIND_LIBRARY_USE_LIBX32_PATHS|FIND_LIBRARY_USE_OPENBSD_VERSIONING|FIXTURES_CLEANUP|FIXTURES_REQUIRED|FIXTURES_SETUP|FOLDER|FRAMEWORK|Fortran_FORMAT|Fortran_MODULE_DIRECTORY|GENERATED|GENERATOR_FILE_NAME|GENERATOR_IS_MULTI_CONFIG|GHS_INTEGRITY_APP|GHS_NO_SOURCE_GROUP_FILE|GLOBAL_DEPENDS_DEBUG_MODE|GLOBAL_DEPENDS_NO_CYCLES|GNUtoMS|HAS_CXX|HEADER_FILE_ONLY|HELPSTRING|IMPLICIT_DEPENDS_INCLUDE_TRANSFORM|IMPORTED|IMPORTED_(?:COMMON_LANGUAGE_RUNTIME|CONFIGURATIONS|GLOBAL|IMPLIB|LIBNAME|LINK_DEPENDENT_LIBRARIES|LINK_INTERFACE_(?:LANGUAGES|LIBRARIES|MULTIPLICITY)|LOCATION|NO_SONAME|OBJECTS|SONAME)|IMPORT_PREFIX|IMPORT_SUFFIX|INCLUDE_DIRECTORIES|INCLUDE_REGULAR_EXPRESSION|INSTALL_NAME_DIR|INSTALL_RPATH|INSTALL_RPATH_USE_LINK_PATH|INTERFACE_(?:AUTOUIC_OPTIONS|COMPILE_DEFINITIONS|COMPILE_FEATURES|COMPILE_OPTIONS|INCLUDE_DIRECTORIES|LINK_DEPENDS|LINK_DIRECTORIES|LINK_LIBRARIES|LINK_OPTIONS|POSITION_INDEPENDENT_CODE|SOURCES|SYSTEM_INCLUDE_DIRECTORIES)|INTERPROCEDURAL_OPTIMIZATION|IN_TRY_COMPILE|IOS_INSTALL_COMBINED|JOB_POOLS|JOB_POOL_COMPILE|JOB_POOL_LINK|KEEP_EXTENSION|LABELS|LANGUAGE|LIBRARY_OUTPUT_DIRECTORY|LIBRARY_OUTPUT_NAME|LINKER_LANGUAGE|LINK_(?:DEPENDS|DEPENDS_NO_SHARED|DIRECTORIES|FLAGS|INTERFACE_LIBRARIES|INTERFACE_MULTIPLICITY|LIBRARIES|OPTIONS|SEARCH_END_STATIC|SEARCH_START_STATIC|WHAT_YOU_USE)|LISTFILE_STACK|LOCATION|MACOSX_BUNDLE|MACOSX_BUNDLE_INFO_PLIST|MACOSX_FRAMEWORK_INFO_PLIST|MACOSX_PACKAGE_LOCATION|MACOSX_RPATH|MACROS|MANUALLY_ADDED_DEPENDENCIES|MEASUREMENT|MODIFIED|NAME|NO_SONAME|NO_SYSTEM_FROM_IMPORTED|OBJECT_DEPENDS|OBJECT_OUTPUTS|OSX_ARCHITECTURES|OUTPUT_NAME|PACKAGES_FOUND|PACKAGES_NOT_FOUND|PARENT_DIRECTORY|PASS_REGULAR_EXPRESSION|PDB_NAME|PDB_OUTPUT_DIRECTORY|POSITION_INDEPENDENT_CODE|POST_INSTALL_SCRIPT|PREDEFINED_TARGETS_FOLDER|PREFIX|PRE_INSTALL_SCRIPT|PRIVATE_HEADER|PROCESSORS|PROCESSOR_AFFINITY|PROJECT_LABEL|PUBLIC_HEADER|REPORT_UNDEFINED_PROPERTIES|REQUIRED_FILES|RESOURCE|RESOURCE_LOCK|RULE_LAUNCH_COMPILE|RULE_LAUNCH_CUSTOM|RULE_LAUNCH_LINK|RULE_MESSAGES|RUNTIME_OUTPUT_DIRECTORY|RUNTIME_OUTPUT_NAME|RUN_SERIAL|SKIP_AUTOGEN|SKIP_AUTOMOC|SKIP_AUTORCC|SKIP_AUTOUIC|SKIP_BUILD_RPATH|SKIP_RETURN_CODE|SOURCES|SOURCE_DIR|SOVERSION|STATIC_LIBRARY_FLAGS|STATIC_LIBRARY_OPTIONS|STRINGS|SUBDIRECTORIES|SUFFIX|SYMBOLIC|TARGET_ARCHIVES_MAY_BE_SHARED_LIBS|TARGET_MESSAGES|TARGET_SUPPORTS_SHARED_LIBS|TESTS|TEST_INCLUDE_FILE|TEST_INCLUDE_FILES|TIMEOUT|TIMEOUT_AFTER_MATCH|TYPE|USE_FOLDERS|VALUE|VARIABLES|VERSION|VISIBILITY_INLINES_HIDDEN|VS_(?:CONFIGURATION_TYPE|COPY_TO_OUT_DIR|DEBUGGER_(?:COMMAND|COMMAND_ARGUMENTS|ENVIRONMENT|WORKING_DIRECTORY)|DEPLOYMENT_CONTENT|DEPLOYMENT_LOCATION|DOTNET_REFERENCES|DOTNET_REFERENCES_COPY_LOCAL|GLOBAL_KEYWORD|GLOBAL_PROJECT_TYPES|GLOBAL_ROOTNAMESPACE|INCLUDE_IN_VSIX|IOT_STARTUP_TASK|KEYWORD|RESOURCE_GENERATOR|SCC_AUXPATH|SCC_LOCALPATH|SCC_PROJECTNAME|SCC_PROVIDER|SDK_REFERENCES|SHADER_(?:DISABLE_OPTIMIZATIONS|ENABLE_DEBUG|ENTRYPOINT|FLAGS|MODEL|OBJECT_FILE_NAME|OUTPUT_HEADER_FILE|TYPE|VARIABLE_NAME)|STARTUP_PROJECT|TOOL_OVERRIDE|USER_PROPS|WINRT_COMPONENT|WINRT_EXTENSIONS|WINRT_REFERENCES|XAML_TYPE)|WILL_FAIL|WIN32_EXECUTABLE|WINDOWS_EXPORT_ALL_SYMBOLS|WORKING_DIRECTORY|WRAP_EXCLUDE|XCODE_(?:EMIT_EFFECTIVE_PLATFORM_NAME|EXPLICIT_FILE_TYPE|FILE_ATTRIBUTES|LAST_KNOWN_FILE_TYPE|PRODUCT_TYPE|SCHEME_(?:ADDRESS_SANITIZER|ADDRESS_SANITIZER_USE_AFTER_RETURN|ARGUMENTS|DISABLE_MAIN_THREAD_CHECKER|DYNAMIC_LIBRARY_LOADS|DYNAMIC_LINKER_API_USAGE|ENVIRONMENT|EXECUTABLE|GUARD_MALLOC|MAIN_THREAD_CHECKER_STOP|MALLOC_GUARD_EDGES|MALLOC_SCRIBBLE|MALLOC_STACK|THREAD_SANITIZER(?:_STOP)?|UNDEFINED_BEHAVIOUR_SANITIZER(?:_STOP)?|ZOMBIE_OBJECTS))|XCTEST)\b/,
	'keyword': /\b(?:add_compile_definitions|add_compile_options|add_custom_command|add_custom_target|add_definitions|add_dependencies|add_executable|add_library|add_link_options|add_subdirectory|add_test|aux_source_directory|break|build_command|build_name|cmake_host_system_information|cmake_minimum_required|cmake_parse_arguments|cmake_policy|configure_file|continue|create_test_sourcelist|ctest_build|ctest_configure|ctest_coverage|ctest_empty_binary_directory|ctest_memcheck|ctest_read_custom_files|ctest_run_script|ctest_sleep|ctest_start|ctest_submit|ctest_test|ctest_update|ctest_upload|define_property|else|elseif|enable_language|enable_testing|endforeach|endfunction|endif|endmacro|endwhile|exec_program|execute_process|export|export_library_dependencies|file|find_file|find_library|find_package|find_path|find_program|fltk_wrap_ui|foreach|function|get_cmake_property|get_directory_property|get_filename_component|get_property|get_source_file_property|get_target_property|get_test_property|if|include|include_directories|include_external_msproject|include_guard|include_regular_expression|install|install_files|install_programs|install_targets|link_directories|link_libraries|list|load_cache|load_command|macro|make_directory|mark_as_advanced|math|message|option|output_required_files|project|qt_wrap_cpp|qt_wrap_ui|remove|remove_definitions|return|separate_arguments|set|set_directory_properties|set_property|set_source_files_properties|set_target_properties|set_tests_properties|site_name|source_group|string|subdir_depends|subdirs|target_compile_definitions|target_compile_features|target_compile_options|target_include_directories|target_link_directories|target_link_libraries|target_link_options|target_sources|try_compile|try_run|unset|use_mangled_mesa|utility_source|variable_requires|variable_watch|while|write_file)(?=\s*\()\b/,
	'boolean': /\b(?:ON|OFF|TRUE|FALSE)\b/,
	'namespace': /\b(?:PROPERTIES|SHARED|PRIVATE|STATIC|PUBLIC|INTERFACE|TARGET_OBJECTS)\b/,
	'operator': /\b(?:NOT|AND|OR|MATCHES|LESS|GREATER|EQUAL|STRLESS|STRGREATER|STREQUAL|VERSION_LESS|VERSION_EQUAL|VERSION_GREATER|DEFINED)\b/,
	'inserted': {
		pattern: /\b\w+::\w+\b/,
		alias: 'class-name'
	},
	'number': /\b\d+(?:\.\d+)*\b/,
	'function': /\b[a-z_]\w*(?=\s*\()\b/i,
	'punctuation': /[()>}]|\$[<{]/
};

(function (Prism) {

	var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
	var selectorInside;

	Prism.languages.css.selector = {
		pattern: Prism.languages.css.selector,
		inside: selectorInside = {
			'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
			'pseudo-class': /:[-\w]+/,
			'class': /\.[-:.\w]+/,
			'id': /#[-:.\w]+/,
			'attribute': {
				pattern: RegExp('\\[(?:[^[\\]"\']|' + string.source + ')*\\]'),
				greedy: true,
				inside: {
					'punctuation': /^\[|\]$/,
					'case-sensitivity': {
						pattern: /(\s)[si]$/i,
						lookbehind: true,
						alias: 'keyword'
					},
					'namespace': {
						pattern: /^(\s*)[-*\w\xA0-\uFFFF]*\|(?!=)/,
						lookbehind: true,
						inside: {
							'punctuation': /\|$/
						}
					},
					'attribute': {
						pattern: /^(\s*)[-\w\xA0-\uFFFF]+/,
						lookbehind: true
					},
					'value': [
						string,
						{
							pattern: /(=\s*)[-\w\xA0-\uFFFF]+(?=\s*$)/,
							lookbehind: true
						}
					],
					'operator': /[|~*^$]?=/
				}
			},
			'n-th': [
				{
					pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
					lookbehind: true,
					inside: {
						'number': /[\dn]+/,
						'operator': /[+-]/
					}
				},
				{
					pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
					lookbehind: true
				}
			],
			'punctuation': /[()]/
		}
	};

	Prism.languages.css['atrule'].inside['selector-function-argument'].inside = selectorInside;

	Prism.languages.insertBefore('css', 'property', {
		'variable': {
			pattern: /(^|[^-\w\xA0-\uFFFF])--[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*/i,
			lookbehind: true
		}
	});

	var unit = {
		pattern: /(\d)(?:%|[a-z]+)/,
		lookbehind: true
	};
	// 123 -123 .123 -.123 12.3 -12.3
	var number = {
		pattern: /(^|[^\w.-])-?\d*\.?\d+/,
		lookbehind: true
	};

	Prism.languages.insertBefore('css', 'function', {
		'operator': {
			pattern: /(\s)[+\-*\/](?=\s)/,
			lookbehind: true
		},
		// CAREFUL!
		// Previewers and Inline color use hexcode and color.
		'hexcode': {
			pattern: /\B#(?:[\da-f]{1,2}){3,4}\b/i,
			alias: 'color'
		},
		'color': [
			/\b(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)\b/i,
			{
				pattern: /\b(?:rgb|hsl)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:rgb|hsl)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
				inside: {
					'unit': unit,
					'number': number,
					'function': /[\w-]+(?=\()/,
					'punctuation': /[(),]/
				}
			}
		],
		'entity': /\\[\da-f]{1,8}/i,
		'unit': unit,
		'number': number
	});

})(Prism);

(function (Prism) {

	Prism.languages.diff = {
		'coord': [
			// Match all kinds of coord lines (prefixed by "+++", "---" or "***").
			/^(?:\*{3}|-{3}|\+{3}).*$/m,
			// Match "@@ ... @@" coord lines in unified diff.
			/^@@.*@@$/m,
			// Match coord lines in normal diff (starts with a number).
			/^\d+.*$/m
		]

		// deleted, inserted, unchanged, diff
	};

	/**
	 * A map from the name of a block to its line prefix.
	 *
	 * @type {Object<string, string>}
	 */
	var PREFIXES = {
		'deleted-sign': '-',
		'deleted-arrow': '<',
		'inserted-sign': '+',
		'inserted-arrow': '>',
		'unchanged': ' ',
		'diff': '!',
	};

	// add a token for each prefix
	Object.keys(PREFIXES).forEach(function (name) {
		var prefix = PREFIXES[name];

		var alias = [];
		if (!/^\w+$/.test(name)) { // "deleted-sign" -> "deleted"
			alias.push(/\w+/.exec(name)[0]);
		}
		if (name === "diff") {
			alias.push("bold");
		}

		Prism.languages.diff[name] = {
			pattern: RegExp('^(?:[' + prefix + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
			alias: alias,
			inside: {
				'line': {
					pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
					lookbehind: true
				},
				'prefix': {
					pattern: /[\s\S]/,
					alias: /\w+/.exec(name)[0]
				}
			}
		};
		
	});

	// make prefixes available to Diff plugin
	Object.defineProperty(Prism.languages.diff, 'PREFIXES', {
		value: PREFIXES
	});

}(Prism));

Prism.languages.docker = {
	'keyword': {
		pattern: /(^\s*)(?:ADD|ARG|CMD|COPY|ENTRYPOINT|ENV|EXPOSE|FROM|HEALTHCHECK|LABEL|MAINTAINER|ONBUILD|RUN|SHELL|STOPSIGNAL|USER|VOLUME|WORKDIR)(?=\s)/mi,
		lookbehind: true
	},
	'string': /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*\1/,
	'comment': /#.*/,
	'punctuation': /---|\.\.\.|[:[\]{}\-,|>?]/
};

Prism.languages.dockerfile = Prism.languages.docker;

Prism.languages.git = {
	/*
	 * A simple one line comment like in a git status command
	 * For instance:
	 * $ git status
	 * # On branch infinite-scroll
	 * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
	 * # and have 1 and 2 different commits each, respectively.
	 * nothing to commit (working directory clean)
	 */
	'comment': /^#.*/m,

	/*
	 * Regexp to match the changed lines in a git diff output. Check the example below.
	 */
	'deleted': /^[-–].*/m,
	'inserted': /^\+.*/m,

	/*
	 * a string (double and simple quote)
	 */
	'string': /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/m,

	/*
	 * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
	 * For instance:
	 * $ git add file.txt
	 */
	'command': {
		pattern: /^.*\$ git .*$/m,
		inside: {
			/*
			 * A git command can contain a parameter starting by a single or a double dash followed by a string
			 * For instance:
			 * $ git diff --cached
			 * $ git log -p
			 */
			'parameter': /\s--?\w+/m
		}
	},

	/*
	 * Coordinates displayed in a git diff command
	 * For instance:
	 * $ git diff
	 * diff --git file.txt file.txt
	 * index 6214953..1d54a52 100644
	 * --- file.txt
	 * +++ file.txt
	 * @@ -1 +1,2 @@
	 * -Here's my tetx file
	 * +Here's my text file
	 * +And this is the second line
	 */
	'coord': /^@@.*@@$/m,

	/*
	 * Match a "commit [SHA1]" line in a git log output.
	 * For instance:
	 * $ git log
	 * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
	 * Author: lgiraudel
	 * Date:   Mon Feb 17 11:18:34 2014 +0100
	 *
	 *     Add of a new line
	 */
	'commit_sha1': /^commit \w{40}$/m
};

Prism.languages.go = Prism.languages.extend('clike', {
	'keyword': /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(?:to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'builtin': /\b(?:bool|byte|complex(?:64|128)|error|float(?:32|64)|rune|string|u?int(?:8|16|32|64)?|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(?:ln)?|real|recover)\b/,
	'boolean': /\b(?:_|iota|nil|true|false)\b/,
	'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
	'number': /(?:\b0x[a-f\d]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e[-+]?\d+)?)i?/i,
	'string': {
		pattern: /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
		greedy: true
	}
});
delete Prism.languages.go['class-name'];

Prism.languages.haskell = {
	'comment': {
		pattern: /(^|[^-!#$%*+=?&@|~.:<>^\\\/])(?:--[^-!#$%*+=?&@|~.:<>^\\\/].*|{-[\s\S]*?-})/m,
		lookbehind: true
	},
	'char': /'(?:[^\\']|\\(?:[abfnrtv\\"'&]|\^[A-Z@[\]^_]|NUL|SOH|STX|ETX|EOT|ENQ|ACK|BEL|BS|HT|LF|VT|FF|CR|SO|SI|DLE|DC1|DC2|DC3|DC4|NAK|SYN|ETB|CAN|EM|SUB|ESC|FS|GS|RS|US|SP|DEL|\d+|o[0-7]+|x[0-9a-fA-F]+))'/,
	'string': {
		pattern: /"(?:[^\\"]|\\(?:[abfnrtv\\"'&]|\^[A-Z@[\]^_]|NUL|SOH|STX|ETX|EOT|ENQ|ACK|BEL|BS|HT|LF|VT|FF|CR|SO|SI|DLE|DC1|DC2|DC3|DC4|NAK|SYN|ETB|CAN|EM|SUB|ESC|FS|GS|RS|US|SP|DEL|\d+|o[0-7]+|x[0-9a-fA-F]+)|\\\s+\\)*"/,
		greedy: true
	},
	'keyword': /\b(?:case|class|data|deriving|do|else|if|in|infixl|infixr|instance|let|module|newtype|of|primitive|then|type|where)\b/,
	'import_statement': {
		// The imported or hidden names are not included in this import
		// statement. This is because we want to highlight those exactly like
		// we do for the names in the program.
		pattern: /((?:\r?\n|\r|^)\s*)import\s+(?:qualified\s+)?(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*(?:\s+as\s+(?:[A-Z][_a-zA-Z0-9']*)(?:\.[A-Z][\w']*)*)?(?:\s+hiding\b)?/m,
		lookbehind: true,
		inside: {
			'keyword': /\b(?:import|qualified|as|hiding)\b/
		}
	},
	// These are builtin variables only. Constructors are highlighted later as a constant.
	'builtin': /\b(?:abs|acos|acosh|all|and|any|appendFile|approxRational|asTypeOf|asin|asinh|atan|atan2|atanh|basicIORun|break|catch|ceiling|chr|compare|concat|concatMap|const|cos|cosh|curry|cycle|decodeFloat|denominator|digitToInt|div|divMod|drop|dropWhile|either|elem|encodeFloat|enumFrom|enumFromThen|enumFromThenTo|enumFromTo|error|even|exp|exponent|fail|filter|flip|floatDigits|floatRadix|floatRange|floor|fmap|foldl|foldl1|foldr|foldr1|fromDouble|fromEnum|fromInt|fromInteger|fromIntegral|fromRational|fst|gcd|getChar|getContents|getLine|group|head|id|inRange|index|init|intToDigit|interact|ioError|isAlpha|isAlphaNum|isAscii|isControl|isDenormalized|isDigit|isHexDigit|isIEEE|isInfinite|isLower|isNaN|isNegativeZero|isOctDigit|isPrint|isSpace|isUpper|iterate|last|lcm|length|lex|lexDigits|lexLitChar|lines|log|logBase|lookup|map|mapM|mapM_|max|maxBound|maximum|maybe|min|minBound|minimum|mod|negate|not|notElem|null|numerator|odd|or|ord|otherwise|pack|pi|pred|primExitWith|print|product|properFraction|putChar|putStr|putStrLn|quot|quotRem|range|rangeSize|read|readDec|readFile|readFloat|readHex|readIO|readInt|readList|readLitChar|readLn|readOct|readParen|readSigned|reads|readsPrec|realToFrac|recip|rem|repeat|replicate|return|reverse|round|scaleFloat|scanl|scanl1|scanr|scanr1|seq|sequence|sequence_|show|showChar|showInt|showList|showLitChar|showParen|showSigned|showString|shows|showsPrec|significand|signum|sin|sinh|snd|sort|span|splitAt|sqrt|subtract|succ|sum|tail|take|takeWhile|tan|tanh|threadToIOResult|toEnum|toInt|toInteger|toLower|toRational|toUpper|truncate|uncurry|undefined|unlines|until|unwords|unzip|unzip3|userError|words|writeFile|zip|zip3|zipWith|zipWith3)\b/,
	// decimal integers and floating point numbers | octal integers | hexadecimal integers
	'number': /\b(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?|0o[0-7]+|0x[0-9a-f]+)\b/i,
	// Most of this is needed because of the meaning of a single '.'.
	// If it stands alone freely, it is the function composition.
	// It may also be a separator between a module name and an identifier => no
	// operator. If it comes together with other special characters it is an
	// operator too.
	'operator': /\s\.\s|[-!#$%*+=?&@|~.:<>^\\\/]*\.[-!#$%*+=?&@|~.:<>^\\\/]+|[-!#$%*+=?&@|~.:<>^\\\/]+\.[-!#$%*+=?&@|~.:<>^\\\/]*|[-!#$%*+=?&@|~:<>^\\\/]+|`(?:[A-Z][\w']*\.)*[_a-z][\w']*`/,
	// In Haskell, nearly everything is a variable, do not highlight these.
	'hvariable': /\b(?:[A-Z][\w']*\.)*[_a-z][\w']*\b/,
	'constant': /\b(?:[A-Z][\w']*\.)*[A-Z][\w']*\b/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.hs = Prism.languages.haskell;

(function (Prism) {

	var keywords = /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|exports|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|module|native|new|null|open|opens|package|private|protected|provides|public|record|requires|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|to|transient|transitive|try|uses|var|void|volatile|while|with|yield)\b/;

	// based on the java naming conventions
	var className = /\b[A-Z](?:\w*[a-z]\w*)?\b/;

	Prism.languages.java = Prism.languages.extend('clike', {
		'class-name': [
			className,

			// variables and parameters
			// this to support class names (or generic parameters) which do not contain a lower case letter (also works for methods)
			/\b[A-Z]\w*(?=\s+\w+\s*[;,=())])/
		],
		'keyword': keywords,
		'function': [
			Prism.languages.clike.function,
			{
				pattern: /(\:\:)[a-z_]\w*/,
				lookbehind: true
			}
		],
		'number': /\b0b[01][01_]*L?\b|\b0x[\da-f_]*\.?[\da-f_p+-]+\b|(?:\b\d[\d_]*\.?[\d_]*|\B\.\d[\d_]*)(?:e[+-]?\d[\d_]*)?[dfl]?/i,
		'operator': {
			pattern: /(^|[^.])(?:<<=?|>>>?=?|->|--|\+\+|&&|\|\||::|[?:~]|[-+*/%&|^!=<>]=?)/m,
			lookbehind: true
		}
	});

	Prism.languages.insertBefore('java', 'string', {
		'triple-quoted-string': {
			// http://openjdk.java.net/jeps/355#Description
			pattern: /"""[ \t]*[\r\n](?:(?:"|"")?(?:\\.|[^"\\]))*"""/,
			greedy: true,
			alias: 'string'
		}
	});

	Prism.languages.insertBefore('java', 'class-name', {
		'annotation': {
			alias: 'punctuation',
			pattern: /(^|[^.])@\w+/,
			lookbehind: true
		},
		'namespace': {
			pattern: RegExp(
				/(\b(?:exports|import(?:\s+static)?|module|open|opens|package|provides|requires|to|transitive|uses|with)\s+)(?!<keyword>)[a-z]\w*(?:\.[a-z]\w*)*\.?/
					.source.replace(/<keyword>/g, function () { return keywords.source; })),
			lookbehind: true,
			inside: {
				'punctuation': /\./,
			}
		},
		'generics': {
			pattern: /<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<(?:[\w\s,.&?]|<[\w\s,.&?]*>)*>)*>)*>/,
			inside: {
				'class-name': className,
				'keyword': keywords,
				'punctuation': /[<>(),.:]/,
				'operator': /[?&|]/
			}
		}
	});
}(Prism));

(function (Prism) {

	Prism.languages.insertBefore('javascript', 'function-variable', {
		'method-variable': {
			pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function-variable'].pattern.source),
			lookbehind: true,
			alias: ['function-variable', 'method', 'function', 'property-access']
		}
	});

	Prism.languages.insertBefore('javascript', 'function', {
		'method': {
			pattern: RegExp('(\\.\\s*)' + Prism.languages.javascript['function'].source),
			lookbehind: true,
			alias: ['function', 'property-access']
		}
	});

	Prism.languages.insertBefore('javascript', 'constant', {
		'known-class-name': [
			{
				// standard built-ins
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
				pattern: /\b(?:(?:(?:Uint|Int)(?:8|16|32)|Uint8Clamped|Float(?:32|64))?Array|ArrayBuffer|BigInt|Boolean|DataView|Date|Error|Function|Intl|JSON|Math|Number|Object|Promise|Proxy|Reflect|RegExp|String|Symbol|(?:Weak)?(?:Set|Map)|WebAssembly)\b/,
				alias: 'class-name'
			},
			{
				// errors
				pattern: /\b(?:[A-Z]\w*)Error\b/,
				alias: 'class-name'
			}
		]
	});

	Prism.languages.javascript['keyword'].unshift(
		{
			pattern: /\b(?:as|default|export|from|import)\b/,
			alias: 'module'
		},
		{
			pattern: /\bnull\b/,
			alias: ['null', 'nil']
		},
		{
			pattern: /\bundefined\b/,
			alias: 'nil'
		}
	);

	Prism.languages.insertBefore('javascript', 'operator', {
		'spread': {
			pattern: /\.{3}/,
			alias: 'operator'
		},
		'arrow': {
			pattern: /=>/,
			alias: 'operator'
		}
	});

	Prism.languages.insertBefore('javascript', 'punctuation', {
		'property-access': {
			pattern: /(\.\s*)#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*/,
			lookbehind: true
		},
		'maybe-class-name': {
			pattern: /(^|[^$\w\xA0-\uFFFF])[A-Z][$\w\xA0-\uFFFF]+/,
			lookbehind: true
		},
		'dom': {
			// this contains only a few commonly used DOM variables
			pattern: /\b(?:document|location|navigator|performance|(?:local|session)Storage|window)\b/,
			alias: 'variable'
		},
		'console': {
			pattern: /\bconsole(?=\s*\.)/,
			alias: 'class-name'
		}
	});


	// add 'maybe-class-name' to tokens which might be a class name
	var maybeClassNameTokens = ['function', 'function-variable', 'method', 'method-variable', 'property-access'];

	for (var i = 0; i < maybeClassNameTokens.length; i++) {
		var token = maybeClassNameTokens[i];
		var value = Prism.languages.javascript[token];

		// convert regex to object
		if (Prism.util.type(value) === 'RegExp') {
			value = Prism.languages.javascript[token] = {
				pattern: value
			};
		}

		// keep in mind that we don't support arrays

		var inside = value.inside || {};
		value.inside = inside;

		inside['maybe-class-name'] = /^[A-Z][\s\S]*/;
	}

}(Prism));

Prism.languages.json = {
	'property': {
		pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
		greedy: true
	},
	'string': {
		pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
		greedy: true
	},
	'comment': /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
	'number': /-?\d+\.?\d*(?:e[+-]?\d+)?/i,
	'punctuation': /[{}[\],]/,
	'operator': /:/,
	'boolean': /\b(?:true|false)\b/,
	'null': {
		pattern: /\bnull\b/,
		alias: 'keyword'
	}
};

Prism.languages.jsonp = Prism.languages.extend('json', {
	'punctuation': /[{}[\]();,.]/
});

Prism.languages.insertBefore('jsonp', 'punctuation', {
	'function': /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/
});

(function (Prism) {

	var string = /("|')(?:\\(?:\r\n?|\n|.)|(?!\1)[^\\\r\n])*\1/

	Prism.languages.json5 = Prism.languages.extend('json', {
		'property': [
			{
				pattern: RegExp(string.source + '(?=\\s*:)'),
				greedy: true
			},
			{
				pattern: /[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*:)/,
				alias: 'unquoted'
			}
		],
		'string': {
			pattern: string,
			greedy: true
		},
		'number': /[+-]?(?:NaN|Infinity|0x[a-fA-F\d]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/
	});

}(Prism));

(function (Prism) {
	Prism.languages.kotlin = Prism.languages.extend('clike', {
		'keyword': {
			// The lookbehind prevents wrong highlighting of e.g. kotlin.properties.get
			pattern: /(^|[^.])\b(?:abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|to|try|typealias|val|var|vararg|when|where|while)\b/,
			lookbehind: true
		},
		'function': [
			/\w+(?=\s*\()/,
			{
				pattern: /(\.)\w+(?=\s*\{)/,
				lookbehind: true
			}
		],
		'number': /\b(?:0[xX][\da-fA-F]+(?:_[\da-fA-F]+)*|0[bB][01]+(?:_[01]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?[fFL]?)\b/,
		'operator': /\+[+=]?|-[-=>]?|==?=?|!(?:!|==?)?|[\/*%<>]=?|[?:]:?|\.\.|&&|\|\||\b(?:and|inv|or|shl|shr|ushr|xor)\b/
	});

	delete Prism.languages.kotlin["class-name"];

	Prism.languages.insertBefore('kotlin', 'string', {
		'raw-string': {
			pattern: /("""|''')[\s\S]*?\1/,
			alias: 'string'
			// See interpolation below
		}
	});
	Prism.languages.insertBefore('kotlin', 'keyword', {
		'annotation': {
			pattern: /\B@(?:\w+:)?(?:[A-Z]\w*|\[[^\]]+\])/,
			alias: 'builtin'
		}
	});
	Prism.languages.insertBefore('kotlin', 'function', {
		'label': {
			pattern: /\w+@|@\w+/,
			alias: 'symbol'
		}
	});

	var interpolation = [
		{
			pattern: /\$\{[^}]+\}/,
			inside: {
				'delimiter': {
					pattern: /^\$\{|\}$/,
					alias: 'variable'
				},
				rest: Prism.languages.kotlin
			}
		},
		{
			pattern: /\$\w+/,
			alias: 'variable'
		}
	];

	Prism.languages.kotlin['string'].inside = Prism.languages.kotlin['raw-string'].inside = {
		interpolation: interpolation
	};

}(Prism));

(function (Prism) {
	var funcPattern = /\\(?:[^a-z()[\]]|[a-z*]+)/i;
	var insideEqu = {
		'equation-command': {
			pattern: funcPattern,
			alias: 'regex'
		}
	};

	Prism.languages.latex = {
		'comment': /%.*/m,
		// the verbatim environment prints whitespace to the document
		'cdata': {
			pattern: /(\\begin\{((?:verbatim|lstlisting)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
			lookbehind: true
		},
		/*
		 * equations can be between $$ $$ or $ $ or \( \) or \[ \]
		 * (all are multiline)
		 */
		'equation': [
			{
				pattern: /\$\$(?:\\[\s\S]|[^\\$])+\$\$|\$(?:\\[\s\S]|[^\\$])+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/,
				inside: insideEqu,
				alias: 'string'
			},
			{
				pattern: /(\\begin\{((?:equation|math|eqnarray|align|multline|gather)\*?)\})[\s\S]*?(?=\\end\{\2\})/,
				lookbehind: true,
				inside: insideEqu,
				alias: 'string'
			}
		],
		/*
		 * arguments which are keywords or references are highlighted
		 * as keywords
		 */
		'keyword': {
			pattern: /(\\(?:begin|end|ref|cite|label|usepackage|documentclass)(?:\[[^\]]+\])?\{)[^}]+(?=\})/,
			lookbehind: true
		},
		'url': {
			pattern: /(\\url\{)[^}]+(?=\})/,
			lookbehind: true
		},
		/*
		 * section or chapter headlines are highlighted as bold so that
		 * they stand out more
		 */
		'headline': {
			pattern: /(\\(?:part|chapter|section|subsection|frametitle|subsubsection|paragraph|subparagraph|subsubparagraph|subsubsubparagraph)\*?(?:\[[^\]]+\])?\{)[^}]+(?=\}(?:\[[^\]]+\])?)/,
			lookbehind: true,
			alias: 'class-name'
		},
		'function': {
			pattern: funcPattern,
			alias: 'selector'
		},
		'punctuation': /[[\]{}&]/
	};

	Prism.languages.tex = Prism.languages.latex;
	Prism.languages.context = Prism.languages.latex;
})(Prism);

/* FIXME :
 :extend() is not handled specifically : its highlighting is buggy.
 Mixin usage must be inside a ruleset to be highlighted.
 At-rules (e.g. import) containing interpolations are buggy.
 Detached rulesets are highlighted as at-rules.
 A comment before a mixin usage prevents the latter to be properly highlighted.
 */

Prism.languages.less = Prism.languages.extend('css', {
	'comment': [
		/\/\*[\s\S]*?\*\//,
		{
			pattern: /(^|[^\\])\/\/.*/,
			lookbehind: true
		}
	],
	'atrule': {
		pattern: /@[\w-]+?(?:\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};])*?(?=\s*\{)/,
		inside: {
			'punctuation': /[:()]/
		}
	},
	// selectors and mixins are considered the same
	'selector': {
		pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};@])*?(?=\s*\{)/,
		inside: {
			// mixin parameters
			'variable': /@+[\w-]+/
		}
	},

	'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,
	'operator': /[+\-*\/]/
});

Prism.languages.insertBefore('less', 'property', {
	'variable': [
		// Variable declaration (the colon must be consumed!)
		{
			pattern: /@[\w-]+\s*:/,
			inside: {
				"punctuation": /:/
			}
		},

		// Variable usage
		/@@?[\w-]+/
	],
	'mixin-usage': {
		pattern: /([{;]\s*)[.#](?!\d)[\w-]+.*?(?=[(;])/,
		lookbehind: true,
		alias: 'function'
	}
});

Prism.languages.makefile = {
	'comment': {
		pattern: /(^|[^\\])#(?:\\(?:\r\n|[\s\S])|[^\\\r\n])*/,
		lookbehind: true
	},
	'string': {
		pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},

	// Built-in target names
	'builtin': /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,

	// Targets
	'symbol': {
		pattern: /^[^:=\r\n]+(?=\s*:(?!=))/m,
		inside: {
			'variable': /\$+(?:[^(){}:#=\s]+|(?=[({]))/
		}
	},
	'variable': /\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,

	'keyword': [
		// Directives
		/-include\b|\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|include|override|private|sinclude|undefine|unexport|vpath)\b/,
		// Functions
		{
			pattern: /(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,
			lookbehind: true
		}
	],
	'operator': /(?:::|[?:+!])?=|[|@]/,
	'punctuation': /[:;(){}]/
};
(function (Prism) {

	// Allow only one line break
	var inner = /(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?!\n|\r\n?))/.source;

	/**
	 * This function is intended for the creation of the bold or italic pattern.
	 *
	 * This also adds a lookbehind group to the given pattern to ensure that the pattern is not backslash-escaped.
	 *
	 * _Note:_ Keep in mind that this adds a capturing group.
	 *
	 * @param {string} pattern
	 * @param {boolean} starAlternative Whether to also add an alternative where all `_`s are replaced with `*`s.
	 * @returns {RegExp}
	 */
	function createInline(pattern, starAlternative) {
		pattern = pattern.replace(/<inner>/g, function () { return inner; });
		if (starAlternative) {
			pattern = pattern + '|' + pattern.replace(/_/g, '\\*');
		}
		return RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + '(?:' + pattern + ')');
	}


	var tableCell = /(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source;
	var tableRow = /\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|$)/.source.replace(/__/g, function () { return tableCell; });
	var tableLine = /\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source;


	Prism.languages.markdown = Prism.languages.extend('markup', {});
	Prism.languages.insertBefore('markdown', 'prolog', {
		'blockquote': {
			// > ...
			pattern: /^>(?:[\t ]*>)*/m,
			alias: 'punctuation'
		},
		'table': {
			pattern: RegExp('^' + tableRow + tableLine + '(?:' + tableRow + ')*', 'm'),
			inside: {
				'table-data-rows': {
					pattern: RegExp('^(' + tableRow + tableLine + ')(?:' + tableRow + ')*$'),
					lookbehind: true,
					inside: {
						'table-data': {
							pattern: RegExp(tableCell),
							inside: Prism.languages.markdown
						},
						'punctuation': /\|/
					}
				},
				'table-line': {
					pattern: RegExp('^(' + tableRow + ')' + tableLine + '$'),
					lookbehind: true,
					inside: {
						'punctuation': /\||:?-{3,}:?/
					}
				},
				'table-header-row': {
					pattern: RegExp('^' + tableRow + '$'),
					inside: {
						'table-header': {
							pattern: RegExp(tableCell),
							alias: 'important',
							inside: Prism.languages.markdown
						},
						'punctuation': /\|/
					}
				}
			}
		},
		'code': [
			{
				// Prefixed by 4 spaces or 1 tab and preceded by an empty line
				pattern: /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
				lookbehind: true,
				alias: 'keyword'
			},
			{
				// `code`
				// ``code``
				pattern: /``.+?``|`[^`\r\n]+`/,
				alias: 'keyword'
			},
			{
				// ```optional language
				// code block
				// ```
				pattern: /^```[\s\S]*?^```$/m,
				greedy: true,
				inside: {
					'code-block': {
						pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
						lookbehind: true
					},
					'code-language': {
						pattern: /^(```).+/,
						lookbehind: true
					},
					'punctuation': /```/
				}
			}
		],
		'title': [
			{
				// title 1
				// =======

				// title 2
				// -------
				pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
				alias: 'important',
				inside: {
					punctuation: /==+$|--+$/
				}
			},
			{
				// # title 1
				// ###### title 6
				pattern: /(^\s*)#+.+/m,
				lookbehind: true,
				alias: 'important',
				inside: {
					punctuation: /^#+|#+$/
				}
			}
		],
		'hr': {
			// ***
			// ---
			// * * *
			// -----------
			pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
			lookbehind: true,
			alias: 'punctuation'
		},
		'list': {
			// * item
			// + item
			// - item
			// 1. item
			pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
			lookbehind: true,
			alias: 'punctuation'
		},
		'url-reference': {
			// [id]: http://example.com "Optional title"
			// [id]: http://example.com 'Optional title'
			// [id]: http://example.com (Optional title)
			// [id]: <http://example.com> "Optional title"
			pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
			inside: {
				'variable': {
					pattern: /^(!?\[)[^\]]+/,
					lookbehind: true
				},
				'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
				'punctuation': /^[\[\]!:]|[<>]/
			},
			alias: 'url'
		},
		'bold': {
			// **strong**
			// __strong__

			// allow one nested instance of italic text using the same delimiter
			pattern: createInline(/__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__/.source, true),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^..)[\s\S]+(?=..$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /\*\*|__/
			}
		},
		'italic': {
			// *em*
			// _em_

			// allow one nested instance of bold text using the same delimiter
			pattern: createInline(/_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_/.source, true),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^.)[\s\S]+(?=.$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /[*_]/
			}
		},
		'strike': {
			// ~~strike through~~
			// ~strike~
			pattern: createInline(/(~~?)(?:(?!~)<inner>)+?\2/.source, false),
			lookbehind: true,
			greedy: true,
			inside: {
				'content': {
					pattern: /(^~~?)[\s\S]+(?=\1$)/,
					lookbehind: true,
					inside: {} // see below
				},
				'punctuation': /~~?/
			}
		},
		'url': {
			// [example](http://example.com "Optional title")
			// [example][id]
			// [example] [id]
			pattern: createInline(/!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[(?:(?!\])<inner>)+\])/.source, false),
			lookbehind: true,
			greedy: true,
			inside: {
				'variable': {
					pattern: /(\[)[^\]]+(?=\]$)/,
					lookbehind: true
				},
				'content': {
					pattern: /(^!?\[)[^\]]+(?=\])/,
					lookbehind: true,
					inside: {} // see below
				},
				'string': {
					pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
				}
			}
		}
	});

	['url', 'bold', 'italic', 'strike'].forEach(function (token) {
		['url', 'bold', 'italic', 'strike'].forEach(function (inside) {
			if (token !== inside) {
				Prism.languages.markdown[token].inside.content.inside[inside] = Prism.languages.markdown[inside];
			}
		});
	});

	Prism.hooks.add('after-tokenize', function (env) {
		if (env.language !== 'markdown' && env.language !== 'md') {
			return;
		}

		function walkTokens(tokens) {
			if (!tokens || typeof tokens === 'string') {
				return;
			}

			for (var i = 0, l = tokens.length; i < l; i++) {
				var token = tokens[i];

				if (token.type !== 'code') {
					walkTokens(token.content);
					continue;
				}

				/*
				 * Add the correct `language-xxxx` class to this code block. Keep in mind that the `code-language` token
				 * is optional. But the grammar is defined so that there is only one case we have to handle:
				 *
				 * token.content = [
				 *     <span class="punctuation">```</span>,
				 *     <span class="code-language">xxxx</span>,
				 *     '\n', // exactly one new lines (\r or \n or \r\n)
				 *     <span class="code-block">...</span>,
				 *     '\n', // exactly one new lines again
				 *     <span class="punctuation">```</span>
				 * ];
				 */

				var codeLang = token.content[1];
				var codeBlock = token.content[3];

				if (codeLang && codeBlock &&
					codeLang.type === 'code-language' && codeBlock.type === 'code-block' &&
					typeof codeLang.content === 'string') {

					// this might be a language that Prism does not support

					// do some replacements to support C++, C#, and F#
					var lang = codeLang.content.replace(/\b#/g, 'sharp').replace(/\b\+\+/g, 'pp')
					// only use the first word
					lang = (/[a-z][\w-]*/i.exec(lang) || [''])[0].toLowerCase();
					var alias = 'language-' + lang;

					// add alias
					if (!codeBlock.alias) {
						codeBlock.alias = [alias];
					} else if (typeof codeBlock.alias === 'string') {
						codeBlock.alias = [codeBlock.alias, alias];
					} else {
						codeBlock.alias.push(alias);
					}
				}
			}
		}

		walkTokens(env.tokens);
	});

	Prism.hooks.add('wrap', function (env) {
		if (env.type !== 'code-block') {
			return;
		}

		var codeLang = '';
		for (var i = 0, l = env.classes.length; i < l; i++) {
			var cls = env.classes[i];
			var match = /language-(.+)/.exec(cls);
			if (match) {
				codeLang = match[1];
				break;
			}
		}

		var grammar = Prism.languages[codeLang];

		if (!grammar) {
			if (codeLang && codeLang !== 'none' && Prism.plugins.autoloader) {
				var id = 'md-' + new Date().valueOf() + '-' + Math.floor(Math.random() * 1e16);
				env.attributes['id'] = id;

				Prism.plugins.autoloader.loadLanguages(codeLang, function () {
					var ele = document.getElementById(id);
					if (ele) {
						ele.innerHTML = Prism.highlight(ele.textContent, Prism.languages[codeLang], codeLang);
					}
				});
			}
		} else {
			// reverse Prism.util.encode
			var code = env.content.replace(/&lt;/g, '<').replace(/&amp;/g, '&');

			env.content = Prism.highlight(code, grammar, codeLang);
		}
	});

	Prism.languages.md = Prism.languages.markdown;

}(Prism));

Prism.languages.matlab = {
	'comment': [
		/%\{[\s\S]*?\}%/,
		/%.+/
	],
	'string': {
		pattern: /\B'(?:''|[^'\r\n])*'/,
		greedy: true
	},
	// FIXME We could handle imaginary numbers as a whole
	'number': /(?:\b\d+\.?\d*|\B\.\d+)(?:[eE][+-]?\d+)?(?:[ij])?|\b[ij]\b/,
	'keyword': /\b(?:break|case|catch|continue|else|elseif|end|for|function|if|inf|NaN|otherwise|parfor|pause|pi|return|switch|try|while)\b/,
	'function': /(?!\d)\w+(?=\s*\()/,
	'operator': /\.?[*^\/\\']|[+\-:@]|[<>=~]=?|&&?|\|\|?/,
	'punctuation': /\.{3}|[.,;\[\](){}!]/
};
Prism.languages.nasm = {
	'comment': /;.*$/m,
	'string': /(["'`])(?:\\.|(?!\1)[^\\\r\n])*\1/,
	'label': {
		pattern: /(^\s*)[A-Za-z._?$][\w.?$@~#]*:/m,
		lookbehind: true,
		alias: 'function'
	},
	'keyword': [
		/\[?BITS (?:16|32|64)\]?/,
		{
			pattern: /(^\s*)section\s*[a-zA-Z.]+:?/im,
			lookbehind: true
		},
		/(?:extern|global)[^;\r\n]*/i,
		/(?:CPU|FLOAT|DEFAULT).*$/m
	],
	'register': {
		pattern: /\b(?:st\d|[xyz]mm\d\d?|[cdt]r\d|r\d\d?[bwd]?|[er]?[abcd]x|[abcd][hl]|[er]?(?:bp|sp|si|di)|[cdefgs]s)\b/i,
		alias: 'variable'
	},
	'number': /(?:\b|(?=\$))(?:0[hx][\da-f]*\.?[\da-f]+(?:p[+-]?\d+)?|\d[\da-f]+[hx]|\$\d[\da-f]*|0[oq][0-7]+|[0-7]+[oq]|0[by][01]+|[01]+[by]|0[dt]\d+|\d*\.?\d+(?:\.?e[+-]?\d+)?[dt]?)\b/i,
	'operator': /[\[\]*+\-\/%<>=&|$!]/
};

Prism.languages.objectivec = Prism.languages.extend('c', {
	'keyword': /\b(?:asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|in|self|super)\b|(?:@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
	'string': /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|@"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
	'operator': /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/
});

delete Prism.languages.objectivec['class-name'];

Prism.languages.objc = Prism.languages.objectivec;
(function (Prism) {
	/* OpenCL kernel language */
	Prism.languages.opencl = Prism.languages.extend('c', {
		// Extracted from the official specs (2.0) and http://streamcomputing.eu/downloads/?opencl.lang (opencl-keywords, opencl-types) and http://sourceforge.net/tracker/?func=detail&aid=2957794&group_id=95717&atid=612384 (Words2, partly Words3)
		// https://www.khronos.org/registry/OpenCL/sdk/2.1/docs/man/xhtml/scalarDataTypes.html
		// https://www.khronos.org/registry/OpenCL/sdk/2.1/docs/man/xhtml/otherDataTypes.html
		'keyword': /\b(?:__attribute__|(?:__)?(?:constant|global|kernel|local|private|read_only|read_write|write_only)|_cl_(?:command_queue|context|device_id|event|kernel|mem|platform_id|program|sampler)|auto|break|case|cl_(?:image_format|mem_fence_flags)|clk_event_t|complex|const|continue|default|do|(?:float|double)(?:16(?:x(?:1|16|2|4|8))?|1x(?:1|16|2|4|8)|2(?:x(?:1|16|2|4|8))?|3|4(?:x(?:1|16|2|4|8))?|8(?:x(?:1|16|2|4|8))?)?|else|enum|event_t|extern|for|goto|(?:u?(?:char|short|int|long)|half|quad|bool)(?:2|3|4|8|16)?|if|image(?:1d_(?:array_|buffer_)?t|2d_(?:array_(?:depth_|msaa_depth_|msaa_)?|depth_|msaa_depth_|msaa_)?t|3d_t)|imaginary|inline|intptr_t|ndrange_t|packed|pipe|ptrdiff_t|queue_t|register|reserve_id_t|restrict|return|sampler_t|signed|size_t|sizeof|static|struct|switch|typedef|uintptr_t|uniform|union|unsigned|void|volatile|while)\b/,
		// Extracted from http://streamcomputing.eu/downloads/?opencl.lang (opencl-const)
		// Math Constants: https://www.khronos.org/registry/OpenCL/sdk/2.1/docs/man/xhtml/mathConstants.html
		// Macros and Limits: https://www.khronos.org/registry/OpenCL/sdk/2.1/docs/man/xhtml/macroLimits.html
		'constant-opencl-kernel': {
			pattern: /\b(?:CHAR_(?:BIT|MAX|MIN)|CLK_(?:ADDRESS_(?:CLAMP(?:_TO_EDGE)?|NONE|REPEAT)|FILTER_(?:LINEAR|NEAREST)|(?:LOCAL|GLOBAL)_MEM_FENCE|NORMALIZED_COORDS_(?:FALSE|TRUE))|CL_(?:BGRA|(?:HALF_)?FLOAT|INTENSITY|LUMINANCE|A?R?G?B?[Ax]?|(?:(?:UN)?SIGNED|[US]NORM)_(?:INT(?:8|16|32))|UNORM_(?:INT_101010|SHORT_(?:555|565)))|(?:DBL|FLT|HALF)_(?:DIG|EPSILON|MANT_DIG|(?:MIN|MAX)(?:(?:_10)?_EXP)?)|FLT_RADIX|HUGE_VALF?|INFINITY|(?:INT|LONG|SCHAR|SHRT)_(?:MAX|MIN)|(?:UCHAR|USHRT|UINT|ULONG)_MAX|MAXFLOAT|M_(?:[12]_PI|2_SQRTPI|E|LN(?:2|10)|LOG(?:10|2)E?|PI(?:_[24])?|SQRT(?:1_2|2))(?:_F|_H)?|NAN)\b/,
			alias: 'constant'
		},
		'boolean': /\b(?:false|true)\b/,
		'number': /(?:\b0x(?:[\da-f]+\.?[\da-f]*|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?)[fuhl]*/i
	});

	var attributes = {
		// Extracted from http://streamcomputing.eu/downloads/?opencl_host.lang (opencl-types and opencl-host)
		'type-opencl-host': {
			pattern: /\b(?:cl_(?:GLenum|GLint|GLuin|addressing_mode|bitfield|bool|buffer_create_type|build_status|channel_(?:order|type)|(?:u?(?:char|short|int|long)|float|double)(?:2|3|4|8|16)?|command_(?:queue(?:_info|_properties)?|type)|context(?:_info|_properties)?|device_(?:exec_capabilities|fp_config|id|info|local_mem_type|mem_cache_type|type)|(?:event|sampler)(?:_info)?|filter_mode|half|image_info|kernel(?:_info|_work_group_info)?|map_flags|mem(?:_flags|_info|_object_type)?|platform_(?:id|info)|profiling_info|program(?:_build_info|_info)?))\b/,
			alias: 'keyword'
		},
		'boolean-opencl-host': {
			pattern: /\bCL_(?:TRUE|FALSE)\b/,
			alias: 'boolean'
		},
		// Extracted from cl.h (2.0) and http://streamcomputing.eu/downloads/?opencl_host.lang (opencl-const)
		'constant-opencl-host': {
			pattern: /\bCL_(?:A|ABGR|ADDRESS_(?:CLAMP(?:_TO_EDGE)?|MIRRORED_REPEAT|NONE|REPEAT)|ARGB|BGRA|BLOCKING|BUFFER_CREATE_TYPE_REGION|BUILD_(?:ERROR|IN_PROGRESS|NONE|PROGRAM_FAILURE|SUCCESS)|COMMAND_(?:ACQUIRE_GL_OBJECTS|BARRIER|COPY_(?:BUFFER(?:_RECT|_TO_IMAGE)?|IMAGE(?:_TO_BUFFER)?)|FILL_(?:BUFFER|IMAGE)|MAP(?:_BUFFER|_IMAGE)|MARKER|MIGRATE(?:_SVM)?_MEM_OBJECTS|NATIVE_KERNEL|NDRANGE_KERNEL|READ_(?:BUFFER(?:_RECT)?|IMAGE)|RELEASE_GL_OBJECTS|SVM_(?:FREE|MAP|MEMCPY|MEMFILL|UNMAP)|TASK|UNMAP_MEM_OBJECT|USER|WRITE_(?:BUFFER(?:_RECT)?|IMAGE))|COMPILER_NOT_AVAILABLE|COMPILE_PROGRAM_FAILURE|COMPLETE|CONTEXT_(?:DEVICES|INTEROP_USER_SYNC|NUM_DEVICES|PLATFORM|PROPERTIES|REFERENCE_COUNT)|DEPTH(?:_STENCIL)?|DEVICE_(?:ADDRESS_BITS|AFFINITY_DOMAIN_(?:L[1-4]_CACHE|NEXT_PARTITIONABLE|NUMA)|AVAILABLE|BUILT_IN_KERNELS|COMPILER_AVAILABLE|DOUBLE_FP_CONFIG|ENDIAN_LITTLE|ERROR_CORRECTION_SUPPORT|EXECUTION_CAPABILITIES|EXTENSIONS|GLOBAL_(?:MEM_(?:CACHELINE_SIZE|CACHE_SIZE|CACHE_TYPE|SIZE)|VARIABLE_PREFERRED_TOTAL_SIZE)|HOST_UNIFIED_MEMORY|IL_VERSION|IMAGE(?:2D_MAX_(?:HEIGHT|WIDTH)|3D_MAX_(?:DEPTH|HEIGHT|WIDTH)|_BASE_ADDRESS_ALIGNMENT|_MAX_ARRAY_SIZE|_MAX_BUFFER_SIZE|_PITCH_ALIGNMENT|_SUPPORT)|LINKER_AVAILABLE|LOCAL_MEM_SIZE|LOCAL_MEM_TYPE|MAX_(?:CLOCK_FREQUENCY|COMPUTE_UNITS|CONSTANT_ARGS|CONSTANT_BUFFER_SIZE|GLOBAL_VARIABLE_SIZE|MEM_ALLOC_SIZE|NUM_SUB_GROUPS|ON_DEVICE_(?:EVENTS|QUEUES)|PARAMETER_SIZE|PIPE_ARGS|READ_IMAGE_ARGS|READ_WRITE_IMAGE_ARGS|SAMPLERS|WORK_GROUP_SIZE|WORK_ITEM_DIMENSIONS|WORK_ITEM_SIZES|WRITE_IMAGE_ARGS)|MEM_BASE_ADDR_ALIGN|MIN_DATA_TYPE_ALIGN_SIZE|NAME|NATIVE_VECTOR_WIDTH_(?:CHAR|DOUBLE|FLOAT|HALF|INT|LONG|SHORT)|NOT_(?:AVAILABLE|FOUND)|OPENCL_C_VERSION|PARENT_DEVICE|PARTITION_(?:AFFINITY_DOMAIN|BY_AFFINITY_DOMAIN|BY_COUNTS|BY_COUNTS_LIST_END|EQUALLY|FAILED|MAX_SUB_DEVICES|PROPERTIES|TYPE)|PIPE_MAX_(?:ACTIVE_RESERVATIONS|PACKET_SIZE)|PLATFORM|PREFERRED_(?:GLOBAL_ATOMIC_ALIGNMENT|INTEROP_USER_SYNC|LOCAL_ATOMIC_ALIGNMENT|PLATFORM_ATOMIC_ALIGNMENT|VECTOR_WIDTH_(?:CHAR|DOUBLE|FLOAT|HALF|INT|LONG|SHORT))|PRINTF_BUFFER_SIZE|PROFILE|PROFILING_TIMER_RESOLUTION|QUEUE_(?:ON_(?:DEVICE_(?:MAX_SIZE|PREFERRED_SIZE|PROPERTIES)|HOST_PROPERTIES)|PROPERTIES)|REFERENCE_COUNT|SINGLE_FP_CONFIG|SUB_GROUP_INDEPENDENT_FORWARD_PROGRESS|SVM_(?:ATOMICS|CAPABILITIES|COARSE_GRAIN_BUFFER|FINE_GRAIN_BUFFER|FINE_GRAIN_SYSTEM)|TYPE(?:_ACCELERATOR|_ALL|_CPU|_CUSTOM|_DEFAULT|_GPU)?|VENDOR(?:_ID)?|VERSION)|DRIVER_VERSION|EVENT_(?:COMMAND_(?:EXECUTION_STATUS|QUEUE|TYPE)|CONTEXT|REFERENCE_COUNT)|EXEC_(?:KERNEL|NATIVE_KERNEL|STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST)|FILTER_(?:LINEAR|NEAREST)|FLOAT|FP_(?:CORRECTLY_ROUNDED_DIVIDE_SQRT|DENORM|FMA|INF_NAN|ROUND_TO_INF|ROUND_TO_NEAREST|ROUND_TO_ZERO|SOFT_FLOAT)|GLOBAL|HALF_FLOAT|IMAGE_(?:ARRAY_SIZE|BUFFER|DEPTH|ELEMENT_SIZE|FORMAT|FORMAT_MISMATCH|FORMAT_NOT_SUPPORTED|HEIGHT|NUM_MIP_LEVELS|NUM_SAMPLES|ROW_PITCH|SLICE_PITCH|WIDTH)|INTENSITY|INVALID_(?:ARG_INDEX|ARG_SIZE|ARG_VALUE|BINARY|BUFFER_SIZE|BUILD_OPTIONS|COMMAND_QUEUE|COMPILER_OPTIONS|CONTEXT|DEVICE|DEVICE_PARTITION_COUNT|DEVICE_QUEUE|DEVICE_TYPE|EVENT|EVENT_WAIT_LIST|GLOBAL_OFFSET|GLOBAL_WORK_SIZE|GL_OBJECT|HOST_PTR|IMAGE_DESCRIPTOR|IMAGE_FORMAT_DESCRIPTOR|IMAGE_SIZE|KERNEL|KERNEL_ARGS|KERNEL_DEFINITION|KERNEL_NAME|LINKER_OPTIONS|MEM_OBJECT|MIP_LEVEL|OPERATION|PIPE_SIZE|PLATFORM|PROGRAM|PROGRAM_EXECUTABLE|PROPERTY|QUEUE_PROPERTIES|SAMPLER|VALUE|WORK_DIMENSION|WORK_GROUP_SIZE|WORK_ITEM_SIZE)|KERNEL_(?:ARG_(?:ACCESS_(?:NONE|QUALIFIER|READ_ONLY|READ_WRITE|WRITE_ONLY)|ADDRESS_(?:CONSTANT|GLOBAL|LOCAL|PRIVATE|QUALIFIER)|INFO_NOT_AVAILABLE|NAME|TYPE_(?:CONST|NAME|NONE|PIPE|QUALIFIER|RESTRICT|VOLATILE))|ATTRIBUTES|COMPILE_NUM_SUB_GROUPS|COMPILE_WORK_GROUP_SIZE|CONTEXT|EXEC_INFO_SVM_FINE_GRAIN_SYSTEM|EXEC_INFO_SVM_PTRS|FUNCTION_NAME|GLOBAL_WORK_SIZE|LOCAL_MEM_SIZE|LOCAL_SIZE_FOR_SUB_GROUP_COUNT|MAX_NUM_SUB_GROUPS|MAX_SUB_GROUP_SIZE_FOR_NDRANGE|NUM_ARGS|PREFERRED_WORK_GROUP_SIZE_MULTIPLE|PRIVATE_MEM_SIZE|PROGRAM|REFERENCE_COUNT|SUB_GROUP_COUNT_FOR_NDRANGE|WORK_GROUP_SIZE)|LINKER_NOT_AVAILABLE|LINK_PROGRAM_FAILURE|LOCAL|LUMINANCE|MAP_(?:FAILURE|READ|WRITE|WRITE_INVALIDATE_REGION)|MEM_(?:ALLOC_HOST_PTR|ASSOCIATED_MEMOBJECT|CONTEXT|COPY_HOST_PTR|COPY_OVERLAP|FLAGS|HOST_NO_ACCESS|HOST_PTR|HOST_READ_ONLY|HOST_WRITE_ONLY|KERNEL_READ_AND_WRITE|MAP_COUNT|OBJECT_(?:ALLOCATION_FAILURE|BUFFER|IMAGE1D|IMAGE1D_ARRAY|IMAGE1D_BUFFER|IMAGE2D|IMAGE2D_ARRAY|IMAGE3D|PIPE)|OFFSET|READ_ONLY|READ_WRITE|REFERENCE_COUNT|SIZE|SVM_ATOMICS|SVM_FINE_GRAIN_BUFFER|TYPE|USES_SVM_POINTER|USE_HOST_PTR|WRITE_ONLY)|MIGRATE_MEM_OBJECT_(?:CONTENT_UNDEFINED|HOST)|MISALIGNED_SUB_BUFFER_OFFSET|NONE|NON_BLOCKING|OUT_OF_(?:HOST_MEMORY|RESOURCES)|PIPE_(?:MAX_PACKETS|PACKET_SIZE)|PLATFORM_(?:EXTENSIONS|HOST_TIMER_RESOLUTION|NAME|PROFILE|VENDOR|VERSION)|PROFILING_(?:COMMAND_(?:COMPLETE|END|QUEUED|START|SUBMIT)|INFO_NOT_AVAILABLE)|PROGRAM_(?:BINARIES|BINARY_SIZES|BINARY_TYPE(?:_COMPILED_OBJECT|_EXECUTABLE|_LIBRARY|_NONE)?|BUILD_(?:GLOBAL_VARIABLE_TOTAL_SIZE|LOG|OPTIONS|STATUS)|CONTEXT|DEVICES|IL|KERNEL_NAMES|NUM_DEVICES|NUM_KERNELS|REFERENCE_COUNT|SOURCE)|QUEUED|QUEUE_(?:CONTEXT|DEVICE|DEVICE_DEFAULT|ON_DEVICE|ON_DEVICE_DEFAULT|OUT_OF_ORDER_EXEC_MODE_ENABLE|PROFILING_ENABLE|PROPERTIES|REFERENCE_COUNT|SIZE)|R|RA|READ_(?:ONLY|WRITE)_CACHE|RG|RGB|RGBA|RGBx|RGx|RUNNING|Rx|SAMPLER_(?:ADDRESSING_MODE|CONTEXT|FILTER_MODE|LOD_MAX|LOD_MIN|MIP_FILTER_MODE|NORMALIZED_COORDS|REFERENCE_COUNT)|(?:UN)?SIGNED_INT(?:8|16|32)|SNORM_INT(?:8|16)|SUBMITTED|SUCCESS|UNORM_INT(?:16|24|8|_101010|_101010_2)|UNORM_SHORT_(?:555|565)|VERSION_(?:1_0|1_1|1_2|2_0|2_1)|sBGRA|sRGB|sRGBA|sRGBx)\b/,
			alias: 'constant'
		},
		// Extracted from cl.h (2.0) and http://streamcomputing.eu/downloads/?opencl_host.lang (opencl-host)
		'function-opencl-host': {
			pattern: /\bcl(?:BuildProgram|CloneKernel|CompileProgram|Create(?:Buffer|CommandQueue(?:WithProperties)?|Context|ContextFromType|Image|Image2D|Image3D|Kernel|KernelsInProgram|Pipe|ProgramWith(?:Binary|BuiltInKernels|IL|Source)|Sampler|SamplerWithProperties|SubBuffer|SubDevices|UserEvent)|Enqueue(?:(?:Barrier|Marker)(?:WithWaitList)?|Copy(?:Buffer(?:Rect|ToImage)?|Image(?:ToBuffer)?)|(?:Fill|Map)(?:Buffer|Image)|MigrateMemObjects|NDRangeKernel|NativeKernel|(?:Read|Write)(?:Buffer(?:Rect)?|Image)|SVM(?:Free|Map|MemFill|Memcpy|MigrateMem|Unmap)|Task|UnmapMemObject|WaitForEvents)|Finish|Flush|Get(?:CommandQueueInfo|ContextInfo|Device(?:AndHostTimer|IDs|Info)|Event(?:Profiling)?Info|ExtensionFunctionAddress(?:ForPlatform)?|HostTimer|ImageInfo|Kernel(?:ArgInfo|Info|SubGroupInfo|WorkGroupInfo)|MemObjectInfo|PipeInfo|Platform(?:IDs|Info)|Program(?:Build)?Info|SamplerInfo|SupportedImageFormats)|LinkProgram|(?:Release|Retain)(?:CommandQueue|Context|Device|Event|Kernel|MemObject|Program|Sampler)|SVM(?:Alloc|Free)|Set(?:CommandQueueProperty|DefaultDeviceCommandQueue|EventCallback|Kernel(?:Arg(?:SVMPointer)?|ExecInfo)|Kernel|MemObjectDestructorCallback|UserEventStatus)|Unload(?:Platform)?Compiler|WaitForEvents)\b/,
			alias: 'function'
		}
	};

	/* OpenCL host API */
	Prism.languages.insertBefore('c', 'keyword', attributes);

	// C++ includes everything from the OpenCL C host API plus the classes defined in cl2.h
	if (Prism.languages.cpp) {
		// Extracted from doxygen class list http://github.khronos.org/OpenCL-CLHPP/annotated.html
		attributes['type-opencl-host-cpp'] = {
			pattern: /\b(?:Buffer|BufferGL|BufferRenderGL|CommandQueue|Context|Device|DeviceCommandQueue|EnqueueArgs|Event|Image|Image1D|Image1DArray|Image1DBuffer|Image2D|Image2DArray|Image2DGL|Image3D|Image3DGL|ImageFormat|ImageGL|Kernel|KernelFunctor|LocalSpaceArg|Memory|NDRange|Pipe|Platform|Program|Sampler|SVMAllocator|SVMTraitAtomic|SVMTraitCoarse|SVMTraitFine|SVMTraitReadOnly|SVMTraitReadWrite|SVMTraitWriteOnly|UserEvent)\b/,
			alias: 'keyword'
		};

		Prism.languages.insertBefore('cpp', 'keyword', attributes);
	}
}(Prism));

(function (Prism) {

	var powershell = Prism.languages.powershell = {
		'comment': [
			{
				pattern: /(^|[^`])<#[\s\S]*?#>/,
				lookbehind: true
			},
			{
				pattern: /(^|[^`])#.*/,
				lookbehind: true
			}
		],
		'string': [
			{
				pattern: /"(?:`[\s\S]|[^`"])*"/,
				greedy: true,
				inside: {
					'function': {
						// Allow for one level of nesting
						pattern: /(^|[^`])\$\((?:\$\([^\r\n()]*\)|(?!\$\()[^\r\n)])*\)/,
						lookbehind: true,
						// Populated at end of file
						inside: {}
					}
				}
			},
			{
				pattern: /'(?:[^']|'')*'/,
				greedy: true
			}
		],
		// Matches name spaces as well as casts, attribute decorators. Force starting with letter to avoid matching array indices
		// Supports two levels of nested brackets (e.g. `[OutputType([System.Collections.Generic.List[int]])]`)
		'namespace': /\[[a-z](?:\[(?:\[[^\]]*]|[^\[\]])*]|[^\[\]])*]/i,
		'boolean': /\$(?:true|false)\b/i,
		'variable': /\$\w+\b/i,
		// Cmdlets and aliases. Aliases should come last, otherwise "write" gets preferred over "write-host" for example
		// Get-Command | ?{ $_.ModuleName -match "Microsoft.PowerShell.(Util|Core|Management)" }
		// Get-Alias | ?{ $_.ReferencedCommand.Module.Name -match "Microsoft.PowerShell.(Util|Core|Management)" }
		'function': [
			/\b(?:Add-(?:Computer|Content|History|Member|PSSnapin|Type)|Checkpoint-Computer|Clear-(?:Content|EventLog|History|Item|ItemProperty|Variable)|Compare-Object|Complete-Transaction|Connect-PSSession|ConvertFrom-(?:Csv|Json|StringData)|Convert-Path|ConvertTo-(?:Csv|Html|Json|Xml)|Copy-(?:Item|ItemProperty)|Debug-Process|Disable-(?:ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Disconnect-PSSession|Enable-(?:ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Enter-PSSession|Exit-PSSession|Export-(?:Alias|Clixml|Console|Csv|FormatData|ModuleMember|PSSession)|ForEach-Object|Format-(?:Custom|List|Table|Wide)|Get-(?:Alias|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Culture|Date|Event|EventLog|EventSubscriber|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job|Location|Member|Module|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|WmiObject)|Group-Object|Import-(?:Alias|Clixml|Csv|LocalizedData|Module|PSSession)|Invoke-(?:Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)|Join-Path|Limit-EventLog|Measure-(?:Command|Object)|Move-(?:Item|ItemProperty)|New-(?:Alias|Event|EventLog|Item|ItemProperty|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy)|Out-(?:Default|File|GridView|Host|Null|Printer|String)|Pop-Location|Push-Location|Read-Host|Receive-(?:Job|PSSession)|Register-(?:EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)|Remove-(?:Computer|Event|EventLog|Item|ItemProperty|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)|Rename-(?:Computer|Item|ItemProperty)|Reset-ComputerMachinePassword|Resolve-Path|Restart-(?:Computer|Service)|Restore-Computer|Resume-(?:Job|Service)|Save-Help|Select-(?:Object|String|Xml)|Send-MailMessage|Set-(?:Alias|Content|Date|Item|ItemProperty|Location|PSBreakpoint|PSDebug|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)|Show-(?:Command|ControlPanelItem|EventLog)|Sort-Object|Split-Path|Start-(?:Job|Process|Service|Sleep|Transaction)|Stop-(?:Computer|Job|Process|Service)|Suspend-(?:Job|Service)|Tee-Object|Test-(?:ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)|Trace-Command|Unblock-File|Undo-Transaction|Unregister-(?:Event|PSSessionConfiguration)|Update-(?:FormatData|Help|List|TypeData)|Use-Transaction|Wait-(?:Event|Job|Process)|Where-Object|Write-(?:Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning))\b/i,
			/\b(?:ac|cat|chdir|clc|cli|clp|clv|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|ebp|echo|epal|epcsv|epsn|erase|fc|fl|ft|fw|gal|gbp|gc|gci|gcs|gdr|gi|gl|gm|gp|gps|group|gsv|gu|gv|gwmi|iex|ii|ipal|ipcsv|ipsn|irm|iwmi|iwr|kill|lp|ls|measure|mi|mount|move|mp|mv|nal|ndr|ni|nv|ogv|popd|ps|pushd|pwd|rbp|rd|rdr|ren|ri|rm|rmdir|rni|rnp|rp|rv|rvpa|rwmi|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls|sort|sp|spps|spsv|start|sv|swmi|tee|trcm|type|write)\b/i
		],
		// per http://technet.microsoft.com/en-us/library/hh847744.aspx
		'keyword': /\b(?:Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
		'operator': {
			pattern: /(\W?)(?:!|-(?:eq|ne|gt|ge|lt|le|sh[lr]|not|b?(?:and|x?or)|(?:Not)?(?:Like|Match|Contains|In)|Replace|Join|is(?:Not)?|as)\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
			lookbehind: true
		},
		'punctuation': /[|{}[\];(),.]/
	};

	// Variable interpolation inside strings, and nested expressions
	var stringInside = powershell.string[0].inside;
	stringInside.boolean = powershell.boolean;
	stringInside.variable = powershell.variable;
	stringInside.function.inside = powershell;

}(Prism));

(function(Prism) {
	// TODO:
	// - Add CSS highlighting inside <style> tags
	// - Add support for multi-line code blocks
	// - Add support for interpolation #{} and !{}
	// - Add support for tag interpolation #[]
	// - Add explicit support for plain text using |
	// - Add support for markup embedded in plain text

	Prism.languages.pug = {

		// Multiline stuff should appear before the rest

		// This handles both single-line and multi-line comments
		'comment': {
			pattern: /(^([\t ]*))\/\/.*(?:(?:\r?\n|\r)\2[\t ]+.+)*/m,
			lookbehind: true
		},

		// All the tag-related part is in lookbehind
		// so that it can be highlighted by the "tag" pattern
		'multiline-script': {
			pattern: /(^([\t ]*)script\b.*\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
			lookbehind: true,
			inside: Prism.languages.javascript
		},

		// See at the end of the file for known filters
		'filter': {
			pattern: /(^([\t ]*)):.+(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
			lookbehind: true,
			inside: {
				'filter-name': {
					pattern: /^:[\w-]+/,
					alias: 'variable'
				}
			}
		},

		'multiline-plain-text': {
			pattern: /(^([\t ]*)[\w\-#.]+\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
			lookbehind: true
		},
		'markup': {
			pattern: /(^[\t ]*)<.+/m,
			lookbehind: true,
			inside: Prism.languages.markup
		},
		'doctype': {
			pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
			lookbehind: true
		},

		// This handle all conditional and loop keywords
		'flow-control': {
			pattern: /(^[\t ]*)(?:if|unless|else|case|when|default|each|while)\b(?: .+)?/m,
			lookbehind: true,
			inside: {
				'each': {
					pattern: /^each .+? in\b/,
					inside: {
						'keyword': /\b(?:each|in)\b/,
						'punctuation': /,/
					}
				},
				'branch': {
					pattern: /^(?:if|unless|else|case|when|default|while)\b/,
					alias: 'keyword'
				},
				rest: Prism.languages.javascript
			}
		},
		'keyword': {
			pattern: /(^[\t ]*)(?:block|extends|include|append|prepend)\b.+/m,
			lookbehind: true
		},
		'mixin': [
			// Declaration
			{
				pattern: /(^[\t ]*)mixin .+/m,
				lookbehind: true,
				inside: {
					'keyword': /^mixin/,
					'function': /\w+(?=\s*\(|\s*$)/,
					'punctuation': /[(),.]/
				}
			},
			// Usage
			{
				pattern: /(^[\t ]*)\+.+/m,
				lookbehind: true,
				inside: {
					'name': {
						pattern: /^\+\w+/,
						alias: 'function'
					},
					rest: Prism.languages.javascript
				}
			}
		],
		'script': {
			pattern: /(^[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*[\t ]+).+/m,
			lookbehind: true,
			inside: Prism.languages.javascript
		},

		'plain-text': {
			pattern: /(^[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/m,
			lookbehind: true
		},
		'tag': {
			pattern: /(^[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/m,
			lookbehind: true,
			inside: {
				'attributes': [
					{
						pattern: /&[^(]+\([^)]+\)/,
						inside: Prism.languages.javascript
					},
					{
						pattern: /\([^)]+\)/,
						inside: {
							'attr-value': {
								pattern: /(=\s*)(?:\{[^}]*\}|[^,)\r\n]+)/,
								lookbehind: true,
								inside: Prism.languages.javascript
							},
							'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
							'punctuation': /[!=(),]+/
						}
					}
				],
				'punctuation': /:/
			}
		},
		'code': [
			{
				pattern: /(^[\t ]*(?:-|!?=)).+/m,
				lookbehind: true,
				inside: Prism.languages.javascript
			}
		],
		'punctuation': /[.\-!=|]+/
	};

	var filter_pattern = /(^([\t ]*)):{{filter_name}}(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/.source;

	// Non exhaustive list of available filters and associated languages
	var filters = [
		{filter:'atpl',language:'twig'},
		{filter:'coffee',language:'coffeescript'},
		'ejs',
		'handlebars',
		'less',
		'livescript',
		'markdown',
		{filter:'sass',language:'scss'},
		'stylus'
	];
	var all_filters = {};
	for (var i = 0, l = filters.length; i < l; i++) {
		var filter = filters[i];
		filter = typeof filter === 'string' ? {filter: filter, language: filter} : filter;
		if (Prism.languages[filter.language]) {
			all_filters['filter-' + filter.filter] = {
				pattern: RegExp(filter_pattern.replace('{{filter_name}}', function () { return filter.filter; }), 'm'),
				lookbehind: true,
				inside: {
					'filter-name': {
						pattern: /^:[\w-]+/,
						alias: 'variable'
					},
					rest: Prism.languages[filter.language]
				}
			}
		}
	}

	Prism.languages.insertBefore('pug', 'filter', all_filters);

}(Prism));

Prism.languages.python = {
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	'string-interpolation': {
		pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]+?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,
		greedy: true,
		inside: {
			'interpolation': {
				// "{" <expression> <optional "!s", "!r", or "!a"> <optional ":" format specifier> "}"
				pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,
				lookbehind: true,
				inside: {
					'format-spec': {
						pattern: /(:)[^:(){}]+(?=}$)/,
						lookbehind: true
					},
					'conversion-option': {
						pattern: /![sra](?=[:}]$)/,
						alias: 'punctuation'
					},
					rest: null
				}
			},
			'string': /[\s\S]+/
		}
	},
	'triple-quoted-string': {
		pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]+?\1/i,
		greedy: true,
		alias: 'string'
	},
	'string': {
		pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
		greedy: true
	},
	'function': {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
		lookbehind: true
	},
	'class-name': {
		pattern: /(\bclass\s+)\w+/i,
		lookbehind: true
	},
	'decorator': {
		pattern: /(^\s*)@\w+(?:\.\w+)*/im,
		lookbehind: true,
		alias: ['annotation', 'punctuation'],
		inside: {
			'punctuation': /\./
		}
	},
	'keyword': /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
	'builtin': /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
	'boolean': /\b(?:True|False|None)\b/,
	'number': /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.python['string-interpolation'].inside['interpolation'].inside.rest = Prism.languages.python;

Prism.languages.py = Prism.languages.python;

(function (Prism) {

	Prism.languages.typescript = Prism.languages.extend('javascript', {
		'class-name': {
			pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
			lookbehind: true,
			greedy: true,
			inside: null // see below
		},
		// From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
		'keyword': /\b(?:abstract|as|asserts|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/,
		'builtin': /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/,
	});

	// doesn't work with TS because TS is too complex
	delete Prism.languages.typescript['parameter'];

	// a version of typescript specifically for highlighting types
	var typeInside = Prism.languages.extend('typescript', {});
	delete typeInside['class-name'];

	Prism.languages.typescript['class-name'].inside = typeInside;

	Prism.languages.insertBefore('typescript', 'function', {
		'generic-function': {
			// e.g. foo<T extends "bar" | "baz">( ...
			pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
			greedy: true,
			inside: {
				'function': /^#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*/,
				'generic': {
					pattern: /<[\s\S]+/, // everything after the first <
					alias: 'class-name',
					inside: typeInside
				}
			}
		}
	});

	Prism.languages.ts = Prism.languages.typescript;

}(Prism));

(function (Prism) {

	var specialEscape = {
		pattern: /\\[\\(){}[\]^$+*?|.]/,
		alias: 'escape'
	};
	var escape = /\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|u\{[\da-fA-F]+\}|c[a-zA-Z]|0[0-7]{0,2}|[123][0-7]{2}|.)/
	var charClass = /\\[wsd]|\.|\\p{[^{}]+}/i

	var rangeChar = '(?:[^\\\\-]|' + escape.source + ')';
	var range = RegExp(rangeChar + '-' + rangeChar);

	// the name of a capturing group
	var groupName = {
		pattern: /(<|')[^<>']+(?=[>']$)/,
		lookbehind: true,
		alias: 'variable'
	};

	var backreference = [
		/\\(?![123][0-7]{2})[1-9]/, // a backreference which is not an octal escape
		{
			pattern: /\\k<[^<>']+>/,
			inside: {
				'group-name': groupName
			}
		}
	];

	Prism.languages.regex = {
		'charset': {
			pattern: /((?:^|[^\\])(?:\\\\)*)\[(?:[^\\\]]|\\[\s\S])*\]/,
			lookbehind: true,
			inside: {
				'charset-negation': {
					pattern: /(^\[)\^/,
					lookbehind: true,
				},
				'charset-punctuation': /^\[|\]$/,
				'range': {
					pattern: range,
					inside: {
						'escape': escape,
						'range-punctuation': /-/
					}
				},
				'special-escape': specialEscape,
				'charclass': charClass,
				'backreference': backreference,
				'escape': escape
			}
		},
		'special-escape': specialEscape,
		'charclass': charClass,
		'backreference': backreference,
		'anchor': /[$^]|\\[ABbGZz]/,
		'escape': escape,
		'group': [
			{
				// https://docs.oracle.com/javase/10/docs/api/java/util/regex/Pattern.html
				// https://docs.microsoft.com/en-us/dotnet/standard/base-types/regular-expression-language-quick-reference?view=netframework-4.7.2#grouping-constructs

				// (), (?<name>), (?'name'), (?>), (?:), (?=), (?!), (?<=), (?<!), (?is-m), (?i-m:)
				pattern: /\((?:\?(?:<[^<>']+>|'[^<>']+'|[>:]|<?[=!]|[idmnsuxU]+(?:-[idmnsuxU]+)?:?))?/,
				inside: {
					'group-name': groupName
				}
			},
			/\)/
		],
		'quantifier': /[+*?]|\{(?:\d+,?\d*)\}/,
		'alternation': /\|/
	};


	[
		'actionscript',
		'coffescript',
		'flow',
		'javascript',
		'typescript',
		'vala'
	].forEach(function (lang) {
		var grammar = Prism.languages[lang];
		if (grammar) {
			grammar['regex'].inside = {
				'regex-flags': /[a-z]+$/,
				'regex-delimiter': /^\/|\/$/,
				'language-regex': {
					pattern: /[\s\S]+/,
					inside: Prism.languages.regex
				}
			};
		}
	});

}(Prism))
;
Prism.languages.rest = {
	'table': [
		{
			pattern: /(\s*)(?:\+[=-]+)+\+(?:\r?\n|\r)(?:\1(?:[+|].+)+[+|](?:\r?\n|\r))+\1(?:\+[=-]+)+\+/,
			lookbehind: true,
			inside: {
				'punctuation': /\||(?:\+[=-]+)+\+/
			}
		},
		{
			pattern: /(\s*)(?:=+ +)+=+(?:(?:\r?\n|\r)\1.+)+(?:\r?\n|\r)\1(?:=+ +)+=+(?=(?:\r?\n|\r){2}|\s*$)/,
			lookbehind: true,
			inside: {
				'punctuation': /[=-]+/
			}
		}
	],

	// Directive-like patterns

	'substitution-def': {
		pattern: /(^\s*\.\. )\|(?:[^|\s](?:[^|]*[^|\s])?)\| [^:]+::/m,
		lookbehind: true,
		inside: {
			'substitution': {
				pattern: /^\|(?:[^|\s]|[^|\s][^|]*[^|\s])\|/,
				alias: 'attr-value',
				inside: {
					'punctuation': /^\||\|$/
				}
			},
			'directive': {
				pattern: /( +)[^:]+::/,
				lookbehind: true,
				alias: 'function',
				inside: {
					'punctuation': /::$/
				}
			}
		}
	},
	'link-target': [
		{
			pattern: /(^\s*\.\. )\[[^\]]+\]/m,
			lookbehind: true,
			alias: 'string',
			inside: {
				'punctuation': /^\[|\]$/
			}
		},
		{
			pattern: /(^\s*\.\. )_(?:`[^`]+`|(?:[^:\\]|\\.)+):/m,
			lookbehind: true,
			alias: 'string',
			inside: {
				'punctuation': /^_|:$/
			}
		}
	],
	'directive': {
		pattern: /(^\s*\.\. )[^:]+::/m,
		lookbehind: true,
		alias: 'function',
		inside: {
			'punctuation': /::$/
		}
	},
	'comment': {
		// The two alternatives try to prevent highlighting of blank comments
		pattern: /(^\s*\.\.)(?:(?: .+)?(?:(?:\r?\n|\r).+)+| .+)(?=(?:\r?\n|\r){2}|$)/m,
		lookbehind: true
	},

	'title': [
		// Overlined and underlined
		{
			pattern: /^(([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+)(?:\r?\n|\r).+(?:\r?\n|\r)\1$/m,
			inside: {
				'punctuation': /^[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+|[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
				'important': /.+/
			}
		},

		// Underlined only
		{
			pattern: /(^|(?:\r?\n|\r){2}).+(?:\r?\n|\r)([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2+(?=\r?\n|\r|$)/,
			lookbehind: true,
			inside: {
				'punctuation': /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]+$/,
				'important': /.+/
			}
		}
	],
	'hr': {
		pattern: /((?:\r?\n|\r){2})([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\2{3,}(?=(?:\r?\n|\r){2})/,
		lookbehind: true,
		alias: 'punctuation'
	},
	'field': {
		pattern: /(^\s*):[^:\r\n]+:(?= )/m,
		lookbehind: true,
		alias: 'attr-name'
	},
	'command-line-option': {
		pattern: /(^\s*)(?:[+-][a-z\d]|(?:--|\/)[a-z\d-]+)(?:[ =](?:[a-z][\w-]*|<[^<>]+>))?(?:, (?:[+-][a-z\d]|(?:--|\/)[a-z\d-]+)(?:[ =](?:[a-z][\w-]*|<[^<>]+>))?)*(?=(?:\r?\n|\r)? {2,}\S)/im,
		lookbehind: true,
		alias: 'symbol'
	},
	'literal-block': {
		pattern: /::(?:\r?\n|\r){2}([ \t]+).+(?:(?:\r?\n|\r)\1.+)*/,
		inside: {
			'literal-block-punctuation': {
				pattern: /^::/,
				alias: 'punctuation'
			}
		}
	},
	'quoted-literal-block': {
		pattern: /::(?:\r?\n|\r){2}([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~]).*(?:(?:\r?\n|\r)\1.*)*/,
		inside: {
			'literal-block-punctuation': {
				pattern: /^(?:::|([!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~])\1*)/m,
				alias: 'punctuation'
			}
		}
	},
	'list-bullet': {
		pattern: /(^\s*)(?:[*+\-•‣⁃]|\(?(?:\d+|[a-z]|[ivxdclm]+)\)|(?:\d+|[a-z]|[ivxdclm]+)\.)(?= )/im,
		lookbehind: true,
		alias: 'punctuation'
	},
	'doctest-block': {
		pattern: /(^\s*)>>> .+(?:(?:\r?\n|\r).+)*/m,
		lookbehind: true,
		inside: {
			'punctuation': /^>>>/
		}
	},

	'inline': [
		{
			pattern: /(^|[\s\-:\/'"<(\[{])(?::[^:]+:`.*?`|`.*?`:[^:]+:|(\*\*?|``?|\|)(?!\s).*?[^\s]\2(?=[\s\-.,:;!?\\\/'")\]}]|$))/m,
			lookbehind: true,
			inside: {
				'bold': {
					pattern: /(^\*\*).+(?=\*\*$)/,
					lookbehind: true
				},
				'italic': {
					pattern: /(^\*).+(?=\*$)/,
					lookbehind: true
				},
				'inline-literal': {
					pattern: /(^``).+(?=``$)/,
					lookbehind: true,
					alias: 'symbol'
				},
				'role': {
					pattern: /^:[^:]+:|:[^:]+:$/,
					alias: 'function',
					inside: {
						'punctuation': /^:|:$/
					}
				},
				'interpreted-text': {
					pattern: /(^`).+(?=`$)/,
					lookbehind: true,
					alias: 'attr-value'
				},
				'substitution': {
					pattern: /(^\|).+(?=\|$)/,
					lookbehind: true,
					alias: 'attr-value'
				},
				'punctuation': /\*\*?|``?|\|/
			}
		}
	],

	'link': [
		{
			pattern: /\[[^\]]+\]_(?=[\s\-.,:;!?\\\/'")\]}]|$)/,
			alias: 'string',
			inside: {
				'punctuation': /^\[|\]_$/
			}
		},
		{
			pattern: /(?:\b[a-z\d]+(?:[_.:+][a-z\d]+)*_?_|`[^`]+`_?_|_`[^`]+`)(?=[\s\-.,:;!?\\\/'")\]}]|$)/i,
			alias: 'string',
			inside: {
				'punctuation': /^_?`|`$|`?_?_$/
			}
		}
	],

	// Line block start,
	// quote attribution,
	// explicit markup start,
	// and anonymous hyperlink target shortcut (__)
	'punctuation': {
		pattern: /(^\s*)(?:\|(?= |$)|(?:---?|—|\.\.|__)(?= )|\.\.$)/m,
		lookbehind: true
	}
};

/* TODO
	Add support for Markdown notation inside doc comments
	Add support for nested block comments...
	Match closure params even when not followed by dash or brace
	Add better support for macro definition
*/

Prism.languages.rust = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': [
		{
			pattern: /b?r(#*)"(?:\\.|(?!"\1)[^\\\r\n])*"\1/,
			greedy: true
		},
		{
			pattern: /b?"(?:\\.|[^\\\r\n"])*"/,
			greedy: true
		}
	],
	'char': {
		pattern: /b?'(?:\\(?:x[0-7][\da-fA-F]|u{(?:[\da-fA-F]_*){1,6}|.)|[^\\\r\n\t'])'/,
		alias: 'string'
	},
	'lifetime-annotation': {
		pattern: /'[^\s>']+/,
		alias: 'symbol'
	},
	'keyword': /\b(?:abstract|alignof|as|async|await|be|box|break|const|continue|crate|do|dyn|else|enum|extern|false|final|fn|for|if|impl|in|let|loop|match|mod|move|mut|offsetof|once|override|priv|pub|pure|ref|return|sizeof|static|self|Self|struct|super|true|trait|type|typeof|union|unsafe|unsized|use|virtual|where|while|yield)\b/,

	'attribute': {
		pattern: /#!?\[.+?\]/,
		greedy: true,
		alias: 'attr-name'
	},

	'function': [
		/\w+(?=\s*\()/,
		// Macros can use parens or brackets
		/\w+!(?=\s*\(|\[)/
	],
	'macro-rules': {
		pattern: /\w+!/,
		alias: 'function'
	},

	// Hex, oct, bin, dec numbers with visual separators and type suffix
	'number': /\b(?:0x[\dA-Fa-f](?:_?[\dA-Fa-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|(?:\d(?:_?\d)*)?\.?\d(?:_?\d)*(?:[Ee][+-]?\d+)?)(?:_?(?:[iu](?:8|16|32|64)?|f32|f64))?\b/,

	// Closure params should not be confused with bitwise OR |
	'closure-params': {
		pattern: /\|[^|]*\|(?=\s*[{-])/,
		inside: {
			'punctuation': /[|:,]/,
			'operator': /[&*]/
		}
	},
	'punctuation': /->|\.\.=|\.{1,3}|::|[{}[\];(),:]/,
	'operator': /[-+*\/%!^]=?|=[=>]?|&[&=]?|\|[|=]?|<<?=?|>>?=?|[@?]/
};

Prism.languages.scala = Prism.languages.extend('java', {
	'keyword': /<-|=>|\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
	'triple-quoted-string': {
		pattern: /"""[\s\S]*?"""/,
		greedy: true,
		alias: 'string'
	},
	'string': {
		pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
		greedy: true
	},
	'builtin': /\b(?:String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\b/,
	'number': /\b0x[\da-f]*\.?[\da-f]+|(?:\b\d+\.?\d*|\B\.\d+)(?:e\d+)?[dfl]?/i,
	'symbol': /'[^\d\s\\]\w*/
});
delete Prism.languages.scala['class-name'];
delete Prism.languages.scala['function'];

Prism.languages.sql = {
	'comment': {
		pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
		lookbehind: true
	},
	'variable': [
		{
			pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
			greedy: true
		},
		/@[\w.$]+/
	],
	'string': {
		pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
		greedy: true,
		lookbehind: true
	},
	'function': /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
	'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
	'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
	'number': /\b0x[\da-f]+\b|\b\d+\.?\d*|\B\.\d+\b/i,
	'operator': /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
	'punctuation': /[;[\]()`,.]/
};

// issues: nested multiline comments
Prism.languages.swift = Prism.languages.extend('clike', {
	'string': {
		pattern: /("|')(?:\\(?:\((?:[^()]|\([^)]+\))+\)|\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
		greedy: true,
		inside: {
			'interpolation': {
				pattern: /\\\((?:[^()]|\([^)]+\))+\)/,
				inside: {
					delimiter: {
						pattern: /^\\\(|\)$/,
						alias: 'variable'
					}
					// See rest below
				}
			}
		}
	},
	'keyword': /\b(?:as|associativity|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic(?:Type)?|else|enum|extension|fallthrough|final|for|func|get|guard|if|import|in|infix|init|inout|internal|is|lazy|left|let|mutating|new|none|nonmutating|operator|optional|override|postfix|precedence|prefix|private|protocol|public|repeat|required|rethrows|return|right|safe|self|Self|set|static|struct|subscript|super|switch|throws?|try|Type|typealias|unowned|unsafe|var|weak|where|while|willSet|__(?:COLUMN__|FILE__|FUNCTION__|LINE__))\b/,
	'number': /\b(?:[\d_]+(?:\.[\de_]+)?|0x[a-f0-9_]+(?:\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,
	'constant': /\b(?:nil|[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,
	'atrule': /@\b(?:IB(?:Outlet|Designable|Action|Inspectable)|class_protocol|exported|noreturn|NS(?:Copying|Managed)|objc|UIApplicationMain|auto_closure)\b/,
	'builtin': /\b(?:[A-Z]\S+|abs|advance|alignof(?:Value)?|assert|contains|count(?:Elements)?|debugPrint(?:ln)?|distance|drop(?:First|Last)|dump|enumerate|equal|filter|find|first|getVaList|indices|isEmpty|join|last|lexicographicalCompare|map|max(?:Element)?|min(?:Element)?|numericCast|overlaps|partition|print(?:ln)?|reduce|reflect|reverse|sizeof(?:Value)?|sort(?:ed)?|split|startsWith|stride(?:of(?:Value)?)?|suffix|swap|toDebugString|toString|transcode|underestimateCount|unsafeBitCast|with(?:ExtendedLifetime|Unsafe(?:MutablePointers?|Pointers?)|VaList))\b/
});
Prism.languages.swift['string'].inside['interpolation'].inside.rest = Prism.languages.swift;

(function (Prism) {

	var key = /(?:[\w-]+|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*")/.source;

	/**
	 * @param {string} pattern
	 */
	function insertKey(pattern) {
		return pattern.replace(/__/g, function () { return key; });
	}

	Prism.languages.toml = {
		'comment': {
			pattern: /#.*/,
			greedy: true
		},
		'table': {
			pattern: RegExp(insertKey(/(^\s*\[\s*(?:\[\s*)?)__(?:\s*\.\s*__)*(?=\s*\])/.source), 'm'),
			lookbehind: true,
			greedy: true,
			alias: 'class-name'
		},
		'key': {
			pattern: RegExp(insertKey(/(^\s*|[{,]\s*)__(?:\s*\.\s*__)*(?=\s*=)/.source), 'm'),
			lookbehind: true,
			greedy: true,
			alias: 'property'
		},
		'string': {
			pattern: /"""(?:\\[\s\S]|[^\\])*?"""|'''[\s\S]*?'''|'[^'\n\r]*'|"(?:\\.|[^\\"\r\n])*"/,
			greedy: true
		},
		'date': [
			{
				// Offset Date-Time, Local Date-Time, Local Date
				pattern: /\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?/i,
				alias: 'number'
			},
			{
				// Local Time
				pattern: /\d{2}:\d{2}:\d{2}(?:\.\d+)?/i,
				alias: 'number'
			}
		],
		'number': /(?:\b0(?:x[\da-zA-Z]+(?:_[\da-zA-Z]+)*|o[0-7]+(?:_[0-7]+)*|b[10]+(?:_[10]+)*))\b|[-+]?\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[eE][+-]?\d+(?:_\d+)*)?\b|[-+]?(?:inf|nan)\b/,
		'boolean': /\b(?:true|false)\b/,
		'punctuation': /[.,=[\]{}]/
	};
}(Prism));

Prism.languages.vbnet = Prism.languages.extend("basic", {
	'keyword': /(?:\b(?:ADDHANDLER|ADDRESSOF|ALIAS|AND|ANDALSO|AS|BEEP|BLOAD|BOOLEAN|BSAVE|BYREF|BYTE|BYVAL|CALL(?: ABSOLUTE)?|CASE|CATCH|CBOOL|CBYTE|CCHAR|CDATE|CDEC|CDBL|CHAIN|CHAR|CHDIR|CINT|CLASS|CLEAR|CLNG|CLOSE|CLS|COBJ|COM|COMMON|CONST|CONTINUE|CSBYTE|CSHORT|CSNG|CSTR|CTYPE|CUINT|CULNG|CUSHORT|DATA|DATE|DECIMAL|DECLARE|DEFAULT|DEF(?: FN| SEG|DBL|INT|LNG|SNG|STR)|DELEGATE|DIM|DIRECTCAST|DO|DOUBLE|ELSE|ELSEIF|END|ENUM|ENVIRON|ERASE|ERROR|EVENT|EXIT|FALSE|FIELD|FILES|FINALLY|FOR(?: EACH)?|FRIEND|FUNCTION|GET|GETTYPE|GETXMLNAMESPACE|GLOBAL|GOSUB|GOTO|HANDLES|IF|IMPLEMENTS|IMPORTS|IN|INHERITS|INPUT|INTEGER|INTERFACE|IOCTL|IS|ISNOT|KEY|KILL|LINE INPUT|LET|LIB|LIKE|LOCATE|LOCK|LONG|LOOP|LSET|ME|MKDIR|MOD|MODULE|MUSTINHERIT|MUSTOVERRIDE|MYBASE|MYCLASS|NAME|NAMESPACE|NARROWING|NEW|NEXT|NOT|NOTHING|NOTINHERITABLE|NOTOVERRIDABLE|OBJECT|OF|OFF|ON(?: COM| ERROR| KEY| TIMER)?|OPERATOR|OPEN|OPTION(?: BASE)?|OPTIONAL|OR|ORELSE|OUT|OVERLOADS|OVERRIDABLE|OVERRIDES|PARAMARRAY|PARTIAL|POKE|PRIVATE|PROPERTY|PROTECTED|PUBLIC|PUT|RAISEEVENT|READ|READONLY|REDIM|REM|REMOVEHANDLER|RESTORE|RESUME|RETURN|RMDIR|RSET|RUN|SBYTE|SELECT(?: CASE)?|SET|SHADOWS|SHARED|SHORT|SINGLE|SHELL|SLEEP|STATIC|STEP|STOP|STRING|STRUCTURE|SUB|SYNCLOCK|SWAP|SYSTEM|THEN|THROW|TIMER|TO|TROFF|TRON|TRUE|TRY|TRYCAST|TYPE|TYPEOF|UINTEGER|ULONG|UNLOCK|UNTIL|USHORT|USING|VIEW PRINT|WAIT|WEND|WHEN|WHILE|WIDENING|WITH|WITHEVENTS|WRITE|WRITEONLY|XOR)|\B(?:#CONST|#ELSE|#ELSEIF|#END|#IF))(?:\$|\b)/i,
	'comment': [
		{
			pattern: /(?:!|REM\b).+/i,
			inside: {
				'keyword': /^REM/i
			}
		},
		{
			pattern: /(^|[^\\:])'.*/,
			lookbehind: true
		}
	]
});

Prism.languages.verilog = {
	'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
	'string': {
		pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
		greedy: true
	},
	// support for any kernel function (ex: $display())
	'property': /\B\$\w+\b/,
	// support for user defined constants (ex: `define)
	'constant': /\B`\w+\b/,
	'function': /\w+(?=\()/,
	// support for verilog and system verilog keywords
	'keyword': /\b(?:alias|and|assert|assign|assume|automatic|before|begin|bind|bins|binsof|bit|break|buf|bufif0|bufif1|byte|class|case|casex|casez|cell|chandle|clocking|cmos|config|const|constraint|context|continue|cover|covergroup|coverpoint|cross|deassign|default|defparam|design|disable|dist|do|edge|else|end|endcase|endclass|endclocking|endconfig|endfunction|endgenerate|endgroup|endinterface|endmodule|endpackage|endprimitive|endprogram|endproperty|endspecify|endsequence|endtable|endtask|enum|event|expect|export|extends|extern|final|first_match|for|force|foreach|forever|fork|forkjoin|function|generate|genvar|highz0|highz1|if|iff|ifnone|ignore_bins|illegal_bins|import|incdir|include|initial|inout|input|inside|instance|int|integer|interface|intersect|join|join_any|join_none|large|liblist|library|local|localparam|logic|longint|macromodule|matches|medium|modport|module|nand|negedge|new|nmos|nor|noshowcancelled|not|notif0|notif1|null|or|output|package|packed|parameter|pmos|posedge|primitive|priority|program|property|protected|pull0|pull1|pulldown|pullup|pulsestyle_onevent|pulsestyle_ondetect|pure|rand|randc|randcase|randsequence|rcmos|real|realtime|ref|reg|release|repeat|return|rnmos|rpmos|rtran|rtranif0|rtranif1|scalared|sequence|shortint|shortreal|showcancelled|signed|small|solve|specify|specparam|static|string|strong0|strong1|struct|super|supply0|supply1|table|tagged|task|this|throughout|time|timeprecision|timeunit|tran|tranif0|tranif1|tri|tri0|tri1|triand|trior|trireg|type|typedef|union|unique|unsigned|use|uwire|var|vectored|virtual|void|wait|wait_order|wand|weak0|weak1|while|wildcard|wire|with|within|wor|xnor|xor)\b/,
	// bold highlighting for all verilog and system verilog logic blocks
	'important': /\b(?:always_latch|always_comb|always_ff|always)\b ?@?/,
	// support for time ticks, vectors, and real numbers
	'number': /\B##?\d+|(?:\b\d+)?'[odbh] ?[\da-fzx_?]+|\b\d*[._]?\d+(?:e[-+]?\d+)?/i,
	'operator': /[-+{}^~%*\/?=!<>&|]+/,
	'punctuation': /[[\];(),.:]/
};
Prism.languages.vhdl = {
	'comment': /--.+/,
	// support for all logic vectors
	'vhdl-vectors': {
		'pattern': /\b[oxb]"[\da-f_]+"|"[01uxzwlh-]+"/i,
		'alias': 'number'
	},
	// support for operator overloading included
	'quoted-function': {
		pattern: /"\S+?"(?=\()/,
		alias: 'function'
	},
	'string': /"(?:[^\\"\r\n]|\\(?:\r\n|[\s\S]))*"/,
	'constant': /\b(?:use|library)\b/i,
	// support for predefined attributes included
	'keyword': /\b(?:'active|'ascending|'base|'delayed|'driving|'driving_value|'event|'high|'image|'instance_name|'last_active|'last_event|'last_value|'left|'leftof|'length|'low|'path_name|'pos|'pred|'quiet|'range|'reverse_range|'right|'rightof|'simple_name|'stable|'succ|'transaction|'val|'value|access|after|alias|all|architecture|array|assert|attribute|begin|block|body|buffer|bus|case|component|configuration|constant|disconnect|downto|else|elsif|end|entity|exit|file|for|function|generate|generic|group|guarded|if|impure|in|inertial|inout|is|label|library|linkage|literal|loop|map|new|next|null|of|on|open|others|out|package|port|postponed|procedure|process|pure|range|record|register|reject|report|return|select|severity|shared|signal|subtype|then|to|transport|type|unaffected|units|until|use|variable|wait|when|while|with)\b/i,
	'boolean': /\b(?:true|false)\b/i,
	'function': /\w+(?=\()/,
	// decimal, based, physical, and exponential numbers supported
	'number': /'[01uxzwlh-]'|\b(?:\d+#[\da-f_.]+#|\d[\d_.]*)(?:e[-+]?\d+)?/i,
	'operator': /[<>]=?|:=|[-+*/&=]|\b(?:abs|not|mod|rem|sll|srl|sla|sra|rol|ror|and|or|nand|xnor|xor|nor)\b/i,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.wasm = {
	'comment': [
		/\(;[\s\S]*?;\)/,
		{
			pattern: /;;.*/,
			greedy: true
		}
	],
	'string': {
		pattern: /"(?:\\[\s\S]|[^"\\])*"/,
		greedy: true
	},
	'keyword': [
		{
			pattern: /\b(?:align|offset)=/,
			inside: {
				'operator': /=/
			}
		},
		{
			pattern: /\b(?:(?:f32|f64|i32|i64)(?:\.(?:abs|add|and|ceil|clz|const|convert_[su]\/i(?:32|64)|copysign|ctz|demote\/f64|div(?:_[su])?|eqz?|extend_[su]\/i32|floor|ge(?:_[su])?|gt(?:_[su])?|le(?:_[su])?|load(?:(?:8|16|32)_[su])?|lt(?:_[su])?|max|min|mul|nearest|neg?|or|popcnt|promote\/f32|reinterpret\/[fi](?:32|64)|rem_[su]|rot[lr]|shl|shr_[su]|store(?:8|16|32)?|sqrt|sub|trunc(?:_[su]\/f(?:32|64))?|wrap\/i64|xor))?|memory\.(?:grow|size))\b/,
			inside: {
				'punctuation': /\./
			}
		},
		/\b(?:anyfunc|block|br(?:_if|_table)?|call(?:_indirect)?|data|drop|elem|else|end|export|func|get_(?:global|local)|global|if|import|local|loop|memory|module|mut|nop|offset|param|result|return|select|set_(?:global|local)|start|table|tee_local|then|type|unreachable)\b/
	],
	'variable': /\$[\w!#$%&'*+\-./:<=>?@\\^_`|~]+/i,
	'number': /[+-]?\b(?:\d(?:_?\d)*(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?|0x[\da-fA-F](?:_?[\da-fA-F])*(?:\.[\da-fA-F](?:_?[\da-fA-D])*)?(?:[pP][+-]?\d(?:_?\d)*)?)\b|\binf\b|\bnan(?::0x[\da-fA-F](?:_?[\da-fA-D])*)?\b/,
	'punctuation': /[()]/
};
Prism.languages.wiki = Prism.languages.extend('markup', {
	'block-comment': {
		pattern: /(^|[^\\])\/\*[\s\S]*?\*\//,
		lookbehind: true,
		alias: 'comment'
	},
	'heading': {
		pattern: /^(=+).+?\1/m,
		inside: {
			'punctuation': /^=+|=+$/,
			'important': /.+/
		}
	},
	'emphasis': {
		// TODO Multi-line
		pattern: /('{2,5}).+?\1/,
		inside: {
			'bold-italic': {
				pattern: /(''''').+?(?=\1)/,
				lookbehind: true,
				alias: ['bold', 'italic']
			},
			'bold': {
				pattern: /(''')[^'](?:.*?[^'])?(?=\1)/,
				lookbehind: true
			},
			'italic': {
				pattern: /('')[^'](?:.*?[^'])?(?=\1)/,
				lookbehind: true
			},
			'punctuation': /^''+|''+$/
		}
	},
	'hr': {
		pattern: /^-{4,}/m,
		alias: 'punctuation'
	},
	'url': [
		/ISBN +(?:97[89][ -]?)?(?:\d[ -]?){9}[\dx]\b|(?:RFC|PMID) +\d+/i,
		/\[\[.+?\]\]|\[.+?\]/
	],
	'variable': [
		/__[A-Z]+__/,
		// FIXME Nested structures should be handled
		// {{formatnum:{{#expr:{{{3}}}}}}}
		/\{{3}.+?\}{3}/,
		/\{\{.+?\}\}/
	],
	'symbol': [
		/^#redirect/im,
		/~{3,5}/
	],
	// Handle table attrs:
	// {|
	// ! style="text-align:left;"| Item
	// |}
	'table-tag': {
		pattern: /((?:^|[|!])[|!])[^|\r\n]+\|(?!\|)/m,
		lookbehind: true,
		inside: {
			'table-bar': {
				pattern: /\|$/,
				alias: 'punctuation'
			},
			rest: Prism.languages.markup['tag'].inside
		}
	},
	'punctuation': /^(?:\{\||\|\}|\|-|[*#:;!|])|\|\||!!/m
});

Prism.languages.insertBefore('wiki', 'tag', {
	// Prevent highlighting inside <nowiki>, <source> and <pre> tags
	'nowiki': {
		pattern: /<(nowiki|pre|source)\b[\s\S]*?>[\s\S]*?<\/\1>/i,
		inside: {
			'tag': {
				pattern: /<(?:nowiki|pre|source)\b[\s\S]*?>|<\/(?:nowiki|pre|source)>/i,
				inside: Prism.languages.markup['tag'].inside
			}
		}
	}
});

(function (Prism) {

	// https://yaml.org/spec/1.2/spec.html#c-ns-anchor-property
	// https://yaml.org/spec/1.2/spec.html#c-ns-alias-node
	var anchorOrAlias = /[*&][^\s[\]{},]+/;
	// https://yaml.org/spec/1.2/spec.html#c-ns-tag-property
	var tag = /!(?:<[\w\-%#;/?:@&=+$,.!~*'()[\]]+>|(?:[a-zA-Z\d-]*!)?[\w\-%#;/?:@&=+$.~*'()]+)?/;
	// https://yaml.org/spec/1.2/spec.html#c-ns-properties(n,c)
	var properties = '(?:' + tag.source + '(?:[ \t]+' + anchorOrAlias.source + ')?|'
		+ anchorOrAlias.source + '(?:[ \t]+' + tag.source + ')?)';

	/**
	 *
	 * @param {string} value
	 * @param {string} [flags]
	 * @returns {RegExp}
	 */
	function createValuePattern(value, flags) {
		flags = (flags || '').replace(/m/g, '') + 'm'; // add m flag
		var pattern = /([:\-,[{]\s*(?:\s<<prop>>[ \t]+)?)(?:<<value>>)(?=[ \t]*(?:$|,|]|}|\s*#))/.source
			.replace(/<<prop>>/g, function () { return properties; }).replace(/<<value>>/g, function () { return value; });
		return RegExp(pattern, flags)
	}

	Prism.languages.yaml = {
		'scalar': {
			pattern: RegExp(/([\-:]\s*(?:\s<<prop>>[ \t]+)?[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\2[^\r\n]+)*)/.source
				.replace(/<<prop>>/g, function () { return properties; })),
			lookbehind: true,
			alias: 'string'
		},
		'comment': /#.*/,
		'key': {
			pattern: RegExp(/((?:^|[:\-,[{\r\n?])[ \t]*(?:<<prop>>[ \t]+)?)[^\r\n{[\]},#\s]+?(?=\s*:\s)/.source
				.replace(/<<prop>>/g, function () { return properties; })),
			lookbehind: true,
			alias: 'atrule'
		},
		'directive': {
			pattern: /(^[ \t]*)%.+/m,
			lookbehind: true,
			alias: 'important'
		},
		'datetime': {
			pattern: createValuePattern(/\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?/.source),
			lookbehind: true,
			alias: 'number'
		},
		'boolean': {
			pattern: createValuePattern(/true|false/.source, 'i'),
			lookbehind: true,
			alias: 'important'
		},
		'null': {
			pattern: createValuePattern(/null|~/.source, 'i'),
			lookbehind: true,
			alias: 'important'
		},
		'string': {
			// \2 because of the lookbehind group
			pattern: createValuePattern(/("|')(?:(?!\2)[^\\\r\n]|\\.)*\2/.source),
			lookbehind: true,
			greedy: true
		},
		'number': {
			pattern: createValuePattern(/[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+\.?\d*|\.?\d+)(?:e[+-]?\d+)?|\.inf|\.nan)/.source, 'i'),
			lookbehind: true
		},
		'tag': tag,
		'important': anchorOrAlias,
		'punctuation': /---|[:[\]{}\-,|>?]|\.\.\./
	};

	Prism.languages.yml = Prism.languages.yaml;

}(Prism));

(function () {

	if (typeof self === 'undefined' || !self.Prism || !self.document) {
		return;
	}

	/**
	 * Plugin name which is used as a class name for <pre> which is activating the plugin
	 * @type {String}
	 */
	var PLUGIN_NAME = 'line-numbers';

	/**
	 * Regular expression used for determining line breaks
	 * @type {RegExp}
	 */
	var NEW_LINE_EXP = /\n(?!$)/g;

	/**
	 * Resizes line numbers spans according to height of line of code
	 * @param {Element} element <pre> element
	 */
	var _resizeElement = function (element) {
		var codeStyles = getStyles(element);
		var whiteSpace = codeStyles['white-space'];

		if (whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line') {
			var codeElement = element.querySelector('code');
			var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
			var lineNumberSizer = element.querySelector('.line-numbers-sizer');
			var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

			if (!lineNumberSizer) {
				lineNumberSizer = document.createElement('span');
				lineNumberSizer.className = 'line-numbers-sizer';

				codeElement.appendChild(lineNumberSizer);
			}

			lineNumberSizer.style.display = 'block';

			codeLines.forEach(function (line, lineNumber) {
				lineNumberSizer.textContent = line || '\n';
				var lineSize = lineNumberSizer.getBoundingClientRect().height;
				lineNumbersWrapper.children[lineNumber].style.height = lineSize + 'px';
			});

			lineNumberSizer.textContent = '';
			lineNumberSizer.style.display = 'none';
		}
	};

	/**
	 * Returns style declarations for the element
	 * @param {Element} element
	 */
	var getStyles = function (element) {
		if (!element) {
			return null;
		}

		return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
	};

	window.addEventListener('resize', function () {
		Array.prototype.forEach.call(document.querySelectorAll('pre.' + PLUGIN_NAME), _resizeElement);
	});

	Prism.hooks.add('complete', function (env) {
		if (!env.code) {
			return;
		}

		var code = env.element;
		var pre = code.parentNode;

		// works only for <code> wrapped inside <pre> (not inline)
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		// Abort if line numbers already exists
		if (code.querySelector('.line-numbers-rows')) {
			return;
		}

		var addLineNumbers = false;
		var lineNumbersRegex = /(?:^|\s)line-numbers(?:\s|$)/;

		for (var element = code; element; element = element.parentNode) {
			if (lineNumbersRegex.test(element.className)) {
				addLineNumbers = true;
				break;
			}
		}

		// only add line numbers if <code> or one of its ancestors has the `line-numbers` class
		if (!addLineNumbers) {
			return;
		}

		// Remove the class 'line-numbers' from the <code>
		code.className = code.className.replace(lineNumbersRegex, ' ');
		// Add the class 'line-numbers' to the <pre>
		if (!lineNumbersRegex.test(pre.className)) {
			pre.className += ' line-numbers';
		}

		var match = env.code.match(NEW_LINE_EXP);
		var linesNum = match ? match.length + 1 : 1;
		var lineNumbersWrapper;

		var lines = new Array(linesNum + 1).join('<span></span>');

		lineNumbersWrapper = document.createElement('span');
		lineNumbersWrapper.setAttribute('aria-hidden', 'true');
		lineNumbersWrapper.className = 'line-numbers-rows';
		lineNumbersWrapper.innerHTML = lines;

		if (pre.hasAttribute('data-start')) {
			pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
		}

		env.element.appendChild(lineNumbersWrapper);

		_resizeElement(pre);

		Prism.hooks.run('line-numbers', env);
	});

	Prism.hooks.add('line-numbers', function (env) {
		env.plugins = env.plugins || {};
		env.plugins.lineNumbers = true;
	});

	/**
	 * Global exports
	 */
	Prism.plugins.lineNumbers = {
		/**
		 * Returns the node of the given line number in the given element.
		 * @param {Element} element A `<pre>` element with line numbers.
		 * @param {Number} number
		 * @returns {Element | undefined}
		 */
		getLine: function (element, number) {
			if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
				return;
			}

			var lineNumberRows = element.querySelector('.line-numbers-rows');
			var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
			var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

			if (number < lineNumberStart) {
				number = lineNumberStart;
			}
			if (number > lineNumberEnd) {
				number = lineNumberEnd;
			}

			var lineIndex = number - lineNumberStart;

			return lineNumberRows.children[lineIndex];
		},
		/**
		 * Resizes the line numbers of the given element.
		 *
		 * This function will not add line numbers. It will only resize existing ones.
		 * @param {Element} element A `<pre>` element with line numbers.
		 * @returns {void}
		 */
		resize: function (element) {
			_resizeElement(element);
		}
	};

}());

(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:=&@]+(?:\?[\w\-+%~/.:=?&!$'()*,;@]*)?(?:#[\w\-+%~/.:#=?&!$'()*,;@]*)?/,
    email = /\b\S+@[\w.]+[a-z]{2}/,
    linkMd = /\[([^\]]+)]\(([^)]+)\)/,

	// Tokens that may contain URLs and emails
    candidates = ['comment', 'url', 'attr-value', 'string'];

Prism.plugins.autolinker = {
	processGrammar: function (grammar) {
		// Abort if grammar has already been processed
		if (!grammar || grammar['url-link']) {
			return;
		}
		Prism.languages.DFS(grammar, function (key, def, type) {
			if (candidates.indexOf(type) > -1 && !Array.isArray(def)) {
				if (!def.pattern) {
					def = this[key] = {
						pattern: def
					};
				}

				def.inside = def.inside || {};

				if (type == 'comment') {
					def.inside['md-link'] = linkMd;
				}
				if (type == 'attr-value') {
					Prism.languages.insertBefore('inside', 'punctuation', { 'url-link': url }, def);
				}
				else {
					def.inside['url-link'] = url;
				}

				def.inside['email-link'] = email;
			}
		});
		grammar['url-link'] = url;
		grammar['email-link'] = email;
	}
};

Prism.hooks.add('before-highlight', function(env) {
	Prism.plugins.autolinker.processGrammar(env.grammar);
});

Prism.hooks.add('wrap', function(env) {
	if (/-link$/.test(env.type)) {
		env.tag = 'a';

		var href = env.content;

		if (env.type == 'email-link' && href.indexOf('mailto:') != 0) {
			href = 'mailto:' + href;
		}
		else if (env.type == 'md-link') {
			// Markdown
			var match = env.content.match(linkMd);

			href = match[2];
			env.content = match[1];
		}

		env.attributes.href = href;

		// Silently catch any error thrown by decodeURIComponent (#1186)
		try {
			env.content = decodeURIComponent(env.content);
		} catch(e) {}
	}
});

})();

(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	/**
	 * @param {Element} [container=document]
	 */
	self.Prism.fileHighlight = function(container) {
		container = container || document;

		var Extensions = {
			'js': 'javascript',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell',
			'sh': 'bash',
			'bat': 'batch',
			'h': 'c',
			'tex': 'latex'
		};

		Array.prototype.slice.call(container.querySelectorAll('pre[data-src]')).forEach(function (pre) {
			// ignore if already loaded
			if (pre.hasAttribute('data-src-loaded')) {
				return;
			}

			// load current
			var src = pre.getAttribute('data-src');

			var language, parent = pre;
			var lang = /\blang(?:uage)?-([\w-]+)\b/i;
			while (parent && !lang.test(parent.className)) {
				parent = parent.parentNode;
			}

			if (parent) {
				language = (pre.className.match(lang) || [, ''])[1];
			}

			if (!language) {
				var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
				language = Extensions[extension] || extension;
			}

			var code = document.createElement('code');
			code.className = 'language-' + language;

			pre.textContent = '';

			code.textContent = 'Loading…';

			pre.appendChild(code);

			var xhr = new XMLHttpRequest();

			xhr.open('GET', src, true);

			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {

					if (xhr.status < 400 && xhr.responseText) {
						code.textContent = xhr.responseText;

						Prism.highlightElement(code);
						// mark as loaded
						pre.setAttribute('data-src-loaded', '');
					}
					else if (xhr.status >= 400) {
						code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
					}
					else {
						code.textContent = '✖ Error: File does not exist or is empty';
					}
				}
			};

			xhr.send(null);
		});
	};

	document.addEventListener('DOMContentLoaded', function () {
		// execute inside handler, for dropping Event as argument
		self.Prism.fileHighlight();
	});

})();

(function(){
	if (typeof self === 'undefined' || !self.Prism || !self.document) {
		return;
	}

	var callbacks = [];
	var map = {};
	var noop = function() {};

	Prism.plugins.toolbar = {};

	/**
	 * @typedef ButtonOptions
	 * @property {string} text The text displayed.
	 * @property {string} [url] The URL of the link which will be created.
	 * @property {Function} [onClick] The event listener for the `click` event of the created button.
	 * @property {string} [className] The class attribute to include with element.
	 */

	/**
	 * Register a button callback with the toolbar.
	 *
	 * @param {string} key
	 * @param {ButtonOptions|Function} opts
	 */
	var registerButton = Prism.plugins.toolbar.registerButton = function (key, opts) {
		var callback;

		if (typeof opts === 'function') {
			callback = opts;
		} else {
			callback = function (env) {
				var element;

				if (typeof opts.onClick === 'function') {
					element = document.createElement('button');
					element.type = 'button';
					element.addEventListener('click', function () {
						opts.onClick.call(this, env);
					});
				} else if (typeof opts.url === 'string') {
					element = document.createElement('a');
					element.href = opts.url;
				} else {
					element = document.createElement('span');
				}

				if (opts.className) {
					element.classList.add(opts.className);
				}

				element.textContent = opts.text;

				return element;
			};
		}

		if (key in map) {
			console.warn('There is a button with the key "' + key + '" registered already.');
			return;
		}

		callbacks.push(map[key] = callback);
	};

	/**
	 * Returns the callback order of the given element.
	 *
	 * @param {HTMLElement} element
	 * @returns {string[] | undefined}
	 */
	function getOrder(element) {
		while (element) {
			var order = element.getAttribute('data-toolbar-order');
			if (order != null) {
				order = order.trim();
				if (order.length) {
					return order.split(/\s*,\s*/g);
				} else {
					return [];
				}
			}
			element = element.parentElement;
		}
	}

	/**
	 * Post-highlight Prism hook callback.
	 *
	 * @param env
	 */
	var hook = Prism.plugins.toolbar.hook = function (env) {
		// Check if inline or actual code block (credit to line-numbers plugin)
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		// Autoloader rehighlights, so only do this once.
		if (pre.parentNode.classList.contains('code-toolbar')) {
			return;
		}

		// Create wrapper for <pre> to prevent scrolling toolbar with content
		var wrapper = document.createElement('div');
		wrapper.classList.add('code-toolbar');
		pre.parentNode.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);

		// Setup the toolbar
		var toolbar = document.createElement('div');
		toolbar.classList.add('toolbar');

		// order callbacks
		var elementCallbacks = callbacks;
		var order = getOrder(env.element);
		if (order) {
			elementCallbacks = order.map(function (key) {
				return map[key] || noop;
			});
		}

		elementCallbacks.forEach(function(callback) {
			var element = callback(env);

			if (!element) {
				return;
			}

			var item = document.createElement('div');
			item.classList.add('toolbar-item');

			item.appendChild(element);
			toolbar.appendChild(item);
		});

		// Add our toolbar to the currently created wrapper of <pre> tag
		wrapper.appendChild(toolbar);
	};

	registerButton('label', function(env) {
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		if (!pre.hasAttribute('data-label')) {
			return;
		}

		var element, template;
		var text = pre.getAttribute('data-label');
		try {
			// Any normal text will blow up this selector.
			template = document.querySelector('template#' + text);
		} catch (e) {}

		if (template) {
			element = template.content;
		} else {
			if (pre.hasAttribute('data-url')) {
				element = document.createElement('a');
				element.href = pre.getAttribute('data-url');
			} else {
				element = document.createElement('span');
			}

			element.textContent = text;
		}

		return element;
	});

	/**
	 * Register the toolbar with Prism.
	 */
	Prism.hooks.add('complete', hook);
})();

(function () {

	if (typeof self === 'undefined' || !self.Prism || !self.document) {
		return;
	}

	if (!Prism.plugins.toolbar) {
		console.warn('Show Languages plugin loaded before Toolbar plugin.');

		return;
	}

	// The languages map is built automatically with gulp
	var Languages = /*languages_placeholder[*/{
		"html": "HTML",
		"xml": "XML",
		"svg": "SVG",
		"mathml": "MathML",
		"css": "CSS",
		"clike": "C-like",
		"js": "JavaScript",
		"abap": "ABAP",
		"abnf": "Augmented Backus–Naur form",
		"antlr4": "ANTLR4",
		"g4": "ANTLR4",
		"apacheconf": "Apache Configuration",
		"apl": "APL",
		"aql": "AQL",
		"arff": "ARFF",
		"asciidoc": "AsciiDoc",
		"adoc": "AsciiDoc",
		"asm6502": "6502 Assembly",
		"aspnet": "ASP.NET (C#)",
		"autohotkey": "AutoHotkey",
		"autoit": "AutoIt",
		"basic": "BASIC",
		"bbcode": "BBcode",
		"bnf": "Backus–Naur form",
		"rbnf": "Routing Backus–Naur form",
		"conc": "Concurnas",
		"csharp": "C#",
		"cs": "C#",
		"dotnet": "C#",
		"cpp": "C++",
		"cil": "CIL",
		"coffee": "CoffeeScript",
		"cmake": "CMake",
		"csp": "Content-Security-Policy",
		"css-extras": "CSS Extras",
		"dax": "DAX",
		"django": "Django/Jinja2",
		"jinja2": "Django/Jinja2",
		"dns-zone-file": "DNS zone file",
		"dns-zone": "DNS zone file",
		"dockerfile": "Docker",
		"ebnf": "Extended Backus–Naur form",
		"ejs": "EJS",
		"etlua": "Embedded Lua templating",
		"erb": "ERB",
		"excel-formula": "Excel Formula",
		"xlsx": "Excel Formula",
		"xls": "Excel Formula",
		"fsharp": "F#",
		"firestore-security-rules": "Firestore security rules",
		"ftl": "FreeMarker Template Language",
		"gcode": "G-code",
		"gdscript": "GDScript",
		"gedcom": "GEDCOM",
		"glsl": "GLSL",
		"gml": "GameMaker Language",
		"gamemakerlanguage": "GameMaker Language",
		"graphql": "GraphQL",
		"hs": "Haskell",
		"hcl": "HCL",
		"http": "HTTP",
		"hpkp": "HTTP Public-Key-Pins",
		"hsts": "HTTP Strict-Transport-Security",
		"ichigojam": "IchigoJam",
		"iecst": "Structured Text (IEC 61131-3)",
		"inform7": "Inform 7",
		"javadoc": "JavaDoc",
		"javadoclike": "JavaDoc-like",
		"javastacktrace": "Java stack trace",
		"jq": "JQ",
		"jsdoc": "JSDoc",
		"js-extras": "JS Extras",
		"js-templates": "JS Templates",
		"json": "JSON",
		"jsonp": "JSONP",
		"json5": "JSON5",
		"latex": "LaTeX",
		"tex": "TeX",
		"context": "ConTeXt",
		"lilypond": "LilyPond",
		"ly": "LilyPond",
		"emacs": "Lisp",
		"elisp": "Lisp",
		"emacs-lisp": "Lisp",
		"llvm": "LLVM IR",
		"lolcode": "LOLCODE",
		"md": "Markdown",
		"markup-templating": "Markup templating",
		"matlab": "MATLAB",
		"mel": "MEL",
		"moon": "MoonScript",
		"n1ql": "N1QL",
		"n4js": "N4JS",
		"n4jsd": "N4JS",
		"nand2tetris-hdl": "Nand To Tetris HDL",
		"nasm": "NASM",
		"neon": "NEON",
		"nginx": "nginx",
		"nsis": "NSIS",
		"objectivec": "Objective-C",
		"objc": "Objective-C",
		"ocaml": "OCaml",
		"opencl": "OpenCL",
		"parigp": "PARI/GP",
		"objectpascal": "Object Pascal",
		"pcaxis": "PC-Axis",
		"px": "PC-Axis",
		"php": "PHP",
		"phpdoc": "PHPDoc",
		"php-extras": "PHP Extras",
		"plsql": "PL/SQL",
		"powerquery": "PowerQuery",
		"pq": "PowerQuery",
		"mscript": "PowerQuery",
		"powershell": "PowerShell",
		"properties": ".properties",
		"protobuf": "Protocol Buffers",
		"py": "Python",
		"q": "Q (kdb+ database)",
		"qml": "QML",
		"jsx": "React JSX",
		"tsx": "React TSX",
		"renpy": "Ren'py",
		"rest": "reST (reStructuredText)",
		"robotframework": "Robot Framework",
		"robot": "Robot Framework",
		"rb": "Ruby",
		"sas": "SAS",
		"sass": "Sass (Sass)",
		"scss": "Sass (Scss)",
		"shell-session": "Shell session",
		"solidity": "Solidity (Ethereum)",
		"solution-file": "Solution file",
		"sln": "Solution file",
		"soy": "Soy (Closure Template)",
		"sparql": "SPARQL",
		"rq": "SPARQL",
		"splunk-spl": "Splunk SPL",
		"sqf": "SQF: Status Quo Function (Arma 3)",
		"sql": "SQL",
		"tap": "TAP",
		"toml": "TOML",
		"tt2": "Template Toolkit 2",
		"trig": "TriG",
		"ts": "TypeScript",
		"t4-cs": "T4 Text Templates (C#)",
		"t4": "T4 Text Templates (C#)",
		"t4-vb": "T4 Text Templates (VB)",
		"t4-templating": "T4 templating",
		"vbnet": "VB.Net",
		"vhdl": "VHDL",
		"vim": "vim",
		"visual-basic": "Visual Basic",
		"vb": "Visual Basic",
		"wasm": "WebAssembly",
		"wiki": "Wiki markup",
		"xeoracube": "XeoraCube",
		"xojo": "Xojo (REALbasic)",
		"xquery": "XQuery",
		"yaml": "YAML",
		"yml": "YAML"
	}/*]*/;

	Prism.plugins.toolbar.registerButton('show-language', function (env) {
		var pre = env.element.parentNode;
		if (!pre || !/pre/i.test(pre.nodeName)) {
			return;
		}

		/**
		 * Tries to guess the name of a language given its id.
		 *
		 * @param {string} id The language id.
		 * @returns {string}
		 */
		function guessTitle(id) {
			if (!id) {
				return id;
			}
			return (id.substring(0, 1).toUpperCase() + id.substring(1)).replace(/s(?=cript)/, 'S');
		}

		var language = pre.getAttribute('data-language') || Languages[env.language] || guessTitle(env.language);

		if (!language) {
			return;
		}
		var element = document.createElement('span');
		element.textContent = language;

		return element;
	});

})();

(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

Prism.hooks.add('wrap', function(env) {
	if (env.type !== "keyword") {
		return;
	}
	env.classes.push('keyword-' + env.content);
});

})();

(function () {

	if (typeof self === 'undefined' || typeof Prism === 'undefined' || typeof document === 'undefined') {
		return;
	}

	// Copied from the markup language definition
	var HTML_TAG = /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/g;

	// a regex to validate hexadecimal colors
	var HEX_COLOR = /^#?((?:[\da-f]){3,4}|(?:[\da-f]{2}){3,4})$/i;

	/**
	 * Parses the given hexadecimal representation and returns the parsed RGBA color.
	 *
	 * If the format of the given string is invalid, `undefined` will be returned.
	 * Valid formats are: `RGB`, `RGBA`, `RRGGBB`, and `RRGGBBAA`.
	 *
	 * Hexadecimal colors are parsed because they are not fully supported by older browsers, so converting them to
	 * `rgba` functions improves browser compatibility.
	 *
	 * @param {string} hex
	 * @returns {string | undefined}
	 */
	function parseHexColor(hex) {
		var match = HEX_COLOR.exec(hex);
		if (!match) {
			return undefined;
		}
		hex = match[1]; // removes the leading "#"

		// the width and number of channels
		var channelWidth = hex.length >= 6 ? 2 : 1;
		var channelCount = hex.length / channelWidth;

		// the scale used to normalize 4bit and 8bit values
		var scale = channelWidth == 1 ? 1 / 15 : 1 / 255;

		// normalized RGBA channels
		var channels = [];
		for (var i = 0; i < channelCount; i++) {
			var int = parseInt(hex.substr(i * channelWidth, channelWidth), 16);
			channels.push(int * scale);
		}
		if (channelCount == 3) {
			channels.push(1); // add alpha of 100%
		}

		// output
		var rgb = channels.slice(0, 3).map(function (x) {
			return String(Math.round(x * 255));
		}).join(',');
		var alpha = String(Number(channels[3].toFixed(3))); // easy way to round 3 decimal places

		return 'rgba(' + rgb + ',' + alpha + ')';
	}

	/**
	 * Validates the given Color using the current browser's internal implementation.
	 *
	 * @param {string} color
	 * @returns {string | undefined}
	 */
	function validateColor(color) {
		var s = new Option().style;
		s.color = color;
		return s.color ? color : undefined;
	}

	/**
	 * An array of function which parse a given string representation of a color.
	 *
	 * These parser serve as validators and as a layer of compatibility to support color formats which the browser
	 * might not support natively.
	 *
	 * @type {((value: string) => (string|undefined))[]}
	 */
	var parsers = [
		parseHexColor,
		validateColor
	];


	Prism.hooks.add('wrap', function (env) {
		if (env.type === 'color' || env.classes.indexOf('color') >= 0) {
			var content = env.content;

			// remove all HTML tags inside
			var rawText = content.split(HTML_TAG).join('');

			var color;
			for (var i = 0, l = parsers.length; i < l && !color; i++) {
				color = parsers[i](rawText);
			}

			if (!color) {
				return;
			}

			var previewElement = '<span class="inline-color-wrapper"><span class="inline-color" style="background-color:' + color + ';"></span></span>';
			env.content = previewElement + content;
		}
	});

}());

(function() {

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

var clsReg = /(?:^|\s)command-line(?:\s|$)/;

Prism.hooks.add('before-highlight', function (env) {
	var vars = env.vars = env.vars || {};
	var commandLine = vars['command-line'] = vars['command-line'] || {};

	if (commandLine.complete || !env.code) {
		commandLine.complete = true;
		return;
	}

	// Works only for <code> wrapped inside <pre> (not inline).
	var pre = env.element.parentNode;
	if (!pre || !/pre/i.test(pre.nodeName) || // Abort only if neither the <pre> nor the <code> have the class
		(!clsReg.test(pre.className) && !clsReg.test(env.element.className))) {
		commandLine.complete = true;
		return;
	}

	// The element might be highlighted multiple times, so we just remove the previous prompt
	var existingPrompt = env.element.querySelector('.command-line-prompt');
	if (existingPrompt) {
		existingPrompt.remove();
	}

	var codeLines = env.code.split('\n');
	commandLine.numberOfLines = codeLines.length;
	var outputLines = commandLine.outputLines = [];

	var outputSections = pre.getAttribute('data-output');
	var outputFilter = pre.getAttribute('data-filter-output');
	if (outputSections || outputSections === '') { // The user specified the output lines. -- cwells
		outputSections = outputSections.split(',');
		for (var i = 0; i < outputSections.length; i++) { // Parse the output sections into start/end ranges. -- cwells
			var range = outputSections[i].split('-');
			var outputStart = parseInt(range[0], 10);
			var outputEnd = (range.length === 2 ? parseInt(range[1], 10) : outputStart);

			if (!isNaN(outputStart) && !isNaN(outputEnd)) {
				if (outputStart < 1) {
					outputStart = 1;
				}
				if (outputEnd > codeLines.length) {
					outputEnd = codeLines.length;
				}
				// Convert start and end to 0-based to simplify the arrays. -- cwells
				outputStart--;
				outputEnd--;
				// Save the output line in an array and clear it in the code so it's not highlighted. -- cwells
				for (var j = outputStart; j <= outputEnd; j++) {
					outputLines[j] = codeLines[j];
					codeLines[j] = '';
				}
			}
		}
	} else if (outputFilter) { // Treat lines beginning with this string as output. -- cwells
		for (var i = 0; i < codeLines.length; i++) {
			if (codeLines[i].indexOf(outputFilter) === 0) { // This line is output. -- cwells
				outputLines[i] = codeLines[i].slice(outputFilter.length);
				codeLines[i] = '';
			}
		}
	}

	env.code = codeLines.join('\n');
});

Prism.hooks.add('before-insert', function (env) {
	var vars = env.vars = env.vars || {};
	var commandLine = vars['command-line'] = vars['command-line'] || {};
	if (commandLine.complete) {
		return;
	}

	// Reinsert the output lines into the highlighted code. -- cwells
	var codeLines = env.highlightedCode.split('\n');
	for (var i = 0, l = (commandLine.outputLines || []).length; i < l; i++) {
		if (commandLine.outputLines.hasOwnProperty(i)) {
			codeLines[i] = commandLine.outputLines[i];
		}
	}
	env.highlightedCode = codeLines.join('\n');
});

Prism.hooks.add('complete', function (env) {
	var vars = env.vars = env.vars || {};
	var commandLine = vars['command-line'] = vars['command-line'] || {};
	if (commandLine.complete) {
		return;
	}

	var pre = env.element.parentNode;
	if (clsReg.test(env.element.className)) { // Remove the class "command-line" from the <code>
		env.element.className = env.element.className.replace(clsReg, ' ');
	}
	if (!clsReg.test(pre.className)) { // Add the class "command-line" to the <pre>
		pre.className += ' command-line';
	}

	var getAttribute = function(key, defaultValue) {
		return (pre.getAttribute(key) || defaultValue).replace(/"/g, '&quot');
	};

	// Create the "rows" that will become the command-line prompts. -- cwells
	var promptLines = new Array((commandLine.numberOfLines || 0) + 1);
	var promptText = getAttribute('data-prompt', '');
	if (promptText !== '') {
		promptLines = promptLines.join('<span data-prompt="' + promptText + '"></span>');
	} else {
		var user = getAttribute('data-user', 'user');
		var host = getAttribute('data-host', 'localhost');
		promptLines = promptLines.join('<span data-user="' + user + '" data-host="' + host + '"></span>');
	}

	// Create the wrapper element. -- cwells
	var prompt = document.createElement('span');
	prompt.className = 'command-line-prompt';
	prompt.innerHTML = promptLines;

	// Remove the prompt from the output lines. -- cwells
	for (var i = 0, l = (commandLine.outputLines || []).length; i < l; i++) {
		if (commandLine.outputLines.hasOwnProperty(i)) {
			var node = prompt.children[i];
			node.removeAttribute('data-user');
			node.removeAttribute('data-host');
			node.removeAttribute('data-prompt');
		}
	}

	env.element.insertBefore(prompt, env.element.firstChild);
	commandLine.complete = true;
});

}());

(function() {

var assign = Object.assign || function (obj1, obj2) {
	for (var name in obj2) {
		if (obj2.hasOwnProperty(name))
			obj1[name] = obj2[name];
	}
	return obj1;
}

function NormalizeWhitespace(defaults) {
	this.defaults = assign({}, defaults);
}

function toCamelCase(value) {
	return value.replace(/-(\w)/g, function(match, firstChar) {
		return firstChar.toUpperCase();
	});
}

function tabLen(str) {
	var res = 0;
	for (var i = 0; i < str.length; ++i) {
		if (str.charCodeAt(i) == '\t'.charCodeAt(0))
			res += 3;
	}
	return str.length + res;
}

NormalizeWhitespace.prototype = {
	setDefaults: function (defaults) {
		this.defaults = assign(this.defaults, defaults);
	},
	normalize: function (input, settings) {
		settings = assign(this.defaults, settings);

		for (var name in settings) {
			var methodName = toCamelCase(name);
			if (name !== "normalize" && methodName !== 'setDefaults' &&
					settings[name] && this[methodName]) {
				input = this[methodName].call(this, input, settings[name]);
			}
		}

		return input;
	},

	/*
	 * Normalization methods
	 */
	leftTrim: function (input) {
		return input.replace(/^\s+/, '');
	},
	rightTrim: function (input) {
		return input.replace(/\s+$/, '');
	},
	tabsToSpaces: function (input, spaces) {
		spaces = spaces|0 || 4;
		return input.replace(/\t/g, new Array(++spaces).join(' '));
	},
	spacesToTabs: function (input, spaces) {
		spaces = spaces|0 || 4;
		return input.replace(RegExp(' {' + spaces + '}', 'g'), '\t');
	},
	removeTrailing: function (input) {
		return input.replace(/\s*?$/gm, '');
	},
	// Support for deprecated plugin remove-initial-line-feed
	removeInitialLineFeed: function (input) {
		return input.replace(/^(?:\r?\n|\r)/, '');
	},
	removeIndent: function (input) {
		var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);

		if (!indents || !indents[0].length)
			return input;

		indents.sort(function(a, b){return a.length - b.length; });

		if (!indents[0].length)
			return input;

		return input.replace(RegExp('^' + indents[0], 'gm'), '');
	},
	indent: function (input, tabs) {
		return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join('\t') + '$&');
	},
	breakLines: function (input, characters) {
		characters = (characters === true) ? 80 : characters|0 || 80;

		var lines = input.split('\n');
		for (var i = 0; i < lines.length; ++i) {
			if (tabLen(lines[i]) <= characters)
				continue;

			var line = lines[i].split(/(\s+)/g),
			    len = 0;

			for (var j = 0; j < line.length; ++j) {
				var tl = tabLen(line[j]);
				len += tl;
				if (len > characters) {
					line[j] = '\n' + line[j];
					len = tl;
				}
			}
			lines[i] = line.join('');
		}
		return lines.join('\n');
	}
};

// Support node modules
if (typeof module !== 'undefined' && module.exports) {
	module.exports = NormalizeWhitespace;
}

// Exit if prism is not loaded
if (typeof Prism === 'undefined') {
	return;
}

Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
	'remove-trailing': true,
	'remove-indent': true,
	'left-trim': true,
	'right-trim': true,
	/*'break-lines': 80,
	'indent': 2,
	'remove-initial-line-feed': false,
	'tabs-to-spaces': 4,
	'spaces-to-tabs': 4*/
});

Prism.hooks.add('before-sanity-check', function (env) {
	var Normalizer = Prism.plugins.NormalizeWhitespace;

	// Check settings
	if (env.settings && env.settings['whitespace-normalization'] === false) {
		return;
	}

	// Simple mode if there is no env.element
	if ((!env.element || !env.element.parentNode) && env.code) {
		env.code = Normalizer.normalize(env.code, env.settings);
		return;
	}

	// Normal mode
	var pre = env.element.parentNode;
	var clsReg = /(?:^|\s)no-whitespace-normalization(?:\s|$)/;
	if (!env.code || !pre || pre.nodeName.toLowerCase() !== 'pre' ||
			clsReg.test(pre.className) || clsReg.test(env.element.className))
		return;

	var children = pre.childNodes,
	    before = '',
	    after = '',
	    codeFound = false;

	// Move surrounding whitespace from the <pre> tag into the <code> tag
	for (var i = 0; i < children.length; ++i) {
		var node = children[i];

		if (node == env.element) {
			codeFound = true;
		} else if (node.nodeName === "#text") {
			if (codeFound) {
				after += node.nodeValue;
			} else {
				before += node.nodeValue;
			}

			pre.removeChild(node);
			--i;
		}
	}

	if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
		env.code = before + env.code + after;
		env.code = Normalizer.normalize(env.code, env.settings);
	} else {
		// Preserve markup for keep-markup plugin
		var html = before + env.element.innerHTML + after;
		env.element.innerHTML = Normalizer.normalize(html, env.settings);
		env.code = env.element.textContent;
	}
});

}());

(function(){
	if (typeof self === 'undefined' || !self.Prism || !self.document) {
		return;
	}

	if (!Prism.plugins.toolbar) {
		console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');

		return;
	}

	var ClipboardJS = window.ClipboardJS || undefined;

	if (!ClipboardJS && typeof require === 'function') {
		ClipboardJS = require('clipboard');
	}

	var callbacks = [];

	if (!ClipboardJS) {
		var script = document.createElement('script');
		var head = document.querySelector('head');

		script.onload = function() {
			ClipboardJS = window.ClipboardJS;

			if (ClipboardJS) {
				while (callbacks.length) {
					callbacks.pop()();
				}
			}
		};

		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js';
		head.appendChild(script);
	}

	Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (env) {
		var linkCopy = document.createElement('button');
		linkCopy.textContent = 'Copy';

		if (!ClipboardJS) {
			callbacks.push(registerClipboard);
		} else {
			registerClipboard();
		}

		return linkCopy;

		function registerClipboard() {
			var clip = new ClipboardJS(linkCopy, {
				'text': function () {
					return env.code;
				}
			});

			clip.on('success', function() {
				linkCopy.textContent = 'Copied!';

				resetText();
			});
			clip.on('error', function () {
				linkCopy.textContent = 'Press Ctrl+C to copy';

				resetText();
			});
		}

		function resetText() {
			setTimeout(function () {
				linkCopy.textContent = 'Copy';
			}, 5000);
		}
	});
})();

(function () {

	if (typeof self === 'undefined' || !self.Prism || !self.document) {
		return;
	}

	var MATCH_ALL_CLASS = /(?:^|\s)match-braces(?:\s|$)/;

	var BRACE_HOVER_CLASS = /(?:^|\s)brace-hover(?:\s|$)/;
	var BRACE_SELECTED_CLASS = /(?:^|\s)brace-selected(?:\s|$)/;

	var NO_BRACE_HOVER_CLASS = /(?:^|\s)no-brace-hover(?:\s|$)/;
	var NO_BRACE_SELECT_CLASS = /(?:^|\s)no-brace-select(?:\s|$)/;

	var PARTNER = {
		'(': ')',
		'[': ']',
		'{': '}',
	};

	var NAMES = {
		'(': 'brace-round',
		'[': 'brace-square',
		'{': 'brace-curly',
	};

	var LEVEL_WARP = 12;

	var pairIdCounter = 0;

	var BRACE_ID_PATTERN = /^(pair-\d+-)(open|close)$/;

	/**
	 * Returns the brace partner given one brace of a brace pair.
	 *
	 * @param {HTMLElement} brace
	 * @returns {HTMLElement}
	 */
	function getPartnerBrace(brace) {
		var match = BRACE_ID_PATTERN.exec(brace.id);
		return document.querySelector('#' + match[1] + (match[2] == 'open' ? 'close' : 'open'));
	}

	/**
	 * @this {HTMLElement}
	 */
	function hoverBrace() {
		for (var parent = this.parentElement; parent; parent = parent.parentElement) {
			if (NO_BRACE_HOVER_CLASS.test(parent.className)) {
				return;
			}
		}

		[this, getPartnerBrace(this)].forEach(function (ele) {
			ele.className = (ele.className.replace(BRACE_HOVER_CLASS, ' ') + ' brace-hover').replace(/\s+/g, ' ');
		});
	}
	/**
	 * @this {HTMLElement}
	 */
	function leaveBrace() {
		[this, getPartnerBrace(this)].forEach(function (ele) {
			ele.className = ele.className.replace(BRACE_HOVER_CLASS, ' ');
		});
	}
	/**
	 * @this {HTMLElement}
	 */
	function clickBrace() {
		for (var parent = this.parentElement; parent; parent = parent.parentElement) {
			if (NO_BRACE_SELECT_CLASS.test(parent.className)) {
				return;
			}
		}

		[this, getPartnerBrace(this)].forEach(function (ele) {
			ele.className = (ele.className.replace(BRACE_SELECTED_CLASS, ' ') + ' brace-selected').replace(/\s+/g, ' ');
		});
	}

	Prism.hooks.add('complete', function (env) {

		/** @type {HTMLElement} */
		var code = env.element;
		var pre = code.parentElement;

		if (!pre || pre.tagName != 'PRE') {
			return;
		}

		// find the braces to match
		/** @type {string[]} */
		var toMatch = [];
		for (var ele = code; ele; ele = ele.parentElement) {
			if (MATCH_ALL_CLASS.test(ele.className)) {
				toMatch.push('(', '[', '{');
				break;
			}
		}

		if (toMatch.length == 0) {
			// nothing to match
			return;
		}

		if (!pre.__listenerAdded) {
			// code blocks might be highlighted more than once
			pre.addEventListener('mousedown', function removeBraceSelected() {
				// the code element might have been replaced
				var code = pre.querySelector('code');
				Array.prototype.slice.call(code.querySelectorAll('.brace-selected')).forEach(function (element) {
					element.className = element.className.replace(BRACE_SELECTED_CLASS, ' ');
				});
			});
			Object.defineProperty(pre, '__listenerAdded', { value: true });
		}

		/** @type {HTMLSpanElement[]} */
		var punctuation = Array.prototype.slice.call(code.querySelectorAll('span.token.punctuation'));

		/** @type {{ index: number, open: boolean, element: HTMLElement }[]} */
		var allBraces = [];

		toMatch.forEach(function (open) {
			var close = PARTNER[open];
			var name = NAMES[open];

			/** @type {[number, number][]} */
			var pairs = [];
			/** @type {number[]} */
			var openStack = [];

			for (var i = 0; i < punctuation.length; i++) {
				var element = punctuation[i];
				if (element.childElementCount == 0) {
					var text = element.textContent;
					if (text === open) {
						allBraces.push({ index: i, open: true, element: element });
						element.className += ' ' + name;
						element.className += ' brace-open';
						openStack.push(i);
					} else if (text === close) {
						allBraces.push({ index: i, open: false, element: element });
						element.className += ' ' + name;
						element.className += ' brace-close';
						if (openStack.length) {
							pairs.push([i, openStack.pop()]);
						}
					}
				}
			}

			pairs.forEach(function (pair) {
				var pairId = 'pair-' + (pairIdCounter++) + '-';

				var openEle = punctuation[pair[0]];
				var closeEle = punctuation[pair[1]];

				openEle.id = pairId + 'open';
				closeEle.id = pairId + 'close';

				[openEle, closeEle].forEach(function (ele) {
					ele.addEventListener('mouseenter', hoverBrace);
					ele.addEventListener('mouseleave', leaveBrace);
					ele.addEventListener('click', clickBrace);
				});
			});
		});

		var level = 0;
		allBraces.sort(function (a, b) { return a.index - b.index; });
		allBraces.forEach(function (brace) {
			if (brace.open) {
				brace.element.className += ' brace-level-' + (level % LEVEL_WARP + 1);
				level++;
			} else {
				level = Math.max(0, level - 1);
				brace.element.className += ' brace-level-' + (level % LEVEL_WARP + 1);
			}
		});

	});

}());

(function () {

	if (typeof Prism === 'undefined' || !Prism.languages['diff']) {
		return;
	}


	var LANGUAGE_REGEX = /diff-([\w-]+)/i;
	var HTML_TAG = /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/gi;
	//this will match a line plus the line break while ignoring the line breaks HTML tags may contain.
	var HTML_LINE = RegExp(/(?:__|[^\r\n<])*(?:\r\n?|\n|(?:__|[^\r\n<])(?![^\r\n]))/.source.replace(/__/g, function () { return HTML_TAG.source; }), 'gi');

	var PREFIXES = Prism.languages.diff.PREFIXES;


	Prism.hooks.add('before-sanity-check', function (env) {
		var lang = env.language;
		if (LANGUAGE_REGEX.test(lang) && !env.grammar) {
			env.grammar = Prism.languages[lang] = Prism.languages['diff'];
		}
	});
	Prism.hooks.add('before-tokenize', function (env) {
		var lang = env.language;
		if (LANGUAGE_REGEX.test(lang) && !Prism.languages[lang]) {
			Prism.languages[lang] = Prism.languages['diff'];
		}
	});

	Prism.hooks.add('wrap', function (env) {
		var diffLanguage, diffGrammar;

		if (env.language !== 'diff') {
			var langMatch = LANGUAGE_REGEX.exec(env.language);
			if (!langMatch) {
				return; // not a language specific diff
			}

			diffLanguage = langMatch[1];
			diffGrammar = Prism.languages[diffLanguage];
		}

		// one of the diff tokens without any nested tokens
		if (env.type in PREFIXES) {
			/** @type {string} */
			var content = env.content.replace(HTML_TAG, ''); // remove all HTML tags

			/** @type {string} */
			var decoded = content.replace(/&lt;/g, '<').replace(/&amp;/g, '&');

			// remove any one-character prefix
			var code = decoded.replace(/(^|[\r\n])./g, '$1');

			// highlight, if possible
			var highlighted;
			if (diffGrammar) {
				highlighted = Prism.highlight(code, diffGrammar, diffLanguage);
			} else {
				highlighted = Prism.util.encode(code);
			}

			// get the HTML source of the prefix token
			var prefixToken = new Prism.Token('prefix', PREFIXES[env.type], [/\w+/.exec(env.type)[0]]);
			var prefix = Prism.Token.stringify(prefixToken, env.language);

			// add prefix
			var lines = [], m;
			HTML_LINE.lastIndex = 0;
			while (m = HTML_LINE.exec(highlighted)) {
				lines.push(prefix + m[0]);
			}
			if (/(?:^|[\r\n]).$/.test(decoded)) {
				// because both "+a\n+" and "+a\n" will map to "a\n" after the line prefixes are removed
				lines.push(prefix);
			}
			env.content = lines.join('');

			if (diffGrammar) {
				env.classes.push('language-' + diffLanguage);
			}
		}
	});

}());

