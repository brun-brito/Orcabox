// auth.js
import { db } from './firebaseConfig.js';
import { validarCPF, handleAuthError, handleFirestoreError } from './utils.js';
import { verificaCpf, verificaTelefone } from './firestore.js'

export async function Cadastrar() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const name = document.getElementById("register-name").value;
    const phone = document.getElementById("register-phone").value;
    const cpf = document.getElementById("register-cpf").value;

    if (!validarCPF(cpf)) {
        alert("O CPF informado é inválido.");
        return false;
    }
    
    const cpfExists = await verificaCpf(cpf);
    if (cpfExists) {
        alert("O CPF informado pertence a outro usuário.");
        return false;
    }
    
    const telefoneExists = await verificaTelefone(phone);
    if(telefoneExists) {
        alert("O telefone informado pertence a outro usuário.");
        return false;
    }
    
    if (password !== confirmPassword) {
        alert("As senhas não coincidem");
        return false;
    }

    if (password.length < 6) {
        alert("A senha deve ter no mínimo 6 dígitos");
        return false;
    }

    let formattedPhone = '55' + phone.replace(/^(\d{2})9?/, '$1');

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function(userCredential) {
        const user = userCredential.user;
        db.collection("usuarios").doc(formattedPhone).set({
            nome: name,
            telefone: phone,
            cpf: cpf,
            email: email,
            pagamento: false
        })
        .then(function() {
            alert("Seus dados foram cadastrados com sucesso");
            document.getElementById("register-form").reset();
            window.location.href = "index";
        })
        .catch(function(error) {
            handleFirestoreError(error);
        });
    })
    .catch(function(error) {
        handleAuthError(error);
    });

    return false;
}

export function Login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
        window.location.href = "/";
    })
    .catch(function(error) {
        handleAuthError(error);
    });

    return false;
}

export function Logout() {
    firebase.auth().signOut().then(function() {
        window.location.href = "/index";
    }).catch(function(error) {
        alert("Falha ao fazer logout: " + error.message);
    });
}
