const functions = require('firebase-functions');
const CONSTANTS = require('./constants')
let grabity = require('grabity'); 

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.onCreateFile = functions.firestore
    .document(`${CONSTANTS.DATABASE.FILES_COLLECTION_NAME}/{file}`)
    .onCreate((snap, context) => {
        const data = snap.data(); 
        const link = data.link; 
        const createdBy = data.createdBy; 
        const createdOn = snap.createTime; 
        let batch = db.batch();

        //  Update the file's metadata
        batch.set(snap.ref, {
            [CONSTANTS.DATABASE.CREATEDBY_FIELD]: createdBy,
            [CONSTANTS.DATABASE.CREATEDON_FIELD]: createdOn,
        }, { merge: true })

        //  Create an associative FolderFile to associate the file with the folder it's been saved to
        let newFolderFileRef = db.collection(CONSTANTS.DATABASE.FOLDERSFILES_COLLECTION_NAME).doc() ;
        batch.set(newFolderFileRef, {
            [CONSTANTS.DATABASE.FILEID_FIELD]: snap.id,
            [CONSTANTS.DATABASE.CREATEDBY_FIELD]: createdBy,
            [CONSTANTS.DATABASE.CREATEDON_FIELD]: createdOn,
        })

        return batch.commit()
            .then(() => {
                return grabity.grabIt(link)
            })
            .then(result => {
                return snap.ref.set({
                    title: result.title || "",
                    description: result.description || "",
                    imageURL: result.image || "",
                    favicon: result.favicon || ""
                }, { merge: true })
            })
            .catch(error => console.log(error));
        })

exports.onUpdateFile = functions.firestore
    .document(`${CONSTANTS.DATABASE.FILES_COLLECTION_NAME}/{fileID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime

        //  Update all folderFile docs
        let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERSFILES_COLLECTION_NAME);
        return folderFilesRef.where(CONSTANTS.DATABASE.FILEID_FIELD, "==", context.params.fileID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch(); 

                snapshot.forEach(doc => {
                    let ref = doc.ref
                    batch.update(ref, {
                        "link": newData.link,
                        [CONSTANTS.DATABASE.FILETITLE_FIELD]: newData.title,
                        "imageURL": newData.imageURL,
                        [CONSTANTS.DATABASE.MODIFIEDON_FIELD]: modifiedOn
                    })
                })

                return batch.commit()
            })
            .catch(err => console.log("Error getting documents: ", err))
    })

exports.onDeleteFile = functions.firestore 
    .document(`${CONSTANTS.DATABASE.FILES_COLLECTION_NAME}/{fileID}`)
    .onDelete((snapshot, context) => {
        //  Delete all folderFile docs referencing this file
        let folderFilesRef = db.collection(CONSTANTS.DATABASE.FOLDERSFILES_COLLECTION_NAME);
        return folderFilesRef.where(CONSTANTS.DATABASE.FILEID_FIELD, "==", context.params.fileID).get()
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
    .document(`${CONSTANTS.DATABASE.FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onCreate((snapshot, context) => {
        const data = snapshot.data(); 
        const createdBy = data.createdBy; 
        const createdOn = snapshot.createTime
        let batch = db.batch();

        //  Update metadata for folder
        let folderRef = snapshot.ref;
        batch.set(folderRef, {
            [CONSTANTS.DATABASE.CREATEDON_FIELD]: createdOn,
            [CONSTANTS.DATABASE.CREATEDBY_FIELD]: createdBy,
        }, { merge: true })

        //  Create a userFolder doc for the user so that the user has a list of folders that they created/followed
        let userFolderRef = db.collection(CONSTANTS.DATABASE.USERSFOLDERS_COLLECTION_NAME).doc(); 
        batch.set(userFolderRef, {
            [CONSTANTS.DATABASE.FOLDERID_FIELD]: snapshot.id,
            [CONSTANTS.DATABASE.USERID_FIELD]: createdBy,
            [CONSTANTS.DATABASE.FOLDERTITLE_FIELD]: data.title,
            [CONSTANTS.DATABASE.CREATEDON_FIELD]: createdOn,
            [CONSTANTS.DATABASE.CREATEDBY_FIELD]: createdBy,
        })        

        return batch.commit()
    })

exports.onUpdateFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime;

        //  Update all userFolder docs
        let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERSFOLDERS_COLLECTION_NAME);
        return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDERID_FIELD, "==", context.params.folderID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch();

                snapshot.docs.forEach(doc => {
                    let ref = doc.ref; 
                    batch.update(ref, {
                        [CONSTANTS.DATABASE.FOLDERTITLE_FIELD]: newData.title,
                        [CONSTANTS.DATABASE.MODIFIEDON_FIELD]: modifiedOn
                    })
                })

                return batch.commit(); 
            })
            .catch(error => console.log("Error getting documents: ", error))
    })

exports.onDeleteFolder = functions.firestore
    .document(`${CONSTANTS.DATABASE.FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onDelete((snapshot, context) => {
        //  Delete all userFolder docs that reference this folder
        let usersFoldersRef = db.collection(CONSTANTS.DATABASE.USERSFOLDERS_COLLECTION_NAME);
        return usersFoldersRef.where(CONSTANTS.DATABASE.FOLDERID_FIELD, "==", context.params.folderID).get()
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