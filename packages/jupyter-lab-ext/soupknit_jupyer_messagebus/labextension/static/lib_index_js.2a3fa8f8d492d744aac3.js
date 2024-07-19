"use strict";
(self["webpackChunksoupknit_jupyer_messagebus"] = self["webpackChunksoupknit_jupyer_messagebus"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Initialization data for the jupyterlab-iframe-bridge-example extension.
 */
const plugin = {
    id: 'jupyterlab-iframe-bridge-example:plugin',
    autoStart: true,
    requires: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.IThemeManager, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.INotebookTracker],
    activate: (app, themeManager, notebooks) => {
        console.log('JupyterLab iframe-bridge is active');
        // app
        // shell
        // labShell.toggleTopInSimpleModeVisibility();
        // labShell.collapseLeft();
        // labShell.collapseRight();
        /* Incoming messages management */
        window.addEventListener('message', (event) => {
            console.log('Message received in the iframe:', event.data);
            if (event.data.type === 'toggle_theme') {
                if (themeManager.theme === 'JupyterLab Dark') {
                    themeManager.setTheme('JupyterLab Light');
                }
                else {
                    themeManager.setTheme('JupyterLab Dark');
                }
            }
            if (event.data.type === 'add_cell') {
                const current = notebooks.currentWidget;
                if (!current || !current.content) {
                    return;
                }
                const notebook = current === null || current === void 0 ? void 0 : current.content;
                _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.NotebookActions.insertBelow(notebook);
                const activeCell = notebook.activeCell;
                activeCell &&
                    event.data.content &&
                    activeCell.model.sharedModel.setSource(event.data.content);
            }
        });
        /* Outgoing messages management */
        const notifyThemeChanged = () => {
            const message = {
                type: 'from-iframe-to-host',
                theme: themeManager.theme
            };
            window.parent.postMessage(message, '*');
            console.log('Message sent to the host:', message);
        };
        themeManager.themeChanged.connect(notifyThemeChanged);
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ })

}]);
//# sourceMappingURL=lib_index_js.2a3fa8f8d492d744aac3.js.map