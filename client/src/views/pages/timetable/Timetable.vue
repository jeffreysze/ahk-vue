<<<<<<< HEAD
<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
=======
<template>
  <FullCalendar :options='calendarOptions'>
    <template v-slot:eventContent='arg'>
      <b>{{ arg.timeText }}</b>
      <i>{{ arg.event.title }}</i>
    </template>
  </FullCalendar>
</template>
<script>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction';

>>>>>>> b2af8bfe015682d1611112d95e9bd4ed459a75de

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data: function() {
    return {
<<<<<<< HEAD
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
=======
      calendarOptions: {
        plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: '',
          center: 'title',
          right: '',
        },
        dayHeaderFormat: {
          weekday: 'long', omitCommas: true
        },
        views: {
          timeGridWeek: { // name of view
            titleFormat: { year: 'numeric', month: '2-digit', day: '2-digit' }
            // other view-specific options here
          }
        },
        eventTimeFormat: {
          hour: '2-digit',
          minute: '2-digit',
        },
        events: [          
          { title: 'Event 1', start: '2024-07-08T00:30:00', end: '2024-07-08T08:00:00' },
          { title: 'Event 2', start: '2024-07-09T01:00:00', end: '2024-07-09T09:00:00' },
          { title: 'Event 3', start: '2024-07-10T01:00:00', end: '2024-07-10T09:00:00' },
          { title: 'Event 4', allDay: true, start: '2024-07-11T14:30:00', end: '2024-07-11T18:00:00' }
        ]
      }
    }
  }
}
</script>
>>>>>>> b2af8bfe015682d1611112d95e9bd4ed459a75de
