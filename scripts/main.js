
let scores = []
const API_URL = 'http://159.89.196.149/api/tanks'

fetch(`${API_URL}/scores`)
   .then(res => res.json())
   .then(data => console.log(data))
   .catch(err => console.error(err))

function postScore(username, score, level) {
   fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
         name: username,
         score: score,
         level: level
      }),
      headers: new Headers({
         'Content-Type': 'application/json'
      })
   })
   .catch(err => console.error(err))
}

function isInTop10(score) {
   for (let s in scores) {
      if (scores[s] < score) {
         // new highscore
         return true
      }
   }
   return false
}

window.onload = () => {
   Game.checkState = function() {
      if (Game.isGameOver() && Game.getEnemies() > 0) {
         console.log("Game over")
         if (isInTop10(Game.getScore())) {
            postScore(
               Game.getName(),
               Game.getScore(),
               Game.getLevel()
            )
         }
         Game.new()
      } else {
         Game.new()
      }
   }
}
