var player = require('play-sound')(opts = {})
var request = require('request');

const key = "{{API_KEY}}"
const secret = "{{API_SECRET}}"

let auth_string = Buffer.from(`${key}:${secret}`).toString('base64');
let last_played_id = null;
 
// Play a sound based on which plan was signed up for
function play_sign_up_sound(plan) {
  player.play(`sounds/${plan}.mp3`, function(err){
    if (err) throw err
  });
}

// Get the most recent sign up from the list of signups
function get_last_sign_up(array) {
  return array[0]
}

// Check if the signup was recent, this keeps sounds from
// playing every the app is restarted.
function is_recent(sign_up_time) {
  today = new Date();
  let recent_minutes = new Date(today.getTime() - (1000*60*5));
  sign_up_time = new Date(sign_up_time * 1000);

  if (recent_minutes < sign_up_time) {
    return true;
  }
  return false;
}

// Compare the ID of the last sign up to the most 
// recent sign up that a sound was played for, to 
// avoid playing sounds for the samae sign up multiple
// times.
function is_last_sign_up(sign_up_id) {
  if (sign_up_id == last_played_id) {
    return true;
  }
  return false;
}
 
// Process the API response, perform checks and if
// necessary play the alert sound.
function process_request(error, response, body) {
  if (!error  && response.statusCode == 200) {
    var info = JSON.parse(body);
    let last_sign_up = get_last_sign_up(info["calls"]);
    if (last_sign_up) {
      if (!is_last_sign_up(last_sign_up["id"])) {
       if (is_recent(last_sign_up["unix_time"])) {
          if (last_sign_up["sale"]) {
            sale = last_sign_up["sale"];
            play_sign_up_sound(sale["name"]);
            last_played_id = last_sign_up["id"];
          }
        }
      }
    }
  }
  else {
    console.log(response);
    console.log(error);
  }
}
 
// Basic options for NPM Request.
let options = {
  url: 'https://api.calltrackingmetrics.com/api/v1/accounts/25/calls/search.json?filter=form.form_name:"ctm-signups"',
  headers: {
    'User-Agent': 'ctm-sales-souncds',
    'Authorization': `Basic ${auth_string}`    
  }
};

// Send the request to the CallTrackingMetrics API.
function sendRequest() {
  request(options, process_request)
}

// Need to send it to the first time when the app loads, 
// or we'll have to wait for the interval to go by before
// it makes the first request. Not really needed, but
// I'm as patient as a toddler.
sendRequest();

// Using setInterval() the API is polled every 30 seconds
setInterval(sendRequest, (30*1000));