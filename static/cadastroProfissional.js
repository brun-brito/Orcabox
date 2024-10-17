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
        const nome = document.getElementById("register-nome").value;
        const telefone = document.getElementById("register-number").value;
        const cep = document.getElementById("register-cep").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const cpf = document.getElementById("register-cpf").value;
        const uf = document.getElementById("register-uf").value;
        const especialidade = document.getElementById("register-conselho").value;
        const numeroConselho = document.getElementById("register-numero-conselho").value;

        // Validações básicas
        if (!email || !password || !nome || !telefone || !cep || !cpf || !uf || !especialidade || !numeroConselho) {
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

        if (!/^\d{11}$/.test(cpf) || !validarCPF(cpf)) {
            alert("CPF inválido. Verifique o número e tente novamente.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        if (!/^[A-Za-z]{2}$/.test(uf)) {
            alert("UF inválida. A UF deve ser composta por duas letras.");
            hideLoading(buttonId, loadingId);
            return false;
        }

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
        let formattedPhone = '55' + telefone.replace(/^(\d{2})9?/, '$1');

        // Adiciona o profissional à coleção 'profissionais' no Firestore
        await db.collection('profissionais').doc().set({
            nome: nome,
            telefone: formattedPhone,
            cep: cep,
            email: email,
            cpf: cpf,
            uf: uf,
            especialidade: especialidade,
            numeroConselho: numeroConselho,
            pagamento: true, /* LEMBRAR DE TROCAR PRA FALSE EM PRODUÇÃO */
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mensagem de sucesso e redirecionamento
        alert("Seus dados foram cadastrados com sucesso.");
        document.getElementById("register-form").reset();
        window.location.href = "login-profissional";
        
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
        const profissionaisRef = db.collection('profissionais');
        const snapshot = await profissionaisRef.where('email', '==', email).limit(1).get();

        if (!snapshot.empty) {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/welcome-profissional";
        } else {
            alert("Este e-mail não pertence à categoria de profissionais.");
            hideLoading(buttonId, loadingId);
        }

    } catch (error) {
        handleAuthError(error);
        hideLoading(buttonId, loadingId);
    }

    return false;
}

async function Logout() {
    const buttonId = "logout-button";
    const loadingId = "logout-loading";
    const logoutButton = document.getElementById(buttonId);
    logoutButton.disabled = true;
    logoutButton.innerText = "Saindo...";

    try {
        await auth.signOut();
        window.location.href = "/login-profissional";
    } catch (error) {
        alert("Falha ao fazer logout: " + error.message);
        logoutButton.disabled = false;
        logoutButton.innerText = "Sair";
    }
}

async function verificaTelefone(telefone) {
    try {
        const querySnapshot = await db.collection('profissionais').where('telefone', '==', telefone).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar telefone: ", error);
        return false;
    }
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g,'');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }

    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;

    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
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
