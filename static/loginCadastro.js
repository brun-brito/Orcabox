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
        const nomeFantasia = document.getElementById("register-fantasia").value;
        const telefone = document.getElementById("register-number").value;
        const cep = document.getElementById("register-cep").value;
        const insta = document.getElementById("register-insta").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        // Validações básicas
        if (!email || !password || !nomeFantasia || !telefone || !cep || !insta) {
            alert("Por favor, preencha todos os campos.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (telefone.length !== 11 || !/^\d{11}$/.test(telefone)) {
            alert("O número de telefone deve conter exatamente 11 números.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (cep.length !== 8 || !/^\d{8}$/.test(cep)) {
            alert("O número de CEP deve conter exatamente 8 números.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // const cepValido = await validaCep(cep);
        // if (!cepValido) {
        //     alert("CEP inválido. Por favor, insira um CEP válido.");
        //     hideLoading(buttonId, loadingId);
        //     return false;
        // }

        const telefoneExists = await verificaTelefone(telefone);
        if (telefoneExists) {
            alert("O telefone informado pertence a outro usuário.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (password.length < 6) {
            alert("A senha deve ter no mínimo 6 dígitos.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Criar o usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Adiciona o usuário à coleção 'distribuidores' no Firestore
        await db.collection('distribuidores').doc().set({
            email: email,
            nome_fantasia: nomeFantasia,
            telefone: telefone,
            cep: cep,
            insta: insta,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mensagem de sucesso e redirecionamento
        alert("Seus dados foram cadastrados com sucesso.");
        document.getElementById("register-form").reset();
        window.location.href = "login-distribuidor";
        
    } catch (error) {
        // Lidar com erros de autenticação
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
        window.location.href = "/welcome";
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
        window.location.href = "/login-distribuidor";
    } catch (error) {
        alert("Falha ao fazer logout: " + error.message);
        logoutButton.disabled = false;
        logoutButton.innerText = "Sair";
    }
}

async function verificaTelefone(telefone) {
    try {
        const querySnapshot = await db.collection('distribuidores').where('telefone', '==', telefone).get();
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

function handleAuthError(error) {
    let message;
    switch (error.code) {
        case 'auth/invalid-email':
            message = "O email fornecido é inválido.";
            break;
        case 'auth/wrong-password':
            message = "A senha está incorreta. Tente novamente.";
            break;
        case 'auth/user-not-found':
            message = "Nenhum usuário encontrado com este email.";
            break;
        case 'auth/email-already-in-use':
            message = "Este email já está em uso por outra conta.";
            break;
        case 'auth/weak-password':
            message = "A senha é muito fraca. Escolha uma senha mais forte.";
            break;
        case 'auth/credential-already-in-use':
            message = "Estas credenciais já estão associadas a outra conta.";
            break;
        case 'auth/operation-not-allowed':
            message = "Esta operação não é permitida. Verifique as configurações.";
            break;
        case 'auth/requires-recent-login':
            message = "Requer um login recente. Faça login novamente.";
            break;
        case 'auth/user-disabled':
            message = "A conta do usuário foi desativada por um administrador.";
            break;
        case 'auth/too-many-requests':
            message = "Muitas tentativas de login. Tente novamente mais tarde.";
            break;
        case 'auth/network-request-failed':
            message = "Erro de rede. Verifique sua conexão e tente novamente.";
            break;
        case 'auth/internal-error':
            if (error.message && error.message.includes("INVALID_LOGIN_CREDENTIALS")) {
                message = "Email e/ou senha incorretos. Tente novamente.";
            } else {
                message = "Ocorreu um erro interno. Tente novamente.";
            }
            break;
        case 'auth/invalid-phone-number':
            message = "O número de telefone fornecido é inválido.";
            break;
        case 'auth/popup-closed-by-user':
            message = "O popup foi fechado antes da finalização do login. Tente novamente.";
            break;
        case 'auth/invalid-verification-code':
            message = "O código de verificação é inválido.";
            break;
        default:
            message = "Ocorreu um erro. Tente novamente.";
            console.warn(`Erro interno: ${error.code} - ${error.message}`);
    }
    alert("Falha ao autenticar: " + message);
}
