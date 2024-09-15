const sequenceModes = {
    SINGLE_RUN: 'run_sequence_once',
    LOOP_RUN: 'run_sequence_in_loop',
    BACK_AND_FORTH: 'run_sequence_back_and_forth'
}

const loopDirection = {
    FORWARD: 'forward',
    BACKWARD: 'backward'
}

class RoutePlanner {

    constructor() {
        this.currentGoal = new RouteGoal();
        this.goalList = [];
        this.sequenceMode = sequenceModes.SINGLE_RUN;
        this.direction = loopDirection.FORWARD;
        this.routeIndex = 0;
        this.pMoveIndex = 0;
        this.running = false;
    }

    // addGoal(navID) {
    //     // console.log("Add goal:", navID);
    //     let newGoal = new RouteGoal();
    //     newGoal.setNavID(navID);
    //     newGoal.setRouteID(this.routeIndex);
    //     this.routeIndex++;
    //     this.goalList.push(newGoal);
    //     let summary = {
    //         navID: newGoal.getNavID(),
    //         routeID: newGoal.getRouteID(),
    //         sequence: this.goalList.length - 1
    //     }
    //     return summary;
    // }

    // removeGoal(routeID) {
    //     // console.log("Removing goal:", routeID);
    //     for (var i = 0; i < this.goalList.length; i++) {
    //         if (this.goalList[i].routeID === routeID) {
    //             this.goalList.splice(i, 1);
    //         }
    //     }
    // }
    // getNextGoal() {
    //     if (this.goalList.length == 0) {
    //         throw new Error("Trying to get next goal, but goal list is empty.");
    //     } else if (this.goalList.length == 0) {
    //         console.log("Trying to get next goal, but goal list has only one entry.");
    //         return this.goalList[0].getNavID();
    //     } else {
    //         // console.log("Current action goal ID: " + this.currentGoal.getActionGoalID())
    //         if (this.currentGoal.getActionGoalID() == "") {
    //             // console.log("Action goal ID not set");
    //             return this.goalList[0].getNavID();
    //         } else {
    //             // console.log("Searching for next action goal");
    //             let currentGoalIndex;
    //             for (var i = 0; i < this.goalList.length; i++) {
    //                 if (this.goalList[i].navID === this.currentGoal.getNavID()) {
    //                     currentGoalIndex = i;
    //                 }
    //             }
    //             switch (this.sequenceMode) {
    //                 case sequenceModes.SINGLE_RUN:
    //                     if (currentGoalIndex + 1 < this.goalList.length) {
    //                         return this.goalList[currentGoalIndex + 1].getNavID();
    //                     } else {
    //                         console.log("End of route.");
    //                         return;
    //                     }
    //                     break;
    //                 case sequenceModes.LOOP_RUN:
    //                     if (currentGoalIndex + 1 < this.goalList.length) {
    //                         return this.goalList[currentGoalIndex + 1].getNavID();
    //                     } else {
    //                         return this.goalList[0].getNavID();
    //                     }
    //                     break;
    //                 case sequenceModes.BACK_AND_FORTH:
    //                     if (this.direction == loopDirection.FORWARD) {
    //                         if (currentGoalIndex + 1 < this.goalList.length) {
    //                             return this.goalList[currentGoalIndex + 1].getNavID();
    //                         } else {
    //                             this.direction = loopDirection.BACKWARD;
    //                             return this.goalList[currentGoalIndex - 1].getNavID();
    //                         }
    //                     } else {
    //                         if (currentGoalIndex - 1 >= 0) {
    //                             return this.goalList[currentGoalIndex - 1].getNavID();
    //                         } else {
    //                             this.direction = loopDirection.FORWARD;
    //                             return this.goalList[currentGoalIndex + 1].getNavID();
    //                         }
    //                     }
    //                     break;
    //                 default:
    //                     throw new Error('Unknown sequence mode.');
    //             }
    //         }
    //     }
    // }

    getNextGoal() {
        if (this.goalList.length == 0) {
            return -1;
            //throw new Error("Trying to get next goal, but goal list is empty.");
        } else if (this.goalList.length == 1) {
            console.log("Trying to get next goal, but goal list has only one entry.");
            return this.pMoveIndex = 0;
        } else {
            // console.log("Current action goal ID: " + this.currentGoal.getActionGoalID())
            if (!this.running) {
                // console.log("Action goal ID not set");
                //throw new Error("Route did not start.");
                return -1;
            } else {
                switch (this.sequenceMode) {
                    case sequenceModes.SINGLE_RUN:
                        if (this.pMoveIndex + 1 < this.goalList.length) {
                            return this.pMoveIndex += 1;
                        } else {
                            console.log("End of route.");
                            return -1;
                        }
                        break;
                    case sequenceModes.LOOP_RUN:
                        if (this.pMoveIndex + 1 < this.goalList.length) {
                            return this.pMoveIndex += 1;
                        } else {
                            return this.pMoveIndex = 0;
                        }
                        break;
                    case sequenceModes.BACK_AND_FORTH:
                        if (this.direction == loopDirection.FORWARD) {
                            if (this.pMoveIndex + 1 < this.goalList.length) {
                                return this.pMoveIndex += 1;
                            } else {
                                this.direction = loopDirection.BACKWARD;
                                return this.pMoveIndex -= 1;
                            }
                        } else {
                            if (this.pMoveIndex - 1 >= 0) {
                                return this.pMoveIndex -= 1;
                            } else {
                                this.direction = loopDirection.FORWARD;
                                return this.pMoveIndex += 1;
                            }
                        }
                        break;
                    default:
                        throw new Error('Unknown sequence mode.');
                }
            }
        }
    }

    goalAccepted(routeID, actionGoalID) {
        this.goalList.forEach(goal => {
            if (goal.getRouteID() == routeID) {
                goal.setActionGoalID(actionGoalID);
                this.currentGoal = goal;
            }
        });
    }

    // moveGoalUp(routeID) {
    //     for (var i = 0; i < this.goalList.length; i++) {
    //         if (this.goalList[i].routeID === routeID) {
    //             let tmpGoal = this.goalList[i];
    //             this.goalList.splice(i, 1);
    //             this.goalList.splice(i - 1, 0, tmpGoal);
    //             let summary = {
    //                 navID: tmpGoal.getNavID(),
    //                 routeID: tmpGoal.getRouteID(),
    //                 sequence: i - 1
    //             }
    //             return summary;
    //         }
    //     }
    // }
    // moveGoalDown(routeID) {
    //     for (var i = 0; i < this.goalList.length; i++) {
    //         if (this.goalList[i].routeID === routeID) {
    //             let tmpGoal = this.goalList[i];
    //             this.goalList.splice(i, 1);
    //             this.goalList.splice(i + 1, 0, tmpGoal);
    //             let summary = {
    //                 navID: tmpGoal.getNavID(),
    //                 routeID: tmpGoal.getRouteID(),
    //                 sequence: i + 1
    //             }
    //             return summary;
    //         }
    //     }
    // }

    setSequenceMode(mode) {
        this.sequenceMode = mode;
    }

    getMode(){
        return this.sequenceMode;
    }

    startRoute(running=true){
        this.running = running;
    }

    stopRoute(){
        this.startRoute(false);
        this.pMoveIndex=0;
    }

    getRouteState(){
        return this.running;
    }

    isRouteActive(){
        return this.getRouteState();
    }
}

class RouteGoal {
    constructor() {
        this.actionGoalID = "";
        this.navID = "";
        this.routeID = "";
    }

    set_ID(navID, actionGoalID, routeID) {
        this.setActionGoalID(actionGoalID);
        this.setNavID(navID);
        this.setRouteID(routeID);
    }

    setRouteID(id) {
        this.routeID = id;
    }

    setActionGoalID(id) {
        this.actionGoalID = id;
    }

    setNavID(id) {
        this.navID = id;
    }

    getRouteID() {
        return this.routeID;
    }

    getNavID() {
        return this.navID;
    }

    getActionGoalID() {
        return this.actionGoalID;
    }

    resetIndex(){
        this.pMoveIndex = -1;
        this.direction = loopDirection.FORWARD;
    }
}

module.exports = {
    RoutePlanner: RoutePlanner,
    SequenceModes: sequenceModes
}