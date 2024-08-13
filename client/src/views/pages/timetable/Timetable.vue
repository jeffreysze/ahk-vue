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
          <br>
          <i>{{ arg.event.title }}</i>
        </template>
      </FullCalendar>
    </div><br>
    <v-btn v-if="changes" class='mr-3' color="error" variant="outlined" @click="discardAllEventChange()">{{ $t("timetable.discard_change_btn") }}<v-icon>mdi-delete</v-icon></v-btn>
    <v-btn v-if="changes" class='mr-3' color="primary" @click="saveTimetable()">{{ $t("timetable.save_btn") }}<v-icon>mdi-floppy</v-icon></v-btn>
  </div>
  <v-dialog
    v-model="dialog"
    max-width="450"
  >
    <v-card
    >
      <v-card-title>
        {{ $t("timetable.dialog.event_detail_header") }}
      </v-card-title><hr class="mx-3">
      <v-card-text>
        <table>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_day") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.dayName) }}</td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_start") }}</th>
            <td>{{ currentEvent.start_time}}</td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_end") }}</th>
            <td>{{ currentEvent.end_time }}</td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_title") }}</th>
            <td class="pr-3" colspan="2">{{ currentEvent.title }}</td>
          </tr>
        </table>
      </v-card-text>
      <hr class="mx-3 mb-2">
      <v-card-text v-if="edit_event">
        <h3 class="mb-3">{{ $t("timetable.dialog.edit_as_header") }}</h3>
        <table>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_day") }}</th>
            <td class="pr-3">{{ transalateWeekName(currentEvent.dayName) }}</td>
            <td></td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_start") }}</th>
            <td><v-text-field v-model="currentEvent.edit_start_time" density="compact" max-width="150px"></v-text-field></td>
            <td></td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_end") }}</th>
            <td><v-text-field v-model="currentEvent.edit_end_time" density="compact" max-width="150px"></v-text-field></td>
            <td></td>
          </tr>
          <tr>
            <th class="pr-3">{{ $t("timetable.dialog.edit_title") }}</th>
            <td class="pr-3" colspan="2"><v-text-field v-model="currentEvent.edit_title" density="compact" min-width="300px"></v-text-field></td>
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
      io_address: "http://192.168.1.14:8000",
      //io_address: "http://124.244.207.24:8000",
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
        "2024-08-11",
      ],
      loop_save: false,
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
        events: [{"start":"2024-08-04T23:58:00","end":"2024-08-04T23:59:00"}],
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
    self.calendarOptions.events = [];
    self.refetchEvents();
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
      self.changeTimetableToArray(object);
      self.calendarOptions.events = self.currentEvents; // update the initialEvents array
      self.refetchEvents();
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
      console.log()
      let tempTitle = prompt(self.$i18n.t("timetable.add-event-prompt"));
        self.eventCount+=1;
        calendarApi.addEvent({
          id: self.eventCount,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          day: moment(selectInfo.startStr).format("e"),
          title: tempTitle
        });
        self.currentEvents.push({
          id: self.eventCount,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          start_time: moment(selectInfo.startStr).format("HH:mm"),
          end_time: moment(selectInfo.endStr).format("HH:mm"),
          day: moment(selectInfo.startStr).format("e"),
          title: tempTitle
        });
        self.changes = true;
        console.log(self.currentEvents);
    },
    handleEventClick(clickInfo) {
      var self = this;
      console.log(clickInfo.event)
      self.currentEvent = {
        id: clickInfo.event.id,
        start: moment(clickInfo.event.start).format("YYYY-MM-DDTHH:mm:ss"),
        end: moment(clickInfo.event.end).format("YYYY-MM-DDTHH:mm:ss"),
        day: moment(clickInfo.event.start).format("e"),
        dayName: moment(clickInfo.event.start).format("dddd"),
        title: clickInfo.event.title,
        start_time: moment(clickInfo.event.start).format("HH:mm"),
        end_time: moment(clickInfo.event.end).format("HH:mm"),
        edit_start_time: moment(clickInfo.event.start).format("HH:mm"),
        edit_end_time: moment(clickInfo.event.end).format("HH:mm"),
        edit_title: clickInfo.event.title,
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
      let tempStart = moment(self.weekToDate[self.currentEvent.day] + "T" + self.currentEvent.edit_start_time + ":00");      
      let tempEnd = ""
      if(self.currentEvent.edit_end_time == "00:00")
        tempEnd = moment(self.weekToDate[parseInt(self.currentEvent.day)+1] + "T" + self.currentEvent.edit_end_time + ":00");
      else 
        tempEnd = moment(self.weekToDate[self.currentEvent.day] + "T" + self.currentEvent.edit_end_time + ":00");
      if(tempEnd.diff(tempStart,'minutes') <1){
        alert("Time period invalid.");
      }
      else {
        self.updateEventList('edit');
        self.changes = true;
        self.edit_event = false;
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
            let tempStart = self.weekToDate[self.currentEvent.day] + "T" + self.currentEvent.edit_start_time + ":00";
            let tempEnd = ""
            if(self.currentEvent.edit_end_time == "00:00")
              tempEnd = moment(self.weekToDate[parseInt(self.currentEvent.day)+1] + "T" + self.currentEvent.edit_end_time + ":00");
            else 
              tempEnd = moment(self.weekToDate[self.currentEvent.day] + "T" + self.currentEvent.edit_end_time + ":00");
            self.currentEvents[i].start = moment(tempStart).format("YYYY-MM-DDTHH:mm:ss");
            self.currentEvents[i].end = moment(tempEnd).format("YYYY-MM-DDTHH:mm:ss");
            self.currentEvents[i].start_time = moment(tempStart).format("HH:mm");
            self.currentEvents[i].end_time = moment(tempEnd).format("HH:mm");
            self.currentEvents[i].title = self.currentEvent.edit_title;
            console.log(self.currentEvents[i]);
          }
          else if(type=='delete'){
            self.currentEvents.splice(i, 1);
          }
          else if(type=='drop' || type=='resize'){
            self.currentEvents[i].start = self.currentEvent.start;
            self.currentEvents[i].end = self.currentEvent.end;
            self.currentEvents[i].day = moment(self.currentEvent.start).format("e");
            self.currentEvents[i].start_time = moment(self.currentEvent.start).format("HH:mm");
            self.currentEvents[i].end_time = moment(self.currentEvent.end).format("HH:mm");
            console.log(self.currentEvents[i])
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
      self.loop_save = true;
      let json = self.changeArrayToJSON(self.currentEvents);
      let intv = setInterval(function(){
        if(self.loop_save ==false){
          self.socket.emit('save_timetable', json);
          clearInterval(intv);
        }
      },500);
      
      //self.socket.emit('save_timetable', self.currentEvents);
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
    },
    changeTimetableToArray(object){
      var self = this;
      self.eventCount = 0;
      self.currentEvents = [];
      self.currentEvent = null;
      for (var i = 0; i < object.week.length; i++) {
        let day = object.week[i].day;
        for (var j = 0; j<object.week[i].timetable.length; j++){
          let event = object.week[i].timetable[j];
          let event_end_day = "";
          if(event.end_time=='00:00')
            event_end_day = self.weekToDate[day+1]+"T"+event.end_time+":00";
          else
            event_end_day = self.weekToDate[day]+"T"+event.end_time+":00";
          self.currentEvents.push({
            id: ++self.eventCount,
            start_time: event.start_time,
            end_time: event.end_time,
            day: day,
            start: self.weekToDate[day]+"T"+event.start_time+":00",
            end: event_end_day,
            title: event.event
          });
        }
      }
    },
    changeArrayToJSON(events){
      var self = this;
      let json = {
        "week":
          [
            {
              "day":0,
              "timetable":[]
            },
            {
              "day":1,
              "timetable":[]
            },
            {
              "day":2,
              "timetable":[]
            },
            {
              "day":3,
              "timetable":[]
            },
            {
              "day":4,
              "timetable":[]
            },
            {
              "day":5,
              "timetable":[]
            },
            {
              "day":6,
              "timetable":[]
            }
          ]
        }
      if(events.length==0){
        self.loop_save = false;              
              return json;    
      }
      else {
        for (var i = 0; i < events.length; i++) {
          let event = {
            "start_time": events[i].start_time,
            "end_time": events[i].end_time,
            "event": events[i].title,
          };
          for(var j = 0; j < json.week.length; j++){
            if(json.week[j].day == parseInt(events[i].day)){         
              json.week[j].timetable.push(event);
              if( parseInt(i) == parseInt(events.length)-1){
                self.loop_save = false;              
                return json;                            
              }
            }
          }
        }
      }
    },
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