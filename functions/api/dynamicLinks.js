const CONSTANTS = require('../constants');
const axios = require('axios').default; 

exports.createLinkForFolder = function(folderId) {
    if (folderId) {
        return axios({
            method: 'post',
            url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${CONSTANTS.WEB_API_KEY}`,
            data: {
                "dynamicLinkInfo": {
                    "domainUriPrefix": `${CONSTANTS.DYNAMIC_LINKS_DOMAIN_URI_PREFIX}`,
                    "link": `${CONSTANTS.WEB_URL}/${CONSTANTS.COLLECTIONS}/${folderId}`,
                    // "androidInfo": {
                    //     "androidPackageName": "com.example.android"
                    // },
                    "iosInfo": {
                        "iosBundleId": CONSTANTS.IOS_BUNDLE_ID
                    }
                },
                "suffix": {
                    "option": "UNGUESSABLE"
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    return null
}