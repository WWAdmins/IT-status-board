<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <b-button @click="update()" variant="danger">Update</b-button>
        <b-row>
            <b-col cols=6>
                <p v-if="itRegError">{{itRegError}}</p>
                <b-row class="scrollable">
                    <b-col 
                        cols="6"
                        v-for="item in itRegList"
                        :key="'card' + item.Id"
                        @click="$root.$emit('bv::toggle::collapse', `description${item.Id}`)"
                    >
                        <b-card class="item-card">
                            <b-row align-h="start">
                                <b-col class="item-title">
                                    {{item.Title}}
                                </b-col>
                            </b-row>
                            <b-row align-h="start">
                                {{`${item.Status} ${item.Id}`}}
                            </b-row>
                            <b-row class="over">
                                <p class="left-float">
                                    {{`Created: ${item.displayDate}`}}
                                </p>
                                <p class="left-float">
                                    {{item.Site}}
                                </p>
                                <p class="left-float">
                                    {{item.Awaiting_x0020_Action_x0020_By}}
                                </p>
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
                <b-row class="scrollable">
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
            itRegError : null,
            exCloudError : null
        }
    },

    async mounted() {
        this.update()
    },

    methods: {

        async update() {
            await this.getItRegList()
            await this.getExCloudDeviceList()
        },

        errorHandle(error, type) {

            let errPrefix;
            if (type == 'exCloud') {
                errPrefix = CONSTANTS.exCloudAPI.errorMsgPrefix;
            } else if (type == 'itReg') {
                errPrefix = CONSTANTS.sharePointAPI.errorMsgPrefix;
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

            if (type == 'exCloud') {
                this.exCloudError = errMsg;
            } else if (type == 'itReg') {
                this.itRegError = errMsg;
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
                this.errorHandle(error, "exCloud")
            });
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
                }
                this.itRegError = null
            }).catch(error => {
                this.errorHandle(error, "itReg")
            });
        },

        getDisplayDate(dateTimeStamp) {
            const dateStamp = new DateTime.fromISO(dateTimeStamp)
            const now = new DateTime.now()
            let displayDate;

            if (dateStamp.hasSame(now, 'day')) {
                // today
                // Show hrs
                displayDate = `${Math.floor(now.diff(dateStamp, 'hours').hours)} hours ago`
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

.item-card {
    border: 2px solid  rgb(175, 175, 175) !important;
    border-radius: 20px;
    margin: 3% 1% 3% 1%;
    box-shadow: 3px 3px #888888d0;
    padding: 1% 3% 1% 3%;
}

.device-card {
    border: 3px ridge rgb(53, 180, 3, 0.75) !important;
    border-radius: 20px;
    margin: 20px;
    box-shadow: 3px 3px #888888d0;
    padding: 1% 3% 1% 3%;
}

.dissconnect {
    border: 4px ridge rgb(255, 0, 0) !important;
}

.device-title {
    font-weight: 600;
}

.item-title {
     font-weight: 600;
     text-align: start;
     font-size: 110%;
}

.scrollable {
    overflow-y: auto;
}

</style>
