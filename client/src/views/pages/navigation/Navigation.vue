<script setup>
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-select 
        label="Select Map:" 
        :items="maps" 
        variant="solo" 
        item-title="label" 
        item-value="id" 
        v-model="map_select" 
        @update:modelValue="onMapSelectChange"
      >
      </v-select>
    </v-col>
  </v-row>
  <VRow>
    <VCol sm="12" md="9">
      <h2>{{ map_label }}</h2>
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <v-btn
        class="mx-1"
        @click="startDrawing"
        :disabled="startAddPoint || connected==false"
      >
        Add Point
      </v-btn>
      <v-btn class="mx-1" :disabled="startAddPoint || connected==false">Edit Point</v-btn>
      <v-btn class="mx-1" @click="add_plan_dialog = true" :disabled="startAddPoint || connected==false">Add Plan</v-btn>
      <v-btn class="mx-1" :disabled="startAddPoint || connected==false">Localize</v-btn>
      
      <v-btn class="mx-1" color="grey-800" variant="outlined" @click="changeCameraFeedStatus">
        <v-icon>mdi-camera</v-icon>
      </v-btn>

      <v-btn v-if="connected" color="error" variant="flat" :disabled="loading" @click="disconnect">DISConnect!</v-btn>
            <v-btn v-else color="success" variant="flat" :disabled="loading" @click="connect">Connect!</v-btn>
    </VCol>
  </VRow>
  <VRow style="margin-bottom:200px">
    <v-col sm="12" md="9">
      <v-card>
        <v-card-title>
          <h4>Robot Model</h4>
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
              <h4>Camera</h4>
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
      <v-card class="text-center">
        <v-card-title>
          <h4>Joystick</h4>
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
          <h4>Logs</h4>
        </v-card-title>
        <v-card-text>
          <p v-for="log in logs">{{ log }}</p>
        </v-card-text>
      </v-card>
    </v-col>

  </VRow>
  <v-row class="bottom-div">
    <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
      :headers="map_headers" :items="map_points">
      <template v-slot:item="{ item, index }">
        <tr>
          <td>{{ item.x }}</td>
          <td>{{ item.y }}</td>
          <td>{{ item.theta }}</td>
          <td>{{ item.label }}</td>
          <td>
            <v-btn class="mx-1" color="success"><v-icon size="large">mdi-forward</v-icon></v-btn>
            <v-btn class="mx-1" color="error" @click="deletePoint(index)"><v-icon
                size="large">mdi-delete</v-icon></v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-row>
  <v-dialog v-model="add_plan_dialog" max-width="700">
    <template v-slot:default="{ isActive }">
      <v-card rounded="lg">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h5  ps-2">
            Add Plan
          </div>
          <v-btn icon="mdi-close" variant="text" @click="isActive.value = false">
          </v-btn>
        </v-card-title>

        <v-divider class="mb-4"></v-divider>

        <v-card-text>
          <v-expansion-panels v-model="panel" multiple>
            <v-expansion-panel>
              <v-expansion-panel-title expand-icon="mdi-menu-down">
                <h3>Route Plan</h3>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
                  :headers="add_plan_headers" :items="added_to_plan">
                  <template v-slot:item="{ item, index }">
                    <tr>
                      <td>[{{ item.x }},{{ item.y }},{{ item.theta }}]</td>
                      <td>{{ item.label }}</td>
                      <td>
                        <v-btn v-if="index > 0" @click="moveUp(index)" color="info" class="mx-1">
                          <v-icon size="large">mdi-arrow-up</v-icon>
                        </v-btn>
                        <v-btn v-if="index < added_to_plan.length - 1" @click="moveDown(index)" color="grey-500"
                          class="mx-1">
                          <v-icon size="large">mdi-arrow-down</v-icon>
                        </v-btn>
                        <v-btn @click="removePlanPoint(index)" color="error" class="mx-1">
                          <v-icon size="large">mdi-delete</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title expand-icon="mdi-menu-down">
                <h3>Defined Poses</h3>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
                  :headers="defined_poses_headers" :items="map_points">
                  <template v-slot:item="{ item, index }">
                    <tr>
                      <td>[{{ item.x }},{{ item.y }},{{ item.theta }}]</td>
                      <td>{{ item.label }}</td>
                      <td>
                        <v-btn @click="addToPlan(item)" color="success">
                          <v-icon size="large">mdi-plus</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-title expand-icon="mdi-menu-down">
                <h3>Sequence Mode</h3>

              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-radio-group v-model="sequence_mode">
                  <v-radio label="Single Run" value="1"></v-radio>
                  <v-radio label="Loop Run" value="2"></v-radio>
                  <v-radio label="Back and Forth" value="3"></v-radio>
                </v-radio-group>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

        </v-card-text>

        <v-divider class="mt-2"></v-divider>

        <v-card-actions class="my-2 d-flex justify-end">
          <v-btn class="text-none" rounded="xl" text="Discard" @click="isActive.value = false;"></v-btn>

          <v-btn class="text-none" color="primary" rounded="xl" text="Save" variant="flat"
            @click="isActive.value = false"></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <v-dialog v-model="confirmAddPointDialog" max-width="500">
      <v-card rounded="lg">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h5  ps-2">
            Confirm Add Point
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeConfirmAddPoint()">
          </v-btn>
        </v-card-title>
        <v-divider class="mb-4"></v-divider>
        <v-card-text>
          <v-table>
            <tr>
              <th class="text-left">
                X[m]
              </th>
              <td>
                {{ addPointFinal.x }}
              </td>
            </tr>
            <tr>
              <th class="text-left">
                Y[m]
              </th>
              <td>
                {{ addPointFinal.y }}
              </td>
            </tr>
            <tr>
              <th class="text-left">
                Theta[°]
              </th>
              <td>
                {{ addPointFinal.theta }}
              </td>
            </tr>
            <tr>
              <th class="text-left">
                Label
              </th>
              <td>
                <v-text-field 
                  variant="outlined"
                  density="compact"
                  v-model="addPointFinal.label"
                  hide-details
                >
                </v-text-field>
              </td>
            </tr>
          </v-table>
        </v-card-text>

        <v-divider class="mt-2"></v-divider>

        <v-card-actions class="my-2 d-flex justify-end">
          <v-btn class="text-none" rounded="xl" text="Discard" @click="closeConfirmAddPoint()"></v-btn>

          <v-btn class="text-none" color="primary" rounded="xl" text="Confirm" variant="flat"
            @click="confirmAddPoint"></v-btn>
        </v-card-actions>
      </v-card>
  </v-dialog>
  <v-snackbar
      v-model="snackbar.open"
      color="primary"
  >
    <p>{{ snackbar.message }}</p>

    <template v-slot:actions>
      <v-btn
        variant="text"
        color="white"
        @click="snackbar.open = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>


<style>
#nipple_0_0 {
  position: relative !important;
  top: 75px !important;
}

.bottom-div {
  bottom: 0;
  position: fixed;
  width: 100%;
  min-height: 200px;
  background-color: white;
  border: #dadbf1 solid 3px;
}

.bottom-table {
  min-height: 200px;
  max-height: 200px;
  width: 100%;
  min-width: 80%;
}

.v-table th {
  text-align: start !important;
}
</style>
<script>
import { EventEmitter2, createjs, ROSLIB, ROS2D,MJPEGCANVAS, THREE, ROS3D } from '@/utils/libs.js';
export default {
  data() {
    return {
      snackbar: {
        open: false,
        message: "",
      },
      maps: [
        { label: "Map 1 (Public)", id: "map1", ros_address: 'ws://124.244.207.24:9090', camera_port: '9080'},
        { label: "Map 2 (Local)", id: "map2", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080'},
      ],
      map_select: "map1",
      map_label: "Map 1 (Public)",
      camera_feed: false,
      add_plan_dialog: false,
      map_headers: [
        { title: 'X[m]', key: 'x' },
        { title: 'Y[m]', key: 'y' },
        { title: 'Theta[°]', key: 'theta' },
        { title: 'Label', key: 'label' },
        { title: 'Actions', key: 'actions' },
      ],
      add_plan_headers: [
        { title: 'Pose[x,y,theta]', key: 'pose' },
        { title: 'Label', key: 'label' },
        { title: 'Edit', key: 'actions' },
      ],
      defined_poses_headers: [
        { title: 'Pose[x,y,theta]', key: 'pose' },
        { title: 'Label', key: 'label' },
        { title: 'Add to Route', key: 'actions' },
      ],
      confirmAddPointDialog: false,
      startAddPoint: false,
      showOverlay: false,
      showArrow: false,
      selectStartPoint: false,
      selectEndPoint: false,
      addPointFinal: {
        x: null,
        y: null,
        theta: null,
        label: "",
      },
      startPoint: {
        x: null,
        y: null,
      },
      endPoint: {
        x: null,
        y: null,
      },
      theta: null,
      arrowStartX: 0,
      arrowStartY: 0,
      arrowEndX: 0,
      arrowEndY: 0,
      panel: [0, 1, 2],
      sequence_mode: "1",
      added_to_plan: [],
      data: [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
        { name: 'Alice', age: 28 },
      ],
      map_points: [
        {
          x: 9.07,
          y: -0.55,
          theta: -90.00,
          label: "Pt1",
        },
        {
          x: 10.43,
          y: -24.02,
          theta: -90.00,
          label: "Pt2",
        },
        {
          x: 10.28,
          y: -44.29,
          theta: -90.00,
          label: "Pt3",
        },
        {
          x: 9.92,
          y: -56.84,
          theta: 180.00,
          label: "Pt4",
        },
        {
          x: -7.36,
          y: -57.90,
          theta: 180.00,
          label: "Pt5",
        },
        {
          x: -15.73,
          y: -39.91,
          theta: 90.00,
          label: "Pt6",
        },
        {
          x: -16.05,
          y: -9.24,
          theta: 0.00,
          label: "Pt7",
        },
        {
          x: -10.09,
          y: 17.96,
          theta: 0.00,
          label: "Pt8",
        },
        {
          x: 7.90,
          y: 17.78,
          theta: 0.00,
          label: "Pt9",
        },
        {
          x: 9.25,
          y: 5.75,
          theta: -90.00,
          label: "Pt10",
        },
        {
          x: 1.00,
          y: 0.05,
          theta: 0.00,
          label: "Charge",
        },
        {
          x: 7.05,
          y: -16.74,
          theta: 90.57,
          label: "k",
        }
      ],
      changes: [],
      connected: false,
      ros: null,
      logs: [],
      loading: false,
      //rosbridge_address: 'ws://192.168.1.14:9090',
      rosbridge_address: 'ws://124.244.207.24:9090',
      port: '9090',
      camera_port: '9080',
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
  mounted() {
    this.interval = setInterval(() => {     // to keep the connection alive
      if (this.ros != null && this.ros.inConnected) {
        this.ros.getNodes((data) => { }, (error) => { })
      }
    }, 10000);
  },
  methods: {
    changeCameraFeedStatus(){
      var self = this;
      if(self.camera_feed==false){
        self.camera_feed = true;
        if(self.connected==true){
          setTimeout(function(){
            self.setCamera();
          },500);
        }
      }
      else if(self.camera_feed==true){
        self.camera_feed = false;
        if(self.connected==true){
          self.unsetCamera();
        }
      }
    },
    onMapSelectChange(v) {
      var self = this;
      let mapObject = self.maps.filter(map => map.id === v)[0];
      self.map_label = mapObject.label;
      if(self.connected){
        self.ros.close()
      }
      self.rosbridge_address= mapObject.ros_address;
      self.camera_port= mapObject.camera_port;
    },
    startDrawing() {
      this.startAddPoint = true;
      this.snackbar.message = "You are Adding Point ...";
      this.snackbar.open = true;
      this.unsetCamera();
      this.camera_feed = false;
    },
    handleImageClick(x,y) {
      var self = this;
      if(self.startAddPoint){
        if(self.selectStartPoint == false){
          self.startPoint.x = x;
          self.startPoint.y = y;
          self.selectStartPoint = true;
          self.showOverlay = true;
          self.snackbar.open = false;
          self.snackbar.message = "Point location is selected. Please select direction.";
          self.snackbar.open = true;
        }
        else if(self.selectEndPoint == false){
          self.endPoint.x = x;
          self.endPoint.y = y;
          self.addPointFinal.x = self.startPoint.x.toFixed(2);
          self.addPointFinal.y = self.startPoint.y.toFixed(2);
          self.showOverlay = false;
          self.startAddPoint = false;
          self.selectEndPoint = false;
          self.selectStartPoint = false;
          let deltaY = self.endPoint.y - self.startPoint.y;
          let deltaX = self.endPoint.x - self.startPoint.x;
          self.theta = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
          if(self.theta!=0 && self.theta!=180) {
            self.theta*=-1;
          }
          self.addPointFinal.theta = self.theta.toFixed(2);
          self.openConfirmAddPoint();
          }
      }
    },
    openConfirmAddPoint (){
      var self = this;
      self.confirmAddPointDialog = true;
    },
    closeConfirmAddPoint(){
      var self = this;
      self.confirmAddPointDialog = false;
      self.addPointFinal.x = null;
      self.addPointFinal.y = null;
      self.addPointFinal.theta = null;
      self.addPointFinal.label = "";
    },
    confirmAddPoint(){
      var self = this;console.log(self.addPointFinal);
      self.map_points.push({
        x: self.addPointFinal.x,
        y: self.addPointFinal.y,
        theta: self.addPointFinal.theta,
        label: self.addPointFinal.label
      });
      self.snackbar.open = true;
      self.snackbar.message = "New point is added.";
      self.confirmAddPointDialog = false;
      self.addPointFinal.x = null;
      self.addPointFinal.y = null;
      self.addPointFinal.theta = null;
      self.addPointFinal.label = "";
      self.confirmAddPointDialog = false;
    },
    addToPlanRoutes(item) {
      console.log(item);
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
        if(this.camera_feed) this.setCamera()
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
        if(this.camera_feed) this.unsetCamera()
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
    },
    stopDrag() {
      this.dragging = false
      this.x = this.y = 'no'
      this.dragCircleStyle.display = 'none'
      this.resetJoystickVals()
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
      if(this.startAddPoint==true){
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
    commandWaypoint: function (x, y, p, q, r, s) {
      let actionClient = new ROSLIB.ActionClient({
        ros: this.ros,
        serverName: '/move_base',
        actionName: 'move_base_msgs/MoveBaseAction'
      })
      let currentTime = new Date()
      let secs = Math.floor(currentTime.getTime() / 1000);
      let nsecs = Math.round(1000000000 * (currentTime.getTime() / 1000 - secs));
      this.goal = new ROSLIB.Goal({
        actionClient: actionClient,
        goalMessage: {
          target_pose: {
            header: {
              seq: 0,
              stamp: { secs: secs, nsecs: nsecs },
              frame_id: 'map'
            },
            pose: {
              position: { x: x, y: y, z: 0 },
              orientation: { x: p, y: q, z: r, w: s }
            }
          }
        }
      })

      this.goal.on('status', (status) => {
        this.action.status = status
      })

      this.goal.on('feedback', (feedback) => {
        this.action.feedback = feedback
      })

      this.goal.on('result', (result) => {
        this.action.result = result
        this.navigating = false
      })
      this.navigating = true
      this.goal.send()
    },
  },
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