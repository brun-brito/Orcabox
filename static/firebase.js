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


function showLoading(buttonId, loadingId) {
    document.getElementById(buttonId).style.display = "none";
    document.getElementById(loadingId).style.display = "inline-block";
}

function hideLoading(buttonId, loadingId) {
    document.getElementById(buttonId).style.display = "inline-block";
    document.getElementById(loadingId).style.display = "none";
}

async function Cadastrar() {
    const buttonId = "register-button";
    const loadingId = "register-loading";
    showLoading(buttonId, loadingId);
    try {
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (!email || !password || !confirmPassword) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (password.length < 6) {
            alert("A senha deve ter no mínimo 6 dígitos.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        alert("Seus dados foram cadastrados com sucesso.");
        document.getElementById("register-form").reset();
        window.location.href = "index";
    } catch (error) {
        handleAuthError(error);
        hideLoading(buttonId, loadingId);
    }
    return false;
}

async function Login() {
    const buttonId = "login-button";
    const loadingId = "login-loading";
    showLoading(buttonId, loadingId);
    try {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = "/";
    } catch (error) {
        handleAuthError(error);
        hideLoading(buttonId, loadingId);
    }
    return false;
}
async function Logout() {
    const buttonId = "button-logout";
    const loadingId = "logout-loading";
    const logoutButton = document.getElementById(buttonId);
    logoutButton.disabled = true;
    logoutButton.innerText = "Saindo...";

    try {
        await auth.signOut();
        window.location.href = "/index";
    } catch (error) {
        alert("Falha ao fazer logout: " + error.message);
        logoutButton.disabled = false;
        logoutButton.innerText = "Sair";
    }
}


function handleAuthError(error) {
    let message;
    switch (error.code) {
        case 'auth/email-already-in-use':
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
        case 'auth/wrong-password':
            message = "Senha incorreta.";
            break;
        default:
            message = "Ocorreu um erro. Tente novamente.";
    }
    alert("Falha ao autenticar: " + message);
}
