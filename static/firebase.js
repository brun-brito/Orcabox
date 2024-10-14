var firebaseConfig = {
    apiKey: "AIzaSyD1m_kBAFyv8FpT4WhGBgVO0LYCxvieMWw",
    authDomain: "orcamentista-hof.firebaseapp.com",
    projectId: "orcamentista-hof",
    storageBucket: "orcamentista-hof.appspot.com",
    messagingSenderId: "509852712447",
    appId: "1:509852712447:web:c148f6535f12bafc657bca"
};

firebase.initializeApp(firebaseConfig);

// Adicionando o serviço de autenticação
const auth = firebase.auth();  // Corrigido aqui
const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);