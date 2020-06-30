const functions = require('firebase-functions');
const CONSTANTS = require('./constants')
let grabity = require('grabity'); 

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.onCreateFile = functions.firestore
    .document(`${CONSTANTS.DATABASE.FILES}/{file}`)
    .onCreate((snap, context) => {
        const data = snap.data(); 
        const link = data.link; 
        const createdBy = data.createdBy;
        const createdOn = snap.createTime; 

        return grabity.grabIt(link)
            .then(result => {
                return snap.ref.set({
                    [CONSTANTS.DATABASE.TITLE]: result.title ? result.title : '',
                    [CONSTANTS.DATABASE.DESCRIPTION]: result.description ? result.description : '',
                    [CONSTANTS.DATABASE.IMAGE_URL]: result.image ? result.image : '',
                    [CONSTANTS.DATABASE.FAVICON]: result.favicon ? result.favicon : '',
                    [CONSTANTS.DATABASE.CREATED_ON]: createdOn,
                    [CONSTANTS.DATABASE.CREATED_BY]: createdBy,
                    [CONSTANTS.DATABASE.MODIFIED_ON]: createdOn
                }, { merge: true })
            })
            .catch(error => console.log(error))
        })

exports.onUpdateFile = functions.firestore
    .document(`${CONSTANTS.DATABASE.FILES}/{fileID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime

        //  Update all folderFile docs
        let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERS_FILES);
        return folderFilesRef.where(CONSTANTS.DATABASE.FILE_ID, "==", context.params.fileID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch(); 

                snapshot.forEach(doc => {
                    let ref = doc.ref
                    batch.update(ref, {
                        [CONSTANTS.DATABASE.FILE_TITLE]: newData[CONSTANTS.DATABASE.TITLE],
                        [CONSTANTS.DATABASE.IMAGE_URL]: newData[CONSTANTS.DATABASE.IMAGE_URL],
                        [CONSTANTS.DATABASE.MODIFIED_ON]: modifiedOn
                    })
                })

                return batch.commit()
            })
            .catch(err => console.log("Error getting documents: ", err))
    })

exports.onDeleteFile = functions.firestore 
    .document(`${CONSTANTS.DATABASE.FILES}/{fileID}`)
    .onDelete((snapshot, context) => {
        //  Delete all folderFile docs referencing this file
        let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERS_FILES);
        return folderFilesRef.where(CONSTANTS.DATABASE.FILE_ID, "==", context.params.fileID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch(); 

                snapshot.forEach(doc => {
                    let ref = doc.ref
                    batch.delete(ref)
                })

                return batch.commit()
            })
            .catch(err => console.log("Error getting documents: ", err))
    })

exports.onCreateFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
    .onCreate((snapshot, context) => {
        const data = snapshot.data(); 
        const createdBy = data.createdBy; 
        const createdOn = snapshot.createTime
        
        return snapshot.ref.set({
            [CONSTANTS.DATABASE.CREATED_ON]: createdOn,
            [CONSTANTS.DATABASE.MODIFIED_ON]: createdOn
        }, { merge: true })
    })

exports.onUpdateFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime;

        //  Update all userFolder docs
        let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERS_FOLDERS);
        return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDER_ID, "==", context.params.folderID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch();

                snapshot.docs.forEach(doc => {
                    let ref = doc.ref; 
                    batch.update(ref, {
                        [CONSTANTS.DATABASE.FOLDER_TITLE]: newData.title,
                        [CONSTANTS.DATABASE.MODIFIED_ON]: modifiedOn
                    })
                })

                return batch.commit(); 
            })
            .catch(error => console.log("Error getting documents: ", error))
    })

exports.onDeleteFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS}/{folderID}`)
    .onDelete((snapshot, context) => {
        //  Delete all userFolder docs that reference this folder
        let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERS_FOLDERS);
        return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDER_ID, "==", context.params.folderID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch();

                snapshot.docs.forEach(doc => {
                    let ref = doc.ref; 
                    batch.delete(ref)
                })

                return batch.commit(); 
            })
            .catch(error => console.log("Error getting documents: ", error))
    })

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