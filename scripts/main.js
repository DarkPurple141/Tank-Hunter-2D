
let scores = []
const API_URL = 'http://159.89.196.149/api/tanks'
//const API_URL = 'http://localhost:8080/api/tanks'

fetch(`${API_URL}/scores`)
   .then(res => res.json())
   .then(data => {
      data.forEach(item => scores.push(item))
   })
   .catch(err => console.error(err))

function loadScores() {
   let list = document.querySelector('#topscores ol')
   for (let s in scores) {
      let el = document.createElement('li')

      list.appendChild(el)
      let div = document.createElement('div')

      el.appendChild(div)

      let name = document.createElement('p')
      name.innerHTML = scores[s].name
      div.appendChild(name)

      let score = document.createElement('p')
      score.innerHTML = scores[s].score
      div.appendChild(score)

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
      if (scores[s] < score) {
         // new highscore
         return true
      }
   }
   return false
}

window.onload = () => {
   let firstLoad = true

   Game.checkState = function() {
      if (firstLoad) {
         loadScores()
         firstLoad = !firstLoad
      }
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
      }
      /* now restart the game */
      Game.new()
   }
}
