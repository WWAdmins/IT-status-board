<template>
    <div id="app">
        <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
        <b-button @click="update()" variant="danger">test</b-button>
    </div>
</template>

<script>

import SECURE from "./assets/secure.json"; 
import CONSTANTS from "./assets/CONSTANTS.json"; 
import axios from 'axios';

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
            await this.getExCloudDeviceList()
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

            axios.get(CONSTANTS.exCloudAPI.allDecives, config).then(response => {
                this.deviceList = response.data.data
                // console.log(this.deviceList)
            }).catch(error => {
                console.log(error);
                console.log(error.response.data.error.message);
            });
        },

        async getItRegList() {
            
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

            axios.get(getLink, config).then(response => {
                this.itRegList = response.data.d.results
                // console.log(response.data.d.results)
            }).catch(error => {
                console.log(error);
                console.log(error.response.data.error.message);
            });
        }
    }

}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
