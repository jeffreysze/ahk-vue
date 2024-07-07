<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import map from '@images/map/map.jpg'
import nipplejs from 'nipplejs'

const accountData = {
  avatarImg: avatar1,
  firstName: 'john',
  lastName: 'Doe',
  email: 'johnDoe@example.com',
  org: 'ThemeSelection',
  phone: '+1 (917) 543-9876',
  address: '123 Main St, New York, NY 10001',
  state: 'New York',
  zip: '10001',
  country: 'USA',
  language: 'English',
  timezone: '(GMT-11:00) International Date Line West',
  currency: 'USD',
}

const refInputEl = ref()
const accountDataLocal = ref(structuredClone(accountData))
const isAccountDeactivated = ref(false)

const resetForm = () => {
  accountDataLocal.value = structuredClone(accountData)
}

const changeAvatar = file => {
  const fileReader = new FileReader()
  const { files } = file.target
  if (files && files.length) {
    fileReader.readAsDataURL(files[0])
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        accountDataLocal.value.avatarImg = fileReader.result
    }
  }
}

// reset avatar image
const resetAvatar = () => {
  accountDataLocal.value.avatarImg = accountData.avatarImg
}

const timezones = [
  '(GMT-11:00) International Date Line West',
  '(GMT-11:00) Midway Island',
  '(GMT-10:00) Hawaii',
  '(GMT-09:00) Alaska',
  '(GMT-08:00) Pacific Time (US & Canada)',
  '(GMT-08:00) Tijuana',
  '(GMT-07:00) Arizona',
  '(GMT-07:00) Chihuahua',
  '(GMT-07:00) La Paz',
  '(GMT-07:00) Mazatlan',
  '(GMT-07:00) Mountain Time (US & Canada)',
  '(GMT-06:00) Central America',
  '(GMT-06:00) Central Time (US & Canada)',
  '(GMT-06:00) Guadalajara',
  '(GMT-06:00) Mexico City',
  '(GMT-06:00) Monterrey',
  '(GMT-06:00) Saskatchewan',
  '(GMT-05:00) Bogota',
  '(GMT-05:00) Eastern Time (US & Canada)',
  '(GMT-05:00) Indiana (East)',
  '(GMT-05:00) Lima',
  '(GMT-05:00) Quito',
  '(GMT-04:00) Atlantic Time (Canada)',
  '(GMT-04:00) Caracas',
  '(GMT-04:00) La Paz',
  '(GMT-04:00) Santiago',
  '(GMT-03:30) Newfoundland',
  '(GMT-03:00) Brasilia',
  '(GMT-03:00) Buenos Aires',
  '(GMT-03:00) Georgetown',
  '(GMT-03:00) Greenland',
  '(GMT-02:00) Mid-Atlantic',
  '(GMT-01:00) Azores',
  '(GMT-01:00) Cape Verde Is.',
  '(GMT+00:00) Casablanca',
  '(GMT+00:00) Dublin',
  '(GMT+00:00) Edinburgh',
  '(GMT+00:00) Lisbon',
  '(GMT+00:00) London',
]

const currencies = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'BRL',
  'CAD',
  'CNY',
  'CZK',
  'DKK',
  'HKD',
  'HUF',
  'INR',
]
const mapping = ref(false);

</script>

<template>
  
  <div class="ma-2">
  <v-btn v-if="mapping==false" color="secondary" density="comfortable" @click="mapping=true;">Start Mapping <v-icon>mdi-play-circle</v-icon></v-btn>
  <v-btn v-if="mapping==true" color="error" density="comfortable" @click="mapping=false;">Stop Mapping <v-icon>mdi-stop-circle</v-icon></v-btn>
  <v-btn class="mx-3" color="grey-800" variant="outlined" density="comfortable">Save As <v-icon>mdi-floppy</v-icon></v-btn>
  </div>
  <VRow>
    <VCol sm="12" md="9">
      <v-img 
        cover
        :src="map"
      >
      </v-img>
    </VCol>
    <VCol sm="12" md="3" style="background-color:azure; min-height: 175px">
      <div id="joystick_zone"></div>
    </VCol>
    
  </VRow>
</template>


<script>
export default {
  data() {
    return {
      options: null,
      manager: null,
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
  mounted(){
    var self = this;
    setTimeout(function(){
    self.options = {
      zone: document.getElementById('joystick_zone'),
      mode: 'static',
      position: {left: '50%', top: '50%'},
      color: 'red'
    } 

    self.manager = nipplejs.create(self.options);

    self.manager.on('dir', function(evt, data){
      console.log(data)
    });
  }, 1000)
  },
  unmounted() {
    delete this.options;
    delete this.manager;
  }
}
</script>

<style>
#nipple_0_0 {
  position: relative !important;
  top: 75px !important;
}

</style>
