// firebaseConfig.js
const firebaseConfig = {
    apiKey: "AIzaSyAQ4W6njoWW24qSBPTIZYBtuYTvnytg-uU",
    authDomain: "speaker-ia.firebaseapp.com",
    projectId: "speaker-ia",
    storageBucket: "speaker-ia.appspot.com",
    messagingSenderId: "1037488879323",
    appId: "1:1037488879323:web:f3692c4e9e7bcd80973efe"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

export { app, db };
