/*! vtkWeb/ParaViewWeb - v2.0 - 2013-10-11
* http://www.kitware.com/
* Copyright (c) 2013 Kitware; Licensed BSD */
/**
 * vtkWeb JavaScript Library.
 *
 * This main module just gathers all the modules into a single namespace.
 *
 * @class vtkWeb
 *
 * @mixins vtkWeb.launcher
 * @mixins vtkWeb.connect
 * @mixins vtkWeb.viewport
 * @mixins vtkWeb.viewport.image
 * @mixins vtkWeb.viewport.webgl
 * @mixins vtkWeb.ui.nv.utils
 * @singleton
 */
(function (GLOBAL, $) {

    // VERSION field that store the current version of the library.
    // WampSessions field used to store a map of the active sessions
    // Default Viewport options values
    var VERSION = "2.0.0",
    isMobile = (function(a){
        return (/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i).test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(a.substr(0,4));
    })(navigator.userAgent||navigator.vendor||window.opera), module = {};


    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Export internal methods to the vtkWeb module
    // ----------------------------------------------------------------------
    module.version = VERSION;
    module.isMobile = isMobile;
}(window, jQuery));
/**
 * vtkWeb JavaScript Library.
 *
 * This module allow the Web client to start a remote vtkWeb session and
 * retreive all the connection information needed to properly connect to that
 * newly created session.
 *
 * @class vtkWeb.launcher
 *
 * {@img vtkWeb/vtkWeb-multiuser.png alt Focus on the communication between the client and the front-end that manage the vtkWeb processes}
 */
(function (GLOBAL, $) {

    // Internal field used to store all connection objects
    var Connections = [], module = {}, console = GLOBAL.console;

    function generateSecretKey() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 10; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    /**
     * @class vtkWeb.ConnectionConfig
     * This class provides all the informations needed to connect to the session
     * manager web service.
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {String} sessionManagerURL
     * The service URL that will respond to the REST request to start or stop
     * a visualization session.
     *
     * MANDATORY
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {String} name
     * The name given for the visualization.
     *
     * RECOMMENDED/OPTIONAL
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {String} application
     * The name of the application that should be started on the server side.
     *
     * MANDATORY
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {String|Number} __Any_Name__
     * Any property that we want to provide to the session that will be created.
     * Such property is not necessary used by the session manager but will be
     * returned if a connection information is requested from a session.
     *
     * OPTIONAL
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {String} secret
     * Password that should be used to protect remote session access.
     *
     * This property is used by the launcher to secure the process that it start
     * but it is also used by the client to authenticate itself against
     * the remote process.
     *
     * This can be provided by the client or by the server depending who
     * generate it. In both case, the client will use it for its authentication.
     * If missing, then the client will use the default secret key.
     *
     * OPTIONAL
     */
    /**
     * @member vtkWeb.ConnectionConfig
     * @property {Number} generate-secret
     * Property used to specify where the generation of the secret key should be
     * made.
     * 0: We use the default secret key. (No dynamic one)
     * 1: The JavaScript client generate the key and its the responsability of
     *    the server to provide the generated key to the vtkWeb process.
     * 2: The launcher process generate that key when it start the vtkWeb
     *    process. That given secret key must be returned to the client within
     *    the connection object.
     *
     * OPTIONAL
     */

    //=========================================================================

    /**
     * @class vtkWeb.Connection
     * This class provides all the informations needed to connect to a running
     * visualization session.
     *
     * @mixins vtkWeb.ConnectionConfig
     */
    /**
     * @member vtkWeb.Connection
     * @property {String} sessionURL
     * The websocket URL that should be used to connect to the running
     * visualization session.
     */
    /**
     * @member vtkWeb.Connection
     * @property {String} id
     * The session identifier.
     */
    /**
     * @member vtkWeb.Connection
     * @property {vtkWeb.Session} session
     * The session object will be automatically added to the connection once the
     * connection is properly established by calling:
     *
     *     vtkWeb.connect(connection, success, error);
     */
    //=========================================================================

    /**
     * Start a new vtkWeb process on the server side.
     * This method will make a JSON POST request to config.sessionManagerURL URL.
     *
     * @member vtkWeb.launcher
     *
     * @param {vtkWeb.ConnectionConfig} config
     * Session creation parameters. (sessionManagerURL, name, application).
     *
     * @param {Function} successCallback
     * The function will be called once the connection is successfully performed.
     * The argument of the callback will be a {@link vtkWeb.Connection}.
     *
     * @param {Function} errorCallback
     * The function will be called if anything bad happened and an explanation
     * message will be provided as argument.
     */
    function start(config, successFunction, errorFunction) {
        if(!config.hasOwnProperty("secret") && config.hasOwnProperty("generate-secret") && config["generate-secret"] === 1) {
            config.secret = generateSecretKey();
        }
        var okCallback = successFunction,
        koCallback = errorFunction,
        arg = {
            url: config.sessionManagerURL,
            type: "POST",
            dataType: "json",
            data: (JSON.stringify(config)),
            success: function (reply) {
                Connections.push(reply);
                if (okCallback) {
                    okCallback(reply);
                }
            },
            error: function (errMsg) {
                if (koCallback) {
                    koCallback(errMsg);
                }
            }
        };
        return $.ajax(arg);
    }


    /**
     * Query the Session Manager in order to retreive connection informations
     * based on a session id.
     *
     * @member vtkWeb.launcher
     *
     * @param {String} sessionManagerURL
     * Same as ConnectionConfig.sessionManagerURL value.
     *
     * @param {String} sessionId
     * The unique identifier of a session.
     *
     * @return {vtkWeb.Connection} if the session is found.
     */
    function fetchConnection(sessionManagerURL, sessionId) {
        var config = {
            url: sessionManagerURL + '/' + sessionId,
            dataType: "json"
        };
        return $.ajax(config);
    }

    /**
     * Stop a remote running visualization session.
     *
     * @member vtkWeb.launcher
     *
     * @param {vtkWeb.ConnectionConfig} connection
     */
    function stop(connection) {
        var config = {
            url: connection.sessionManagerURL + "/" + connection.id,
            type: "DELETE",
            dataType: "json",
            success: function (reply) {
                console.log(reply);
            },
            error: function (errMsg) {
                console.log("Error while trying to close service");
            }
        };
        return $.ajax(config);
    }

    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Export internal methods to the vtkWeb module
    // ----------------------------------------------------------------------
    module.start = function (config, successFunction, errorFunction) {
        return start(config, successFunction, errorFunction);
    };
    module.stop = function (connection) {
        return stop(connection);
    };
    module.fetchConnection = function (serviceUrl, sessionId) {
        return fetchConnection(serviceUrl, sessionId);
    };
    /**
     * Return all the session connections created in that JavaScript context.
     * @member vtkWeb.launcher
     * @return {vtkWeb.Connection[]}
     */
    module.getConnections = function () {
        return Connections;
    };

}(window, jQuery));
/**
 * vtkWeb JavaScript Library.
 *
 * This module allow the Web client to connect to a remote vtkWeb session.
 * The session must already exist and waiting for connections.
 *
 * @class vtkWeb.connect
 *
 * {@img vtkWeb/vtkWeb-simple.png
 *  alt Focus on the communication between the client and the vtkWeb process}
 */
(function (GLOBAL, $) {

    // Connections field used to store a map of the active sessions
    var connections = {}, module = {};

    /**
     * @class vtkWeb.Session
     * vtkWeb Session object on which RPC method calls can be made.
     *
     *     session.call("vtk:render", request).then( function (reply) {
     *        // Do something with the reply
     *     });
     */
    /**
     * @member vtkWeb.Session
     * @method call
     * Returns a future of the RPC call.
     * @param {String} method
     * Full path method name.
     * @param {Object|String|Number} args
     * Arguments of the RPC call.
     *
     * @return {vtkWeb.Future} of the RPC call
     */
    /**
     * @class vtkWeb.Future
     * Object on which can be attached a callback.
     */
    /**
     * @member vtkWeb.Future
     * @method then
     * @param {Function} callback
     * Function to be called once the RPC called is done. The argument of the
     * function is the response of the RPC method.
     */


    /**
     * Connect to a running vtkWeb session
     *
     * @member vtkWeb.connect
     *
     * @param {vtkWeb.Connection} connection
     * A connection object that should have been generated by the Launcher
     * part if any.
     *
     *      connection = {
     *          sessionURL: "http://localhost:8080/ws"
     *      }
     *
     *      get extended to once the readyCallback get called:
     *
     *      connection = {
     *          sessionURL: "http://localhost:8080/ws",
     *          session: {vtkWeb.Session}
     *      }
     *
     *
     * @param {Function} readyCallback
     * Callback function called when a connection that has been extended with
     * a valid {@link vtkWeb.Session}.
     *
     * @param {Function} closeCallback
     * Callback function called when the session end.
     *
     *      vtkWeb.connect(
     *          connection,
     *          function(connection) {
     *             // Now that we have a valid session let's add a viewport to
     *             // see the 3D view of our vtkWeb pipeline.
     *             var viewport = vtkWeb.createViewport(connection.session);
     *             viewport.bind(".viewport-3d");
     *         },
     *         function(code,reason) {
     *             if (code == ab.CONNECTION_UNSUPPORTED) {
     *                  alert("Connection not supported");
     *              } else {
     *                  console.log(reason);
     *              }
     *          }
     *      );
     */
    function connect(connection, readyCallback, closeCallback) {
        var wsuri = connection.sessionURL, onReady = readyCallback, onClose = closeCallback;

        if(!connection.hasOwnProperty("secret")) {
            connection.secret = "vtkweb-secret"; // Default value
        }

        GLOBAL.ab.connect(wsuri, function (session) {
            try {
                session.authreq("vtkweb").then(function (challenge) {
                    // derive secret if salted WAMP-CRA
                    var secret = GLOBAL.ab.deriveKey(connection.secret, JSON.parse(challenge).authextra);
                    var signature = session.authsign(challenge, secret);

                    session.auth(signature).then(function(){
                        session.prefix("vtk", "http://vtk.org/vtk#");
                        session.prefix("event", "http://vtk.org/event#");
                        connection.session = session;
                        connections[connection.sessionURL] = connection;
                        if (onReady) {
                            onReady(connection);
                        }
                    }).otherwise(function(error){
                        alert("Authentication error");
                        GLOBAL.close();
                    });
                });
            } catch(e) {
                console.log(e);
            }
        }, function (code, reason) {
            delete connections[connection.sessionURL];
            if (onClose) {
                onClose(code, reason);
            }
        });
    }

    /**
     * Return any existing session for a given connection or Wamp URL
     *
     * @member vtkWeb.connect
     *
     * @param {String} sessionURL
     * The sessionURL String.
     *
     * @return {vtkWeb.Connection} that contains a {@link vtkWeb.Session}
     */
    function getConnection(sessionURL) {
        return connections[sessionURL];
    }

    /**
     * Return all the available connections stored in an Object like follow:
     *
     *     {
     *       "ws://localhost:8080/proxy?sessionId=2345": connection
     *     }
     *
     * {@link vtkWeb.Connection}
     *
     * @member vtkWeb.connect
     */
    function getConnections() {
        return connections;
    }


    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Export methods to the vtkWeb module
    // ----------------------------------------------------------------------
    module.connect = function (connection, ready, close) {
        connect(connection, ready, close);
    };
    module.getConnection = function (connection) {
        return getConnection(connection);
    };
    module.getConnections = function () {
        return getConnections();
    };
}(window, jQuery));
/**
 * vtkWeb JavaScript Library.
 *
 * This module allow the Web client to create viewport to vtkWeb views.
 * Those viewport are interactive windows that are used to render 2D/3D content
 * and response to user mouse interactions.
 *
 * @class vtkWeb.viewport
 */
(function (GLOBAL, $) {

    // ----------------------------------------------------------------------
    // Viewport constants
    // ----------------------------------------------------------------------

    var DEFAULT_RENDERERS_CONTAINER_HTML = "<div class='renderers'></div>",
    DEFAULT_RENDERERS_CONTAINER_CSS = {
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": "0px",
        "z-index" : "0",
        "overflow": "hidden"
    },

    DEFAULT_MOUSE_LISTENER_HTML = "<div class='mouse-listener'></div>",
    DEFAULT_MOUSE_LISTENER_CSS = {
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": "0px",
        "z-index" : "3"
    },

    DEFAULT_STATISTIC_HTML = "<div class='statistics'></div>",
    DEFAULT_STATISTIC_CSS = {
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": "0px",
        "z-index" : "2",
        "display" : "none"
    },

    module = {},

    /**
     * @class vtkWeb.ViewPortConfig
     * Configuration object used to create a viewport.
     */
    DEFAULT_VIEWPORT_OPTIONS = {
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {vtkWeb.Session} session
         * Object used to communicate with the remote server.
         *
         * Default: null but MUST BE OVERRIDE !!!
         */
        session: null,
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {Number} view
         * Specify the GlobalID of the view that we want to render. By default,
         * set to -1 to use the active view.
         *
         * Default: -1
         */
        view: -1,
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {Boolean} enableInteractions
         * Enable by default the user intaration but any mouse interaction can
         * be disable if needed.
         *
         * Default: true
         */
        enableInteractions: true,

        /**
         * @member vtkWeb.ViewPortConfig
         * @property {String} renderer
         * Name of the renderer to be used. Can only be 'image' or 'webgl'.
         *
         * Default: 'image'
         */
        renderer: 'image'
    };

    // ----------------------------------------------------------------------
    // Mouse interaction helper methods for viewport
    // ----------------------------------------------------------------------

    function preventDefault(event) {
        event.preventDefault();
    }

    // ----------------------------------------------------------------------

    function attachMouseListener(mouseListenerContainer, renderersContainer) {
        var current_button = null;

        // Internal method used to pre-process the interaction to standardise it
        // for a vtkWeb usage.
        function mouseInteraction(event) {
            if(event.hasOwnProperty("type")) {
                if(event.type === 'mouseup') {
                    current_button = null;
                    renderersContainer.trigger($.extend(event, {
                        type: 'mouse',
                        action: 'up',
                        current_button: current_button
                    }));
                } else if(event.type === 'mousedown') {
                    current_button = event.which;

                    // Override button if modifier is used
                    // Middle: Alt - Right: Shift
                    if(event.shiftKey) {
                        current_button = 3;
                        event.shiftKey = false;
                    } else if(event.altKey) {
                        current_button = 2;
                        event.altKey = false;
                    }

                    renderersContainer.trigger($.extend(event, {
                        type: 'mouse',
                        action: 'down',
                        current_button: current_button
                    }));
                } else if(event.type === 'mousemove' && current_button != null) {
                    renderersContainer.trigger($.extend(event, {
                        type: 'mouse',
                        action: 'move',
                        current_button: current_button
                    }));
                }
            }
        }

        // Bind listener to UI container
        mouseListenerContainer.bind("contextmenu mouseover click", preventDefault);
        mouseListenerContainer.bind('mousedown mouseup mousemove', mouseInteraction);
        mouseListenerContainer.dblclick(function(event){
            renderersContainer.trigger($.extend(event, {
                type: 'mouse',
                action: 'dblclick',
                current_button: event.which
            }));
        });
        mouseListenerContainer.bind("DOMMouseScroll mousewheel",function(event){
            var scrollValue = (event.originalEvent.wheelDeltaY || -event.originalEvent.detail);
            renderersContainer.trigger($.extend(event, {
                type: 'mouse',
                action: 'scroll',
                current_button: current_button,
                scroll: scrollValue
            }));
        });
    }

    // ----------------------------------------------------------------------

    function attachTouchListener(mouseListenerContainer, renderersContainer, viewport) {
        var current_button = null, posX, posY, defaultDragButton = 1,
        isZooming = false, isDragging = false, mouseAction = 'up', target;

        function mobileTouchInteraction(evt) {
            evt.gesture.preventDefault();
            switch(evt.type) {
                case 'drag':
                    if(isZooming) {
                        return;
                    }
                    current_button = defaultDragButton;
                    if(mouseAction === 'up') {
                        mouseAction = "down";

                        target = evt.gesture.target;
                        isDragging = true;
                    } else {
                        mouseAction = "move";
                    }

                    posX = evt.gesture.touches[0].pageX;
                    posY = evt.gesture.touches[0].pageY;
                    break;
                case 'hold':
                    if(defaultDragButton === 1) {
                        defaultDragButton = 2;
                        mouseListenerContainer.html("Pan mode").css('color','#FFFFFF');
                    } else {
                        defaultDragButton = 1;
                        mouseListenerContainer.html("Rotation mode").css('color','#FFFFFF');
                    }

                    break;
                case 'release':
                    mouseListenerContainer.html('');
                    current_button = 0;
                    mouseAction = "up";
                    isZooming = false;
                    isDragging = false;
                    break;
                case 'doubletap':
                    viewport.resetCamera();
                    return;
                case 'pinch':
                    if(isDragging) {
                        return;
                    }
                    current_button = 3;
                    if(mouseAction === 'up') {
                        mouseAction = 'down';
                        posX = 0;
                        posY = mouseListenerContainer.height();
                        target = evt.gesture.target;
                        isZooming = true;
                    } else {
                        mouseAction = 'move';
                        posY = mouseListenerContainer.height() * (1+(evt.gesture.scale-1)/2);
                    }
                    break;
            }

            //mouseListenerContainer.html(mouseAction + ' (' + posX + ', ' + posY + ') b:' + current_button + ' z: ' + isZooming ).css('color','#FFFFFF');

            // Trigger event
            renderersContainer.trigger({
                type: 'mouse',
                action: mouseAction,
                current_button: current_button,
                charCode: '',
                altKey: false,
                ctrlKey: false,
                shiftKey: false,
                metaKey: false,
                delegateTarget: target,
                pageX: posX,
                pageY: posY
            });
        }

        // Bind listener to UI container
        mouseListenerContainer.hammer({
            prevent_default : true,
            prevent_mouseevents : true,
            transform : true,
            transform_always_block : true,
            transform_min_scale : 0.03,
            transform_min_rotation : 2,
            drag : true,
            drag_max_touches : 1,
            drag_min_distance : 10,
            swipe : false,
            hold : true // To switch from rotation to pan
        }).on("doubletap pinch drag release hold", mobileTouchInteraction);
    }

    // ----------------------------------------------------------------------
    // Viewport statistic manager
    // ----------------------------------------------------------------------

    function createStatisticManager() {
        var statistics = {}, formatters = {};

        // Fill stat formatters
        for(var factoryKey in vtkWeb.ViewportFactory) {
            var factory = vtkWeb.ViewportFactory[factoryKey];
            if(factory.hasOwnProperty('stats')) {
                for(var key in factory.stats) {
                    formatters[key] =  factory.stats[key];
                }
            }
        }

        function handleEvent(event) {
            var id = event.stat_id,
            value = event.stat_value,
            statObject = null;

            if(!statistics.hasOwnProperty(id) && formatters.hasOwnProperty(id)) {
                if(formatters[id].type === 'time') {
                    statObject = statistics[id] = createTimeValueRecord();
                } else if (formatters[id].type === 'value') {
                    statObject = statistics[id] = createValueRecord();
                }
            } else {
                statObject = statistics[id];
            }

            if(statObject != null) {
                statObject.record(value);
            }
        }

        // ------------------------------------------------------------------

        function toHTML() {
            var buffer = createBuffer(), hasContent = false, key, formater, stat,
            min, max;

            // Extract stat data
            buffer.append("<table class='viewport-stat'>");
            buffer.append("<tr class='stat-header'><td class='label'></td><td class='value'>Current</td><td class='min'>Min</td><td class='max'>Max</td><td class='avg'>Average</td></tr>");
            for(key in statistics) {
                if(formatters.hasOwnProperty(key) && statistics[key].valid) {
                    formater = formatters[key];
                    stat = statistics[key];
                    hasContent = true;

                    // The functiion may swap the order
                    min = formater.convert(stat.min);
                    max = formater.convert(stat.max);

                    buffer.append("<tr><td class='label'>");
                    buffer.append(formater.label);
                    buffer.append("</td><td class='value'>");
                    buffer.append(formater.convert(stat.value));
                    buffer.append("</td><td class='min'>");
                    buffer.append((min < max) ? min : max);
                    buffer.append("</td><td class='max'>");
                    buffer.append((min > max) ? min : max);
                    buffer.append("</td><td class='avg'>");
                    buffer.append(formater.convert(stat.getAverageValue()));
                    buffer.append("</td></tr>");
                }
            }
            buffer.append("</table>");

            return hasContent ? buffer.toString() : "";
        }

        // ------------------------------------------------------------------

        return {
            eventHandler: handleEvent,
            toHTML: toHTML,
            reset: function() {
                statistics = {};
            }
        }
    }

    // ----------------------------------------------------------------------

    function createBuffer() {
        var idx = -1, buffer = [];
        return {
            clear: function(){
                idx = -1;
                buffer = [];
            },
            append: function(str) {
                buffer[++idx] = str;
                return this;
            },
            toString: function() {
                return buffer.join('');
            }
        };
    }

    // ----------------------------------------------------------------------

    function createTimeValueRecord() {
        var lastTime, sum, count;

        // Default values
        lastTime = 0;
        sum = 0;
        count = 0;

        return {
            value: 0.0,
            valid: false,
            min: +1000000000.0,
            max: -1000000000.0,

            record: function(v) {
                if(v === 0) {
                    this.start();
                } else if (v === 1) {
                    this.stop();
                }
            },

            start: function() {
                lastTime = new Date().getTime();
            },

            stop: function() {
                if(lastTime != 0) {
                    this.valid = true;
                    var time = new Date().getTime();
                    this.value = time - lastTime;
                    this.min = (this.min < this.value) ? this.min : this.value;
                    this.max = (this.max > this.value) ? this.max : this.value;
                    //
                    sum += this.value;
                    count++;
                }
            },

            reset: function() {
                count = 0;
                sum = 0;
                lastTime = 0;
                this.value = 0;
                this.min = +1000000000.0;
                this.max = -1000000000.0;
                this.valid = false;
            },

            getAverageValue: function() {
                if(count == 0) {
                    return 0;
                }
                return Math.floor(sum / count);
            }
        }
    }

    // ----------------------------------------------------------------------

    function createValueRecord() {
        var sum = 0, count = 0;

        return {
            value: 0.0,
            valid: false,
            min: +1000000000.0,
            max: -1000000000.0,

            record: function(v) {
                this.valid = true;
                this.value = v;
                this.min = (this.min < this.value) ? this.min : this.value;
                this.max = (this.max > this.value) ? this.max : this.value;
                //
                sum += this.value;
                count++;
            },

            reset: function() {
                count = 0;
                sum = 0;
                this.value = 0;
                this.min = +1000000000.0;
                this.max = -1000000000.0;
                this.valid = false;
            },

            getAverageValue: function() {
                if(count === 0) {
                    return 0;
                }
                return Math.floor(sum / count);
            }
        }
    }

    // ----------------------------------------------------------------------
    // Viewport container definition
    // ----------------------------------------------------------------------

    /**
     * Create a new viewport for a vtkWeb View.
     * The options are defined by {@link vtkWeb.ViewPortConfig}.
     *
     * @member vtkWeb.viewport
     * @param {vtkWeb.ViewPortConfig} options
     * Configure the viewport to create the way we want.
     *
     * @return {vtkWeb.Viewport}
     */
    function createViewport(options) {
        // Make sure we have a valid autobahn session
        if (options.session === null) {
            throw "'session' must be provided within the option.";
        }

        // Create viewport
        var config = $.extend({}, DEFAULT_VIEWPORT_OPTIONS, options),
        session = options.session,
        rendererContainer = $(DEFAULT_RENDERERS_CONTAINER_HTML).css(DEFAULT_RENDERERS_CONTAINER_CSS),
        mouseListener = $(DEFAULT_MOUSE_LISTENER_HTML).css(DEFAULT_MOUSE_LISTENER_CSS),
        statContainer = $(DEFAULT_STATISTIC_HTML).css(DEFAULT_STATISTIC_CSS),
        onDoneQueue = [],
        statisticManager = createStatisticManager(),
        viewport = {
            /**
             * Update the active renderer to be something else.
             * This allow the user to switch from Image Delivery to Geometry delivery
             * or even any other available renderer type available.
             *
             * The available renderers are indexed inside the following object vtkWeb.ViewportFactory.
             *
             * @member vtkWeb.Viewport
             * @param {String} rendererName
             * Key used to ID the renderer type.
             */
            setActiveRenderer: function(rendererName) {
                $('.' + rendererName, rendererContainer).addClass('active').show().siblings().removeClass('active').hide();
                rendererContainer.trigger('active');
                statContainer[0].innerHTML = '';
                statisticManager.reset();
            },

            /**
             * Method that should be called each time something in the scene as changed
             * and we want to update the viewport to reflect the latest state of the scene.
             *
             * @member vtkWeb.Viewport
             * @param {Function} ondone Function to call after rendering is complete.
             */
            invalidateScene: function(onDone) {
                onDoneQueue.push(onDone);
                rendererContainer.trigger('invalidateScene');
            },

            /**
             * Method that should be called when nothing has changed in the scene
             * but for some reason the viewport has been dirty.
             * (i.e. Toggeling the statistic information within the viewport)
             *
             * @member vtkWeb.Viewport
             * @param {Function} ondone Function to call after rendering is complete.
             */
            render: function(onDone, args) {
                onDoneQueue.push(onDone);
                rendererContainer.trigger({type: 'render', options: args});
            },

            /**
             * Reset the camera of the scene to make it fit in the screen as well
             * as invalidating the scene automatically.
             *
             * @member vtkWeb.Viewport
             * @param {Function} ondone Function to call after rendering is complete.
             */
            resetCamera: function(onDone) {
                onDoneQueue.push(onDone);
                return session.call("vtk:resetCamera", Number(config.view)).then(function () {
                    rendererContainer.trigger('invalidateScene');
                });
            },

            /**
             * Update Orientation Axes Visibility for the given view
             *
             * @member vtkWeb.Viewport
             * @param {Boolean} show
             * Show: true / Hide: false
             * @param {Function} ondone Function to call after rendering is complete.
             */
            updateOrientationAxesVisibility: function (show, onDone) {
                return session.call("vtk:updateOrientationAxesVisibility", Number(config.view), show).then(function () {
                    onDoneQueue.push(onDone);
                    rendererContainer.trigger('invalidateScene');
                });
            },

            /**
             * Update the Center Axes Visibility for the given view
             *
             * @member vtkWeb.Viewport
             * @param {Boolean} show
             * Show: true / Hide: false
             * @param {Function} ondone Function to call after rendering is complete.
             */
            updateCenterAxesVisibility: function (show, onDone) {
                return session.call("vtk:updateCenterAxesVisibility", Number(config.view), show).then(function () {
                    onDoneQueue.push(onDone);
                    rendererContainer.trigger('invalidateScene');
                });
            },

            /**
             * Reset view id.
             * This allow to invalidate the viewport and use the new active view
             *
             * @member vtkWeb.Viewport
             */
            resetViewId: function () {
                rendererContainer.trigger('resetViewId');
            },

            /**
             * Attach viewport to a DOM element
             *
             * @member vtkWeb.Viewport
             * @param {String} selector
             * The will be used internally to get the jQuery associated element
             *
             *     <div class="renderer"></div>
             *     viewport.bind(".renderer");
             *
             *     <div id="renderer"></div>
             *     viewport.bind("#renderer");
             *
             *     <html>
             *       <body>
             *         <!-- renderer -->
             *         <div></div>
             *       </body>
             *     </html>
             *     viewport.bind("body > div");
             */
            bind: function (selector) {
                var container = $(selector);
                if (container.attr("__vtkWeb_viewport__") !== "true") {
                    container.attr("__vtkWeb_viewport__", "true");
                    container.append(rendererContainer).append(mouseListener).append(statContainer);
                    rendererContainer.trigger('invalidateScene');
                }
            },

            /**
             * Remove viewport from DOM element
             *
             * @member vtkWeb.Viewport
             */
            unbind: function () {
                var parentElement = rendererContainer.parent();
                if (parentElement) {
                    parentElement.attr("__vtkWeb_viewport__", "false");
                    rendererContainer.remove();
                    mouseListener.remove();
                    statContainer.remove();
                }
            },

            /**
             * Update statistic visibility
             *
             * @member vtkWeb.Viewport
             * @param {Boolean} visible
             */
            showStatistics: function(isVisible) {
                if(isVisible) {
                    statContainer.show();
                } else {
                    statContainer.hide();
                }
            },

            /**
             * Clear current statistic values
             *
             * @member vtkWeb.Viewport
             */
            resetStatistics: function() {
                statisticManager.reset();
                statContainer.empty();
            }
        };

        // Attach config object to renderer parent
        rendererContainer.data('config', config);

        // Attach onDone listener
        rendererContainer.bind('done', function(){
            while(onDoneQueue.length > 0) {
                var callback = onDoneQueue.pop();
                try {
                    if(callback) {
                        callback();
                    }
                } catch(error) {
                    console.log("On Done callback error:");
                    console.log(error);
                }
            }
        });

        // Create any renderer type that is available
        for(var key in vtkWeb.ViewportFactory) {
            try {
                vtkWeb.ViewportFactory[key].builder(rendererContainer);
            } catch(error) {
                console.log("Error while trying to load renderer: " + key);
                console.log(error);
            }
        }

        // Set default renderer
        viewport.setActiveRenderer(config.renderer);

        // Attach mouse listener if requested
        if (config.enableInteractions) {
            attachMouseListener(mouseListener, rendererContainer);
            try {
                attachTouchListener(mouseListener, rendererContainer, viewport);
            } catch(error) {
                console.log('Hammer is not properly initialized');
                console.log(error);
            }
        }

        // Attach stat listener
        rendererContainer.bind('stats', function(event){
            statisticManager.eventHandler(event);
            statContainer[0].innerHTML = statisticManager.toHTML();
        });

        return viewport;
    }

    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Export internal methods to the vtkWeb module
    // ----------------------------------------------------------------------
    module.createViewport = function (option) {
        return createViewport(option);
    };
}(window, jQuery));
/**
 * vtkWeb JavaScript Library.
 *
 * This module extend the vtkWeb viewport to add support for Image delivery
 * mechanism for rendering.
 *
 * @class vtkWeb.viewport.image
 *
 *     Viewport Factory description:
 *       - Key: image
 *       - Stats:
 *         - image-fps
 *         - image-round-trip
 *         - image-server-processing
 */
(function (GLOBAL, $) {
    var module = {},
    RENDERER_CSS = {
        "position": "absolute",
        "top": "0px",
        "left": "0px",
        "right": "0px",
        "bottom": "0px",
        "z-index" : "0"
    },
    DEFAULT_OPTIONS = {
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {Number} interactiveQuality
         * Compression quality that should be used to encode the image on the
         * server side while interacting.
         *
         * Default: 30
         */
        interactiveQuality: 30,
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {Number} stillQuality
         * Compression quality that should be used to encode the image on the
         * server side when we stoped interacting.
         *
         * Default: 100
         */
        stillQuality: 100
    },
    FACTORY_KEY = 'image',
    FACTORY = {
        'builder': createImageDeliveryRenderer,
        'options': DEFAULT_OPTIONS,
        'stats': {
            'image-fps': {
                label: 'Framerate:',
                type: 'time',
                convert: function(value) {
                    if(value === 0) {
                        return 0;
                    }
                    return Math.floor(1000 / value);
                }
            },
            'image-round-trip': {
                label: 'Round&nbsp;trip&nbsp;(ms):',
                type: 'value',
                convert: NoOp
            },
            'image-server-processing': {
                label: 'Processing&nbsp;Time&nbsp;(ms):',
                type: 'value',
                convert: NoOp
            }
        }
    };

    // ----------------------------------------------------------------------

    function NoOp(a) {
        return a;
    }

    // ----------------------------------------------------------------------
    // Image Delivery renderer - factory method
    // ----------------------------------------------------------------------

    function createImageDeliveryRenderer(domElement) {
        var container = $(domElement),
        options = $.extend({}, DEFAULT_OPTIONS, container.data('config')),
        bgImage = new Image(),
        session = options.session,
        canvas = GLOBAL.document.createElement('canvas'),
        ctx2d = canvas.getContext('2d'),
        renderer = $(canvas).addClass(FACTORY_KEY).css(RENDERER_CSS).append(bgImage),
        force_render = false,
        statistics = null,
        lastMTime = 0,
        render_onidle_timeout = null,
        action_pending = false,
        button_state = {
            left : false,
            right: false,
            middle : false
        },
        quality = 100;

        // ----
        /// Internal method that returns true if the mouse interaction event should be
        /// throttled.
        function eatMouseEvent(event) {
            var force_event = (button_state.left !== event.buttonLeft || button_state.right  !== event.buttonRight || button_state.middle !== event.buttonMiddle);
            if (!force_event && !event.buttonLeft && !event.buttonRight && !event.buttonMiddle && !event.scroll) {
                return true;
            }
            if (!force_event && action_pending) {
                return true;
            }
            button_state.left   = event.buttonLeft;
            button_state.right  = event.buttonRight;
            button_state.middle = event.buttonMiddle;
            return false;
        }

        //-----
        // Internal function that requests a render on idle. Calling this
        // mutliple times will only result in the request being set once.
        function renderOnIdle() {
            if (render_onidle_timeout === null) {
                render_onidle_timeout = GLOBAL.setTimeout(render, 250);
            }
        }

        // Setup internal API
        function render(fetch) {
            if (force_render === false) {
                if (render_onidle_timeout !== null) {
                    // clear any renderOnIdle requests that are pending since we
                    // are sending a render request.
                    GLOBAL.clearTimeout(render_onidle_timeout);
                    render_onidle_timeout = null;
                }
                force_render = true;
                /**
                 * @class request.Render
                 * Container Object that provide all the input needed to request
                 * a rendering from the server side.
                 *
                 *      {
                 *        size: [width, height], // Size of the image to generate
                 *        view: 234523,          // View proxy globalId
                 *        mtime: 23423456,       // Last Modified time image received
                 *        quality: 100,          // Image quality expected
                 *        localtime: 3563456     // Local time at sending for round trip computation statistic
                 *      }
                 */
                var renderCfg = {
                    /**
                     * @member request.Render
                     * @property {Array} size
                     * Size of the Viewport for which the image should be render
                     * for. [width, height] in pixel.
                     */
                    size: [ container.innerWidth(), container.innerHeight() ],
                    /**
                     * @member request.Render
                     * @property {Number} view
                     * GlobalID of the view Proxy.
                     */
                    view: Number(options.view),
                    /**
                     * @member request.Render
                     * @property {Number} MTime
                     * Last received image MTime.
                     */
                    mtime: fetch ? 0 : lastMTime,
                    /**
                     * @member request.Render
                     * @property {Number} quality
                     * Image compression quality.
                     * -   0: Looks Bad but small in size.
                     * - 100: Looks good bug big in size.
                     */
                    quality: quality,
                    /**
                     * @property {Number} localTime
                     * Local client time used to compute the round trip time cost.
                     * Equals to new Date().getTime().
                     */
                    localTime : new Date().getTime()
                };

                container.trigger({
                    type: 'stats',
                    stat_id: 'image-fps',
                    stat_value: 0 // start
                });

                session.call("vtk:stillRender", renderCfg).then(function (res) {
                    /**
                     * @class reply.Render
                     * Object returned from the server as a response to a
                     * stillRender request. It includes information about the
                     * rendered image along with the rendered image itself.
                     *
                     *    {
                     *       image     : "sdfgsdfg/==",      // Image encoding in a String
                     *       size      : [width, height],    // Image size
                     *       format    : "jpeg;base64",      // Image type + encoding
                     *       global_id : 234652436,          // View Proxy ID
                     *       stale     : false,              // Image is stale
                     *       mtime     : 23456345,           // Image MTime
                     *       localTime : 3563456,            // Value provided at request
                     *       workTime  : 10                  // Number of ms that were needed for the processing
                     *    }
                     */
                    /**
                     * @member reply.Render
                     * @property {String} image
                     * Rendered image content encoded as a String.
                     */
                    /**
                     * @member reply.Render
                     * @property {Array} size
                     * Size of the rendered image (width, height).
                     */
                    /**
                     * @member reply.Render
                     * @property {String} format
                     * String indicating the format and encoding for the image
                     * e.g. "jpeg;base64" or "png;base64".
                     */
                    /**
                     * @member reply.Render
                     * @property {Number} global_id
                     * GlobalID of the view proxy from which the image is
                     * obtained.
                     */
                    /**
                     * @member reply.Render
                     * @property {Boolean} stale
                     * For better frame-rates when interacting, vtkWeb may
                     * return a stale rendered image, while the newly rendered
                     * image is being processed. This flag indicates that a new
                     * rendering for this view is currently being processed on
                     * the server.
                     */
                    /**
                     * @member reply.Render
                     * @property {Number} mtime
                     * Timestamp of the generated image. This is used to prevent
                     * a redelivery of the same image.
                     */
                    /**
                     * @member reply.Render
                     * @property {Number} localTime
                     * Unchanged value that was in the request. This will help
                     * to compute round trip cost.
                     */
                    /**
                     * @member reply.Render
                     * @property {Number} workTime
                     * Delta time that was needed on the server side to handle
                     * the request. This does not include the json parsing.
                     * Just the high level opeartion achieved by vtkWeb.
                     */
                    options.view = Number(res.global_id);
                    lastMTime = res.mtime;
                    if(res.hasOwnProperty("image") && res.image !== null) {
                        /**
                         * @member vtkWeb.Viewport
                         * @event start-loading
                         */

                        $(container).parent().trigger("start-loading");
                        bgImage.width  = res.size[0];
                        bgImage.height = res.size[1];
                        var previousSrc = bgImage.src;
                        bgImage.src = "data:image/" + res.format  + "," + res.image;

                        container.trigger({
                            type: 'stats',
                            stat_id: 'image-fps',
                            stat_value: 1 // stop
                        });

                        container.trigger({
                            type: 'stats',
                            stat_id: 'image-round-trip',
                            stat_value: Number(new Date().getTime() - res.localTime) - res.workTime
                        });

                        container.trigger({
                            type: 'stats',
                            stat_id: 'image-server-processing',
                            stat_value: Number(res.workTime)
                        });
                    }
                    renderStatistics();
                    force_render = false;
                    container.trigger('done');

                    // the image we received is not the latest, we should
                    // request another render to try to get the latest image.
                    if (res.stale === true) {
                        renderOnIdle();
                    }
                });
            }
        }

        // internal function to render stats.
        function renderStatistics() {
            if (statistics) {
                ctx2d.font = "bold 12px sans-serif";
                //ctx2d.fillStyle = "white";
                ctx2d.fillStyle = "black";
                ctx2d.fillRect(10, 10, 240, 100);
                //ctx2d.fillStyle = "black";
                ctx2d.fillStyle = "white";
                ctx2d.fillText("Frame Rate: " + statistics.frameRate().toFixed(2), 15, 25);
                ctx2d.fillText("Average Frame Rate: " + statistics.averageFrameRate().toFixed(2),
                    15, 40);
                ctx2d.fillText("Round trip: " + statistics.roundTrip() + " ms - Max: " + statistics.maxRoundTrip() + " ms",
                    15, 55);
                ctx2d.fillText("Server work time: " + statistics.serverWorkTime() + " ms - Max: " + statistics.maxServerWorkTime() + " ms",
                    15, 70);
                ctx2d.fillText("Minimum Frame Rate: " + statistics.minFrameRate().toFixed(2),
                    15, 85);
                ctx2d.fillText("Loading time: " + statistics.trueLoadTime(),
                    15, 100);
            }
        }

        // Choose if rendering is happening in Canvas or image
        bgImage.onload = function(){
            paint();
        };

        // internal function used to draw update data on the canvas. When not
        // using canvas, this has no effect.
        function paint() {
            /**
             * @member vtkWeb.Viewport
             * @event stop-loading
             */
            $(container).parent().trigger("stop-loading");
            ctx2d.canvas.width = $(container).width();
            ctx2d.canvas.height = $(container).height();
            ctx2d.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);
            renderStatistics();
        }

        // Attach listener to container for mouse interaction and invalidateScene
        container.bind('invalidateScene', function() {
            if(renderer.hasClass('active')){
                render(true);
            }
        }).bind('resetViewId', function(e){
            options.view = -1;
        }).bind('render', function(e){
            if(renderer.hasClass('active')){
                var opts = e.options,
                previousQuality = quality,
                forceRender = false;

                if(opts) {
                    quality = opts.hasOwnProperty('quality') ? opts.quality : quality;
                    options.view = opts.hasOwnProperty('view') ? opts.view : options.view;
                    forceRender = opts.hasOwnProperty('forceRender');
                }

                render(forceRender);

                // Revert back to previous state
                quality = previousQuality;
            }
        }).bind('mouse', function(evt){
            if(renderer.hasClass('active')){
                // stop default event handling by the browser.
                evt.preventDefault();

                // Update quality based on the type of the event
                if(evt.action === 'up' || evt.action === 'dblclick' || evt.action === 'scroll') {
                    quality = options.stillQuality;
                } else {
                    quality = options.interactiveQuality;
                }

                /**
                 * @class request.InteractionEvent
                 * Container Object used to encapsulate MouseEvent status
                 * formated in an handy manner for vtkWeb.
                 *
                 *     {
                 *       view         : 23452345, // View proxy globalId
                 *       action       : "down",   // Enum["down", "up", "move"]
                 *       charCode     : "",       // In key press will hold the char value
                 *       altKey       : false,    // Is alt Key down ?
                 *       ctrlKey      : false,    // Is ctrl Key down ?
                 *       shiftKey     : false,    // Is shift Key down ?
                 *       metaKey      : false,    // Is meta Key down ?
                 *       buttonLeft   : false,    // Is button Left down ?
                 *       buttonMiddle : false,    // Is button Middle down ?
                 *       buttonRight  : false,    // Is button Right down ?
                 *     }
                 */
                var vtkWeb_event = {
                    /**
                     * @member request.InteractionEvent
                     * @property {Number}  view Proxy global ID
                     */
                    view: Number(options.view),
                    /**
                     * @member request.InteractionEvent
                     * @property {String}  action
                     * Type of mouse action and can only be one of:
                     *
                     * - down
                     * - up
                     * - move
                     * - dblclick
                     * - scroll
                     */
                    action: evt.action,
                    /**
                     * @member request.InteractionEvent
                     * @property {String}  charCode
                     */
                    charCode: evt.charCode,
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} altKey
                     */
                    altKey: evt.altKey,
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} ctrlKey
                     */
                    ctrlKey: evt.ctrlKey,
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} shiftKey
                     */
                    shiftKey: evt.shiftKey,
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} metaKey
                     */
                    metaKey: evt.metaKey,
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} buttonLeft
                     */
                    buttonLeft: (evt.current_button === 1 ? true : false),
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} buttonMiddle
                     */
                    buttonMiddle: (evt.current_button === 2 ? true : false),
                    /**
                     * @member request.InteractionEvent
                     * @property {Boolean} buttonRight
                     */
                    buttonRight: (evt.current_button === 3 ? true : false)
                },
                elem_position = $(evt.delegateTarget).offset(),
                pointer = {
                    x : (evt.pageX - elem_position.left),
                    y : (evt.pageY - elem_position.top)
                };

                if(evt.action === 'scroll') {
                    vtkWeb_event.scroll = evt.scroll;
                } else {
                    vtkWeb_event.x = pointer.x / renderer.width();
                    vtkWeb_event.y = 1.0 - (pointer.y / renderer.height());
                }

                if (eatMouseEvent(vtkWeb_event)) {
                    return;
                }

                action_pending = true;
                session.call("vtk:mouseInteraction", vtkWeb_event).then(function (res) {
                    if (res) {
                        action_pending = false;
                        render();
                    }
                });
            }
        }).append(renderer);
    }

    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Extend the viewport factory
    // ----------------------------------------------------------------------
    if(!module.hasOwnProperty('ViewportFactory')) {
        module['ViewportFactory'] = {};
    }
    module.ViewportFactory[FACTORY_KEY] = FACTORY;

}(window, jQuery));
/**
 * vtkWeb JavaScript Library.
 *
 * This module extend the vtkWeb viewport to add support for WebGL rendering.
 *
 * @class vtkWeb.viewport.webgl
 *
 *     Viewport Factory description:
 *       - Key: webgl
 *       - Stats:
 *         - webgl-fps
 *         - webgl-nb-objects
 *         - webgl-fetch-scene
 *         - webgl-fetch-object
 */
(function (GLOBAL, $) {
    var module = {},
    RENDERER_CSS = {
        "position": "absolute",
        "top"     : "0px",
        "left"    : "0px",
        "right"   : "0px",
        "bottom"  : "0px",
        "z-index" : "0"
    },
    RENDERER_CSS_2D = {
        "z-index" : "1"
    },
    RENDERER_CSS_3D = {
        "z-index" : "0"
    },
    DEFAULT_OPTIONS = {
        /**
         * @member vtkWeb.ViewPortConfig
         * @property {Boolean} keepServerInSynch
         * This will force network communication to the server to update the
         * camera position on the server as well.
         * This is useful when collaboration is involved and several users
         * are looking at the same scene.
         *
         * Default: false
         */
        keepServerInSynch: false
    },
    FACTORY_KEY = 'webgl',
    FACTORY = {
        'builder': createGeometryDeliveryRenderer,
        'options': DEFAULT_OPTIONS,
        'stats': {
            'webgl-fps': {
                label: 'Framerate:',
                type: 'time',
                convert: function(value) {
                    if(value === 0) {
                        return 0;
                    }
                    return Math.floor(1000 / value);
                }
            },
            'webgl-nb-objects': {
                label: 'Number&nbsp;of&nbsp;3D&nbsp;objects:',
                type: 'value',
                convert: NoOp
            },
            'webgl-fetch-scene': {
                label: 'Fetch&nbsp;scene&nbsp;(ms):',
                type: 'time',
                convert: NoOp
            },
            'webgl-fetch-object': {
                label: 'Fetch&nbsp;object&nbsp;(ms):',
                type: 'time',
                convert: NoOp
            }
        }
    },
    DEFAULT_SHADERS = {},
    mvMatrixStack = [];


    // ----------------------------------------------------------------------

    function NoOp(a) {
        return a;
    }

    // ----------------------------------------------------------------------
    // Initialize the Shaders
    // ----------------------------------------------------------------------

    DEFAULT_SHADERS["shader-fs"] = {
        type: "x-shader/x-fragment",
        code: "\
            #ifdef GL_ES\n\
            precision highp float;\n\
            #endif\n\
            uniform bool uIsLine;\
            varying vec4 vColor;\
            varying vec4 vTransformedNormal;\
            varying vec4 vPosition;\
            void main(void) {\
                float directionalLightWeighting1 = max(dot(normalize(vTransformedNormal.xyz), vec3(0.0, 0.0, 1.0)), 0.0); \
                float directionalLightWeighting2 = max(dot(normalize(vTransformedNormal.xyz), vec3(0.0, 0.0, -1.0)), 0.0);\
                vec3 lightWeighting = max(vec3(1.0, 1.0, 1.0) * directionalLightWeighting1, vec3(1.0, 1.0, 1.0) * directionalLightWeighting2);\
                if (uIsLine == false){\
                  gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);\
                } else {\
                  gl_FragColor = vColor*vec4(1.0, 1.0, 1.0, 1.0);\
                }\
            }"
    };

    // ----------------------------------------------------------------------

    DEFAULT_SHADERS["shader-vs"] = {
        type: "x-shader/x-vertex",
        code: "\
            attribute vec3 aVertexPosition;\
            attribute vec4 aVertexColor;\
            attribute vec3 aVertexNormal;\
            uniform mat4 uMVMatrix;\
            uniform mat4 uPMatrix;\
            uniform mat4 uNMatrix;\
            varying vec4 vColor;\
            varying vec4 vPosition;\
            varying vec4 vTransformedNormal;\
            void main(void) {\
                vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);\
                gl_Position = uPMatrix * vPosition;\
                vTransformedNormal = uNMatrix * vec4(aVertexNormal, 1.0);\
                vColor = aVertexColor;\
            }"
    };

    // ----------------------------------------------------------------------

    DEFAULT_SHADERS["shader-fs-Point"] = {
        type: "x-shader/x-fragment",
        code: "\
            #ifdef GL_ES\n\
            precision highp float;\n\
            #endif\n\
            varying vec4 vColor;\
            void main(void) {\
                gl_FragColor = vColor;\
            }"
    };

    // ----------------------------------------------------------------------

    DEFAULT_SHADERS["shader-vs-Point"] = {
        type: "x-shader/x-vertex",
        code: "\
            attribute vec3 aVertexPosition;\
            attribute vec4 aVertexColor;\
            uniform mat4 uMVMatrix;\
            uniform mat4 uPMatrix;\
            uniform mat4 uNMatrix;\
            uniform float uPointSize;\
            varying vec4 vColor;\
            void main(void) {\
                vec4 pos = uMVMatrix * vec4(aVertexPosition, 1.0);\
                gl_Position = uPMatrix * pos;\
                vColor = aVertexColor*vec4(1.0, 1.0, 1.0, 1.0);\
                gl_PointSize = uPointSize;\
            }"
    };

    // ----------------------------------------------------------------------

    function getShader(gl, id) {
        try {
            var jsonShader = DEFAULT_SHADERS[id], shader = null;

            // Allocate shader
            if(jsonShader.type === "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if(jsonShader.type === "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }

            // Set code and compile
            gl.shaderSource(shader, jsonShader.code);
            gl.compileShader(shader);

            // Check compilation
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function initializeShader(gl, shaderProgram, pointShaderProgram) {
        try {

            var vertexShader = getShader(gl, 'shader-vs'),
            fragmentShader   = getShader(gl, 'shader-fs'),
            pointFragShader  = getShader(gl, 'shader-fs-Point'),
            pointVertShader  = getShader(gl, 'shader-vs-Point');

            // Initialize program
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }

            gl.attachShader(pointShaderProgram, pointVertShader);
            gl.attachShader(pointShaderProgram, pointFragShader);
            gl.linkProgram(pointShaderProgram);
            if (!gl.getProgramParameter(pointShaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise the point shaders");
            }

            gl.useProgram(pointShaderProgram);
            pointShaderProgram.vertexPositionAttribute = gl.getAttribLocation(pointShaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(pointShaderProgram.vertexPositionAttribute);
            pointShaderProgram.vertexColorAttribute = gl.getAttribLocation(pointShaderProgram, "aVertexColor");
            gl.enableVertexAttribArray(pointShaderProgram.vertexColorAttribute);
            pointShaderProgram.pMatrixUniform = gl.getUniformLocation(pointShaderProgram, "uPMatrix");
            pointShaderProgram.mvMatrixUniform = gl.getUniformLocation(pointShaderProgram, "uMVMatrix");
            pointShaderProgram.nMatrixUniform = gl.getUniformLocation(pointShaderProgram, "uNMatrix");
            pointShaderProgram.uPointSize = gl.getUniformLocation(pointShaderProgram, "uPointSize");

            gl.useProgram(shaderProgram);
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
            shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
            gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
            shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
            gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
            shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
            shaderProgram.uIsLine = gl.getUniformLocation(shaderProgram, "uIsLine");
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------
    // GL rendering metods
    // ----------------------------------------------------------------------

    function setMatrixUniforms(gl, shaderProgram, projMatrix, mvMatrix) {
        var mvMatrixInv = mat4.create(), normal = mat4.create();

        mat4.invert(mvMatrixInv, mvMatrix);
        mat4.transpose(normal, mvMatrixInv);

        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, projMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        if(shaderProgram.nMatrixUniform != null) gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, normal);
    }

    // ----------------------------------------------------------------------

    function renderMesh(renderingContext, camera) {
        try {
            var obj = this,
            mvMatrix = mat4.clone(camera.getCameraMatrices()[1]),
            projMatrix = mat4.clone(camera.getCameraMatrices()[0]),
            objMatrix = mat4.transpose(mat4.create(), obj.matrix),
            gl = renderingContext.gl,
            shaderProgram = renderingContext.shaderProgram;

            gl.useProgram(shaderProgram);
            gl.uniform1i(shaderProgram.uIsLine, false);

            mvMatrix = mat4.multiply(mvMatrix, mvMatrix, objMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, obj.vbuff);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obj.vbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.nbuff);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, obj.nbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, obj.cbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.ibuff);

            setMatrixUniforms(gl, shaderProgram, projMatrix, mvMatrix);

            gl.drawElements(gl.TRIANGLES, obj.numberOfIndex, gl.UNSIGNED_SHORT, 0);
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function renderLine(renderingContext, camera) {
        try {
            var obj = this,
            mvMatrix = mat4.clone(camera.getCameraMatrices()[1]),
            projMatrix = mat4.clone(camera.getCameraMatrices()[0]),
            objMatrix = mat4.transpose(mat4.create(), obj.matrix),
            gl = renderingContext.gl,
            shaderProgram = renderingContext.shaderProgram;

            gl.useProgram(shaderProgram);

            gl.enable(gl.POLYGON_OFFSET_FILL);  //Avoid zfighting
            gl.polygonOffset(-1.0, -1.0);

            gl.uniform1i(shaderProgram.uIsLine, true);

            mvMatrix = mat4.multiply(mvMatrix, mvMatrix, objMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, obj.lbuff);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obj.lbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.nbuff);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, obj.nbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, obj.cbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.ibuff);

            setMatrixUniforms(gl, shaderProgram, projMatrix, mvMatrix);

            gl.drawElements(gl.LINES, obj.numberOfIndex, gl.UNSIGNED_SHORT, 0);

            gl.disable(gl.POLYGON_OFFSET_FILL);
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function renderPoints(renderingContext, camera) {
        try {
            var obj = this,
            mvMatrix = mat4.clone(camera.getCameraMatrices()[1]),
            projMatrix = mat4.clone(camera.getCameraMatrices()[0]),
            objMatrix = mat4.transpose(mat4.create(), obj.matrix),
            gl = renderingContext.gl,
            pointShaderProgram = renderingContext.pointShaderProgram;

            gl.useProgram(pointShaderProgram);

            gl.enable(gl.POLYGON_OFFSET_FILL);  //Avoid zfighting
            gl.polygonOffset(-1.0, -1.0);

            gl.uniform1f(pointShaderProgram.uPointSize, 2.0);

            mvMatrix = mat4.multiply(mvMatrix, mvMatrix, objMatrix);

            gl.bindBuffer(gl.ARRAY_BUFFER, obj.pbuff);
            gl.vertexAttribPointer(pointShaderProgram.vertexPositionAttribute, obj.pbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.vertexAttribPointer(pointShaderProgram.vertexColorAttribute, obj.cbuff.itemSize, gl.FLOAT, false, 0, 0);

            setMatrixUniforms(gl, pointShaderProgram, projMatrix, mvMatrix);

            gl.drawArrays(gl.POINTS, 0, obj.numberOfPoints);

            gl.disable(gl.POLYGON_OFFSET_FILL);
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function renderColorMap(renderingContext, camera) {
        try {
            var obj = this, ctx = renderingContext.ctx2d, range, txt, color, c, v,
            size, pos, dx, dy, realSize, textSizeX, textSizeY, grad,
            width = renderingContext.container.width(),
            height = renderingContext.container.height();

            range = [obj.colors[0][0], obj.colors[obj.colors.length-1][0]];
            size = [obj.size[0]*width, obj.size[1]*height];
            pos = [obj.position[0]*width, (1-obj.position[1])*height];
            pos[1] = pos[1]-size[1];
            dx = size[0]/size[1];
            dy = size[1]/size[0];
            realSize = size;

            textSizeX = Math.round(height/35);
            textSizeY = Math.round(height/23);
            if (obj.orientation == 1){
                size[0] = size[0]*dy/25;
                size[1] = size[1]-(2*textSizeY);
            } else {
                size[0] = size[0];
                size[1] = size[1]*dx/25;
            }

            // Draw Gradient
            if(obj.orientation == 1){
                pos[1] += 2*textSizeY;
                grad = ctx.createLinearGradient(pos[0], pos[1], pos[0], pos[1]+size[1]);
            } else {
                pos[1] += 2*textSizeY;
                grad = ctx.createLinearGradient(pos[0], pos[1], pos[0]+size[0], pos[1]);
            }
            if ((range[1]-range[0]) == 0){
                color = 'rgba(' + obj.colors[0][1] + ',' + obj.colors[0][2] + ',' + obj.colors[0][3] + ',1)';
                grad.addColorStop(0, color);
                grad.addColorStop(1, color);
            } else {
                for(c=0; c<obj.colors.length; c++){
                    v = ((obj.colors[c][0]-range[0])/(range[1]-range[0]));
                    if (obj.orientation == 1) v=1-v;
                    color = 'rgba(' + obj.colors[c][1] + ',' + obj.colors[c][2] + ',' + obj.colors[c][3] + ',1)';
                    grad.addColorStop(v, color);
                }
            }
            ctx.fillStyle = grad;
            ctx.fillRect(pos[0], pos[1], size[0], size[1]);
            // Draw Range Labels
            range[0] = Math.round(range[0]*1000)/1000;
            range[1] = Math.round(range[1]*1000)/1000;
            ctx.fillStyle = 'white';
            ctx.font = textSizeY + 'px sans-serif';
            ctx.txtBaseline = 'ideographic';
            if (obj.orientation == 1){
                ctx.fillText(range[1], pos[0], pos[1]-5);
                ctx.fillText(range[0], pos[0], pos[1]+size[1]+textSizeY);
            } else {
                ctx.fillText(range[0], pos[0], pos[1]+size[1]+textSizeY);
                txt = range[1].toString();
                ctx.fillText(range[1], pos[0]+size[0]-((txt.length-1)*textSizeX), pos[1]+size[1]+textSizeY);
            }
            // Draw Title
            ctx.fillStyle = 'white';
            ctx.font = textSizeY + 'px sans-serif';
            ctx.txtBaseline = 'ideographic';
            if (obj.orientation == 1) ctx.fillText(obj.title, pos[0]+(obj.size[0]*width)/2-(obj.title.length*textSizeX/2), pos[1]-textSizeY-5);
            else ctx.fillText(obj.title, pos[0]+size[0]/2-(obj.title.length*textSizeX/2), pos[1]-textSizeY-5);
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function renderBackground(renderingContext, camera) {
        try {
            var background = this, gl = renderingContext.gl, shaderProgram = renderingContext.shaderProgram;

            gl.useProgram(renderingContext.shaderProgram);
            gl.uniform1i(renderingContext.shaderProgram.uIsLine, false);

            var projMatrix = mat4.clone(camera.getCameraMatrices()[0]);
            var mvMatrix = mat4.clone(camera.getCameraMatrices()[1]);

            // @note Not sure if this is required
            mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -1.0]);

            gl.bindBuffer(gl.ARRAY_BUFFER, background.vbuff);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, background.vbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, background.nbuff);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, background.nbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, background.cbuff);
            gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, background.cbuff.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, background.ibuff);

            var mvMatrixInv = mat4.create(),
            normalMatrix = mat4.create();
            mat4.invert(mvMatrixInv, mvMatrix);
            mat4.transpose(normalMatrix, mvMatrixInv);

            renderingContext.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, projMatrix);
            renderingContext.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
            if(shaderProgram.nMatrixUniform != null) renderingContext.gl.uniformMatrix4fv(shaderProgram.nMatrixUniform, false, normalMatrix);

            gl.drawElements(gl.TRIANGLES, background.numberOfIndex, gl.UNSIGNED_SHORT, 0);
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------
    // 3D object handler
    // ----------------------------------------------------------------------

    function create3DObjectHandler() {
        var objectIndex = {}, displayList = {}, sceneJSON;

        // ------------------------------------------------------------------

        function getKey(object) {
            return object.id + '_' + object.md5;
        }

        // ------------------------------------------------------------------

        function getLayerDisplayList(layer) {
            var key = String(layer);
            if(!displayList.hasOwnProperty(key)) {
                displayList[key] = {
                    transparent: [],
                    solid: []
                };
            }
            return displayList[key];
        }

        // ------------------------------------------------------------------
        function render(displayList, renderingContext, camera) {
            var i, k, key, array;
            for(i in displayList) {
                key = displayList[i];
                if(objectIndex.hasOwnProperty(key)) {
                    array = objectIndex[key];
                    for(k in array) {
                        array[k].render(renderingContext, camera);
                    }
                }
            }
            return displayList.length;
        }

        // ------------------------------------------------------------------

        return {
            registerObject: function(object) {
                var key = getKey(object), idx;
                if(!objectIndex.hasOwnProperty(key)) {
                    objectIndex[key] = [];
                } else {
                    // Make sure is not already in
                    for(idx in objectIndex[key]) {
                        if(objectIndex[key][idx].part === object.part) {
                            return;
                        }
                    }
                }

                // Add it
                objectIndex[key].push(object);
            },

            // --------------------------------------------------------------

            updateDisplayList: function(scene) {
                // Reset displayList
                displayList = {}, sceneJSON = scene;

                // Create display lists
                for(var idx in sceneJSON.Objects) {
                    var currentObject = sceneJSON.Objects[idx],
                    displayListKey = currentObject.hasTransparency ? 'transparent' : 'solid',
                    key = getKey(currentObject);

                    getLayerDisplayList(currentObject.layer)[displayListKey].push(key);
                }
            },

            // --------------------------------------------------------------

            renderTransparent: function(layer, renderingContext, camera) {
                var displayList = getLayerDisplayList(layer).transparent;
                return render(displayList, renderingContext, camera);
            },

            // --------------------------------------------------------------

            renderSolid: function(layer, renderingContext, camera) {
                var displayList = getLayerDisplayList(layer).solid;
                return render(displayList, renderingContext, camera);
            },

            // --------------------------------------------------------------

            fetchMissingObjects: function(fetchMethod) {
                var fetch = fetchMethod, idx, part;
                for(idx in sceneJSON.Objects) {
                    var currentObject = sceneJSON.Objects[idx],
                    key = getKey(currentObject);
                    if(!objectIndex.hasOwnProperty(key)) {
                        // Request all the pieces
                        for(part = 1; part <= currentObject.parts; part++) {
                            fetch(currentObject, part);
                        }
                    }
                }
            },

            // --------------------------------------------------------------

            garbageCollect: function() {
                var refCount = {}, key, layer, array, idx;
                for(key in objectIndex) {
                    refCount[key] = 0;
                }

                // Start registering display list
                for(layer in displayList) {
                    array = displayList[layer].solid.concat(displayList[layer].transparent);
                    for(idx in array) {
                        if(refCount.hasOwnProperty(array[idx])) {
                            refCount[array[idx]]++;
                        }
                    }
                }

                // Remove entry with no reference
                for(key in refCount) {
                    if(refCount[key] === 0) {
                        delete objectIndex[key];
                    }
                }
            }

        }
    }

    // ----------------------------------------------------------------------
    // GL object creation
    // ----------------------------------------------------------------------

    function get4ByteNumber(binaryArray, cursor) {
        return (binaryArray[cursor++]) + (binaryArray[cursor++] << 8) + (binaryArray[cursor++] << 16) + (binaryArray[cursor++] << 24);
    }

    // ----------------------------------------------------------------------

    function buildBackground(gl, color1, color2) {
        try {
            if (typeof(gl) == "undefined") return;

            var background = {
                vertices: new Float32Array([-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0]),
                colors: new Float32Array([
                    color1[0], color1[1], color1[2], 1.0,
                    color1[0], color1[1], color1[2], 1.0,
                    color2[0], color2[1], color2[2], 1.0,
                    color2[0], color2[1], color2[2], 1.0]),
                index: new Uint16Array([0, 1, 2, 0, 2, 3]),
                normals: new Float32Array([0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0]),
                numberOfIndex: 6
            };

            //Create Buffers
            background.vbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, background.vbuff);
            gl.bufferData(gl.ARRAY_BUFFER, background.vertices, gl.STATIC_DRAW);
            background.vbuff.itemSize = 3;
            background.nbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, background.nbuff);
            gl.bufferData(gl.ARRAY_BUFFER, background.normals, gl.STATIC_DRAW);
            background.nbuff.itemSize = 3;
            background.cbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, background.cbuff);
            gl.bufferData(gl.ARRAY_BUFFER, background.colors, gl.STATIC_DRAW);
            background.cbuff.itemSize = 4;
            background.ibuff = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, background.ibuff);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, background.index, gl.STREAM_DRAW);

            // bind render method
            background.render = renderBackground;

            return background;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function processWireframe(gl, obj, binaryArray, cursor) {
        try {
            var tmpArray, size, i;

            // Extract points
            obj.numberOfPoints = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Getting Points
            size = obj.numberOfPoints * 4 * 3;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.points = new Float32Array(tmpArray.buffer);

            // Generating Normals
            size = obj.numberOfPoints * 3;
            tmpArray = new Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = 0.0;
            }
            obj.normals = new Float32Array(tmpArray);

            // Getting Colors
            size = obj.numberOfPoints * 4;
            tmpArray = new Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++]/255.0;;
            }
            obj.colors = new Float32Array(tmpArray);

            // Extract the number of index
            obj.numberOfIndex = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Getting Index
            size = obj.numberOfIndex * 2;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.index = new Uint16Array(tmpArray.buffer);

            // Getting Matrix
            size = 16 * 4;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.matrix = new Float32Array(tmpArray.buffer);

            // Creating Buffers
            obj.lbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.lbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.points, gl.STATIC_DRAW);
            obj.lbuff.itemSize = 3;

            obj.nbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.nbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
            obj.nbuff.itemSize = 3;

            obj.cbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.colors, gl.STATIC_DRAW);
            obj.cbuff.itemSize = 4;

            obj.ibuff = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.ibuff);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.index, gl.STREAM_DRAW);

            // Bind render method
            obj.render = renderLine;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function processSurfaceMesh(gl, obj, binaryArray, cursor) {
        try {
            var tmpArray, size, i;

            // Extract number of vertices
            obj.numberOfVertices = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Getting Vertices
            size = obj.numberOfVertices * 4 * 3;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.vertices = new Float32Array(tmpArray.buffer);

            // Getting Normals
            size = obj.numberOfVertices * 4 * 3;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.normals = new Float32Array(tmpArray.buffer);

            // Getting Colors
            tmpArray = [];
            size = obj.numberOfVertices * 4;
            for(i=0; i < size; i++) {
                tmpArray[i] =  binaryArray[cursor++] / 255.0;
            }
            obj.colors = new Float32Array(tmpArray);

            // Get number of index
            obj.numberOfIndex = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Getting Index
            size = obj.numberOfIndex * 2;
            tmpArray  = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.index = new Uint16Array(tmpArray.buffer);

            // Getting Matrix
            size = 16 * 4;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.matrix = new Float32Array(tmpArray.buffer);

            // Getting TCoord
            obj.tcoord = null;

            // Create Buffers
            obj.vbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.vbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
            obj.vbuff.itemSize = 3;

            obj.nbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.nbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
            obj.nbuff.itemSize = 3;

            obj.cbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.colors, gl.STATIC_DRAW);
            obj.cbuff.itemSize = 4;

            obj.ibuff = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.ibuff);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.index, gl.STREAM_DRAW);

            // Bind render method
            obj.render = renderMesh;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function processColorMap(gl, obj, nbColor, binaryArray, cursor) {
        try {
            var tmpArray, size, xrgb, i, c;

            // Set number of colors
            obj.numOfColors = nbColor;

            // Getting Position
            size = 2 * 4;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.position = new Float32Array(tmpArray.buffer);

            // Getting Size
            size = 2 * 4;
            tmpArray = new Int8Array(2*4);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.size = new Float32Array(tmpArray.buffer);

            //Getting Colors
            obj.colors = [];
            for(c=0; c < obj.numOfColors; c++){
                tmpArray = new Int8Array(4);
                for(i=0; i < 4; i++) {
                    tmpArray[i] = binaryArray[cursor++];
                }
                xrgb = [
                new Float32Array(tmpArray.buffer)[0],
                binaryArray[cursor++],
                binaryArray[cursor++],
                binaryArray[cursor++]
                ];
                obj.colors[c] = xrgb;
            }

            obj.orientation = binaryArray[cursor++];
            obj.numOfLabels = binaryArray[cursor++];
            obj.title = "";
            while(cursor < binaryArray.length) {
                obj.title += String.fromCharCode(binaryArray[cursor++]);
            }

            // Bind render method
            obj.render = renderColorMap;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function processPointSet(gl, obj, binaryArray, cursor) {
        try {
            var tmpArray, size, i;

            // Get number of points
            obj.numberOfPoints = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Getting Points
            size = obj.numberOfPoints * 4 * 3;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++];
            }
            obj.points = new Float32Array(tmpArray.buffer);

            // Getting Colors
            size = obj.numberOfPoints * 4;
            tmpArray = [];
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++]/255.0;
            }
            obj.colors = new Float32Array(tmpArray);

            // Getting Matrix
            size = 16 * 4;
            tmpArray = new Int8Array(size);
            for(i=0; i < size; i++) {
                tmpArray[i] = binaryArray[cursor++]/255.0;
            }
            obj.matrix = new Float32Array(tmpArray.buffer);

            // Creating Buffers
            obj.pbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.pbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.points, gl.STATIC_DRAW);
            obj.pbuff.itemSize = 3;

            obj.cbuff = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, obj.cbuff);
            gl.bufferData(gl.ARRAY_BUFFER, obj.colors, gl.STATIC_DRAW);
            obj.cbuff.itemSize = 4;

            // Bind render method
            obj.render = renderPoints;
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------

    function initializeObject(gl, obj) {
        try {
            var binaryArray = [], cursor = 0, size, type;

            // Convert char to byte
            for(var i in obj.data) {
                binaryArray.push(obj.data.charCodeAt(i) & 0xff);
            }

            // Extract size (4 bytes)
            size = get4ByteNumber(binaryArray, cursor);
            cursor += 4;

            // Extract object type
            type = String.fromCharCode(binaryArray[cursor++]);
            obj.type = type;

            // Extract raw data
            if (type == 'L'){
                processWireframe(gl, obj, binaryArray, cursor);
            } else if (type == 'M'){
                processSurfaceMesh(gl, obj, binaryArray, cursor);
            } else if (type == 'C'){
                processColorMap(gl, obj, size, binaryArray, cursor);
            } else if (type == 'P'){
                processPointSet(gl, obj, binaryArray, cursor);
            }
        } catch(error) {
            console.log(error);
        }
    }

    // ----------------------------------------------------------------------
    // Geometry Delivery renderer - factory method
    // ----------------------------------------------------------------------

    function createGeometryDeliveryRenderer(domElement) {
        var container = $(domElement),
        options = $.extend({}, DEFAULT_OPTIONS, container.data('config')),
        session = options.session,
        divContainer = GLOBAL.document.createElement('div'),
        canvas2D = GLOBAL.document.createElement('canvas'),
        canvas3D = GLOBAL.document.createElement('canvas'),
        ctx2d = canvas2D.getContext('2d'),
        gl = canvas3D.getContext("experimental-webgl") || canvas3D.getContext("webgl"),
        shaderProgram = gl.createProgram(),
        pointShaderProgram = gl.createProgram(),
        renderer = $(divContainer).addClass(FACTORY_KEY).css(RENDERER_CSS).append($(canvas2D).css(RENDERER_CSS).css(RENDERER_CSS_2D)).append($(canvas3D).css(RENDERER_CSS).css(RENDERER_CSS_3D)),
        sceneJSON = null,
        objectHandler = create3DObjectHandler(),
        cameraLayerZero = null,
        otherCamera = [],
        mouseHandling = {
            button: null,
            lastX: 0,
            lastY: 0
        },
        renderingContext = {
            container: container,
            gl: gl,
            ctx2d: ctx2d,
            shaderProgram: shaderProgram,
            pointShaderProgram: pointShaderProgram
        },
        background = null;

        // Helper functions -------------------------------------------------

        function fetchScene() {
            container.trigger({
                type: 'stats',
                stat_id: 'webgl-fetch-scene',
                stat_value: 0
            });
            session.call("vtk:getSceneMetaData", Number(options.view)).then(function(data) {
                sceneJSON = JSON.parse(data);
                container.trigger({
                    type: 'stats',
                    stat_id: 'webgl-fetch-scene',
                    stat_value: 1
                });
                updateScene();
            });
        }

        // ------------------------------------------------------------------

        function fetchObject(sceneObject, part) {
            try {
                var viewId = Number(options.view),
                newObject;

                container.trigger({
                    type: 'stats',
                    stat_id: 'webgl-fetch-object',
                    stat_value: 0
                });
                session.call("vtk:getWebGLData", viewId, sceneObject.id, part).then(function(data) {
                    try {
                        // decode base64
                        data = atob(data);
                        container.trigger({
                            type: 'stats',
                            stat_id: 'webgl-fetch-object',
                            stat_value: 1
                        });

                        newObject = {
                            md5: sceneObject.md5,
                            part: part,
                            vid: viewId,
                            id: sceneObject.id,
                            data: data,
                            hasTransparency: sceneObject.hasTransparency,
                            layer: sceneObject.layer,
                            render: function(){}
                        };

                        // Process object
                        initializeObject(gl, newObject);

                        // Register it for rendering
                        objectHandler.registerObject(newObject);

                        // Redraw the scene
                        drawScene();
                    } catch(error) {
                        console.log(error);
                    }
                });
            } catch(error) {
                console.log(error);
            }
        }

        // ------------------------------------------------------------------

        function drawScene() {
            try {
                if (sceneJSON === null || cameraLayerZero === null){
                    return;
                }
                var localRenderer, localWidth, localHeight, localX, localY,
                width = renderer.width(),
                height = renderer.height(),
                nbObjects = 0, layer, localCamera;

                // Update frame rate
                container.trigger({
                    type: 'stats',
                    stat_id: 'webgl-fps',
                    stat_value: 0
                });

                // Update viewport size
                ctx2d.canvas.width = width;
                ctx2d.canvas.height = height;
                gl.canvas.width = width;
                gl.canvas.height = height;
                gl.viewportWidth = width;
                gl.viewportHeight = height;

                // Clear 3D context
                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Draw background
                gl.disable(gl.DEPTH_TEST);
                if(background != null) {
                    cameraLayerZero.enableOrtho();
                    background.render(renderingContext, cameraLayerZero);
                    cameraLayerZero.enablePerspective();
                }
                gl.enable(gl.DEPTH_TEST);

                // Clear 2D overlay canvas
                ctx2d.clearRect(0, 0, width, height);

                // Render each layer on top of each other (Starting with the background one)
                cameraLayerZero.setViewSize(width, height);
                for(layer = sceneJSON.Renderers.length - 1; layer >= 0; layer--) {
                    localRenderer = sceneJSON.Renderers[layer];
                    localWidth = localRenderer.size[0] - localRenderer.origin[0];
                    localHeight = localRenderer.size[1] - localRenderer.origin[1];
                    localCamera = localRenderer.camera;

                    // Convert % to pixel based
                    localWidth *= width;
                    localHeight *= height;
                    localX = localRenderer.origin[0] * width;
                    localY = localRenderer.origin[1] * height;
                    localX = (localX < 0) ? 0 : localX;
                    localY = (localY < 0) ? 0 : localY;

                    // Update renderer camera aspect ratio
                    localCamera.setViewSize(localWidth, localHeight); // FIXME maybe use the local width/height

                    // Setup viewport
                    gl.viewport(localX, localY, localWidth, localHeight);

                    // Render non-transparent objects for the current layer
                    nbObjects += objectHandler.renderSolid(layer, renderingContext, localCamera);

                    // Now render transparent objects
                    gl.enable(gl.BLEND);                //Enable transparency
                    gl.enable(gl.POLYGON_OFFSET_FILL);  //Avoid zfighting
                    gl.polygonOffset(-1.0, -1.0);

                    nbObjects += objectHandler.renderTransparent(layer, renderingContext, localCamera);

                    gl.disable(gl.POLYGON_OFFSET_FILL);
                    gl.disable(gl.BLEND);
                }

                // Update frame rate
                container.trigger({
                    type: 'stats',
                    stat_id: 'webgl-fps',
                    stat_value: 1
                });

                container.trigger({
                    type: 'stats',
                    stat_id: 'webgl-nb-objects',
                    stat_value: nbObjects
                });
            } catch(error) {
                console.log(error);
            }
        }

        // ------------------------------------------------------------------

        function pushCameraState() {
            if(cameraLayerZero != null) {
                var fp = cameraLayerZero.getFocalPoint(),
                up = cameraLayerZero.getViewUp(),
                pos = cameraLayerZero.getPosition();
            //console.log('Position: ' + vec3.str(pos) + ' FocalPoint: ' + vec3.str(fp) + ' ViewUp: ' + vec3.str(up));
            //session.call("vtk:updateCamera", Number(options.view), fp, up, pos);
            }
        }

        // ------------------------------------------------------------------

        function updateScene() {
            try{
                if(sceneJSON === null || typeof(sceneJSON) === "undefined") {
                    return;
                }

                // Local variables
                var bgColor1 = [0,0,0], bgColor2 = [0,0,0], renderer;

                // Create camera for each renderer + handle Background (Layer 0)
                otherCamera = [];
                for(var idx = 0; idx < sceneJSON.Renderers.length; idx++) {
                    renderer = sceneJSON.Renderers[idx];
                    renderer.camera = createCamera();
                    renderer.camera.setCenterOfRotation(sceneJSON.Center);
                    renderer.camera.setCameraParameters( renderer.LookAt[0],
                        [renderer.LookAt[7], renderer.LookAt[8], renderer.LookAt[9]],
                        [renderer.LookAt[1], renderer.LookAt[2], renderer.LookAt[3]],
                        [renderer.LookAt[4], renderer.LookAt[5], renderer.LookAt[6]]);

                    // Custom handling of layer 0
                    if(renderer.layer === 0) {
                        cameraLayerZero = renderer.camera;
                        bgColor1 = bgColor2 = renderer.Background1;
                        if(typeof(renderer.Background2) != "undefined") {
                            bgColor2 = renderer.Background2;
                        }
                    } else {
                        otherCamera.push(renderer.camera);
                    }
                }
                background = buildBackground(gl, bgColor1, bgColor2);

                // Update the list of object to render
                objectHandler.updateDisplayList(sceneJSON);

                // Fetch the object that we are missing
                objectHandler.fetchMissingObjects(fetchObject);

                // Draw scene
                drawScene();
            } catch(error) {
                console.log(error);
            }
        }

        // ------------------------------------------------------------------
        // Add renderer into the DOM
        container.append(renderer);

        // ------------------------------------------------------------------
        // Add viewport listener
        container.bind('invalidateScene', function() {
            if(renderer.hasClass('active')){
                fetchScene();
            }
        }).bind('render', function(){
            if(renderer.hasClass('active')){
                drawScene();
            }
        }).bind('resetViewId', function(e){
            options.view = -1;
        }).bind('mouse', function(event){
            if(renderer.hasClass('active')){
                event.preventDefault();

                if(event.action === 'down') {
                    mouseHandling.button = event.current_button;
                    mouseHandling.lastX = event.pageX;
                    mouseHandling.lastY = event.pageY;
                } else if (event.action === 'up') {
                    mouseHandling.button = null;
                } else if (event.action === 'move' && mouseHandling.button != null && cameraLayerZero != null) {
                    var newX = event.pageX, newY = event.pageY,
                    deltaX = newX - mouseHandling.lastX,
                    deltaY = newY - mouseHandling.lastY;
                    mouseHandling.lastX = newX;
                    mouseHandling.lastY = newY;

                    if (mouseHandling.button === 1) {
                        cameraLayerZero.rotate(deltaX, deltaY);
                        for(var i in otherCamera) {
                            otherCamera[i].rotate(deltaX, deltaY);
                        }
                    } else if (mouseHandling.button === 2) {
                        cameraLayerZero.pan(deltaX, deltaY);
                    } else if (mouseHandling.button === 3) {
                        cameraLayerZero.zoom(deltaX, deltaY);
                    }

                    drawScene();
                    pushCameraState();
                }
            }
        }).bind('active', function(){
            if(renderer.hasClass('active')){
                // Setup GL context
                gl.viewportWidth = renderer.width();
                gl.viewportHeight = renderer.height();

                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clearDepth(1.0);
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(gl.LEQUAL);

                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

                initializeShader(gl, shaderProgram, pointShaderProgram);

                // Ready to render data
                fetchScene();
                drawScene();
            }
        });
    }

    // ----------------------------------------------------------------------
    // Camera object
    // ----------------------------------------------------------------------

    function createCamera() {
        var viewAngle = 30.0,
        centerOfRotation = vec3.set(vec3.create(), 0.0,0.0,-1.0),
        aspect = 1.0,
        left = -1.0,
        right = 1.0,
        bottom = -1.0,
        top = 1.0,
        near = 0.01,
        far = 10000.0,
        position = vec3.set(vec3.create(), 0.0, 0.0, 0.0),
        focalPoint = vec3.set(vec3.create(), 0.0, 0.0, -1.0),
        viewUp = vec3.set(vec3.create(), 0.0, 1.0, 0.0),
        rightDir = vec3.set(vec3.create(), 1.0, 0.0, 0.0),
        projectionMatrix = mat4.create(),
        modelViewMatrix = mat4.create(),
        perspective = true,
        width = 100,
        height = 100,
        modified = true;

        // Initialize to identity (just to be safe)
        mat4.identity(modelViewMatrix);
        mat4.identity(projectionMatrix);

        function computeOrthogonalAxes() {
            var direction = vec3.sub(vec3.create(), focalPoint, position);
            vec3.normalize(direction, direction);
            vec3.normalize(viewUp, viewUp);
            vec3.cross(rightDir, direction, viewUp);
            vec3.normalize(rightDir, rightDir);
            vec3.cross(viewUp, rightDir, direction);
            vec3.normalize(viewUp, viewUp);
        };

        function worldToDisplay(worldPt, width, height) {
            var viewProjectionMatrix = mat4.create();
            mat4.multiply(viewProjectionMatrix, projectionMatrix, modelViewMatrix),
            result = vec4.create();

            // Transform world to clipping coordinates
            var clipPt = vec4.create();
            vec4.transformMat4(clipPt, worldPt, viewProjectionMatrix);

            if (clipPt[3] !== 0.0) {
                clipPt[0] = clipPt[0] / clipPt[3];
                clipPt[1] = clipPt[1] / clipPt[3];
                clipPt[2] = clipPt[2] / clipPt[3];
                clipPt[3] = 1.0;
            }

            var winX = Math.round((((clipPt[0]) + 1) / 2.0) * width);
            // / We calculate -point3D.getY() because the screen Y axis is
            // / oriented top->down
            var winY = Math.round(((1 - clipPt[1]) / 2.0) * height);
            var winZ = clipPt[2];
            var winW = clipPt[3];

            vec4.set(result, winX, winY, winZ, winW);
            return result;
        }

        function displayToWorld(displayPt, width, height) {
            var x = (2.0 * displayPt[0] / width) - 1;
            var y = -(2.0 * displayPt[1] / height) + 1;
            var z = displayPt[2];

            var viewProjectionInverse = mat4.create();
            mat4.multiply(projectionMatrix, modelViewMatrix, viewProjectionInverse);
            mat4.invert(viewProjectionInverse, viewProjectionInverse);

            var worldPt = vec4.create();
            vec4.set(worldPt, x, y, z, 1);
            vec4.transformMat4(worldPt, worldPt, viewProjectionInverse);

            if (worldPt[3] !== 0.0) {
                worldPt[0] = worldPt[0] / worldPt[3];
                worldPt[1] = worldPt[1] / worldPt[3];
                worldPt[2] = worldPt[2] / worldPt[3];
                worldPt[3] = 1.0;
            }

            return worldPt;
        }

        return {
            getFocalPoint: function() {
                return focalPoint;
            },
            getPosition: function() {
                return position;
            },
            getViewUp: function() {
                return viewUp;
            },
            setCenterOfRotation: function(center) {
                //console.log('[CAMERA] centerOfRotation ' + center);
                vec3.set(centerOfRotation, center[0], center[1], center[2]);
            },
            setCameraParameters : function(angle, pos, focal, up) {
                //console.log("[CAMERA] angle: " + angle + " position: " + pos + " focal: " + focal + " up: " + up );
                viewAngle = angle * Math.PI / 180;
                vec3.set(position, pos[0], pos[1], pos[2]);
                vec3.set(focalPoint, focal[0], focal[1], focal[2]);
                vec3.set(viewUp, up[0], up[1], up[2]);
                modified = true;
            },
            setViewSize : function(w, h) {
                //console.log('[CAMERA] width: ' + w + ' height: ' + h);
                aspect = w/h;
                width = w;
                height = h;
                modified = true;
            },
            enableOrtho : function() {
                perspective = false;
                modified = true;
            },
            enablePerspective : function() {
                perspective = true;
                modified = true;
            },
            zoom : function(dx, dy) {
                var distance = vec3.distance(position, focalPoint), newPosition = vec3.create(), delta;
                vec3.subtract(newPosition, position, focalPoint);
                vec3.normalize(newPosition, newPosition);
                distance = distance + (dy * distance * 0.02);
                vec3.add(position, focalPoint, vec3.scale(vec3.create(), newPosition, distance));

                modified = true;
                this.getCameraMatrices();
            },
            pan : function(dx, dy) {
                var distance = vec3.distance(position, focalPoint),
                displacement = vec3.set(vec3.create(),0,0,0);
                vec3.scaleAndAdd(displacement, displacement, rightDir, -dx /1000);
                vec3.scaleAndAdd(displacement, displacement, viewUp, dy / 1000);
                vec3.add(position, position, displacement);
                vec3.add(focalPoint, focalPoint, displacement);
                computeOrthogonalAxes();

                modified = true;
            },
            rotate : function(dx, dy) {
                // Option 1: Get rotation axis and transform camera system

                //var direction = vec3.sub(vec3.create(), position, centerOfRotation),
                //angle = Math.atan(Math.sqrt(dx*dx+dy*dy) / vec3.distance(position, centerOfRotation)) * Math.PI / 180,
                //deltaDir = vec3.add(vec3.create(),
                //    vec3.scale(vec3.create(), rightDir, dx),
                //    vec3.scale(vec3.create(), viewUp, -dy)),
                //rotationAxis = vec3.create(),
                //rotationMatrix = mat4.create();
                //
                //vec3.normalize(deltaDir, deltaDir);
                //vec3.normalize(direction, direction);
                //vec3.cross(rotationAxis, direction, deltaDir);
                //
                //mat4.rotate(rotationMatrix, rotationMatrix, angle, rotationAxis);
                //
                //vec3.sub(position, position, centerOfRotation);
                //vec3.transformMat4(rightDir, rightDir, rotationMatrix);
                //vec3.transformMat4(viewUp, viewUp, rotationMatrix);
                //vec3.transformMat4(position, viewUp, rotationMatrix);
                //vec3.add(position, position, centerOfRotation);

                // Option 2 Move slightly the camera keeping the distance to the center of rotation constant
                var distance = vec3.distance(position, centerOfRotation),
                unitDirection = vec3.create(),
                newPosition = vec3.create();

                // Get unit direction vector
                vec3.sub(unitDirection, position, centerOfRotation);
                vec3.normalize(unitDirection, unitDirection);
                vec3.add(newPosition, centerOfRotation, unitDirection);


                // Move the unit camera position
                vec3.scaleAndAdd(newPosition, newPosition, rightDir, -dx/100.0);
                vec3.scaleAndAdd(newPosition, newPosition, viewUp, dy/100.0);

                // Get the new unit direction
                vec3.sub(unitDirection, newPosition, centerOfRotation);
                vec3.normalize(unitDirection, unitDirection);

                // Not unit vector anymore but full the delta
                vec3.scale(unitDirection, unitDirection, distance);
                vec3.add(position, centerOfRotation, unitDirection);


                computeOrthogonalAxes();
                modified = true;
                this.getCameraMatrices();


            // Option 3
            // Calculate the angles in radians first
            //var distanceVec = new vec3.create();
            //distanceVec[0] = centerOfRotation[0] - position[0];
            //distanceVec[1] = centerOfRotation[1] - position[1];
            //distanceVec[2] = centerOfRotation[2] - position[2];
            //
            //var distance = sqrt(distanceVec[0] * distanceVec[0] +
            //    distanceVec[1] * distanceVec[1] +
            //    distanceVec[2] * distanceVec[2]);
            //
            //var theta = atan(dx/distance);
            //var phi = atan(dy/distance);
            //
            //var inv = new vec3.create();
            //inv[0] = -centerOfRotation[0];
            //inv[1] = -centerOfRotation[1];
            //inv[2] = -centerOfRotation[2];
            //
            //var mat = new mat4.create();
            //mat4.translate(mat, centerOfRotation, mat);
            //mat4.rotate(mat, theta, viewUp, mat);
            //mat4.rotate(mat, phi, rightDir, mat);
            //mat4.translate(mat, inv, mat);
            //
            //mat4.multiplyVec3(mat, position, position);

            },
            getCameraMatrices : function() {
                if (modified) {
                    // Compute project matrix
                    if (perspective) {
                        mat4.perspective(projectionMatrix, viewAngle, aspect, near, far);
                    } else {
                        mat4.ortho(projectionMatrix, left, right, bottom, top, near, far);
                    }

                    // Compute modelview matrix
                    computeOrthogonalAxes();
                    mat4.lookAt(modelViewMatrix, position, focalPoint, viewUp);
                    modified = false;
                };

                return [projectionMatrix, modelViewMatrix];
            }
        };
    }

    // ----------------------------------------------------------------------
    // Init vtkWeb module if needed
    // ----------------------------------------------------------------------
    if (GLOBAL.hasOwnProperty("vtkWeb")) {
        module = GLOBAL.vtkWeb || {};
    } else {
        GLOBAL.vtkWeb = module;
    }

    // ----------------------------------------------------------------------
    // Extend the viewport factory - ONLY IF WEBGL IS SUPPORTED
    // ----------------------------------------------------------------------
    if (GLOBAL.WebGLRenderingContext && typeof(vec3) != "undefined" && typeof(mat4) != "undefined") {
        var canvas = GLOBAL.document.createElement('canvas'),
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if(gl) {
            // WebGL is supported
            if(!module.hasOwnProperty('ViewportFactory')) {
                module['ViewportFactory'] = {};
            }
            module.ViewportFactory[FACTORY_KEY] = FACTORY;
        }
    }
}(window, jQuery));
