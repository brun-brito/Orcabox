// firestore.js
import { db } from './firebaseConfig.js';

export async function verificaCpf(cpf) {
    try {
        const querySnapshot = await db.collection('usuarios').where('cpf', '==', cpf).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar CPF: ", error);
        return false;
    }
}

export async function verificaTelefone(telefone) {
    try {
        const querySnapshot = await db.collection('usuarios').where('telefone', '==', telefone).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar Telefone: ", error);
        return false;
    }
}

export function checkUserPayment(email) {
    db.collection('usuarios').where('email', '==', email).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.pagamento === true) {
                        document.querySelector('.button-payment').style.display = 'none';
                        showSpeakerAccessButton();
                    }
                });
            } else {
                console.log('Documento não encontrado!');
            }
        })
        .catch((error) => {
            console.log('Erro ao obter documento:', error);
        });
}

export function updatePaymentStatus(email) {
    firebase.auth().onAuthStateChanged(function(user) {{
        email = user.email;
        console.log(`Atualizando status de pagamento para o email: ${email}`);
        db.collection('usuarios').where('email', '==', email).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userRef = db.collection('usuarios').doc(doc.id);
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
