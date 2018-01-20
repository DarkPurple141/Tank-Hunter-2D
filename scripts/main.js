
let scores = []
const API_URL = 'http://159.89.196.149/api/tanks'
//const API_URL = 'http://localhost:8080/api/tanks'

fetch(`${API_URL}/scores`)
   .then(res => res.json())
   .then(data => {
      data.forEach(item => scores.push(item))
   })
   .then(()=> {
      console.log(scores)
   })
   .catch(err => console.error(err))

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
   .then(res => {
      console.log(res)
   })
   .catch(err => console.error(err))
}

function isInTop10(score) {
   if (scores.length < 10)
      return true
   // else check if in top 10.
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
            console.log("Top 10 YAY")
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
