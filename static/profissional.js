function checkUserPayment(email) {
    showLoading('orcamento-container', 'logout-loading');
    db.collection('profissionais').where('email', '==', email).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.pagamento === true) {
                        document.querySelector('.button-payment').style.display = 'none';
                        showOrcamentoAccessButton();
                    }
                });
            } else {
                console.log('Documento não encontrado!');
            }
        })
        .catch((error) => {
            console.log('Erro ao obter documento:', error);
        })
        .finally(() => {
            hideLoading('orcamento-container', 'logout-loading');
        });
}

function showOrcamentoAccessButton() {
    const container = document.getElementById('orcamento-access-container');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button-orcamento-access';
    button.onclick = function () {
        window.open('https://wa.me/5534984280607', '_blank');
    };

    const icon = document.createElement('i');
    icon.className = 'fab fa-whatsapp';  // Ícone de WhatsApp

    const text = document.createTextNode(' Converse com seu assistente');

    button.appendChild(icon);
    button.appendChild(text);

    container.appendChild(button);
}

function updatePaymentStatus(email) {
    firebase.auth().onAuthStateChanged(function(user) {{
        email = user.email;
        console.log(`Atualizando status de pagamento para o email: ${email}`);
        db.collection('profissionais').where('email', '==', email).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userRef = db.collection('profissionais').doc(doc.id);
                    userRef.update({ pagamento: true })
                        .then(() => {
                            console.log('Status de pagamento atualizado com sucesso');
                        })
                        .catch((error) => {
                            console.error('Erro ao atualizar status de pagamento:', error);
                        });
                });
            } else {
                console.log('Documento não encontrado!');
            }
        })
        .catch((error) => {
            console.error('Erro ao obter documento:', error);
        });
    }});
}

let numeroOriginal = '';
async function toggleEditContainer() {
    const editContainer = document.getElementById('edit-container');
    const numeroInput = document.getElementById('numero-conversa');

    if (editContainer.style.display === 'none' || !editContainer.style.display) {
        try {
            const user = firebase.auth().currentUser;
            const querySnapshot = await db.collection('profissionais')
                .where('email', '==', user.email)
                .get();

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                let telefone = doc.data().telefone || '';

                // Remove o prefixo 55 e adiciona o '9' se necessário
                telefone = telefone.replace(/^55(\d{2})(\d{8})$/, '$19$2');
                numeroInput.value = telefone;
                numeroOriginal = numeroInput.value;
            } else {
                numeroInput.value = '';  // Se não houver número, deixa vazio
                numeroOriginal = '';
            }
        } catch (error) {
            console.error('Erro ao buscar o número:', error);
            alert('Erro ao buscar o número. Tente novamente.');
        }

        editContainer.style.display = 'flex';
        numeroInput.focus();
    } else {
        editContainer.style.display = 'none';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        atualizarNumeroConversa();
    }
}

async function verificarNumeroDuplicado(numero) {
    const snapshot = await db.collection('profissionais')
        .where('telefone', '==', numero)
        .get();
    return !snapshot.empty;  // Retorna true se o número já existe
}

async function atualizarNumeroConversa() {
    const numeroInput = document.getElementById('numero-conversa').value.trim();
    const user = firebase.auth().currentUser;

    if (!/^\d{11}$/.test(numeroInput)) {
        alert('O número deve conter exatamente 11 números.');
        return;
    }

    if (numeroInput === numeroOriginal) {
        alert('Nenhuma alteração identificada.');
        return;
    }

    // Formatar para salvar sem o '9' e com '55' na frente
    const formattedPhone = '55' + numeroInput.replace(/^(\d{2})9?/, '$1');

    try {
        const duplicado = await verificarNumeroDuplicado(formattedPhone);
        if (duplicado) {
            alert('Esse número já está cadastrado por outro usuário.');
            return;
        }

        const querySnapshot = await db.collection('profissionais')
            .where('email', '==', user.email)
            .get();

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            await doc.ref.update({
                telefone: formattedPhone
            });

            alert('Número atualizado com sucesso!');
            toggleEditContainer();  // Fecha o campo de edição
        } else {
            alert('Usuário não encontrado.');
        }
    } catch (error) {
        console.error('Erro ao atualizar o número:', error);
        alert('Erro ao atualizar o número. Tente novamente.');
    }
}

async function buscarDadosUsuario(email) {
    try {
        const querySnapshot = await db.collection('profissionais')
            .where('email', '==', email)
            .get();

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return userData;  // Retorna o objeto com os dados do usuário
        } else {
            console.log('Usuário não encontrado no Firestore.');
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        return null;
    }
}

function formatarNomeCompleto(nomeCompleto) {
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length === 1) {
        return partes[0];
    }
    const primeiroNome = partes[0];
    const ultimoSobrenome = partes[partes.length - 1];
    const nomeFormatado = `${primeiroNome} ${ultimoSobrenome}`.toLowerCase()
                                                              .split(' ')
                                                              .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
                                                              .join(' ');
    return nomeFormatado;
}