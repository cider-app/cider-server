const functions = require('firebase-functions');
const CONSTANTS = require('./constants');
const dynamicLinksApi = require('./api/dynamicLinks');
const algoliasearch = require('algoliasearch'); 
let grabity = require('grabity'); 

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

// App ID and API Key are stored in functions config variables
const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key; 
const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key; 

const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

// exports.onCreateFile = functions.firestore
//     .document(`${CONSTANTS.DATABASE.FILES}/{file}`)
//     .onCreate((snap, context) => {
//         const createdOn = snap.createTime; 

//         return snap.ref.set({
//             [CONSTANTS.DATABASE.CREATED_ON]: createdOn,
//             [CONSTANTS.DATABASE.MODIFIED_ON]: createdOn
//         }, { merge: true })
//     })

// exports.grabLinkMetadata = functions.firestore
//     .document(`${CONSTANTS.DATABASE.FILES}/{file}`)
//     .onCreate((snap, context) => {
//         const data = snap.data(); 
//         const link = data.link; 

//         return grabity.grabIt(link)
//             .then(result => {
//                 return snap.ref.set({
//                     [CONSTANTS.DATABASE.TITLE]: result.title ? result.title : '',
//                     [CONSTANTS.DATABASE.DESCRIPTION]: result.description ? result.description : '',
//                     [CONSTANTS.DATABASE.IMAGE_URL]: result.image ? result.image : '',
//                     [CONSTANTS.DATABASE.FAVICON]: result.favicon ? result.favicon : '',
//                 }, { merge: true })
//             })
//             .catch(error => console.log(error))
//     })

// exports.onUpdateFile = functions.firestore
//     .document(`${CONSTANTS.DATABASE.FILES}/{fileID}`)
//     .onUpdate((change, context) => {
//         const newData = change.after.data(); 
//         const modifiedOn = change.after.updateTime

//         //  Update all folderFile docs
//         let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERS_FILES);
//         return folderFilesRef.where(CONSTANTS.DATABASE.FILE_ID, "==", context.params.fileID).get()
//             .then(snapshot => {
//                 if (snapshot.empty) {
//                     console.log("No matching documents");
//                     return;
//                 }

//                 let batch = db.batch(); 

//                 snapshot.forEach(doc => {
//                     let ref = doc.ref
//                     batch.update(ref, {
//                         [CONSTANTS.DATABASE.FILE_TITLE]: newData[CONSTANTS.DATABASE.TITLE],
//                         [CONSTANTS.DATABASE.FILE_IMAGE_URL]: newData[CONSTANTS.DATABASE.IMAGE_URL],
//                         [CONSTANTS.DATABASE.MODIFIED_ON]: modifiedOn
//                     })
//                 })

//                 return batch.commit()
//             })
//             .catch(err => console.log("Error getting documents: ", err))
//     })

// exports.onDeleteFile = functions.firestore 
//     .document(`${CONSTANTS.DATABASE.FILES}/{fileID}`)
//     .onDelete((snapshot, context) => {
//         //  Delete all folderFile docs referencing this file
//         let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERS_FILES);
//         return folderFilesRef.where(CONSTANTS.DATABASE.FILE_ID, "==", context.params.fileID).get()
//             .then(snapshot => {
//                 if (snapshot.empty) {
//                     console.log("No matching documents");
//                     return;
//                 }

//                 let batch = db.batch(); 

//                 snapshot.forEach(doc => {
//                     let ref = doc.ref
//                     batch.delete(ref)
//                 })

//                 return batch.commit()
//             })
//             .catch(err => console.log("Error getting documents: ", err))
//     })

exports.onCreateFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
    .onCreate((snapshot, context) => {
        const createdOn = snapshot.createTime
        
        return snapshot.ref.set({
            [CONSTANTS.DATABASE.CREATED_ON]: createdOn,
            [CONSTANTS.DATABASE.MODIFIED_ON]: createdOn
        }, { merge: true })
    })

// exports.createFolderShareLink = functions.firestore 
//     .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
//     .onCreate((snapshot, context) => {
//         return dynamicLinksApi.createLinkForFolder(context.params.folderID)
//         .then(function(response) {
//             const data = response.data; 

//             return snapshot.ref.set({
//                 [CONSTANTS.DATABASE.SHARE_LINK]: data["shortLink"]
//             }, { merge: true })
//         })
//     })

// exports.onUpdateFolder = functions.firestore
//     .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
//     .onUpdate((change, context) => {
//         const newData = change.after.data(); 
//         const modifiedOn = change.after.updateTime;

//         //  Update all userFolder docs
//         let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERS_FOLDERS);
//         return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDER_ID, "==", context.params.folderID).get()
//             .then(snapshot => {
//                 if (snapshot.empty) {
//                     console.log("No matching documents");
//                     return;
//                 }

//                 let batch = db.batch();

//                 snapshot.docs.forEach(doc => {
//                     let ref = doc.ref; 
//                     batch.update(ref, {
//                         [CONSTANTS.DATABASE.FOLDER_TITLE]: newData.title,
//                         [CONSTANTS.DATABASE.MODIFIED_ON]: modifiedOn
//                     })
//                 })

//                 return batch.commit(); 
//             })
//             .catch(error => console.log("Error getting documents: ", error))
//     })

// exports.onDeleteFolder = functions.firestore
//     .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
//     .onDelete((snapshot, context) => {
//         //  Delete all userFolder docs that reference this folder
//         let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERS_FOLDERS);
//         return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDER_ID, "==", context.params.folderID).get()
//             .then(snapshot => {
//                 if (snapshot.empty) {
//                     console.log("No matching documents");
//                     return;
//                 }

//                 let batch = db.batch();

//                 snapshot.docs.forEach(doc => {
//                     let ref = doc.ref; 
//                     batch.delete(ref)
//                 })

//                 return batch.commit(); 
//             })
//             .catch(error => console.log("Error getting documents: ", error))
//     })

exports.onCreateFolderFile = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS_FILES}/{folderFileID}`)
    .onCreate((snapshot, context) => {
        return snapshot.ref.update({ [CONSTANTS.DATABASE.CREATED_ON]: snapshot.createTime })
    })

exports.onCreateUserFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.USERS_FOLDERS}/{userFolderID}`)
    .onCreate((snapshot, context) => {
        return snapshot.ref.update({ [CONSTANTS.DATABASE.CREATED_ON]: snapshot.createTime })
    })

// exports.createAlgoliaUserIndex = functions.auth.user().onCreate((user) => {
//     var newUser = user;

//     // Add an 'objectID' field which Algolia requires
//     newUser.objectID = user.uid; 

//     // Write to the algolia index
//     const index = client.initIndex(CONSTANTS.DATABASE.USERS); 
//     return index.saveObject(newUser);
// })