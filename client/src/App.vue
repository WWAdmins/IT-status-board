<template>
    <div id="app">
        <b-row class="nav">
            <b-col cols=8 class="mr-auto">
                <b-row align-v="start">
                    <b-col cols=4>
                        <label class="page-title">WineWorks IT status board</label>
                    </b-col>
                    <b-col cols=5 class="ticket-title">
                        {{`Total tickets: ${itRegList.length} | High: ${ticketPriorities[1]} Normal: ${ticketPriorities[2]} Low: ${ticketPriorities[3]}`}}
                    </b-col>
                </b-row>
            </b-col>
            <b-col cols=4 class="right-push">
                <b-button-group>
                    <label class="page-sub-title">{{`Last updated: ${lastUpdated}`}}</label>
                    <b-button @click="update()" variant="danger" class="nav-button">
                        <b-spinner v-if="loadingItReg || loadingNotes || loadingDevices" variant=light small></b-spinner> Update
                    </b-button>
                    <b-button v-b-modal.add-note-modal variant="primary" @click="makeNote()" class="nav-button">Add a note</b-button>
                    <b-button @click="showHidden = !showHidden" class="nav-button" v-bind:class="{ hiddenButton : showHidden }">Show hidden</b-button>
                </b-button-group>
            </b-col>
        </b-row>
        
        

        <b-row class="main-pane">
            <b-col cols=6>
                <label v-if="itRegError" class="error-label">{{itRegError}}</label>
                <b-spinner v-if="loadingItReg" variant=info></b-spinner>
                <RecycleScroller
                    class="scroller"
                    :items="itRegDoubles"
                    :item-size="180"
                    key-field=id
                    v-slot="{ item }"
                >
                    <b-row class="list-pane">
                        <b-col 
                            cols="6"
                            v-for="regItem of item.data"
                            :key="regItem.Id"
                        >
                            <b-card 
                                class="item-card"
                                @click="showModal(regItem)"
                                v-bind:class="{ pulse : regItem.Id == oldestTcketId }"
                            >
                                <template #header class="high">
                                    <div v-bind:class="{ 
                                        high : regItem.Priority[1] == 1, 
                                        normal : regItem.Priority[1] == 2, 
                                        low : regItem.Priority[1] == 3 
                                        }"
                                    >
                                        <b-row>
                                            <b-col cols=8 class="text-start dot-wrap">
                                                {{regItem.Status}}
                                            </b-col>
                                            <b-col cols=4 class="text-end">
                                                {{regItem.Id}}
                                            </b-col>
                                        </b-row>
                                    </div>
                                </template>
                                <b-row>
                                    <b-col class="item-title dot-wrap">
                                        {{regItem.Title}}
                                    </b-col>
                                </b-row>
                                <b-row class="sub-title-box">
                                    <b-col cols=auto class="left-float dot-wrap">
                                        {{`Created: ${regItem.displayDate}`}}
                                    </b-col>
                                    <b-col cols=auto class="left-float dot-wrap">
                                        {{regItem.Site}}
                                    </b-col>
                                    <b-col cols=auto  class="left-float">
                                        {{regItem.Awaiting_x0020_Action_x0020_By}}
                                    </b-col>
                                </b-row>
                                <b-modal :id="'description' + regItem.Id+'modal'" size="lg" :title="regItem.Title" ok-only>
                                    <p v-html="regItem.Body"></p>
                                </b-modal>
                            </b-card>
                        </b-col>
                    </b-row>
                </RecycleScroller>
            </b-col>

            <b-col cols="6">
                <label v-if="noteError" class="error-label">{{noteError}}</label>
                <label v-if="exCloudError" class="error-label">{{exCloudError}}</label>
                <b-spinner v-if="loadingNotes" variant=info></b-spinner>
                <b-row class="list-pane">
                    <b-col cols="6">
                        <b-card 
                            v-for="[noteKey, note] of this.notesA"
                            :key="'note' + noteKey"
                            class="note-card"
                            v-bind:class="{ 
                                pulse : note.priority == 1,
                                highNote : note.priority == 1,
                                normalNote : note.priority == 2,
                                lowNote : note.priority == 3
                                }"
                            @contextmenu.prevent.stop="handleNoteClick($event, noteKey)"
                        >
                            <b-row class="device-title">
                                <b-col cols=10>
                                    {{note.message}}
                                </b-col>
                                <b-col cols=2>
                                    <b-button @click="deleteNote(noteKey)" variant="danger">X</b-button>
                                </b-col>
                            </b-row>
                        </b-card>
                    </b-col>
                    <b-col cols="6">
                        <b-card 
                            v-for="[noteKey, note] of this.notesB"
                            :key="'note' + noteKey"
                            class="note-card"
                            v-bind:class="{ 
                                pulse : note.priority == 1,
                                highNote : note.priority == 1,
                                normalNote : note.priority == 2,
                                lowNote : note.priority == 3
                                }"
                            @contextmenu.prevent.stop="handleNoteClick($event, noteKey)"
                        >
                            <b-row class="device-title">
                                <b-col cols=10>
                                    {{note.message}}
                                </b-col>
                                <b-col cols=2>
                                    <b-button @click="deleteNote(noteKey)" variant="danger">X</b-button>
                                </b-col>
                            </b-row>
                        </b-card>
                    </b-col>
                </b-row>
                <b-spinner v-if="loadingDevices" variant=info></b-spinner>
                <RecycleScroller
                    class="scroller"
                    :items="deviceDoubles"
                    :item-size="115"
                    key-field=id
                    v-slot="{ item }"
                    v-if="!showHidden"
                >
                    <b-row class="list-pane">
                        <b-col 
                            cols="6"
                            v-for="device of item.data"
                            :key="device.ipHostname"
                        >
                        
                            <b-card 
                                class="device-card"
                                v-bind:class="{ dissconnect: !device.connected }"
                                @contextmenu.prevent.stop="handleDeviceClick($event, device)"
                            >
                                <b-row class="device-title dot-wrap">
                                    {{`${device.hostName} : ${device.ip}`}}
                                </b-row>
                                <b-row class="device-location  dot-wrap">
                                    {{`${device.locations[1]} ${device.locations[3]}`}}
                                </b-row>
                            </b-card>
                        </b-col>
                    </b-row>
                </RecycleScroller>
                <RecycleScroller
                    class="scroller"
                    :items="hiddenDeviceDoubles"
                    :item-size="115"
                    key-field=id
                    v-slot="{ item }"
                    v-else
                >
                    <b-row class="list-pane">
                        <b-col 
                            cols="6"
                            v-for="device of item.data"
                            :key="device.ipHostname"
                        >
                        
                            <b-card 
                                class="device-card"
                                v-bind:class="{ dissconnect: !device.connected}"
                                @contextmenu.prevent.stop="handleHiddenDeviceClick($event, device)"
                            >
                                <b-row class="device-title dot-wrap">
                                    {{`${device.hostName} : ${device.ip}`}}
                                </b-row>
                                <b-row class="device-location  dot-wrap">
                                    {{`${device.locations[1]} ${device.locations[3]}`}}
                                </b-row>
                            </b-card>
                        </b-col>
                    </b-row>
                </RecycleScroller>
            </b-col>
        </b-row>
        <b-form-select v-model="notePriority" :options="notePriorities"></b-form-select>
        <b-modal id="add-note-modal" size="lg" title="Add a note" @ok="addNote()">
            <b-form-textarea
                ref="note"
                id="textarea"
                v-model="newNote"
                placeholder="Enter a new note..."
                rows="3"
                max-rows="6"
            ></b-form-textarea>
            <br>
            <b-form-select class="mb-2 mr-sm-2 mb-sm-0" v-model="notePriority" :options="notePriorities"></b-form-select>
        </b-modal>

    <vue-simple-context-menu
      :elementId="'hideMenu'"
      :options="[{name: 'Hide', slug: 'Hide'}]"
      :ref="'hideOption'"
      @option-clicked="hideClicked"
    >
    </vue-simple-context-menu>

    <vue-simple-context-menu
      :elementId="'showMenu'"
      :options="[{name: 'Show', slug: 'Show'}]"
      :ref="'showOption'"
      @option-clicked="showClicked"
    >
    </vue-simple-context-menu>

    <vue-simple-context-menu
      :elementId="'priorityMenu'"
      :options="notePrioritiesMenu"
      :ref="'priorityOptions'"
      @option-clicked="priorityChange"
    >
    </vue-simple-context-menu>
    
    </div>
</template>

<script>

import CONSTANTS from "./assets/CONSTANTS.json"; 
import axios from 'axios';
import { DateTime } from 'luxon';

Array.prototype.getMin = function(attrib) {
    return (this.length && this.reduce(function(prev, curr){ 
        return prev[attrib] < curr[attrib] ? prev : curr; 
    })) || null;
}

export default {
    name: 'App',

    computed: {
        // Splits the It register tickets list into a list of objects with each object having 2 tickets inside it
        // This is done to allow for two columns to exist whilst scrolling together in display 
        itRegDoubles: function() {
            let regHold = []
            for (let i = 0; i < this.itRegList.length; i+=2) {
                if (i >= this.itRegList.length - 1) {
                    regHold.push({ data: [this.itRegList[i]], id:i})
                } else {
                    regHold.push({ data: [this.itRegList[i], this.itRegList[i+1]], id:i})
                }
            }
            return regHold
        },

        // Splits half of the notes from the note list into notesA to allow for a duel column display
        notesA: function() {
            const splitList = Object.entries(this.notes).filter((item, index) => {
                return index % 2 == 0
            })
            return splitList
        },

        // Splits half of the notes from the note list into notesB to allow for a duel column display
        notesB: function() {
            const splitList = Object.entries(this.notes).filter((item, index) => {
                return index % 2 == 1
            })
            return splitList
        },

        // Splits the device list into a list of objects with each object having 2 devices inside it
        // This is done to allow for two columns to exist whilst scrolling together in display 
        deviceDoubles: function() {
            let deviceHold = []
            for (let i = 0; i < this.deviceList.length; i+=2) {
                if (i >= this.deviceList.length - 1) {
                    deviceHold.push({ data: [this.deviceList[i]], id:i})
                } else {
                    deviceHold.push({ data: [this.deviceList[i], this.deviceList[i+1]], id:i})
                }
            }
            return deviceHold
        },

        // Splits the hidden device list into a list of objects with each object having 2 devices inside it
        // This is done to allow for two columns to exist whilst scrolling together in display 
        hiddenDeviceDoubles: function() {
            let hideHold = []
            for (let i = 0; i < this.hiddenDevices.length; i+=2) {
                if (i >= this.hiddenDevices.length - 1) {
                    hideHold.push({ data: [this.hiddenDevices[i]], id:i})
                } else {
                    hideHold.push({ data: [this.hiddenDevices[i], this.hiddenDevices[i+1]], id:i})
                }
            }
            return hideHold
        }
    },

    data () {
        return {
            deviceList : [],
            hiddenDevices : [],
            itRegList : [],
            notes: {},
            noteError: null,
            itRegError : null,
            exCloudError : null,
            newNote : null,

            loadingDevices : false,
            loadingItReg : false,
            loadingNotes : false,
            lastUpdated : null,
            
            showHidden : false,

            oldestTcketId : null,
            ticketPriorities : { 1 : 0, 2 : 0, 3 : 0 },

            notePriorities : null,
            notePriority : null,
            notePrioritiesMenu : []
        }
    },

    async mounted() {
        this.notePriorities = CONSTANTS.priorities.selectList
        this.notePrioritiesMenu = CONSTANTS.priorities.menuList
        this.update()

        this.timer = setInterval(() => {
            this.update()
        }, CONSTANTS.refreshMinutes * 60000) // Converts to milliseconds because that's just how this wants to work
    },

    beforeDestroy() {
    // Destroy timer before leaving the page
      if(this.timer){
        clearInterval(this.timer);
      }
    },

    methods: {

        // Event handeler to enable a right click options menu on the device cards
        handleDeviceClick (event, item) {
            this.$refs.hideOption.showMenu(event, item)
        },

        // Event handeler to enable a right click options menu on the hidden device cards
        handleHiddenDeviceClick (event, item) {
            this.$refs.showOption.showMenu(event, item)
        },

        // Event handeler to enable a right click options menu on the note cards
        handleNoteClick (event, item) {
            this.$refs.priorityOptions.showMenu(event, item)
        },

        // Triggered when the hide option is slected from the right click options on devices
        // Moves the given device to the hidden deivces list
        hideClicked (event) {
            const index = this.deviceList.findIndex(x => x.ipHostName == event.item.ipHostName);
            this.hiddenDevices.push(this.deviceList[index])
            this.deviceList.splice(index, 1)
        },

        // Triggered when the show option is slected from the right click options on hidden devices
        // Moves the given device to the deivce list
        showClicked(event) {
            const index = this.hiddenDevices.findIndex(x => x.ipHostName == event.item.ipHostName);
            this.deviceList.push(this.hiddenDevices[index])
            this.hiddenDevices.splice(index, 1)
            this.deviceList.sort((a, b) => (a.connected > b.connected) ? 1 : -1)
        },
        
        // Triggered when a priority option is slected from the right click menu on note cards
        // Calls patchPriority() if the selected priority is different from the existing priority
        priorityChange(event) {
            const noteId = event.item
            const newPriority = event.option.slug
            if (this.notes[noteId].priority != newPriority) {
                this.patchPriority(noteId, newPriority)
            }
        },
        
        // Triggered when a item card in the IT register is clicked
        // Opens a modal with the ticket's body or generates a toast for the user to inform them there is no description
        showModal(item) {
            if (item.Body) {
                this.$bvModal.show(`description${item.Id}modal`)
            } else {
                this.makeToast("This ticket does not currently have a description", "info")
            }
        },

        // Generates a toast notification of the given varient in the bottom left
        // Uses vue-toast-notification
        // text : Message displayed on the toast
        // varient : must be one of: ["success", "info", "warning", "error", "default"]
        makeToast(text, varient) {
            this.$toast.open({
                message : text,
                type : varient,
                position : "bottom-left",
                duration : 3000,
                dismissible : false
            });
        },

        // Updates all lists
        // Calls getNotes(), getItRegList() and getExCloudDeviceList()
        // Sets the last updated timestamp once the extreme cloud call returns (extreme cloud was chosen as it seems to be the slowest to return)
        async update() {
            this.exCloudError = null;
            this.itRegError = null;
            this.noteError = null;
            this.getNotes()
            this.getItRegList()
            this.getExCloudDeviceList().then(
                this.lastUpdated = DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)
            )
            
        },

        // A generic error handeler for returns from the API calling function
        // error : the error object returned from the API call
        // service : an id string for what service encountered issues. Must be one of : ["exCloud", "itReg", "notes"]
        errorHandle(error, service, type) {

            let errPrefix;
            if (service == 'exCloud') {
                errPrefix = CONSTANTS.exCloudAPI.errorMsgPrefix;
            } else if (service == 'itReg') {
                errPrefix = CONSTANTS.sharePointAPI.errorMsgPrefix;
            } else if (service == 'notes') {
                errPrefix = CONSTANTS.notes.errorMsgPrefix[type];
            }
            const errMsgs = CONSTANTS.errorMsgs;
            let errMsg;
            switch(error.response.status) {
                case 400:
                    errMsg = errPrefix + errMsgs[400];
                    break;
                case 401:
                    errMsg = errPrefix + errMsgs[401];
                    break;
                case 403:
                    errMsg = errPrefix + errMsgs[403];
                    break;
                case 404:
                    errMsg = errPrefix + errMsgs[404];
                    break;
                case 500:
                    errMsg = errPrefix + errMsgs[500];
                    break;
                default:
                    errMsg = errPrefix + errMsgs["misc"];
            }

            if (service == 'exCloud') {
                this.exCloudError = errMsg;
            } else if (service == 'itReg') {
                this.itRegError = errMsg;
            } else if (service == 'ntoes') {
                this.noteError = errMsg;
            }
        },

        // Triggered by the "Add a note" button
        // Clears any previous inputs
        // Focuses the user on the text input so they can start typing right away
        makeNote() {
            this.newNote = ''
            setTimeout(()=>{ this.$refs.note.$el.focus() }, 50) // Timeout was needed because even nextTick wasn't working. Not ideal but it works
        },

        // Calls the get method of the note endpoint
        // Sets the notes list from the return or catches any erros and gives them to errorHandle()
        // If an error is encountered, the notes list is cleared
        async getNotes() {
            this.loadingNotes = true

            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/notes`
            await axios.get(url).then(response => {
                this.notes = response.data
            }).catch(error => {
                this.errorHandle(error, "notes", 'get')
                this.notes = []
            });
            this.loadingNotes = false
        },

        // Calls the post method of the note endpoint
        // Collects the note text from the input in the note adding modal and the priority from the select also in that modal
        // As no body is returned, a toast is displayed for both success or failure (styled based on success of the API call)
        // Calls getNotes to update the note list once finised attempting the post
        async addNote(noteText, priority) {

            if (noteText == null) {
                noteText = this.newNote
                this.newNote = null
            }

            if (priority == null) {
                if (this.notePriority == null) {
                    priority = 2
                } else {
                    priority = this.notePriority
                    this.notePriority = null
                }
            }

            let body = {
                "note" : { 
                    "message" : noteText,
                    "priority" : priority
                } 
            }

            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/notes`
            await axios.post(url, body).then(response => {
                this.makeToast(response.data, 'success')
            }).catch(error => {
                this.makeToast(error.response.data, 'error')
            });

            await this.getNotes()
        },

        // Calls the delete method of the note endpoint
        // The note key comes from the event on clicking the X button on the note
        // As no body is returned, a toast is displayed for both success or failure (styled based on success of the API call)
        // Calls getNotes to update the note list once finised attempting the post
        async deleteNote(noteKey) {
            this.$delete(this.notes, noteKey)
            
            let body = {
                key: noteKey
            }
            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/notes`
            await axios.delete(url, {data : body}).then(response => {
                this.makeToast(response.data, 'success')
            }).catch(error => {
                this.makeToast(error.response.data, 'error')
            });

            await this.getNotes()
        },

        // Calls the patch method of the endpoint
        // The id comes from the event of selecting a priority on the note card right click menu
        // As no body is returned, a toast is displayed for both success or failure (styled based on success of the API call)
        // Calls getNotes to update the note list once finised attempting the post
        async patchPriority(id, priority) {
            let body = {
                "id" : id,
                "priority" : priority
            }

            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/notes`
            await axios.patch(url, body).then(response => {
                this.makeToast(response.data, 'success')
            }).catch(error => {
                this.makeToast(error.response.data, 'error')
            });

            await this.getNotes()
        },

        // Calls the get method of the ex_cloud endpoint
        // Calls processExcloud() with the returned device list or catches any erros and gives them to errorHandle()
        // If an error is encountered, the device list is cleared
        async getExCloudDeviceList() {
            this.loadingDevices = true

            let config = {
                params: {
                    page : 0,
                    pageSize : 200
                }
            }

            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/ex_cloud`
            await axios.get(url, config).then(response => {
                this.processExcloud(response.data.data)
            }).catch(error => {
                this.errorHandle(error, "exCloud", 'get')
                this.deviceList = []
            });
            this.loadingDevices = false
        },

        // Triggered one successful return of the device list from the get method
        // Sorts the dissconnected devices to the top of the list
        // Replaces any null locations with an array to display location unknown
        // Adds an ipHostName field to combine the given fields to create a unique key for displaying the device cards
        // Moves any previously hidden devices into the hidden devices list (would be annoying if you could only hide stuff until it updates again)
        // Sets the deviceList and hiddenDevices list
        processExcloud(devices) {
            devices.sort((a, b) => (a.connected > b.connected) ? 1 : -1)
            let toHide = []
            for (let device of devices) {
                
                if (device.locations == null) {
                    device.locations = ['', 'location', '', 'unknown']
                }
                device['ipHostName'] = `${device.ip}${device.hostName}`

                if (this.hiddenDevices.findIndex(x => x.ipHostName == device.ipHostName) != -1) {
                    toHide.push(device.ipHostName)
                } 
            }
            let hidden = []
            for (let hideId of toHide) {
                let target = devices.findIndex(x => x.ipHostName == hideId)
                hidden.push(devices[target])
                devices.splice(target, 1)
            }

            this.hiddenDevices = hidden
            this.deviceList = devices
        },

        // Calls the get method of the it)reg endpoint
        // Sets itRegList from the return of calling processItReg on the response data or  catches any erros and gives them to errorHandle()
        // If an error is encountered, the device list is cleared
        async getItRegList() {
            this.loadingItReg = true

            const configSp = CONSTANTS.sharePointAPI

            let filterString = ""
            var first = true

            for (let key of configSp.filter.status) {
                if (!first) {
                    filterString += " or "
                } else {
                    first = false
                }
                filterString += `startswith(Status,'${key}')`
            }

            let config = {
                params: {
                    select : configSp.targetColumns,
                    orderOn : configSp.order.orderOn,
                    orderBy: configSp.order.orderBy,
                    filter : filterString,
                    title: configSp.itRegListName
                }
            }
            
            const url = `${CONSTANTS.serverAddress.base}:${CONSTANTS.serverAddress.port}/it_reg`
            await axios.get(url, config).then(response => {
                this.itRegList = this.processItReg(response.data)
            }).catch(error => {
                this.errorHandle(error, "itReg", 'get')
                this.itRegList = []
            });

            this.loadingItReg = false
        },

        // Processes the recieved list of IT register tickets
        // Tallies the counts of each ticket priority level
        // Changes null valvues of awaiting action by to "Not Assigned"
        // Sorts the list based on priority then age/date
        // Returns the processed list
        processItReg(itRegPreList) {
            this.ticketPriorities = { 1 : 0, 2 : 0, 3 : 0 } // Reset current ticket counters
            for (let item of itRegPreList) {
                item.displayDate = this.getDisplayDate(item.Created)
                if (item.Awaiting_x0020_Action_x0020_By == null) {
                    item.Awaiting_x0020_Action_x0020_By = "Not assigned"
                }
                this.ticketPriorities[item.Priority[1]] += 1
            }
            itRegPreList.sort((a, b) => {
                if (a.Priority[1] > b.Priority[1]) {
                    return 1
                } else if (a.Priority[1] < b.Priority[1]) {
                    return -1
                } else {
                    return a.Created > b.Created
                }
            })

            this.oldestTcketId = itRegPreList.getMin('Created').Id

            return itRegPreList
        },

        // Called by processItReg for each ticket in the active register
        // Takes a date-time stamp and creates a more user friendly string to display to indicate the ticket's age
        // Returns display string for the ticket's age
        getDisplayDate(dateTimeStamp) {
            const dateStamp = new DateTime.fromISO(dateTimeStamp)
            const now = new DateTime.now()

            let displayDate;

            if (dateStamp.hasSame(now, 'day')) {
                // today
                // Show hrs
                const hours = Math.floor(now.diff(dateStamp, 'hours').hours)
                if (hours == 0) {
                    displayDate = 'now'
                } else if (hours == 1) {
                    displayDate = `${Math.floor(now.diff(dateStamp, 'hours').hours)} hour ago`
                } else {
                    displayDate = `${Math.floor(now.diff(dateStamp, 'hours').hours)} hours ago`
                }
            } else if (dateStamp.hasSame(now, 'year') && dateStamp.weekNumber == now.weekNumber) {
                // this week
                // Show day of week
                displayDate = `${dateStamp.weekdayLong} at ${dateStamp.toLocaleString(DateTime.TIME_SIMPLE)}`
            } else {
                displayDate = `${dateStamp.day} ${dateStamp.monthLong}`
            }
            return displayDate
        }
    }

}
</script>

<style>
body{
    background-image: url('./assets/circle graphic.jpg');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: center;
    min-width: 1300px;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 6vh;
}

.nav {
    position: fixed;
    left: 0;
    right: 0;
    width: 101vw;
    z-index: 20;
    background-color: #003865;
    margin-top: -60px !important;
    padding-top: 10px;
}

.page-title {
    color: white;
    font-size: 150%;
    font-weight: 700;
    float: left;
    margin: 10px;
    padding-left: 10px;
}

.ticket-title {
    color: white;
    font-size: 130%;
    font-weight: 700;
    float: right;
    margin: 13px 0px 0px 25px !important;
    padding-left: 10px;
}

.page-sub-title {
    color: white;
    margin: 10px;
    margin-right: 30px;
}

.nav-button {
    margin-left: 5px !important;
    border-radius: 3px !important;
}

.hiddenButton {
    border: 2px inset  rgb(82, 82, 82) !important;
    border-radius: 5px !important;
}

.right-push {
    padding-right: 5px;
    margin-right: -30px;
}

.dotted {
    border-style: dotted;
}

.main-pane {
    padding: 20px;
}

.list-pane {
    padding: 0px 10px 0px 10px;
}

.scroller {
  height: 91vh;
}

.error-label {
    background-color: red;
    color: white;
    font-weight: 700;
    border-radius: 10px;
    padding: 15px;
}

.item-card {
    border-radius: 5px;
    margin: 10px 5px 10px 5px;
    box-shadow: 3px 3px #888888d0;
    height: 160px;
}

.note-card {
    border-radius: 5px;
    margin: 3% 1% 3% 1%;
    box-shadow: 3px 3px #888888d0;
}

.lowNote {
    border: 1px solid  rgb(52, 147, 255) !important;
}

.normalNote {
    border: 2px solid  rgb(175, 175, 175) !important;
}

.highNote {
    border: 2px solid  red !important;
}

.device-card {
    border: 3px ridge rgb(53, 180, 3, 0.75) !important;
    border-radius: 5px;
    margin: 10px 5px 10px 5px;
    box-shadow: 3px 3px #888888d0;
    padding: 1% 3% 1% 3%;
    height: 95px;
}

.dissconnect {
    border: 4px ridge rgb(255, 0, 0) !important;
}

.device-title {
    font-weight: 600;
    text-align: start;
}

.card-header {
    background-color: rgb(119, 119, 119) !important;
    color: white;
    font-size: 120%;
}

.high {
    background-color: red !important; 
    margin: -9px -17px -9px -17px;
    padding: 10px;
    border-radius: 5px 5px 0px 0px;
    color: white;
}

.normal {
    background-color: #ffdb00 !important;
    margin: -9px -17px -9px -17px;
    padding: 10px;
    border-radius: 5px 5px 0px 0px;
    color: black;
}

.low {
    background-color: #00a500 !important;
    margin: -9px -17px -9px -17px;
    padding: 10px;
    border-radius: 5px 5px 0px 0px;
    color: white;
}

.text-start {
    text-align: start;
}

.text-end {
    text-align: end;
}

.item-title {
    font-weight: 600;
    text-align: start;
    font-size: 110%;
}

.item-sub-title {
    text-align: start;
    font-size: 110%;
    padding: 0% 0% 0% 5%;
}

.dot-wrap {
    text-overflow: ellipsis;
    overflow: hidden; 
    white-space: nowrap;
}

.left-float {
    display: inline-block;
}

.sub-title-box {
    height: 50px;
}

.close { /* Hides the X in the modal */
    display: none;
}

::-webkit-scrollbar { /* Hide all scroll bars. It just looks cleaner */
    width: 0px;
    height: 0px;
}

.pulse {
  animation: inverse-pulse 3s ease-out infinite;
}

.pulse:hover {
  animation: pulse 3s ease-out infinite;
}

@keyframes pulse {
  0% {
    -moz-box-shadow: 0 0 0 0 rgba(235, 72, 8, 0.8);
    box-shadow: 0 0 0 0 rgba(235, 72, 8, 0.6);
  }
  70% {
      -moz-box-shadow: 0 0 0 10px rgba(235, 72, 8, 0);
      box-shadow: 0 0 0 10px rgba(235, 72, 8, 0);
  }
  100% {
      -moz-box-shadow: 0 0 0 0 rgba(235, 72, 8, 0);
      box-shadow: 0 0 0 0 rgba(235, 72, 8, 0);
  }
}

@keyframes inverse-pulse {
  100% {
    -moz-box-shadow: 0 0 0 0 rgba(235, 72, 8, 0.8);
    box-shadow: 0 0 0 0 rgba(235, 72, 8, 0.6);
  }
  30% {
      -moz-box-shadow: 0 0 0 10px rgba(235, 72, 8, 0);
      box-shadow: 0 0 0 10px rgba(235, 72, 8, 0);
  }
  0% {
      -moz-box-shadow: 0 0 0 0 rgba(235, 72, 8, 0);
      box-shadow: 0 0 0 0 rgba(235, 72, 8, 0);
  }
}

</style>
