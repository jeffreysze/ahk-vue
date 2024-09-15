<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard class="auth-card pa-4 pt-7" min-width="448">
      <VCardItem class="justify-center">
        <VCardTitle class="text-2xl font-weight-bold">
          <h3 style='color: blue;'><i>I-Robotics&nbsp;
    {{ $ip_connect }}</i></h3>
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VForm @submit.prevent="$router.push('/')">
          <VRow>
            <!-- email -->
            <VCol cols="12">
              <v-select label="Select Robot:" :items="ip_addresses"  item-title="label" item-value="id"
                v-model="ip_select" @update:modelValue="onMapSelectChange">
              </v-select>
              <br>
            </VCol>
            <v-divider></v-divider>

            <!-- password -->
            <VCol cols="12">
              <!-- login button -->
               <br>
              <VBtn block :disabled="ip_select=='' || ip_select==null" @click="tmp">
                Connect
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>


<script>
import { io } from "socket.io-client";
import { ROSLIB, MJPEGCANVAS, THREE, ROS3D } from '@/utils/libs.js';
export default {
  data() {
    return {
      myVar: this.$ip_connect,
      ip_addresses: [
        {
          id: "localhost",
          label: "localhost",
        }
      ],
      ip_select: null,
    }
  },
  mounted() {
    var self = this;
    alert(self.myVar);
  },  
  methods: {
    tmp(){
      var self = this;
      self.$ip_connect='asdsadasd';
      alert("zz");
    },
  },
}
</script>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>