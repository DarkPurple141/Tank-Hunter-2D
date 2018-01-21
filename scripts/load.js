/*
populates the top scores list on load
*/

fetch(`${API_URL}/scores`)
   .then(res => res.json())
   .then(data => {
      data.forEach(item => scores.push(item))
   })
   .then(loadScores)
   .catch(err => console.error(err))
