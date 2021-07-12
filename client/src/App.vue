<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <b-button @click="update()" variant="danger">Update</b-button>
        <b-button v-b-modal.add-note-modal variant="primary">Add a note</b-button>
        <b-row class="main-pane">
            <b-col cols=6>
                <p v-if="noteError">{{noteError}}</p>
                <p v-if="itRegError">{{itRegError}}</p>
                <b-row class="list-pane">
                    <!-- (let [noteKey, note] of Object.entries(this.notes)) -->
                    <b-col
                        cols="6"
                        v-for="[noteKey, note] of Object.entries(this.notes)"
                        :key="'note' + noteKey"
                    >
                        <b-card class="item-card">
                            <b-row class="device-title">
                                <b-col cols=10>
                                    {{note}}
                                </b-col>
                                <b-col cols=2>
                                    <b-button @click="deleteNote(noteKey)" variant="danger">X</b-button>
                                </b-col>
                            </b-row>
                        </b-card>
                    </b-col>

                    <b-col 
                        cols="6"
                        v-for="item in itRegList"
                        :key="'card' + item.Id"
                        @click="$root.$emit('bv::toggle::collapse', `description${item.Id}`)"
                    >
                        <b-card class="item-card">
                            <template #header class="card-header">
                                <b-row>
                                    <b-col class="text-start">
                                        {{item.Status}}
                                    </b-col>
                                    <b-col class="text-end">
                                        {{item.Id}}
                                    </b-col>
                                </b-row>
                            </template>
                            <b-row>
                                <b-col class="item-title">
                                    {{item.Title}}
                                </b-col>
                            </b-row>
                            <b-row class="over">
                                <b-col cols=auto class="left-float">
                                    {{`Created: ${item.displayDate}`}}
                                </b-col>
                                <b-col cols=auto class="left-float">
                                    {{item.Site}}
                                </b-col>
                                <b-col cols=auto  class="left-float">
                                    {{item.Awaiting_x0020_Action_x0020_By}}
                                </b-col>
                            </b-row>
                            <b-collapse :id="'description' + item.Id" accordion="my-accordion">
                                <hr>
                                <p v-html="item.Body"></p>
                            </b-collapse>
                        </b-card>

                    </b-col>
                </b-row>
            </b-col>

            <b-col cols="6">
                <p v-if="exCloudError">{{exCloudError}}</p>
                <b-row class="list-pane">
                    <b-col
                        cols="6"
                        v-for="device in deviceList"
                        :key="'card' + device.ip + device.hostName"
                    >
                        <b-card 
                            class="device-card"
                            v-bind:class="{ dissconnect: !device.connected}"
                        >
                            <b-row class="device-title">
                                {{`${device.hostName} : ${device.ip}`}}
                            </b-row>
                            <b-row class="device-location">
                                {{`${device.locations[1]} ${device.locations[3]}`}}
                            </b-row>
                        </b-card>
                    </b-col>
                </b-row>
            </b-col>
        </b-row>
        <b-modal id="add-note-modal" size="lg" title="Add a note" @ok="addNote()">
            <b-form-textarea
                id="textarea"
                v-model="newNote"
                placeholder="Enter a new note..."
                rows="3"
                max-rows="6"
            ></b-form-textarea>
        </b-modal>
    </div>
</template>

<script>

// import SECURE from "./assets/secure.json"; 
import CONSTANTS from "./assets/CONSTANTS.json"; 
import axios from 'axios';
import { DateTime } from 'luxon';

export default {
    name: 'App',

    data () {
        return {
            deviceList : [],
            itRegList : [],
            notes: {},
            noteError: null,
            itRegError : null,
            exCloudError : null,
            newNote : null
        }
    },

    async mounted() {
        this.update()

        this.timer = setInterval(() => {
            console.log("updating")
            this.update()
        }, CONSTANTS.refreshMinutes * 60000)
    },

    beforeDestroy() {
    // Destroy timer before leaving the page
      if(this.timer){
        clearInterval(this.timer);
      }
    },

    methods: {

        async update() {
            this.getNotes()
            this.getItRegList()
            this.getExCloudDeviceList()
            
        },

        errorHandle(error, service, type) {

            let errPrefix;
            if (service == 'exCloud') {
                errPrefix = CONSTANTS.exCloudAPI.errorMsgPrefix;
            } else if (type == 'itReg') {
                errPrefix = CONSTANTS.sharePointAPI.errorMsgPrefix;
            } else if (type == 'notes') {
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
            } else if (type == 'itReg') {
                this.itRegError = errMsg;
            } else if (type == 'ntoes') {
                this.noteError = errMsg;
            }
        },

        async getExCloudDeviceList() {

            let config = {
                params: {
                    page : 0,
                    pageSize : 200
                }
            }

            await axios.get("http://localhost:8000/ex_cloud", config).then(response => {
                this.deviceList = response.data.data
                this.processExcloud()
                this.exCloudError = null
            }).catch(error => {
                this.errorHandle(error, "exCloud", 'get')
            });
        },

        async getNotes() {

            let config = {
                params: {
                    page : 0,
                    pageSize : 200
                }
            }

            await axios.get("http://localhost:8000/notes", config).then(response => {
                this.notes = response.data
                this.noteError = null
            }).catch(error => {
                this.errorHandle(error, "notes", 'get')
            });
        },

        async addNote(noteText) {

            if (noteText == null) {
                noteText = this.newNote
                this.newNote = null
            }

            let body = {
                note: noteText
            }

            await axios.post("http://localhost:8000/notes", body).then(response => {
                console.log(response.data)
            }).catch(error => {
                this.errorHandle(error, "notes", 'post')
            });

            await this.getNotes()
        },

        async deleteNote(noteKey) {
            this.$delete(this.notes, noteKey)
            
            let body = {
                key: noteKey
            }

            await axios.delete("http://localhost:8000/notes", {data : body}).then(response => {
                console.log(response.data)
            }).catch(error => {
                this.errorHandle(error, "notes", 'delete')
            });

            await this.getNotes()
        },

        processExcloud() {
            this.deviceList.sort((a, b) => (a.connected > b.connected) ? 1 : -1)
            for (let device of this.deviceList) {
                // console.log(device)
                if (device.locations == null) {
                    device.locations = ['', 'location', '', 'unknown']
                }
            }
        },

        async getItRegList() {

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
            
            await axios.get("http://localhost:8000/it_reg", config).then(response => {
                this.itRegList = response.data
                for (let item in this.itRegList) {
                    this.itRegList[item].displayDate = this.getDisplayDate(this.itRegList[item].Created)
                    if (this.itRegList[item].Awaiting_x0020_Action_x0020_By == null) {
                        this.itRegList[item].Awaiting_x0020_Action_x0020_By = "Not assigned"
                    }
                }
                this.itRegError = null
            }).catch(error => {
                this.errorHandle(error, "itReg", 'get')
            });
        },

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
    /* background-size: cover; */
    background-position: center;
    min-width: 350px;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

.dotted {
    border-style: dotted;
}

.main-pane {
    padding: 20px;
}

.list-pane {
    padding: 10px;
}

.item-card {
    border: 2px solid  rgb(175, 175, 175) !important;
    border-radius: 20px;
    margin: 3% 1% 3% 1%;
    box-shadow: 3px 3px #888888d0;
}

.device-card {
    border: 3px ridge rgb(53, 180, 3, 0.75) !important;
    border-radius: 20px;
    margin: 3% 1% 3% 1%;
    box-shadow: 3px 3px #888888d0;
    padding: 1% 3% 1% 3%;
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

.scrollable {
    overflow-y: auto;
}

</style>
