MathJax.Hub.Config({
  locale: window.navigator.language,
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/SVG"],
  tex2jax: {
    inlineMath: [['$', '$'], ["\\(", "\\)"]],
    displayMath: [['$$', '$$'], ["\\[", "\\]"]],
    processEscapes: true
  },
  skipTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'a'],
  "HTML-CSS": { fonts: ["TeX"], showMathMenu: false, },
  showProcessingMessages: false,
  messageStyle: "none"
});
