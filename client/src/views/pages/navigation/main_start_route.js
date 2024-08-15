async function start_route(){
  route_active = true;
  robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATING;
  routePlanner.startRoute();

  if (routePlanner.goalList[0].type === 'navigate') {
    console.log(routePlanner.goalList[0]);
    let actionGoalID = drive_to_target(routePlanner.goalList[0].id);
    let routeID = routePlanner.goalList[0].id;
    let sequence = 0;
    let goalLabel = targets.get_target_by_id(routePlanner.goalList[0].id).label;
    //routePlanner.goalAccepted(routeID, actionGoalID);   // what does this function does?
    emit_route_status_update(goalLabel, sequence, routePlanner.goalList.length - 1);
  }
  else {
    await handleNonNavigationAction(routePlanner.goalList[0]);
    let msg = new move_base_msgs.MoveBaseActionResult();
    msg.status.goal_id.id=0;
    msg.status.status = 3;
    moveBase_actionClient._acInterface.emit('result', msg);
  }

}
