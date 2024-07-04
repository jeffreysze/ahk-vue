<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import map from '@images/map/map.jpg'
import nipplejs from 'nipplejs'
import { onMounted } from 'vue';

onMounted(() => {
  setTimeout(function () {
    var options = {
      zone: document.getElementById('joystick_zone'),
      mode: 'static',
      position: { left: '50%', top: '50%' },
      color: 'red'
    }

    var manager = nipplejs.create(options);

    manager.on('dir', function (evt, data) {
      console.log(data)
    });
  }, 1000)
})

const maps = ["Map 1", "Map 2", "Map 3", "Map 4"];
const map_select = ref(maps[0]);
const camera_feed = ref(false);
const add_plan_dialog = ref(false);
const map_headers = [
  { title: 'X[m]', key: 'x' },
  { title: 'Y[m]', key: 'y' },
  { title: 'Theta[°]', key: 'theta' },
  { title: 'Label', key: 'label' },
  { title: 'Actions', key: 'actions' },
];
const add_plan_headers = [
  { title: 'Pose[x,y,theta]', key: 'pose' },
  { title: 'Label', key: 'label' },
  { title: 'Edit', key: 'actions' },
];
const defined_poses_headers = [
  { title: 'Pose[x,y,theta]', key: 'pose' },
  { title: 'Label', key: 'label' },
  { title: 'Add to Route', key: 'actions' },
];

</script>

<template>

  <v-row>
    <v-col cols="12">
      <v-select label="Select Map:" :items="maps" variant="solo" v-model="map_select">
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
      <v-btn class="mx-1">Add Point</v-btn>
      <v-btn class="mx-1">Edit Point</v-btn>
      <v-btn class="mx-1" @click="add_plan_dialog = true">Add Plan</v-btn>
      <v-btn class="mx-1">Localize</v-btn>
      <v-btn class="mx-1" color="grey-800" variant="outlined" @click="camera_feed = !camera_feed">
        <v-icon>mdi-camera</v-icon>
      </v-btn>
    </VCol>
  </VRow>
  <VRow class="position-relative">
    <VCol sm="12" md="9">
      <v-img cover :src="map">
      </v-img>
    </VCol>
    <VCol v-if="camera_feed" sm="12" md="7" class="position-absolute">
      <v-responsive :aspect-ratio="16 / 9" class="border-lg border-primary bg-white h-100 w-100">
        <v-sheet class="bg-white h-100 w-100 text-align: center">
          <h2>Camera Feed</h2>
        </v-sheet>
      </v-responsive>
    </VCol>
    <VCol sm="12" md="3" style="background-color:#dadbf1; min-height: 175px">
      <div id="joystick_zone"></div>
    </VCol>

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
              <v-btn class="mx-1" color="error" @click="deletePoint(index)"><v-icon size="large">mdi-delete</v-icon></v-btn>
            </td>
          </tr>
        </template>
      </v-data-table>

    <!--v-table fixed-header class="bottom-table">
      <thead>
        <tr>
          <th>X[m]</th>
          <th>Y[m]</th>
          <th>Theta[&#176;]</th>
          <th>Label</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in map_points" :key="item.label">
          <td>{{ item.x }}</td>
          <td>{{ item.y }}</td>
          <td>{{ item.theta }}</td>
          <td>{{ item.label }}</td>
          <td></td>
        </tr>
      </tbody>
    </v-table-->
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
                        <v-btn  @click="removePlanPoint(index)" color="error"
                          class="mx-1">
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
                        <v-btn @click="addToPlan(item)"  color="success">
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
                  <v-radio label="Back and Forth" value="3" ></v-radio>
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
export default {
  data() {
    return {
      panel: [0,1,2],
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
    }
  },
  methods: {
    foo(){
      console.log(this.panel)
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
    removePlanPoint(index){
      this.added_to_plan.splice(index,1);
      
      console.log(this.added_to_plan);
    },
    deletePoint(index){
      this.map_points.splice(index,1);
    },
  },
}
</script>
