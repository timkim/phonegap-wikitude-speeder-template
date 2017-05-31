var allCurrentModels = [];

var World = {

    init: function () {
        this.createOverlays();
    },

    createOverlays: function () {
        var message = " style='text-align: justify; font-family:HelveticaNeue-Light, HelveticaNeue, Helvetica, Arial, sans-serif, sans-serif;background-color: #f2a700; color: white; padding: 5px'";
        document.getElementById('loadingMessage').innerHTML =
            "<div" + message + ">Swipe right or use back button to exit. Center camera on to a surface and click the play button to lock on. Then click on the PhoneGap logo to launch a speeder!</div>";


        var crossHairsRedImage = new AR.ImageResource("assets/landing_zone_inactive.png");
        var crossHairsRedDrawable = new AR.ImageDrawable(crossHairsRedImage, 1.0);

        var crossHairsBlueImage = new AR.ImageResource("assets/landing_zone_active.png");
        var crossHairsBlueDrawable = new AR.ImageDrawable(crossHairsBlueImage, 1.0);

        this.tracker = new AR.InstantTracker({
            onLoaded: function() {

            },
            onChangedState:  function (state) {
                // react to a change in tracking state here
            },
            // device height needs to be as accurate as possible to have an accurate scale
            // returned by the Wikitude SDK
            deviceHeight: 1.0,
            onError: function(errorMessage) {
                alert(errorMessage);
            }
        });
        
        this.instantTrackable = new AR.InstantTrackable(this.tracker, {
            drawables: {
                cam: crossHairsBlueDrawable,
                initialization: crossHairsRedDrawable
            },
            onTrackingStarted: function () {
                // do something when tracking is started (recognized)
            },
            onTrackingStopped: function () {
                // do something when tracking is stopped (lost)
            },
            onTrackingPlaneClick: function (xpos, ypos) {
                // xPos and yPos are the intersection coordinates of the click ray and the
                // instant tracking plane. they can be applied to the transform component
                // directly
                World.addModel(xpos, ypos);
            },
            onError: function(errorMessage) {
                alert(errorMessage);
            }
        });
    },

    createAppearingAnimation: function (model, scale) {
        var sx = new AR.PropertyAnimation(model, "scale.x", scale * 2, scale, 3000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
        });
        var sy = new AR.PropertyAnimation(model, "scale.y", scale * 2, scale, 3000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
        });
        var sz = new AR.PropertyAnimation(model, "scale.z", scale * 2, scale, 3000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
        });

        var tz = new AR.PropertyAnimation(model, "translate.z", 4, 0.2, 3000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_BOUNCE
        });

        return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy, sz, tz]);
    },

    createZoomingOffAnimation: function (model) {
        var hyp = 5;
        var theta = this.degreesToRadians(model.rotate.z);
        var dx = Math.cos(theta) * hyp;
        var dy = Math.sin(theta) * hyp;

        var tx = new AR.PropertyAnimation(model, "translate.x", model.translate.x , model.translate.x + dx, 2000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_EXPO
        });
        var ty = new AR.PropertyAnimation(model, "translate.y", model.translate.y , model.translate.y + dy, 2000, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_IN_EXPO
        });

        return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [tx, ty]);

    },

    degreesToRadians: function (degrees) {
        return (Math.PI / 180) * degrees;
    },

    changeTrackerState: function () {
        
        if (this.tracker.state === AR.InstantTrackerState.INITIALIZING) {
            document.getElementById("tracking-start-stop-button").src = "assets/buttons/stop.png";
            this.tracker.state = AR.InstantTrackerState.TRACKING;
        } else {
            document.getElementById("tracking-start-stop-button").src = "assets/buttons/start.png";
            this.tracker.state = AR.InstantTrackerState.INITIALIZING;
        }
    },
    
    changeTrackingHeight: function (height) {
        this.tracker.deviceHeight = parseFloat(height);
    },
    
    isTracking: function () {
        return (this.tracker.state === AR.InstantTrackerState.TRACKING);
    },

    addModel: function (xpos, ypos) {
        if (World.isTracking()) {
            var model = new AR.Model("assets/models/landspeeder.wt3", {
                onLoaded: this.loadSpeeder,
                scale: {
                    x: 0.005,
                    y: 0.005,
                    z: 0.005
                },
                translate: {
                    x: xpos,
                    y: ypos,
                    z: 4
                },
                rotate: {
                    z: Math.random() * 360
                },
            })

            this.appearingAnimation = this.createAppearingAnimation(model, 0.005);
            var that = this;
            this.appearingAnimation.onFinish = function () {
                that.zoomingOffAnimation = that.createZoomingOffAnimation(model);
                that.zoomingOffAnimation.start();

                that.zoomingOffAnimation.onFinish = function () {
                    that.instantTrackable.drawables.removeCamDrawable(model);
                }
            }
            allCurrentModels.push(model);
            this.instantTrackable.drawables.addCamDrawable(model);
        }
    },

    resetModels: function() {
        for (var i = 0; i < allCurrentModels.length; i++) {
            this.instantTrackable.drawables.removeCamDrawable(allCurrentModels[i]);
        }
        allCurrentModels = [];
    },
    
    loadSpeeder: function() {
        World.appearingAnimation.start();
    }
};

World.init();
