<template>
  <div class='demo-app'>
    <v-btn v-if="changes" class='mr-3' color="error" variant="outlined" @click="discardAllEventChange()">{{ $t("timetable.discard_change_btn") }}<v-icon>mdi-delete</v-icon></v-btn>
    <v-btn v-if="changes" class='mr-3' color="primary" @click="saveTimetable()">{{ $t("timetable.save_btn") }}<v-icon>mdi-floppy</v-icon></v-btn>
    <!--v-btn  class='mr-3' color="secondary" density="comfortable" :disabled="loading" @click="socketReconnect()">{{ $t("navigation.connect") }}<v-icon>mdi-play-circle</v-icon></v-btn-->
    <br>
    <br>
    <div class='demo-app-main'>      
      <FullCalendar
        ref="calendar"
        class='demo-app-calendar'
        :options='calendarOptions'
      >
        <template v-slot:eventContent='arg'>
          <b>{{ arg.timeText }}</b>
          <i>{{ arg.event.title }}</i>
        </template>
      </FullCalendar>
    </div><br>
    <v-btn v-if="changes" class='mr-3' color="error" variant="outlined" @click="discardAllEventChange()">{{ $t("timetable.discard_change_btn") }}<v-icon>mdi-delete</v-icon></v-btn>
    <v-btn v-if="changes" class='mr-3' color="primary" @click="saveTimetable()">{{ $t("timetable.save_btn") }}<v-icon>mdi-floppy</v-icon></v-btn>
  </div>
  <v-dialog
    v-model="dialog"
    max-width="400"
  >
    <v-card
    >
      <v-card-title>
        {{ $t("timetable.dialog.event_detail_header") }}
      </v-card-title><hr class="mx-3">
      <v-card-text>
        <table>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_start") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.startWeekName) }}, </td>
            <!--td><v-text-field v-model="currentEvent.startTime" density="true" min-width="150px"></v-text-field></td-->
            <td>{{ currentEvent.startTime}}</td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_end") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.endWeekName) }}, </td>
            <!--td><v-text-field v-model="currentEvent.endTime" density="true"></v-text-field></td-->
            <td>{{ currentEvent.endTime }}</td>
          </tr>
        </table>
      </v-card-text>
      <hr class="mx-3 mb-2">
      <v-card-text v-if="edit_event">
        <h3 class="mb-3">{{ $t("timetable.dialog.edit_as_header") }}</h3>
        <table>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_start") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.startWeekName) }}, </td>
            <td><v-text-field v-model="currentEvent.editStartTime" density="compact" min-width="150px"></v-text-field></td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_end") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.endWeekName) }}, </td>
            <td><v-text-field v-model="currentEvent.editEndTime" density="compact"></v-text-field></td>
          </tr>
        </table>
      </v-card-text>
      <v-card-actions v-if="edit_event==false">
        <v-btn color="error"  @click="deleteEvent">
          {{ $t("timetable.dialog.delete_btn") }}
        </v-btn>
        <v-btn @click="edit_event=true">
          {{ $t("timetable.dialog.edit_btn") }}
        </v-btn>
        <v-spacer></v-spacer>


        <v-btn color="primary" variant="elevated" @click="closeDialog">
          {{ $t("timetable.dialog.close_btn") }}
        </v-btn>
      </v-card-actions>
      <v-card-actions v-if="edit_event==true">
        <v-btn @click="discardEditEvent">
          {{ $t("timetable.dialog.discard_btn") }}
        </v-btn>

        <v-btn color="primary" @click="confirmEditEvent">
          {{ $t("timetable.dialog.confirm_btn") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-snackbar v-model="snackbar.open" color="primary">
    <p>{{ snackbar.message }}</p>

    <template v-slot:actions>
      <v-btn color="white" variant="outlined" @click="snackbar.open = false">
        {{ $t("snackbar.close") }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { defineComponent } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import cnLoacle from '@fullcalendar/core/locales/zh-cn'
import { io } from "socket.io-client";
import moment from "moment";

export default defineComponent({
  components: {
    FullCalendar,
  },
  data() {
    return {
      //io_address: "http://124.244.207.24:8000",
      io_address: "http://192.168.1.14:8000",
      socket_connected: false,
      socket: null,
      snackbar: {
        open: false,
        message: "",
      },
      weekToDate:[
        "2024-08-04",
        "2024-08-05",
        "2024-08-06",
        "2024-08-07",
        "2024-08-08",
        "2024-08-09",
        "2024-08-10",
      ],
      edit_event: false,
      eventCount: 0,
      changes: false,
      dialog: false,
      calendarOptions: {
        locale: 'zh-cn',
        plugins: [
          timeGridPlugin,
          interactionPlugin // needed for dateClick
        ],
        headerToolbar: {
          left: '',
          center: '',
          right: ''
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
          meridiem: 'short'
        },
        eventBorderColor: '#696cff',
        eventColor: '#9193fb',
        allDaySlot: false,
        height: 'auto',
        initialView: 'timeGridWeek',
        initialEvents: [], // alternatively, use the `events` setting to fetch from a feed,
        initialDate: "2024-08-04",
        events: [],
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        //eventsSet: this.handleEvents,
        eventDrop: this.handleEventDrop,
        eventResize: this.handleEventResize,
        slotEventOverlap:false,
        /* you can update a remote database when these fire:
        eventAdd:
        eventChange:
        eventRemove:
        */
      },
      currentEvents: [],
      currentEvent: null,
    }
  },
  mounted(){
    var self = this;
    self.socket = io(self.io_address,
      {
        reconnection: false
      }
    );
    self.socket.on('connect', function() {
      console.log('Connected to the server');
      self.socket_connected = true;
      self.socket.emit('get_current_config', 'TIMETABLE');
    });
    self.socket.on('disconnect', function() {
      console.log('Disconnected from the server');
    });
    self.socket.on('emit_timetable_object', function(object) {
      self.calendarOptions.events = object; // update the initialEvents array
      self.refetchEvents();
      self.eventCount = self.calendarOptions.events.length;
      self.currentEvents = object;
      console.log(self.currentEvents);
      //self.handleEvents(object);
    });
    self.socket.on('timetable_saved', function() {
      self.snackbar.message = self.$t("timetable.timetable-save-message");
      self.snackbar.open = true;
      self.changes = false;
      self.socket.emit('get_current_config', 'TIMETABLE');
    });

  },
  methods: {
    socketReconnect(){
      var self = this;
      self.socket = io(self.io_address);
    },
    refetchEvents() {
      // Get the FullCalendar instance
      let cApi = this.$refs.calendar.getApi();      
      cApi.refetchEvents();
      
    },
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends // update a property
    },
    handleDateSelect(selectInfo) {
      var self = this;
      let calendarApi = selectInfo.view.calendar
      console.log(calendarApi)
      calendarApi.unselect() // clear date selection
        self.eventCount+=1;
        calendarApi.addEvent({
          id: self.eventCount,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          startWeekDayNumber: moment(selectInfo.startStr).format("e"),
          endWeekDayNumber: moment(selectInfo.endStr).format("e"),
        });
        self.currentEvents.push({
          id: self.eventCount,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          start_time: moment(selectInfo.startStr).format("HH:mm"),
          end_time: moment(selectInfo.endStr).format("HH:mm"),
          startWeekDayNumber: moment(selectInfo.startStr).format("e"),
          endWeekDayNumber: moment(selectInfo.endStr).format("e"),
        });
        self.changes = true;
    },
    handleEventClick(clickInfo) {
      var self = this;
      console.log(clickInfo.event)
      self.currentEvent = {
        id: clickInfo.event.id,
        startWeekDayNumber: moment(clickInfo.event.start).format("e"),
        startWeekName: moment(clickInfo.event.start).format("dddd"),
        startTime: moment(clickInfo.event.start).format("HH:mm"),
        endWeekDayNumber: moment(clickInfo.event.end).format("e"),
        endWeekName: moment(clickInfo.event.end).format("dddd"),
        endTime: moment(clickInfo.event.end).format("HH:mm"),
        editStartTime: moment(clickInfo.event.start).format("HH:mm"),
        editEndTime: moment(clickInfo.event.end).format("HH:mm"),
      };
      console.log(self.currentEvent)
      
      self.dialog = true;

      /*if (confirm(`Are you sure you want to delete the event '${clickInfo.event.id}'`)) {
        clickInfo.event.remove()
      }
        */
    },
    handleEvents(events) {
      this.currentEvents = events;
    },
    handleEventDrop(eventInfo) {
      var self = this;
      self.changes = true;
      self.currentEvent = {
        id: eventInfo.event.id,
        start: moment(eventInfo.event.start).format("YYYY-MM-DDTHH:mm:ss"),
        end: moment(eventInfo.event.end).format("YYYY-MM-DDTHH:mm:ss"),
        start_time: moment(eventInfo.event.start).format("HH:mm"),
        end_time: moment(eventInfo.event.end).format("HH:mm"),
        startWeekDayNumber: moment(eventInfo.event.start).format("e"),
        endWeekDayNumber: moment(eventInfo.event.end).format("e"),
      };
      self.updateEventList('drop');
    },
    handleEventResize(eventInfo) {
      var self = this;
      self.changes = true;
      self.currentEvent = {
        id: eventInfo.event.id,
        start: moment(eventInfo.event.start).format("YYYY-MM-DDTHH:mm:ss"),
        end: moment(eventInfo.event.end).format("YYYY-MM-DDTHH:mm:ss"),
        start_time: moment(eventInfo.event.start).format("HH:mm"),
        end_time: moment(eventInfo.event.end).format("HH:mm"),
        startWeekDayNumber: moment(eventInfo.event.start).format("e"),
        endWeekDayNumber: moment(eventInfo.event.end).format("e"),
      };
      self.updateEventList('resize');
    },
    discardEditEvent(){
      var self = this;
      self.currentEvent.editEndTime = self.currentEvent.endTime;
      self.currentEvent.editStartTime = self.currentEvent.startTime;
      self.edit_event = false;
    },
    confirmEditEvent(){
      var self = this;
      //check Valid later;
      let tempStart = moment(self.weekToDate[self.currentEvent.startWeekDayNumber] + "T" + self.currentEvent.editStartTime + ":00");
      let tempEnd = moment(self.weekToDate[self.currentEvent.endWeekDayNumber] + "T" + self.currentEvent.editEndTime + ":00");
      if(tempEnd.diff(tempStart,'minutes') <1){
        alert("Time period invalid.");
      }
      else {
        self.updateEventList('edit');
        self.changes = true;
      }
    },
    deleteEvent(){
      var self = this;
      self.updateEventList('delete');
      self.changes = true;
    },
    updateEventList(type){
      var self = this;
      console.log(self.currentEvent.id);
      for (var i = 0; i < self.currentEvents.length; i++) {
        if (self.currentEvents[i].id == self.currentEvent.id) {
          if(type=='edit'){
            let tempStart = self.weekToDate[self.currentEvent.startWeekDayNumber] + "T" + self.currentEvent.editStartTime + ":00";
            let tempEnd = self.weekToDate[self.currentEvent.endWeekDayNumber] + "T" + self.currentEvent.editEndTime + ":00";
            console.log(self.currentEvent.startWeekDayNumber,self.currentEvent.endWeekDayNumber,tempStart,tempEnd);
            self.currentEvents[i].start = moment(tempStart).format("YYYY-MM-DDTHH:mm:ss");
            self.currentEvents[i].end = moment(tempEnd).format("YYYY-MM-DDTHH:mm:ss");
            self.currentEvents[i].start_time = moment(tempStart).format("HH:mm");
            self.currentEvents[i].end_time = moment(tempEnd).format("HH:mm");
            console.log(self.currentEvents);
          }
          else if(type=='delete'){
            self.currentEvents.splice(i, 1);
          }
          else if(type=='drop' || type=='resize'){
            self.currentEvents[i].start = self.currentEvent.start;
            self.currentEvents[i].end = self.currentEvent.end;
            self.currentEvents[i].startWeekDayNumber = moment(self.currentEvent.start).format("e");
            self.currentEvents[i].endWeekDayNumber = moment(self.currentEvent.end).format("e");
            self.currentEvents[i].start_time = moment(self.currentEvent.start).format("HH:mm");
            self.currentEvents[i].end_time = moment(self.currentEvent.end).format("HH:mm");
          }
          
          self.calendarOptions.events = self.currentEvents; // update the initialEvents array
          self.refetchEvents();
          self.closeDialog();
          break;
        }
      }
    },
    closeDialog(){
      var self = this;
      self.dialog = false;
      self.currentEvent = {};
    },
    saveTimetable(){
      var self = this;
      self.socket.emit('save_timetable', self.currentEvents);
      console.log(self.currentEvents);
    },
    discardAllEventChange(){
      var self = this;      
      self.socket.emit('get_current_config', 'TIMETABLE');
      self.changes = false;
    },
    transalateWeekName(name){
      var self = this;
      switch(name) {
        case "Sunday":
          if(self.$i18n.locale=='zh')
            return "星期日";
          else 
            return "Sunday";

        case "Monday":
          if(self.$i18n.locale=='zh')
            return "星期一";
          else 
            return "Monday";

        case "Tuesday":
          if(self.$i18n.locale=='zh')
            return "星期二";
          else 
            return "Tuesday";

        case "Wednesday":
          if(self.$i18n.locale=='zh')
            return "星期三";
          else 
            return "Wednesday";

        case "Thursday":
          if(self.$i18n.locale=='zh')
            return "星期四";
          else 
            return "Thrusday";

        case "Friday":
          if(self.$i18n.locale=='zh')
            return "星期五";
          else 
            return "Friday";

        case "Saturday":
          if(self.$i18n.locale=='zh')
            return "星期六";
          else 
            return "Saturday";
        default:
          break;
          // code block
      }
    }
  }
})

</script>

<style lang='css'>

.demo-app {
  min-height: 100%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
  font-size: 16px;
}

.demo-app-sidebar {
  width: 300px;
  line-height: 1.5;
  background: #eaf9ff;
  border-right: 1px solid #d3e2e8;
}

.demo-app-sidebar-section {
  padding: 2em;
}

.demo-app-main {
  flex-grow: 1;
  padding: 3em;
  background: #ffffff76;
}

.fc { /* the calendar root */
  margin: 0 auto;
}
.fc-event-main{
  font-size: 16px;
}

</style>