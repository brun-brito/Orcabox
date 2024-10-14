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
    button.textContent = 'Clique para conversar com seu assistente';
    button.className = 'button-orcamento-access';
    button.onclick = function() {
        window.open('https://wa.me/5534984280607', '_blank');
    };
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