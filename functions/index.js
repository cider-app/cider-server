const functions = require('firebase-functions');

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

exports.createItem = functions.firestore
    .document("collections/{collection}/collectionItems/{collectionItem}")
    .onCreate((snap, context) => {
        const data = snap.data(); 
        const createdOn = snap.createTime; 
        const createdBy = data.createdBy; 

        // Add createdOn and createdBy to document
        return snap.ref.set({
            createdOn,
            modifiedOn: createdOn,
            modifiedBy: createdBy
        }, { merge: true })
    })

// exports.updateCollection = functions.firestore
//     .document("collections/{collectionId}")
//     .onUpdate((change, context) => {
//         const data = change.after.data(); 
//         const previousData = change.before.data(); 
//         if (data) {
//             if (data.name === previousData.name && data.description === previousData.description) {
//                 return null   
//             }

//             return null; 

//             // var batch = db.batch(); 

//             // // Update userToCollection documents
//             // const getDocs = db.collection("userToCollection").where("collection.id", "==", context.params.collectionId).get()
//             // return getDocs.then(function(querySnapshot) {
//             //     querySnapshot.forEach(function(doc) {
//             //         var ref = doc.ref; 
//             //         batch.update(ref, { 
//             //             collection: {
//             //                 name: data.name, 
//             //                 description: data.description
//             //             }
//             //         })
//             //     })

//             //     return batch.commit()
//             // })
//             // .catch(error => console.log(error))
//         } else {
//             return null; 
//         }
//     })

exports.createCollection = functions.firestore
    .document("collections/{collectionId}")
    .onCreate((snapshot, context) => {
        const data = snapshot.data(); 
        const name = data.name; 
        const createdOn = snapshot.createTime; 
        const createdBy = data.createdBy;  

        return snapshot.ref.set({
            active: true, 
            createdOn,
            createdBy,
            modifiedOn: createdOn,
            modifiedBy: createdBy
        }, { merge: true })
        .then(() => {
            return db.collection("collections").doc(snapshot.id).collection("collectionUsers").doc(data.createdBy)
                .set({
                    modifiedOn: createdOn
                })
                .then(() => {
                    return db.collection("users").doc(createdBy).collection("userCollections").doc(snapshot.id)
                        .set({
                            name,
                            modifiedOn: createdOn,
                            modifiedBy: createdBy,
                            createdOn,
                            createdBy
                        })
                })

            // return db.collection("users").doc(data.createdBy).collection("userCollections").doc(snapshot.id).set({
            //     id: snapshot.id,
            //     name: data.name,
            //     createdOn: snapshot.createTime,
            //     createdBy: data.createdBy,
            //     modifiedOn: snapshot.createTime,
            //     modifiedBy: data.createdBy
            // })

            // // Create a new doc mapping the new item to the use that created the item
            // return db.collection("userToCollection").add({
            //     collection: {
            //         id: snapshot.id,
            //         name: data.name,
            //         visibility,
            //         secret
            //     },
            //     user: {
            //         id: createdBy
            //     },
            //     createdOn,
            //     createdBy,
            //     modifiedOn: createdOn,
            //     modifiedBy: createdBy
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