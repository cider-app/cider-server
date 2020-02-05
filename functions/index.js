const functions = require('firebase-functions');

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.createItem = functions.firestore
    .document("items/{item}")
    .onCreate((snap, context) => {
        return snap.ref.set({
            createdOn: snap.createTime,
            createdBy: context.auth ? context.auth.uid : null
        }, {merge: true})
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

            var batch = db.batch(); 

            // Update userToCollection documents
            const getDocs = db.collection("userToCollection").where("collectionId", "==", context.params.collectionId).get()
            return getDocs.then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var ref = doc.ref; 
                    batch.update(ref, { collectionName: data.name, collectionDescription: data.description })
                })

                return batch.commit()
            })
            .catch(error => console.log(error))
        } else {
            return null; 
        }
    })

exports.createCollection = functions.firestore
    .document("collections/{collectionId}")
    .onCreate((snapshot, context) => {
        return snapshot.ref.set({
            createdOn: snapshot.createTime
        }, {merge: true})
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

            var batch = db.batch(); 

            // Update all subcollections "collectionItems" 
            const getDocs = db.collectionGroup("collectionItems").where("id", "==", context.params.itemId).get();
            return getDocs.then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var ref = doc.ref; 
                    batch.update(ref, { 
                        itemTitle: data.title, 
                        itemDescription: data.description,
                        itemLink: data.link 
                    })
                })
                return batch.commit()
            })
            .catch(error => console.log(error))
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