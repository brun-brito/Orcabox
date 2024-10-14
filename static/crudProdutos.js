function editProduto(produtoId, button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');

    // Pega os valores originais antes da edição
    const originalValues = {
        nome: cells[0].textContent.trim(),
        preco: !isNaN(parseFloat(cells[1].textContent)) ? parseFloat(cells[1].textContent) : 0,
        quantidade: !isNaN(parseInt(cells[2].textContent)) ? parseInt(cells[2].textContent) : 0,
        marca: cells[3].textContent.trim(),
        categoria: cells[4].textContent.trim()
    };

    // Substitui o texto por campos de entrada para editar os dados
    cells[0].innerHTML = `<textarea id="edit-nome" required>${originalValues.nome}</textarea>`;
    cells[1].innerHTML = `<textarea id="edit-preco" required>${originalValues.preco.toFixed(2)}</textarea>`;
    cells[2].innerHTML = `<textarea id="edit-quantidade" required>${originalValues.quantidade}</textarea>`;
    cells[3].innerHTML = `<textarea id="edit-marca" required>${originalValues.marca}</textarea>`;
    cells[4].innerHTML = `<textarea id="edit-categoria" required>${originalValues.categoria}</textarea>`;

    // Troca o botão "Editar" por "Salvar"
    button.textContent = "Salvar";
    button.classList.remove('edit-btn');
    button.classList.add('save-btn');

    // Limpar todos os eventos antigos de clique antes de adicionar um novo
    button.replaceWith(button.cloneNode(true));

    // Reatribuindo o evento corretamente ao botão
    const saveButton = row.querySelector('.save-btn');
    saveButton.addEventListener('click', function handleSaveClick() {
        const updatedProduto = {
            nome: document.getElementById('edit-nome').value.trim(),
            preco: parseFloat(document.getElementById('edit-preco').value),
            quantidade: parseInt(document.getElementById('edit-quantidade').value),
            marca: document.getElementById('edit-marca').value.trim(),
            categoria: document.getElementById('edit-categoria').value.trim(),
            nome_lowercase: document.getElementById('edit-nome').value.trim().toLowerCase().replace(/\s+/g, '')
        };

        // Validação dos campos
        if (
            !updatedProduto.nome || 
            updatedProduto.preco < 0 || 
            isNaN(updatedProduto.preco) || 
            updatedProduto.quantidade < 0 || 
            isNaN(updatedProduto.quantidade) || 
            !updatedProduto.marca || 
            !updatedProduto.categoria
        ) {
            alert("Todos os campos devem ser preenchidos corretamente. Preço e quantidade não podem ser negativos ou nulos.");
            return;
        }

        // Validação para garantir que algo foi alterado
        const changesMade = Object.keys(updatedProduto).some(key => updatedProduto[key] !== originalValues[key]);

        if (changesMade) {
            const db = firebase.firestore();
            const userEmail = firebase.auth().currentUser.email;
        
            const distribuidoresRef = db.collection('distribuidores');
            distribuidoresRef.where('email', '==', userEmail).limit(1).get().then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const distribuidorDoc = querySnapshot.docs[0];
                    const produtoRef = distribuidorDoc.ref.collection('produtos').doc(produtoId);
        
                    // Atualiza o produto no Firestore
                    produtoRef.update(updatedProduto).then(() => {
                        // Atualiza a tabela com os novos valores
                        cells[0].textContent = updatedProduto.nome;
                        cells[1].textContent = updatedProduto.preco.toFixed(2);
                        cells[2].textContent = updatedProduto.quantidade;
                        cells[3].textContent = updatedProduto.marca;
                        cells[4].textContent = updatedProduto.categoria;
        
                        // Volta o botão para "Editar"
                        saveButton.textContent = "Editar";
                        saveButton.classList.remove('save-btn');
                        saveButton.classList.add('edit-btn');
        
                        // Remove o evento de "Salvar" e volta para "Editar"
                        saveButton.removeEventListener('click', handleSaveClick);
                        saveButton.addEventListener('click', function() {
                            editProduto(produtoId, saveButton);
                        });
        
                    }).catch((error) => {
                        console.log('Erro ao atualizar produto:', error);
                    });
                } else {
                    console.log('Nenhum distribuidor encontrado com o e-mail fornecido.');
                }
            }).catch((error) => {
                console.error('Erro ao buscar distribuidor:', error);
            });
        } else {
            alert("Nenhuma alteração foi realizada.");
        }
    });
}

function deleteProduto(produtoId, button) {
    const db = firebase.firestore();
    const userEmail = firebase.auth().currentUser.email;

    // Consulta para encontrar o distribuidor com o campo email igual ao userEmail
    const distribuidoresRef = db.collection('distribuidores');
    distribuidoresRef.where('email', '==', userEmail).limit(1).get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
            // Pega o primeiro documento do distribuidor encontrado
            const distribuidorDoc = querySnapshot.docs[0];
            const produtoRef = distribuidorDoc.ref.collection('produtos').doc(produtoId);

            if (confirm("Tem certeza que deseja apagar este produto?")) {
                // Remove o produto do Firestore
                produtoRef.delete().then(() => {
                    // Remove a linha correspondente na tabela
                    const row = button.closest('tr');
                    row.remove();
                    console.log('Produto removido com sucesso.');
                }).catch((error) => {
                    console.log('Erro ao remover o produto:', error);
                });
            }
        } else {
            console.log('Nenhum distribuidor encontrado com o e-mail fornecido.');
        }
    }).catch((error) => {
        console.error('Erro ao buscar distribuidor:', error);
    });
}


