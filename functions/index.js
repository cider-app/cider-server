const functions = require('firebase-functions');

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.createItem = functions.firestore
    .document("items/{item}")
    .onCreate((snap, context) => {
        const data = snap.data(); 

        // Add createdOn and createdBy to document
        return snap.ref.set({
            createdOn: snap.createTime,
            createdBy: data.createdBy,
            modifiedOn: snap.createTime,
            modifiedBy: data.createdBy
        }, {merge: true})
        .then(() => {
            // Create a new doc mapping the new item to the use that created the item
            return db.collection("userToItem").add({
                item: {
                    id: snap.id,
                    link: data.link,
                    title: data.title,
                    description: data.description,
                    stealth: data.stealth
                },
                user: {
                    id: data.createdBy
                },
                createdOn: snap.createTime,
                modifiedOn: snap.createTime,
            })
        })
    })

exports.updateCollection = functions.firestore
    .document("collections/{collectionId}")
    .onUpdate((change, context) => {
        const data = change.after.data(); 
        const previousData = change.before.data(); 
        if (data) {
            if (data.name === previousData.name && data.description === previousData.description) {
                return null   
            }

            return null; 

            // var batch = db.batch(); 

            // // Update userToCollection documents
            // const getDocs = db.collection("userToCollection").where("collection.id", "==", context.params.collectionId).get()
            // return getDocs.then(function(querySnapshot) {
            //     querySnapshot.forEach(function(doc) {
            //         var ref = doc.ref; 
            //         batch.update(ref, { 
            //             collection: {
            //                 name: data.name, 
            //                 description: data.description
            //             }
            //         })
            //     })

            //     return batch.commit()
            // })
            // .catch(error => console.log(error))
        } else {
            return null; 
        }
    })

exports.createCollection = functions.firestore
    .document("collections/{collectionId}")
    .onCreate((snapshot, context) => {
        const data = snapshot.data(); 

        return snapshot.ref.set({
            createdOn: snapshot.createTime,
            createdBy: data.createdBy,
            modifiedOn: snapshot.createTime,
            modifiedBy: data.createdBy
        }, {merge: true})
        .then(() => {
            return db.collection("users").doc(data.createdBy).collection("userCollections").doc(snapshot.id).set({
                id: snapshot.id,
                name: data.name,
                createdOn: snapshot.createTime,
                createdBy: data.createdBy,
                modifiedOn: snapshot.createTime,
                modifiedBy: data.createdBy
            })

            // // Create a new doc mapping the new item to the use that created the item
            // return db.collection("userToCollection").add({
            //     collection: {
            //         id: snapshot.id,
            //         name: data.name,
            //     },
            //     user: {
            //         id: data.createdBy
            //     },
            //     createdOn: snapshot.createTime,
            //     createdBy: data.createdBy,
            //     modifiedOn: snapshot.createTime,
            //     modifiedBy: data.createdBy
            // })
        })
    })

exports.updateItem = functions.firestore
    .document("items/{itemId}")
    .onUpdate((change, context) => {
        const data = change.after.data(); 
        const previousData = change.before.data(); 

        if (data) {
            if (data.title === previousData.title && data.description === previousData.description && data.link === previousData.link) {
                return null
            }

            return null;

            // var batch = db.batch(); 

            // // Update all subcollections "collectionItems" 
            // const getDocs = db.collectionGroup("collectionItems").where("id", "==", context.params.itemId).get();
            // return getDocs.then(function(querySnapshot) {
            //     querySnapshot.forEach(function(doc) {
            //         var ref = doc.ref; 
            //         batch.update(ref, { 
            //             itemTitle: data.title, 
            //             itemDescription: data.description,
            //             itemLink: data.link 
            //         })
            //     })
            //     return batch.commit()
            // })
            // .catch(error => console.log(error))
        } else {
            return null
        }
    })

exports.createUser = functions.auth.user().onCreate((user, context) => {
    return db.collection("users").doc(user.uid).set({
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        createdOn: context.timestamp,
        modifiedOn: context.timestamp
    })
})