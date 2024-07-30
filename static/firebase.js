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

async function Cadastrar() {
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

async function atualizarPagamento(email) {
    const userRef = db.collection('usuarios').where('email', '==', email);
    const snapshot = await userRef.get();
    
    if (snapshot.empty) {
        console.log('No matching documents.');
        return;
    }

    snapshot.forEach(doc => {
        doc.ref.update({ pagamento: true })
        .then(() => {
            console.log('Pagamento atualizado com sucesso.');
        })
        .catch((error) => {
            console.error('Erro ao atualizar pagamento: ', error);
        });
    });
}

function Login() {
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

function Logout() {
    firebase.auth().signOut().then(function() {
        window.location.href = "/index";
    }).catch(function(error) {
        alert("Falha ao fazer logout: " + error.message);
    });
}

function handleAuthError(error) {
    let message;
    switch (error.code) {
        case 'auth/email-already-exists':
            message = "O email já está em uso por outra conta.";
            break;
        case 'auth/invalid-email':
            message = "O formato do email informado é inválido.";
            break;
        case 'auth/operation-not-allowed':
            message = "Operação não permitida. Entre em contato com o suporte.";
            break;
        case 'auth/user-disabled':
            message = "O usuário está desativado.";
            break;
        case 'auth/user-not-found':
            message = "Usuário não encontrado.";
            break;
        case 'auth/invalid-password':
            message = "Senha incorreta.";
            break;
        default:
            message = "Ocorreu um erro. Tente novamente.";
    }
    alert("Falha ao autenticar: " + message);
}

function handleFirestoreError(error) {
    let message;
    switch (error.code) {
        case 'permission-denied':
            message = "Permissão negada. Você não tem permissão para executar esta ação.";
            break;
        default:
            message = "Erro ao salvar dados adicionais: " + error.message;
    }
    alert(message);
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;

    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
}

async function verificaCpf(cpf) {
    try {
        const querySnapshot = await db.collection('usuarios').where('cpf', '==', cpf).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar CPF: ", error);
        return false;
    }
}

async function verificaTelefone(telefone) {
    try {
        const querySnapshot = await db.collection('usuarios').where('telefone', '==', telefone).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar Telefone: ", error);
        return false;
    }
}

function togglePasswordVisibility(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const eyeIcon = passwordField.nextElementSibling;
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

function checkUserPayment(email) {
    db.collection('usuarios').where('email', '==', email).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.pagamento === true) {
                        document.querySelector('.button-payment').style.display = 'none';
                        showSpeakerAccessButton();
                    }
                });
            } else {
                console.log('No such document!');
            }
        })
        .catch((error) => {
            console.log('Error getting document:', error);
        });
}

function showSpeakerAccessButton() {
    const container = document.getElementById('speaker-access-container');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Acesso ao Speaker';
    button.className = 'button-speaker-access';
    button.onclick = function() {
        window.location.href = 'https://wa.me/5531999722280';
    };
    container.appendChild(button);
}