const functions = require('firebase-functions');
let grabity = require('grabity'); 

//Establish connection to Firestore
const admin = require('firebase-admin');
admin.initializeApp(); 

const db = admin.firestore(); 

// exports.updateUser = functions.firestore
//     .document("users/{user}") 
//     .onUpdate((change, context) => {
//         const newValue = change.after.data()
//         const previousValue = change.before.data()

//         if (newValue === previousValue) {
//             return null
//         }

//         // Update all member documents where the user is a member
//         let uid = context.params.user
//         const getDocs = db.collectionGroup("members").where('user.id', "==", uid).get()
//         return getDocs.then(function(querySnapshot) {
//             var batch = db.batch(); 

//             querySnapshot.forEach(function(doc) {
//                 var ref = doc.ref; 
//                 batch.set(ref, {
//                     displayName: newValue.displayName,
//                     photoURL: newValue.photoURL
//                 }, { merge: true })
//             })

//             return batch.commit()
//         })
//         .catch(error => console.log(error))
//     })

exports.onCreateFile = functions.firestore
    .document("files/{file}")
    .onCreate((snap, context) => {
        const data = snap.data(); 
        const link = data.link; 
        const createdOn = snap.createTime; 

        return snap.ref.set({
            createdOn,
        }, { merge: true })
            .then(() => {
                return grabity.grabIt(link)
                    .then(result => {
                        return snap.ref.set({
                            title: result.title || "",
                            description: result.description || "",
                            image: result.image || "",
                            favicon: result.favicon || ""
                        }, { merge: true })
                        .catch(error => console.log(error))
                    })
                    .catch(error => console.log(error));
            })
            .catch(error => console.log(error))

        // return grabity.grabIt(link)
        //     .then(result => {
        //         return snap.ref.set({
        //             createdOn,
        //             modifiedOn: createdOn,
        //             modifiedBy: createdBy,
        //             title: result.title,
        //             description: result.description,
        //             image: result.image,
        //             favicon: result.favicon
        //         }, { merge: true })
        //     })
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

//             // Update userToCollection documents
//             const getDocs = db.collection("userToCollection").where("collection.id", "==", context.params.collectionId).get()
//             return getDocs.then(function(querySnapshot) {
//                 querySnapshot.forEach(function(doc) {
//                     var ref = doc.ref; 
//                     batch.update(ref, { 
//                         collection: {
//                             name: data.name, 
//                             description: data.description
//                         }
//                     })
//                 })

//                 return batch.commit()
//             })
//             .catch(error => console.log(error))
//         } else {
//             return null; 
//         }
//     })

exports.onCreateFolder = functions.firestore
    .document("folders/{folder}")
    .onCreate((snapshot, context) => {
        return snapshot.ref.set({
            createdOn: snapshot.createTime,
        }, { merge: true })
    })

// exports.updateItem = functions.firestore
//     .document("items/{itemId}")
//     .onUpdate((change, context) => {
//         const data = change.after.data(); 
//         const previousData = change.before.data(); 

//         if (data) {
//             if (data.title === previousData.title && data.description === previousData.description && data.link === previousData.link) {
//                 return null
//             }

//             return null;

//             // var batch = db.batch(); 

//             // // Update all subcollections "collectionItems" 
//             // const getDocs = db.collectionGroup("collectionItems").where("id", "==", context.params.itemId).get();
//             // return getDocs.then(function(querySnapshot) {
//             //     querySnapshot.forEach(function(doc) {
//             //         var ref = doc.ref; 
//             //         batch.update(ref, { 
//             //             itemTitle: data.title, 
//             //             itemDescription: data.description,
//             //             itemLink: data.link 
//             //         })
//             //     })
//             //     return batch.commit()
//             // })
//             // .catch(error => console.log(error))
//         } else {
//             return null
//         }
//     })

// exports.createUser = functions.auth.user().onCreate((user, context) => {
//     return db.collection("users").doc(user.uid).set({
//         email: user.email,
//         displayName: user.displayName,
//         phoneNumber: user.phoneNumber,
//         emailVerified: user.emailVerified,
//         createdOn: context.timestamp,
//         modifiedOn: context.timestamp
//     }, { merge: true })
// })