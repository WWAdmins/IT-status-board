<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <b-button @click="update()" variant="danger">Update</b-button>
        <b-button v-b-modal.add-note-modal variant="primary" @click="newNote=''">Add a note</b-button>
        <b-row class="main-pane">
            <b-col cols=6>
                <p v-if="itRegError">{{itRegError}}</p>
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
                            >
                                <template #header class="card-header">
                                    <b-row>
                                        <b-col cols=8 class="text-start dot-wrap">
                                            {{regItem.Status}}
                                        </b-col>
                                        <b-col cols=4 class="text-end">
                                            {{regItem.Id}}
                                        </b-col>
                                    </b-row>
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
                <p v-if="noteError">{{noteError}}</p>
                <p v-if="exCloudError">{{exCloudError}}</p>
                <b-row class="list-pane">
                    <b-col cols="6">
                        <b-card 
                            v-for="[noteKey, note] of this.notesA"
                            :key="'note' + noteKey"
                            class="note-card"
                        >
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
                    <b-col cols="6">
                        <b-card 
                            v-for="[noteKey, note] of this.notesB"
                            :key="'note' + noteKey"
                            class="note-card"
                        >
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
                </b-row>
                
                <RecycleScroller
                    class="scroller"
                    :items="deviceDoubles"
                    :item-size="115"
                    key-field=id
                    v-slot="{ item }"
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

import CONSTANTS from "./assets/CONSTANTS.json"; 
import axios from 'axios';
import { DateTime } from 'luxon';
// import vuescroll from 'vuescroll';

export default {
    name: 'App',

    components: {
    //   vuescroll
    },

    computed: {
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
        notesA: function() {
            const splitList = Object.entries(this.notes).filter((item, index) => {
                return index % 2 == 0
            })
            return splitList
        },
        notesB: function() {
            const splitList = Object.entries(this.notes).filter((item, index) => {
                return index % 2 == 1
            })
            return splitList
        },
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
        }
    },

    data () {
        return {
            deviceList : [],
            itRegList : [],
            notes: {},
            noteError: null,
            itRegError : null,
            exCloudError : null,
            newNote : null,
            toastCount: 0
        }
    },

    async mounted() {
        this.update()

        // this.timer = setInterval(() => {
        //     console.log("updating")
        //     this.update()
        // }, CONSTANTS.refreshMinutes * 60000)
    },

    beforeDestroy() {
    // Destroy timer before leaving the page
      if(this.timer){
        clearInterval(this.timer);
      }
    },

    methods: {

        showModal(item) {
            if (item.Body) {
                this.$bvModal.show(`description${item.Id}modal`)
            } else {
                this.makeToast("This ticket does not currently have a description", "info")
            }
        },

        makeToast(text, varient) {
            this.$toast.open({
                message : text,
                type : varient,
                position : "bottom-left",
                duration : 3000,
                dismissible : false
            });
        },

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
                this.makeToast(response.data, 'success')
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
                this.makeToast(response.data, 'success')
            }).catch(error => {
                this.errorHandle(error, "notes", 'delete')
            });

            await this.getNotes()
        },

        async getExCloudDeviceList() {

            let config = {
                params: {
                    page : 0,
                    pageSize : 200
                }
            }

            await axios.get("http://localhost:8000/ex_cloud", config).then(response => {
                this.processExcloud(response.data.data)
                this.exCloudError = null
            }).catch(error => {
                this.errorHandle(error, "exCloud", 'get')
            });
        },

        processExcloud(devices) {
            devices.sort((a, b) => (a.connected > b.connected) ? 1 : -1)
            for (let device of devices) {
                // console.log(device)
                if (device.locations == null) {
                    device.locations = ['', 'location', '', 'unknown']
                }
                device['ipHostName'] = `${device.ip}${device.hostName}`
            }
            this.deviceList = devices
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
                this.itRegList = response.data.slice(0,5)
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
    min-width: 1300px;
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
    padding: 0px 10px 0px 10px;
}

.scroller {
  height: 800px;
}

.item-card {
    border: 2px solid  rgb(175, 175, 175) !important;
    border-radius: 20px;
    margin: 10px 5px 10px 5px;
    box-shadow: 3px 3px #888888d0;
    height: 160px;
}

.note-card {
    border: 2px solid  rgb(175, 175, 175) !important;
    border-radius: 20px;
    margin: 3% 1% 3% 1%;
    box-shadow: 3px 3px #888888d0;
}

.device-card {
    border: 3px ridge rgb(53, 180, 3, 0.75) !important;
    border-radius: 20px;
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

::-webkit-scrollbar {
    width: 0px;
    height: 0px;
}

</style>
