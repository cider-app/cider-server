const functions = require('firebase-functions');
const { FILES_COLLECTION_NAME,FOLDERS_COLLECTION_NAME, FOLDERSFILES_COLLECTION_NAME, USERSFOLDERS_COLLECTION_NAME } = require('./constants'); 
let grabity = require('grabity'); 

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.onCreateFile = functions.firestore
    .document(`${FILES_COLLECTION_NAME}/{file}`)
    .onCreate((snap, context) => {
        const data = snap.data(); 
        const link = data.link; 
        const createdBy = data.createdBy; 
        const createdForFolderID = data.createdForFolderID
        const createdOn = snap.createTime; 
        let batch = db.batch(); 

        //  Update the file's metadata
        batch.set(snap.ref, {
            createdOn,
            createdBy,
        }, { merge: true })

        let newFolderFileRef = db.collection(FOLDERSFILES_COLLECTION_NAME).doc() ;
        batch.set(newFolderFileRef, {
            "fileID": snap.id,
            "folderID": createdForFolderID,
            "createdBy": createdBy,
            "createdOn": createdOn,
        })

        return batch.commit().then(() => {
            return grabity.grabIt(link).then(result => {
                return snap.ref.set({
                    title: result.title || "",
                    description: result.description || "",
                    imageURL: result.image || "",
                    favicon: result.favicon || ""
                }, { merge: true })
                .catch(error => console.log(error))
            })
            .catch(error => console.log(error));
        })
        .catch(error => console.log(error))
    })

exports.onUpdateFile = functions.firestore
    .document(`${FILES_COLLECTION_NAME}/{fileID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime

        //  Update all folderFile docs
        let folderFilesRef = db.collection(FOLDERSFILES_COLLECTION_NAME);
        return folderFilesRef.where("fileID", "==", context.params.fileID).get()
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
                        "title": newData.title,
                        "imageURL": newData.imageURL,
                        "modifiedOn": modifiedOn
                    })
                })

                return batch.commit()
            })
            .catch(err => {
                console.log("Error getting documents: ", err)
            })
    })

exports.onDeleteFile = functions.firestore 
    .document(`${FILES_COLLECTION_NAME}/{fileID}`)
    .onDelete((snapshot, context) => {
        //  Delete all folderFile docs referencing this file
        let folderFilesRef = db.collection(FOLDERSFILES_COLLECTION_NAME);
        return folderFilesRef.where("fileID", "==", context.params.fileID).get()
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
            .catch(err => {
                console.log("Error getting documents: ", err)
            })
    })

exports.onCreateFolder = functions.firestore
    .document(`${FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onCreate((snapshot, context) => {
        const data = snapshot.data(); 
        const createdBy = data.createdBy; 
        const createdOn = snapshot.createTime
        let batch = db.batch();

        //  Update metadata for folder
        let folderRef = snapshot.ref;
        batch.set(folderRef, {
            createdOn,
            createdBy,
        }, { merge: true })

        //  Create a userFolder doc for the user so that the user has a list of folders that they created/followed
        let userFolderRef = db.collection(USERSFOLDERS_COLLECTION_NAME).doc(); 
        batch.set(userFolderRef, {
            "folderID": snapshot.id,
            "userID": createdBy,
            "title": data.title,
            "createdOn": createdOn,
            "createdBy": createdBy,
        })        

        return batch.commit()
    })

exports.onUpdateFolder = functions.firestore
    .document(`${FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onUpdate((change, context) => {
        const newData = change.after.data(); 
        const modifiedOn = change.after.updateTime;

        //  Update all userFolder docs
        let usersFoldersRef = db.collection(USERSFOLDERS_COLLECTION_NAME);
        return usersFoldersRef.where("folderID", "==", context.params.folderID).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No matching documents");
                    return;
                }

                let batch = db.batch();

                snapshot.docs.forEach(doc => {
                    let ref = doc.ref; 
                    batch.update(ref, {
                        "title": newData.title,
                        "modifiedOn": modifiedOn
                    })
                })

                return batch.commit(); 
            })
            .catch(error => {
                console.log("Error getting documents: ", error)
            })
    })

exports.onDeleteFolder = functions.firestore
    .document(`${FOLDERS_COLLECTION_NAME}/{folderID}`)
    .onDelete((snapshot, context) => {
        //  Delete all userFolder docs that reference this folder
        let usersFoldersRef = db.collection(USERSFOLDERS_COLLECTION_NAME);
        return usersFoldersRef.where("folderID", "==", context.params.folderID).get()
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
            .catch(error => {
                console.log("Error getting documents: ", error)
            })
    })