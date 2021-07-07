<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <b-button @click="update()" variant="danger">Update</b-button>
        <b-button @click="verifyToken()" variant="danger">token</b-button>
        <b-col cols=6>
            <b-card 
                class="item-card"
                v-for="item in itRegList"
                :key="'card' + item.Id"
                @click="$root.$emit('bv::toggle::collapse', `description${item.Id}`)"
                >
                <b-row align-h="end">
                    <b-col align-self="start" class="dotted">
                        {{item.Title}}
                    </b-col>
                    <b-col cols=3>
                        {{`Created: ${item.displayDate}`}}
                    </b-col>
                    <b-col cols=2 align-h="end" class="dotted">
                        {{item.Site}}
                    </b-col>
                </b-row>
                <b-row>
                    <b-col cols=1>
                        {{item.Id}}
                    </b-col>
                    <b-col cols=3>
                        {{item.Status}}
                    </b-col>
                    <b-col cols=3>
                        {{item.Awaiting_x0020_Action_x0020_By}}
                    </b-col>
                </b-row>
                <b-collapse :id="'description' + item.Id" accordion="my-accordion">
                    <p v-html="item.Body"></p>
                </b-collapse>
            </b-card>
        </b-col>
    </div>
</template>

<script>

import SECURE from "./assets/secure.json"; 
import CONSTANTS from "./assets/CONSTANTS.json"; 
import axios from 'axios';
import { DateTime } from 'luxon'

export default {
    name: 'App',

    data () {
        return {
            deviceList : [],
            itRegList : []
        }
    },

    async mounted() {

        // await this.getExCloudDeviceList()
    },

    methods: {

        async update() {
            await this.getItRegList()
            // await this.getExCloudDeviceList()
        },

        async getExCloudDeviceList() {
                               
            let config = {
                headers: {
                    'Authorization': `Bearer ${SECURE.exCloud.token}`,
                    "X-AH-API-CLIENT-SECRET" : SECURE.exCloud.clientSecret,
                    "X-AH-API-CLIENT-ID" : SECURE.exCloud.clientId,
                    "X-AH-API-CLIENT-REDIRECT-URI" : SECURE.exCloud.redirectUri
                },
                params: {
                    ownerId : SECURE.exCloud.ownerId,
                    showActiveClientCount : true,
                    page : 0,
                    pageSize : 1000
                },
            }

            await axios.get(CONSTANTS.exCloudAPI.allDecives, config).then(response => {
                this.deviceList = response.data.data
                // console.log(this.deviceList)
            }).catch(error => {
                console.log(error);
                console.log(error.response.data.error.message);
            });
        },

        async getItRegList() {

            // await this.verifyToken()
            
            const constConfig = CONSTANTS.sharePointAPI

            const getLink = constConfig.getList.replace(constConfig.replaceFlag, constConfig.itRegListName)

            let filterString = "("
            var first = true

            for (let key of constConfig.filter.status) {
                if (!first) {
                    filterString += " or "
                } else {
                    first = false
                }
                filterString += `startswith(Status,'${key}')`
            }
            filterString += ")"
                               
            let config = {
                headers: {
                    'Authorization': `Bearer ${SECURE.sharePointAPI.token}`,
                    "accept" : constConfig.typeJson,
                    "content-type" : constConfig.typeJson
                },
                params: {
                    $select : constConfig.targetColumns,
                    $orderby : "Created desc",
                    $filter : filterString
                },
            }

            await axios.get(getLink, config).then(response => {
                this.itRegList = response.data.d.results
                for (let item in this.itRegList) {
                    this.itRegList[item].displayDate = this.getDisplayDate(this.itRegList[item].Created)
                }
            }).catch(error => {
                console.log(error);
                console.log(error.response.data.error.message);
            });
        },

        async verifyToken() {
            const secrConfig = SECURE.sharePointAPI
            const constConfig = CONSTANTS.sharePointAPI

            const oAuthLink = secrConfig.oAuthLink.replace(secrConfig.replaceFlag, secrConfig.tenant)

            const config = {
                headers: {
                    "accept" : constConfig.typeJson,
                    "content-type" : constConfig.typeJson,
                    "Access-Control-Allow-Origin" : '*'
                }
            }
            const body = {
                grant_type : secrConfig.grant_type,
                client_id : `${secrConfig.clientId}@${secrConfig.tenant}`,
                client_secret : secrConfig.client_secret,
                resource : `${secrConfig.resource}/${secrConfig.domain}@${secrConfig.tenant}`
            }

            await axios.post(oAuthLink, body, config).then(response => {
                console.log(response)
            }).catch(error => {
                console.log(error);
                console.log(error.response.data.error.message);
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
    border: 3px solid lightgray;
    border-radius: 20px;
    margin: 20px;
    box-shadow: 3px 3px #888888d0;
}


</style>
