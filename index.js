'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const PROJECTID = 'poc-ccai';
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
admin.initializeApp();
const db = admin.firestore();  
db.settings(
  {
    projectId: PROJECTID,
    timestampsInSnapshots: true
  }
);
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  
  function replaceAll(string, search, replace) {
  	return string.split(search).join(replace);
  }
 
  //Function para pegar a música mais tocada de acordo com o gênero musical
  function mostPlayed (agent) {
      // Get the value from the JSON data provided by Dialogflow that goes with the music-genre parameter.
      const genre = replaceAll(JSON.stringify(agent.parameters.musicGenre), '"', '');

      // Get the database collection "most_played" and the document that matches "genre" from Firestore.
      // const dialogflowAgentDoc = db.collection('most_played').doc(genre);
      
      // Get the value of the document and send it to the user.
      return db.collection('most_played').doc(genre).get()
        .then(doc => {
          if (!doc.exists) {
            agent.add('No data found in the database!');
          } else {
            const title = doc.data().title;
            const composer = doc.data().composer;
            const message = `Para `.concat(genre, ", a música mais tocada é ", title, ", composta por ", composer, ".");

            console.log('#: ' + message);

            agent.add(message);
          }
          return Promise.resolve('Read complete');
        }).catch((err) => {
          agent.add('Error reading entry from the Firestore database.');

        });
    }
    
    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    // Map each intent (defined in Dialogflow) with the function name in this Cloud Function. 
    intentMap.set('list-most-played', mostPlayed);

    try{
      agent.handleRequest(intentMap);
    }
    catch(e){
      console.log(e);
    }
});