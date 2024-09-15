'use strict';
/*const express = require("express");

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = 8000;
*/

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', "POST"]
  }
});

const rosnodejs = require('rosnodejs');
var quaternionToEuler = require('quaternion-to-euler');
var math3d = require('math3d');
const fs = require('fs');
const yargs = require('yargs');
var path = require('path');

const { inflate } = require('zlib');

const NavTargets = require('./nav_targets.js');
const TfListener = require('./tf_listener.js');

const std_msgs = rosnodejs.require('std_msgs').msg;
const std_srvs = rosnodejs.require('std_srvs').srv;
const nav_msgs = rosnodejs.require('nav_msgs').msg;
const actionlib_msgs = rosnodejs.require('actionlib_msgs').msg;
const automation_application_msgs = rosnodejs.require('automation_application').msg;
const apriltag_auto_recharge_msgs = rosnodejs.require('apriltag_auto_recharge').msg;
const geometry_msgs = rosnodejs.require('geometry_msgs').msg;
const move_base_msgs = rosnodejs.require('move_base_msgs').msg;
const nav_msgs_service = rosnodejs.require('nav_msgs').srv;
const RoutePlanner = require('./route_planner.js');

var multer = require('multer');

const { exec } = require('child_process');
const { clear } = require('console');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './user_maps/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});

var upload = multer({ storage: storage });

var zoom_publisher;

const zoom_msg = new std_msgs.Int16();
const drive_msg = new geometry_msgs.Twist();
const initial_pose_msg = new geometry_msgs.PoseWithCovarianceStamped();
var cmd_vel_publisher;
var initialpose_publisher;
var robot_status_publisher;
var robot_status = automation_application_msgs.RobotStatus.Constants.IDLE;

var targets = new NavTargets.TargetList();

var map_data_blob;
var map_metadata;

var map_server_process;
var amcl_process;
var global_localization_process;
// new
var robot_state_process;
var gmapping_process;
var autosave_interval;
var autosave_interval_time;
var custom_map_file;
var selected_map_mode;
var map_autosave;
var valid_map_received;
var configDirectory = './user_maps';
var configFileName = './user_maps/config.json';
var timetableFileName = './user_maps/timetable.json';
var routePlanFileName = './user_maps/route_plan.json';

var tfTree = new TfListener.TfTree();
var robot_pose_emit_timestamp;

var moveBase_actionClient;
var autoCharge_actionClient;

var serviceClient;
var clearCostmapClient;
var plan_publisher;
var current_plan;

var routePlanner = new RoutePlanner.RoutePlanner();
var route_active = false;
var currentRouteID;
var goalNavID;
var routeList;

var odom_updated;
var odom = new Array(3);
var battery_voltage = 28;
var MIN_VOLTAGE_THERSHOLD = 24.5;

// start of joystick
var alerts = new Array();

var Alert = function (id, state, message) {
  this._id = id;
  this._state = state;
  this._message = message;
};

Alert.prototype.update = function (id, state, message) {
  this._id = id;
  this._state = state;
  this._message = message;
};

// end of joystick

const argv = yargs
  .option('linear_scale', {
    description: 'Scale for linear velocity',
    default: 1,
    alias: 'lin',
    type: 'number'
  })
  .option('angular_scale', {
    alias: 'ang',
    default: 1,
    description: 'Scale for angular velocity',
    type: 'number',
  })
  .option('wait', {
    alias: 'wait_nodes',
    default: '',
    description: 'Scale for angular velocity',
    type: 'array',
  }).option('map_scale_min', {
    description: 'Minimal map scale',
    default: 5,
    alias: 'min',
    type: 'number'
  })
  .option('map_scale_max', {
    alias: 'max',
    default: 100,
    description: 'Maximal map scale',
    type: 'number',
  })
  .option('map_autosave_interval', {
    alias: 'autosave',
    default: 60000,
    description: 'Interval for map autosaving, [ms]',
    type: 'number',
  })
  .option('port', {
    default: 8000,
    description: 'Port for server to listen on',
    type: 'number',
  })
  .help()
  .alias('help', 'h')
  .version(false)
  .argv;

console.log("Velocities will be scaled by: [", argv.linear_scale, ", ", argv.angular_scale, "]")
console.log("Map scale: [", argv.map_scale_min, ", ", argv.map_scale_max, "]")
console.log("Port: ", argv.port)
console.log("Autosave interval time: ", argv.port, "[ms]")

autosave_interval_time = argv.map_autosave_interval;

/////////////////
argv.wait.forEach((wait_node) => {
  if (wait_node != "") {
    let alert = new Alert(wait_node, ALERT_ERROR, "Waiting for " + wait_node + " node to start");
    alerts.push(alert);
  }
})
/////////////////

function save_config(edit_targets = false) {
  let confObject = {
    mapMode: selected_map_mode,
    customMapFile: custom_map_file,
    autosaveEnable: map_autosave,
    targetList: targets
  }
  let jsonString = JSON.stringify(confObject);
  fs.writeFile(configFileName, jsonString, 'utf8', function (err) {
    if (err) {
      console.log(err);
    }
  });
  load_config(edit_targets);
}

function load_config(edit_targets = false) {
  if (fs.existsSync(configFileName)) {
    fs.readFile(configFileName, 'utf8', function (err, data) {
      if(data==null || data.length == 0){
        console.error("null data------------------------------------------------------------");
        load_config(edit_targets);
        return;
      }
      if (err) {
        console.log(err);
      } else {
        let confObject = JSON.parse(data);
        targets.targets = confObject.targetList.targets;
	      get_route_plan();
        if(edit_targets == false){
          if (confObject.mapMode == 'SLAM') {
            stopAMCL();
            stopMapServer();
            console.log("Start SLAM process");
            startGmapping();
            if (confObject.autosaveEnable == true) {
              console.log("Start map autosave process");
              startAutoSave();
            } else {
              stopAutoSave();
            }
          } else if (confObject.mapMode == "STATIC") {
            stopGmapping();
            stopAutoSave();
            custom_map_file = confObject.customMapFile;
            startMapServer(custom_map_file);
            startAMCL();
            io.emit('get_targets', targets.targets);
          }
        }
        else {
          io.emit('get_targets', targets.targets);
        }
      }
    });
  } else {
    console.log("Config file does not exist, create default.");
    if (!fs.existsSync(configDirectory)) {
      fs.mkdirSync(configDirectory);
    }
    selected_map_mode = 'SLAM';
    custom_map_file = '';
    map_autosave = true;
    save_config();
  }
}

const default_publisher_options = {
  queueSize: 1,
  latching: false,
  throttleMs: 100
}

// Define alert states
const ALERT_OK = 1
const ALERT_WARN = 2
const ALERT_ERROR = 3

function update_alerts(alerts) {
  io.emit('alert_states', alerts)
}

function get_current_config(client_mode) {
  if (client_mode == 'SLAM' || client_mode == 'STATIC') {
    if (fs.existsSync(configFileName)) {
      fs.readFile(configFileName, 'utf8', function (err, data) {
        if (err) {
          console.log(err);
        } else {
          let confObject = JSON.parse(data);
          let current_map_name = configDirectory + '/' + confObject.customMapFile;
          console.log(current_map_name);
          if (confObject.mapMode == 'SLAM') {
            if (client_mode == 'STATIC') {
              if (!(fs.existsSync(current_map_name))) {
                io.emit('navigate_slam_unsave', confObject.customMapFile);
              }
              else {
                io.emit('navigate_slam_save', confObject.customMapFile);
              }
            }
            else if (client_mode == 'SLAM') {
              if (!(fs.existsSync(current_map_name))) {
                io.emit('create_slam_unsave', confObject.customMapFile);
                console.log('create_slam_unsave');
              }
              else {
                io.emit('can_create_new_map', confObject.customMapFile);
                console.log('can_create_new_map');
              }
            }
          }
          else if (confObject.mapMode == 'STATIC') {
            if (client_mode == 'STATIC') {
              if (!(fs.existsSync(current_map_name))) {
                io.emit('navigate_static_no_file', confObject.customMapFile);
              }
              else {
                io.emit('navigate_static_have_file', confObject.customMapFile);
              }
            }
            else if (client_mode == 'SLAM') {
              io.emit('can_create_new_map');
            }
          }
        }
      });
    } else {
      console.log("Config file does not exist, create default.");
    }
  }
  else if (client_mode == 'TIMETABLE') {
    if (fs.existsSync(timetableFileName)) {
      fs.readFile(timetableFileName, 'utf8', function (err, data) {
        if (err) {
          console.log(err);
        } else {
          let ttObject = JSON.parse(data);
          io.emit('emit_timetable_object', ttObject);
        }
      });
    } else {
      console.log("Timetable file does not exist, create default.");
      let emptyArr = {
        "week": [
          { "day": 0, "timetable": [] },
          { "day": 1, "timetable": [] },
          { "day": 2, "timetable": [] },
          { "day": 3, "timetable": [] },
          { "day": 4, "timetable": [] },
          { "day": 5, "timetable": [] },
          { "day": 6, "timetable": [] }
        ]
      };
      fs.appendFile(timetableFileName, JSON.stringify(emptyArr), function (err) {
        if (err) throw err;
        console.log('Saved!');
        io.emit('emit_timetable_object', emptyArr);
      });
    }
  }
}

function saveTimetable(events) {
  if (fs.existsSync(timetableFileName)) {
    let jsonString = JSON.stringify(events);
    setTimeout(function () {
      fs.writeFile(timetableFileName, jsonString, 'utf8', function (err) {
        if (err) {
          console.log(err);
        }
        else {
          io.emit('timetable_saved');
        }
      });
    }, 500);
  }
}

function saveRoutePlan(route) {
  if (fs.existsSync(routePlanFileName)) {
    let jsonString = JSON.stringify(route);
    setTimeout(function () {
      fs.writeFile(routePlanFileName, jsonString, 'utf8', function (err) {
        if (err) {
          console.log(err);
        }
        else {
          io.emit('route_plan_saved');
          get_route_plan();
        }
      });
    }, 500);
  }
}

function emit_map_update() {
  if (map_metadata) {
    valid_map_received = true;
    let map_update = {
      blob: map_data_blob,
      metadata: map_metadata
    }
    io.emit('map_update', map_update);
  }
}

function emit_robot_pose() {
  if (robot_pose_emit_timestamp + 50 < Date.now()) {
    robot_pose_emit_timestamp = Date.now();
    let transform = tfTree.lookup_transform('map', 'base_link', 0);
    if (transform) {
      var euler_angles = quaternionToEuler([
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
        transform.rotation.w
      ]);
      var pose_msg = {
        x_pos: transform.translation.x,
        y_pos: transform.translation.y,
        theta: euler_angles[0]
      };
      io.emit('robot_pose', pose_msg);
    }
  }
}

function setInitialPose(initial_pose) {
  let target_quaternion = math3d.Quaternion.Euler(0, 0, initial_pose.robot_pos_theta * 180 / Math.PI);
  console.log(initial_pose);
  initial_pose_msg.header.frame_id = "map";
  initial_pose_msg.header.stamp = rosnodejs.Time.now();
  initial_pose_msg.pose.pose.position.x = initial_pose.robot_pos_x;
  initial_pose_msg.pose.pose.position.y = initial_pose.robot_pos_y;
  initial_pose_msg.pose.pose.position.z = 0;
  initial_pose_msg.pose.pose.orientation.x = target_quaternion.x;
  initial_pose_msg.pose.pose.orientation.y = target_quaternion.y;
  initial_pose_msg.pose.pose.orientation.z = target_quaternion.z;
  initial_pose_msg.pose.pose.orientation.w = target_quaternion.w;
  initialpose_publisher.publish(initial_pose_msg);
  io.emit('localized', 'Localized!');
}

function stopMapServer() {
  if (map_server_process) {
    exec('rosnode kill static_map_server', (err, stdout, stderr) => {
      if (err) {
        console.log("Could not stop map server: " + err);
      }
    });
    map_server_process.kill();
  }
}

function startMapServer(map_file) {
  console.log("start map server with: " + map_file);
  map_server_process = exec('rosrun map_server map_server ' + configDirectory + '/' + map_file + ' __name:=static_map_server', (err, stdout, stderr) => {
    console.log("Subprocess finished");
    if (err) {
      console.log("Error: " + err);
      return;
    }
  });
  console.log("Subprocess started");
}

function stopAMCL() {
  if (amcl_process) {
    exec('rosnode kill amcl', (err, stdout, stderr) => {
      if (err) {
        console.log("Could not stop AMCL: " + err);
      }
    });
    amcl_process.kill();
  }
  //    if (robot_state_process) {
  //        exec('rosnode kill robot_state_publisher', (err, stdout, stderr) => {
  //            if (err) {
  //                console.log("Could not stop AMCL: " + err);
  //            }
  //        });
  //        robot_state_process.kill();
  //    }
  if (global_localization_process) {
    exec('rosnode kill amcl_estimate_node', (err, stdout, stderr) => {
      if (err) {
        console.log("Could not stop AMCL estimate: " + err);
      }
    });
    global_localization_process.kill();
  }
}

function startAMCL() {
  console.log("Start AMCL");
  amcl_process = exec('roslaunch bonbot_navigation amcl.launch', (err, stdout, stderr) => {
    console.log("AMCL finished");
    if (err) {
      console.log("Error: " + err);
      return;
    }
  });
  //    robot_state_process = exec('roslaunch scout_bringup scout_remote.launch', (err, stdout, stderr) => {
  //        console.log("Robot state publisher finished");
  //        if (err) {
  //            console.log("Error: " + err);
  //            return;
  //        }
  //    });
  console.log("AMCL launched");
  global_localization_process = exec('roslaunch route_admin_panel amcl_estimate.launch', (err, stdout, stderr) => {
    console.log("AMCL estimate finished");
    if (err) {
      console.log("Error: " + err);
      return;
    }
  });
  console.log("AMCL estimate launched");
}

function stopGmapping() {
  if (gmapping_process) {
    exec('rosnode kill bonbot_slam_gmapping', (err, stdout, stderr) => {
      if (err) {
        console.log("Could not stop gmapping: " + err);
      }
    });
    gmapping_process.kill();
    gmapping_process = null;
    io.emit('map_stopped', 'mapping stopped');
  }
}

function startGmapping() {
  if (gmapping_process) {
    console.log("Gmapping is already running, no need to launch it again")
  } else {
    gmapping_process = exec('roslaunch bonbot_slam bonbot_slam.launch open_rviz:="false"', (err, stdout, stderr) => {
      console.log("Gmapping finished");
      if (err) {
        console.log("Error: " + err);
        return;
      }
      gmapping_process = null;
    });
    console.log("Gmapping launched");
  }
}

function stopAutoSave() {
  clearInterval(autosave_interval);
}

function startAutoSave() {
  stopAutoSave();
  let date_string = Date.now().toString();
  console.log("Enable map auto save");
  valid_map_received = false;
  autosave_interval = setInterval(saveMap, autosave_interval_time, 'auto_saved_map_' + date_string);
}

function saveMap(filename, valid_map_received = false) {
  if (valid_map_received) {
    console.log(`Saving map with name: ${filename}`);
    exec('cd ' + configDirectory + ' && rosrun map_server map_saver -f ' + filename, (err, stdout, stderr) => {
      if (err) {
        console.log("[map_server map_saver] Error: " + err);
        return;
      }
      console.log("[map_server map_saver] " + stdout);
      console.log("[map_server map_saver] " + stderr);
      update_map_filenames();
      console.log("[map_server map_saver] Process finished");
      io.emit('map_saved', 'Map saved.');
      selected_map_mode = 'STATIC';
      custom_map_file = filename + '.yaml';
      save_config();
    });
  } else {
    console.warn("Can not call map autosave. Valid map was not created");
  }
}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static('public'))

app.post('/upload', upload.single('map-image'), function (req, res) {
  custom_map_file = './user_maps/' + req.file.originalname + '.yaml';
  let imagePath = req.file.path.replace(/^user_maps\//, '');
  let yaml_ouptut = 'image: ' + imagePath + '\n';
  yaml_ouptut += 'resolution: ' + req.body.mapResolution + '\n';
  yaml_ouptut += 'origin: [0.0, 0.0, 0.0]\n';
  yaml_ouptut += 'occupied_thresh: 0.65\n';
  yaml_ouptut += 'free_thresh: 0.196\n';
  yaml_ouptut += 'negate: 0\n';
  fs.writeFile(custom_map_file, yaml_ouptut, function (err) {
    if (err) {
      return console.log(err);
    }
  });
  update_map_filenames();
  res.end();
});


function start_mapping(settings) {
  if (fs.existsSync(configFileName)) {
    fs.readFile(configFileName, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
      } else {
        let confObject = JSON.parse(data);
        if (((confObject.mapMode == 'SLAM' && settings.map_slam == true)) && settings.map_file + '.yaml' == confObject.customMapFile) {
        }
        else {
          if (settings.map_static == true) {
            selected_map_mode = 'STATIC';
          } else if (settings.map_slam == true) {
            selected_map_mode = 'SLAM';
          }
          custom_map_file = settings.map_file + '.yaml';
          map_autosave = settings.map_autosave;
          save_config();
        }
      }
    });
  }
  io.emit('map_started', 'mapping started');
}

function start_navigate(settings) {
  if (fs.existsSync(configFileName)) {
    fs.readFile(configFileName, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
      } else {
        let confObject = JSON.parse(data);
        if (((confObject.mapMode == 'STATIC' && settings.map_static == true)) && settings.map_file + '.yaml' == confObject.customMapFile) {
          targets.targets = confObject.targetList.targets;
          io.emit('get_targets', targets.targets);
        }
        else {
		console.log("B:!!!");
          if (settings.map_static == true) {
            selected_map_mode = 'STATIC';
          } else if (settings.map_slam == true) {
            selected_map_mode = 'SLAM';
          }
          custom_map_file = settings.map_file + '.yaml';
          map_autosave = settings.map_autosave.toString();
          save_config();
        }
      }
    });
  }
  io.emit('map_navigate', 'navigation started');
}

function save_map_settings(settings) {
  console.log("Received map settings");
  console.log(settings);
  if (settings.map_static == true) {
    selected_map_mode = 'STATIC';
  } else if (settings.map_slam == true) {
    selected_map_mode = 'SLAM';
  }
  custom_map_file = settings.map_file + '.yaml';
  map_autosave = settings.map_autosave;
  save_config();
}

function update_map_filenames() {
  let filenames = getFileList('./user_maps', '.yaml');
  io.emit('map_file_list', filenames);
}

function getFileList(startPath, filter) {

  console.log('Starting from dir ' + startPath + '/');

  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }
  let file_names = [];
  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      getFileList(filename, filter); //recurse
    }
    else if (filename.indexOf(filter) >= 0) {
      file_names.push(filename.substring(10, filename.length - 5));
    };
  };
  return file_names;
};

function get_route_plan() {
  if (fs.existsSync(routePlanFileName)) {
    fs.readFile(routePlanFileName, 'utf8', function (err, data) {
      if (err) {
        console.log(err);
      } else {
        let rpObject = JSON.parse(data);
        routePlanner.goalList = [];
        routePlanner.sequenceMode = rpObject.mode;
        for(var i=0;i<rpObject.plan.length;i++){
          let point = rpObject.plan[i];
          if(point.type == "navigate"){
            routePlanner.goalList.push({id:point.pointID, type: point.type, label: point.label});
          }else if(point.type == "sleep"){
            routePlanner.goalList.push({type: point.type, duration: point.duration});
          }else if(point.type == "set_motion"){
            routePlanner.goalList.push({type: point.type, x: point.motion_x, r: point.motion_r});
          }else if(point.type == "execute_action"){
            ;
          }
        }
        io.emit('route_plan_list', rpObject);
        console.log(routePlanner.goalList);
      }
    });
  } else {
    console.log("Route Plan file does not exist, create default.");
    let emptyArr = { "mode": "SINGLE_RUN", "plan": [] };
    fs.appendFile(routePlanFileName, JSON.stringify(emptyArr), function (err) {
      if (err) throw err;
      console.log('Saved!');
      io.emit('route_plan_list', emptyArr);
    });
  }
}

function emit_target(target) {
  io.emit('add_target', target);
}

function emit_target_delete(target_id) {
  io.emit('remove_target_by_id', target_id);
}

function emit_route_point(sequence, navID, routeID) {
  let route_point = {
    route_sequence: sequence,
    point_navID: navID,
    point_routeID: routeID,
    target: targets.get_target_by_id(navID)
  }
  io.emit('new_route_point', route_point);
}

function emit_del_route_point(routeID) {
  io.emit('del_route_point', routeID);
}

function emit_route_status_update(label, sequence, seq_max) {
  let status = {
    seq: sequence,
    max: seq_max,
    label: label
  }
  io.emit('route_status', status);
}

function emit_current_path(path) {
  let path_object = {
    path: path
  }
  return
  io.emit('current_plan', path_object);
}

function sendCmdVel(x, w) {
  drive_msg.linear.x = x;
  drive_msg.angular.z = w;
  cmd_vel_publisher.publish(drive_msg);
}

function run_auto_charge(tagNo) {
  console.log("auto charge received: " + tagNo);
  let goal = new apriltag_auto_recharge_msgs.ApriltagAutorechargeGoal();
  goal.command = tagNo;
  autoCharge_actionClient.sendGoal(goal);
};

function tfToPose(transform){
  let pose = new geometry_msgs.PoseStamped()
  pose.header.seq = 0;
  pose.header.frame_id = "map";
  pose.header.stamp = rosnodejs.Time.now();
  pose.pose.position.x = transform.translation.x;
  pose.pose.position.y = transform.translation.y;
  pose.pose.position.z = transform.translation.z;
  pose.pose.orientation.x = transform.rotation.x;
  pose.pose.orientation.y = transform.rotation.y;
  pose.pose.orientation.z = transform.rotation.z;
  pose.pose.orientation.w = transform.rotation.w;
  return pose;
}

function targetToPose(target){
  let pose = new geometry_msgs.PoseStamped();
  pose.header.seq = 0;
  pose.header.frame_id = "map";
  pose.header.stamp = rosnodejs.Time.now();
  pose.pose.position.x = target.x;
  pose.pose.position.y = target.y;
  pose.pose.position.z = 0;
  let target_quaternion = math3d.Quaternion.Euler(0, 0, target.theta * 180 / Math.PI);
  pose.pose.orientation.x = target_quaternion.x;
  pose.pose.orientation.y = target_quaternion.y;
  pose.pose.orientation.z = target_quaternion.z;
  pose.pose.orientation.w = target_quaternion.w;
  return pose;
}

async function find_closest_charging_port(cur_transform){
  if(routePlanner.goalList.length == 0){
      return -1;
  }
  let resultID = -1;
  let len = -1;
  
  // for(var i=0;i<routePlanner.goalList.length;i++){
  //   let goal = routePlanner.goalList[i];
  //   if(goal.type != 'navigate') continue;
  //   if(targets.get_target_by_id(goal.id).charging_port == true){
  //     console.log(goal);
  //     console.log(goal.id);
  //     return goal.id;
  //   }else continue;

  let start_pose = tfToPose(cur_transform);
    
  for(var i=0;i<routePlanner.goalList.length;i++){
    let goal = routePlanner.goalList[i];
    if(goal.type != 'navigate') continue;
    if(targets.get_target_by_id(goal.id).charging_port == true){
      let req = new nav_msgs_service.GetPlan.Request();
      req.start = start_pose;
      req.goal = targetToPose(targets.get_target_by_id(goal.id));
      req.tolerance = 0.15;
      await serviceClient.call(req)
      .then((res) => {
          if(res.plan.poses.length <= 1)
            return;
          let totalLen = 0;
          for(let i=1; i<res.plan.poses.length; i++){
            totalLen += Math.sqrt((res.plan.poses[i].pose.position.y-res.plan.poses[i-1].pose.position.y)**2
              +(res.plan.poses[i].pose.position.x-res.plan.poses[i-1].pose.position.x)**2);

          }
          
          if(len == -1 || totalLen < len){
            len = totalLen;
            resultID = goal.id;
          }
      });
    }
  }
  return resultID;
}

async function set_movement(x, w) {
  await angularTravelByOdom(w, 0.1);
  await linearTravelByOdom(x, 0.1);
}

async function sleepWithInterrupt(duration){
  return new Promise((resolve) => {
    const intervalDuration = 1000;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed+=intervalDuration;

      if(!route_active || elapsed >= duration){
        clearInterval(interval);
        resolve();
        return;
      }
    }, intervalDuration);
  });
}

async function handleNonNavigationAction(action) {
  switch (action.type) {
    case automation_application_msgs.WaypointType.Constants.SLEEP:
      await sleepWithInterrupt(action.duration * 1000);
      break;
    case automation_application_msgs.WaypointType.Constants.SET_MOTION:
      await set_movement(action.x, action.r*Math.PI/180.);
      break;
    case automation_application_msgs.WaypointType.Constants.EXECUTE_ACTION:

      break;
  }
}

async function linearTravelByOdom(distance, speed) {
  const oriOdom = [odom[0], odom[1], odom[2]];
  let missed_update = 0;
  const MAX_MISSED_UPDATE = 3;
  const rate = 10;
  while (rosnodejs.ok() && route_active) {
    //            console.warn('odom[0] = ' + odom[0] + '\toriOdom[0] = ' + oriOdom[0]);
    let diff = Math.pow(odom[0] - oriOdom[0], 2) + Math.pow(odom[1] - oriOdom[1], 2) - distance * distance;
    if (odom_updated) {
      odom_updated = false;
      missed_update = 0;
      if (diff <= 0) {
        sendCmdVel(speed, 0);
      } else {
        sendCmdVel(0, 0);
        return;
      }
    } else {
      missed_update++;
      if (missed_update >= MAX_MISSED_UPDATE) {
        sendCmdVel(0, 0);
        console.warn('No odom received');
        return;
      } else {
        sendCmdVel(speed, 0);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000 / rate));
  }
  return;
}

async function angularTravelByOdom(angle, speed) {
  const oriOdom = [odom[0], odom[1], odom[2]];
  let neg = angle < 0;
  let missed_update = 0;
  const MAX_MISSED_UPDATE = 3;
  const rate = 10;
  while (rosnodejs.ok() && route_active) {
    if (odom_updated) {
      odom_updated = false;
      missed_update = 0;
      let diff = odom[2] - oriOdom[2];

      while (diff > Math.PI) {
        diff -= 2 * Math.PI;
      }
      while (diff <= -Math.PI) {
        diff += 2 * Math.PI;
      }
      if (!neg) {
        if (diff < angle)
          sendCmdVel(0, speed);
        else {
          sendCmdVel(0, 0);
          return;
        }
      } else {
        if (diff > angle)
          sendCmdVel(0, -speed);
        else {
          sendCmdVel(0, 0);
          return;
        }
      }
    } else {
      missed_update++;
      if (missed_update >= MAX_MISSED_UPDATE) {
        sendCmdVel(0, 0);
        console.warn('No odom received');
        return;
      } else {
        if (!neg) sendCmdVel(0, speed);
        else sendCmdVel(0, -speed);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000 / rate));
  }
  return;
}

function drive_to_target(navID) {
  let target = targets.get_target_by_id(navID);
  if(target==-1){
    return -1;
  }
  let move_base_goal = new move_base_msgs.MoveBaseGoal();
  let set_point = new geometry_msgs.PoseStamped();
  let target_quaternion = math3d.Quaternion.Euler(0, 0, target.theta * 180 / Math.PI);
  set_point.header.frame_id = "map";
  set_point.header.stamp = rosnodejs.Time.now();
  set_point.pose.position.x = target.x;
  set_point.pose.position.y = target.y;
  set_point.pose.orientation.x = target_quaternion.x;
  set_point.pose.orientation.y = target_quaternion.y;
  set_point.pose.orientation.z = target_quaternion.z;
  set_point.pose.orientation.w = target_quaternion.w;
  move_base_goal.target_pose = set_point;
  let goal_handle = moveBase_actionClient.sendGoal(move_base_goal);
  console.log(goal_handle._goal.goal_id);
  return goal_handle._goal.goal_id;
}

async function checkCurTimeInTable() {
  if (fs.existsSync(timetableFileName)) {
    try {
      const data = await fs.promises.readFile(timetableFileName, 'utf8');
      let object = JSON.parse(data);
      let curDay = new Date();
      let weekday = curDay.getDay();
      let current_hour = curDay.getHours();
      let current_minute = curDay.getMinutes();
      for (var i = 0; i < object.week.length; i++) {
        if (object.week[i].day == weekday) {
          for (var j = 0; j < object.week[i].timetable.length; j++) {
            let ttObj = object.week[i].timetable[j];
            let start_hour = parseInt(ttObj.start_time.substr(0, 2));
            let start_minute = parseInt(ttObj.start_time.substr(3, 2));
            let end_hour = parseInt(ttObj.end_time.substr(0, 2));
            let end_minute = parseInt(ttObj.end_time.substr(3, 2));
            if (end_hour == 0 && current_minute == 0) {
              end_hour = 24;
            }
            if ((current_hour > start_hour || (current_hour == start_hour && current_minute >= start_minute)) &&
              (current_hour < end_hour || (current_hour == end_hour && current_minute <= end_minute))) {
              return true;
            }
          }
          return false;
        }
      }
    } catch (error) {
      console.error('Error reading or parsing json timetable');
    }
  } else {
    console.log("Timetable file does not exist");
    return false;
  }
}

async function start_route(){
  console.log("start route");
  for(var i=0;i<routePlanner.goalList.length;i++){
    if(routePlanner.goalList[i].type === 'navigate'){
      if(targets.get_target_by_id(routePlanner.goalList[i].id) == -1){
        console.log("target not found");
        io.emit('route_error', 'route_nav_id_error');
        return false;
      }
    }
  }
  if(route_active) return false;
  if(robot_status == automation_application_msgs.RobotStatus.Constants.CHARGING 
      || robot_status == automation_application_msgs.RobotStatus.Constants.CHARGED){
        await countOneMeterByTime();
  }
  route_active = true;
  robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATING;
  routePlanner.startRoute();
	console.log(routePlanner.goalList[0].type)
  clearCostmapClient.call(new std_srvs.Empty.Request());
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

function stop_route(){
  if(!route_active) return false;
  route_active = false;
  robot_status = automation_application_msgs.RobotStatus.Constants.IDLE;
  routePlanner.stopRoute();
  
}

async function countOneMeterByTime() {
  let rate = 10;
  let start_time = Date.now();
  while (rosnodejs.ok() && Date.now() - start_time < 10000) {   // walk front 1 meter
    sendCmdVel(0.1, 0);
    await new Promise(resolve => setTimeout(resolve, 1000 / rate));
  }
  sendCmdVel(0, 0);
};

io.on('connection', function (socket) {
  console.log(`user ${socket.id} is connected.`)
  socket.emit("connected", "CONNECTED!!");
  socket.on('connect', function () {
    socket.emit('connect', 'You Are Connected!!');

  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
    socket.emit('disconect', 'You Are Disconnected....');
  });

  socket.on('start_mapping', function (mapConfig) {
    console.log("Start Mapping...");
    start_mapping(mapConfig);
  });

  socket.on('start_navigate', function (mapConfig) {
    console.log("Start Navigate...");
    start_navigate(mapConfig);
  });

  socket.on('get_current_config', function (mode) {
    console.log("User getting current config...");
    get_current_config(mode);
  });

  socket.on('get_route_plan', function () {
    console.log("User route plan list...");
    get_route_plan();
  });

  socket.on('save_map', function (filename) {
    console.log("Saving Map...");
    saveMap(filename, true);
  });

  socket.on('save_timetable', function (events) {
    console.log("Saving Timetable...");
    saveTimetable(events);
  });

  socket.on('save_route_plan', function (route) {
    console.log("Saving Timetable...");
    saveRoutePlan(route);
  });

  socket.on('client_continue_route', async () => {
    console.log("Client Continue Route...");
    await start_route();
  });

  socket.on('client_stop_route', function () {
    console.log("Client Stop Route...");
    stop_route();
  });

  socket.on('map_scale', function (map_scale) {
    zoom_msg.data = map_scale;
    zoom_publisher.publish(zoom_msg);
  });

  socket.on('drive_command', function (drive_command) {
    drive_msg.linear.x = drive_command.lin * argv.linear_scale;
    drive_msg.angular.z = drive_command.ang * argv.angular_scale;
    cmd_vel_publisher.publish(drive_msg);
  });

  socket.on('delete_target', function (target_id) {
    targets.remove_target(target_id);
    emit_target_delete(target_id);
    selected_map_mode = 'STATIC';
    map_autosave : false;
    save_config(true);
  });

  socket.on('new_target', function (new_target) {
    console.log("New target\n", new_target);
    let target = new NavTargets.Target(targets.get_next_id(), new_target.x, new_target.y, new_target.theta, new_target.label, new_target.charging_port);
    targets.add_target(target);
    emit_target(target);
    selected_map_mode = 'STATIC';
    map_autosave : false;
    save_config(true);
  });

  socket.on('drive_to_target', async (targetID) => {
    if(robot_status == automation_application_msgs.RobotStatus.Constants.CHARGING 
        || robot_status == automation_application_msgs.RobotStatus.Constants.CHARGED ){
          countOneMeterByTime();
        }

    robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATING;
    drive_to_target(targetID);
  });

  socket.on('add_to_route', function (navID) {
    let pointSummary = routePlanner.addGoal(navID);
    emit_route_point(pointSummary.sequence, pointSummary.navID, pointSummary.routeID);
  });

  socket.on('remove_from_route', function (routeID) {
    routePlanner.removeGoal(routeID);
    emit_del_route_point(routeID);
  });

  socket.on('move_up_on_route', function (routeID) {
    let pointSummary = routePlanner.moveGoalUp(routeID);
    emit_del_route_point(routeID);
    emit_route_point(pointSummary.sequence, pointSummary.navID, pointSummary.routeID);
  });

  socket.on('move_down_on_route', function (routeID) {
    let pointSummary = routePlanner.moveGoalDown(routeID);
    emit_del_route_point(routeID);
    emit_route_point(pointSummary.sequence, pointSummary.navID, pointSummary.routeID);
  });

  socket.on('route_start', function (mode) {
    if(route_active){
      console.log("Route is running.");
      return;
    }
    console.log("Start route in " + mode + " mode");
    routePlanner.sequenceMode = mode;
    route_active = true;
    let goalNavID = routePlanner.getNextGoal();
    let actionGoalID = drive_to_target(goalNavID);
    let routeID;
    let sequence;
    let goalLabel;
    for (let i = 0; i < routePlanner.goalList.length; i++) {
      if (routePlanner.goalList[i].getNavID() == goalNavID) {
        routeID = routePlanner.goalList[i].getRouteID();
        sequence = i;
        goalLabel = targets.get_target_by_id(goalNavID).label;
      }
    }
    routePlanner.goalAccepted(routeID, actionGoalID);
    emit_route_status_update(goalLabel, sequence, routePlanner.goalList.length - 1);
  });

  socket.on('route_stop', function () {
    console.log("Stop route");
    stop_route();
  });

  socket.on('make_plan', function (points) {
    let startTarget = targets.get_target_by_id(Number(points.start));
    let endTarget = targets.get_target_by_id(Number(points.end));

    let start_point = new geometry_msgs.PoseStamped();
    let start_quaternion = math3d.Quaternion.Euler(0, 0, startTarget.theta * 180 / Math.PI);
    start_point.header.frame_id = "map";
    start_point.header.stamp.secs = Date.now() / 1000;
    start_point.pose.position.x = startTarget.x;
    start_point.pose.position.y = startTarget.y;
    start_point.pose.position.z = 0;
    start_point.pose.orientation.x = start_quaternion.x;
    start_point.pose.orientation.y = start_quaternion.y;
    start_point.pose.orientation.z = start_quaternion.z;
    start_point.pose.orientation.w = start_quaternion.w;

    let end_point = new geometry_msgs.PoseStamped();
    let end_quaternion = math3d.Quaternion.Euler(0, 0, endTarget.theta * 180 / Math.PI);
    end_point.header.frame_id = "map";
    end_point.header.stamp.secs = Date.now() / 1000;
    end_point.pose.position.x = endTarget.x;
    end_point.pose.position.y = endTarget.y;
    end_point.pose.position.z = 0;
    end_point.pose.orientation.x = end_quaternion.x;
    end_point.pose.orientation.y = end_quaternion.y;
    end_point.pose.orientation.z = end_quaternion.z;
    end_point.pose.orientation.w = end_quaternion.w;

    let req = new nav_msgs_service.GetPlan.Request();
    req.start = start_point;
    req.goal = end_point;

    serviceClient.call(req)
      .then((resp) => {
        current_plan = resp.plan;
        current_plan.header.frame_id = '/map';
        plan_publisher.publish(current_plan);
        emit_current_path(current_plan);
      });
  })

  socket.on('save_map_settings', save_map_settings);

  socket.on('em_stop', async()=> {
    moveBase_actionClient.cancelAllGoals();
    // let transform = tfTree.lookup_transform('map', 'base_link', 0);
    // console.log(transform);
    // let cp = await find_closest_charging_port(transform);
    // console.log("charging_port ID:"+cp);
    autoCharge_actionClient.cancelAllGoals(new actionlib_msgs.GoalID());

    
  });

  let scale_range = {
    min: argv.map_scale_min,
    max: argv.map_scale_max
  }
  socket.emit('set_scale_range', scale_range);

  targets.targets.forEach(emit_target);
  for (let i = 0; i < routePlanner.goalList.length; i++) {
   // emit_route_point(i, routePlanner.goalList[i].getNavID(), routePlanner.goalList[i].getRouteID());
  }

  socket.on('set_initialpose', setInitialPose);

  emit_map_update();
  update_map_filenames();

});

load_config();

server.listen(argv.port, function () {
  console.log('listening on *:' + argv.port);
});

rosnodejs.initNode('/rosnodejs')
  .then((rosNode) => {
    robot_pose_emit_timestamp = Date.now();
    zoom_publisher = rosNode.advertise('/map_zoom', std_msgs.Int16, default_publisher_options);

    cmd_vel_publisher = rosNode.advertise('/cmd_vel', geometry_msgs.Twist, default_publisher_options);

    robot_status_publisher = rosNode.advertise('/robot_status', automation_application_msgs.RobotStatus, default_publisher_options);

    argv.wait.forEach((wait_node) => {
      let node_name = "/" + wait_node + "/get_loggers"
      rosNode.waitForService(node_name)
        .then(() => {
          alerts.forEach((alert) => {
            if (alert._id == wait_node) {
              alert.update(wait_node, ALERT_OK, "Node " + node_name + " active");
            }
          })
          update_alerts(alerts)
        });
    })

    let pose_subscriber = rosNode.subscribe('/tf', 'tf2_msgs/TFMessage',
      (data) => {
        data.transforms.forEach(transform_stamped => {
          //console.log("transform: "+transform_stamped.header.frame_id);
          if (!tfTree.frame_id) {
            //tfTree = new TfListener.TfTree(transform_stamped.header.frame_id);
            tfTree = new TfListener.TfTree('map');
          }
          let transform = new TfListener.TfTransform(transform_stamped.header.frame_id, transform_stamped.child_frame_id, transform_stamped.header.stamp, transform_stamped.transform);
          tfTree.add_transform(transform, 0);
        });
        emit_robot_pose();
      }, {
      queueSize: 1,
      throttleMs: 0
    }
    );

    let map_metadata_subscriber = rosNode.subscribe('/map_metadata', 'nav_msgs/MapMetaData',
      (data) => {
        map_metadata = data;
      }, {
      queueSize: 1,
      throttleMs: 0
    }
    );

    let map_subscriber = rosNode.subscribe('/map_image/full/compressed', 'sensor_msgs/CompressedImage',
      (data) => {
        map_data_blob = data.data;
        emit_map_update();
      }, {
      queueSize: 1,
      throttleMs: 0
    }
    );

    setInterval(function () {
      let battery_voltage_subscriber = rosNode.subscribe('/scout_status', 'scout_msgs/ScoutStatus',
        (data) => {
          battery_voltage = data.battery_voltage;
          if (robot_status == automation_application_msgs.RobotStatus.Constants.CHARGING && battery_voltage <= MIN_VOLTAGE_THERSHOLD) {
            linearTravelByOdom(0.01, -0.05);
          }
          battery_voltage_subscriber.shutdown();
        }, {
        queueSize: 1,
        throttleMs: 0
      }
      );
    }, 60000);

    setInterval(function () {
      robot_status_publisher.publish({ status: robot_status });

    }, 500);

    let odom_subscriber = rosNode.subscribe('/odom', 'nav_msgs/Odometry',
      (data) => {
        odom_updated = true;
        odom[0] = data.pose.pose.position.x;
        odom[1] = data.pose.pose.position.y;
        var euler_angles = quaternionToEuler([
          data.pose.pose.orientation.x,
          data.pose.pose.orientation.y,
          data.pose.pose.orientation.z,
          data.pose.pose.orientation.w
        ]);

        odom[2] = euler_angles[0];
      }, {
      queueSize: 1,
      throttleMs: 0
    }
    );

    const nh = rosnodejs.nh;
    moveBase_actionClient = new rosnodejs.ActionClient({
      nh,
      type: 'move_base_msgs/MoveBase',
      actionServer: '/move_base'
    });
    console.log("Subscribe to move_base updates");
    autoCharge_actionClient = new rosnodejs.ActionClient({
      nh,
      type: 'apriltag_auto_recharge/ApriltagAutorecharge',
      actionServer: 'auto_recharge_action'
    });

    serviceClient = nh.serviceClient('/move_base/make_plan', nav_msgs_service.GetPlan);
    clearCostmapClient = nh.serviceClient('/move_base/clear_costmaps', std_srvs.Empty);

    plan_publisher = rosNode.advertise('/plan', nav_msgs.Path, default_publisher_options);

    initialpose_publisher = rosNode.advertise('/initialpose', geometry_msgs.PoseWithCovarianceStamped, default_publisher_options);

    autoCharge_actionClient._acInterface.on('result', async (data) => {
      console.log(data.status);
      if (data.status.status == 3) {
        robot_status = automation_application_msgs.RobotStatus.Constants.CHARGING;
          
        await sleepWithInterrupt(50*60*1000);
        console.log("after sleep timeout");
        robot_status = automation_application_msgs.RobotStatus.Constants.CHARGED;

        if(route_active){
          await countOneMeterByTime()();
          start_route();
        }
      }
      if (data.status.status == 4) {
        robot_status = automation_application_msgs.RobotStatus.Constants.CHARGING_ABORTED;
        let transform = tfTree.lookup_transform('map', 'base_link', 0);
        let cp = await find_closest_charging_port(transform);
        if(cp == -1)
          io.emit('no cp in route');
        else 
          drive_to_target(cp);     // change to charging port
      }
      if(data.status.status == 2){ // goal PREEMPTED
        route_active = false;
        robot_status = automation_application_msgs.RobotStatus.Constants.IDLE;
      }
    });

    moveBase_actionClient._acInterface.on('result', async (data) => {
      console.log("Received move_base: result\n", data);
      //let s = await checkCurTimeInTable();
      if (routePlanner.isRouteActive()) {
        switch (routePlanner.getMode()) {
          case RoutePlanner.SequenceModes.LOOP_RUN:
            break;
          case RoutePlanner.SequenceModes.SINGLE_RUN:
            break;
          case RoutePlanner.SequenceModes.BACK_AND_FORTH:
            break;
        }
        if (data.status.status == 3 || data.status.status == 4) {
          goalNavID = routePlanner.getNextGoal();
          if (robot_status == automation_application_msgs.RobotStatus.Constants.GOING_HOME) {
            if (data.status.status == 3) {
              robot_status = automation_application_msgs.RobotStatus.Constants.GO_HOME_SUCCEEDED;
            } else {
              robot_status = automation_application_msgs.RobotStatus.Constants.GO_HOME_ABORTED;
            }
            run_auto_charge(1);

          } else if (route_active && (await checkCurTimeInTable() || battery_voltage <= MIN_VOLTAGE_THERSHOLD)) {
            robot_status = automation_application_msgs.RobotStatus.Constants.GOING_HOME;
            console.log("GOING HOME");
            let transform = tfTree.lookup_transform('map', 'base_link', 0);
            
            let cp = await find_closest_charging_port(transform);
            console.log("cp: "+cp);
            if(cp == -1)
              io.emit('no_cp_in_route');
            else {
              drive_to_target(cp); // need to fill 0 for Charging Port number
              console.log("Going to target: "+cp);
            }
          } else if (goalNavID == -1) {
            console.log("End of route");
            routePlanner.stopRoute();
            robot_status = automation_application_msgs.RobotStatus.Constants.IDLE;
          } else {
            robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATING;
            if (routePlanner.goalList[goalNavID].type === 'navigate') {
              console.log(routePlanner.goalList[goalNavID]);
              let actionGoalID = drive_to_target(routePlanner.goalList[goalNavID].id);
              let routeID = routePlanner.goalList[goalNavID].id;
              let sequence = goalNavID;
              let goalLabel = targets.get_target_by_id(routePlanner.goalList[goalNavID].id).label;
              // routePlanner.goalAccepted(routeID, actionGoalID);   // what does this function does?
              emit_route_status_update(goalLabel, sequence, routePlanner.goalList.length - 1);
            }
            else {
              await handleNonNavigationAction(routePlanner.goalList[goalNavID]);
              let msg = new move_base_msgs.MoveBaseActionResult();
              msg.status.goal_id.id=0;
              msg.status.status = 3;
              moveBase_actionClient._acInterface.emit('result', msg);

            }
          }
        } else {  //goal cancel received

        }
      } else {
        if (data.status.status == 3) {
          emit_route_status_update("Finished", 0, 0);
          robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATION_SUCCEEDED;
        } else if (data.status.status == 4) {
          emit_route_status_update("Aborted", 0, 0);
          robot_status = automation_application_msgs.RobotStatus.Constants.NAVIGATION_ABORTED;
        } else {
          emit_route_status_update("CANCELLED", 0, 0);
          robot_status = automation_application_msgs.RobotStatus.Constants.IDLE;
        }
      }

    });
  })
  .catch((err) => {
    rosnodejs.log.error(err.stack);
  });

