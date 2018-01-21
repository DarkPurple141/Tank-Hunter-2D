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

window.dataLayer = window.dataLayer || [];
function gtag(){
   dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'UA-25942721-3');
