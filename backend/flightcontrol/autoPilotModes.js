function pitchHold() {
    if (pitchHoldOn && !manualControlOn) {
        controller()
    }

    function controller() {
        if (Math.abs(pitchRateOfChange) < 0.4) {
            holdingPitch = pitch
        }
        presisionAlignment(holdingPitch, 0.5)
    }
}



function autoBoostBack() {
    if (autoBoostBackOn && !manualControlOn) {


        if (!boostBackinitCompleted) {
            boostBackinit()
        }

        //boostBackParamUpdate()

        boostBackController()


        if (propellantMass < dumpLimit || (altitude < 700 && speedY < 0)) {
            finishBoostBack()
        }


        function boostBackinit() {
            //set boostbackDirection
            if (downRangeDistance > starBaseXpos - flipEnducedXposChange) {
                boostbackDirection = -Math.PI * 0.5
            } else {
                boostbackDirection = Math.PI * 0.5
            }

            if (!rcsActive) {
                toggleRcs()
            }

            if (getWorkingEngineCount() == 0) {
                toggleAllRaptors()
            }

            if (!autoMaxThrustOn) {
                toggleautoMaxThrust()
            }

            if (autoTakeOffOn) {
                toggleautoTakeOff()
            }

            boostBackinitCompleted = true
        }

        function boostBackParamUpdate() {
            freeFallTimeRemainingPrediction = getFreeFallTimeRemainingPrediction(propulsiveCorrectionMinHeight)

            finalXposPrediction = downRangeDistance + freeFallTimeRemainingPrediction * speedX * 0.3
        }

        function boostBackController() {

            if (!accelerationStageCompleted) {
                accelerationStage()
            } else {
                decelerationStage()
            }

            function accelerationStage() {
                decelerationStageEstDuration = Math.abs(speedX) / decelerationStageHorizontalAcc+4

                presisionAlignment(boostbackDirection, 1.5)

                if ((starBaseXpos - downRangeDistance - flipEnducedXposChange) / (speedX * 0.5) < (decelerationStageEstDuration + 2) && (starBaseXpos - downRangeDistance) / speedX > 0) {
                    toggleAllRaptors()

                    if (autoMaxThrustOn) {
                        toggleautoMaxThrust()
                    }

                    accelerationStageCompleted = true
                }
            }

            function decelerationStage() {
                if (!boostBackDecelerationStageinitCompleted) {
                    initboostBackDecelerationStage()
                }

                if (boostBackAeroDeceleration) {
                    boostBackAeroDecelerationController()
                }else{
                    propulsiveDecelerationController()
                }

                if (Math.abs(speedX) < 3) {
                    finishBoostBack()
                }

                function boostBackAeroDecelerationController(){
                    if (boostbackDirection < 0) {
                        controlHorizontalAccelerationByAeroBreaking(decelerationStageHorizontalAcc)
                    }else{
                        controlHorizontalAccelerationByAeroBreaking(-decelerationStageHorizontalAcc)
                    }
                    
                }

                function propulsiveDecelerationController(){
                    presisionAlignment(-boostbackDirection, 1)

                    raptorAutoShutDown_KeepMinTWRBelow1()
                    controlEnginebyTWR(decelerationStageHorizontalAcc / gravity)
                }


                function initboostBackDecelerationStage() {
                    setTimeout(function(){
                        if(accelerationX<decelerationStageHorizontalAcc*0.95){
                            boostBackAeroDeceleration = false
                            toggleAllRaptors()
                        }
                    }, 5000/timeAccel);
                    boostBackDecelerationStageinitCompleted = true
                }

            }
        }

        function finishBoostBack() {
            toggleBoostBack()
            initAutoBoostBack()
            if (!autoLandOn) {
                toggleAutoLand()
            }
        }
    }
}



function autoLand() {
    if (autoLandOn && !manualControlOn) {
        if (!initVehicleConfigCompleted) {
            initVehicleConfig()
        }

        if (!aeroDesentCompleted) {
            //aeroDesent
            updateBellyFlopTriggerAltitude()
            aeroDescentController()
        } else if (!flipCompleted) {
            //bellyFlop
            flipStageController()
        } else if (!horizontalAdjustmentStageCompleted) {
            //horizontalAdjustment
            horizontalAdjustmentStageController()
        } else if (!finalDesentStageCompleted) {
            //finalDesent
            finalDesentStageController()
        }

    }

    function initVehicleConfig() {
        if (!finActive) {
            toggleFin()
        }

        if (!rcsActive) {
            toggleRcs()
        }

        throttleControl(throttleLowwerLimmit)

        if (propellantMass > dumpLimit) {
            if (!dumpingFuel) {
                toggleDumpFuel()
            }
        }

        if (getWorkingEngineCount() > 0) {
            toggleAllRaptors()
        }

        initVehicleConfigCompleted = true
    }

    function updateBellyFlopTriggerAltitude() {
        finalStagePessimisticAvailableThrust = finalStagePessimisticAvailableThrust
        horizontalAdjustmentDurationEstimate = horizontalAdjustmentDurationEstimateSingleEngine
        dualRaptorMode = false
        trialRaptorMode = false

        if (finalStagePessimisticAvailableThrust * 0.8 < gravity * vehicleMass) {
            //there's always more raptors
            finalStagePessimisticAvailableThrust = finalStagePessimisticAvailableThrustDualRaptorMode
            horizontalAdjustmentDurationEstimate = horizontalAdjustmentDurationEstimateDualRaptorMode
            dualRaptorMode = true
            if (finalStagePessimisticAvailableThrust * 0.8 < gravity * vehicleMass) {
                horizontalAdjustmentDurationEstimate = horizontalAdjustmentDurationEstimateDualRaptorMode
                finalStagePessimisticAvailableThrust = finalStagePessimisticAvailableThrustTrialRaptorMode
                trialRaptorMode = true
            }
        }

        let finalStagePessimisticAvailableAcc = finalStagePessimisticAvailableThrust / vehicleMass - gravity

        let finalStagePessimisticDuration = -speedY / finalStagePessimisticAvailableAcc
        finalStagePessimisticAltitude = -speedY * finalStagePessimisticDuration * 0.5

        let flipStagePessimisticAcc = getAngularAcceleration(flipStagePessimisticAvailableThrust, engineDistanceFromCenterOfMass, vehicleMomentOfInertia)
        let flipStagePessimisticDuration = Math.sqrt((Math.PI / 2 + flipGoalAngle) / 2 / flipStagePessimisticAcc * 2) * 2

        bellyFlopTriggerAltitude = finalStagePessimisticAltitude + -speedY * (flipStagePessimisticDuration + raptorIgnitionTimeMean * 0.001) - horizontalAdjustmentVerticalSpeedLimit * horizontalAdjustmentDurationEstimate + vehicleHeight / 2;
    }

    function aeroDescentController() {
        let distanceToSite = downRangeDistance - landingSiteXpos + flipEnducedXposChange
        let timeToSite = -distanceToSite / speedX

        steerTowardsSite()

        if ((altitude < bellyFlopTriggerAltitude && speedY < 5 && altitude < 2500) || altitude < 300) {
            aeroDesentCompleted = true
        }

        function steerTowardsSite() {
            let correctionAngle

            if (Math.abs(speedX) > 20) {
                correctionAngle = angleOfMotion - Math.PI
            } else {
                if (distanceToSite > 0) {
                    correctionAngle = -aeroDesentMaxCorrectionAngle

                    if (timeToSite < 5 && timeToSite > 0) {
                        if (Math.abs(speedX) > fineTuneMaxSpeed) {
                            fineTunePercentage = 1
                        } else {
                            fineTunePercentage = Math.abs(speedX) / fineTuneMaxSpeed
                        }
                        correctionAngle = aeroDesentMaxCorrectionAngle * fineTuneMultiplier * fineTunePercentage
                    }
                } else {
                    correctionAngle = aeroDesentMaxCorrectionAngle
                    if (timeToSite < 5 && timeToSite > 0) {
                        if (Math.abs(speedX) > fineTuneMaxSpeed) {
                            fineTunePercentage = 1
                        } else {
                            fineTunePercentage = Math.abs(speedX) / fineTuneMaxSpeed
                        }
                        correctionAngle = -aeroDesentMaxCorrectionAngle * fineTuneMultiplier * fineTunePercentage
                    }
                }
            }
            presisionAlignment(correctionAngle + Math.PI / 2, 0.7)
        }

    }

    function flipStageController() {
        if (!flipStageInitted) {
            initFlipStage()
        }
        presisionAlignment(flipGoalAngle, 0.4)

        if (pitch < 0) {
            throttleControl(throttleUpperLimmit)
        }

        if (pitch < flipGoalAngle) {
            flipCompleted = true
        }

        function initFlipStage() {
            if (dumpingFuel) {
                toggleDumpFuel()
            }
            if (rcsActive) {
                toggleRcs()
            }
            toggleAllRaptors()
            flipStageInitted = true
        }
    }

    function horizontalAdjustmentStageController() {
        if (!horizontalAdjustmentStageInitted) {
            initHorizontalAdjustmentStage()
        }

        updateParams()

        steering()
        verticalSpeedAdjustment(horizontalAdjustmentVerticalSpeedLimit, 10, 2)


        if (finalStagePessimisticAltitude * 1.1 > altitude) {
            horizontalAdjustmentStageCompleted = true
        }

        function initHorizontalAdjustmentStage() {
            if (finActive) {
                toggleFin()
            }
            finLocked = true

            if (getWorkingEngineCount() < 3) {
                horizontalAdjustmentVerticalSpeedLimit = horizontalAdjustmentVerticalSpeedLimit / 1.5
                horizontalAdjustmentHorizontalSpeedLimit *= 2
            }
            horizontalAdjustmentStageInitted = true
        }

        function updateParams() {
            let targetDifference = landingSiteXpos - downRangeDistance
            if (raptorN1Running && !raptorN2Running && !raptorN3Running) {
                targetDifference -= 12
            } else if (!raptorN1Running && raptorN2Running && raptorN3Running) {
                targetDifference += 4
            } else if (!raptorN1Running && ((raptorN2Running && !raptorN3Running) || (!raptorN2Running && raptorN3Running))) {
                targetDifference += 4
            }


            let finalStagePessimisticAvailableAcc = getTotalMaxThrust() / vehicleMass - gravity
            let finalStagePessimisticDuration = -speedY / finalStagePessimisticAvailableAcc + 1
            finalStagePessimisticAltitude = -speedY * finalStagePessimisticDuration * 0.5 + vehicleHeight * 0.5

            horizontalAdjustmentTimeLeft = (altitude - finalStagePessimisticAltitude - vehicleHeight / 2) / (-speedY)

            horizontalAdjustmentDesiredSpeed = targetDifference / horizontalAdjustmentTimeLeft

            if (horizontalAdjustmentDesiredSpeed > horizontalAdjustmentHorizontalSpeedLimit) {
                horizontalAdjustmentDesiredSpeed = horizontalAdjustmentHorizontalSpeedLimit
            } else if ((horizontalAdjustmentDesiredSpeed < -horizontalAdjustmentHorizontalSpeedLimit)) {
                horizontalAdjustmentDesiredSpeed = -horizontalAdjustmentHorizontalSpeedLimit
            }

            if (speedY > horizontalAdjustmentVerticalSpeedLimit) {
                raptorAutoShutDown_KeepMinTWRBelow1()
            }
        }

        function steering() {
            if (horizontalAdjustmentTimeLeft < 3 && horizontalAdjustmentTimeLeft > -3) {
                horizontalSteering(0, adjustmentMaxAngle, 10, 0.8)
            } else {
                horizontalSteering(horizontalAdjustmentDesiredSpeed, adjustmentMaxAngle, 6, 1)
            }

        }

    }

    function finalDesentStageController() {
        if (!finalDesentStageInitted) {
            initfinalDesentStage()
        }

        paramUpdate()

        steering()

        if (speedY > -5) {
            raptorAutoShutDown_KeepMinTWRBelow1()
        }


        verticalSpeedAdjustment(-distanceToGround / 3 - 0.1, 10, 3)

        checkIfTD()

        function initfinalDesentStage() {
            finalDesentStageInitted = true
        }

        function paramUpdate() {
            distanceToGround = altitude - vehicleHeight * 0.5
        }
        function steering() {
            if (altitude > vehicleHeight * 0.5 + noSteeringHeight) {
                if (raptorN1Running && !raptorN2Running && !raptorN3Running) {
                    horizontalSteering(-0.8, adjustmentMaxAngle / 2, 5, 0.7)
                } else if (!raptorN1Running && raptorN2Running && raptorN3Running) {
                    horizontalSteering(0.8, adjustmentMaxAngle / 2, 5, 0.7)
                } else if (!raptorN1Running && ((raptorN2Running && !raptorN3Running) || (!raptorN2Running && raptorN3Running))) {
                    horizontalSteering(0.72, adjustmentMaxAngle / 2, 5, 0.7)
                } else {
                    horizontalSteering(0, adjustmentMaxAngle / 2, 5, 0.7)
                }

            } else {
                presisionAlignment(0, 0.4)
            }

        }

        function checkIfTD() {
            if (altitude <= vehicleHeight * 0.5 + 0.05) {
                throttleControl(throttleLowwerLimmit)
                toggleAllRaptors()
                forceDump = true
                if (!dumpingFuel) {
                    toggleDumpFuel()
                }

                toggleAutoLand()
                initAutoLand()
            }
        }
    }
}

function autoMaxThrust() {
    if (autoMaxThrustOn) {
        speedAdjustment(getMaxSpeedWithSafeDynamicPressure(), 10, 4)
    }
}

function autoTakeOff() {
    if (autoTakeOffOn && !manualControlOn) {

        if (!autoTakeOffInited) {
            initAutoTakeOff()
        }

        if (altitude < 25000) {
            presisionAlignment(aomAt_25km * altitude / 25000, 3)
        } else if (altitude < 80000) {
            presisionAlignment(aomAt_25km + (aomAt_80km - aomAt_25km) * (altitude - 25000) / 55000, 3)
        } else {
            presisionAlignment(aomAt_80km, 3)
        }

        if (propellantMass < dumpLimit && getWorkingEngineCount() > 0) {
            toggleAllRaptors()
            toggleautoTakeOff()
        }
    }

    function initAutoTakeOff() {
        if (!autoMaxThrustOn) {
            toggleautoMaxThrust()
        }

        if (getWorkingEngineCount() == 0) {
            toggleAllRaptors()
        }

        autoTakeOffInited = true
    }
}

