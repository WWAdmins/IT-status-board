// index.js


/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs')

const SPFetchClient = require("@pnp/nodejs-commonjs").SPFetchClient;
const sp = require("@pnp/sp-commonjs").sp;

const SECURE = require('./secure.json');
/**
 * App Variables
 */
const app = express();
const port = SECURE.PORT || "8000";
app.use(cors());
app.use(express.json())

const VALID_PRIORITIES_INT = [1,2,3]

sp.setup({
    sp: {
        fetchClientFactory: () => {
            return new SPFetchClient(SECURE.sPApi.sharePointLink, SECURE.sPApi.clientId, SECURE.sPApi.client_secret);
            },
    },
});

// Checks all required params are not null
// Calls web.lists method of pnp/sp-commonjs
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns the contents of the SharePoint list, otherwise returns the statusText for the error
async function getitReg(params) {
    console.log('Fetching IT register')

    let result = {};
    let isError = false;

    if (params == null || params.orderOn == null || params.filter == null || params.select == null) {
        result['status'] = 400
        result['statusText'] = "Bad request, missing querry fields"
        isError = true
        return [isError, result]
    }

    let orderBy = false
    if (params.orderBy != null) {
        orderBy = params.orderBy != 'desc';
    }

    // make a request to get the web's details
    const w = await sp.web();

    result = await sp.web.lists
        .getByTitle(params.title).items
        .select(params.select)
        .filter(params.filter)
        .orderBy(params.orderOn, orderBy)
        .get()
    .catch(error => {
        isError = true
        result = error.response
        return [isError, result]
    })
    
    if (isError) {
        result = result[1]
    }

    console.log("Returning IT register")
    return [isError, result]
}

// Sets up the header configs for the extreme cloud API call
// Calls the Extreme Cloud endpoint to get all registered devices
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns the device list, otherwise returns the statusText for the error
async function getExCloudDeviceList(params) {
    console.log('Fetching device list')
                            
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
    let isError = false;

    await axios.get("https://cloud-ie.aerohive.com/xapi/v1/monitor/devices/", config).then(response => {
        result = response.data
    }).catch(error => {
        result = error
        isError = true
    });

    console.log("Returning decive list")
    return [isError, result]
}

// Fetches the current set of notes from the sever side file
// First checks if the Notes file exists, then reads it's contents
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns the contents notes file, otherwise returns the statusText for the error
async function getNotes() {
    console.log('Fetching notes')

    let isError = false;
    let result;

    if(!fs.existsSync("notes.json")) {
        try {
            fs.writeFileSync('notes.json', JSON.stringify({}, null, 4), 'utf8')
        } catch (err) {
            result = err;
            isError = true;
        }
    }

    try {
        const jsonString = fs.readFileSync("./notes.json");
        result = JSON.parse(jsonString);
    } catch (err) {
        result = err;
        isError = true;
    }

    console.log('Returning notes')
    return [isError, result]
}

// Handels adding a new note
// Checks that the note to be added is valid
// Checks that the notes file exists, if not it generates a new one
// Reads the notes file and identifies the current highest key
// Gets the next valid key for use in hte notes file
// Adds the new note to the file
// Writes the notes back to the file
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns status message stating addition was successful, otherwise returns the statusText for the error
async function addNote(req) {
    console.log('Adding note')

    let isError = false;
    let result = "sucess";

    const newNote = req.body.note;
    if (newNote.message == '' || newNote.message == null) {
        result = [400, 'No message found in request'];
        isError = true;
        console.log('No message found in request')
        return [isError, result]
    }
    console.log(newNote.priority)
    if (!VALID_PRIORITIES_INT.includes(newNote.priority)) {
        result = [400, 'No priority found in request'];
        isError = true;
        console.log('No priority found in request')
        return [isError, result]
    }

    if(!fs.existsSync("notes.json")) {
        try {
            fs.writeFileSync('notes.json', JSON.stringify({}, null, 4), 'utf8')
        } catch (err) {
            result = err;
            isError = true;
            console.log('Failed to generate new notes file')
            return [isError, result]
        }
    }
    
    let noteJson;
    let maxKey;

    try {
        const jsonString = fs.readFileSync("./notes.json");
        noteJson = JSON.parse(jsonString);
        maxKey = Math.max(...Object.keys(noteJson).map((i) => Number(i)))
        if (maxKey == -Infinity) {
            maxKey = -1
        }
    } catch (err) {
        result = err;
        isError = true;
        console.log('Failed to read notes file')
        return [isError, result]
    }

    let nextKey = (maxKey + 1)%SECURE.maxKeyVal
    const currentKeys = Object.keys(noteJson).map(Number)
    while (currentKeys.includes(nextKey)) {
        nextKey = (nextKey + 3)%SECURE.maxKeyVal
    }

    noteJson[nextKey] = newNote

    try {
        fs.writeFileSync('notes.json', JSON.stringify(noteJson, null, 4), 'utf8')
        result = "Sucessfully added note"
    } catch (err) {
        result = err;
        isError = true;
        
        console.log('Failed to write notes file')
        return [isError, result]
    }

    console.log('Returning notes')
    return [isError, result]
}

// Handels updating the priotity of an existing note
// Checks that an id is provided in the request
// Checks a priority is included in the request and that it is vlaid
// Checks that the notes file exists
// Reads in notes file and checks if note with given id exists
// Updates priority of note then writes back to the notes file
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns status message stating update was successful, otherwise returns the statusText for the error
async function updatePriority(req) {
    console.log('Updating note')

    let isError = false;
    let result = "sucess"

    const id = req.body.id
    if (id == null) {
        result = [400, 'No id found in request'];
        isError = true;
        console.log('No id found in request')
        return [isError, result]
    }
    const priority = parseInt(req.body.priority)
    if (!VALID_PRIORITIES_INT.includes(priority)) {
        result = [400, 'Invalid priority found in request'];
        isError = true;
        console.log('Invalid priority found in request')
        return [isError, result]
    }

    if(!fs.existsSync("notes.json")) {
        result = [500, 'Unable to find notes'];
        isError = true;
        console.log('Unable to find notes to be updated')
        return [isError, result]
    }
    
    let noteJson;

    try {
        const jsonString = fs.readFileSync("./notes.json");
        noteJson = JSON.parse(jsonString);
    } catch (err) {
        result = err;
        isError = true;
        console.log('Failed to read notes file')
        return [isError, result]
    }

    if (noteJson[id] == null) {
        result = [404, `No note with id: ${id} found`];
        isError = true;
        console.log(`No note with id: ${id} found`)
        return [isError, result]
    }



    noteJson[id]["priority"] = priority

    try {
        fs.writeFileSync('notes.json', JSON.stringify(noteJson, null, 4), 'utf8')
        result = "Sucessfully updated note"
    } catch (err) {
        result = err;
        isError = true;
        
        console.log('Failed to write notes file')
        return [isError, result]
    }

    console.log('Finished updating notes')
    return [isError, result]
}

// Handels deleting notes
// Checks that a key is provided in the request
// Checks that the notes file exists
// Reads in notes file and checks if note with given id exists
// Deletes the given note from the set and writes the updated set back to the file
// Returns:
// isError : Boolean flag indicating if an error occured
// result : If successful, returns status message stating deletion was successful, otherwise returns the statusText for the error
async function deleteNote(req) {
    console.log('Deleting note')

    // console.log(req)
    const key = req.body.key

    let isError = false;
    let result = "sucess"

    if(!fs.existsSync("notes.json")) {
        result = "No notes exist";
        isError = true;
        console.log('No existing notes')
        return [isError, result]
    }

    let noteJson;

    try {
        const jsonString = fs.readFileSync("./notes.json");
        noteJson = JSON.parse(jsonString);
    } catch (err) {
        result = err;
        isError = true;
        console.log('Failed to read notes file')
        return [isError, result]
    }

    if (noteJson[key] == null) {
        result = [404, 'Failed to find note with id: ' + key];
        isError = true;
        console.log('Failed to find note with id: ' + key)
        return [isError, result]
    }
    
    delete noteJson[key]

    try {
        fs.writeFileSync('notes.json', JSON.stringify(noteJson, null, 4), 'utf8')
        result = "Sucessfully deleted note"
    } catch (err) {
        result = err;
        isError = true;
        
        console.log('Failed to write notes file')
        return [isError, result]
    }

    console.log('Deleteed note with id: ' + key)
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
        res.status(result.status).send(result.statusText);
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

app.get("/notes", async function(req, res) {
    const [isError, result] = await getNotes()
    if (!isError) {
        res.status(200).send(result);
    } else {
        res.status(500).send(result);
    }
});

app.post("/notes", async function(req, res) {
    const [isError, result] = await addNote(req)
    if (!isError) {
        res.status(201).send(result);
    } else {
        if (result[0] == 400) {
            res.status(result[0]).send(result[1]);
        } else {
            res.status(500).send(result);
        }
    }
});

app.delete("/notes", async function(req, res) {
    const [isError, result] = await deleteNote(req)
    if (!isError) {
        res.status(200).send(result);
    } else {
        if (result[0] == 404) {
            res.status(result[0]).send(result[1]);
        } else {
            res.status(500).send(result);
        }
    }
});

app.patch("/notes", async function(req, res) {
    const [isError, result] = await updatePriority(req)
    if (!isError) {
        res.status(200).send(result);
    } else {
        if (result.length > 1) {
            res.status(result[0]).send(result[1]);
        } else {
            res.status(500).send(result);
        }
    }
});

/**
 * Server Activation
 */
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});