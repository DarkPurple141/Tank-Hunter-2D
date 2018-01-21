
const API_URL = 'http://159.89.196.149/api/tanks'
let scores = []
//const API_URL = 'http://localhost:8080/api/tanks'

function loadScores() {

   let ordered = scores.map((item, index) => {
      return {
         rank: index + 1,
         name: item.name,
         date: new Date(item.date).toLocaleDateString(),
         level: item.level,
         score: item.score
      }
   })

   let list = document.querySelector('#topscores table tbody')

   for (let s in ordered) {
      let row = document.createElement('tr')

      list.appendChild(row)
      for (let key in ordered[s]) {
         let td = document.createElement('td')
         td.innerHTML = ordered[s][key]
         row.appendChild(td)
      }
   }
}


function postScore(username, score, level) {
   fetch(`${API_URL}/score`, {
      method: "POST",
      body: JSON.stringify({
         name: username,
         score: score,
         level: level
      }),
      headers: new Headers({
         'Access-Control-Request-Method': 'POST',
         'Content-Type': 'application/json'
      })
   })
   .then(() => {
      console.log("Score saved.")
   })
   .catch(err => console.error(err))
}

function isInTop10(score) {
   if (scores.length < 10)
      return true
   // else check if in top 10.
   for (let s in scores) {
      if (scores[s].score < score) {
         // new highscore
         return true
      }
   }
   return false
}

/**
   controls slider for settings.
*/
function slide() {
   let slider = document.getElementById("settings")
   if (slider.style.width == "250px") {
      slider.style.width = "0px"
   } else {
      slider.style.width = "250px"
   }
}

window.onload = () => {

   Game.checkState = function() {
      if (Game.isGameOver() && Game.getEnemies() > 0) {
         if (isInTop10(Game.getScore())) {
            console.log("New Top-10 score!")
            postScore(
               Game.getName(),
               Game.getScore(),
               Game.getLevel()
            )
         }
      }
      /* now restart the game */
      Game.new()
   }
}
