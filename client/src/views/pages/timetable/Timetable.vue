<script setup>


</script>

<template>
  <v-container class="fill-height pa-0 ">
    <vue3-scheduler-lite :schedule-data="data" :setting="settingData" />
  </v-container>
</template>
<script>
import VueSchedulerLite from 'vue3-scheduler-lite';

export default {
  components: {
    VueSchedulerLite
  },
  data() {
    return {
      data: {
  title: 'My Schedule',
  noBusinessDate: ['2023-06-01', '2023-06-15'], // Dates that are not considered business days
  businessHours: [
    { start: '09:00', end: '17:00' }, // Business hours for Monday-Friday
    { start: '10:00', end: '15:00' } // Business hours for Saturday
  ],
  schedules: [
    {
      start: '2023-06-02 10:00',
      end: '2023-06-02 12:00',
      text: 'Meeting with client'
    },
    {
      start: '2023-06-05 14:00',
      end: '2023-06-05 16:00',
      text: 'Team discussion'
    },
    {
      start: '2023-06-10 09:00',
      end: '2023-06-10 11:00',
      text: 'Presentation'
    }
  ]
},
settingData: {
  startDate: '2023-06-01',
  endDate: '2023-06-30',
  weekdayText: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  unit: 30, // Cell width in minutes
  borderW: 1, // Cell border width in pixels
  dateDivH: 30, // Date cell height in pixels
  timeDivH: 50, // Time cell height in pixels
  unitDivW: 120, // Cell width in pixels
  titleDivW: 20, // Title cell width in percentage
  rowH: 80, // Row height in pixels
  rowClickEvent: (rowData) => {
    // Handle row click event
    console.log('Row clicked:', rowData)
  },
  dateClickEvent: (dateData) => {
    // Handle date click event
    console.log('Date clicked:', dateData)
  },
  clickEvent: (scheduleData) => {
    // Handle schedule bar click event
    console.log('Schedule clicked:', scheduleData)
  },
  addEvent: (scheduleData) => {
    // Handle new schedule add event
    console.log('New schedule added:', scheduleData)
  },
  moveEvent: (scheduleData) => {
    // Handle schedule move event
    console.log('Schedule moved:', scheduleData)
  },
  editEvent: (scheduleData) => {
    // Handle schedule edit event
    console.log('Schedule edited:', scheduleData)
  },
  deleteEvent: (scheduleData) => {
    // Handle schedule delete event
    console.log('Schedule deleted:', scheduleData)
  }
}
    }
  },
}
</script>
