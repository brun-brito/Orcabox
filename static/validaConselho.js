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

// Evento de mudança no campo de especialidade para exibir ou ocultar o botão de verificação
document.getElementById('register-especialidade').addEventListener('change', function () {
    const conselho = this.value;
    const verifyButton = document.getElementById('verify-conselho-button');

    const validacaoNecessaria = ['cfbm', 'cff', 'cfm', 'cro'].includes(conselho);
    verifyButton.style.display = validacaoNecessaria ? 'inline' : 'none';
});

// Evento de clique para verificar conselho
document.getElementById('verify-conselho-button').addEventListener('click', async function () {
    const conselho = document.getElementById('register-especialidade').value;
    const uf = document.getElementById('register-uf').value.toLowerCase();
    const numeroConselho = document.getElementById('register-numero-conselho').value;
    const nomeInput = document.getElementById('register-nome').value.trim().toUpperCase();

    if (!conselho || !uf || !numeroConselho) {
        showError('Por favor, preencha todos os campos de conselho.');
        return;
    }

    try {
        toggleLoadingConselho(true);

        // Chama o back-end para verificar o conselho
        const response = await fetch(`http://localhost:3000/v1/consultar-conselho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conselho, uf, inscricao: numeroConselho }),
        });

        const result = await response.json();

        if (response.status === 200) {
            const isNomeValido = validarNomeComApi(result, nomeInput);
            if (isNomeValido) {
                showSuccess('Conselho validado com sucesso!');
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

function validarNomeComApi(apiResponse, nomeInput) {
    // Verifica se a resposta é válida e contém dados
    if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0) {
        console.warn('Nenhum dado válido encontrado na resposta da API.');
        return false;
    }

    // Extraindo e exibindo os nomes retornados pela API para garantir que a resposta está correta
    const nomesEncontrados = apiResponse.map(entry => entry.nome.toUpperCase());

    console.log('Nomes recebidos da API:', nomesEncontrados);
    console.log(`Nome inserido para comparação: "${nomeInput}"`);

    // Distância máxima para considerar os nomes semelhantes
    const threshold = 8;

    // Verifica se algum dos nomes é semelhante ao nome fornecido pelo usuário
    return nomesEncontrados.some(nome => {
        const distancia = levenshtein(nomeInput, nome);
        return distancia <= threshold;
    });
}


// Função para exibir mensagem de sucesso
function showSuccess(message) {
    const successMessageElement = document.getElementById('conselho-result');
    successMessageElement.textContent = message;
    successMessageElement.style.color = 'green';
    successMessageElement.style.display = 'block';
}

// Função para exibir mensagem de erro
function showError(message) {
    const errorMessageElement = document.getElementById('conselho-result');
    errorMessageElement.textContent = message;
    errorMessageElement.style.color = 'red';
    errorMessageElement.style.display = 'block';
}

// Alterna ícone de carregamento para evitar cliques duplicados
function toggleLoadingConselho(isLoading) {
    const searchIcon = document.getElementById('search-icon-conselho');
    const loadingSpinner = document.getElementById('loading-spinner-conselho');

    if (isLoading) {
        searchIcon.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
    } else {
        searchIcon.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}

// Desativa os campos após uma validação bem-sucedida
function disableInputsConselho() {
    document.getElementById('register-uf').disabled = true;
    document.getElementById('register-numero-conselho').disabled = true;
    document.getElementById('verify-conselho-button').disabled = true;

    document.getElementById('register-uf').classList.add('disabled-input');
    document.getElementById('register-numero-conselho').classList.add('disabled-input');
    document.getElementById('verify-conselho-button').classList.add('disabled-button');
}

// Tratamento de erros específicos da consulta de conselho
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
    }
}
