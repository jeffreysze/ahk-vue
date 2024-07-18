<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data() {
    return {
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      calendarOptions: {},        
    }
  },
  mounted: function () {
    this.calendarOptions = {
      plugins: [ timeGridPlugin, dayGridPlugin, interactionPlugin ],
        initialView: 'timeGridWeek',
        dayHeaderFormat: function(date){
          return this.days[date.getDay()];
        },
        events: [
          {
              "title": "Long Event",
              "start": "2024-07-07",
              "end": "2024-07-10"
          },
          {
              "groupId": "999",
              "title": "Repeating Event",
              "start": "2024-07-09T16:00:00+00:00"
          },
          {
              "title": "Conference",
              "start": "2024-07-07",
              "end": "2024-07-09"
          },
          {
              "title": "Meeting",
              "start": "2024-07-08T10:30:00+00:00",
              "end": "2024-07-08T12:30:00+00:00"
          },
          {
              "title": "Lunch",
              "start": "2024-07-08T12:00:00+00:00"
          },
          {
              "title": "Birthday Party",
              "start": "2024-07-09T07:00:00+00:00"
          }
        ],
    }
  },
  methods: {
  }
}
</script>
<template>
  <FullCalendar :options="calendarOptions" />
</template>