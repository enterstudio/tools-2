/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */
import ChildRunner from './childrunner.js';
import * as util from './util.js';
var SOCKETIO_ENDPOINT = window.location.protocol + '//' + window.location.host;
var SOCKETIO_LIBRARY = SOCKETIO_ENDPOINT + '/socket.io/socket.io.js';
/**
 * A socket for communication between the CLI and browser runners.
 *
 * @param {string} browserId An ID generated by the CLI runner.
 * @param {!io.Socket} socket The socket.io `Socket` to communicate over.
 */
var CLISocket = /** @class */ (function () {
    function CLISocket(browserId, socket) {
        this.browserId = browserId;
        this.socket = socket;
    }
    /**
     * @param {!Mocha.Runner} runner The Mocha `Runner` to observe, reporting
     *     interesting events back to the CLI runner.
     */
    CLISocket.prototype.observe = function (runner) {
        var _this = this;
        this.emitEvent('browser-start', {
            url: window.location.toString(),
        });
        // We only emit a subset of events that we care about, and follow a more
        // general event format that is hopefully applicable to test runners beyond
        // mocha.
        //
        // For all possible mocha events, see:
        // https://github.com/visionmedia/mocha/blob/master/lib/runner.js#L36
        runner.on('test', function (test) {
            _this.emitEvent('test-start', { test: getTitles(test) });
        });
        runner.on('test end', function (test) {
            _this.emitEvent('test-end', {
                state: getState(test),
                test: getTitles(test),
                duration: test.duration,
                error: test.err,
            });
        });
        runner.on('fail', function (test, err) {
            // fail the test run if we catch errors outside of a test function
            if (test.type !== 'test') {
                _this.emitEvent('browser-fail', 'Error thrown outside of test function: ' + err.stack);
            }
        });
        runner.on('childRunner start', function (childRunner) {
            _this.emitEvent('sub-suite-start', childRunner.share);
        });
        runner.on('childRunner end', function (childRunner) {
            _this.emitEvent('sub-suite-end', childRunner.share);
        });
        runner.on('end', function () {
            _this.emitEvent('browser-end');
        });
    };
    /**
     * @param {string} event The name of the event to fire.
     * @param {*} data Additional data to pass with the event.
     */
    CLISocket.prototype.emitEvent = function (event, data) {
        this.socket.emit('client-event', {
            browserId: this.browserId,
            event: event,
            data: data,
        });
    };
    /**
     * Builds a `CLISocket` if we are within a CLI-run environment; short-circuits
     * otherwise.
     *
     * @param {function(*, CLISocket)} done Node-style callback.
     */
    CLISocket.init = function (done) {
        var browserId = util.getParam('cli_browser_id');
        if (!browserId)
            return done();
        // Only fire up the socket for root runners.
        if (ChildRunner.current())
            return done();
        util.loadScript(SOCKETIO_LIBRARY, function (error) {
            if (error)
                return done(error);
            var socket = io(SOCKETIO_ENDPOINT);
            socket.on('error', function (error) {
                socket.off();
                done(error);
            });
            socket.on('connect', function () {
                socket.off();
                done(null, new CLISocket(browserId, socket));
            });
        });
    };
    return CLISocket;
}());
export default CLISocket;
// Misc Utility
/**
 * @param {!Mocha.Runnable} runnable The test or suite to extract titles from.
 * @return {!Array.<string>} The titles of the runnable and its parents.
 */
function getTitles(runnable) {
    var titles = [];
    while (runnable && !runnable.root && runnable.title) {
        titles.unshift(runnable.title);
        runnable = runnable.parent;
    }
    return titles;
}
/**
 * @param {!Mocha.Runnable} runnable
 * @return {string}
 */
function getState(runnable) {
    if (runnable.state === 'passed') {
        return 'passing';
    }
    else if (runnable.state === 'failed') {
        return 'failing';
    }
    else if (runnable.pending) {
        return 'pending';
    }
    else {
        return 'unknown';
    }
}