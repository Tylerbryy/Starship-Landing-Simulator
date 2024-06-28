function toggle(bool) {
    return !bool
}

function updateYokePosition() {
    document.getElementById("pitchControl").value = pitchControl
    document.getElementById("throttleControl").value = throttle
}

function setGoalasCurrentAttitude() {
    holdingPitch = pitch
}

function manualControl_on() {
    manualControlOn = true
}

function manualControl_off() {
    manualControlOn = false
}

function buttonSwitchOn(id) {
    document.getElementById(id).style.color = '#00ff00'
    document.getElementById(id).style.backgroundColor = "rgba(255,255,255,0.24)";
}

function buttonSwitchOff(id) {
    document.getElementById(id).style.color = '#000000'
    document.getElementById(id).style.backgroundColor = "rgba(255, 255, 255, 0.43)";}

function updateScreenSize() {
    sWidth = window.innerWidth
    sHeight = window.innerHeight
}

function updateSwitches() {
    if (raptorN1Running) {
        buttonSwitchOn("raptor1toggle")
    } else {
        buttonSwitchOff("raptor1toggle")
    }
    if (raptorN2Running) {
        buttonSwitchOn("raptor2toggle")
    } else {
        buttonSwitchOff("raptor2toggle")
    }
    if (raptorN3Running) {
        buttonSwitchOn("raptor3toggle")
    } else {
        buttonSwitchOff("raptor3toggle")
    }

    if (pitchHoldOn) {
        buttonSwitchOn("togglePitchHold")
    } else {
        buttonSwitchOff("togglePitchHold")
    }

    if (rcsActive) {
        buttonSwitchOn("toggleRcs")
    } else {
        buttonSwitchOff("toggleRcs")
    }
    if (FinActive) {
        buttonSwitchOn("toggleFin")
    } else {
        buttonSwitchOff("toggleFin")
    }
}

function restart() {
    document.getElementById("RestartBtn").style.display = "none"
    document.getElementById("showPlotViewButton").style.display = "none"

    showedCrashEffect = false
    showedinFightBreakUpEffect = false

    tree1Xpos = starBaseXpos + 90
    tree2Xpos = starBaseXpos - 40

    initBackEnd()

    updateButtons()

    resetRenderer()

    initDrawMethods()

    resetControls()

    function resetRenderer() {
        app.renderer.backgroundColor = rendererBackgroundColor;
    }

    function resetControls() {
        pitchControl = 0
        throttle = 100
        updateYokePosition()
    }
}

function controlByTilt(event) {
    if (!manualControlOn && tiltControlOn) {
        let tiltAngle

        if (window.orientation === 90) {
            tiltAngle = event.beta
        } else if (window.orientation === -90) {
            tiltAngle = -event.beta
        } else if (window.orientation === 0) {
            tiltAngle = event.gamma
        } else {
            tiltAngle = -event.gamma
        }

        let inputAngle = tiltAngle * 2.4

        if (inputAngle >= 100) {
            pitchControl = 100
        } else if (inputAngle <= -100) {
            pitchControl = -100
        } else {
            pitchControl = inputAngle
        }
        updateYokePosition()
    }
}

function toggleTiltControl() {
    if (tiltControlOn) {
        buttonSwitchOff("toggleTiltControl")
    } else {
        buttonSwitchOn("toggleTiltControl")
    }
    tiltControlOn = toggle(tiltControlOn)
}

function checkIsiOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}


function zoomIn() {
    if (drawingSize * 0.85 < drawingSizeUpperLimit) {
        drawingSize *= 1.5
    }
}

function zoomOut() {
    if (drawingSize * 0.85 > drawingSizeLowwerLimit) {
        drawingSize *= 0.75
    }
}

function isIOSPWA() {
    if (window.navigator.standalone) {
        return true
    }
}

function changeTimeAccRate() {
    let newTimeAccRate = +document.getElementById("timeAccControl").value

    document.getElementById("timeAccRateDisp").textContent = newTimeAccRate

    if (!timeAccState) {
        newTimeAccRate = 1 / newTimeAccRate
    }

    timeAccel = newTimeAccRate
    renderTimeInterval = frameRate / newTimeAccRate
    throttleSpeedPerFrame = throttleSpeed / renderTimeInterval
    gimbolSpeedPerFrame = gimbolSpeed / renderTimeInterval
    gimbolSpeedPerFrame = gimbolSpeed / renderTimeInterval
    finAcuationSpeedPerFrame = finAcuationSpeed / renderTimeInterval
    controlInPutTimeConstant = 1 / frameRate * renderTimeInterval
}

function configureNewFlight() {
    let newAltitude = document.getElementById("Altitude").value
    let newX_Position = document.getElementById("X-Position").value
    let newSpeed_X = document.getElementById("Speed-X").value
    let newSpeed_Y = document.getElementById("Speed-Y").value
    let newPitch = document.getElementById("Pitch").value
    let newPropellent = document.getElementById("Propellent").value

    if (newAltitude != "") {
        altitude = +newAltitude

        if (altitude < vehicleHeight / 2) {
            altitude = vehicleHeight / 2
        }
    }
    if (newX_Position != "") {
        downRangeDistance = +newX_Position + starBaseXpos
    }
    if (newSpeed_X != "") {
        speedX = +newSpeed_X
    }
    if (newSpeed_Y != "") {
        speedY = +newSpeed_Y
    }
    if (newPitch != "") {
        pitch = getRad(+newPitch)
    }
    if (newPropellent != "") {
        propellantMass = +newPropellent * 1000

        if (propellantMass > 1200000) {
            propellantMass = 1200000
        }
    }

    firstTimeLanded = false

    if (showedMenuView) {
        show_hideMenuView()
    }
}

function configScenarioPreset(alt, xpos, vx, vy, pit, porp) {
    if (crashed) {
        restart()
    }

    document.getElementById("Altitude").value = alt
    document.getElementById("X-Position").value = xpos
    document.getElementById("Speed-X").value = vx
    document.getElementById("Speed-Y").value = vy
    document.getElementById("Pitch").value = pit
    document.getElementById("Propellent").value = porp

    cam_SpeedX = vx
    cam_SpeedY = vy
}

function clearScenarioPreset() {
    document.getElementById("Altitude").value = ""
    document.getElementById("X-Position").value = ""
    document.getElementById("Speed-X").value = ""
    document.getElementById("Speed-Y").value = ""
    document.getElementById("Pitch").value = ""
    document.getElementById("Propellent").value = ""
}