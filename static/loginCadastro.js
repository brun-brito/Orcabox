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
        const tipoPessoa = document.getElementById('tipo-pessoa').value;
        const nomeCompleto = document.getElementById('register-nome-completo') ? document.getElementById('register-nome-completo').value : null;
        const cpf = document.getElementById('register-cpf') ? document.getElementById('register-cpf').value : null;
        const cnpj = document.getElementById('register-cnpj') ? document.getElementById('register-cnpj').value : null;
        const razaoSocial = document.getElementById('register-razao') ? document.getElementById('register-razao').value : null;
        const nomeFantasia = document.getElementById("register-fantasia") ? document.getElementById("register-fantasia").value : null;
        const telefone = document.getElementById("register-number").value;
        const cep = document.getElementById("register-cep").value;
        const insta = document.getElementById("register-insta").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        // Validações básicas
        if (!email || !password || !telefone || !cep || !insta || !tipoPessoa) {
            alert("Por favor, preencha todos os campos.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Validação para Pessoa Física
        if (tipoPessoa === 'PF') {
            if (!nomeCompleto || !cpf || cpf.length !== 11) {
                alert("Por favor, preencha corretamente o Nome Completo e CPF.");
                hideLoading(buttonId, loadingId);
                return false;
            }
        }

        // Validação para Pessoa Jurídica
        if (tipoPessoa === 'PJ') {
            if (!cnpj || cnpj.length !== 14 || !razaoSocial) {
                alert("Por favor, preencha corretamente o CNPJ e Razão Social.");
                hideLoading(buttonId, loadingId);
                return false;
            }
        }

        // Validação do telefone
        if (telefone.length !== 11 || !/^\d{11}$/.test(telefone)) {
            alert("O número de telefone deve conter exatamente 11 números.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Validação do CEP
        if (cep.length !== 8 || !/^\d{8}$/.test(cep)) {
            alert("O número de CEP deve conter exatamente 8 números.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Verifica se o telefone já existe
        const telefoneExists = await verificaTelefone(telefone);
        if (telefoneExists) {
            alert("O telefone informado pertence a outro usuário.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Verifica se a senha atende aos requisitos mínimos
        if (password.length < 6) {
            alert("A senha deve ter no mínimo 6 dígitos.");
            hideLoading(buttonId, loadingId);
            return false;
        }

        // Criar o usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Monta o objeto do usuário com base no tipo de pessoa
        const usuarioData = {
            email: email,
            telefone: telefone,
            cep: cep,
            insta: insta,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (tipoPessoa === 'PF') {
            usuarioData.tipoPessoa = 'Pessoa Física';
            usuarioData.nome_fantasia = nomeCompleto;
            usuarioData.cpf = cpf;
        } else if (tipoPessoa === 'PJ') {
            usuarioData.tipoPessoa = 'Pessoa Jurídica';
            usuarioData.cnpj = cnpj;
            usuarioData.razao_social = razaoSocial;
            usuarioData.nome_fantasia = nomeFantasia;
        }

        // Adiciona o usuário à coleção 'distribuidores' no Firestore
        await db.collection('distribuidores').doc().set(usuarioData);

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
        const distribuidoresRef = db.collection('distribuidores');
        const snapshot = await distribuidoresRef.where('email', '==', email).limit(1).get();

        if (!snapshot.empty) {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "/welcome";
        } else {
            alert("Este e-mail não pertence à categoria de distribuidores.");
            hideLoading(buttonId, loadingId);
        }
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

function togglePessoaFields() {
    const tipoPessoa = document.getElementById('tipo-pessoa').value;
    const cpfField = document.getElementById('cpf-field');
    const nomeCompletoField = document.getElementById('nome-completo-field');
    const cnpjField = document.getElementById('cnpj-field');
    const razaoField = document.getElementById('razao-field');
    const fantasiaField = document.getElementById('fantasia-field');

    if (tipoPessoa === 'PF') {
        nomeCompletoField.style.display = 'block';
        cpfField.style.display = 'block';
        cnpjField.style.display = 'none';
        razaoField.style.display = 'none';
        fantasiaField.style.display = 'none';
    } else if (tipoPessoa === 'PJ') {
        nomeCompletoField.style.display = 'none';
        cpfField.style.display = 'none';
        cnpjField.style.display = 'block';
        razaoField.style.display = 'block';
        fantasiaField.style.display = 'block';
    }
}

async function autoVerifyCNPJ() {
    const cnpjElement = document.getElementById('register-cnpj');
    const cnpj = cnpjElement.value.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Verifica se o CNPJ tem 14 dígitos
    if (cnpj.length === 14) {
        const url = `https://open.cnpja.com/office/${cnpj}`;
        const headers = {
            'Authorization': '0cdf6d17-8007-4769-a2fd-7e374d40f198-d718a448-1ce5-44a1-949a-201730bee40c'
        };

        // Mostra o spinner de carregamento durante a validação
        document.getElementById('register-loading').style.display = 'inline-block';

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('CNPJ não encontrado. Tente novamente!');

            const data = await response.json();
            const companyName = data.company && data.company.name ? data.company.name : '-';
            const alias = data.alias || '-';

            // Preenche os campos de "Razão Social" e "Nome Fantasia"
            document.getElementById('register-razao').value = companyName;
            document.getElementById('register-fantasia').value = alias;

            // Remove o estilo de erro do campo CNPJ
            cnpjElement.style.borderColor = ''; // Remove a borda vermelha

            // Habilita os campos "Razão Social" e "Nome Fantasia"
            document.getElementById('register-razao').disabled = true;
            document.getElementById('register-fantasia').disabled = true;
        } catch (error) {
            // Exibe o erro visual no campo de CNPJ (borda vermelha)
            cnpjElement.style.borderColor = 'red';

            // Limpa os campos de "Razão Social" e "Nome Fantasia"
            document.getElementById('register-razao').value = '';
            document.getElementById('register-fantasia').value = '';
        } finally {
            document.getElementById('register-loading').style.display = 'none';
        }
    } else {
        // Limpa os campos se o CNPJ não tiver 14 dígitos
        cnpjElement.style.borderColor = ''; // Remove a borda vermelha, se tiver
        document.getElementById('register-razao').value = '';
        document.getElementById('register-fantasia').value = '';
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
