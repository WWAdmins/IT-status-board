// index.js



/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
const cors = require('cors');
const axios = require('axios');

const SPFetchClient = require("@pnp/nodejs-commonjs").SPFetchClient;
const sp = require("@pnp/sp-commonjs").sp;

const SECURE = require('./secure.json')

/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "8000";
app.use(cors());


sp.setup({
    sp: {
        fetchClientFactory: () => {
            return new SPFetchClient(SECURE.sPApi.sharePointLink, SECURE.sPApi.clientId, SECURE.sPApi.client_secret);
            },
    },
});

async function getitReg(params) {
    console.log('fetching IT register')

    // make a request to get the web's details
    const w = await sp.web();
    // console.log(JSON.stringify(w, null, 2));

    let result;
    let isError = false;
    const orderBy = params.orderBy != 'desc';

    result = await sp.web.lists
        .getByTitle(params.title).items
        .select(params.select)
        .filter(params.filter)
        .orderBy(params.orderOn, orderBy)
        .get()
    .catch(error => {
        isError = true
        result = error
    })

    console.log("returning IT register")
    return [isError, result]
}

async function getExCloudDeviceList(params) {
    console.log('fetching device list')
                            
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
            page : params.page,
            pageSize : params.pageSize
        },
    }

    let result;
    let errorHold;
    let isError = false;

    await axios.get("https://cloud-ie.aerohive.com/xapi/v1/monitor/devices/", config).then(response => {
        result = response.data
    }).catch(error => {
        result = error
        isError = true
    });

    console.log("returning decive list")
    return [isError, result]
}

/**
 * Routes Definitions
 */
app.get("/it_reg", async function(req, res) {
    const [isError, result] = await getitReg(req.query)
    if (!isError) {
        res.status(200).send(result);
    } else {
        res.status(result.response.status).send(result.response.statusText);
    }
});

app.get("/ex_cloud", async function(req, res) {
    const [isError, result] = await getExCloudDeviceList(req.query)
    if (!isError) {
        res.status(200).send(result);
    } else {
        res.status(result.response.status).send(result.response.statusText);
    }
});

/**
 * Server Activation
 */
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});