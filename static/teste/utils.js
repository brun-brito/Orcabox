// utils.js
export function validarCPF(cpf) {
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

export function handleAuthError(error) {
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

export function handleFirestoreError(error) {
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

export function togglePasswordVisibility(passwordFieldId) {
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

export function showSpeakerAccessButton() {
    const container = document.getElementById('speaker-access-container');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Clique para acessar o Speaker';
    button.className = 'button-speaker-access';
    button.onclick = function() {
        window.location.href = 'https://wa.me/5531999722280';
    };
    container.appendChild(button);
}
