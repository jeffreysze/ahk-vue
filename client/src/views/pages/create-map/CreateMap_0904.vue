<template>  
  <div class="ma-2">
  <v-btn v-if="mapping==false || socket_connected==false" class='mr-3' color="secondary" density="comfortable" :disabled="loading" @click="startMapping()">{{ $t("create-map.start-mapping") }}<v-icon>mdi-play-circle</v-icon></v-btn>
  <!--v-btn v-if="mapping==true" color="error" density="comfortable" @click="stopMapping()">Stop Mapping <v-icon>mdi-stop-circle</v-icon></v-btn-->
  <v-btn v-if="mapping==true && socket_connected==true" class="mr-3" color="error" @click="saveMap()">{{ $t("create-map.save-and-stop-mapping") }}<v-icon>mdi-floppy</v-icon></v-btn>
  <v-btn class="mx-1" color="grey-800" variant="outlined" density="comfortable" @click="changeCameraFeedStatus">
    <v-icon>mdi-camera</v-icon>
  </v-btn>
  </div>
  <VRow v-if="1" style="margin-bottom:200px">
    <v-col sm="12" md="9">
      <v-card>
        <v-card-title>
          <h4>{{ $t("create-map.create-map") }}: {{ map_name }}</h4>
        </v-card-title>
        <v-card-text>
          <div class="text-center">
            <div id="visualization-canvas"></div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>    
    <v-col v-if="camera_feed" sm="12" md="4" class="position-absolute">
      <v-responsive :aspect-ratio="16 / 9" class="border-lg border-primary bg-white h-100 w-100">
        <v-sheet class="bg-white h-100 w-100 text-align: center">
          <v-card height="100%">
            <v-card-title>
              <h4>{{ $t("create-map.camera") }}</h4>
            </v-card-title>
            <v-card-text>
              <div class="text-center">
                <div id="divCamera"></div>
              </div>
            </v-card-text>
          </v-card>
        </v-sheet>
      </v-responsive>
    </v-col>
    <v-col sm="12" md="3" style="background-color:#dadbf1; min-height: 175px">
      <v-card id="control-card" class="text-center">
        <v-card-title>
          <h4>{{ $t("create-map.joystick") }}</h4>
        </v-card-title>
        <v-card-text>
          <hr>
          <br>
          <div id="dragstartzone" @mousedown="startDrag" @mousemove="doDrag" @mouseup="stopDrag">
          </div>
          <div id="dragCircle" :style="dragCircleStyle"></div>
          <p>X: {{ joystick.vertical.toFixed(3) }}</p>
          <p>Y: {{ joystick.horizontal.toFixed(3) }}</p>
        </v-card-text>
      </v-card>
      <br>
      <v-card>
        <v-card-title class="text-center">
          <h4>{{ $t("create-map.logs") }}</h4>
        </v-card-title>
        <v-card-text>
          <p v-for="log in logs">{{ log }}</p>
        </v-card-text>
      </v-card>
    </v-col>

  </VRow>

  <v-snackbar v-model="snackbar.open" color="primary">
    <p>{{ snackbar.message }}</p>

    <template v-slot:actions>
      <v-btn color="white" variant="outlined" @click="snackbar.open = false">
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script>
import { io } from "socket.io-client";
import { ROSLIB, MJPEGCANVAS, THREE, ROS3D } from '@/utils/libs.js';
export default {
  data() {
    return {
      controlCard: null,
      io_address: "http://192.168.1.14:8000",
      rosbridge_address: 'ws://192.168.1.14:9090',
      camera_port: '8080',
      //io_address: "http://124.244.207.24:8000",
      //rosbridge_address: 'ws://124.244.207.24:9090',
      //camera_port: '9080',
      snackbar: {
        open: false,
        message: "",
      },
      socket_connected: false,
      socket: null,
      mapping: true,
      map_name: null,
      map_settings: {},
      camera_feed: false,
      panel: [0,1,2],
      sequence_mode: "1",
      added_to_plan: [],
      changes: [],
      connected: false,
      ros: null,
      logs: [],
      loading: true,
      dragging: false,
      navigating: false,
      x: 'no',
      y: 'no',
      dragCircleStyle: {
        margin: '0px',
        top: '0px',
        left: '0px',
        display: 'none',
        width: '75px',
        height: '75px',
      },
      // joystick valules
      joystick: {
        vertical: 0,
        horizontal: 0,
      },
      goal: null,
      action: {
        goal: {
          target_pose: {
            header: {
              seq: 0,
              stamp: { secs: 0, nsecs: 0 },
              frame_id: 'map'
            },
            pose: {
              position: { x: 0, y: 0, z: 0 },
              orientation: { x: 0, y: 0, z: 0, w: 0 }
            }
          }
        },
        feedback: {
          base_position: {
            header: { seq: 0, stamp: 0, frame_id: '/map' },
            pose: {
              position: { x: 0, y: 0, z: 0 },
              orientation: { x: 0, y: 0, z: 0, w: 0 }
            }
          }
        },
        result: { success: false },
        status: { status: 0, text: '' },
      },
      //publisher
      pubInterval: null,
      mapViewer: null,
      mapGridClient: null,
      interval: null,
    }
  },
  mounted(){
    var self = this;
    
    this.interval = setInterval(() => {     // to keep the connection alive
      if (this.ros != null && this.ros.inConnected) {
        this.ros.getNodes((data) => { }, (error) => { })
      }
    }, 10000);
    setTimeout(function(){
      self.startMapping();
    },1000);
  },
  unmounted() {
    var self = this;
    if (self.socket) {
      self.socket.disconnect();
      self.disconnect();
    }
    //this.ros.close()
  },
  methods: {
    changeCameraFeedStatus() {
      var self = this;
      if (self.camera_feed == false) {
        self.camera_feed = true;
        if (self.connected == true) {
          setTimeout(function () {
            self.setCamera();
          }, 500);
        }
      }
      else if (self.camera_feed == true) {
        self.camera_feed = false;
        if (self.connected == true) {
          self.unsetCamera();
        }
      }
    },
    startMapping(){
      var self = this;
      //var map_name = prompt('Please input name for new map:');
      //if(map_name!=null && map_name.trim()!=""){
        self.mapping = true;
       // self.map_settings = {
       //   map_static: false,
       //   map_slam: true,
       //   map_file: map_name,
       //   map_autosave: false
       // }

        self.connect();
        self.socket = io(self.io_address);
        self.socket.on('connect', function() {
          console.log('Connected to the server');
          self.socket_connected = true;
          self.socket.emit('get_current_config', 'SLAM');
          //self.socket.emit('start_mapping', self.map_settings);
        });
        self.socket.on('disconnect', function() {
          console.log('Disconnected from the server');
        });
        self.socket.on('create_slam_unsave', function(filename){
          self.mapping = true;
          self.snackbar.message = "Continuing SLAM with map name: " + '"'+filename+'"';
          self.map_name = filename.split(".yaml")[0];
          self.snackbar.open = true;
          self.map_settings = {
            map_static: false,
            map_slam: true,
            map_file: self.map_name,
            map_autosave: false
          }
        });
        self.socket.on('can_create_new_map', function(filename){
          let input_map_name = prompt('Please input name for new map:');
          if(input_map_name!=null && input_map_name.trim()!=""){
            self.map_name = input_map_name;
            self.map_settings = {
              map_static: false,
              map_slam: true,
              map_file: self.map_name,
              map_autosave: false
            }
            self.socket.emit('start_mapping', self.map_settings);
          }
          else {
            self.socket.disconnect();
            self.disconnect();
            self.mapping = false;
          }
        });
        self.socket.on('map_started', function(message) {
          console.log(message);
          self.mapping = true;
        });
        self.socket.on('map_stopped', function(message) {
          console.log(message);
          self.socket.disconnect();
          self.disconnect();
          self.mapping = false;
        });
        self.socket.on('map_saved', function(message) {
          console.log(message);
        });
        //self.connect();
      //}
      //else {
      //}
    },
    stopMapping(){
      var self = this;
      self.mapping = false;
      if (self.socket) {
        self.socket.emit('stop_mapping');
      }
    },
    saveMap(){
      var self = this;
      if (self.socket) {
        self.socket.emit('save_map', self.map_settings.map_file);
      }
    },
    emitTest(){
      var self = this;
      self.socket.emit('emit_test', 1679);
    },
    moveUp(index) {
      // Swap the current row with the row above it
      [this.added_to_plan[index], this.added_to_plan[index - 1]] = [this.added_to_plan[index - 1], this.added_to_plan[index]];
      this.storeChanges(); // Store the entire data sequence
    },
    moveDown(index) {
      // Swap the current row with the row below it
      [this.added_to_plan[index], this.added_to_plan[index + 1]] = [this.added_to_plan[index + 1], this.added_to_plan[index]];
      this.storeChanges(); // Store the entire data sequence
    },
    storeChanges() {
      // Store the entire data array in the changes array
      this.changes = [...this.added_to_plan];
      console.log(this.changes)
    },
    addToPlan(item) {
      // Add the item to the selectedItems array
      this.added_to_plan.push(item);
      console.log(this.added_to_plan);
    },
    removePlanPoint(index) {
      this.added_to_plan.splice(index, 1);

      console.log(this.added_to_plan);
    },
    deletePoint(index) {
      this.map_points.splice(index, 1);
    },
    connect: function () {
      this.loading = true
      this.ros = new ROSLIB.Ros({
        url: this.rosbridge_address
      })
      this.ros.on('connection', () => {
        this.logs.unshift((new Date()).toTimeString() + ' - Connected!')
        this.connected = true
        console.log('Connection to ROSBridge established!')
        if (this.camera_feed) this.setCamera()
        this.loading = false
        this.pubInterval = setInterval(this.publish, 100);
        this.setup3DViewer()
      })
      this.ros.on('error', (error) => {
        console.log('Something went wrong when trying to connect')
        this.logs.unshift((new Date()).toTimeString() + ` - Error: ${error}`)
      })
      this.ros.on('close', () => {
        this.logs.unshift((new Date()).toTimeString() + ' - Disconnected!')
        this.connected = false
        this.loading = false
        console.log('Connection to ROSBridge was closed!')
        if (this.camera_feed) this.unsetCamera()
        this.unset3DViewer()
        clearInterval(this.pubInterval)
        this.camera_feed = false
      })
    },
    publish: function () {
      let topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      })
      let message = new ROSLIB.Message({
        linear: { x: this.joystick.vertical, y: 0, z: 0, },
        angular: { x: 0, y: 0, z: this.joystick.horizontal, },
      })
      if (!this.navigating) {
        topic.publish(message)
      }
    },
    disconnect: function () {
      this.ros.close()
    },
    setCamera: function () {
      let without_ws = this.rosbridge_address.split('ws://')[1]
      console.log(without_ws)
      let domain = without_ws.split('/')[0].split(':')[0] + ':' + this.camera_port
      console.log(domain)
      let host = domain // + '/cameras'
      let viewer = new MJPEGCANVAS.Viewer({
        divID: 'divCamera',
        host: host,
        width: 320,
        height: 240,
        topic: '/camera/color/image_raw',
        ssl: false,
      })
    },
    unsetCamera: function () {
      document.getElementById('divCamera').innerHTML = ''
    },
    setup3DViewer: function () {
      this.viewer = new ROS3D.Viewer({
        background: '#cccccc',
        divID: 'visualization-canvas',
        width: 800,
        height: 600,
        antialias: true,
      })
      this.viewer.renderer.domElement.addEventListener('click', this.mouseClickHandler)
      this.viewer.cameraControls.userRotateSpeed = 0
      this.viewer.cameraControls.autoRotate = false
      this.viewer.cameraControls.autoRotateSpeed = 0
      this.viewer.camera.position.x = 0;
      this.viewer.camera.position.y = 0;
      this.viewer.camera.position.z = 20;
      //            this.viewer.camera.position.set(tf.translation.x, tf.translation.y, 20)
      this.viewer.camera.up = new THREE.Vector3(0, 0, -1)
      this.viewer.camera.lookAt(0, 0, 0)

      this.viewer.camera.updateProjectionMatrix()

      this.viewer.cameraControls.update()
      this.viewer.camera.updateMatrixWorld()
      console.log(this.viewer.cameraControls)

      this.tfClient = new ROSLIB.TFClient({
        ros: this.ros,
        fixedFrame: '/map',
        angularThres: 0.01,
        transThres: 0.01,
        rate: 3.0
      })

      this.mapClient = new ROS3D.OccupancyGridClient({
        ros: this.ros,
        rootObject: this.viewer.scene,
        topic: '/map',
        tfClient: this.tfClient,
        continuous: 'true'
      })
      this.tfClient.subscribe('/base_link', this.subsTF);

      this.laserScanClient = new ROS3D.LaserScan({
        ros: this.ros,
        rootObject: this.viewer.scene,
        topic: '/scan',
        tfClient: this.tfClient,
        material: { size: 0.2, color: 0x00FF00 }
      })
      // Add a grid.
      this.viewer.addObject(new ROS3D.Grid({
        color: '#0181c4',
        cellSize: 1.0,
        num_cells: 20,
      }))

      // Track robot pose with an arrow
      this.arrowNode = new ROS3D.SceneNode({
        tfClient: this.tfClient,
        frameID: '/base_link',
        object: new ROS3D.Arrow({
          length: 1, shaftDiameter: 0.2, headDiameter: 0.5, headLength: 0.8,
          material: new ROS3D.makeColorMaterial(1, 0, 0, 0.5)
        }),
      });

      this.viewer.scene.add(this.arrowNode);


      /*            // Setup the URDF client.
                  this.urdfClient = new ROS3D.UrdfClient({
                      ros: this.ros,
                      param: 'robot_description',
                      tfClient: this.tfClient,
                      // We use "path: location.origin + location.pathname"
                      // instead of "path: window.location.href" to remove query params,
                      // otherwise the assets fail to load
                      path: location.origin + location.pathname,
                      rootObject: this.viewer.scene,
                      loader: ROS3D.COLLADA_LOADER_2
                  })
      */
    },
    unset3DViewer: function () {
      document.getElementById('visualization-canvas').innerHTML = ''
    },
    sendCommand: function () {
      let topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      })
      let message = new ROSLIB.Message({
        linear: { x: 1, y: 0, z: 0, },
        angular: { x: 0, y: 0, z: 0.5, },
      })
      topic.publish(message)
    },
    startDrag() {
      this.dragging = true
      this.x = this.y = 0
      this.controlCard = document.getElementById('control-card');
      this.controlCard.addEventListener('mouseup', this.stopDrag);
      document.body.addEventListener('mouseup', this.stopDrag);
      document.addEventListener('mouseleave', this.stopDrag);
    },
    stopDrag() {
      this.dragging = false
      this.x = this.y = 'no'
      this.dragCircleStyle.display = 'none'
      this.resetJoystickVals()
      this.controlCard.removeEventListener('mouseleave', this.stopDrag);
      this.controlCard.removeEventListener('mouseup', this.stopDrag);
      this.controlCard = null
      document.body.removeEventListener('mouseup', this.stopDrag);
      document.removeEventListener('mouseleave', this.stopDrag);
    },
    doDrag(event) {
      if (this.dragging) {
        this.x = event.offsetX
        this.y = event.offsetY
        let ref = document.getElementById('dragstartzone')
        this.dragCircleStyle.display = 'inline-block'

        let minTop = ref.offsetTop - parseInt(this.dragCircleStyle.height) / 2
        let maxTop = minTop + 200
        let top = this.y + minTop
        this.dragCircleStyle.top = `${top}px`

        let minLeft = ref.offsetLeft - parseInt(this.dragCircleStyle.width) / 2
        let maxLeft = minLeft + 200
        let left = this.x + minLeft
        this.dragCircleStyle.left = `${left}px`

        this.setJoystickVals()
      }
    },
    subsTF(tf) {
      // Update the camera position to match the base_link frame
      this.viewer.scene.position.x = -tf.translation.x
      this.viewer.scene.position.y = -tf.translation.y
    },
    mouseClickHandler(event) {
      let rect = event.target.getBoundingClientRect()
      let mouseX = -(event.clientX - rect.left - rect.width / 2)
      let mouseY = -(event.clientY - rect.top - rect.height / 2)

      let dpp = this.viewer.camera.position.z * Math.tan(Math.PI * (this.viewer.camera.fov / 2) / 180) / (rect.height / 2)
      console.log(dpp)
      console.log("X = " + dpp * mouseY + ", Y = " + dpp * mouseX)

      let mx = dpp * mouseY + this.viewer.camera.position.x - this.viewer.scene.position.x
      let my = dpp * mouseX + this.viewer.camera.position.y - this.viewer.scene.position.y
      console.log("MX = " + mx + ", MY = " + my)
      if (this.startAddPoint == true) {
        this.handleImageClick(mx, my);
      }
      //let vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
    },
    setJoystickVals() {
      this.joystick.vertical = -1 * ((this.y / 200) - 0.5)
      this.joystick.horizontal = -1 * ((this.x / 200) - 0.5)
    },
    resetJoystickVals() {
      this.joystick.vertical = 0
      this.joystick.horizontal = 0
    },
  }
}
</script>

<style type="text/css">
#dragstartzone {
  text-align: center;
  position: relative;
  display: inline-block;
  width: 200px;
  height: 200px;
  border: 1px solid #333;
  border-radius: 50%;
  z-index: 10;
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
}

#dragCircle {
  position: absolute;
  z-index: 9;
  border: 1px solid transparent;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 30%);
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
}

#dragCircle:hover {
  background-color: lightcoral;
}
</style>
