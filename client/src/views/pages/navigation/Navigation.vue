<template>
  <div v-if="slam_stopped == false">
    <v-row>
      <v-col>
        <v-col col="12">
          <v-card>
            <v-card-title>
              <h4 class="text-wrap" style="color:red"><v-icon>mdi-alert-box</v-icon> Robot is under SLAM of Map: "{{ slam_filename }}" that is without map saved. Please go to Create Map to finish process.</h4>
            </v-card-title>
          </v-card>
        </v-col>
      </v-col>
    </v-row>
  </div>    
  <div v-else-if="slam_stopped == true">
    <v-row>
      <v-col cols="12">
        <v-select :label="headerLocale('select_map')" :items="maps" variant="solo" item-title="label" item-value="id" v-model="map_select"
          @update:modelValue="onMapSelectChange">
        </v-select>
      </v-col>
    </v-row>
    <VRow>
      <VCol sm="12" md="9">
        <h2>{{ map_select }}</h2>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        <v-btn class="mx-1" @click="startDrawing('add_point')" :disabled="startAddPoint || connected == false || startLocalize ">
          {{ $t("navigation.add-point.btn") }}
        </v-btn>
        <!--v-btn class="mx-1" :disabled="startAddPoint || connected == false|| startLocalize ">
          {{ $t("navigation.edit-point") }}
        </v-btn-->
        <v-btn class="mx-1" @click="add_plan_dialog = true" :disabled="startAddPoint || connected == false || startLocalize ">
          {{ $t("navigation.add-plan.btn") }}
        </v-btn>
        <v-btn class="mx-1" :disabled="startAddPoint || connected == false || startLocalize " @click="startDrawing('localize')">
          {{ $t("navigation.localize.btn") }}
        </v-btn>
        <v-btn class="mx-1" color="grey-800" variant="outlined" @click="changeCameraFeedStatus">
          <v-icon>mdi-camera</v-icon>
        </v-btn>

        <v-btn v-if="connected" color="error" variant="flat" :disabled="loading"
          @click="stopNavigate(); disconnect();">{{ $t("navigation.disconnect") }}</v-btn>
        <v-btn v-else color="success" variant="flat" :disabled="loading"
          @click="startNavigate(); connect();">{{ $t("navigation.connect") }}</v-btn>
      </VCol>
    </VRow>
    <VRow style="margin-bottom:200px">
      <v-col sm="12" md="9">
        <v-card>
          <v-card-title>
            <h4>{{ $t("navigation.robot-model") }}</h4>
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
                <h4>{{ $t("navigation.camera") }}</h4>
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
            <h4>{{ $t("navigation.joystick") }}</h4>
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
            <h4>{{ $t("navigation.logs") }}</h4>
          </v-card-title>
          <v-card-text>
            <p v-for="log in logs">{{ log }}</p>
          </v-card-text>
        </v-card>
      </v-col>

    </VRow>
    <v-row class="bottom-div">
      <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
        :headers="headerLocale('map_headers')" :items="map_points">
        <template v-slot:item="{ item, index }">
          <tr>
            <td>{{ item.id }}</td>
            <td>{{ item.x }}</td>
            <td>{{ item.y }}</td>
            <td>{{ item.theta }}</td>
            <td>{{ item.label }}</td>
            <!--td>
              <v-btn class="mx-1" color="success" @click="commandWaypoint(item.x, item.y, item.theta)"><v-icon
                  size="large">mdi-forward</v-icon></v-btn>
              <v-btn class="mx-1" color="error" @click="deletePoint(index)"><v-icon
                  size="large">mdi-delete</v-icon></v-btn>
            </td-->
            <td>
              <v-btn class="mx-1" color="success" @click="driveToTarget(item.id)"><v-icon
                  size="large">mdi-forward</v-icon></v-btn>
              <v-btn class="mx-1" color="error" @click="deleteTarget(item.id)"><v-icon
                  size="large">mdi-delete</v-icon></v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-row>
  </div>
  <v-dialog v-model="add_plan_dialog" max-width="700">
    <template v-slot:default="{ isActive }">
      <v-card rounded="lg">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h5  ps-2">
            {{ $t("navigation.add-plan.header") }}
          </div>
          <v-btn icon="mdi-close" variant="text" @click="isActive.value = false">
          </v-btn>
        </v-card-title>

        <v-divider class="mb-4"></v-divider>

        <v-card-text>
          <v-expansion-panels v-model="panel" multiple>
            <v-expansion-panel>
              <v-expansion-panel-title expand-icon="mdi-menu-down">
                <h3>{{ $t("navigation.add-plan.route-plan") }}</h3>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
                  :headers="headerLocale('add_plan_headers')" :items="added_to_plan">
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
                <h3>{{ $t("navigation.add-plan.defined-poses") }}</h3>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-data-table items-per-page="-1" :hide-default-footer="true" fixed-header class="bottom-table"
                  :headers="headerLocale('defined_poses_headers')" :items="map_points">
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
                <h3>{{ $t("navigation.add-plan.sequence-mode") }}</h3>

              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-radio-group v-model="sequence_mode">
                  <v-radio :label="sequenceLocale('single')" value="1"></v-radio>
                  <v-radio :label="sequenceLocale('loop')" value="2"></v-radio>
                  <v-radio :label="sequenceLocale('bnf')" value="3"></v-radio>
                </v-radio-group>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

        </v-card-text>

        <v-divider class="mt-2"></v-divider>

        <v-card-actions class="my-2 d-flex justify-end">
          <v-btn class="text-none" rounded="xl" text="" @click="isActive.value = false;">
            {{ $t('navigation.add-plan.discard-btn') }}
          </v-btn>

          <v-btn class="text-none" color="primary" rounded="xl" text="Save" variant="flat" @click="isActive.value = false">
            {{ $t('navigation.add-plan.save-btn') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
  <v-dialog v-model="confirmAddPointDialog" max-width="500">
    <v-card rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center">
        <div v-if='startAddPoint' class="text-h5  ps-2">
          {{ $t("navigation.add-point.confirm.header") }}
        </div>
        <div v-else-if='startLocalize' class="text-h5  ps-2">
          {{ $t("navigation.localize.confirm.header") }}
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeConfirmAddPoint()">
        </v-btn>
      </v-card-title>
      <v-divider class="mb-4"></v-divider>
      <v-card-text>
        <v-table>
          <tr>
            <th class="text-left">
              {{ $t("navigation.add-point.confirm.x") }}
            </th>
            <td>
              {{ addPointFinal.x }}
            </td>
          </tr>
          <tr>
            <th class="text-left">
              {{ $t("navigation.add-point.confirm.y") }}
            </th>
            <td>
              {{ addPointFinal.y }}
            </td>
          </tr>
          <tr>
            <th class="text-left">
              {{ $t("navigation.add-point.confirm.theta") }}
            </th>
            <td>
              {{ addPointFinal.theta }}
            </td>
          </tr>
          <tr v-if="startAddPoint">
            <th class="text-left">
              {{ $t("navigation.add-point.confirm.label") }}
            </th>
            <td>
              <v-text-field variant="outlined" density="compact" v-model="addPointFinal.label" hide-details>
              </v-text-field>
            </td>
          </tr>
        </v-table>
      </v-card-text>

      <v-divider class="mt-2"></v-divider>

      <v-card-actions class="my-2 d-flex justify-end">
        <v-btn class="text-none" rounded="xl" @click="closeConfirmAddPoint()">{{ $t("navigation.add-point.confirm.discard-btn") }}</v-btn>
        <v-btn class="text-none" color="primary" rounded="xl" variant="flat" @click="confirmAddPoint">
          {{ $t("navigation.add-point.confirm.confirm-btn") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-snackbar v-model="snackbar.open" color="primary">
    <p>{{ snackbar.message }}</p>

    <template v-slot:actions>
      <v-btn variant="text" color="white" @click="snackbar.open = false">
        {{ $t("snackbar.close")}}
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
import { io } from "socket.io-client";
import { ROSLIB, MJPEGCANVAS, THREE, ROS3D } from '@/utils/libs.js';
export default {
  data() {
    return {
      //io_address: "http://192.168.1.14:8000",
      //rosbridge_address: 'ws://192.168.1.14:9090',
      //camera_port: '8080',
      io_address: "http://124.244.207.24:8000",
      rosbridge_address: 'ws://124.244.207.24:9090',
      camera_port: '9080',
      snackbar: {
        open: false,
        message: "",
      },
      socket: null,
      sources: [
        { label: "Local (192.xxx.xxx.xxx)", id: "local", ros_address: 'ws://192.168.1.14:8090', camera_port: '8080' },
        { label: "Public (124.xxx.xxx.xxx)", id: "public", ros_address: 'ws://124.244.207.24:9090', camera_port: '9080' },
      ],
      maps: [
        { label: "bookstore", id: "bookstore", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp2", id: "Mp2", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp3", id: "Mp3", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp4", id: "Mp4", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp55", id: "Mp55", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp6", id: "Mp6", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "Mp7", id: "Mp7", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "mp8", id: "mp8", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "test4", id: "test4", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },
        { label: "test5", id: "test5", ros_address: 'ws://192.168.1.14:9090', camera_port: '8080' },

      ],
      ros_source: 'local',
      map_select: '',
      slam_stopped: true,
      slam_filename : "",
      map_label: "",
      camera_feed: false,
      add_plan_dialog: false,
      map_headers: [
        { title: 'id', key: 'id' },
        { title: 'X[m]', key: 'x' },
        { title: 'Y[m]', key: 'y' },
        { title: 'Theta[°]', key: 'theta' },
        { title: 'Label', key: 'label' },
        { title: 'Actions', key: 'actions' },
      ],
      map_headers_ch: [
        { title: 'ID', key: 'id' },
        { title: 'X[m]', key: 'x' },
        { title: 'Y[m]', key: 'y' },
        { title: 'Theta[°]', key: 'theta' },
        { title: '标记', key: 'label' },
        { title: '操作', key: 'actions' },
      ],
      add_plan_headers: [
        { title: 'Pose[x,y,theta]', key: 'pose' },
        { title: 'Label', key: 'label' },
        { title: 'Edit', key: 'actions' },
      ],
      add_plan_headers_ch: [
        { title: '位置[x,y,theta]', key: 'pose' },
        { title: '标记', key: 'label' },
        { title: '编辑', key: 'actions' },
      ],
      defined_poses_headers: [
        { title: 'Pose[x,y,theta]', key: 'pose' },
        { title: 'Label', key: 'label' },
        { title: 'Add to Route', key: 'actions' },
      ],
      defined_poses_headers_ch: [
        { title: '位置[x,y,theta]', key: 'pose' },
        { title: '标记', key: 'label' },
        { title: '添加至路线', key: 'actions' },
      ],
      confirmAddPointDialog: false,
      startAddPoint: false,
      startLocalize: false,
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
      map_points: [
        {
          "id": 1,
          "x": -2.55,
          "y": -0.35,
          "theta": -1.59,
          "label": "538"
        },
        {
          "id": 2,
          "x": -2.34,
          "y": -5.10,
          "theta": 1.57,
          "label": "2"
        },
        {
          "id": 3,
          "x": -3.01,
          "y": 3.05,
          "theta": -1.57,
          "label": "corridor"
        },
        {
          "id": 4,
          "x": -0.73,
          "y": -0.41,
          "theta": -0.46,
          "label": "0"
        },
        {
          "id": 5,
          "x": 0.66,
          "y": -3.41,
          "theta": 1.55,
          "label": "test"
        },
        {
          "id": 6,
          "x": "-2.54",
          "y": "5.40",
          "theta": "-0.91",
          "label": "Pt11"
        },
        {
          "id": 7,
          "x": "4.61",
          "y": "-1.05",
          "theta": "-3.58",
          "label": "current"
        }
      ],
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
  mounted() {
    var self = this;
    this.interval = setInterval(() => {     // to keep the connection alive
      if (this.ros != null && this.ros.inConnected) {
        this.ros.getNodes((data) => { }, (error) => { })
      }
    }, 10000);
    setTimeout(function(){
      console.log("E");
      self.startNavigate();
      self.connect();
    },2000);
  },
  unmounted() {
    var self = this;
    if (self.socket) {
      self.socket.disconnect();
    }
    //this.ros.close()
  },
  methods: {
    headerLocale(headers){
      var self = this;
      if(headers=='select_map'){
        return self.$t('navigation.select-map');
      }
      if(headers=='map_headers'){
        if(self.$i18n.locale=='zh') return self.map_headers_ch;
        else return self.map_headers;
      }
      if(headers=='add_plan_headers'){
        if(self.$i18n.locale=='zh') return self.add_plan_headers_ch;
        else return self.add_plan_headers_headers;
      }
      if(headers=='defined_poses_headers'){
        if(self.$i18n.locale=='zh') return self.defined_poses_headers_ch;
        else return self.defined_poses_headers_headers;
      }
    },
    sequenceLocale(mode){
      var self = this;
      if(mode=='single'){
        return self.$t('navigation.add-plan.single-run');
      }
      if(mode=='loop'){
        return self.$t('navigation.add-plan.loop-run');
      }
      if(mode=='bnf'){
        return self.$t('navigation.add-plan.back-and-forth');
      }
    },
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
    onMapSelectChange(v) {
      var self = this;
      let mapObject = self.maps.filter(map => map.id === v)[0];
      self.map_label = mapObject.label;
      if (self.connected) {
        self.ros.close()
      }
      if (self.socket) {
        self.socket.disconnect();
      }
    },
    onSourceSelectChange(v) {
      var self = this;
      let sourceObject = self.sources.filter(source => source.id === v)[0];
      self.rosbridge_address = sourceObject.ros_address;
      self.camera_port = sourceObject.camera_port;
      if (self.connected) {
        self.ros.close()
      }
      if (self.socket) {
        self.socket.disconnect();
      }
    },
    startDrawing(type) {
      if(type=='add_point'){
        this.startAddPoint = true;
        this.snackbar.message = this.$t("navigation.add-point.location-message");
      }
      else if(type=='localize'){
        this.startLocalize = true;
        this.snackbar.message = this.$t("navigation.localize.location-message");
      }
      this.snackbar.open = true;
      this.unsetCamera();
      this.camera_feed = false;
    },
    handleImageClick(x, y) {
      var self = this;
      if (self.startAddPoint || self.startLocalize) {
        if (self.selectStartPoint == false) {
          self.startPoint.x = x;
          self.startPoint.y = y;
          self.selectStartPoint = true;
          self.showOverlay = true;
          self.snackbar.open = false;
          if (self.startAddPoint)
            self.snackbar.message = this.$t("navigation.add-point.direction-message");
          else if(self.startLocalize)
            self.snackbar.message = this.$t("navigation.localize.direction-message");
          self.snackbar.open = true;
        }
        else if (self.selectEndPoint == false) {
          self.endPoint.x = x;
          self.endPoint.y = y;
          self.addPointFinal.x = self.startPoint.x.toFixed(2);
          self.addPointFinal.y = self.startPoint.y.toFixed(2);
          self.showOverlay = false;
          let deltaY = self.endPoint.y - self.startPoint.y;
          let deltaX = self.endPoint.x - self.startPoint.x;          
          self.theta = Math.atan2(deltaY, deltaX) 
          //self.theta = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
          self.addPointFinal.theta = self.theta.toFixed(2);
          if(self.startAddPoint == self.startLocalize){
            self.startAddPoint = false;
            self.startLocalize = false;
            self.selectEndPoint = false;
            self.selectStartPoint = false;
            self.snackbar.message = "Cannot recognize. Please add point / localize again.";
            self.snackbar.open = true;
          }
          self.openConfirmAddPoint();
        }
      }
    },
    openConfirmAddPoint() {
      var self = this;
      self.confirmAddPointDialog = true;
    },
    closeConfirmAddPoint() {
      var self = this;
      self.confirmAddPointDialog = false;
      self.addPointFinal.x = null;
      self.addPointFinal.y = null;
      self.addPointFinal.theta = null;
      self.addPointFinal.label = "";
      self.startAddPoint = false,
      self.startLocalize = false;
      self.selectEndPoint = false;
      self.selectStartPoint = false;
    },
    confirmAddPoint() {
      var self = this; console.log(self.addPointFinal);
      if(self.startAddPoint){
        self.socket.emit('new_target', {
          label: self.addPointFinal.label,
          x: self.addPointFinal.x,
          y: self.addPointFinal.y,
          theta: self.addPointFinal.theta
        });
        self.snackbar.open = true;
        self.snackbar.message = self.$t("navigation.add-point.confirm.new-point-message");
      }
      else if(self.startLocalize){
        let robot_pose = {
          robot_pos_x: self.addPointFinal.x,
          robot_pos_y: self.addPointFinal.y,
          robot_pos_theta: self.addPointFinal.theta
        }
        self.socket.emit('set_initialpose', robot_pose);
        self.snackbar.open = true;
        self.snackbar.message = "Localizing robot ...";
      }
      self.confirmAddPointDialog = false;
      self.addPointFinal.x = null;
      self.addPointFinal.y = null;
      self.addPointFinal.theta = null;
      self.addPointFinal.label = "";
      self.confirmAddPointDialog = false;
      self.startAddPoint = false,
      self.startLocalize = false;
      self.selectEndPoint = false;
      self.selectStartPoint = false;
    },
    driveToTarget(target_id) {
      var self = this; 
      self.socket.emit('drive_to_target', target_id);
    },
    deleteTarget(target_id) {
      var self = this;
      self.socket.emit('delete_target', target_id);
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
    startNavigate() {
      var self = this;
      let map_name = self.map_select;
      self.socket = io(self.io_address);
      self.socket.on('connect', function () {
        console.log('Connected to the server');
        if (map_name == null || map_name.trim() == "") {
          self.socket.emit('get_current_config', 'STATIC');
        }     
        else {
          self.map_settings = {
            map_static: true,
            map_slam: false,
            map_file: map_name,
            map_autosave: false
          }
          self.socket.emit('start_navigate', self.map_settings);
        }
      });
      self.socket.on('disconnect', function () {
        console.log('Disconnected from the server');
      });
      self.socket.on('navigate_slam_unsave', function (filename) {
        console.log("A");
        self.socket.disconnect();
        self.disconnect();
        self.slam_stopped = false;
        self.slam_filename = filename;
      });
      self.socket.on('navigate_slam_save', function (filename) {
        console.log("B");
        self.slam_stopped = true;
        self.map_select = filename.split(".yaml")[0];
        self.map_settings = {
          map_static: true,
          map_slam: false,
          map_file: self.map_select,
          map_autosave: false
        };
        self.socket.emit('start_navigate', self.map_settings);
      });
      self.socket.on('navigate_static_no_file', function (filename) {
        console.log("C");
        //
      });
      self.socket.on('navigate_static_have_file', function (filename) {
        console.log("D");
        self.slam_stopped = true;
        self.map_select = filename.split(".yaml")[0];
        self.map_settings = {
          map_static: true,
          map_slam: false,
          map_file: self.map_select,
          map_autosave: false
        };
        self.socket.emit('start_navigate', self.map_settings);
      });
      self.socket.on('map_navigate', function (message) {
        console.log(message);
      });
      self.socket.on('map_stopped', function (message) {
        console.log(message);
        self.socket.disconnect();
        self.disconnect();
      });
      self.socket.on('map_saved', function (message) {
        console.log(message);
      });
      self.socket.on('get_targets', function (targets){
        console.log(targets);
        self.map_points = targets;
      });
      self.socket.on('localized', function (message){
        self.start
        console.log(message);
        self.snackbar.message = message;
        self.snackbar.open = true;
      });
      self.socket.on('map_file_list', function (map_names) {
        console.log(map_names);
        self.maps = map_names.map(item => ({
          label: item,
          id: item
        }));
      });
    },
    stopNavigate() {
      var self = this;
      self.socket.disconnect();
    },
    connect: function () {
      var self = this;
      let map_name = self.map_select;
      if (1) {
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
      }
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
      if (this.startAddPoint == true || this.startLocalize == true) {
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
    commandWaypoint: function (x, y, r) {
      let actionClient = new ROSLIB.ActionClient({
        ros: this.ros,
        serverName: '/move_base',
        actionName: 'move_base_msgs/MoveBaseAction'
      })
      let quat = new THREE.Quaternion();
      quat.setFromEuler(new THREE.Euler(0, 0, r * Math.PI / 180))
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
              orientation: { x: quat.x, y: quat.y, z: quat.z, w: quat.w }
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