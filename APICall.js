const fetch = require('node-fetch');

function getPromo() {
    let url = "https://khubite.000webhostapp.com/app/sg_supermarket/data_v1.json"
    return fetch(url, {
        method: 'get'   
    })
        .then(res => res.json())
        .then(jsonResponse => {
            if (jsonResponse && jsonResponse.length > 0) {
                return jsonResponse;
            } else {
                return "Error";
            }
        })
};

module.exports.getPromo = getPromo;


// getPromo("https://khubite.000webhostapp.com/app/sg_supermarket/data_v2.json").then(data => {
//     console.log(data);
// });