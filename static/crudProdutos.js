function editProduto(produtoId, button) {
    const row = button.closest('tr');
    const cells = row.querySelectorAll('td');

    // Pega os valores originais antes da edição
    const originalValues = {
        preco: !isNaN(parseFloat(cells[1].textContent)) ? parseFloat(cells[1].textContent) : 0,
        quantidade: !isNaN(parseInt(cells[2].textContent)) ? parseInt(cells[2].textContent) : 0
    };

    // Substitui apenas os campos de preço e quantidade por áreas de edição
    cells[1].innerHTML = `<textarea id="edit-preco" required>${originalValues.preco.toFixed(2)}</textarea>`;
    cells[2].innerHTML = `<textarea id="edit-quantidade" required>${originalValues.quantidade}</textarea>`;
    
    const editPrecoField = document.getElementById('edit-preco');
    editPrecoField.addEventListener('input', function () {
        this.value = this.value.replace(',', '.');
    });

    const actionCell = cells[5];
    actionCell.innerHTML = `
        <button class="save-btn">Salvar</button>
        <button class="cancel-btn">Cancelar</button>
    `;

    // Lógica para cancelar a edição e restaurar os valores originais
    const cancelButton = row.querySelector('.cancel-btn');
    cancelButton.addEventListener('click', function () {
        console.log('Edição cancelada.');

        // Restaura os valores originais na linha
        cells[1].textContent = originalValues.preco.toFixed(2);
        cells[2].textContent = originalValues.quantidade;

        // Volta os botões "Editar" e "Apagar"
        actionCell.innerHTML = `
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Apagar</button>
        `;

        // Reatribui os eventos aos botões
        const editButton = row.querySelector('.edit-btn');
        editButton.addEventListener('click', function () {
            editProduto(produtoId, editButton);
        });

        const deleteButton = row.querySelector('.delete-btn');
        deleteButton.addEventListener('click', function () {
            deleteProduto(produtoId, deleteButton);
        });
    });

    // Lógica para salvar as alterações
    const saveButton = row.querySelector('.save-btn');
    saveButton.addEventListener('click', function handleSaveClick() {
        const updatedProduto = {
            preco: parseFloat(document.getElementById('edit-preco').value),
            quantidade: parseInt(document.getElementById('edit-quantidade').value)
        };

        // Validação dos campos
        if (updatedProduto.preco < 0 || isNaN(updatedProduto.preco) || 
            updatedProduto.quantidade < 0 || isNaN(updatedProduto.quantidade)) {
            alert("Preço e quantidade não podem ser negativos ou nulos.");
            return;
        }

        // Verifica se algo foi alterado
        const changesMade = 
            updatedProduto.preco !== originalValues.preco || 
            updatedProduto.quantidade !== originalValues.quantidade;

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
                        // Atualiza a linha da tabela com os novos valores
                        cells[1].textContent = updatedProduto.preco.toFixed(2);
                        cells[2].textContent = updatedProduto.quantidade;

                        // Volta os botões "Editar" e "Apagar"
                        actionCell.innerHTML = `
                            <button class="edit-btn">Editar</button>
                            <button class="delete-btn">Apagar</button>
                        `;

                        // Reatribui os eventos aos botões
                        const editButton = row.querySelector('.edit-btn');
                        editButton.addEventListener('click', function () {
                            editProduto(produtoId, editButton);
                        });

                        const deleteButton = row.querySelector('.delete-btn');
                        deleteButton.addEventListener('click', function () {
                            deleteProduto(produtoId, deleteButton);
                        });
                    }).catch((error) => {
                        console.error('Erro ao atualizar produto:', error);
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

function mostrarLoading() {
    const uploadBtn = document.getElementById('upload-btn');
    const uploadText = document.getElementById('upload-text');
    const uploadSpinner = document.getElementById('upload-spinner');

    // Mostra o spinner e desabilita o botão durante o envio
    uploadSpinner.style.display = 'inline-block';
    uploadText.textContent = 'Enviando...';
    uploadBtn.disabled = true;
}

// Função pra adicionar manual os produtos
document.addEventListener('DOMContentLoaded', function () {
    const addProductButton = document.getElementById('add-product-btn');
    const produtosBody = document.getElementById('produtos-body');
    const produtosTable = document.getElementById('produtos-table');

    if (addProductButton) {
        addProductButton.addEventListener('click', function () {
            produtosTable.style.display = 'table';
            const newRow = document.createElement('tr');

            newRow.innerHTML = `
                <td><textarea id="new-nome" placeholder="Nome do Produto" required></textarea></td>
                <td><textarea id="new-preco" placeholder="Preço" required></textarea></td>
                <td><textarea id="new-quantidade" placeholder="Quantidade" required></textarea></td>
                <td><textarea id="new-marca" placeholder="Marca" required></textarea></td>
                <td><textarea id="new-categoria" placeholder="Categoria" required></textarea></td>
                <td>
                    <button class="save-product-btn">Salvar</button>
                    <button class="cancel-product-btn">Cancelar</button>
                </td>
            `;

            produtosBody.insertBefore(newRow, produtosBody.firstChild);
            // Botão "Cancelar" remove a linha sem salvar
            newRow.querySelector('.cancel-product-btn').addEventListener('click', function () {
                console.log('Cancelando adição de produto.');
                newRow.remove();

                if (produtosBody.children.length === 0) {
                    produtosTable.style.display = 'none';
                }
            });

            // Botão "Salvar" para adicionar o produto ao Firestore
            newRow.querySelector('.save-product-btn').addEventListener('click', function () {
                console.log('Salvando novo produto.');

                const nome = document.getElementById('new-nome').value.trim();
                const preco = parseFloat(document.getElementById('new-preco').value);
                const quantidade = parseInt(document.getElementById('new-quantidade').value);
                const marca = document.getElementById('new-marca').value.trim();
                const categoria = document.getElementById('new-categoria').value.trim();

                // Validação dos campos
                if (!nome || preco < 0 || isNaN(preco) || quantidade < 0 || isNaN(quantidade) || !marca || !categoria) {
                    alert("Todos os campos devem ser preenchidos corretamente. Preço e quantidade não podem ser negativos ou nulos.");
                    return;
                }

                const produto = {
                    nome: nome,
                    preco: preco,
                    quantidade: quantidade,
                    marca: marca,
                    categoria: categoria,
                    nome_lowercase: nome.toLowerCase().replace(/\s+/g, '')
                };

                const db = firebase.firestore();
                const userEmail = firebase.auth().currentUser.email;

                // Consulta para encontrar o distribuidor pelo email
                db.collection('distribuidores').where('email', '==', userEmail).limit(1).get()
                    .then(querySnapshot => {
                        if (!querySnapshot.empty) {
                            const distribuidorDoc = querySnapshot.docs[0];
                            const userRef = distribuidorDoc.ref.collection('produtos');

                            return userRef.add(produto);
                        } else {
                            throw new Error("Distribuidor não encontrado.");
                        }
                    })
                    .then((docRef) => {
                        console.log(`Produto ${produto.nome} adicionado com sucesso com ID: ${docRef.id}`);
                        alert(`Produto "${produto.nome}" adicionado com sucesso!`);

                        // Atualiza a linha para exibir os dados salvos
                        newRow.innerHTML = `
                            <td>${produto.nome}</td>
                            <td>${produto.preco.toFixed(2)}</td>
                            <td>${produto.quantidade}</td>
                            <td>${produto.marca}</td>
                            <td>${produto.categoria}</td>
                            <td>
                                <button class="edit-btn" data-id="${docRef.id}">Editar</button>
                                <button class="delete-btn" data-id="${docRef.id}">Apagar</button>
                            </td>
                        `;

                        // Adiciona eventos de edição e exclusão
                        newRow.querySelector('.edit-btn').addEventListener('click', function () {
                            editProduto(docRef.id, this);
                        });

                        newRow.querySelector('.delete-btn').addEventListener('click', function () {
                            deleteProduto(docRef.id, this);
                        });
                    })
                    .catch((error) => {
                        console.error("Erro ao adicionar produto:", error);
                        alert("Erro ao adicionar produto. Tente novamente.");
                    });
            });
        });
    } else {
        console.error('Botão "Adicionar Produto" não encontrado.');
    }
});
