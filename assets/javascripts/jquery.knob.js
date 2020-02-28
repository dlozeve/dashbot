/*!jQuery Knob*/
/**
 * Downward compatible, touchable dial
 *
 * Version: 1.2.0 (15/07/2012)
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2012 Anthony Terrien
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to vor, eskimoblood, spiffistan, FabrizioC
 */
 var DAT = DAT || {};

 // blue 0x96ca6
 // green 0x9de3cb

 // green c.setHSL(  0.441, 0.56, 0.75 );
 // blue c.setHSL(  0.558, 0.62, 0.75 );

 DAT.Globe = function(container, opts) {
   opts = opts || {};

   var colorFn =
     opts.colorFn ||
     function(x) {
       var c = new THREE.Color();

       c.setHSL(0.441 + x / 2, 0.6, 0.75);
       return c;
     };

   var Shaders = {
     earth: {
       uniforms: {
         texture: { type: "t", value: null }
       },
       vertexShader: [
         "varying vec3 vNormal;",
         "varying vec2 vUv;",
         "void main() {",
         "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.05 );",
         "vNormal = normalize( normalMatrix * normal );",
         "vUv = uv;",
         "}"
       ].join("\n"),
       fragmentShader: [
         "uniform sampler2D texture;",
         "varying vec3 vNormal;",
         "varying vec2 vUv;",
         "void main() {",
         "vec3 diffuse = texture2D( texture, vUv ).xyz;",
         "float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );",
         "vec3 atmosphere = vec3( 0, 1.0, 1.0 ) * pow( intensity, 3.0 );",
         "gl_FragColor = vec4( diffuse + atmosphere, 0.3 );",
         "}"
       ].join("\n")
     },
     atmosphere: {
       uniforms: {},
       vertexShader: [
         "varying vec3 vNormal;",
         "void main() {",
         "vNormal = normalize( normalMatrix * normal );",
         "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 0 );",
         "}"
       ].join("\n"),
       fragmentShader: [
         "varying vec3 vNormal;",
         "void main() {",
         "float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );",
         "gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;",
         "}"
       ].join("\n")
     }
   };

   var camera, scene, renderer, w, h;
   var mesh, atmosphere, point;

   var overRenderer;

   var curZoomSpeed = 0;
   var zoomSpeed = 50;

   var mouse = { x: 0, y: 0 },
     mouseOnDown = { x: 0, y: 0 };
   var rotation = { x: 0, y: 0 },
     target = { x: (Math.PI * 3) / 2, y: Math.PI / 6.0 },
     targetOnDown = { x: 0, y: 0 };

   var distance = 1000000,
     distanceTarget = 100000;
   var padding = 40;
   var PI_HALF = Math.PI / 2;

   function init() {
     var shader, uniforms, material;
     w = container.offsetWidth || window.innerWidth;
     h = container.offsetHeight || window.innerHeight;

     camera = new THREE.PerspectiveCamera(20, w / h, 1, 10000);
     camera.position.z = distance;

     scene = new THREE.Scene();

     var geometry = new THREE.SphereGeometry(200, 40, 30);

     shader = Shaders["earth"];
     uniforms = THREE.UniformsUtils.clone(shader.uniforms);

     THREE.ImageUtils.crossOrigin = "";

     uniforms["texture"].value = THREE.ImageUtils.loadTexture(
       "http://cdn.rawgit.com/dataarts/webgl-globe/2d24ba30/globe/world.jpg"
     );

     material = new THREE.ShaderMaterial({
       uniforms: uniforms,
       vertexShader: shader.vertexShader,
       fragmentShader: shader.fragmentShader,
       transparent: true
     });

     mesh = new THREE.Mesh(geometry, material);
     mesh.rotation.y = Math.PI;
     scene.add(mesh);

     shader = Shaders["atmosphere"];
     uniforms = THREE.UniformsUtils.clone(shader.uniforms);

     material = new THREE.ShaderMaterial({
       uniforms: uniforms,
       vertexShader: shader.vertexShader,
       fragmentShader: shader.fragmentShader,
       side: THREE.BackSide,
       blending: THREE.AdditiveBlending,
       transparent: true
     });

     mesh = new THREE.Mesh(geometry, material);
     mesh.scale.set(1.1, 1.1, 1.1);
     scene.add(mesh);

     geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
     geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));

     point = new THREE.Mesh(geometry);

     renderer = new THREE.WebGLRenderer({ antialias: true });
     renderer.setSize(w, h);

     renderer.domElement.style.position = "absolute";

     container.appendChild(renderer.domElement);

     container.addEventListener("mousedown", onMouseDown, false);

     container.addEventListener("mousewheel", onMouseWheel, false);

     document.addEventListener("keydown", onDocumentKeyDown, false);

     window.addEventListener("resize", onWindowResize, false);

     container.addEventListener(
       "mouseover",
       function() {
         overRenderer = true;
       },
       false
     );

     container.addEventListener(
       "mouseout",
       function() {
         overRenderer = false;
       },
       false
     );
   }

   function addData(data, opts) {
     var lat, lng, size, color, i, step, colorFnWrapper;

     step = 3;
     colorFnWrapper = function(data, i) {
       return colorFn(data[i + 2]);
     };

     var subgeo = new THREE.Geometry();

     for (i = 0; i < data.length; i += step) {
       lat = data[i];
       lng = data[i + 1];
       color = colorFnWrapper(data, i);
       size = data[i + 2];
       size = size * 100;
       addPoint(lat, lng, size, color, subgeo);
     }

     this._baseGeometry = subgeo;
   }

   // material texture
   var mapFront = new THREE.Texture(generateTexture("front")),
     mapBack = new THREE.Texture(generateTexture("back")),
     mapLeft = new THREE.Texture(generateTexture("left")),
     mapRight = new THREE.Texture(generateTexture("right")),
     mapTop = new THREE.Texture(generateTexture("top"));

   mapFront.needsUpdate = true;
   mapBack.needsUpdate = true;
   mapLeft.needsUpdate = true;
   mapRight.needsUpdate = true;
   mapTop.needsUpdate = true;

   function createPoints() {
     this.points = new THREE.Mesh(
       this._baseGeometry,
       new THREE.MeshFaceMaterial([
         new THREE.MeshBasicMaterial({
           map: mapLeft,
           transparent: true,
           vertexColors: THREE.FaceColors
         }),
         new THREE.MeshBasicMaterial({
           map: mapRight,
           transparent: true,
           vertexColors: THREE.FaceColors
         }),
         new THREE.MeshBasicMaterial({
           map: mapFront,
           transparent: true,
           vertexColors: THREE.FaceColors
         }),
         new THREE.MeshBasicMaterial({
           map: mapBack,
           transparent: true,
           vertexColors: THREE.FaceColors
         }),
         // Bottom
         new THREE.MeshBasicMaterial({
           vertexColors: THREE.FaceColors
         }),
         // Top
         new THREE.MeshBasicMaterial({
           transparent: true,
           alphaTest: 1
         })
       ])
     );

     scene.add(this.points);
   }

   function addPoint(lat, lng, size, color, subgeo) {
     var phi = ((90 - lat) * Math.PI) / 180;
     var theta = ((180 - lng) * Math.PI) / 180;

     point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
     point.position.y = 200 * Math.cos(phi);
     point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

     point.lookAt(mesh.position);

     point.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
     point.updateMatrix();

     for (var i = 0; i < point.geometry.faces.length; i++) {
       point.geometry.faces[i].color = color;
     }

     if (point.matrixAutoUpdate) {
       point.updateMatrix();
     }

     subgeo.merge(point.geometry, point.matrix);
   }

   function onMouseDown(event) {
     event.preventDefault();

     container.addEventListener("mousemove", onMouseMove, false);
     container.addEventListener("mouseup", onMouseUp, false);
     container.addEventListener("mouseout", onMouseOut, false);

     mouseOnDown.x = -event.clientX;
     mouseOnDown.y = event.clientY;

     targetOnDown.x = target.x;
     targetOnDown.y = target.y;

     container.style.cursor = "move";
   }

   function onMouseMove(event) {
     mouse.x = -event.clientX;
     mouse.y = event.clientY;

     var zoomDamp = distance / 1000;

     target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
     target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

     target.y = target.y > PI_HALF ? PI_HALF : target.y;
     target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
   }

   function onMouseUp(event) {
     container.removeEventListener("mousemove", onMouseMove, false);
     container.removeEventListener("mouseup", onMouseUp, false);
     container.removeEventListener("mouseout", onMouseOut, false);
     container.style.cursor = "auto";
   }

   function onMouseOut(event) {
     container.removeEventListener("mousemove", onMouseMove, false);
     container.removeEventListener("mouseup", onMouseUp, false);
     container.removeEventListener("mouseout", onMouseOut, false);
   }

   function onMouseWheel(event) {
     event.preventDefault();
     if (overRenderer) {
       zoom(event.wheelDeltaY * 0.3);
     }
     return false;
   }

   function onDocumentKeyDown(event) {
     switch (event.keyCode) {
       case 38:
         zoom(100);
         event.preventDefault();
         break;
       case 40:
         zoom(-100);
         event.preventDefault();
         break;
     }
   }

   function onWindowResize(event) {
     camera.aspect = container.offsetWidth / container.offsetHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(container.offsetWidth, container.offsetHeight);
   }

   function zoom(delta) {
     distanceTarget -= delta;
     distanceTarget = distanceTarget > 1100 ? 1100 : distanceTarget;
     distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
   }

   function animate() {
     requestAnimationFrame(animate);
     render();
   }

   function render() {
     zoom(curZoomSpeed);

     rotation.x += 0.005;
     rotation.y += (target.y - rotation.y) * 0.1;
     distance += (distanceTarget - distance) * 0.8;

     camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
     camera.position.y = distance * Math.sin(rotation.y);
     camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

     camera.lookAt(mesh.position);

     renderer.render(scene, camera);
   }

   init();
   this.animate = animate;

   this.__defineGetter__("time", function() {
     return this._time || 0;
   });

   this.__defineSetter__("time", function(t) {
     var validMorphs = [];
     var morphDict = this.points.morphTargetDictionary;
     for (var k in morphDict) {
       if (k.indexOf("morphPadding") < 0) {
         validMorphs.push(morphDict[k]);
       }
     }
     validMorphs.sort();
     var l = validMorphs.length - 1;
     var scaledt = t * l + 1;
     var index = Math.floor(scaledt);
     for (i = 0; i < validMorphs.length; i++) {
       this.points.morphTargetInfluences[validMorphs[i]] = 0;
     }
     var lastIndex = index - 1;
     var leftover = scaledt - index;
     if (lastIndex >= 0) {
       this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
     }
     this.points.morphTargetInfluences[index] = leftover;
     this._time = t;
   });

   this.addData = addData;
   this.createPoints = createPoints;
   this.renderer = renderer;
   this.scene = scene;

   return this;
 };

 var container = document.getElementById("container-globe");
 var globe = new DAT.Globe(container);

 var xhr = new XMLHttpRequest();

 xhr.open(
   "GET",
   "https://cdn.rawgit.com/dataarts/webgl-globe/2d24ba30/globe/population909500.json",
   true
 );

 xhr.onreadystatechange = function(e) {
   if (xhr.readyState === 4) {
     if (xhr.status === 200) {
       var data = JSON.parse(xhr.responseText);
       window.data = data;
       for (i = 0; i < data.length; i++) {
         globe.addData(data[i][1], {
           format: "magnitude",
           name: data[i][0],
           animated: false
         });
       }
       globe.createPoints();
       globe.animate();
     }
   }
 };
 xhr.send(null);

 function generateTexture(alt) {
   var size = 16;

   // create canvas
   canvas = document.createElement("canvas");
   canvas.setAttribute("id", "canvas-globe");
   canvas.width = size;
   canvas.height = size;

   // get context
   var context = canvas.getContext("2d");

   // draw gradient
   context.rect(0, 0, size, size);
   var gradient;

   if (alt == "front" || alt == "back") {
     gradient = context.createLinearGradient(0, 0, 0, size);
   } else {
     gradient = context.createLinearGradient(0, 0, size, 0);
   }

   if (alt == "front") {
     gradient.addColorStop(0, "transparent");
     gradient.addColorStop(1, "white");
   } else if (alt == "back") {
     gradient.addColorStop(1, "transparent");
     gradient.addColorStop(0, "white");
   } else if (alt == "left") {
     gradient.addColorStop(1, "transparent");
     gradient.addColorStop(0, "white");
   } else if (alt == "right") {
     gradient.addColorStop(0, "transparent");
     gradient.addColorStop(1, "white");
   } else {
     gradient.addColorStop(0, "transparent");
     gradient.addColorStop(1, "white");
   }
   context.fillStyle = gradient;
   context.fill();

   return canvas;
 }


$(function () {

    /**
     * Kontrol library
     */
    "use strict";

    /**
     * Definition of globals and core
     */
    var k = {}, // kontrol
        max = Math.max,
        min = Math.min;

    k.c = {};
    k.c.d = $(document);
    k.c.t = function (e) {
        return e.originalEvent.touches.length - 1;
    };

    /**
     * Kontrol Object
     *
     * Definition of an abstract UI control
     *
     * Each concrete component must call this one.
     * <code>
     * k.o.call(this);
     * </code>
     */
    k.o = function () {
        var s = this;

        this.o = null; // array of options
        this.$ = null; // jQuery wrapped element
        this.i = null; // mixed HTMLInputElement or array of HTMLInputElement
        this.g = null; // 2D graphics context for 'pre-rendering'
        this.v = null; // value ; mixed array or integer
        this.cv = null; // change value ; not commited value
        this.x = 0; // canvas x position
        this.y = 0; // canvas y position
        this.$c = null; // jQuery canvas element
        this.c = null; // rendered canvas context
        this.t = 0; // touches index
        this.isInit = false;
        this.fgColor = null; // main color
        this.pColor = null; // previous color
        this.dH = null; // draw hook
        this.cH = null; // change hook
        this.eH = null; // cancel hook
        this.rH = null; // release hook

        this.run = function () {
            var cf = function (e, conf) {
                var k;
                for (k in conf) {
                    s.o[k] = conf[k];
                }
                s.init();
                s._configure()
                 ._draw();
            };

            if(this.$.data('kontroled')) return;
            this.$.data('kontroled', true);

            this.extend();
            this.o = $.extend(
                {
                    // Config
                    min : this.$.data('min') || 0,
                    max : this.$.data('max') || 100,
                    stopper : true,
                    readOnly : this.$.data('readonly'),

                    // UI
                    cursor : (this.$.data('cursor') === true && 30)
                                || this.$.data('cursor')
                                || 0,
                    thickness : this.$.data('thickness') || 0.35,
                    width : this.$.data('width') || 200,
                    height : this.$.data('height') || 200,
                    displayInput : this.$.data('displayinput') == null || this.$.data('displayinput'),
                    displayPrevious : this.$.data('displayprevious'),
                    fgColor : this.$.data('fgcolor') || '#87CEEB',
                    inline : false,

                    // Hooks
                    draw : null, // function () {}
                    change : null, // function (value) {}
                    cancel : null, // function () {}
                    release : null // function (value) {}
                }, this.o
            );

            // routing value
            if(this.$.is('fieldset')) {

                // fieldset = array of integer
                this.v = {};
                this.i = this.$.find('input')
                this.i.each(function(k) {
                    var $this = $(this);
                    s.i[k] = $this;
                    s.v[k] = $this.val();

                    $this.bind(
                        'change'
                        , function () {
                            var val = {};
                            val[k] = $this.val();
                            s.val(val);
                        }
                    );
                });
                this.$.find('legend').remove();

            } else {
                // input = integer
                this.i = this.$;
                this.v = this.$.val();
                (this.v == '') && (this.v = this.o.min);

                this.$.bind(
                    'change'
                    , function () {
                        s.val(s.$.val());
                    }
                );
            }

            (!this.o.displayInput) && this.$.hide();

            this.$c = $('<canvas width="' +
                            this.o.width + 'px" height="' +
                            this.o.height + 'px"></canvas>');
            this.c = this.$c[0].getContext("2d");

            this.$
                .wrap($('<div style="' + (this.o.inline ? 'display:inline;' : '') +
                        'width:' + this.o.width + 'px;height:' +
                        this.o.height + 'px;"></div>'))
                .before(this.$c);

            if (this.v instanceof Object) {
                this.cv = {};
                this.copy(this.v, this.cv);
            } else {
                this.cv = this.v;
            }

            this.$
                .bind("configure", cf)
                .parent()
                .bind("configure", cf);

            this._listen()
                ._configure()
                ._xy()
                .init();

            this.isInit = true;

            this._draw();

            return this;
        };

        this._draw = function () {

            // canvas pre-rendering
            var d = true,
                c = document.createElement('canvas');

            c.width = s.o.width;
            c.height = s.o.height;
            s.g = c.getContext('2d');

            s.clear();

            s.dH
            && (d = s.dH());

            (d !== false) && s.draw();

            s.c.drawImage(c, 0, 0);
            c = null;
        };

        this._touch = function (e) {

            var touchMove = function (e) {

                var v = s.xy2val(
                            e.originalEvent.touches[s.t].pageX,
                            e.originalEvent.touches[s.t].pageY
                            );

                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;


                s.change(v);
                s._draw();
            };

            // get touches index
            this.t = k.c.t(e);

            // First touch
            touchMove(e);

            // Touch events listeners
            k.c.d
                .bind("touchmove.k", touchMove)
                .bind(
                    "touchend.k"
                    , function () {
                        k.c.d.unbind('touchmove.k touchend.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._mouse = function (e) {

            var mouseMove = function (e) {
                var v = s.xy2val(e.pageX, e.pageY);
                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;

                s.change(v);
                s._draw();
            };

            // First click
            mouseMove(e);

            // Mouse events listeners
            k.c.d
                .bind("mousemove.k", mouseMove)
                .bind(
                    // Escape key cancel current change
                    "keyup.k"
                    , function (e) {
                        if (e.keyCode === 27) {
                            k.c.d.unbind("mouseup.k mousemove.k keyup.k");

                            if (
                                s.eH
                                && (s.eH() === false)
                            ) return;

                            s.cancel();
                        }
                    }
                )
                .bind(
                    "mouseup.k"
                    , function (e) {
                        k.c.d.unbind('mousemove.k mouseup.k keyup.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._xy = function () {
            var o = this.$c.offset();
            this.x = o.left;
            this.y = o.top;
            return this;
        };

        this._listen = function () {

            if (!this.o.readOnly) {
                this.$c
                    .bind(
                        "mousedown"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._mouse(e);
                         }
                    )
                    .bind(
                        "touchstart"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._touch(e);
                         }
                    );
                this.listen();
            } else {
                this.$.attr('readonly', 'readonly');
            }

            return this;
        };

        this._configure = function () {

            // Hooks
            if (this.o.draw) this.dH = this.o.draw;
            if (this.o.change) this.cH = this.o.change;
            if (this.o.cancel) this.eH = this.o.cancel;
            if (this.o.release) this.rH = this.o.release;

            if (this.o.displayPrevious) {
                this.pColor = this.h2rgba(this.o.fgColor, "0.4");
                this.fgColor = this.h2rgba(this.o.fgColor, "0.6");
            } else {
                this.fgColor = this.o.fgColor;
            }

            return this;
        };

        this._clear = function () {
            this.$c[0].width = this.$c[0].width;
        };

        // Abstract methods
        this.listen = function () {}; // on start, one time
        this.extend = function () {}; // each time configure triggered
        this.init = function () {}; // each time configure triggered
        this.change = function (v) {}; // on change
        this.val = function (v) {}; // on release
        this.xy2val = function (x, y) {}; //
        this.draw = function () {}; // on change / on release
        this.clear = function () { this._clear(); };

        // Utils
        this.h2rgba = function (h, a) {
            var rgb;
            h = h.substring(1,7)
            rgb = [parseInt(h.substring(0,2),16)
                   ,parseInt(h.substring(2,4),16)
                   ,parseInt(h.substring(4,6),16)];
            return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        };

        this.copy = function (f, t) {
            for (var i in f) { t[i] = f[i]; }
        };
    };


    /**
     * k.Dial
     */
    k.Dial = function () {
        k.o.call(this);

        this.startAngle = null;
        this.xy = null;
        this.radius = null;
        this.lineWidth = null;
        this.cursorExt = null;
        this.w2 = null;
        this.PI2 = 2*Math.PI;

        this.extend = function () {
            this.o = $.extend(
                {
                    bgColor : this.$.data('bgcolor') || '#EEEEEE',
                    angleOffset : this.$.data('angleoffset') || 0,
                    angleArc : this.$.data('anglearc') || 360,
                    inline : true
                }, this.o
            );
        };

        this.val = function (v) {
            if (null != v) {
                this.cv = this.o.stopper ? max(min(v, this.o.max), this.o.min) : v;
                this.v = this.cv;
                this.$.val(this.v);
                this._draw();
            } else {
                return this.v;
            }
        };

        this.xy2val = function (x, y) {
            var a, ret;

            a = Math.atan2(
                        x - (this.x + this.w2)
                        , - (y - this.y - this.w2)
                    ) - this.angleOffset;

            if(this.angleArc != this.PI2 && (a < 0) && (a > -0.5)) {
                // if isset angleArc option, set to min if .5 under min
                a = 0;
            } else if (a < 0) {
                a += this.PI2;
            }

            ret = ~~ (0.5 + (a * (this.o.max - this.o.min) / this.angleArc))
                    + this.o.min;

            this.o.stopper
            && (ret = max(min(ret, this.o.max), this.o.min));

            return ret;
        };

        this.listen = function () {
            // bind MouseWheel
            var s = this,
                mw = function (e) {
                            e.preventDefault();

                            var ori = e.originalEvent
                                ,deltaX = ori.detail || ori.wheelDeltaX
                                ,deltaY = ori.detail || ori.wheelDeltaY
                                ,v = parseInt(s.$.val()) + (deltaX>0 || deltaY>0 ? 1 : deltaX<0 || deltaY<0 ? -1 : 0);

                            if (
                                s.cH
                                && (s.cH(v) === false)
                            ) return;

                            s.val(v);
                        }
                , kval, to, m = 1, kv = {37:-1, 38:1, 39:1, 40:-1};

            this.$
                .bind(
                    "keydown"
                    ,function (e) {
                        var kc = e.keyCode;
                        kval = parseInt(String.fromCharCode(kc));

                        if (isNaN(kval)) {

                            (kc !== 13)         // enter
                            && (kc !== 8)       // bs
                            && (kc !== 9)       // tab
                            && (kc !== 189)     // -
                            && e.preventDefault();

                            // arrows
                            if ($.inArray(kc,[37,38,39,40]) > -1) {
                                e.preventDefault();

                                var v = parseInt(s.$.val()) + kv[kc] * m;

                                s.o.stopper
                                && (v = max(min(v, s.o.max), s.o.min));

                                s.change(v);
                                s._draw();

                                // long time keydown speed-up
                                to = window.setTimeout(
                                    function () { m*=2; }
                                    ,30
                                );
                            }
                        }
                    }
                )
                .bind(
                    "keyup"
                    ,function (e) {
                        if (isNaN(kval)) {
                            if (to) {
                                window.clearTimeout(to);
                                to = null;
                                m = 1;
                                s.val(s.$.val());
                            }
                        } else {
                            // kval postcond
                            (s.$.val() > s.o.max && s.$.val(s.o.max))
                            || (s.$.val() < s.o.min && s.$.val(s.o.min));
                        }

                    }
                );

            this.$c.bind("mousewheel DOMMouseScroll", mw);
            this.$.bind("mousewheel DOMMouseScroll", mw)
        };

        this.init = function () {

            if (
                this.v < this.o.min
                || this.v > this.o.max
            ) this.v = this.o.min;

            this.$.val(this.v);
            this.w2 = this.o.width / 2;
            this.cursorExt = this.o.cursor / 100;
            this.xy = this.w2;
            this.lineWidth = this.xy * this.o.thickness;
            this.radius = this.xy - this.lineWidth / 2;

            this.o.angleOffset
            && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset);

            this.o.angleArc
            && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc);

            // deg to rad
            this.angleOffset = this.o.angleOffset * Math.PI / 180;
            this.angleArc = this.o.angleArc * Math.PI / 180;

            // compute start and end angles
            this.startAngle = 1.5 * Math.PI + this.angleOffset;
            this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc;

            var s = max(
                            String(Math.abs(this.o.max)).length
                            , String(Math.abs(this.o.min)).length
                            , 2
                            ) + 2;

            this.o.displayInput
                && this.i.css({
                        'width' : ((this.o.width / 2 + 4) >> 0) + 'px'
                        ,'height' : ((this.o.width / 3) >> 0) + 'px'
                        ,'position' : 'absolute'
                        ,'vertical-align' : 'middle'
                        ,'margin-top' : ((this.o.width / 3) >> 0) + 'px'
                        ,'margin-left' : '-' + ((this.o.width * 3 / 4 + 2) >> 0) + 'px'
                        ,'border' : 0
                        ,'background' : 'none'
                        ,'font' : 'bold ' + ((this.o.width / s) >> 0) + 'px Arial'
                        ,'text-align' : 'center'
                        ,'color' : this.o.fgColor
                        ,'padding' : '0px'
                        ,'-webkit-appearance': 'none'
                        })
                || this.i.css({
                        'width' : '0px'
                        ,'visibility' : 'hidden'
                        });
        };

        this.change = function (v) {
            this.cv = v;
            this.$.val(v);
        };

        this.angle = function (v) {
            return (v - this.o.min) * this.angleArc / (this.o.max - this.o.min);
        };

        this.draw = function () {

            var c = this.g,                 // context
                a = this.angle(this.cv)    // Angle
                , sat = this.startAngle     // Start angle
                , eat = sat + a             // End angle
                , sa, ea                    // Previous angles
                , r = 1;

            c.lineWidth = this.lineWidth;

            this.o.cursor
                && (sat = eat - this.cursorExt)
                && (eat = eat + this.cursorExt);

            c.beginPath();
                c.strokeStyle = this.o.bgColor;
                c.arc(this.xy, this.xy, this.radius, this.endAngle, this.startAngle, true);
            c.stroke();

            if (this.o.displayPrevious) {
                ea = this.startAngle + this.angle(this.v);
                sa = this.startAngle;
                this.o.cursor
                    && (sa = ea - this.cursorExt)
                    && (ea = ea + this.cursorExt);

                c.beginPath();
                    c.strokeStyle = this.pColor;
                    c.arc(this.xy, this.xy, this.radius, sa, ea, false);
                c.stroke();
                r = (this.cv == this.v);
            }

            c.beginPath();
                c.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                c.arc(this.xy, this.xy, this.radius, sat, eat, false);
            c.stroke();
        };

        this.cancel = function () {
            this.val(this.v);
        };
    };

    $.fn.dial = $.fn.knob = function (o) {
        return this.each(
            function () {
                var d = new k.Dial();
                d.o = o;
                d.$ = $(this);
                d.run();
            }
        ).parent();
    };

});
