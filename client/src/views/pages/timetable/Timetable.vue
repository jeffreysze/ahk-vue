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
          { title: 'Event 1', start: '2024-08-05T00:30:00', end: '2024-08-05T08:00:00' },
          { title: 'Event 2', start: '2024-08-06T01:00:00', end: '2024-08-06T09:00:00' },
          { title: 'Event 3', start: '2024-08-07T01:00:00', end: '2024-08-07T09:00:00' },
          { title: 'Event 4', allDay: true, start: '2024-08-08T14:30:00', end: '2024-08-08T18:00:00' }
        ]
      }
    }
  }
}
</script>