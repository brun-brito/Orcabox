// Função para calcular a distância de Levenshtein
function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,    // Deleção
                matrix[i][j - 1] + 1,    // Inserção
                matrix[i - 1][j - 1] + cost // Substituição
            );
        }
    }

    return matrix[a.length][b.length];
}

// Função para exibir ou ocultar o botão de verificação de conselho
document.getElementById('register-especialidade').addEventListener('change', function () {
    const conselho = this.value;
    const verifyButton = document.getElementById('verify-conselho-button');
    const validacaoNecessaria = ['cfbm', 'cff', 'cfm', 'cro'].includes(conselho);
    verifyButton.style.display = validacaoNecessaria ? 'inline' : 'none';
});

document.getElementById('verify-conselho-button').addEventListener('click', async function () {
    const conselho = document.getElementById('register-especialidade').value;
    const uf = document.getElementById('register-uf').value.toLowerCase();
    const numeroConselho = document.getElementById('register-numero-conselho').value;
    const nomeInput = document.getElementById('register-nome').value.trim().toUpperCase();

    if (!conselho || !numeroConselho) {
        showError('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    try {
        toggleLoadingConselho(true);

        const payload = montarPayload(conselho, uf, numeroConselho);

        const response = await fetch(`https://api.injectbox.com.br/v1/consultar-conselho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.status === 200) {
            const isNomeValido = validarNomePorConselho(conselho, result, nomeInput);
            if (isNomeValido) {
                showSuccess('Conselho validado com sucesso!');
                setConselhoValidado();
                disableInputsConselho();
            } else {
                showError('Nome não corresponde a nenhum registro encontrado.');
            }
        } else {
            handleConselhoError(response.status, result.message);
        }
    } catch (error) {
        console.error('Erro ao validar conselho:', error);
        showError('Erro ao validar conselho. Tente novamente.');
    } finally {
        toggleLoadingConselho(false);
    }
});

// Função para montar o payload com os parâmetros corretos
function montarPayload(conselho, uf, numeroConselho, nome) {
    console.log('Montando payload para:', conselho);
    switch (conselho) {
        case 'cro':
            return { conselho, uf, inscricao: numeroConselho };
        case 'cfbm':
            return { conselho, inscricao: numeroConselho };
        case 'cfm':
            return { conselho, uf, inscricao: numeroConselho };
        case 'cff':
            return { conselho, uf, nome, inscricao: numeroConselho, municipio: 'todos', categoria: 'farmaceutico' };
        default:
            console.error('Conselho não suportado:', conselho);
            throw new Error('Conselho não suportado.');
    }
}

// Função para validar o nome de acordo com cada conselho
function validarNomePorConselho(conselho, apiResponse, nomeInput) {
    console.log('Iniciando validação de nome com a API...');

    let nomesEncontrados = [];

    switch (conselho) {
        case 'cfbm':
            nomesEncontrados = apiResponse.data[0].lista_registros.map(entry => entry.nome_razao_social.toUpperCase());
            break;
        case 'cro':
            nomesEncontrados = apiResponse.data.map(entry => entry.nome.toUpperCase());
            break;
        case 'cfm':
            nomesEncontrados = apiResponse.data.map(entry => entry.nome.toUpperCase());
            break;
        case 'cff':
            nomesEncontrados = apiResponse.data[0].resultado.map(entry => entry.nome.toUpperCase());
            break;
        default:
            console.error('Conselho não reconhecido:', conselho);
            return false;
    }

    console.log('Nomes recebidos da API:', nomesEncontrados);
    console.log(`Nome inserido para comparação: "${nomeInput}"`);

    const threshold = 8; // Definimos um limite para a distância de Levenshtein

    return nomesEncontrados.some(nome => {
        const distancia = levenshtein(nomeInput, nome);
        console.log(`Comparando "${nomeInput}" com "${nome}": Distância = ${distancia}`);
        return distancia <= threshold;
    });
}

// Funções de interface e manipulação de estado
function toggleLoadingConselho(isLoading) {
    const searchIcon = document.getElementById('search-icon-conselho');
    const loadingSpinner = document.getElementById('loading-spinner-conselho');

    if (isLoading) {
        searchIcon.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
        console.log('Ícone de carregamento exibido.');
    } else {
        searchIcon.style.display = 'inline';
        loadingSpinner.style.display = 'none';
        console.log('Ícone de carregamento ocultado.');
    }
}

function disableInputsConselho() {
    console.log('Desabilitando inputs...');
    document.getElementById('register-uf').disabled = true;
    document.getElementById('register-numero-conselho').disabled = true;
    document.getElementById('verify-conselho-button').disabled = true;

    document.getElementById('register-uf').classList.add('disabled-input');
    document.getElementById('register-numero-conselho').classList.add('disabled-input');
    document.getElementById('verify-conselho-button').classList.add('disabled-button');
    console.log('Inputs desabilitados com sucesso.');
}

function showError(message) {
    const errorMessageElement = document.getElementById('conselho-result');
    errorMessageElement.textContent = message;
    errorMessageElement.style.color = 'red';
    errorMessageElement.style.display = 'block';
    console.error('Erro exibido:', message);
}

function showSuccess(message) {
    const successMessageElement = document.getElementById('conselho-result');
    successMessageElement.textContent = message;
    successMessageElement.style.color = 'green';
    successMessageElement.style.display = 'block';
    console.log('Mensagem de sucesso exibida:', message);
}

function handleConselhoError(status, message) {
    switch (status) {
        case 400:
            showError(message || 'Dados de conselho inválidos.');
            break;
        case 404:
            showError(message || 'Conselho não encontrado.');
            break;
        case 500:
            showError('Erro interno no servidor.');
            break;
        default:
            showError('Erro desconhecido.');
            console.warn('Erro desconhecido:', status, message);
    }
}
