// Simula o sucesso da consulta sem consumir a API real
function simularSucessoConsultaCPF() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const simulatedResponse = {
                data: {
                    nome: "JOÃO DA SILVA"
                },
                message: "Simulação de sucesso."
            };
            resolve(simulatedResponse);
        }, 1000); // Simula uma espera de 1 segundo
    });
}

// Evento no botão de busca com opção de simulação
document.getElementById('verify-cpf-button').addEventListener('click', async function () {
    const cpf = document.getElementById('register-cpf').value;
    const birthdate = document.getElementById('register-birthdate').value;

    if (!validarCPF(cpf)) {
        showError('Por favor, insira um CPF válido.');
        return;
    }
    if (!validarDataNascimento(birthdate)) {
        showError('Por favor, insira uma data de nascimento válida.');
        return;
    }

    try {
        toggleLoading(true);

        const useSimulation = false; // **** Alternar para FALSE para usar a API real
        let result;
        if (useSimulation) {
            result = await simularSucessoConsultaCPF();
        } else {
            const response = await fetch(
                `https://api.injectbox.com.br/v1/consultar-cpf?cpf=${cpf}&birthdate=${birthdate}`
            );
            result = await response.json();
        }

        if (result.data) {
            document.getElementById('register-nome').value = result.data.nome;
            disableInputs(true, true); // Desabilita campos e botão
            clearError();
        } else {
            handleCPFError(404, result.message);
        }
    } catch (error) {
        console.error('Erro na comunicação:', error.message);
        showError('Erro ao se comunicar com o servidor. Tente novamente.');
    } finally {
        toggleLoading(false);
    }
});

function validarDataNascimento(date) {
    if (!date || date.length < 10) return false;

    // Tenta detectar e converter diferentes formatos
    const parsedDate = parseDataNascimento(date);
    if (!parsedDate) return false; // Retorna falso se a data não for válida

    const currentDate = new Date();
    if (parsedDate > currentDate || parsedDate.getFullYear() < 1900) {
        return false;
    }

    return true;
}

// Função auxiliar para converter diferentes formatos de data
function parseDataNascimento(date) {
    let sanitizedDate = date.replace(/\D/g, ''); // Remove todos os caracteres não numéricos

    if (sanitizedDate.length === 8) {
        // Identifica o formato com base na posição dos números
        const [day, month, year] = 
            sanitizedDate.slice(0, 2) <= 31 
                ? [sanitizedDate.slice(0, 2), sanitizedDate.slice(2, 4), sanitizedDate.slice(4)]
                : [sanitizedDate.slice(6), sanitizedDate.slice(4, 6), sanitizedDate.slice(0, 4)];

        // Valida a data convertida
        const parsedDate = new Date(`${year}-${month}-${day}`);
        return isNaN(parsedDate) ? null : parsedDate; // Retorna null se for inválido
    }

    // Se já estiver no formato ISO (AAAA-MM-DD)
    const isoDate = new Date(date);
    return isNaN(isoDate) ? null : isoDate;
}


function handleCPFError(status, message) {
    switch (status) {
        case 400:
            showError(message || 'CPF ou data de nascimento inválidos.');
            break;
        case 404:
            showError(message || 'CPF não encontrado.');
            break;
        case 500:
            showError('Erro interno no servidor.');
            break;
        default:
            showError('Erro desconhecido.');
    }
}

function showError(message) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
}

function clearError() {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = '';
    errorMessageElement.style.display = 'none';
}

function toggleLoading(isLoading) {
    const searchIcon = document.getElementById('search-icon');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (isLoading) {
        searchIcon.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
    } else {
        searchIcon.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}

// Função para desabilitar/reativar os campos e botão
function disableInputs(isTemporary, isPermanentlyDisabled = false) {
    const cpfInput = document.getElementById('register-cpf');
    const birthdateInput = document.getElementById('register-birthdate');
    const verifyButton = document.getElementById('verify-cpf-button');

    if (isTemporary || isPermanentlyDisabled) {
        cpfInput.disabled = true;
        birthdateInput.disabled = true;
        verifyButton.disabled = true;

        // Estiliza visualmente os campos e o botão como desativados
        cpfInput.style.backgroundColor = 'rgb(202, 202, 202)';
        birthdateInput.style.backgroundColor = 'rgb(202, 202, 202)';
        verifyButton.style.color = '#b2b2b2';
        verifyButton.style.cursor = 'not-allowed';
        verifyButton.style.pointerEvents = 'none'; 
    } else {
        cpfInput.disabled = false;
        birthdateInput.disabled = false;
        verifyButton.disabled = false;

        // Remove as alterações de estilo ao reativar
        cpfInput.style.backgroundColor = '';
        birthdateInput.style.backgroundColor = '';
        verifyButton.style.backgroundColor = '';
        verifyButton.style.cursor = 'pointer';
        verifyButton.style.pointerEvents = 'auto'; // Permite cliques novamente
    }
}

const birthdateInput = document.getElementById('register-birthdate');
// Função que aplica a máscara conforme o usuário digita
birthdateInput.addEventListener('input', (event) => {
    let value = event.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Formata a data conforme o usuário digita
    if (value.length >= 5) {
        value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`;
    } else if (value.length >= 3) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    event.target.value = value; // Atualiza o valor no campo
});

// Permite apagar corretamente sem bloquear as barras (/)
birthdateInput.addEventListener('keydown', (event) => {
    const value = event.target.value;

    // Se pressionar Backspace e o caractere anterior for '/', apaga junto
    if (event.key === 'Backspace' && (value.endsWith('/') || value.endsWith('-'))) {
        event.target.value = value.slice(0, -1); // Remove a última barra
    }
});

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