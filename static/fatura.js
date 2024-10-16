const valorPorClique = 5.00;  // Valor em reais por clique

// Função para atualizar a fatura
function atualizarFatura(numeroCliques) {
    document.getElementById('numero-cliques').innerText = numeroCliques;
    document.getElementById('valor-fatura').innerText = `R$${(numeroCliques * valorPorClique).toFixed(2)}`;
}

// Função que busca o número de cliques do distribuidor
function buscarCliquesDistribuidor(distribuidorRef) {
    distribuidorRef.get().then(doc => {
        if (doc.exists) {
            const distribuidorData = doc.data();
            const numeroCliques = distribuidorData.cliques || 0;  // Pega o valor de 'cliques' ou 0 se não existir
            atualizarFatura(numeroCliques);  // Atualiza a fatura com os cliques buscados
        } else {
            console.log("Documento do distribuidor não encontrado.");
        }
    }).catch((error) => {
        console.error("Erro ao buscar cliques do distribuidor:", error);
    });
}