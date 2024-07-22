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


export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  data: function() {
    return {
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
          { title: 'Event 1', start: '2024-07-22T00:30:00', end: '2024-07-22T08:00:00' },
          { title: 'Event 2', start: '2024-07-23T01:00:00', end: '2024-07-23T09:00:00' },
          { title: 'Event 3', start: '2024-07-24T01:00:00', end: '2024-07-24T09:00:00' },
          { title: 'Event 4', allDay: true, start: '2024-07-25T14:30:00', end: '2024-07-25T18:00:00' }
        ]
      }
    }
  }
}
</script>